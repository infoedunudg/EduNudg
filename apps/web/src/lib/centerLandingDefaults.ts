import { mergeHomepageConfig } from "@/lib/homepageApi";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { mergeAbacusClassicSectionVisibility, mergeEduLearnSectionVisibility, mergeSparkAcademySectionVisibility } from "@/lib/homepageSections";
import { withDefaultFeatureVideos } from "@/lib/marketingFeatureSections";
import type { HomepageConfig, HomepageFounderProfile, MarketingTheme } from "@/types/homepage";
import { aboutMembersAsFounders } from "@/lib/aboutUs";
import {
  buildBrandLandingConfig,
  buildSparkAcademyLandingPartial,
  buildEduLearnLandingPartial,
  mergeAbacusClassicLandingConfig,
  mergeSparkAcademyLandingConfig,
  mergeEduLearnLandingConfig,
  SPARK_STOCK_FOUNDER_NAMES,
  limitSparkThemeDefaultMentors,
} from "@/lib/brandLandingDefaults";

/** Brand editor preview name for `center_landing` — never show this on a live center host. */
export const CENTER_LANDING_EDITOR_PLACEHOLDER_NAME = "Sample Center";

export function publicCenterDisplayName(centerName: string, displayName?: string | null): string {
  const display = displayName?.trim();
  return display || centerName;
}

export function replaceCenterLandingPlaceholder(text: string | undefined, centerName: string): string | undefined {
  if (!text) return text;
  if (!text.includes(CENTER_LANDING_EDITOR_PLACEHOLDER_NAME)) return text;
  return text.split(CENTER_LANDING_EDITOR_PLACEHOLDER_NAME).join(centerName);
}

export function centerPublicCopyright(centerName: string, brandName: string, year = new Date().getFullYear()): string {
  if (centerName.trim().toLowerCase() === brandName.trim().toLowerCase()) {
    return `© ${year} ${centerName}.`;
  }
  return `© ${year} ${centerName}. Part of ${brandName}.`;
}

/** Swap editor placeholders for this franchise’s name on View Frontend. */
export function overlayCenterLandingIdentity(
  config: HomepageConfig,
  centerName: string,
  brandName: string
): HomepageConfig {
  const description = replaceCenterLandingPlaceholder(config.footer.rich?.description, centerName);
  const heroSubtitle = replaceCenterLandingPlaceholder(config.hero.subtitle, centerName);
  const privacyBody = replaceCenterLandingPlaceholder(config.privacy?.body, centerName);

  return {
    ...config,
    hero: {
      ...config.hero,
      subtitle: heroSubtitle ?? config.hero.subtitle,
    },
    privacy: config.privacy
      ? { ...config.privacy, body: privacyBody ?? config.privacy.body }
      : config.privacy,
    footer: {
      ...config.footer,
      copyright: centerPublicCopyright(centerName, brandName),
      rich: config.footer.rich
        ? { ...config.footer.rich, description: description ?? config.footer.rich.description }
        : config.footer.rich,
    },
  };
}

export type CenterFounderIdentity = {
  /** Franchise Identity name (`franchise_centers.name`) — center owner. */
  ownerName: string;
  photoUrl: string | null;
  displayName: string | null;
  brandName: string;
  brandFounders?: HomepageFounderProfile[];
};

export function parseHomepageFounders(raw: unknown): HomepageFounderProfile[] {
  if (!Array.isArray(raw)) return [];
  const founders: HomepageFounderProfile[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const name = String(row.name ?? "").trim();
    if (!name) continue;
    const founder: HomepageFounderProfile = {
      roleBadge: String(row.roleBadge ?? "").trim(),
      name,
      title: String(row.title ?? "").trim(),
      bio: String(row.bio ?? ""),
      photoUrl: String(row.photoUrl ?? "").trim(),
    };
    const stat =
      row.statBadge && typeof row.statBadge === "object"
        ? (row.statBadge as { value?: unknown; label?: unknown })
        : null;
    const statValue = String(stat?.value ?? "").trim();
    const statLabel = String(stat?.label ?? "").trim();
    if (statValue && statLabel) {
      founder.statBadge = { value: statValue, label: statLabel };
    }
    founders.push(founder);
  }
  return founders;
}

export function isThemeDefaultFounder(founder: HomepageFounderProfile): boolean {
  const name = founder.name.trim().toLowerCase();
  if (!name || name === "founder name" || name === "name") return true;
  if (name === CENTER_LANDING_EDITOR_PLACEHOLDER_NAME.toLowerCase()) return true;
  // Stock Spark mentors only when still on Unsplash stock art — a replaced photo keeps the card.
  if (SPARK_STOCK_FOUNDER_NAMES.has(name) && founder.photoUrl.includes("unsplash.com")) return true;
  return false;
}

export function visiblePublicFounders(founders?: HomepageFounderProfile[]): HomepageFounderProfile[] {
  return (founders ?? []).filter((row) => !isThemeDefaultFounder(row));
}

/** Keep first occurrence of each person name (case-insensitive). */
export function uniqueFoundersByName(founders: HomepageFounderProfile[]): HomepageFounderProfile[] {
  const out: HomepageFounderProfile[] = [];
  const seen = new Set<string>();
  for (const row of founders) {
    const key = row.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/** Same mentor list the brand public homepage uses, minus Center sites placeholders. */
export function brandPublicFoundersFromLanding(
  theme: MarketingTheme,
  brandName: string,
  landing?: Partial<HomepageConfig>,
  logoUrl?: string | null
): HomepageFounderProfile[] {
  const config =
    theme === "spark-academy"
      ? mergeSparkAcademyLandingConfig(brandName, landing, logoUrl)
      : theme === "edu-learn"
        ? mergeEduLearnLandingConfig(brandName, landing, logoUrl)
        : theme === "abacus-classic"
          ? mergeAbacusClassicLandingConfig(brandName, landing, logoUrl)
          : buildBrandLandingConfig(brandName, landing, logoUrl);
  const saved = parseHomepageFounders(landing?.founders).filter((row) => !isThemeDefaultFounder(row));
  if (saved.length > 0) return saved;
  const merged = (config.founders ?? []).filter((row) => !isThemeDefaultFounder(row));
  if (merged.length > 0) return merged;
  const fromAbout = aboutMembersAsFounders(config.about?.members).filter((row) => !isThemeDefaultFounder(row));
  if (fromAbout.length > 0) return fromAbout;
  return [];
}

function founderCardTitle(ownerName: string, displayName: string | null, brandName: string): string {
  const siteName = publicCenterDisplayName(ownerName, displayName).trim();
  if (siteName && siteName.toLowerCase() !== ownerName.trim().toLowerCase()) return siteName;
  if (brandName.trim() && brandName.trim().toLowerCase() !== ownerName.trim().toLowerCase()) return brandName.trim();
  return "Franchise owner";
}

export function hasCenterFranchiserIdentity(identity: CenterFounderIdentity): boolean {
  const ownerName = identity.ownerName.trim();
  const photoUrl = identity.photoUrl?.trim() || "";
  if (photoUrl) return true;
  if (!ownerName) return false;
  const siteName = publicCenterDisplayName(ownerName, identity.displayName).trim().toLowerCase();
  const brandName = identity.brandName.trim().toLowerCase();
  const owner = ownerName.toLowerCase();
  if (owner === CENTER_LANDING_EDITOR_PLACEHOLDER_NAME.toLowerCase()) return false;
  if (owner === "founder name" || owner === "name") return false;
  return owner !== siteName && owner !== brandName;
}

function sameFounderName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Center public mentors: franchiser first, then brand Homepage mentors, then Center Site mentors. */
export function overlayCenterFoundersFromIdentity(
  config: HomepageConfig,
  identity: CenterFounderIdentity
): HomepageConfig {
  const ownerName = identity.ownerName.trim();
  const photoUrl = identity.photoUrl?.trim() || "";
  const brandFounders = (identity.brandFounders ?? []).filter((row) => !isThemeDefaultFounder(row));
  const centerFounders = visiblePublicFounders(config.founders);
  // Both lists stay — Center Site must not hide Homepage founders (or share their photos).
  const baseFounders = uniqueFoundersByName([...brandFounders, ...centerFounders]);

  if (!hasCenterFranchiserIdentity(identity)) {
    return { ...config, founders: baseFounders };
  }

  const name =
    ownerName ||
    baseFounders[0]?.name ||
    publicCenterDisplayName(ownerName, identity.displayName) ||
    identity.brandName;
  const franchiser: HomepageFounderProfile = {
    roleBadge: "FRANCHISE OWNER",
    name,
    title: founderCardTitle(name, identity.displayName, identity.brandName),
    bio: "",
    photoUrl,
  };
  const rest = baseFounders.filter((row) => !sameFounderName(row.name, name));
  return { ...config, founders: [franchiser, ...rest] };
}

/** Parent-facing enrollment landing for a center hostname (e.g. koramangala.abacusworld.localhost). */
export function buildCenterLandingConfig(
  centerName: string,
  brandName: string,
  city: string | null,
  partial?: Partial<HomepageConfig>,
  logoUrl?: string | null
): HomepageConfig {
  const base: Partial<HomepageConfig> = {
    meta: {
      siteName: centerName,
      fontSans: "Inter",
      fontSerif: "Instrument Serif",
      logoUrl: logoUrl ?? null,
    },
    nav: {
      links: [
        { label: "Why us", href: "#features" },
        { label: "Parent stories", href: "#testimonials" },
        { label: "FAQ", href: "#faq" },
      ],
      ctaLabel: "Book a free trial",
      ctaHref: "#enroll",
      adminHref: "/login",
    },
    hero: {
      line1: "Give your child",
      line1Serif: "math superpowers.",
      line2: "Fun abacus classes",
      line2Serif: city ? `in ${city}.` : "near you.",
      subtitle: `${centerName} helps children build speed, focus, and confidence with ${brandName}'s proven abacus program—small batches, caring instructors, and progress you can see every week.`,
      ctaLabel: "Book a free trial",
      ctaHref: "#enroll",
      backgroundImageUrl: DEFAULT_HOMEPAGE_CONFIG.hero.backgroundImageUrl,
      phoneFrameUrl: DEFAULT_HOMEPAGE_CONFIG.hero.phoneFrameUrl,
    },
    featureSections: [
      {
        id: "brain",
        title: "Stronger mental math,",
        titleSerif: "stronger focus.",
        body: "Abacus training activates both sides of the brain—kids visualize numbers, solve faster, and carry that focus into schoolwork.",
      },
      {
        id: "confidence",
        title: "Confidence that",
        titleSerif: "shows up daily.",
        body: "Level-based milestones and friendly competitions help shy learners speak up and proud parents see steady progress.",
      },
      {
        id: "small-batches",
        title: "Small batches,",
        titleSerif: "personal attention.",
        body: "We cap class sizes so every child gets corrections, encouragement, and homework support—not just a seat in the crowd.",
      },
      {
        id: "parents",
        title: "Parents stay",
        titleSerif: "in the loop.",
        body: "Clear progress reports, fee reminders, and class updates—so you always know what your child learned this week.",
      },
    ],
    privacy: {
      title: "Safe, structured learning.",
      body: `${centerName} is part of the ${brandName} network. Student data is protected with tenant isolation and audit trails—your family's information stays with our center.`,
    },
    testimonials: {
      title: "Parents love the progress",
      subtitle: "Families who started with a trial class and stayed for the journey.",
      items: [
        {
          quote:
            "Within two months my daughter was doing mental math faster than me. She actually looks forward to class now.",
          author: "Parent, Grade 3",
        },
        {
          quote: "The teachers are patient and the levels are clear—we always know what skill comes next.",
          author: "Parent, Koramangala",
        },
        {
          quote: "Best decision we made for exam season prep. Confidence went up, stress went down.",
          author: "Parent, Bengaluru",
        },
      ],
    },
    faq: [
      {
        question: "What age can my child start?",
        answer:
          "Most children begin between ages 5 and 12. Book a free trial and our instructor will recommend the right starting level.",
      },
      {
        question: "How long is each class?",
        answer:
          "Typical sessions are 60–90 minutes, once or twice per week, with short practice homework to build habit.",
      },
      {
        question: "Is the trial class really free?",
        answer:
          "Yes—no payment required for the trial. We'll assess your child's level and share batch options that fit your schedule.",
      },
      {
        question: "When does the next batch start?",
        answer:
          "New batches open every few weeks. Submit the form below and we'll call you with the nearest start date and timings.",
      },
    ],
    footerCta: {
      title: "Ready for your child's",
      subtitle: "free trial class? We'll reach out within one business day to confirm a slot.",
      ctaLabel: "Book a free trial",
      ctaHref: "#enroll",
    },
    footer: {
      productLinks: [
        { label: "Why abacus", href: "#features" },
        { label: "FAQ", href: "#faq" },
        { label: "Book a free trial", href: "#enroll" },
      ],
      companyLinks: [
        { label: "Staff login", href: "/login" },
        { label: "Center dashboard", href: "/app" },
      ],
      connectLinks: [],
      copyright: `© ${new Date().getFullYear()} ${centerName}. Part of ${brandName}.`,
      privacyHref: "#faq",
      termsHref: "#faq",
      refundHref: "/legal/refund",
    },
    ...partial,
  };

  const merged = mergeHomepageConfig(base);
  return {
    ...merged,
    featureSections: withDefaultFeatureVideos(merged.featureSections),
  };
}

/** Center enrollment landing merged with Spark Academy theme defaults. */
export function mergeSparkAcademyCenterLandingConfig(
  centerName: string,
  brandName: string,
  city: string | null,
  partial?: Partial<HomepageConfig>,
  logoUrl?: string | null
): HomepageConfig {
  const centerBase = buildCenterLandingConfig(centerName, brandName, city, partial, logoUrl);
  const sparkBase = buildSparkAcademyLandingPartial(centerName);

  return mergeHomepageConfig({
    ...sparkBase,
    ...centerBase,
    meta: {
      ...centerBase.meta,
      siteName: partial?.meta?.siteName ?? centerBase.meta.siteName,
      logoUrl: partial?.meta?.logoUrl ?? logoUrl ?? centerBase.meta.logoUrl ?? null,
    },
    nav: {
      ...sparkBase.nav!,
      ...centerBase.nav,
      links: partial?.nav?.links ?? centerBase.nav.links,
      ctaLabel: partial?.nav?.ctaLabel ?? centerBase.nav.ctaLabel,
      ctaHref: partial?.nav?.ctaHref ?? centerBase.nav.ctaHref,
      // Franchise apply is brand-only — never inherit Spark secondary / #apply CTAs on centers.
      secondaryCtaLabel: undefined,
      secondaryCtaHref: undefined,
    },
    hero: {
      ...sparkBase.hero!,
      ...centerBase.hero,
      line1: centerBase.hero.line1,
      line1Serif: centerBase.hero.line1Serif,
      line2: centerBase.hero.line2,
      line2Serif: centerBase.hero.line2Serif,
      subtitle: centerBase.hero.subtitle,
      ctaLabel: centerBase.hero.ctaLabel,
      ctaHref: centerBase.hero.ctaHref,
      secondaryCtaLabel: undefined,
      secondaryCtaHref: undefined,
    },
    featureSections: partial?.featureSections ?? centerBase.featureSections,
    featuresShowcase: {
      ...sparkBase.featuresShowcase!,
      ...partial?.featuresShowcase,
    },
    trustMedia: {
      ...sparkBase.trustMedia!,
      ...partial?.trustMedia,
      title: partial?.trustMedia?.title ?? `Why families choose ${centerName}`,
      titleHighlight: partial?.trustMedia?.titleHighlight ?? brandName,
      intro: partial?.trustMedia?.intro ?? centerBase.hero.subtitle,
      cards: partial?.trustMedia?.cards ?? sparkBase.trustMedia!.cards,
    },
    founders: limitSparkThemeDefaultMentors(partial?.founders) ?? sparkBase.founders,
    gallery: { ...sparkBase.gallery!, ...partial?.gallery, images: partial?.gallery?.images ?? sparkBase.gallery!.images },
    footerCta: { ...centerBase.footerCta, ...partial?.footerCta },
    footer: {
      ...centerBase.footer,
      ...partial?.footer,
      rich: { ...sparkBase.footer!.rich, ...partial?.footer?.rich, ...centerBase.footer.rich },
    },
    sections: mergeSparkAcademySectionVisibility(partial),
  });
}

/** Center enrollment landing merged with EduLearn theme defaults. */
export function mergeEduLearnCenterLandingConfig(
  centerName: string,
  brandName: string,
  city: string | null,
  partial?: Partial<HomepageConfig>,
  logoUrl?: string | null
): HomepageConfig {
  const centerBase = buildCenterLandingConfig(centerName, brandName, city, partial, logoUrl);
  const eduBase = buildEduLearnLandingPartial(centerName);

  return mergeHomepageConfig({
    ...eduBase,
    ...centerBase,
    meta: {
      ...centerBase.meta,
      siteName: partial?.meta?.siteName ?? centerBase.meta.siteName,
      logoUrl: partial?.meta?.logoUrl ?? logoUrl ?? centerBase.meta.logoUrl ?? null,
    },
    theme: {
      ...eduBase.theme!,
      ...centerBase.theme,
      ...partial?.theme,
      bgColor: "#f6f3ed",
    },
    nav: {
      ...eduBase.nav!,
      ...centerBase.nav,
      links: partial?.nav?.links ?? eduBase.nav!.links,
      ctaLabel: partial?.nav?.ctaLabel ?? "Get Started",
      ctaHref: partial?.nav?.ctaHref ?? "enroll",
      secondaryCtaLabel: undefined,
      secondaryCtaHref: undefined,
    },
    hero: {
      ...eduBase.hero!,
      ...centerBase.hero,
      line1: partial?.hero?.line1 ?? eduBase.hero!.line1,
      line1Serif: partial?.hero?.line1Serif ?? eduBase.hero!.line1Serif,
      line2: partial?.hero?.line2 ?? eduBase.hero!.line2,
      subtitle: centerBase.hero.subtitle,
      ctaLabel: "Get Started",
      ctaHref: "enroll",
      secondaryCtaLabel: undefined,
      secondaryCtaHref: undefined,
    },
    featureSections: partial?.featureSections ?? eduBase.featureSections,
    trustMedia: {
      ...eduBase.trustMedia!,
      ...partial?.trustMedia,
      cards: partial?.trustMedia?.cards ?? eduBase.trustMedia!.cards,
    },
    founders: limitSparkThemeDefaultMentors(partial?.founders) ?? eduBase.founders,
    programsSection: {
      ...eduBase.programsSection,
      ...partial?.programsSection,
      cards: partial?.programsSection?.cards ?? eduBase.programsSection?.cards,
    },
    faq: partial?.faq ?? eduBase.faq,
    testimonials: partial?.testimonials ?? eduBase.testimonials,
    upcomingEvents: partial?.upcomingEvents ?? eduBase.upcomingEvents,
    gallery: { ...eduBase.gallery!, ...partial?.gallery, images: partial?.gallery?.images ?? eduBase.gallery!.images },
    footerCta: {
      ...eduBase.footerCta!,
      ...partial?.footerCta,
      ctaHref: "enroll",
    },
    footer: {
      ...centerBase.footer,
      ...partial?.footer,
      rich: { ...eduBase.footer!.rich, ...partial?.footer?.rich, ...centerBase.footer.rich },
    },
    sections: mergeEduLearnSectionVisibility(partial),
  });
}

/** Center enrollment landing merged with Abacus Classic theme defaults. */
export function mergeAbacusClassicCenterLandingConfig(
  centerName: string,
  brandName: string,
  city: string | null,
  partial?: Partial<HomepageConfig>,
  logoUrl?: string | null
): HomepageConfig {
  const centerBase = buildCenterLandingConfig(centerName, brandName, city, partial, logoUrl);
  const abacusBase = mergeAbacusClassicLandingConfig(centerName, partial, logoUrl);

  return mergeHomepageConfig({
    ...abacusBase,
    meta: {
      ...abacusBase.meta,
      siteName: partial?.meta?.siteName ?? centerName,
      logoUrl: partial?.meta?.logoUrl ?? logoUrl ?? abacusBase.meta.logoUrl ?? null,
    },
    nav: {
      ...abacusBase.nav,
      links: partial?.nav?.links ?? centerBase.nav.links,
      ctaLabel: partial?.nav?.ctaLabel ?? centerBase.nav.ctaLabel,
      ctaHref: partial?.nav?.ctaHref ?? centerBase.nav.ctaHref,
      // Franchise apply is brand-only — never inherit Abacus secondary CTAs on centers.
      secondaryCtaLabel: undefined,
      secondaryCtaHref: undefined,
    },
    hero: {
      ...abacusBase.hero,
      line1: centerBase.hero.line1,
      line1Serif: centerBase.hero.line1Serif,
      line2: centerBase.hero.line2,
      line2Serif: centerBase.hero.line2Serif,
      subtitle: centerBase.hero.subtitle,
      ctaLabel: centerBase.hero.ctaLabel,
      ctaHref: centerBase.hero.ctaHref,
      badge: partial?.hero?.badge ?? abacusBase.hero.badge,
      secondaryCtaLabel: undefined,
      secondaryCtaHref: undefined,
    },
    featureSections: partial?.featureSections ?? centerBase.featureSections,
    programsSection: {
      ...abacusBase.programsSection,
      ...partial?.programsSection,
      cards: partial?.programsSection?.cards ?? abacusBase.programsSection?.cards,
    },
    testimonials: {
      ...abacusBase.testimonials,
      ...partial?.testimonials,
      title: partial?.testimonials?.title ?? centerBase.testimonials.title,
      subtitle: partial?.testimonials?.subtitle ?? centerBase.testimonials.subtitle,
    },
    faq: partial?.faq ?? centerBase.faq,
    footer: {
      ...abacusBase.footer,
      ...partial?.footer,
      copyright: partial?.footer?.copyright ?? `© ${new Date().getFullYear()} ${centerName}. Part of ${brandName}.`,
      rich: { ...abacusBase.footer.rich, ...partial?.footer?.rich },
    },
    sections: mergeAbacusClassicSectionVisibility(partial),
  });
}
