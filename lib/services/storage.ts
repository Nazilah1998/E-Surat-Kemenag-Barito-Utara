"use server";

import { createAdminClient } from "@/lib/supabase/server";

const SURAT_BUCKET = "surat-lampiran";

export async function getLampiranUrl(
  file: File,
  prefix: "masuk" | "keluar",
  suratId: string,
): Promise<string> {
  const supabase = await createAdminClient();
  let originalName = file.name;
  originalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '-').replace(/-+/g, '-');
  const path = `${prefix}/${suratId}/${originalName}`;

  const { data: urlData } = supabase.storage
    .from(SURAT_BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

export async function uploadLampiran(
  file: File,
  prefix: "masuk" | "keluar",
  suratId: string,
): Promise<string> {
  const supabase = await createAdminClient();
  let originalName = file.name;
  // Sanitize file name to avoid URL issues
  originalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '-').replace(/-+/g, '-');
  const path = `${prefix}/${suratId}/${originalName}`;

  const { error } = await supabase.storage
    .from(SURAT_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
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
