import { getSupabase } from "@/lib/supabase";
import { withLogoCacheBust } from "@/lib/brandLogoCache";
import { BRAND_ASSETS_BUCKET } from "@/lib/brandLogoStorage";
import { assertMarketingImageUploadSize } from "@/lib/marketingMediaStorage";

const PHOTO_FILE_PREFIX = "photo.";

function imageExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  const byType: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return byType[file.type] ?? "png";
}

/** `{brandId}/centers/{centerId}` */
export function centerPhotoFolder(brandId: string, centerId: string): string {
  return `${brandId}/centers/${centerId}`;
}

/** `{brandId}/centers/{centerId}/photo.{ext}` */
export function centerPhotoObjectPath(brandId: string, centerId: string, ext: string): string {
  return `${centerPhotoFolder(brandId, centerId)}/${PHOTO_FILE_PREFIX}${ext}`;
}

export function centerPhotoPublicUrl(brandId: string, centerId: string, ext: string): string {
  const path = centerPhotoObjectPath(brandId, centerId, ext);
  const { data } = getSupabase().storage.from(BRAND_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Removes any existing `photo.*` objects for this center. */
export async function removeExistingCenterPhotos(brandId: string, centerId: string): Promise<void> {
  const folder = centerPhotoFolder(brandId, centerId);
  const supabase = getSupabase();
  const { data: files, error } = await supabase.storage.from(BRAND_ASSETS_BUCKET).list(folder);
  if (error) throw error;

  const paths = (files ?? [])
    .filter((f) => f.name.startsWith(PHOTO_FILE_PREFIX))
    .map((f) => `${folder}/${f.name}`);
  if (paths.length === 0) return;

  const { error: removeErr } = await supabase.storage.from(BRAND_ASSETS_BUCKET).remove(paths);
  if (removeErr) throw removeErr;
}

/** Uploads center photo to brand-assets and returns cache-busted public URL. */
export async function uploadCenterPhoto(brandId: string, centerId: string, file: File): Promise<string> {
  assertMarketingImageUploadSize(file);
  const ext = imageExtension(file);
  await removeExistingCenterPhotos(brandId, centerId);

  const path = centerPhotoObjectPath(brandId, centerId, ext);
  const { error: uploadErr } = await getSupabase()
    .storage.from(BRAND_ASSETS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: "300",
    });
  if (uploadErr) throw uploadErr;

  return withLogoCacheBust(centerPhotoPublicUrl(brandId, centerId, ext));
}
