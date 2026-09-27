import { describe, expect, it } from "vitest";
import {
  marketingMediaFolder,
  marketingMediaObjectPath,
  MARKETING_IMAGE_MAX_BYTES,
  assertMarketingImageUploadSize,
  curriculumProgramMediaSubdir,
  mentorPhotoUploadSubdir,
  newCurriculumProgramMediaSlotId,
} from "./marketingMediaStorage";

describe("marketingMediaObjectPath", () => {
  it("regression_platform_scope_uses_stable_slot_path", () => {
    const file = new File(["x"], "hero-bg.png", { type: "image/png" });
    const path = marketingMediaObjectPath({ kind: "platform" }, "hero-background", file);
    expect(path).toBe("platform/marketing/hero-background/asset.png");
  });

  it("regression_platform_logo_uses_fixed_root_path", () => {
    const file = new File(["x"], "logo.svg", { type: "image/svg+xml" });
    const path = marketingMediaObjectPath({ kind: "platform-logo" }, "", file);
    expect(path).toBe("platform-logo.svg");
  });

  it("regression_brand_scope_uses_stable_brand_slot_path", () => {
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });
    const path = marketingMediaObjectPath(
      { kind: "brand", brandId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
      "feature-organize",
      file
    );
    expect(path).toBe(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/marketing/feature-organize/asset.mp4"
    );
  });
});

describe("marketingMediaFolder", () => {
  it("maps brand and platform folders under marketing", () => {
    expect(marketingMediaFolder({ kind: "platform" }, "footer-background")).toBe(
      "platform/marketing/footer-background"
    );
    expect(
      marketingMediaFolder({ kind: "brand", brandId: "b1" }, "hero-background")
    ).toBe("b1/marketing/hero-background");
  });
});

describe("curriculumProgramMediaSubdir", () => {
  it("regression_curriculum_banner_upload_uses_per_course_slot", () => {
    const brandId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const abacus = curriculumProgramMediaSubdir("program-abacus");
    const vedic = curriculumProgramMediaSubdir("program-vedic");
    expect(abacus).toBe("program-marketing/program-abacus");
    expect(vedic).toBe("program-marketing/program-vedic");
    expect(abacus).not.toBe(vedic);
    expect(abacus).not.toBe("program-marketing");

    const abacusPath = marketingMediaObjectPath(
      { kind: "brand", brandId },
      abacus,
      new File(["x"], "abacus.png", { type: "image/png" }),
    );
    const vedicPath = marketingMediaObjectPath(
      { kind: "brand", brandId },
      vedic,
      new File(["x"], "vedic.png", { type: "image/png" }),
    );
    expect(abacusPath).toBe(`${brandId}/marketing/program-marketing/program-abacus/asset.png`);
    expect(vedicPath).toBe(`${brandId}/marketing/program-marketing/program-vedic/asset.png`);
    expect(abacusPath).not.toBe(vedicPath);
    expect(abacusPath).not.toContain("/marketing/program-marketing/asset.");
  });

  it("regression_new_course_banner_slot_is_unique_draft_id", () => {
    const a = newCurriculumProgramMediaSlotId();
    const b = newCurriculumProgramMediaSlotId();
    expect(a).not.toBe(b);
    expect(curriculumProgramMediaSubdir(a)).toMatch(/^program-marketing\/[a-zA-Z0-9-]+$/);
  });

  it("rejects unsafe curriculum media slot ids", () => {
    expect(() => curriculumProgramMediaSubdir("../hero-background")).toThrow(/Invalid curriculum media slot/);
    expect(() => curriculumProgramMediaSubdir("")).toThrow(/Invalid curriculum media slot/);
  });
});

describe("assertMarketingImageUploadSize", () => {
  it("regression_curriculum_banner_rejects_images_over_5mb", () => {
    const oversized = new File([new Uint8Array(MARKETING_IMAGE_MAX_BYTES + 1)], "banner.png", {
      type: "image/png",
    });
    expect(() => assertMarketingImageUploadSize(oversized)).toThrow(/5 MB or smaller/);
    const ok = new File(["x"], "banner.png", { type: "image/png" });
    expect(() => assertMarketingImageUploadSize(ok)).not.toThrow();
  });
});

describe("mentorPhotoUploadSubdir", () => {
  it("regression_center_and_homepage_mentor_photos_use_separate_storage_slots", () => {
    expect(mentorPhotoUploadSubdir("brand", 0)).toBe("founder-0");
    expect(mentorPhotoUploadSubdir("center", 0)).toBe("center-founder-0");
    const brandPath = marketingMediaObjectPath(
      { kind: "brand", brandId: "brand-1" },
      mentorPhotoUploadSubdir("brand", 0),
      new File(["x"], "a.jpg", { type: "image/jpeg" })
    );
    const centerPath = marketingMediaObjectPath(
      { kind: "brand", brandId: "brand-1" },
      mentorPhotoUploadSubdir("center", 0),
      new File(["x"], "b.jpg", { type: "image/jpeg" })
    );
    expect(brandPath).toBe("brand-1/marketing/founder-0/asset.jpg");
    expect(centerPath).toBe("brand-1/marketing/center-founder-0/asset.jpg");
    expect(brandPath).not.toBe(centerPath);
  });
});
