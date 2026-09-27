import type { ReactNode } from "react";
import { Input, ToggleField } from "@edunudg/ui";
import type {
  HomepageConfig,
  HomepageFaq,
  HomepageFeatureSection,
  HomepageFounderProfile,
  HomepageGalleryImage,
  HomepageLink,
  HomepageTrustCard,
} from "@/types/homepage";
import type { MarketingUploadScope } from "@/lib/marketingMediaStorage";
import type { PortalMode } from "@/lib/portalMode";
import { isAbacusSectionEnabled, isEduLearnSectionEnabled, isSparkSectionEnabled, setSectionEnabled, ABACUS_CLASSIC_SECTION_DEFAULTS, EDU_LEARN_SECTION_DEFAULTS, SPARK_ACADEMY_SECTION_DEFAULTS, type HomepageSectionKey } from "@/lib/homepageSections";
import { FooterRichEditorFields } from "@/features/marketing/FooterRichEditorFields";
import { FooterLegalPagesEditor } from "@/features/marketing/FooterLegalPagesEditor";
import { SocialMediaConnectEditor } from "@/features/marketing/SocialMediaConnectEditor";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import type { BrandSocialConnect } from "@/lib/brandSocialConnect";
import { isAboutHeroPhotoRequired } from "@/lib/marketingRequiredPhotos";
import {
  EditorAccordion,
  EditorFieldSpan,
  EditorFieldsGrid,
  EditorGroupedPanel,
  EditorItemList,
  EditorItemPanel,
  EditorSectionNote,
  EditorSubItem,
  HomepageEditorSections,
  NavLinkHrefField,
} from "./HomepageEditorShell";
import { MarketingMediaField } from "./MarketingMediaField";
import { MARKETING_THEME_LABELS, type MarketingTheme } from "@/types/homepage";
import { UpcomingEventsEditorFields } from "./UpcomingEventsEditorFields";
import { AboutUsEditorFields } from "./AboutUsEditorFields";

export type AbacusClassicEditorFormProps = {
  config: HomepageConfig;
  marketingTheme: MarketingTheme;
  onChange: (config: HomepageConfig) => void;
  uploadScope?: MarketingUploadScope;
  onPersist?: (config: HomepageConfig) => void | Promise<void>;
  testimonialsExternalHint?: ReactNode;
  /** Brand vs center template — affects Novu-only presets when theme is novu. */
  portalMode?: PortalMode;
  brandId?: string | null;
  legalPages?: BrandLegalPages;
  onLegalPagesChange?: (next: BrandLegalPages) => void;
  socialConnect?: BrandSocialConnect;
  onSocialConnectChange?: (next: BrandSocialConnect) => void;
};

export function AbacusClassicEditorForm({
  config,
  marketingTheme,
  onChange,
  uploadScope = { kind: "platform" },
  onPersist,
  testimonialsExternalHint,
  portalMode = "brand",
  brandId = null,
  legalPages = {},
  onLegalPagesChange,
  socialConnect = {},
  onSocialConnectChange,
}: AbacusClassicEditorFormProps) {
  /** Structural edits that persist immediately (section visibility). Text fields must use `onChange` only. */
  const commit = (next: HomepageConfig) => {
    onChange(next);
    void onPersist?.(next);
  };

  /** Media edits stay local until the editor Save / Discard actions. */
  const commitMedia = (next: HomepageConfig) => {
    onChange(next);
  };

  const isSpark = marketingTheme === "spark-academy";
  const isEduLearn = marketingTheme === "edu-learn";
  const isCurriculumCoursesTheme = isSpark || isEduLearn;
  const sectionDefaults = isEduLearn
    ? EDU_LEARN_SECTION_DEFAULTS
    : isSpark
      ? SPARK_ACADEMY_SECTION_DEFAULTS
      : ABACUS_CLASSIC_SECTION_DEFAULTS;
  const isThemeSectionEnabled = (key: HomepageSectionKey) =>
    isEduLearn
      ? isEduLearnSectionEnabled(config, key)
      : isSpark
        ? isSparkSectionEnabled(config, key)
        : isAbacusSectionEnabled(config, key);

  const setSection = (key: HomepageSectionKey, enabled: boolean) => {
    commit(setSectionEnabled(config, key, enabled, sectionDefaults));
  };

  const updateNavLinks = (links: HomepageLink[]) => {
    onChange({ ...config, nav: { ...config.nav, links } });
  };

  const rich = config.footer.rich ?? {};

  return (
    <HomepageEditorSections>
      <p className="ed-text-sm ed-muted ed-homepage-editor__theme-note">
        Theme: <strong>{MARKETING_THEME_LABELS[marketingTheme]}</strong> (managed by EduNudg platform admin)
      </p>

      <EditorAccordion sectionId="site" title="Site">
        <EditorFieldsGrid>
          <Input
            label="Site name"
            value={config.meta.siteName}
            onChange={(v) => onChange({ ...config, meta: { ...config.meta, siteName: v } })}
          />
          <EditorFieldSpan>
            <MarketingMediaField
              label="Site logo"
              value={config.meta.logoUrl ?? ""}
              onChange={(v) => commitMedia({ ...config, meta: { ...config.meta, logoUrl: v || null } })}
              mediaType="image"
              uploadSubdir=""
              uploadScope={uploadScope}
              layout="logo"
              required
            />
          </EditorFieldSpan>
        </EditorFieldsGrid>
      </EditorAccordion>

      <EditorAccordion sectionId="navigation" title="Navigation & CTAs" description="Menus, dual CTAs and modal links">
        <EditorSectionNote>
          Header primary and secondary buttons. The hero banner button is edited in the Hero section.
        </EditorSectionNote>
        <EditorItemList
          onAdd={() => updateNavLinks([...config.nav.links, { label: "New", href: "#" }])}
          addLabel="+ Add menu item"
        >
          {config.nav.links.map((link, i) => (
            <EditorItemPanel
              key={`nav-${i}`}
              title={`Menu item ${i + 1}`}
              onRemove={() => updateNavLinks(config.nav.links.filter((_, idx) => idx !== i))}
              removeLabel="Remove menu item"
            >
              <EditorFieldsGrid>
                <Input
                  label="Label"
                  value={link.label}
                  onChange={(v) => {
                    const links = [...config.nav.links];
                    links[i] = { ...link, label: v };
                    updateNavLinks(links);
                  }}
                />
                <NavLinkHrefField
                  value={link.href}
                  marketingTheme={marketingTheme}
                  portalMode={portalMode}
                  sections={config.sections}
                  onChange={(v) => {
                    const links = [...config.nav.links];
                    links[i] = { ...link, href: v };
                    updateNavLinks(links);
                  }}
                />
              </EditorFieldsGrid>
            </EditorItemPanel>
          ))}
        </EditorItemList>
        <EditorFieldsGrid>
          <Input
            label="Primary CTA label (demo)"
            value={config.nav.ctaLabel}
            onChange={(v) => onChange({ ...config, nav: { ...config.nav, ctaLabel: v } })}
          />
          {portalMode === "brand" ? (
            <Input
              label="Secondary CTA label (franchise)"
              value={config.nav.secondaryCtaLabel ?? ""}
              onChange={(v) =>
                onChange({
                  ...config,
                  nav: { ...config.nav, secondaryCtaLabel: v },
                })
              }
            />
          ) : null}
        </EditorFieldsGrid>
      </EditorAccordion>

      <EditorAccordion
        sectionId="hero"
        title="Hero"
        enabled={isThemeSectionEnabled("hero")}
        onEnabledChange={(e) => setSection("hero", e)}
      >
        <EditorSectionNote>
          Independent of Navigation & CTAs. Empty label or link falls back to the header Primary CTA.
        </EditorSectionNote>
        <EditorFieldsGrid>
          <Input label="Badge" value={config.hero.badge ?? ""} onChange={(v) => onChange({ ...config, hero: { ...config.hero, badge: v } })} />
          <Input label="Headline line 1" value={config.hero.line1} onChange={(v) => onChange({ ...config, hero: { ...config.hero, line1: v } })} />
          <Input label="Headline serif part" value={config.hero.line1Serif} onChange={(v) => onChange({ ...config, hero: { ...config.hero, line1Serif: v } })} />
          <Input label="Subtitle" value={config.hero.subtitle} onChange={(v) => onChange({ ...config, hero: { ...config.hero, subtitle: v } })} />
          <Input
            label="Hero CTA label"
            value={config.hero.ctaLabel}
            onChange={(v) => onChange({ ...config, hero: { ...config.hero, ctaLabel: v } })}
          />
          <NavLinkHrefField
            label="Hero CTA link"
            value={config.hero.ctaHref}
            marketingTheme={marketingTheme}
            portalMode={portalMode}
            sections={config.sections}
            onChange={(v) => onChange({ ...config, hero: { ...config.hero, ctaHref: v } })}
          />
          <EditorFieldSpan>
            <MarketingMediaField
              label="Hero background"
              value={config.hero.backgroundImageUrl}
              onChange={(v) => commitMedia({ ...config, hero: { ...config.hero, backgroundImageUrl: v } })}
              mediaType="image"
              uploadSubdir="hero-background"
              uploadScope={uploadScope}
              layout="hero"
              required
            />
          </EditorFieldSpan>
        </EditorFieldsGrid>
      </EditorAccordion>

      <EditorAccordion
        sectionId="featureGrid"
        title="Why us (feature blocks)"
        enabled={isThemeSectionEnabled("featureGrid")}
        onEnabledChange={(e) => setSection("featureGrid", e)}
      >
        {marketingTheme === "spark-academy" ? (
          <EditorFieldsGrid>
            <EditorFieldSpan>
              <EditorSectionNote>
                Left visual on “Powerful Features…” — upload an image and edit the overlay stats. Section heading
                fields apply to the right column.
              </EditorSectionNote>
            </EditorFieldSpan>
            <EditorFieldSpan>
              <MarketingMediaField
                label="Features image"
                value={config.featuresShowcase?.imageUrl ?? ""}
                onChange={(v) =>
                  commitMedia({
                    ...config,
                    featuresShowcase: { ...config.featuresShowcase, imageUrl: v },
                  })
                }
                mediaType="image"
                uploadSubdir="features-showcase"
                uploadScope={uploadScope}
                required
              />
            </EditorFieldSpan>
            <Input
              label="Eyebrow"
              value={config.featuresShowcase?.eyebrow ?? ""}
              onChange={(v) =>
                onChange({
                  ...config,
                  featuresShowcase: { ...config.featuresShowcase, eyebrow: v },
                })
              }
              placeholder="Our Key Features"
            />
            <Input
              label="Section title"
              value={config.featuresShowcase?.title ?? ""}
              onChange={(v) =>
                onChange({
                  ...config,
                  featuresShowcase: { ...config.featuresShowcase, title: v },
                })
              }
              placeholder="Powerful Features for Your Learning Journey"
            />
            <EditorFieldSpan>
              <Input
                label="Section subtitle"
                value={config.featuresShowcase?.subtitle ?? ""}
                onChange={(v) =>
                  onChange({
                    ...config,
                    featuresShowcase: { ...config.featuresShowcase, subtitle: v },
                  })
                }
              />
            </EditorFieldSpan>
            <Input
              label="Stats card label"
              value={config.featuresShowcase?.floatStatsLabel ?? ""}
              onChange={(v) =>
                onChange({
                  ...config,
                  featuresShowcase: { ...config.featuresShowcase, floatStatsLabel: v },
                })
              }
              placeholder="Last month"
            />
            <Input
              label="Stats card value"
              value={config.featuresShowcase?.floatStatsValue ?? ""}
              onChange={(v) =>
                onChange({
                  ...config,
                  featuresShowcase: { ...config.featuresShowcase, floatStatsValue: v },
                })
              }
              placeholder="25.20%"
            />
            <Input
              label="Progress card label"
              value={config.featuresShowcase?.floatProgressLabel ?? ""}
              onChange={(v) =>
                onChange({
                  ...config,
                  featuresShowcase: { ...config.featuresShowcase, floatProgressLabel: v },
                })
              }
              placeholder="Learning Progress"
            />
            <Input
              label="Progress card value"
              value={config.featuresShowcase?.floatProgressValue ?? ""}
              onChange={(v) =>
                onChange({
                  ...config,
                  featuresShowcase: { ...config.featuresShowcase, floatProgressValue: v },
                })
              }
              placeholder="55%"
            />
          </EditorFieldsGrid>
        ) : null}
        <EditorItemList
          onAdd={() =>
            onChange({
              ...config,
              featureSections: [
                ...config.featureSections,
                {
                  id: `feature-${Date.now()}`,
                  title: "New",
                  titleSerif: "block",
                  body: "Description",
                } satisfies HomepageFeatureSection,
              ],
            })
          }
          addLabel="+ Add feature block"
        >
          {config.featureSections.map((section, i) => (
            <FeatureBlockEditor
              key={section.id}
              section={section}
              index={i}
              config={config}
              onChange={onChange}
              onRemove={() =>
                commit({
                  ...config,
                  featureSections: config.featureSections.filter((_, idx) => idx !== i),
                })
              }
            />
          ))}
        </EditorItemList>
      </EditorAccordion>

      <EditorAccordion
        sectionId="founders"
        title={
          isSpark
            ? "Meet Our Expert Mentors"
            : isEduLearn
              ? "Meet our leadership"
              : "Leadership profiles"
        }
        enabled={isThemeSectionEnabled("founders")}
        onEnabledChange={(e) => setSection("founders", e)}
      >
        <EditorSectionNote>
          {isSpark
            ? "Same section as the public homepage heading. Enter the real person’s name — template text like Founder name is hidden on the live site."
            : isEduLearn
              ? "Same section as the public homepage heading. Role badge, name, and title match Abacus / Spark. Template text like Founder name is hidden on the live site."
              : "Public site: Leadership. Enter the real person’s name — template text like Founder name is hidden on the live site."}
        </EditorSectionNote>
        <EditorItemList
          onAdd={() => commit({ ...config, founders: [...(config.founders ?? []), emptyFounder()] })}
          addLabel="+ Add profile"
        >
          {(config.founders ?? []).map((founder, i) => (
            <FounderEditor
              key={`founder-${i}`}
              founder={founder}
              index={i}
              config={config}
              onChange={onChange}
              uploadScope={uploadScope}
              onPersist={commitMedia}
              photoRequired={i === 0}
              onRemove={() =>
                commit({ ...config, founders: (config.founders ?? []).filter((_, idx) => idx !== i) })
              }
            />
          ))}
        </EditorItemList>
      </EditorAccordion>

      <EditorAccordion
        sectionId="upcomingEvents"
        title="Upcoming events"
        enabled={isThemeSectionEnabled("upcomingEvents")}
        onEnabledChange={(e) => setSection("upcomingEvents", e)}
      >
        <UpcomingEventsEditorFields
          config={config}
          onChange={onChange}
          commit={commit}
          commitMedia={commitMedia}
          uploadScope={uploadScope}
        />
      </EditorAccordion>

      {portalMode === "brand" ? (
        <EditorAccordion
          sectionId="about"
          title="About Us"
          description={
            isSpark
              ? "Company story, key features, team photos — published on /about (not on the homepage)"
              : "Company story, key features, team photos — full /about page"
          }
          enabled={isSpark ? true : isThemeSectionEnabled("about")}
          onEnabledChange={isSpark ? undefined : (e) => setSection("about", e)}
        >
          <AboutUsEditorFields
            config={config}
            onChange={onChange}
            commit={commit}
            commitMedia={commitMedia}
            uploadScope={uploadScope}
            leadPhotoRequired={isAboutHeroPhotoRequired({
              config,
              marketingTheme,
              portalMode,
            })}
          />
        </EditorAccordion>
      ) : null}

      <EditorAccordion
        sectionId="trustMedia"
        title="Trust & video"
        enabled={isThemeSectionEnabled("trustMedia")}
        onEnabledChange={(e) => setSection("trustMedia", e)}
      >
        <EditorFieldsGrid>
          <Input
            label="Eyebrow"
            value={config.trustMedia?.eyebrow ?? ""}
            onChange={(v) => onChange({ ...config, trustMedia: { ...config.trustMedia!, eyebrow: v } })}
          />
          <Input
            label="Title"
            value={config.trustMedia?.title ?? ""}
            onChange={(v) => onChange({ ...config, trustMedia: { ...config.trustMedia!, title: v } })}
          />
          <Input
            label="Title highlight (brand name)"
            value={config.trustMedia?.titleHighlight ?? ""}
            onChange={(v) => onChange({ ...config, trustMedia: { ...config.trustMedia!, titleHighlight: v } })}
          />
          <Input
            label="Intro"
            value={config.trustMedia?.intro ?? ""}
            onChange={(v) => onChange({ ...config, trustMedia: { ...config.trustMedia!, intro: v } })}
          />
          <EditorFieldSpan>
            <Input
              label="YouTube URL"
              value={config.trustMedia?.youtubeUrl ?? ""}
              onChange={(v) => onChange({ ...config, trustMedia: { ...config.trustMedia!, youtubeUrl: v } })}
            />
            {isSpark || isEduLearn ? (
              <p className="ed-text-sm ed-muted ed-editor-field-hint">
                {isSpark
                  ? "Shows in a video block under Journey. The highlight photo stays in place."
                  : "Shows in a video block under Why choose us. The stats photo stays in place."}
              </p>
            ) : null}
          </EditorFieldSpan>
          {marketingTheme === "spark-academy" ? (
            <>
              <EditorFieldSpan>
                <EditorSectionNote>
                  Journey highlight card (right side of “Our Journey to Excellence”): image and figures below.
                </EditorSectionNote>
              </EditorFieldSpan>
              <EditorFieldSpan>
                <MarketingMediaField
                  label="Journey highlight image"
                  value={config.trustMedia?.imageUrl ?? ""}
                  onChange={(v) =>
                    commitMedia({
                      ...config,
                      trustMedia: { ...config.trustMedia!, imageUrl: v },
                    })
                  }
                  mediaType="image"
                  uploadSubdir="trust-journey"
                  uploadScope={uploadScope}
                  required
                />
              </EditorFieldSpan>
              <Input
                label="Highlight label"
                value={config.trustMedia?.highlightLabel ?? ""}
                onChange={(v) =>
                  onChange({ ...config, trustMedia: { ...config.trustMedia!, highlightLabel: v } })
                }
                placeholder="Our Investment Fund Raised"
              />
              <Input
                label="Highlight primary figure"
                value={config.trustMedia?.highlightPrimary ?? ""}
                onChange={(v) =>
                  onChange({ ...config, trustMedia: { ...config.trustMedia!, highlightPrimary: v } })
                }
                placeholder="e.g. 1000+"
              />
              <Input
                label="Highlight secondary figure"
                value={config.trustMedia?.highlightSecondary ?? ""}
                onChange={(v) =>
                  onChange({ ...config, trustMedia: { ...config.trustMedia!, highlightSecondary: v } })
                }
                placeholder="e.g. 20+"
              />
              <Input
                label="Highlight caption"
                value={config.trustMedia?.highlightCaption ?? ""}
                onChange={(v) =>
                  onChange({ ...config, trustMedia: { ...config.trustMedia!, highlightCaption: v } })
                }
                placeholder="Top mentors around the globe"
              />
            </>
          ) : null}
        </EditorFieldsGrid>
        <EditorItemList
          onAdd={() =>
            commit({
              ...config,
              trustMedia: {
                ...config.trustMedia!,
                cards: [...(config.trustMedia?.cards ?? []), { title: "New highlight", subtitle: "Description" }],
              },
            })
          }
          addLabel="+ Add stat card"
        >
          {(config.trustMedia?.cards ?? []).map((card, i) => (
            <TrustCardEditor
              key={`trust-${i}`}
              card={card}
              index={i}
              config={config}
              onChange={onChange}
              onRemove={() =>
                commit({
                  ...config,
                  trustMedia: {
                    ...config.trustMedia!,
                    cards: (config.trustMedia?.cards ?? []).filter((_, idx) => idx !== i),
                  },
                })
              }
            />
          ))}
        </EditorItemList>
      </EditorAccordion>

      <EditorAccordion
        sectionId="testimonials"
        title="Success stories section"
        enabled={isThemeSectionEnabled("testimonials")}
        onEnabledChange={(e) => setSection("testimonials", e)}
      >
        <EditorFieldsGrid>
          <Input
            label="Section title"
            value={config.testimonials.title}
            onChange={(v) => onChange({ ...config, testimonials: { ...config.testimonials, title: v } })}
          />
          <Input
            label="Section subtitle"
            value={config.testimonials.subtitle}
            onChange={(v) => onChange({ ...config, testimonials: { ...config.testimonials, subtitle: v } })}
          />
          {testimonialsExternalHint ? <EditorFieldSpan>{testimonialsExternalHint}</EditorFieldSpan> : null}
        </EditorFieldsGrid>
      </EditorAccordion>

      <EditorAccordion
        sectionId="faq"
        title="FAQ"
        enabled={isThemeSectionEnabled("faq")}
        onEnabledChange={(e) => setSection("faq", e)}
      >
        <EditorItemList
          onAdd={() =>
            commit({ ...config, faq: [...config.faq, { question: "New question?", answer: "Answer." } satisfies HomepageFaq] })
          }
          addLabel="+ Add FAQ"
        >
          {config.faq.map((f, i) => (
            <EditorItemPanel
              key={`faq-${i}`}
              title={`FAQ ${i + 1}`}
              onRemove={() => commit({ ...config, faq: config.faq.filter((_, idx) => idx !== i) })}
              removeLabel="Remove FAQ item"
            >
              <EditorFieldsGrid>
                <Input
                  label="Question"
                  value={f.question}
                  onChange={(v) => {
                    const faq = [...config.faq];
                    faq[i] = { ...f, question: v };
                    onChange({ ...config, faq });
                  }}
                />
                <Input
                  label="Answer"
                  value={f.answer}
                  onChange={(v) => {
                    const faq = [...config.faq];
                    faq[i] = { ...f, answer: v };
                    onChange({ ...config, faq });
                  }}
                />
              </EditorFieldsGrid>
            </EditorItemPanel>
          ))}
        </EditorItemList>
      </EditorAccordion>

      <EditorAccordion
        sectionId="gallery"
        title="Photo gallery"
        enabled={isThemeSectionEnabled("gallery")}
        onEnabledChange={(e) => setSection("gallery", e)}
      >
        <EditorFieldsGrid>
          <EditorFieldSpan>
            <Input
              label="Gallery title"
              value={config.gallery?.title ?? ""}
              onChange={(v) =>
                onChange({ ...config, gallery: { ...config.gallery!, title: v, images: config.gallery?.images ?? [] } })
              }
            />
          </EditorFieldSpan>
        </EditorFieldsGrid>
        <EditorItemList
          onAdd={() =>
            commit({
              ...config,
              gallery: {
                title: config.gallery?.title,
                images: [...(config.gallery?.images ?? []), { url: "", alt: "" } satisfies HomepageGalleryImage],
              },
            })
          }
          addLabel="+ Add photo"
        >
          {(config.gallery?.images ?? []).map((img, i) => (
            <EditorItemPanel
              key={`gallery-${i}`}
              title={`Photo ${i + 1}`}
              onRemove={() =>
                commit({
                  ...config,
                  gallery: {
                    ...config.gallery!,
                    images: (config.gallery?.images ?? []).filter((_, idx) => idx !== i),
                  },
                })
              }
              removeLabel="Remove photo"
            >
              <EditorFieldsGrid>
                <EditorFieldSpan>
                  <MarketingMediaField
                    label="Image"
                    value={img.url}
                    onChange={(v) => {
                      const images = [...(config.gallery?.images ?? [])];
                      images[i] = { ...img, url: v };
                      commitMedia({ ...config, gallery: { ...config.gallery!, images } });
                    }}
                    mediaType="image"
                    uploadSubdir={`gallery-${i}`}
                    uploadScope={uploadScope}
                    required={i === 0}
                  />
                </EditorFieldSpan>
                <Input
                  label="Alt text"
                  value={img.alt ?? ""}
                  onChange={(v) => {
                    const images = [...(config.gallery?.images ?? [])];
                    images[i] = { ...img, alt: v };
                    onChange({ ...config, gallery: { ...config.gallery!, images } });
                  }}
                />
              </EditorFieldsGrid>
            </EditorItemPanel>
          ))}
        </EditorItemList>
      </EditorAccordion>

      <EditorAccordion
        sectionId="footerRich"
        title="Footer"
        enabled={isThemeSectionEnabled("footerRich")}
        onEnabledChange={(e) => setSection("footerRich", e)}
      >
        <EditorFieldsGrid>
          <EditorFieldSpan>
            <Input
              label="Brand description"
              value={rich.description ?? ""}
              onChange={(v) => onChange({ ...config, footer: { ...config.footer, rich: { ...rich, description: v } } })}
            />
          </EditorFieldSpan>
          <FooterRichEditorFields config={config} onChange={onChange} />
          <Input
            label="Head office address"
            value={rich.headOffice?.address ?? ""}
            onChange={(v) =>
              onChange({
                ...config,
                footer: {
                  ...config.footer,
                  rich: {
                    ...rich,
                    headOffice: {
                      ...rich.headOffice!,
                      address: v,
                      phone: rich.headOffice?.phone ?? "",
                      website: rich.headOffice?.website ?? "",
                    },
                  },
                },
              })
            }
          />
          <Input
            label="Head office phone"
            value={rich.headOffice?.phone ?? ""}
            onChange={(v) =>
              onChange({
                ...config,
                footer: {
                  ...config.footer,
                  rich: {
                    ...rich,
                    headOffice: {
                      ...rich.headOffice!,
                      phone: v,
                      address: rich.headOffice?.address ?? "",
                      website: rich.headOffice?.website ?? "",
                    },
                  },
                },
              })
            }
          />
          <Input
            label="Website"
            value={rich.headOffice?.website ?? ""}
            onChange={(v) =>
              onChange({
                ...config,
                footer: {
                  ...config.footer,
                  rich: {
                    ...rich,
                    headOffice: {
                      ...rich.headOffice!,
                      website: v,
                      address: rich.headOffice?.address ?? "",
                      phone: rich.headOffice?.phone ?? "",
                    },
                  },
                },
              })
            }
          />
          <Input
            label="Copyright"
            value={config.footer.copyright}
            onChange={(v) => onChange({ ...config, footer: { ...config.footer, copyright: v } })}
          />
        </EditorFieldsGrid>
        <EditorItemList
          onAdd={() =>
            onChange({
              ...config,
              footer: {
                ...config.footer,
                rich: { ...rich, customStats: [...(rich.customStats ?? []), { value: "12+", label: "Years" }] },
              },
            })
          }
          addLabel="+ Add custom stat"
        >
          {(rich.customStats ?? []).map((stat, i) => (
            <EditorItemPanel
              key={`stat-${i}`}
              title={`Custom stat ${i + 1}`}
              onRemove={() =>
                onChange({
                  ...config,
                  footer: {
                    ...config.footer,
                    rich: { ...rich, customStats: (rich.customStats ?? []).filter((_, idx) => idx !== i) },
                  },
                })
              }
              removeLabel="Remove stat"
            >
              <EditorFieldsGrid>
                <Input
                  label="Stat value"
                  value={stat.value}
                  onChange={(v) => {
                    const customStats = [...(rich.customStats ?? [])];
                    customStats[i] = { ...stat, value: v };
                    onChange({ ...config, footer: { ...config.footer, rich: { ...rich, customStats } } });
                  }}
                />
                <Input
                  label="Stat label"
                  value={stat.label}
                  onChange={(v) => {
                    const customStats = [...(rich.customStats ?? [])];
                    customStats[i] = { ...stat, label: v };
                    onChange({ ...config, footer: { ...config.footer, rich: { ...rich, customStats } } });
                  }}
                />
              </EditorFieldsGrid>
            </EditorItemPanel>
          ))}
        </EditorItemList>
      </EditorAccordion>

      {portalMode === "brand" && onLegalPagesChange ? (
        <FooterLegalPagesEditor
          uploadScope={{ mode: "brand", brandId: brandId ?? null }}
          legalPages={legalPages}
          onLegalPagesChange={onLegalPagesChange}
        />
      ) : null}

      {portalMode === "brand" && onSocialConnectChange ? (
        <SocialMediaConnectEditor socialConnect={socialConnect} onSocialConnectChange={onSocialConnectChange} />
      ) : null}
    </HomepageEditorSections>
  );
}

function emptyFounder(): HomepageFounderProfile {
  return { roleBadge: "FOUNDER", name: "", title: "", bio: "", photoUrl: "" };
}

const TEMPLATE_FOUNDER_NAMES = new Set(["founder name", "name"]);

function FeatureBlockEditor({
  section,
  index,
  config,
  onChange,
  onRemove,
}: {
  section: HomepageFeatureSection;
  index: number;
  config: HomepageConfig;
  onChange: (c: HomepageConfig) => void;
  onRemove: () => void;
}) {
  return (
    <EditorItemPanel title={`Feature block ${index + 1}`} onRemove={onRemove} removeLabel="Remove block">
      <EditorFieldsGrid>
        <Input
          label="Title"
          value={section.title}
          onChange={(v) => {
            const featureSections = [...config.featureSections];
            featureSections[index] = { ...section, title: v };
            onChange({ ...config, featureSections });
          }}
        />
        <Input
          label="Serif phrase"
          value={section.titleSerif}
          onChange={(v) => {
            const featureSections = [...config.featureSections];
            featureSections[index] = { ...section, titleSerif: v };
            onChange({ ...config, featureSections });
          }}
        />
        <EditorFieldSpan>
          <Input
            label="Body"
            value={section.body}
            onChange={(v) => {
              const featureSections = [...config.featureSections];
              featureSections[index] = { ...section, body: v };
              onChange({ ...config, featureSections });
            }}
          />
        </EditorFieldSpan>
      </EditorFieldsGrid>
    </EditorItemPanel>
  );
}

function FounderEditor({
  founder,
  index,
  config,
  onChange,
  uploadScope,
  onPersist,
  photoRequired = false,
  onRemove,
}: {
  founder: HomepageFounderProfile;
  index: number;
  config: HomepageConfig;
  onChange: (c: HomepageConfig) => void;
  uploadScope: MarketingUploadScope;
  onPersist: (c: HomepageConfig) => void;
  photoRequired?: boolean;
  onRemove: () => void;
}) {
  const update = (patch: Partial<HomepageFounderProfile>) => {
    const founders = [...(config.founders ?? [])];
    founders[index] = { ...founder, ...patch };
    onChange({ ...config, founders });
  };
  return (
    <EditorItemPanel title={`Profile ${index + 1}`} onRemove={onRemove} removeLabel="Remove profile">
      <EditorFieldsGrid>
        <Input label="Role badge" value={founder.roleBadge} onChange={(v) => update({ roleBadge: v })} />
        <Input
          label="Person's name"
          value={TEMPLATE_FOUNDER_NAMES.has(founder.name.trim().toLowerCase()) ? "" : founder.name}
          placeholder="Shown on the public mentors / leadership section"
          onChange={(v) => update({ name: v })}
        />
        <Input label="Title" value={founder.title} onChange={(v) => update({ title: v })} />
        <Input label="Bio" value={founder.bio} onChange={(v) => update({ bio: v })} />
        <EditorFieldSpan>
          <MarketingMediaField
            label="Photo"
            value={founder.photoUrl}
            onChange={(v) =>
              onPersist({
                ...config,
                founders: (config.founders ?? []).map((f, i) => (i === index ? { ...f, photoUrl: v } : f)),
              })
            }
            mediaType="image"
            uploadSubdir={`founder-${index}`}
            uploadScope={uploadScope}
            required={photoRequired}
          />
        </EditorFieldSpan>
      </EditorFieldsGrid>
    </EditorItemPanel>
  );
}

function TrustCardEditor({
  card,
  index,
  config,
  onChange,
  onRemove,
}: {
  card: HomepageTrustCard;
  index: number;
  config: HomepageConfig;
  onChange: (c: HomepageConfig) => void;
  onRemove: () => void;
}) {
  return (
    <EditorItemPanel title={`Stat card ${index + 1}`} onRemove={onRemove} removeLabel="Remove stat card">
      <EditorFieldsGrid>
        <Input
          label="Title"
          value={card.title}
          onChange={(v) => {
            const cards = [...(config.trustMedia?.cards ?? [])];
            cards[index] = { ...card, title: v };
            onChange({ ...config, trustMedia: { ...config.trustMedia!, cards } });
          }}
        />
        <Input
          label="Subtitle"
          value={card.subtitle}
          onChange={(v) => {
            const cards = [...(config.trustMedia?.cards ?? [])];
            cards[index] = { ...card, subtitle: v };
            onChange({ ...config, trustMedia: { ...config.trustMedia!, cards } });
          }}
        />
      </EditorFieldsGrid>
    </EditorItemPanel>
  );
}
