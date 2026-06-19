"use server";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pengguna } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateOwnProfileAction(nama: string) {
  const user = await requireAuth();
  try {
    if (!nama || nama.trim() === "") {
      return { success: false, error: "Nama tidak boleh kosong" };
    }
    
    await db
      .update(pengguna)
      .set({ nama, updatedAt: sql`now()` })
      .where(eq(pengguna.id, user.id));
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengubah profil" };
  }
}
