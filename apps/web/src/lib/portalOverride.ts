import type { PortalType } from "@edunudg/tenant";

export type PortalOverride = {
  portalType: Exclude<PortalType, "platform">;
  brandSlug: string;
  centerSlug?: string | null;
};

const STORAGE_KEY = "edunudg.portalOverride";

const PORTAL_TYPES = new Set(["brand", "center", "learn", "parents"]);

/** Synthetic host matching seed/RPC domain_mappings (always *.localhost in DB today). */
export function syntheticLookupHostname(override: PortalOverride): string {
  const brand = override.brandSlug.toLowerCase();
  if (override.portalType === "center") {
    const center = (override.centerSlug ?? "").toLowerCase();
    return `${center}.${brand}.localhost`;
  }
  if (override.portalType === "learn") return `learn.${brand}.localhost`;
  if (override.portalType === "parents") return `parents.${brand}.localhost`;
  return `${brand}.localhost`;
}

export function parsePortalOverrideFromSearch(search: string): PortalOverride | null {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const portalType = params.get("portal")?.trim().toLowerCase() ?? "";
  const brandSlug = params.get("brand")?.trim().toLowerCase() ?? "";
  if (!PORTAL_TYPES.has(portalType) || !brandSlug) return null;

  const centerSlug = params.get("center")?.trim().toLowerCase() || null;
  if (portalType === "center" && !centerSlug) return null;

  return {
    portalType: portalType as PortalOverride["portalType"],
    brandSlug,
    centerSlug,
  };
}

export function readPortalOverride(): PortalOverride | null {
  if (typeof window === "undefined") return null;

  const fromUrl = parsePortalOverrideFromSearch(window.location.search);
  if (fromUrl) {
    writePortalOverride(fromUrl);
    return fromUrl;
  }

  return readStickyPortalOverride();
}

/** Session sticky only — used when React Router search has no portal params. */
export function readStickyPortalOverride(): PortalOverride | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortalOverride;
    if (!PORTAL_TYPES.has(parsed.portalType) || !parsed.brandSlug?.trim()) return null;
    if (parsed.portalType === "center" && !parsed.centerSlug?.trim()) return null;
    return {
      portalType: parsed.portalType,
      brandSlug: parsed.brandSlug.trim().toLowerCase(),
      centerSlug: parsed.centerSlug?.trim().toLowerCase() || null,
    };
  } catch {
    return null;
  }
}

export function writePortalOverride(override: PortalOverride): void {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      portalType: override.portalType,
      brandSlug: override.brandSlug.trim().toLowerCase(),
      centerSlug: override.centerSlug?.trim().toLowerCase() || null,
    })
  );
}

export function clearPortalOverride(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Append portal override query params (for same-origin portal URLs). */
export function portalOverrideSearchParams(override: PortalOverride): URLSearchParams {
  const params = new URLSearchParams();
  params.set("portal", override.portalType);
  params.set("brand", override.brandSlug);
  if (override.centerSlug) {
    params.set("center", override.centerSlug);
  }
  return params;
}
