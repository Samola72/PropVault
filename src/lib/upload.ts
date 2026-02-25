import { getSupabaseClient } from "@/lib/supabase/client";

export type UploadBucket =
  | "property-images"
  | "work-order-images"
  | "documents"
  | "avatars";

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export async function uploadFile(
  file: File,
  bucket: UploadBucket,
  folder?: string
): Promise<UploadResult> {
  const supabase = getSupabaseClient();

  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return { url: "", path: "", error: error.message };
  }

  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: publicUrl.publicUrl,
    path: data.path,
  };
}

export async function uploadMultipleFiles(
  files: File[],
  bucket: UploadBucket,
  folder?: string
): Promise<UploadResult[]> {
  return Promise.all(files.map((file) => uploadFile(file, bucket, folder)));
}

export async function deleteFile(
  bucket: UploadBucket,
  path: string
): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.storage.from(bucket).remove([path]);
}
