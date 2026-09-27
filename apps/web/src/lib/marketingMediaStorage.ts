import { getSupabase } from "@/lib/supabase";
import { BRAND_ASSETS_BUCKET } from "@/lib/brandLogoStorage";
import { withMediaCacheBust } from "@/lib/mediaUrl";

export type MarketingUploadScope =
  | { kind: "platform" }
  | { kind: "platform-logo" }
  | { kind: "brand"; brandId: string };

/** Client-side cap for marketing images (curriculum banner, homepage slots). */
export const MARKETING_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MARKETING_IMAGE_MAX_MB = MARKETING_IMAGE_MAX_BYTES / (1024 * 1024);
export const CURRICULUM_BANNER_RECOMMENDED_SIZE = "1280×720 (16:9)";

export function curriculumBannerUploadHint(): string {
  return `PNG, JPEG, WebP, or GIF. Maximum ${MARKETING_IMAGE_MAX_MB} MB. Recommended ${CURRICULUM_BANNER_RECOMMENDED_SIZE} for program cards.`;
}

/** Safe id for a per-course `brand-assets` folder (UUID, draft slot, or test fixture). */
const CURRICULUM_MEDIA_SLOT_ID = /^[a-zA-Z0-9-]{1,80}$/;

/** Unique Storage folder for one curriculum course banner (does not share `program-marketing/asset.*`). */
export function curriculumProgramMediaSubdir(programId: string): string {
  const id = programId.trim();
  if (!CURRICULUM_MEDIA_SLOT_ID.test(id)) {
    throw new Error("Invalid curriculum media slot");
  }
  return `program-marketing/${id}`;
}

/** Storage folder for mentor photos — brand Homepage and Center Site must not share a slot. */
export function mentorPhotoUploadSubdir(
  portalMode: "brand" | "center" | "platform" | "learn" | string,
  index: number
): string {
  const slot = Math.max(0, Math.floor(index));
  return portalMode === "center" ? `center-founder-${slot}` : `founder-${slot}`;
}

/** Draft slot while adding a course, before `programs.id` exists. */
export function newCurriculumProgramMediaSlotId(): string {
  return crypto.randomUUID();
}

export function assertMarketingImageUploadSize(file: File): void {
  if (!file.type.startsWith("image/")) return;
  if (file.size > MARKETING_IMAGE_MAX_BYTES) {
    throw new Error(`Image must be ${MARKETING_IMAGE_MAX_MB} MB or smaller.`);
  }
}

const PLATFORM_LOGO_PREFIX = "platform-logo.";
const STABLE_BASENAME = "asset";

function mediaExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  const byType: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return byType[file.type] ?? "bin";
}

/** Folder prefix in `brand-assets` for a marketing media slot (one image/video per slot). */
export function marketingMediaFolder(scope: MarketingUploadScope, subdir: string): string | null {
  if (scope.kind === "platform-logo") return null;
  const slot = subdir.trim() || "misc";
  if (scope.kind === "platform") return `platform/marketing/${slot}`;
  return `${scope.brandId}/marketing/${slot}`;
}

/** Object path under `brand-assets` — stable name so re-upload replaces the slot. */
export function marketingMediaObjectPath(
  scope: MarketingUploadScope,
  subdir: string,
  file: File
): string {
  const ext = mediaExtension(file);
  if (scope.kind === "platform-logo") {
    return `${PLATFORM_LOGO_PREFIX}${ext}`;
  }
  const folder = marketingMediaFolder(scope, subdir);
  if (!folder) throw new Error("Invalid marketing media scope");
  return `${folder}/${STABLE_BASENAME}.${ext}`;
}

/** Removes prior files in a marketing media slot (any extension). */
export async function removeExistingMarketingMediaInSlot(
  scope: MarketingUploadScope,
  subdir: string
): Promise<void> {
  if (scope.kind === "platform-logo") {
    await removeExistingPlatformSiteLogos();
    return;
  }

  const folder = marketingMediaFolder(scope, subdir);
  if (!folder) return;

  const supabase = getSupabase();
  const { data: files, error } = await supabase.storage.from(BRAND_ASSETS_BUCKET).list(folder, { limit: 100 });
  if (error) throw error;

  const paths = (files ?? []).map((f) => `${folder}/${f.name}`);
  if (paths.length === 0) return;

  const { error: removeErr } = await supabase.storage.from(BRAND_ASSETS_BUCKET).remove(paths);
  if (removeErr) throw removeErr;
}

/** Removes prior `platform-logo.*` objects at the bucket root. */
export async function removeExistingPlatformSiteLogos(): Promise<void> {
  const supabase = getSupabase();
  const { data: files, error } = await supabase.storage.from(BRAND_ASSETS_BUCKET).list("", { limit: 200 });
  if (error) throw error;

  const paths = (files ?? [])
    .filter((f) => f.name.startsWith(PLATFORM_LOGO_PREFIX))
    .map((f) => f.name);
  if (paths.length === 0) return;

  const { error: removeErr } = await supabase.storage.from(BRAND_ASSETS_BUCKET).remove(paths);
  if (removeErr) throw removeErr;
}

export function marketingMediaPublicUrl(path: string): string {
  const { data } = getSupabase().storage.from(BRAND_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload marketing media; replaces prior slot file and returns a cache-busted public URL. */
export async function uploadMarketingMedia(
  scope: MarketingUploadScope,
  subdir: string,
  file: File
): Promise<string> {
  assertMarketingImageUploadSize(file);
  await removeExistingMarketingMediaInSlot(scope, subdir);

  const path = marketingMediaObjectPath(scope, subdir, file);
  const { error: uploadErr } = await getSupabase()
    .storage.from(BRAND_ASSETS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: "300",
    });
  if (uploadErr) throw uploadErr;

  return withMediaCacheBust(marketingMediaPublicUrl(path));
}
