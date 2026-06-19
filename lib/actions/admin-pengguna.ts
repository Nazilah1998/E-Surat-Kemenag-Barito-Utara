"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { z } from "zod";
import { db, serializeBigInt } from "@/lib/db";
import { pengguna, users, auditLogs } from "@/lib/db/schema";
import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { createAdminClient } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/audit";

export type ActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
  total?: number;
};

const MAX_PAGE_SIZE = 10000;

async function ensureSuperAdminRecord() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superAdminEmail) return;

  const [adminUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, superAdminEmail))
    .limit(1);

  if (!adminUser) return;

  const [existing] = await db
    .select({ id: pengguna.id })
    .from(pengguna)
    .where(eq(pengguna.id, adminUser.id))
    .limit(1);

  if (!existing) {
    await db.insert(pengguna).values({
      id: adminUser.id,
      nama: "Super Admin",
      isActive: true,
    });
  }
}

export async function getPenggunaAction(
  page = 1,
  pageSize = 50,
): Promise<ActionResult> {
  await requireSuperAdmin();
  try {
    await ensureSuperAdminRecord();

    const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    const offset = (Math.max(1, page) - 1) * safePageSize;

    const rows = await db
      .select({
        id: pengguna.id,
        email: users.email,
        nama: pengguna.nama,
        isActive: pengguna.isActive,
        lastLoginAt: pengguna.lastLoginAt,
        createdAt: pengguna.createdAt,
        totalCount: sql<number>`count(*) over()`,
      })
      .from(pengguna)
      .leftJoin(users, eq(pengguna.id, users.id))
      .where(isNotNull(users.email))
      .orderBy(desc(pengguna.createdAt))
      .limit(safePageSize)
      .offset(offset);

    const total = rows.length > 0 ? Number(rows[0].totalCount) : 0;

    const data = rows.map((r) => ({
      id: r.id,
      email: r.email || "",
      nama: r.nama,
      isActive: r.isActive,
      lastLoginAt: r.lastLoginAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
    }));

    return { success: true, data: serializeBigInt(data), total };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengambil data pengguna",
    };
  }
}

const CreatePenggunaSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  nama: z.string().min(1, "Nama wajib diisi"),
});

export async function createPenggunaAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSuperAdmin();
  try {
    const validated = CreatePenggunaSchema.safeParse({
      email: formData.get("email")?.toString() || "",
      password: formData.get("password")?.toString() || "",
      nama: formData.get("nama")?.toString() || "",
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { email, password, nama } = validated.data;

    if (email === process.env.SUPER_ADMIN_EMAIL) {
      return {
        success: false,
        error: "Tidak dapat membuat akun dengan email Super Admin",
      };
    }

    const supabase = await createAdminClient();
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: "Gagal membuat user auth" };
    }

    await db.insert(pengguna).values({
      id: authData.user.id,
      nama,
      isActive: true,
    });

    await createAuditLog({
      adminId: user.id,
      action: "BUAT_PENGGUNA",
      entityType: "pengguna",
      entityId: authData.user.id,
      details: { email, nama },
    });

    revalidatePath("/", "layout");

    return { success: true, message: "Pengguna berhasil dibuat" };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal membuat pengguna",
    };
  }
}

const UpdatePenggunaSchema = z.object({
  id: z.string().min(1, "ID tidak valid"),
  nama: z.string().min(1, "Nama wajib diisi"),
  isActive: z.string().transform((val) => val === "true"),
});

export async function updatePenggunaAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSuperAdmin();
  try {
    const validated = UpdatePenggunaSchema.safeParse({
      id: formData.get("id")?.toString() || "",
      nama: formData.get("nama")?.toString() || "",
      isActive: formData.get("isActive")?.toString() || "true",
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, nama, isActive } = validated.data;

    const [existing] = await db
      .select({ id: pengguna.id, email: users.email })
      .from(pengguna)
      .leftJoin(users, eq(pengguna.id, users.id))
      .where(eq(pengguna.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Pengguna tidak ditemukan" };
    }

    if (
      existing.email === process.env.SUPER_ADMIN_EMAIL &&
      !isActive
    ) {
      return {
        success: false,
        error: "Tidak dapat menonaktifkan akun Super Admin",
      };
    }

    await db
      .update(pengguna)
      .set({
        nama,
        isActive,
        updatedAt: sql`now()`,
      })
      .where(eq(pengguna.id, id));

    await createAuditLog({
      adminId: user.id,
      action: "UBAH_PENGGUNA",
      entityType: "pengguna",
      entityId: id,
      details: { nama, isActive },
    });

    revalidatePath("/", "layout");

    return { success: true, message: "Pengguna berhasil diubah" };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mengubah pengguna",
    };
  }
}

const ResetPasswordSchema = z.object({
  id: z.string().min(1, "ID tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export async function resetPasswordPenggunaAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSuperAdmin();
  try {
    const validated = ResetPasswordSchema.safeParse({
      id: formData.get("id")?.toString() || "",
      password: formData.get("password")?.toString() || "",
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, password } = validated.data;

    const [existing] = await db
      .select({ id: pengguna.id, email: users.email })
      .from(pengguna)
      .leftJoin(users, eq(pengguna.id, users.id))
      .where(eq(pengguna.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Pengguna tidak ditemukan" };
    }

    if (existing.email === process.env.SUPER_ADMIN_EMAIL) {
      return {
        success: false,
        error: "Gunakan menu Ubah Password di profil untuk mengganti password sendiri",
      };
    }

    const supabase = await createAdminClient();
    const { error: authError } = await supabase.auth.admin.updateUserById(
      id,
      { password },
    );

    if (authError) {
      return { success: false, error: authError.message };
    }

    await createAuditLog({
      adminId: user.id,
      action: "RESET_PASSWORD_PENGGUNA",
      entityType: "pengguna",
      entityId: id,
    });

    revalidatePath("/", "layout");

    return { success: true, message: "Password berhasil direset" };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mereset password",
    };
  }
}

export async function toggleActivePenggunaAction(
  id: string,
): Promise<ActionResult> {
  const user = await requireSuperAdmin();
  try {
    if (!id) return { success: false, error: "ID tidak valid" };

    const [existing] = await db
      .select({
        id: pengguna.id,
        isActive: pengguna.isActive,
        email: users.email,
      })
      .from(pengguna)
      .leftJoin(users, eq(pengguna.id, users.id))
      .where(eq(pengguna.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Pengguna tidak ditemukan" };
    }

    if (existing.email === process.env.SUPER_ADMIN_EMAIL) {
      return {
        success: false,
        error: "Tidak dapat menonaktifkan akun Super Admin",
      };
    }

    const newActive = !existing.isActive;

    await db
      .update(pengguna)
      .set({ isActive: newActive, updatedAt: sql`now()` })
      .where(eq(pengguna.id, id));

    await createAuditLog({
      adminId: user.id,
      action: newActive ? "AKTIFKAN_PENGGUNA" : "NONAKTIFKAN_PENGGUNA",
      entityType: "pengguna",
      entityId: id,
    });

    revalidatePath("/", "layout");

    return {
      success: true,
      message: newActive
        ? "Pengguna berhasil diaktifkan"
        : "Pengguna berhasil dinonaktifkan",
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mengubah status pengguna",
    };
  }
}

export async function getRiwayatPenggunaAction(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<ActionResult> {
  await requireSuperAdmin();
  try {
    const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    const offset = (Math.max(1, page) - 1) * safePageSize;

    const rows = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        totalCount: sql<number>`count(*) over()`,
      })
      .from(auditLogs)
      .where(eq(auditLogs.adminId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(safePageSize)
      .offset(offset);

    const total = rows.length > 0 ? Number(rows[0].totalCount) : 0;

    const data = rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      details: r.details,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt.toISOString(),
    }));

    return { success: true, data: serializeBigInt(data), total };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengambil riwayat aktivitas",
    };
  }
}
