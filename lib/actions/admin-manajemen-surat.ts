"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { masterOptions } from "@/lib/db/schema";
import { desc, eq, and, asc, sql } from "drizzle-orm";
import { after } from "next/server";
import { createAuditLog } from "@/lib/audit";

export type ActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
  total?: number;
};

const COLOR_PALETTE = [
  "emerald", "red", "violet", "cyan", "orange", "pink", "lime",
  "zinc", "purple", "amber", "sky", "indigo", "rose", "teal", "slate",
];

const SEED_DATA: Record<string, { label: string; warna: string }[]> = {
  agenda: [
    { label: "Surat Dinas", warna: "emerald" },
    { label: "Surat Keputusan", warna: "red" },
    { label: "Surat Tugas", warna: "violet" },
    { label: "Surat Undangan", warna: "cyan" },
    { label: "Surat Pengantar", warna: "slate" },
    { label: "Surat Keterangan", warna: "orange" },
    { label: "Surat Pernyataan", warna: "pink" },
    { label: "Surat Cuti", warna: "lime" },
    { label: "Berita Acara", warna: "zinc" },
    { label: "Nota Dinas", warna: "emerald" },
  ],
  unit_kerja: [
    { label: "Sekjend", warna: "emerald" },
    { label: "Bimas Islam", warna: "emerald" },
    { label: "Bimas Kristen", warna: "purple" },
    { label: "Pendidikan Madrasah", warna: "amber" },
    { label: "Pendidikan Agama Islam", warna: "sky" },
    { label: "Pendidikan Diniyah & Pontren", warna: "indigo" },
    { label: "Penyelenggara Hindu", warna: "rose" },
    { label: "Penyelenggara Zakat & Wakaf", warna: "teal" },
  ],
};

async function seedIfEmpty() {
  for (const [kategori, items] of Object.entries(SEED_DATA)) {
    const existing = await db
      .select({ id: masterOptions.id })
      .from(masterOptions)
      .where(eq(masterOptions.kategori, kategori))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(masterOptions).values(
        items.map((item, idx) => ({
          kategori,
          label: item.label,
          warna: item.warna,
          sortOrder: idx + 1,
          isActive: true,
        })),
      );
    }
  }
}

export async function getMasterOptionsAction(kategori: string): Promise<ActionResult> {
  try {
    await seedIfEmpty();

    const rows = await db
      .select({
        id: masterOptions.id,
        kategori: masterOptions.kategori,
        label: masterOptions.label,
        warna: masterOptions.warna,
        sortOrder: masterOptions.sortOrder,
        isActive: masterOptions.isActive,
      })
      .from(masterOptions)
      .where(
        and(eq(masterOptions.kategori, kategori), eq(masterOptions.isActive, true)),
      )
      .orderBy(asc(masterOptions.sortOrder));

    return { success: true, data: rows };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengambil data master",
    };
  }
}

export async function getAllMasterOptionsAction(): Promise<ActionResult> {
  try {
    await seedIfEmpty();

    const rows = await db
      .select({
        id: masterOptions.id,
        kategori: masterOptions.kategori,
        label: masterOptions.label,
        warna: masterOptions.warna,
        sortOrder: masterOptions.sortOrder,
        isActive: masterOptions.isActive,
      })
      .from(masterOptions)
      .where(eq(masterOptions.isActive, true))
      .orderBy(asc(masterOptions.sortOrder));

    return { success: true, data: rows };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengambil data master",
    };
  }
}

const CreateMasterOptionSchema = z.object({
  kategori: z.enum(["agenda", "unit_kerja"]),
  label: z.string().min(1, "Label wajib diisi"),
  warna: z.string().optional(),
});

export async function createMasterOptionAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSuperAdmin();
  try {
    const validated = CreateMasterOptionSchema.safeParse({
      kategori: formData.get("kategori")?.toString() || "",
      label: formData.get("label")?.toString() || "",
      warna: formData.get("warna")?.toString() || undefined,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { kategori, label, warna } = validated.data;

    const existing = await db
      .select({ id: masterOptions.id })
      .from(masterOptions)
      .where(
        and(
          eq(masterOptions.kategori, kategori),
          eq(masterOptions.label, label),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: `"${label}" sudah terdaftar` };
    }

    const countResult = await db
      .select({ total: sql<number>`count(*)` })
      .from(masterOptions)
      .where(eq(masterOptions.kategori, kategori));

    const total = Number(countResult[0]?.total || 0);
    const autoWarna = warna || COLOR_PALETTE[total % COLOR_PALETTE.length];

    await db.insert(masterOptions).values({
      kategori,
      label,
      warna: autoWarna,
      sortOrder: total + 1,
      isActive: true,
    });

    await createAuditLog({
      adminId: user.id,
      action: "BUAT_MASTER_OPTION",
      entityType: `master_${kategori}`,
      entityId: label,
      details: { kategori, label, warna: autoWarna },
    });

    after(() => {
      revalidatePath("/manajemen-surat");
      revalidatePath("/surat-masuk");
      revalidatePath("/surat-keluar");
    });

    return { success: true, message: "Berhasil ditambahkan" };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal menambahkan data",
    };
  }
}

const UpdateMasterOptionSchema = z.object({
  id: z.string().min(1, "ID tidak valid"),
  label: z.string().min(1, "Label wajib diisi"),
  warna: z.string().optional(),
});

export async function updateMasterOptionAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSuperAdmin();
  try {
    const validated = UpdateMasterOptionSchema.safeParse({
      id: formData.get("id")?.toString() || "",
      label: formData.get("label")?.toString() || "",
      warna: formData.get("warna")?.toString() || undefined,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, label, warna } = validated.data;

    const updateData: Record<string, unknown> = { label };
    if (warna) updateData.warna = warna;

    await db
      .update(masterOptions)
      .set(updateData)
      .where(eq(masterOptions.id, id));

    await createAuditLog({
      adminId: user.id,
      action: "UBAH_MASTER_OPTION",
      entityType: "master_option",
      entityId: id,
      details: { label, warna },
    });

    after(() => {
      revalidatePath("/manajemen-surat");
      revalidatePath("/surat-masuk");
      revalidatePath("/surat-keluar");
    });

    return { success: true, message: "Berhasil diubah" };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mengubah data",
    };
  }
}

export async function deleteMasterOptionAction(
  id: string,
): Promise<ActionResult> {
  const user = await requireSuperAdmin();
  try {
    if (!id) return { success: false, error: "ID tidak valid" };

    await db.delete(masterOptions).where(eq(masterOptions.id, id));

    await createAuditLog({
      adminId: user.id,
      action: "HAPUS_MASTER_OPTION",
      entityType: "master_option",
      entityId: id,
    });

    after(() => {
      revalidatePath("/manajemen-surat");
      revalidatePath("/surat-masuk");
      revalidatePath("/surat-keluar");
    });

    return { success: true, message: "Berhasil dihapus" };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal menghapus data",
    };
  }
}

export async function reorderMasterOptionsAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSuperAdmin();
  try {
    const kategori = formData.get("kategori")?.toString();
    const orderStr = formData.get("order")?.toString();

    if (!kategori || !orderStr) {
      return { success: false, error: "Data tidak lengkap" };
    }

    const order: { id: string; sortOrder: number }[] = JSON.parse(orderStr);

    for (const item of order) {
      await db
        .update(masterOptions)
        .set({ sortOrder: item.sortOrder })
        .where(eq(masterOptions.id, item.id));
    }

    await createAuditLog({
      adminId: user.id,
      action: "URUTKAN_MASTER_OPTION",
      entityType: `master_${kategori}`,
      details: { kategori },
    });

    after(() => {
      revalidatePath("/manajemen-surat");
      revalidatePath("/surat-masuk");
      revalidatePath("/surat-keluar");
    });

    return { success: true, message: "Urutan berhasil diubah" };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mengubah urutan",
    };
  }
}
