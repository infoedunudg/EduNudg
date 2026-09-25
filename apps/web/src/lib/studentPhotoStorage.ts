import { getSupabase } from "@/lib/supabase";
import { BRAND_PRIVATE_BUCKET, toBrandPrivateRef } from "@/lib/secureStorageUrl";

const PHOTO_FILE_PREFIX = "photo.";

function imageExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName) && fromName !== "svg") return fromName;
  const byType: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return byType[file.type] ?? "png";
}

/** `{brandId}/students/{studentId}` */
export function studentPhotoFolder(brandId: string, studentId: string): string {
  return `${brandId}/students/${studentId}`;
}

/** `{brandId}/students/{studentId}/photo.{ext}` */
export function studentPhotoObjectPath(brandId: string, studentId: string, ext: string): string {
  return `${studentPhotoFolder(brandId, studentId)}/${PHOTO_FILE_PREFIX}${ext}`;
}

/** Private storage ref for tests / callers that need a deterministic string. */
export function studentPhotoPublicUrl(brandId: string, studentId: string, ext: string): string {
  return toBrandPrivateRef(studentPhotoObjectPath(brandId, studentId, ext));
}

/** Removes any existing `photo.*` objects for this student (private + legacy public). */
export async function removeExistingStudentPhotos(brandId: string, studentId: string): Promise<void> {
  const folder = studentPhotoFolder(brandId, studentId);
  const supabase = getSupabase();

  for (const bucket of [BRAND_PRIVATE_BUCKET, "brand-assets"] as const) {
    const { data: files, error } = await supabase.storage.from(bucket).list(folder);
    if (error) {
      if (bucket === BRAND_PRIVATE_BUCKET) throw error;
      continue;
    }
    const paths = (files ?? [])
      .filter((f) => f.name.startsWith(PHOTO_FILE_PREFIX))
      .map((f) => `${folder}/${f.name}`);
    if (paths.length === 0) continue;
    const { error: removeErr } = await supabase.storage.from(bucket).remove(paths);
    if (removeErr && bucket === BRAND_PRIVATE_BUCKET) throw removeErr;
  }
}

/** Uploads student photo to brand-private and returns a private storage ref (not a CDN URL). */
export async function uploadStudentPhoto(brandId: string, studentId: string, file: File): Promise<string> {
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    throw new Error("SVG photos are not allowed. Use PNG, JPEG, WebP, or GIF.");
  }
  const ext = imageExtension(file);
  await removeExistingStudentPhotos(brandId, studentId);

  const path = studentPhotoObjectPath(brandId, studentId, ext);
  const { error: uploadErr } = await getSupabase()
    .storage.from(BRAND_PRIVATE_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: "300",
    });
  if (uploadErr) throw uploadErr;

  return toBrandPrivateRef(path);
}
