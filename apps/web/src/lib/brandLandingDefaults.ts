import { mergeHomepageConfig } from "@/lib/homepageApi";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { ABACUS_CLASSIC_SECTION_DEFAULTS, EDU_LEARN_SECTION_DEFAULTS, SPARK_ACADEMY_SECTION_DEFAULTS, mergeAbacusClassicSectionVisibility, mergeEduLearnSectionVisibility, mergeSectionVisibility, mergeSparkAcademySectionVisibility } from "@/lib/homepageSections";
import { withDefaultFeatureVideos } from "@/lib/marketingFeatureSections";
import { mergeAboutSection } from "@/lib/aboutUs";
import type { HomepageConfig, HomepageFounderProfile } from "@/types/homepage";

const SPARK_FOOTER_PHONE = "(222) 545-4543";

/** Spark Academy Unsplash stock names — editor keeps one example so staff see how to fill a card. */
export const SPARK_STOCK_FOUNDER_NAMES = new Set([
  "sarah johnson",
  "michael brown",
  "rachel adams",
  "maria lopez",
  "david chen",
]);

function isSparkStockFounder(founder: HomepageFounderProfile): boolean {
  return (
    SPARK_STOCK_FOUNDER_NAMES.has(founder.name.trim().toLowerCase()) &&
    (founder.photoUrl ?? "").includes("unsplash.com")
  );
}

/** Drop extra Spark Unsplash placeholders. Custom mentors and add/update/delete stay intact. */
export function limitSparkThemeDefaultMentors(
  founders: HomepageFounderProfile[] | undefined
): HomepageFounderProfile[] | undefined {
  if (!founders || founders.length <= 1) return founders;
  let keptStock = false;
  return founders.filter((founder) => {
    if (!isSparkStockFounder(founder)) return true;
    if (keptStock) return false;
    keptStock = true;
    return true;
  });
}

/** Franchise-recruitment landing defaults for a brand hostname (e.g. abacusworld.localhost). */
export function buildBrandLandingConfig(
  brandName: string,
  partial?: Partial<HomepageConfig>,
  logoUrl?: string | null
): HomepageConfig {
  const base: Partial<HomepageConfig> = {
    meta: {
      siteName: brandName,
      fontSans: "Inter",
      fontSerif: "Instrument Serif",
      logoUrl: logoUrl ?? null,
    },
    nav: {
      links: [
        { label: "Why franchise", href: "#features" },
        { label: "About", href: "/about" },
        { label: "Success stories", href: "#testimonials" },
        { label: "FAQ", href: "#faq" },
        { label: "Apply", href: "#apply" },
      ],
      ctaLabel: "Apply now",
      ctaHref: "#apply",
      adminHref: "/login",
    },
    hero: {
      line1: "Own an",
      line1Serif: `${brandName} center.`,
      line2: "Build a legacy in",
      line2Serif: "your city.",
      subtitle: `Join the ${brandName} franchise network—proven curriculum, center launch playbooks, and technology that keeps operations calm as you scale.`,
      ctaLabel: "Apply now",
      ctaHref: "#apply",
      backgroundImageUrl: DEFAULT_HOMEPAGE_CONFIG.hero.backgroundImageUrl,
      phoneFrameUrl: DEFAULT_HOMEPAGE_CONFIG.hero.phoneFrameUrl,
    },
    featureSections: [
      {
        id: "curriculum",
        title: "Curriculum that",
        titleSerif: "parents trust.",
        body: "Structured levels, assessments, and instructor guides—versioned centrally so every center delivers the same quality.",
      },
      {
        id: "launch",
        title: "Launch faster with",
        titleSerif: "playbooks.",
        body: "Site selection checklists, hiring templates, and marketing kits so your center opens with momentum—not guesswork.",
      },
      {
        id: "ops",
        title: "Operations without",
        titleSerif: "spreadsheet chaos.",
        body: "Admissions, batches, fees, and parent communication in one system built for multi-center franchises.",
      },
      {
        id: "growth",
        title: "Grow with",
        titleSerif: "visibility.",
        body: "Brand dashboards for royalties, center health, and enrollment trends—act on signal, not anecdotes.",
      },
    ],
    privacy: {
      title: "Built for trust.",
      body: `${brandName} runs on EduNudg with tenant isolation, row-level security, and audit trails—your student and financial data stays scoped to your centers.`,
    },
    testimonials: {
      title: "Franchise partners speak",
      subtitle: "Operators who chose the network—and stayed for the support.",
      items: [
        {
          quote: `We opened our first ${brandName} center in under 90 days. The curriculum and ops tooling removed months of trial and error.`,
          author: "Franchise Partner, Bengaluru",
        },
        {
          quote: "Parents see progress clearly; our team spends time teaching, not chasing reports.",
          author: "Center Director",
        },
        {
          quote: "Royalty and enrollment visibility finally match how we actually run the business.",
          author: "Multi-center Operator",
        },
      ],
    },
    faq: [
      {
        question: "What investment is required?",
        answer:
          "Investment varies by city and center format. Submit the form below and our franchise team will share the latest kit, fee structure, and timeline.",
      },
      {
        question: "Do I need prior education industry experience?",
        answer:
          "Many partners come from business backgrounds. We provide instructor training, curriculum, and launch support—you bring local relationships and execution.",
      },
      {
        question: "How long until I can open?",
        answer:
          "Typical partners target 60–120 days from agreement to first cohort, depending on site readiness and hiring.",
      },
      {
        question: "What territories are available?",
        answer:
          "Territories are allocated by city and catchment. Mention your preferred location in the application and we will confirm availability.",
      },
    ],
    footerCta: {
      title: "Ready to bring",
      subtitle: `${brandName} to your community? Tell us about yourself—we respond within two business days.`,
      ctaLabel: "Apply now",
      ctaHref: "#apply",
    },
    footer: {
      productLinks: [
        { label: "Why franchise", href: "#features" },
        { label: "FAQ", href: "#faq" },
        { label: "Apply", href: "#apply" },
      ],
      companyLinks: [
        { label: "Partner login", href: "/login" },
        { label: "Brand portal", href: "/app" },
      ],
      connectLinks: [],
      copyright: `© ${new Date().getFullYear()} ${brandName}. Powered by EduNudg.`,
      privacyHref: "/legal/privacy",
      termsHref: "/legal/terms",
      refundHref: "/legal/refund",
      rich: {
        brandStats: { franchiseCount: "12+", studentCount: "5k+" },
        presence: [{ region: "India", cities: ["Your city"] }],
      },
    },
    ...partial,
  };

  const merged = mergeHomepageConfig(base);
  return {
    ...merged,
    featureSections: withDefaultFeatureVideos(merged.featureSections),
    about: mergeAboutSection(brandName, partial?.about ?? merged.about),
  };
}

/** Default landing content for Abacus Classic theme brands. */
export function buildAbacusClassicLandingPartial(brandName: string): Partial<HomepageConfig> {
  return {
    meta: {
      siteName: brandName,
      fontSans: "Inter",
      fontSerif: "Instrument Serif",
    },
    theme: {
      bgColor: "#f5f7fb",
      accent: "#1e40af",
      muted: "#64748b",
      ctaBg: "#facc15",
      ctaFg: "#1a1a1a",
      yellowGlow: "#facc15",
      radiusSection: "1rem",
    },
    nav: {
      links: [
        { label: "Programs", href: "#programs" },
        { label: "Why us", href: "#features" },
        { label: "About", href: "/about" },
        { label: "Leadership", href: "#founders" },
        { label: "FAQ", href: "#faq" },
      ],
      ctaLabel: "Book free demo",
      ctaHref: "enroll",
      secondaryCtaLabel: "Apply franchise",
      secondaryCtaHref: "apply",
      adminHref: "/login",
    },
    hero: {
      line1: "Make children super fast in",
      line1Serif: "maths.",
      line2: "",
      line2Serif: "",
      subtitle: `Start your own educational center with low investment and build a trusted ${brandName} learning community.`,
      ctaLabel: "Book free demo",
      ctaHref: "enroll",
      secondaryCtaLabel: "Apply franchise",
      secondaryCtaHref: "apply",
      badge: "FOR AGED 6–14 YEARS",
      backgroundImageUrl: "",
      phoneFrameUrl: "",
    },
    about: mergeAboutSection(brandName),
    featureSections: [
      {
        id: "levels",
        title: "Complete abacus in",
        titleSerif: "4 levels.",
        body: "Structured progression from foundations to competition-ready mental math.",
      },
      {
        id: "vedic",
        title: "Vedic maths techniques",
        titleSerif: "included.",
        body: "Speed tricks and tables mastery bundled with the abacus program.",
      },
      {
        id: "competition",
        title: "National level",
        titleSerif: "competitions.",
        body: "Students compete annually with scholarships and recognition.",
      },
      {
        id: "franchise",
        title: "Low investment",
        titleSerif: "franchise.",
        body: "Teacher training, business training, and lifetime support from launch to success.",
      },
    ],
    trustMedia: {
      eyebrow: "MEDIA RECOGNITION",
      title: "Why families trust",
      titleHighlight: brandName,
      intro: `${brandName} delivers holistic cognitive development with certified instructors and a proven curriculum.`,
      youtubeUrl: "",
      cards: [
        {
          title: "50,000+ students trained",
          subtitle: "Growing network of learners across India.",
          accentColor: "#2563eb",
        },
        {
          title: "Lightning fast calculations",
          subtitle: "Students solve complex sums mentally in seconds.",
          accentColor: "#eab308",
        },
        {
          title: "National competitions",
          subtitle: "Prestigious prizes and scholarships for top rankers.",
          accentColor: "#22c55e",
        },
      ],
    },
    founders: [
      {
        roleBadge: "FOUNDER & CEO",
        name: "Founder name",
        title: `${brandName} Education Pvt. Ltd.`,
        bio: `Share your story — how ${brandName} started and the impact you create for children and franchise partners.`,
        photoUrl: "",
        statBadge: { value: "12+", label: "YEARS OF LEGACY" },
      },
    ],
    gallery: {
      title: "Moments from our journey",
      images: [],
    },
    programsSection: {
      eyebrow: "WHAT WE TEACH",
      title: "World-Class Brain Development",
      defaultScholarshipHighlight: "1 Lakh Success Scholarship!",
      cards: [
        {
          id: "program-abacus",
          name: "Abacus (Mental Math)",
          description: "Make children super fast in maths and boost their memory and confidence.",
          ageLabel: "Age 6–14",
          benefits: [
            "Kids become superfast in math",
            "Recite tables 2 to 99 without memorising",
            "Stay ahead in the subject of math",
            "Better focus, memory and confidence",
            "Excel in competitive exams",
          ],
        },
        {
          id: "program-vedic",
          name: "Vedic Mathematics",
          description: "10x faster maths techniques using ancient tricks and shortcuts.",
          ageLabel: "8th to 10th Std",
          benefits: ["Speed tricks for board exams", "Pattern-based problem solving", "Stronger number sense"],
        },
        {
          id: "program-handwriting",
          name: "Handwriting",
          description: "Marathi and English handwriting improvement for better academic performance.",
          ageLabel: "Age 6–14",
          benefits: ["Neater notebooks and exams", "Marathi and English scripts", "Better teacher feedback"],
        },
      ],
    },
    testimonials: {
      title: "Success stories",
      subtitle: "Parents and partners who chose our program.",
      items: [],
    },
    faq: [
      {
        question: "What age group is suitable for abacus?",
        answer: "Abacus learning is suitable for children aged 4–14, with structured levels for every stage.",
      },
      {
        question: "Do you offer online classes?",
        answer: "Yes — many centers offer online and offline batches. Submit a demo request to find a center near you.",
      },
      {
        question: "What investment is required for a franchise?",
        answer: "Investment varies by city and format. Apply for franchise and our team will share the latest kit and fee structure.",
      },
    ],
    footer: {
      productLinks: [
        { label: "Programs", href: "#programs" },
        { label: "Why us", href: "#features" },
        { label: "FAQ", href: "#faq" },
      ],
      companyLinks: [
        { label: "Partner login", href: "/login" },
        { label: "Brand portal", href: "/app" },
      ],
      connectLinks: [],
      copyright: `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`,
      privacyHref: "/legal/privacy",
      termsHref: "/legal/terms",
      refundHref: "/legal/refund",
      rich: {
        description: `${brandName} is a premier education institute delivering abacus, Vedic maths, and handwriting programs.`,
        badges: [{ label: "ISO 9001:2015 Certified" }, { label: "Est. 2013" }],
        customStats: [],
        brandStats: { franchiseCount: "2+", studentCount: "5k+" },
        presence: [{ region: "Maharashtra & Goa", cities: ["Pune", "Satara", "Sangli"] }],
        headOffice: {
          address: "Head office address",
          phone: "+91 00000 00000",
          website: "www.example.com",
        },
        socialLinks: [],
      },
    },
    sections: mergeSectionVisibility(undefined, ABACUS_CLASSIC_SECTION_DEFAULTS),
  };
}

export function mergeAbacusClassicLandingConfig(
  brandName: string,
  partial?: Partial<HomepageConfig>,
  logoUrl?: string | null
): HomepageConfig {
  const base = buildAbacusClassicLandingPartial(brandName);
  return mergeHomepageConfig({
    ...base,
    ...partial,
    meta: {
      siteName: partial?.meta?.siteName ?? base.meta!.siteName,
      fontSans: partial?.meta?.fontSans ?? base.meta!.fontSans,
      fontSerif: partial?.meta?.fontSerif ?? base.meta!.fontSerif,
      themeNote: partial?.meta?.themeNote ?? base.meta!.themeNote,
      logoUrl: partial?.meta?.logoUrl ?? logoUrl ?? null,
    },
    nav: { ...base.nav!, ...partial?.nav, links: partial?.nav?.links ?? base.nav!.links },
    hero: { ...base.hero!, ...partial?.hero },
    featureSections: partial?.featureSections ?? base.featureSections,
    trustMedia: {
      ...base.trustMedia!,
      ...partial?.trustMedia,
      cards: partial?.trustMedia?.cards ?? base.trustMedia!.cards,
    },
    founders: limitSparkThemeDefaultMentors(partial?.founders) ?? base.founders,
    upcomingEvents: partial?.upcomingEvents ?? base.upcomingEvents,
    gallery: { ...base.gallery!, ...partial?.gallery, images: partial?.gallery?.images ?? base.gallery!.images },
    programsSection: {
      ...base.programsSection!,
      ...partial?.programsSection,
      cards: partial?.programsSection?.cards ?? base.programsSection!.cards,
    },
    footer: {
      ...base.footer!,
      ...partial?.footer,
      rich: { ...base.footer!.rich, ...partial?.footer?.rich },
    },
    about: mergeAboutSection(brandName, partial?.about ?? base.about),
    sections: mergeAbacusClassicSectionVisibility(partial),
  });
}

/** Default landing content for Spark Academy (Educat-style) theme brands. */
export function buildSparkAcademyLandingPartial(brandName: string): Partial<HomepageConfig> {
  return {
    meta: {
      siteName: brandName,
      fontSans: "Inter",
      fontSerif: "Inter",
    },
    theme: {
      bgColor: "#ffffff",
      accent: "#3b82f6",
      muted: "#64748b",
      ctaBg: "#0f172a",
      ctaFg: "#ffffff",
      yellowGlow: "#facc15",
      radiusSection: "1rem",
    },
    nav: {
      links: [
        { label: "Courses", href: "#programs" },
        { label: "Features", href: "#features" },
        { label: "About", href: "/about" },
        { label: "FAQ", href: "#faq" },
        { label: "Contact", href: "#apply" },
      ],
      ctaLabel: "Get started",
      ctaHref: "enroll",
      secondaryCtaLabel: "Apply franchise",
      secondaryCtaHref: "apply",
      adminHref: "/login",
    },
    hero: {
      line1: "Shape your future with",
      line1Serif: "the right knowledge.",
      line2: "",
      line2Serif: "",
      subtitle: `Join ${brandName} — proven curriculum, expert mentors, and a learning path designed for real outcomes.`,
      ctaLabel: "Get started",
      ctaHref: "enroll",
      secondaryCtaLabel: "Apply franchise",
      secondaryCtaHref: "apply",
      backgroundImageUrl: DEFAULT_HOMEPAGE_CONFIG.hero.backgroundImageUrl,
      phoneFrameUrl: DEFAULT_HOMEPAGE_CONFIG.hero.phoneFrameUrl,
    },
    featureSections: [
      {
        id: "curriculum",
        title: "Structured curriculum",
        titleSerif: "parents trust.",
        body: "Level-based progression with assessments and instructor guides—consistent quality at every center.",
      },
      {
        id: "mentors",
        title: "Expert mentors",
        titleSerif: "every step.",
        body: "Certified instructors who combine teaching skill with the patience children need to thrive.",
      },
      {
        id: "flexible",
        title: "Flexible learning",
        titleSerif: "formats.",
        body: "Online and in-center batches so families can choose what fits their schedule.",
      },
      {
        id: "progress",
        title: "Progress you",
        titleSerif: "can see.",
        body: "Clear milestones, competitions, and parent updates—so improvement never feels invisible.",
      },
    ],
    featuresShowcase: {
      imageUrl: "",
      eyebrow: "Our Key Features",
      title: "Powerful Features for Your Learning Journey",
      subtitle:
        "From personalized recommendations to interactive content, we've got everything you need to succeed.",
      floatStatsLabel: "Last month",
      floatStatsValue: "25.20%",
      floatProgressLabel: "Learning Progress",
      floatProgressValue: "55%",
    },
    trustMedia: {
      eyebrow: "Our Success",
      title: "Our Journey to",
      titleHighlight: "Excellence",
      intro:
        "At the core of our platform is a commitment to helping each student succeed. We take pride in the tangible results our learners achieve.",
      youtubeUrl: "",
      imageUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=480&h=600&q=80",
      highlightLabel: "Our Investment Fund Raised",
      highlightPrimary: "1000+",
      highlightSecondary: "20+",
      highlightCaption: "Top mentors around the globe",
      cards: [
        {
          title: "2 Million Learners",
          subtitle:
            "With over 2 million learners worldwide, our platform has become a trusted destination for individuals.",
          accentColor: "#3b82f6",
        },
        {
          title: "500k+ 5 Star Feedbacks",
          subtitle:
            "With an outstanding 5-star rating across our courses, our learners consistently praise the quality and impact of our content.",
          accentColor: "#3b82f6",
        },
        {
          title: "40+ Awards Won Globally",
          subtitle:
            "With over 40 prestigious awards to our name, we are recognized for excellence in education and innovation.",
          accentColor: "#3b82f6",
        },
      ],
    },
    founders: [
      {
        roleBadge: "Mentor",
        name: "Sarah Johnson",
        title: "AI Expert & Data Scientist",
        bio: "",
        photoUrl:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=480&h=600&q=80",
      },
    ],
    gallery: {
      title: "Photo gallery",
      images: [],
    },
    testimonials: {
      title: "What Our Learners Are Saying",
      subtitle:
        "Hear directly from our students about how our courses have transformed their careers and lives.",
      items: [
        {
          quote:
            "This platform helped me land my dream job in data science. The courses were practical and easy",
          author: "John Matthews",
          role: "Product Designer",
          avatarUrl:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&h=96&q=80",
        },
        {
          quote:
            "I never thought I could start a business, but the entrepreneurship course gave me the confidence",
          author: "Sarah Lee",
          role: "Product Manager",
          avatarUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80",
        },
        {
          quote:
            "The flexibility of the courses allowed me to learn at my own pace while managing my job. Highly recommend",
          author: "Michael Davis",
          role: "Marketer",
          avatarUrl:
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=96&h=96&q=80",
        },
        {
          quote:
            "I gained valuable insights into digital marketing that helped me grow my online business. Thank you",
          author: "David Harris",
          role: "Graphics Designer",
          avatarUrl:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&h=96&q=80",
        },
        {
          quote:
            "The UX/UI design course was fantastic! It gave me the skills I needed to advance in my career.",
          author: "Jessica Wilson",
          role: "UI/UX Designer",
          avatarUrl:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&h=96&q=80",
        },
        {
          quote:
            "This platform not only taught me new skills but also inspired me to keep learning and growing every day.",
          author: "Laura Martinez",
          role: "Data Scientist",
          avatarUrl:
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&h=96&q=80",
        },
      ],
    },
    faq: [
      {
        question: "What age group is suitable?",
        answer: "Programs are designed for children aged 4–14, with structured levels for every stage.",
      },
      {
        question: "Do you offer online classes?",
        answer: "Yes — many centers offer online and offline batches. Book a demo to find a center near you.",
      },
      {
        question: "What investment is required for a franchise?",
        answer: "Investment varies by city and format. Apply and our team will share the latest kit and fee structure.",
      },
    ],
    footerCta: {
      title: "Start Your Learning Journey Today!",
      subtitle: "Browse courses and unlock new skills to reach your goals.",
      ctaLabel: "Login",
      ctaHref: "enroll",
    },
    footer: {
      productLinks: [
        { label: "Courses", href: "#programs" },
        { label: "Shop", href: "#programs" },
        { label: "Contact Us", href: "#apply" },
      ],
      companyLinks: [
        { label: "Partner login", href: "/login" },
        { label: "Brand portal", href: "/app" },
      ],
      connectLinks: [{ label: "Contact", href: "#apply" }],
      copyright: `Copyright © ${new Date().getFullYear()} ${brandName}, All Rights Reserved.`,
      privacyHref: "/legal/privacy",
      termsHref: "/legal/terms",
      refundHref: "/legal/refund",
      rich: {
        description: `${brandName} delivers structured learning programs with certified instructors and proven outcomes.`,
        badges: [{ label: "Trusted partner" }],
        customStats: [
          { value: "100%", label: "Satisfaction rate" },
          { value: "12+", label: "Years of experience" },
          { value: "20k+", label: "Total Courses" },
          { value: "90+", label: "Course Category" },
        ],
        brandStats: { franchiseCount: "300+", studentCount: "20M+" },
        presence: [{ region: "India", cities: ["Pune", "Mumbai", "Bengaluru"] }],
        headOffice: {
          address: "Head office address",
          phone: SPARK_FOOTER_PHONE,
          website: "www.example.com",
        },
        socialLinks: [],
      },
    },
    about: mergeAboutSection(brandName),
    sections: mergeSectionVisibility(undefined, SPARK_ACADEMY_SECTION_DEFAULTS),
  };
}

export function mergeSparkAcademyLandingConfig(
  brandName: string,
  partial?: Partial<HomepageConfig>,
  logoUrl?: string | null
): HomepageConfig {
  const base = buildSparkAcademyLandingPartial(brandName);
  return mergeHomepageConfig({
    ...base,
    ...partial,
    meta: {
      siteName: partial?.meta?.siteName ?? base.meta!.siteName,
      fontSans: partial?.meta?.fontSans ?? base.meta!.fontSans,
      fontSerif: partial?.meta?.fontSerif ?? base.meta!.fontSerif,
      themeNote: partial?.meta?.themeNote ?? base.meta!.themeNote,
      logoUrl: partial?.meta?.logoUrl ?? logoUrl ?? null,
    },
    nav: { ...base.nav!, ...partial?.nav, links: partial?.nav?.links ?? base.nav!.links },
    hero: { ...base.hero!, ...partial?.hero },
    featureSections: partial?.featureSections ?? base.featureSections,
    featuresShowcase: {
      ...base.featuresShowcase!,
      ...partial?.featuresShowcase,
    },
    trustMedia: {
      ...base.trustMedia!,
      ...partial?.trustMedia,
      cards: partial?.trustMedia?.cards ?? base.trustMedia!.cards,
    },
    founders: limitSparkThemeDefaultMentors(partial?.founders) ?? base.founders,
    upcomingEvents: partial?.upcomingEvents ?? base.upcomingEvents,
    gallery: { ...base.gallery!, ...partial?.gallery, images: partial?.gallery?.images ?? base.gallery!.images },
    footerCta: { ...base.footerCta!, ...partial?.footerCta },
    footer: {
      ...base.footer!,
      ...partial?.footer,
      rich: { ...base.footer!.rich, ...partial?.footer?.rich },
    },
    about: mergeAboutSection(brandName, partial?.about ?? base.about),
    sections: mergeSparkAcademySectionVisibility(partial),
  });
}

const EDU_LEARN_HERO =
  "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=900&h=1200&q=80";
const EDU_LEARN_ACCENT =
  "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=640&h=420&q=80";
const EDU_LEARN_STATS =
  "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=900&h=1100&q=80";

/** Default landing content for the EduLearn (green/orange) marketing theme. */
export function buildEduLearnLandingPartial(brandName: string): Partial<HomepageConfig> {
  return {
    meta: {
      siteName: brandName,
      fontSans: "Inter",
      fontSerif: "Inter",
    },
    theme: {
      bgColor: "#f6f3ed",
      accent: "#f9a825",
      muted: "#5b6168",
      ctaBg: "#f9a825",
      ctaFg: "#ffffff",
      yellowGlow: "#f9a825",
      radiusSection: "1.25rem",
    },
    nav: {
      links: [
        { label: "Courses", href: "#programs" },
        { label: "Features", href: "#features" },
        { label: "About us", href: "/about" },
        { label: "Success stories", href: "#testimonials" },
      ],
      ctaLabel: "Get Started",
      ctaHref: "enroll",
      secondaryCtaLabel: "Apply franchise",
      secondaryCtaHref: "apply",
      adminHref: "/login",
    },
    hero: {
      line1: "Keep",
      line1Serif: "Learning",
      line2: "on Track",
      line2Serif: "",
      subtitle: `${brandName} helps centers keep every class staffed, every student progressing, and every parent informed—without the chaos.`,
      ctaLabel: "Get Started",
      ctaHref: "enroll",
      secondaryCtaLabel: "Apply franchise",
      secondaryCtaHref: "apply",
      backgroundImageUrl: EDU_LEARN_HERO,
      phoneFrameUrl: EDU_LEARN_ACCENT,
    },
    featureSections: [
      {
        id: "match",
        title: "Find the right",
        titleSerif: "fit fast",
        body: "Match families to programs and centers with clear next steps—demo, enroll, or apply.",
      },
      {
        id: "school",
        title: "Run your",
        titleSerif: "school calmly.",
        body: "Curriculum, batches, and parent communication stay in one place as you grow.",
      },
      {
        id: "resources",
        title: "Share resources",
        titleSerif: "parents trust.",
        body: "Guides, photos, and stories that show what learning looks like at your centers.",
      },
    ],
    featuresShowcase: {
      title: "",
      subtitle: "",
    },
    trustMedia: {
      eyebrow: "Why choose us",
      title: "Why choose our services?",
      intro: `${brandName} partners with schools and franchise centers that want reliable operations.`,
      youtubeUrl: "",
      imageUrl: EDU_LEARN_STATS,
      highlightPrimary: "48+",
      highlightCaption: "Graduate programs",
      cards: [
        { title: "3k", subtitle: "School partners" },
        { title: "300+", subtitle: "Daily active learners" },
        { title: "48+", subtitle: "Graduate programs" },
      ],
    },
    founders: [
      {
        roleBadge: "Teacher",
        name: "Certified faculty",
        title: "Lead instructor",
        bio: "",
        photoUrl:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&h=160&q=80",
        statBadge: { value: "210+", label: "Certified teachers" },
      },
    ],
    gallery: {
      title: "Useful content for your center",
      images: [
        {
          url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=640&h=420&q=80",
          alt: "The guide to becoming a great teacher",
        },
        {
          url: "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=640&h=420&q=80",
          alt: "How centers keep learning on track",
        },
        {
          url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=640&h=420&q=80",
          alt: "Partnering with schools that care",
        },
      ],
    },
    testimonials: {
      title: "What our lovely clients say",
      subtitle: "",
      items: [
        {
          quote: "Scheduling used to eat our week. Now families book demos and we stay focused on teaching.",
          author: "James Huet",
          role: "Full-teacher in Texas",
          avatarUrl:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&h=96&q=80",
        },
        {
          quote: "Parents see progress without chasing WhatsApp threads. The center finally feels organized.",
          author: "Sarah Lee",
          role: "Center director",
          avatarUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80",
        },
        {
          quote: "The public site matches how we actually teach—warm, clear, and easy to enroll.",
          author: "Michael Davis",
          role: "Franchise owner",
          avatarUrl:
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=96&h=96&q=80",
        },
      ],
    },
    faq: [],
    footerCta: {
      title: "Join our community of school partners",
      subtitle: "",
      ctaLabel: "Get in Touch",
      ctaHref: "apply",
    },
    footer: {
      productLinks: [
        { label: "Features", href: "#features" },
        { label: "Resources", href: "#gallery" },
        { label: "About us", href: "/about" },
      ],
      companyLinks: [{ label: "Partner login", href: "/login" }],
      connectLinks: [{ label: "Get Started", href: "enroll" }],
      copyright: `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`,
      privacyHref: "/legal/privacy",
      termsHref: "/legal/terms",
      refundHref: "/legal/refund",
      rich: {
        description: `${brandName} keeps learning on track for schools and franchise centers.`,
        badges: [],
        customStats: [],
        brandStats: { franchiseCount: "12+", studentCount: "3k+" },
        presence: [],
        headOffice: { address: "", phone: "", website: "" },
        socialLinks: [],
      },
    },
    about: mergeAboutSection(brandName),
    sections: mergeSectionVisibility(undefined, EDU_LEARN_SECTION_DEFAULTS),
  };
}

export function mergeEduLearnLandingConfig(
  brandName: string,
  partial?: Partial<HomepageConfig>,
  logoUrl?: string | null
): HomepageConfig {
  const base = buildEduLearnLandingPartial(brandName);
  return mergeHomepageConfig({
    ...base,
    ...partial,
    meta: {
      siteName: partial?.meta?.siteName ?? base.meta!.siteName,
      fontSans: partial?.meta?.fontSans ?? base.meta!.fontSans,
      fontSerif: partial?.meta?.fontSerif ?? base.meta!.fontSerif,
      themeNote: partial?.meta?.themeNote ?? base.meta!.themeNote,
      logoUrl: partial?.meta?.logoUrl ?? logoUrl ?? null,
    },
    theme: {
      ...base.theme!,
      ...partial?.theme,
      bgColor: "#f6f3ed",
    },
    nav: { ...base.nav!, ...partial?.nav, links: partial?.nav?.links ?? base.nav!.links },
    hero: { ...base.hero!, ...partial?.hero },
    featureSections: partial?.featureSections ?? base.featureSections,
    featuresShowcase: {
      ...base.featuresShowcase!,
      ...partial?.featuresShowcase,
    },
    trustMedia: {
      ...base.trustMedia!,
      ...partial?.trustMedia,
      cards: partial?.trustMedia?.cards ?? base.trustMedia!.cards,
    },
    founders: limitSparkThemeDefaultMentors(partial?.founders) ?? base.founders,
    programsSection: {
      ...base.programsSection,
      ...partial?.programsSection,
      cards: partial?.programsSection?.cards ?? base.programsSection?.cards,
    },
    faq: partial?.faq ?? base.faq,
    testimonials: partial?.testimonials ?? base.testimonials,
    upcomingEvents: partial?.upcomingEvents ?? base.upcomingEvents,
    gallery: { ...base.gallery!, ...partial?.gallery, images: partial?.gallery?.images ?? base.gallery!.images },
    footerCta: { ...base.footerCta!, ...partial?.footerCta },
    footer: {
      ...base.footer!,
      ...partial?.footer,
      rich: { ...base.footer!.rich, ...partial?.footer?.rich },
    },
    about: mergeAboutSection(brandName, partial?.about ?? base.about),
    sections: mergeEduLearnSectionVisibility(partial),
  });
}
