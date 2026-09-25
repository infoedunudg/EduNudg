import { afterEach, describe, expect, it } from "vitest";
import { clearPortalOverride, writePortalOverride } from "@/lib/portalOverride";
import { loginPathWithPortal, postLoginPath, preservedPortalSearch } from "./postLoginPath";

describe("postLoginPath", () => {
  afterEach(() => {
    clearPortalOverride();
  });

  it("sends platform users to /admin", () => {
    expect(postLoginPath({ portalType: "platform" })).toBe("/admin");
  });

  it("sends brand users to /app and center users to portal root", () => {
    expect(postLoginPath({ portalType: "brand" })).toBe("/app");
    expect(postLoginPath({ portalType: "center" })).toBe("/app");
  });

  it("sends learn and parents portals to student home", () => {
    expect(postLoginPath({ portalType: "learn" })).toBe("/");
    expect(postLoginPath({ portalType: "parents" })).toBe("/");
  });

  it("regression_preserves_same_origin_franchise_portal_query", () => {
    expect(
      preservedPortalSearch(
        new URLSearchParams("portal=center&brand=abacusworld&center=pune&next=/app")
      )
    ).toBe("?portal=center&brand=abacusworld&center=pune");
  });

  it("regression_login_redirect_keeps_portal_query_from_search", () => {
    expect(
      loginPathWithPortal("?portal=center&brand=smart-brain-abacus&center=chaitali-gokul-tajanpure")
    ).toBe("/login?portal=center&brand=smart-brain-abacus&center=chaitali-gokul-tajanpure");
  });

  it("regression_login_redirect_restores_sticky_center_portal_when_search_empty", () => {
    writePortalOverride({
      portalType: "center",
      brandSlug: "smart-brain-abacus",
      centerSlug: "chaitali-gokul-tajanpure",
    });
    expect(loginPathWithPortal("")).toBe(
      "/login?portal=center&brand=smart-brain-abacus&center=chaitali-gokul-tajanpure"
    );
  });
});
