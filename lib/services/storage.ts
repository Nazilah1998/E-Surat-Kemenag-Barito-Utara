"use server";

import { createAdminClient } from "@/lib/supabase/server";

const SURAT_BUCKET = "surat-lampiran";

export async function uploadLampiran(
  file: File,
  prefix: "masuk" | "keluar",
  suratId: string,
): Promise<string> {
  const supabase = await createAdminClient();
  const ext = file.name.split(".").pop() || "pdf";
  const path = `${prefix}/${suratId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(SURAT_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Gagal upload: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(SURAT_BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

export async function deleteLampiran(url: string): Promise<void> {
  const supabase = await createAdminClient();
  const path = url.split("/storage/v1/object/public/surat-lampiran/")[1];
  if (!path) return;

  await supabase.storage.from(SURAT_BUCKET).remove([path]);
}
