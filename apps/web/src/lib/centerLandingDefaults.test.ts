import { describe, expect, it } from "vitest";
import {
  buildCenterLandingConfig,
  mergeAbacusClassicCenterLandingConfig,
  mergeSparkAcademyCenterLandingConfig,
  mergeEduLearnCenterLandingConfig,
  overlayCenterFoundersFromIdentity,
  overlayCenterLandingIdentity,
  brandPublicFoundersFromLanding,
  isThemeDefaultFounder,
  publicCenterDisplayName,
  centerPublicCopyright,
} from "./centerLandingDefaults";

describe("buildCenterLandingConfig", () => {
  it("regression_parent_focused_enrollment_cta", () => {
    const config = buildCenterLandingConfig(
      "Abacus World Koramangala",
      "Abacus World",
      "Bengaluru"
    );
    expect(config.hero.ctaHref).toBe("#enroll");
    expect(config.nav.ctaLabel).toBe("Book a free trial");
    expect(config.nav.links.some((l) => l.label.toLowerCase() === "enroll")).toBe(false);
    expect(config.hero.ctaLabel).toBe(config.nav.ctaLabel);
    expect(config.footerCta.ctaLabel).toBe(config.nav.ctaLabel);
    expect(config.hero.subtitle).toContain("Abacus World Koramangala");
    expect(config.faq.some((f) => f.question.toLowerCase().includes("trial"))).toBe(true);
  });
});

describe("mergeAbacusClassicCenterLandingConfig", () => {
  it("uses abacus sections with center-local hero copy", () => {
    const config = mergeAbacusClassicCenterLandingConfig(
      "Smart Brain Pune",
      "Smart Brain Abacus",
      "Pune"
    );
    expect(config.sections?.programsGrid).toBe(true);
    expect(config.sections?.featureScroll).toBe(false);
    expect(config.hero.subtitle).toContain("Smart Brain Pune");
    expect(config.hero.subtitle).toContain("Pune");
    expect(config.programsSection?.eyebrow).toBe("WHAT WE TEACH");
    expect(config.trustMedia?.cards).toHaveLength(3);
  });

  it("regression_centerLandingOmitsFranchiseApplyCta", () => {
    const config = mergeAbacusClassicCenterLandingConfig(
      "Nilesh Gattani Center",
      "Smart Brain Abacus",
      "Pune",
      {
        nav: {
          links: [{ label: "Why us", href: "#features" }],
          ctaLabel: "Book a free trial",
          ctaHref: "#enroll",
          secondaryCtaLabel: "Apply franchise",
          secondaryCtaHref: "apply",
          adminHref: "/login",
        },
      }
    );

    expect(config.nav.secondaryCtaLabel).toBeUndefined();
    expect(config.nav.secondaryCtaHref).toBeUndefined();
    expect(config.hero.secondaryCtaLabel).toBeUndefined();
    expect(config.hero.secondaryCtaHref).toBeUndefined();
    expect(config.nav.ctaLabel).toBe("Book a free trial");
  });
});

describe("overlayCenterLandingIdentity", () => {
  it("regression_center_footer_replaces_sample_center_placeholder_with_franchise_name", () => {
    const config = mergeAbacusClassicCenterLandingConfig(
      "Sample Center",
      "Smart Brain Abacus",
      "your city",
      {
        footer: {
          productLinks: [],
          companyLinks: [],
          connectLinks: [],
          copyright: "© 2026 Sample Center. Part of Smart Brain Abacus.",
          privacyHref: "",
          termsHref: "",
          refundHref: "",
          rich: {
            description:
              "Sample Center is a premier education institute delivering abacus, Vedic maths, and handwriting programs.",
          },
        },
      }
    );

    const overlaid = overlayCenterLandingIdentity(config, "Smart Brain Abacus", "Smart Brain Abacus");
    expect(overlaid.footer.rich?.description).toBe(
      "Smart Brain Abacus is a premier education institute delivering abacus, Vedic maths, and handwriting programs."
    );
    expect(overlaid.footer.rich?.description).not.toContain("Sample Center");
    expect(overlaid.footer.copyright).toBe(centerPublicCopyright("Smart Brain Abacus", "Smart Brain Abacus"));
    expect(overlaid.footer.copyright).not.toMatch(/Part of/);
  });

  it("prefers display name over legal franchise name", () => {
    expect(publicCenterDisplayName("Legal LLC", "Smart Brain Abacus")).toBe("Smart Brain Abacus");
  });
});

describe("overlayCenterFoundersFromIdentity", () => {
  const brandOwner = {
    roleBadge: "FOUNDER & CEO",
    name: "Chetan Bhansali",
    title: "Smart Brain Abacus Education Pvt. Ltd.",
    bio: "Brand story",
    photoUrl: "https://cdn.example/brand-founder.jpg",
  };
  const sparkStock = {
    roleBadge: "Mentor",
    name: "Sarah Johnson",
    title: "AI Expert & Data Scientist",
    bio: "",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=480&h=600&q=80",
  };

  it("regression_center_mentors_show_franchiser_first_then_brand_founder", () => {
    const config = mergeAbacusClassicCenterLandingConfig("Sample Center", "Smart Brain Abacus", "Pune");
    const overlaid = overlayCenterFoundersFromIdentity(config, {
      ownerName: "Bhavana Soni",
      photoUrl: "https://cdn.example/bhavana.jpg",
      displayName: "Shree Samarth Smart Brain Abacus",
      brandName: "Shree Samarth Smart Brain Abacus",
      brandFounders: [brandOwner, sparkStock],
    });

    expect(overlaid.founders?.map((row) => row.name)).toEqual(["Bhavana Soni", "Chetan Bhansali"]);
    expect(overlaid.founders?.[0]?.photoUrl).toBe("https://cdn.example/bhavana.jpg");
    expect(overlaid.founders?.[0]?.title).toBe("Shree Samarth Smart Brain Abacus");
    expect(overlaid.founders?.[1]?.photoUrl).toBe("https://cdn.example/brand-founder.jpg");
    expect(overlaid.founders?.some((row) => row.name === "Founder name")).toBe(false);
    expect(overlaid.founders?.some((row) => row.name === "Sarah Johnson")).toBe(false);
  });

  it("regression_center_mentors_brand_owner_first_when_franchiser_missing", () => {
    const config = mergeAbacusClassicCenterLandingConfig("Sample Center", "Smart Brain Abacus", "Pune");
    const overlaid = overlayCenterFoundersFromIdentity(config, {
      ownerName: "Shree Samarth Smart Brain Abacus",
      photoUrl: null,
      displayName: "Shree Samarth Smart Brain Abacus",
      brandName: "Shree Samarth Smart Brain Abacus",
      brandFounders: [brandOwner],
    });

    expect(overlaid.founders?.map((row) => row.name)).toEqual(["Chetan Bhansali"]);
    expect(overlaid.founders?.[0]?.photoUrl).toBe("https://cdn.example/brand-founder.jpg");
  });

  it("regression_center_site_mentor_photo_shows_on_franchise_public", () => {
    const config = mergeAbacusClassicCenterLandingConfig("Sample Center", "Smart Brain Abacus", "Pune", {
      founders: [
        {
          roleBadge: "Mentor",
          name: "Priya Sharma",
          title: "Lead instructor",
          bio: "",
          photoUrl: "https://cdn.example/center-mentor.jpg",
        },
      ],
    });
    const overlaid = overlayCenterFoundersFromIdentity(config, {
      ownerName: "Bhavana Soni",
      photoUrl: "https://cdn.example/bhavana.jpg",
      displayName: "Shree Samarth Smart Brain Abacus",
      brandName: "Shree Samarth Smart Brain Abacus",
      brandFounders: [brandOwner],
    });

    expect(overlaid.founders?.map((row) => row.name)).toEqual([
      "Bhavana Soni",
      "Chetan Bhansali",
      "Priya Sharma",
    ]);
    expect(overlaid.founders?.[1]?.photoUrl).toBe("https://cdn.example/brand-founder.jpg");
    expect(overlaid.founders?.[2]?.photoUrl).toBe("https://cdn.example/center-mentor.jpg");
  });

  it("regression_franchise_mentors_keep_homepage_founder_and_center_mentor", () => {
    const config = mergeAbacusClassicCenterLandingConfig("Sample Center", "Smart Brain Abacus", "Pune", {
      founders: [
        {
          roleBadge: "MENTOR",
          name: "Raunak Rathi",
          title: "GP",
          bio: "",
          photoUrl: "https://cdn.example/center-raunak.jpg",
        },
      ],
    });
    const overlaid = overlayCenterFoundersFromIdentity(config, {
      ownerName: "Gayatri Shankar Pare",
      photoUrl: "https://cdn.example/gayatri.jpg",
      displayName: "GP Tutorials & Smart Brain Abacus",
      brandName: "Smart Brain Abacus",
      brandFounders: [
        {
          roleBadge: "FOUNDER & CEO",
          name: "Bhavana Soni",
          title: "Smart Brain Abacus Education Pvt. Ltd.",
          bio: "",
          photoUrl: "https://cdn.example/homepage-bhavana.jpg",
        },
      ],
    });

    expect(overlaid.founders?.map((row) => row.name)).toEqual([
      "Gayatri Shankar Pare",
      "Bhavana Soni",
      "Raunak Rathi",
    ]);
    expect(overlaid.founders?.[1]?.photoUrl).toBe("https://cdn.example/homepage-bhavana.jpg");
    expect(overlaid.founders?.[2]?.photoUrl).toBe("https://cdn.example/center-raunak.jpg");
  });

  it("regression_center_site_placeholder_mentor_falls_back_to_brand", () => {
    const config = mergeAbacusClassicCenterLandingConfig("Sample Center", "Smart Brain Abacus", "Pune", {
      founders: [
        {
          roleBadge: "FOUNDER",
          name: "Founder name",
          title: "Sample Center Education Pvt. Ltd.",
          bio: "",
          photoUrl: "https://cdn.example/ignored.jpg",
        },
      ],
    });
    const overlaid = overlayCenterFoundersFromIdentity(config, {
      ownerName: "Bhavana Soni",
      photoUrl: "https://cdn.example/bhavana.jpg",
      displayName: "Shree Samarth",
      brandName: "Smart Brain Abacus",
      brandFounders: [brandOwner],
    });

    expect(overlaid.founders?.map((row) => row.name)).toEqual(["Bhavana Soni", "Chetan Bhansali"]);
    expect(overlaid.founders?.[1]?.photoUrl).toBe("https://cdn.example/brand-founder.jpg");
  });

  it("regression_brand_public_founders_use_saved_homepage_mentors", () => {
    const founders = brandPublicFoundersFromLanding("spark-academy", "Shree Samarth Smart Brain Abacus", {
      founders: [
        {
          roleBadge: "FOUNDER",
          name: "Chetan Bhansali",
          title: "Brand owner",
          bio: "",
          photoUrl: "https://cdn.example/brand-founder.jpg",
        },
      ],
    });
    expect(founders.map((row) => row.name)).toEqual(["Chetan Bhansali"]);
  });

  it("regression_brand_founders_omit_founder_name_placeholder_even_with_photo", () => {
    const founders = brandPublicFoundersFromLanding("abacus-classic", "Smart Brain Abacus", {
      founders: [
        {
          roleBadge: "FOUNDER & CEO",
          name: "Founder name",
          title: "Smart Brain Abacus Education Pvt. Ltd.",
          bio: "",
          photoUrl: "https://cdn.example/brand-founder.jpg",
        },
      ],
    });
    expect(founders).toEqual([]);
  });

  it("regression_real_name_with_sample_center_title_still_shows", () => {
    expect(
      isThemeDefaultFounder({
        roleBadge: "MENTOR",
        name: "Raunak Rathi",
        title: "Sample Center Education Pvt. Ltd.",
        bio: "",
        photoUrl: "https://cdn.example/raunak.jpg",
      })
    ).toBe(false);
  });
});

const CENTER_UPCOMING_EVENTS_PARTIAL = {
  upcomingEvents: {
    eyebrow: "EVENTS",
    title: "Franchise workshops",
    items: [
      {
        type: "workshop" as const,
        title: "Open house",
        startDate: "2026-12-15",
        description: "Meet the team",
        location: "Pune",
        imageUrl: "https://example.supabase.co/storage/v1/object/public/brand-assets/brand-1/marketing/center-event-0/asset.jpg",
        ctaLabel: "Book",
        ctaHref: "enroll",
      },
    ],
  },
  sections: { upcomingEvents: true },
};

describe("center landing upcoming events", () => {
  it("regression_center_landing_keeps_upcoming_event_cover_on_franchise_merge", () => {
    const spark = mergeSparkAcademyCenterLandingConfig(
      "Smart Brain Pune",
      "Smart Brain Abacus",
      "Pune",
      CENTER_UPCOMING_EVENTS_PARTIAL
    );
    const abacus = mergeAbacusClassicCenterLandingConfig(
      "Smart Brain Pune",
      "Smart Brain Abacus",
      "Pune",
      CENTER_UPCOMING_EVENTS_PARTIAL
    );
    const edu = mergeEduLearnCenterLandingConfig(
      "Smart Brain Pune",
      "Smart Brain Abacus",
      "Pune",
      CENTER_UPCOMING_EVENTS_PARTIAL
    );

    for (const config of [spark, abacus, edu]) {
      expect(config.upcomingEvents?.items?.[0]?.title).toBe("Open house");
      expect(config.upcomingEvents?.items?.[0]?.imageUrl).toContain("center-event-0");
      expect(config.sections?.upcomingEvents).toBe(true);
    }
  });
});
