import { describe, expect, it, vi } from "vitest";
import { mergeSparkAcademyLandingConfig } from "./brandLandingDefaults";
import { DEFAULT_HOMEPAGE_CONFIG } from "./homepageDefaults";
import {
  focusMarketingEditorSection,
  listRequiredMarketingPhotos,
  missingRequiredMarketingPhotoLabels,
  missingRequiredMarketingPhotos,
  requiredMarketingPhotosMessage,
} from "./marketingRequiredPhotos";
import { setSectionEnabled, SPARK_ACADEMY_SECTION_DEFAULTS } from "./homepageSections";

describe("marketingRequiredPhotos", () => {
  it("regression_spark_homepage_requires_first_photo_per_section", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    const required = listRequiredMarketingPhotos({
      config,
      marketingTheme: "spark-academy",
      portalMode: "brand",
    });
    expect(required.map((row) => row.label)).toEqual([
      "Site logo",
      "Hero background",
      "Features image",
      "Photo",
      "Journey highlight image",
    ]);
    expect(required.find((row) => row.label === "Features image")?.filled).toBe(false);
    expect(required.find((row) => row.label === "Photo")?.filled).toBe(true);
    expect(required.map((row) => row.label)).not.toContain("Hero banner image");
    expect(required.map((row) => row.label)).not.toContain("About Us hero banner image");
  });

  it("regression_spark_homepage_hero_photo_satisfies_about_hero_requirement", () => {
    const base = mergeSparkAcademyLandingConfig("Digitley");
    const config = {
      ...base,
      hero: { ...base.hero, backgroundImageUrl: "https://cdn.example/hero.jpg" },
    };
    const missing = missingRequiredMarketingPhotoLabels({
      config,
      marketingTheme: "spark-academy",
      portalMode: "brand",
    });
    expect(missing).not.toContain("Hero banner image");
    expect(missing).not.toContain("About Us hero banner image");
    expect(missing).not.toContain("Hero background");
  });

  it("regression_about_hero_required_only_when_homepage_hero_is_off", () => {
    const base = mergeSparkAcademyLandingConfig("Digitley");
    const config = setSectionEnabled(
      {
        ...base,
        about: { ...base.about!, heroImageUrl: "" },
        hero: { ...base.hero, backgroundImageUrl: "" },
      },
      "hero",
      false,
      SPARK_ACADEMY_SECTION_DEFAULTS
    );
    const labels = listRequiredMarketingPhotos({
      config,
      marketingTheme: "spark-academy",
      portalMode: "brand",
    }).map((row) => row.label);
    expect(labels).toContain("About Us hero banner image");
    expect(labels).not.toContain("Hero background");
  });

  it("regression_center_site_omits_about_hero_requirement", () => {
    const config = mergeSparkAcademyLandingConfig("Sample Center");
    const labels = listRequiredMarketingPhotos({
      config,
      marketingTheme: "spark-academy",
      portalMode: "center",
    }).map((row) => row.label);
    expect(labels).not.toContain("Hero banner image");
    expect(labels).not.toContain("About Us hero banner image");
    expect(labels).toContain("Site logo");
    expect(labels).toContain("Hero background");
  });

  it("regression_second_mentor_and_gallery_photos_are_optional", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley", {
      founders: [
        {
          roleBadge: "Mentor",
          name: "Sarah Johnson",
          title: "Lead",
          bio: "",
          photoUrl: "https://images.unsplash.com/photo-1",
        },
        {
          roleBadge: "Mentor",
          name: "Second",
          title: "Coach",
          bio: "",
          photoUrl: "",
        },
      ],
      gallery: {
        title: "Gallery",
        images: [
          { url: "https://cdn.example/one.jpg", alt: "One" },
          { url: "", alt: "Two" },
        ],
      },
    });
    const missing = missingRequiredMarketingPhotoLabels({
      config,
      marketingTheme: "spark-academy",
      portalMode: "center",
    });
    expect(missing).not.toContain("Image");
    expect(config.gallery?.images[1]?.url).toBe("");
  });

  it("regression_missing_required_photos_build_save_message", () => {
    const config = {
      ...DEFAULT_HOMEPAGE_CONFIG,
      meta: { ...DEFAULT_HOMEPAGE_CONFIG.meta, logoUrl: null },
      hero: { ...DEFAULT_HOMEPAGE_CONFIG.hero, backgroundImageUrl: "" },
    };
    const missing = missingRequiredMarketingPhotos({
      config,
      marketingTheme: "novu",
      portalMode: "brand",
    });
    expect(missing.map((row) => row.label)).toContain("Site logo");
    expect(requiredMarketingPhotosMessage(missing)).toMatch(/Upload a photo in:/);
    expect(requiredMarketingPhotosMessage(missing)).toMatch(/Site → Site logo/);
  });

  it("regression_required_photo_error_names_editor_section", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    const missing = missingRequiredMarketingPhotos({
      config,
      marketingTheme: "spark-academy",
      portalMode: "brand",
    });
    const features = missing.find((row) => row.label === "Features image");
    expect(features?.sectionTitle).toBe("Why us (feature blocks)");
    expect(features?.sectionId).toBe("featureGrid");
    const message = requiredMarketingPhotosMessage(missing);
    expect(message).toMatch(/Why us \(feature blocks\) → Features image/);
  });

  it("regression_focus_marketing_editor_section_opens_accordion", () => {
    document.body.innerHTML = `
      <section data-editor-section="featureGrid">
        <button type="button" class="ed-editor-accordion__trigger">Why us</button>
      </section>
    `;
    const trigger = document.querySelector(".ed-editor-accordion__trigger") as HTMLButtonElement;
    const click = vi.fn();
    trigger.addEventListener("click", click);
    focusMarketingEditorSection("featureGrid");
    expect(click).toHaveBeenCalled();
  });
});
