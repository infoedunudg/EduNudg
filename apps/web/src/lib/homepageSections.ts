import type { HomepageConfig } from "@/types/homepage";

/** Keys for major marketing page blocks controlled from the homepage editor. */
export type HomepageSectionKey =
  | "hero"
  | "featureScroll"
  | "highlights"
  | "privacy"
  | "testimonials"
  | "faq"
  | "footer"
  | "programsGrid"
  | "curriculumSyllabus"
  | "featureGrid"
  | "founders"
  | "trustMedia"
  | "gallery"
  | "footerRich"
  | "ecosystemIntro"
  | "connectivityShowcase"
  | "footerCta"
  | "upcomingEvents"
  | "about";

export type HomepageSectionVisibility = Partial<Record<HomepageSectionKey, boolean>>;

export const DEFAULT_HOMEPAGE_SECTION_VISIBILITY: Record<HomepageSectionKey, boolean> = {
  hero: true,
  featureScroll: true,
  highlights: true,
  privacy: true,
  testimonials: true,
  faq: true,
  footer: true,
  programsGrid: true,
  curriculumSyllabus: false,
  featureGrid: true,
  founders: true,
  trustMedia: true,
  gallery: true,
  footerRich: true,
  ecosystemIntro: true,
  connectivityShowcase: true,
  footerCta: true,
  upcomingEvents: true,
  about: false,
};

/** Section defaults for the platform enterprise landing at localhost:9000. */
export const ENTERPRISE_PLATFORM_SECTION_DEFAULTS: Record<HomepageSectionKey, boolean> = {
  hero: true,
  featureScroll: false,
  highlights: false,
  privacy: false,
  testimonials: false,
  faq: true,
  footer: true,
  programsGrid: false,
  curriculumSyllabus: false,
  featureGrid: true,
  founders: false,
  trustMedia: false,
  gallery: false,
  footerRich: false,
  ecosystemIntro: true,
  connectivityShowcase: true,
  footerCta: true,
  upcomingEvents: false,
  about: false,
};

export const ABACUS_CLASSIC_SECTION_DEFAULTS: Record<HomepageSectionKey, boolean> = {
  hero: true,
  featureScroll: false,
  highlights: false,
  privacy: false,
  testimonials: true,
  faq: true,
  footer: false,
  programsGrid: true,
  curriculumSyllabus: true,
  featureGrid: true,
  founders: true,
  trustMedia: true,
  gallery: true,
  footerRich: true,
  ecosystemIntro: false,
  connectivityShowcase: false,
  footerCta: false,
  upcomingEvents: true,
  about: false,
};

export const SPARK_ACADEMY_SECTION_DEFAULTS: Record<HomepageSectionKey, boolean> = {
  hero: true,
  featureScroll: false,
  highlights: false,
  privacy: false,
  testimonials: true,
  faq: true,
  footer: true,
  programsGrid: true,
  curriculumSyllabus: true,
  featureGrid: true,
  founders: true,
  trustMedia: true,
  gallery: true,
  footerRich: true,
  ecosystemIntro: false,
  connectivityShowcase: false,
  footerCta: false,
  upcomingEvents: true,
  about: false,
};

export const EDU_LEARN_SECTION_DEFAULTS: Record<HomepageSectionKey, boolean> = {
  hero: true,
  featureScroll: false,
  highlights: false,
  privacy: false,
  testimonials: true,
  faq: true,
  footer: true,
  programsGrid: true,
  curriculumSyllabus: true,
  featureGrid: true,
  founders: true,
  trustMedia: true,
  gallery: true,
  footerRich: true,
  ecosystemIntro: false,
  connectivityShowcase: false,
  footerCta: true,
  upcomingEvents: true,
  about: false,
};

/** Section toggles honored when alternate-theme landing JSON was saved from that theme's editor. */
const ABACUS_CLASSIC_SHARED_SECTION_KEYS: HomepageSectionKey[] = [
  "hero",
  "testimonials",
  "faq",
  "featureGrid",
  "programsGrid",
  "founders",
  "trustMedia",
  "gallery",
  "curriculumSyllabus",
  "footerRich",
  "upcomingEvents",
  "about",
];

const SPARK_ACADEMY_SHARED_SECTION_KEYS: HomepageSectionKey[] = [
  ...ABACUS_CLASSIC_SHARED_SECTION_KEYS,
];

const EDU_LEARN_SHARED_SECTION_KEYS: HomepageSectionKey[] = [
  ...SPARK_ACADEMY_SHARED_SECTION_KEYS,
  "footerCta",
];

export type HomepageSectionVisibilityInput = HomepageSectionVisibility & {
  /** @deprecated Renamed to programsGrid — still read from saved brand_settings JSON. */
  programsMarquee?: boolean;
};

/** Map legacy `programsMarquee` toggle from saved brand_settings JSON. */
function normalizeSectionPartial(
  partial?: HomepageSectionVisibilityInput
): HomepageSectionVisibility | undefined {
  if (!partial) return partial;
  const legacy = partial.programsMarquee;
  if (legacy === undefined || partial.programsGrid !== undefined) return partial;
  const { programsMarquee: _removed, ...rest } = partial;
  return { ...rest, programsGrid: legacy };
}

export function mergeSectionVisibility(
  partial?: HomepageSectionVisibilityInput,
  themeDefaults: Record<HomepageSectionKey, boolean> = DEFAULT_HOMEPAGE_SECTION_VISIBILITY
): Record<HomepageSectionKey, boolean> {
  const normalized = normalizeSectionPartial(partial);
  return { ...themeDefaults, ...normalized };
}

function hasUpcomingEventsMarker(partial?: Partial<HomepageConfig>): boolean {
  return (partial?.upcomingEvents?.items?.length ?? 0) > 0;
}

/** True when stored landing JSON includes Abacus Classic editor fields (not Novu-only). */
export function hasAbacusClassicLandingMarkers(partial?: Partial<HomepageConfig>): boolean {
  if (!partial) return false;
  return Boolean(
    (partial.founders?.length ?? 0) > 0 ||
    partial.trustMedia?.eyebrow ||
    (partial.gallery?.images?.length ?? 0) > 0 ||
    partial.programsSection?.cards?.some((card) => card.name.trim().length > 0) ||
    hasUpcomingEventsMarker(partial)
  );
}

/** True when stored landing JSON includes Spark Academy editor fields (not Novu-only). */
export function hasSparkAcademyLandingMarkers(partial?: Partial<HomepageConfig>): boolean {
  if (!partial) return false;
  return Boolean(
    partial.featuresShowcase?.title ||
    partial.trustMedia?.highlightPrimary ||
    (partial.founders?.length ?? 0) > 0 ||
    partial.programsSection?.cards?.some((card) => card.name.trim().length > 0) ||
    hasUpcomingEventsMarker(partial)
  );
}

function mergeAlternateThemeSectionVisibility(
  partial: Partial<HomepageConfig> | undefined,
  themeDefaults: Record<HomepageSectionKey, boolean>,
  sharedKeys: HomepageSectionKey[],
  hasThemeMarkers: (partial?: Partial<HomepageConfig>) => boolean
): Record<HomepageSectionKey, boolean> {
  const defaults = { ...themeDefaults };
  if (!hasThemeMarkers(partial)) {
    return defaults;
  }
  const normalized = normalizeSectionPartial(partial?.sections);
  if (!normalized) return defaults;
  for (const key of sharedKeys) {
    if (normalized[key] !== undefined) {
      defaults[key] = normalized[key]!;
    }
  }
  return defaults;
}

/** Abacus public/editor merge: ignore Novu-era section toggles until Abacus content exists in JSON. */
export function mergeAbacusClassicSectionVisibility(
  partial?: Partial<HomepageConfig>
): Record<HomepageSectionKey, boolean> {
  return mergeAlternateThemeSectionVisibility(
    partial,
    ABACUS_CLASSIC_SECTION_DEFAULTS,
    ABACUS_CLASSIC_SHARED_SECTION_KEYS,
    hasAbacusClassicLandingMarkers
  );
}

/** Spark public/editor merge: ignore Novu-era section toggles until Spark content exists in JSON. */
export function mergeSparkAcademySectionVisibility(
  partial?: Partial<HomepageConfig>
): Record<HomepageSectionKey, boolean> {
  return mergeAlternateThemeSectionVisibility(
    partial,
    SPARK_ACADEMY_SECTION_DEFAULTS,
    SPARK_ACADEMY_SHARED_SECTION_KEYS,
    hasSparkAcademyLandingMarkers
  );
}

export function hasEduLearnLandingMarkers(partial?: Partial<HomepageConfig>): boolean {
  if (!partial) return false;
  return (
    hasSparkAcademyLandingMarkers(partial) ||
    hasAbacusClassicLandingMarkers(partial) ||
    Boolean(
      partial.theme?.accent === "#f9a825" ||
      partial.footerCta?.title ||
      (partial.gallery?.images?.length ?? 0) > 0 ||
      (partial.founders?.length ?? 0) > 0
    )
  );
}

export function mergeEduLearnSectionVisibility(
  partial?: Partial<HomepageConfig>
): Record<HomepageSectionKey, boolean> {
  return mergeAlternateThemeSectionVisibility(
    partial,
    EDU_LEARN_SECTION_DEFAULTS,
    EDU_LEARN_SHARED_SECTION_KEYS,
    hasEduLearnLandingMarkers
  );
}

export function isSectionEnabled(config: HomepageConfig, key: HomepageSectionKey): boolean {
  return mergeSectionVisibility(config.sections)[key];
}

export function isPlatformSectionEnabled(config: HomepageConfig, key: HomepageSectionKey): boolean {
  return mergeSectionVisibility(config.sections, ENTERPRISE_PLATFORM_SECTION_DEFAULTS)[key];
}

export function isAbacusSectionEnabled(config: HomepageConfig, key: HomepageSectionKey): boolean {
  return mergeSectionVisibility(config.sections, ABACUS_CLASSIC_SECTION_DEFAULTS)[key];
}

export function isSparkSectionEnabled(config: HomepageConfig, key: HomepageSectionKey): boolean {
  return mergeSectionVisibility(config.sections, SPARK_ACADEMY_SECTION_DEFAULTS)[key];
}

export function isEduLearnSectionEnabled(config: HomepageConfig, key: HomepageSectionKey): boolean {
  return mergeSectionVisibility(config.sections, EDU_LEARN_SECTION_DEFAULTS)[key];
}

export function setSectionEnabled(
  config: HomepageConfig,
  key: HomepageSectionKey,
  enabled: boolean,
  themeDefaults: Record<HomepageSectionKey, boolean> = DEFAULT_HOMEPAGE_SECTION_VISIBILITY
): HomepageConfig {
  return {
    ...config,
    sections: { ...mergeSectionVisibility(config.sections, themeDefaults), [key]: enabled },
  };
}
