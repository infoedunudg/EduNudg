import { isAboutPagePublished } from "@/lib/aboutUs";
import {
  isAbacusSectionEnabled,
  isEduLearnSectionEnabled,
  isSectionEnabled,
  isSparkSectionEnabled,
  type HomepageSectionKey,
} from "@/lib/homepageSections";
import { usesAlternateThemeEditor } from "@/lib/marketingThemeLayout";
import type { PortalMode } from "@/lib/portalMode";
import type { HomepageConfig, MarketingTheme } from "@/types/homepage";

export type RequiredMarketingPhoto = {
  key: string;
  sectionId: string;
  /** Editor accordion / panel title so staff know where to open. */
  sectionTitle: string;
  label: string;
  filled: boolean;
};

/** Display titles aligned with Brand Homepage / Center Site accordion labels. */
export const MARKETING_EDITOR_SECTION_TITLES: Record<string, string> = {
  site: "Site",
  hero: "Hero",
  featureGrid: "Why us (feature blocks)",
  founders: "Mentors / Leadership",
  upcomingEvents: "Upcoming events",
  about: "About Us",
  trustMedia: "Trust & video",
  gallery: "Photo gallery",
  highlights: "Highlight cards (horizontal scroller)",
  privacyFooter: "Privacy & Footer",
  featureScroll: "Feature sections (phone blocks)",
};

function sectionTitle(sectionId: string): string {
  return MARKETING_EDITOR_SECTION_TITLES[sectionId] ?? sectionId;
}

function hasMediaUrl(value?: string | null): boolean {
  return Boolean(value?.trim());
}

function isSectionOn(config: HomepageConfig, theme: MarketingTheme, key: HomepageSectionKey): boolean {
  if (theme === "spark-academy") return isSparkSectionEnabled(config, key);
  if (theme === "edu-learn") return isEduLearnSectionEnabled(config, key);
  if (theme === "abacus-classic") return isAbacusSectionEnabled(config, key);
  return isSectionEnabled(config, key);
}

/**
 * First photo upload in each homepage / center-site editor section.
 * Extra photos in the same section stay optional.
 */
export function listRequiredMarketingPhotos(input: {
  config: HomepageConfig;
  marketingTheme: MarketingTheme;
  portalMode: PortalMode;
}): RequiredMarketingPhoto[] {
  const { config, marketingTheme, portalMode } = input;
  const alternate = usesAlternateThemeEditor(marketingTheme);
  const photos: RequiredMarketingPhoto[] = [
    {
      key: "site-logo",
      sectionId: "site",
      sectionTitle: sectionTitle("site"),
      label: "Site logo",
      filled: hasMediaUrl(config.meta.logoUrl),
    },
  ];

  if (isSectionOn(config, marketingTheme, "hero")) {
    photos.push({
      key: "hero",
      sectionId: "hero",
      sectionTitle: sectionTitle("hero"),
      label: alternate ? "Hero background" : "Hero background image or video",
      filled: hasMediaUrl(config.hero.backgroundImageUrl),
    });
  }

  if (alternate && marketingTheme === "spark-academy" && isSectionOn(config, marketingTheme, "featureGrid")) {
    photos.push({
      key: "features-image",
      sectionId: "featureGrid",
      sectionTitle: sectionTitle("featureGrid"),
      label: "Features image",
      filled: hasMediaUrl(config.featuresShowcase?.imageUrl),
    });
  }

  if (isSectionOn(config, marketingTheme, "founders") && (config.founders?.length ?? 0) > 0) {
    photos.push({
      key: "founder-0",
      sectionId: "founders",
      sectionTitle: sectionTitle("founders"),
      label: "Photo",
      filled: hasMediaUrl(config.founders?.[0]?.photoUrl),
    });
  }

  if (isSectionOn(config, marketingTheme, "upcomingEvents") && (config.upcomingEvents?.items?.length ?? 0) > 0) {
    photos.push({
      key: "event-0",
      sectionId: "upcomingEvents",
      sectionTitle: sectionTitle("upcomingEvents"),
      label: "Cover image",
      filled: hasMediaUrl(config.upcomingEvents?.items?.[0]?.imageUrl),
    });
  }

  const aboutInPlay =
    portalMode === "brand" &&
    (isSectionOn(config, marketingTheme, "about") || isAboutPagePublished(config.about));
  const heroOn = isSectionOn(config, marketingTheme, "hero");
  if (aboutInPlay && !heroOn) {
    photos.push({
      key: "about-hero",
      sectionId: "about",
      sectionTitle: sectionTitle("about"),
      label: "About Us hero banner image",
      filled: hasMediaUrl(config.about?.heroImageUrl),
    });
  }

  if (alternate && marketingTheme === "spark-academy" && isSectionOn(config, marketingTheme, "trustMedia")) {
    photos.push({
      key: "journey",
      sectionId: "trustMedia",
      sectionTitle: sectionTitle("trustMedia"),
      label: "Journey highlight image",
      filled: hasMediaUrl(config.trustMedia?.imageUrl),
    });
  }

  if (isSectionOn(config, marketingTheme, "gallery") && (config.gallery?.images?.length ?? 0) > 0) {
    photos.push({
      key: "gallery-0",
      sectionId: "gallery",
      sectionTitle: sectionTitle("gallery"),
      label: "Image",
      filled: hasMediaUrl(config.gallery?.images?.[0]?.url),
    });
  }

  if (!alternate) {
    if ((config.showcaseCards?.length ?? 0) > 0 && isSectionOn(config, marketingTheme, "highlights")) {
      photos.push({
        key: "showcase-0",
        sectionId: "highlights",
        sectionTitle: sectionTitle("highlights"),
        label: "Background image or video",
        filled: hasMediaUrl(config.showcaseCards[0]?.imageUrl),
      });
    }
    photos.push({
      key: "footer-cta",
      sectionId: "privacyFooter",
      sectionTitle: sectionTitle("privacyFooter"),
      label: "Footer CTA background image or video",
      filled: hasMediaUrl(config.footerCta?.backgroundImageUrl),
    });
  }

  return photos;
}

export function isAboutHeroPhotoRequired(input: {
  config: HomepageConfig;
  marketingTheme: MarketingTheme;
  portalMode: PortalMode;
}): boolean {
  return listRequiredMarketingPhotos(input).some((photo) => photo.key === "about-hero");
}

export function missingRequiredMarketingPhotos(input: {
  config: HomepageConfig;
  marketingTheme: MarketingTheme;
  portalMode: PortalMode;
}): RequiredMarketingPhoto[] {
  return listRequiredMarketingPhotos(input).filter((photo) => !photo.filled);
}

export function missingRequiredMarketingPhotoLabels(input: {
  config: HomepageConfig;
  marketingTheme: MarketingTheme;
  portalMode: PortalMode;
}): string[] {
  return missingRequiredMarketingPhotos(input).map((photo) => photo.label);
}

/** Save-bar copy: names the accordion so staff know where to upload. */
export function requiredMarketingPhotosMessage(missing: RequiredMarketingPhoto[]): string | null {
  if (missing.length === 0) return null;
  const parts = missing.map((photo) => `${photo.sectionTitle} → ${photo.label}`);
  return `Upload a photo in: ${parts.join("; ")}.`;
}

export function scrollMarketingEditorToBottom(): void {
  const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  window.scrollTo({ top: height, behavior: "smooth" });
  document
    .querySelector<HTMLElement>("[aria-label='Save changes']")
    ?.scrollIntoView({ behavior: "smooth", block: "end" });
}

/** Open the matching editor accordion (if collapsed) and scroll it into view. */
export function focusMarketingEditorSection(sectionId: string): void {
  const el = document.querySelector<HTMLElement>(`[data-editor-section="${sectionId}"]`);
  if (!el) {
    scrollMarketingEditorToBottom();
    return;
  }
  const trigger = el.querySelector<HTMLButtonElement>(":scope > .ed-editor-accordion__trigger");
  if (trigger) {
    trigger.click();
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
