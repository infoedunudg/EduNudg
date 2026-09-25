import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  BRAND_PRIVATE_REF_PREFIX,
  extractPublicBrandAssetsPath,
  isBrandPrivateRef,
  isSensitiveBrandAssetsPath,
  toBrandPrivateRef,
} from "./secureStorageUrl";

const createSignedUrl = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    storage: {
      from: () => ({
        createSignedUrl,
      }),
    },
  }),
}));

describe("secureStorageUrl", () => {
  beforeEach(() => {
    createSignedUrl.mockReset();
  });

  it("regression_private_storage_ref_uses_brand_private_prefix", () => {
    const ref = toBrandPrivateRef("brand-1/competitions/papers/p1/file.pdf");
    expect(ref.startsWith(BRAND_PRIVATE_REF_PREFIX)).toBe(true);
    expect(isBrandPrivateRef(ref)).toBe(true);
  });

  it("regression_sensitive_brand_assets_paths_are_detected", () => {
    expect(isSensitiveBrandAssetsPath("b/competitions/papers/p/x.pdf")).toBe(true);
    expect(isSensitiveBrandAssetsPath("b/students/s/photo.jpg")).toBe(true);
    expect(isSensitiveBrandAssetsPath("b/marketing/logo.png")).toBe(false);
  });

  it("regression_extracts_path_from_public_brand_assets_url", () => {
    const url =
      "https://xyz.supabase.co/storage/v1/object/public/brand-assets/brand-1/competitions/papers/p1/a.pdf";
    expect(extractPublicBrandAssetsPath(url)).toBe("brand-1/competitions/papers/p1/a.pdf");
  });

  it("regression_resolve_secure_storage_url_signs_private_refs", async () => {
    createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed.example/private.pdf" },
      error: null,
    });
    const { resolveSecureStorageUrl } = await import("./secureStorageUrl");
    const url = await resolveSecureStorageUrl("brand-private:brand-1/competitions/papers/p1/a.pdf");
    expect(url).toBe("https://signed.example/private.pdf");
    expect(createSignedUrl).toHaveBeenCalled();
  });
});
