import { getSupabase } from "@/lib/supabase";

/** Private bucket for competition papers and student photos (not CDN-public). */
export const BRAND_PRIVATE_BUCKET = "brand-private";
export const BRAND_PRIVATE_REF_PREFIX = "brand-private:";

const SIGNED_URL_TTL_SEC = 60 * 60; // 1 hour

export function toBrandPrivateRef(objectPath: string): string {
  return `${BRAND_PRIVATE_REF_PREFIX}${objectPath.replace(/^\/+/, "")}`;
}

export function isBrandPrivateRef(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith(BRAND_PRIVATE_REF_PREFIX));
}

export function brandPrivatePathFromRef(ref: string): string | null {
  if (!isBrandPrivateRef(ref)) return null;
  return ref.slice(BRAND_PRIVATE_REF_PREFIX.length);
}

/** Extract object path from a legacy public brand-assets URL, if any. */
export function extractPublicBrandAssetsPath(url: string): string | null {
  try {
    const marker = "/storage/v1/object/public/brand-assets/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length).split("?")[0] ?? "");
  } catch {
    return null;
  }
}

export function isSensitiveBrandAssetsPath(path: string): boolean {
  const parts = path.split("/").filter(Boolean);
  return parts[1] === "students" || (parts[1] === "competitions" && parts[2] === "papers");
}

/**
 * Resolve a stored file ref/URL to a browser-usable HTTPS URL.
 * - `brand-private:…` → short-lived signed URL (requires auth + storage RLS)
 * - Legacy public brand-assets competitions/students paths → signed URL on brand-assets
 *   (CDN public URL may still exist for old objects until re-uploaded)
 * - Other absolute URLs (marketing logos, etc.) returned as-is
 */
export async function resolveSecureStorageUrl(
  refOrUrl: string | null | undefined,
  expiresInSec = SIGNED_URL_TTL_SEC
): Promise<string | null> {
  const raw = (refOrUrl ?? "").trim();
  if (!raw) return null;

  const privatePath = brandPrivatePathFromRef(raw);
  if (privatePath) {
    const { data, error } = await getSupabase()
      .storage.from(BRAND_PRIVATE_BUCKET)
      .createSignedUrl(privatePath, expiresInSec);
    if (error) throw error;
    return data.signedUrl;
  }

  const publicPath = extractPublicBrandAssetsPath(raw);
  if (publicPath && isSensitiveBrandAssetsPath(publicPath)) {
    const { data, error } = await getSupabase()
      .storage.from("brand-assets")
      .createSignedUrl(publicPath, expiresInSec);
    if (!error && data?.signedUrl) return data.signedUrl;
    // Fall through to raw URL only if signing fails (e.g. object already moved)
  }

  return raw;
}

export async function openSecureStorageUrl(refOrUrl: string, fileName?: string): Promise<void> {
  const url = await resolveSecureStorageUrl(refOrUrl);
  if (!url) throw new Error("File URL is missing.");
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened && fileName) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noreferrer";
    a.target = "_blank";
    a.click();
  }
}
