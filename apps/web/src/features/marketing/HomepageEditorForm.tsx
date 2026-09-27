import { useState, type DragEvent, type ReactNode } from "react";
import { Button, Input, ToggleField } from "@edunudg/ui";
import type {
  HomepageConfig,
  HomepageFaq,
  HomepageFeatureSection,
  HomepageLink,
  HomepageShowcaseCard,
  HomepageTestimonial,
  MarketingTheme,
} from "@/types/homepage";
import type { HomepageSectionVisibility } from "@/lib/homepageSections";
import type { MarketingUploadScope } from "@/lib/marketingMediaStorage";
import type { PortalMode } from "@/lib/portalMode";
import { mergeHomepageConfig } from "@/lib/homepageApi";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import {
  ENTERPRISE_PLATFORM_SECTION_DEFAULTS,
  mergeSectionVisibility,
  setSectionEnabled,
  type HomepageSectionKey,
} from "@/lib/homepageSections";
import {
  formatTestimonialQuoteCount,
  moveItem,
  testimonialQuoteLengthHint,
} from "@/lib/testimonialEditorHelpers";
import {
  EditorAccordion,
  EditorFieldSpan,
  EditorFieldsGrid,
  EditorItemList,
  EditorItemPanel,
  EditorSectionNote,
  EditorStaticSection,
  HomepageEditorSections,
  NavLinkHrefField,
} from "./HomepageEditorShell";
import { MarketingMediaField } from "./MarketingMediaField";
import { FooterRichEditorFields } from "./FooterRichEditorFields";
import { FooterLegalPagesEditor } from "./FooterLegalPagesEditor";
import { SocialMediaConnectEditor } from "./SocialMediaConnectEditor";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import type { BrandSocialConnect } from "@/lib/brandSocialConnect";
import { isAboutHeroPhotoRequired } from "@/lib/marketingRequiredPhotos";
import { UpcomingEventsEditorFields } from "./UpcomingEventsEditorFields";
import { AboutUsEditorFields } from "./AboutUsEditorFields";

export type HomepageEditorFormProps = {
  config: HomepageConfig;
  onChange: (config: HomepageConfig) => void;
  /** Where uploaded images/videos are stored in Supabase Storage. */
  uploadScope?: MarketingUploadScope;
  /** Optional: persist non-media structural edits (e.g. section visibility). Media uploads stay draft until the page Save action. */
  onPersist?: (config: HomepageConfig) => void | Promise<void>;
  /** When true, testimonial quotes are managed elsewhere (e.g. success stories). */
  testimonialsManagedExternally?: boolean;
  testimonialsExternalHint?: ReactNode;
  /** Theme for nav link target dropdown (defaults to Novu). */
  marketingTheme?: MarketingTheme;
  /** Brand vs center vs platform — controls Novu CTA anchor presets. */
  portalMode?: PortalMode;
  brandId?: string | null;
  legalPages?: BrandLegalPages;
  onLegalPagesChange?: (next: BrandLegalPages) => void;
  socialConnect?: BrandSocialConnect;
  onSocialConnectChange?: (next: BrandSocialConnect) => void;
};

export function HomepageEditorForm({
  config: rawConfig,
  onChange,
  uploadScope = { kind: "platform" },
  onPersist,
  testimonialsManagedExternally = false,
  testimonialsExternalHint,
  marketingTheme = "novu",
  portalMode = "platform",
  brandId = null,
  legalPages = {},
  onLegalPagesChange,
  socialConnect = {},
  onSocialConnectChange,
}: HomepageEditorFormProps) {
  const config = mergeHomepageConfig(rawConfig ?? DEFAULT_HOMEPAGE_CONFIG);
  const isPlatformEditor = portalMode === "platform";
  const requireLeadPhoto = !isPlatformEditor;
  const sectionDefaults = isPlatformEditor ? ENTERPRISE_PLATFORM_SECTION_DEFAULTS : undefined;
  const sections = mergeSectionVisibility(config.sections, sectionDefaults);

  const commit = (next: HomepageConfig) => {
    onChange(next);
    void onPersist?.(next);
  };

  /** Media edits stay local until the editor Save / Discard actions. */
  const commitMedia = (next: HomepageConfig) => {
    onChange(next);
  };

  const setSection = (key: HomepageSectionKey, enabled: boolean) => {
    commit(setSectionEnabled(config, key, enabled, sectionDefaults));
  };

  const updateHero = (field: keyof HomepageConfig["hero"], value: string) => {
    onChange({ ...config, hero: { ...config.hero, [field]: value } });
  };

  const updatePrimaryCta = (field: "ctaLabel" | "ctaHref", value: string) => {
    if (isPlatformEditor) {
      onChange({ ...config, nav: { ...config.nav, [field]: value } });
      return;
    }
    onChange({
      ...config,
      nav: { ...config.nav, [field]: value },
      hero: { ...config.hero, [field]: value },
      footerCta: { ...config.footerCta, [field]: value },
    });
  };

  const updateFooterLinks = (
    key: "productLinks" | "companyLinks" | "connectLinks",
    links: HomepageLink[]
  ) => {
    onChange({ ...config, footer: { ...config.footer, [key]: links } });
  };

  const updateNavLinks = (links: HomepageLink[]) => {
    onChange({ ...config, nav: { ...config.nav, links } });
  };

  return (
    <>
      <EditorStaticSection sectionId="site" title="Site Identity">
        <EditorFieldsGrid>
          <EditorFieldSpan>
            <Input
              label="Site name"
              value={config.meta.siteName}
              onChange={(v) => onChange({ ...config, meta: { ...config.meta, siteName: v } })}
            />
            <p className="ed-text-sm ed-muted ed-editor-field-hint">
              This name appears in the browser title and header.
            </p>
          </EditorFieldSpan>
          <EditorFieldSpan>
            <MarketingMediaField
              label="Site logo"
              value={config.meta.logoUrl ?? ""}
              onChange={(v) => commitMedia({ ...config, meta: { ...config.meta, logoUrl: v || null } })}
              mediaType="image"
              uploadSubdir=""
              uploadScope={
                uploadScope.kind === "brand" ? uploadScope : { kind: "platform-logo" }
              }
              layout="logo"
              required={requireLeadPhoto}
            />
          </EditorFieldSpan>
        </EditorFieldsGrid>
      </EditorStaticSection>

      <NavigationEditorSection
        config={config}
        updateNavLinks={updateNavLinks}
        marketingTheme={marketingTheme}
        portalMode={portalMode}
      />

      <HomepageEditorSections>
      <EditorAccordion
        sectionId="hero"
        title="Hero"
        enabled={sections.hero}
        onEnabledChange={(enabled) => setSection("hero", enabled)}
      >
        <EditorFieldsGrid>
          <Input label="Line 1 (sans)" value={config.hero.line1} onChange={(v) => updateHero("line1", v)} />
          <Input label="Line 1 (serif)" value={config.hero.line1Serif} onChange={(v) => updateHero("line1Serif", v)} />
          <Input label="Line 2 (sans)" value={config.hero.line2} onChange={(v) => updateHero("line2", v)} />
          <Input label="Line 2 (serif)" value={config.hero.line2Serif} onChange={(v) => updateHero("line2Serif", v)} />
          <Input label="Subtitle" value={config.hero.subtitle} onChange={(v) => updateHero("subtitle", v)} />
          {isPlatformEditor ? (
            <>
              <Input
                label="Badge"
                value={config.hero.badge ?? ""}
                onChange={(v) => updateHero("badge", v)}
              />
              <Input
                label="Hero primary CTA label"
                value={config.hero.ctaLabel ?? config.nav.ctaLabel}
                onChange={(v) =>
                  onChange({
                    ...config,
                    hero: { ...config.hero, ctaLabel: v },
                  })
                }
              />
              <Input
                label="Hero primary CTA link"
                value={config.hero.ctaHref ?? config.nav.ctaHref}
                onChange={(v) =>
                  onChange({
                    ...config,
                    hero: { ...config.hero, ctaHref: v },
                  })
                }
              />
              <Input
                label="Secondary CTA label"
                value={config.hero.secondaryCtaLabel ?? config.nav.secondaryCtaLabel ?? ""}
                onChange={(v) =>
                  onChange({
                    ...config,
                    nav: { ...config.nav, secondaryCtaLabel: v },
                    hero: { ...config.hero, secondaryCtaLabel: v },
                  })
                }
              />
              <Input
                label="Secondary CTA link"
                value={config.hero.secondaryCtaHref ?? config.nav.secondaryCtaHref ?? ""}
                onChange={(v) =>
                  onChange({
                    ...config,
                    nav: { ...config.nav, secondaryCtaHref: v },
                    hero: { ...config.hero, secondaryCtaHref: v },
                  })
                }
              />
              <Input
                label="Overlay eyebrow"
                value={config.heroOverlayCard?.eyebrow ?? ""}
                onChange={(v) =>
                  onChange({
                    ...config,
                    heroOverlayCard: { ...config.heroOverlayCard!, eyebrow: v },
                  })
                }
              />
              <Input
                label="Overlay value"
                value={config.heroOverlayCard?.value ?? ""}
                onChange={(v) =>
                  onChange({
                    ...config,
                    heroOverlayCard: { ...config.heroOverlayCard!, value: v },
                  })
                }
              />
              <Input
                label="Overlay progress %"
                value={String(config.heroOverlayCard?.progressPercent ?? 0)}
                onChange={(v) =>
                  onChange({
                    ...config,
                    heroOverlayCard: {
                      ...config.heroOverlayCard!,
                      progressPercent: Number.parseInt(v, 10) || 0,
                    },
                  })
                }
              />
            </>
          ) : null}
          <Input
            label={isPlatformEditor ? "Header CTA label" : "Primary CTA label (nav, hero, footer)"}
            value={config.nav.ctaLabel}
            onChange={(v) => updatePrimaryCta("ctaLabel", v)}
          />
          <Input
            label={isPlatformEditor ? "Header CTA link" : "Primary CTA link"}
            value={config.nav.ctaHref}
            onChange={(v) => updatePrimaryCta("ctaHref", v)}
          />
          <EditorFieldSpan>
            <MarketingMediaField
              label={isPlatformEditor ? "Hero side image" : "Hero background image or video"}
              value={config.hero.backgroundImageUrl}
              onChange={(v) => commitMedia({ ...config, hero: { ...config.hero, backgroundImageUrl: v } })}
              mediaType="image"
              uploadSubdir="hero-background"
              uploadScope={uploadScope}
              layout="hero"
              required={requireLeadPhoto}
            />
          </EditorFieldSpan>
          {!isPlatformEditor ? (
            <EditorFieldSpan>
              <MarketingMediaField
                label="Phone frame image"
                value={config.hero.phoneFrameUrl}
                onChange={(v) => commitMedia({ ...config, hero: { ...config.hero, phoneFrameUrl: v } })}
                mediaType="image"
                uploadSubdir="hero-phone-frame"
                uploadScope={uploadScope}
                layout="hero"
              />
            </EditorFieldSpan>
          ) : null}
        </EditorFieldsGrid>
      </EditorAccordion>

      {isPlatformEditor ? (
        <>
          <EditorAccordion
            sectionId="ecosystemIntro"
            title="Ecosystem intro"
            enabled={sections.ecosystemIntro}
            onEnabledChange={(enabled) => setSection("ecosystemIntro", enabled)}
          >
            <EditorFieldsGrid>
              <Input
                label="Title"
                value={config.ecosystemIntro?.title ?? ""}
                onChange={(v) =>
                  onChange({
                    ...config,
                    ecosystemIntro: { ...config.ecosystemIntro!, title: v },
                  })
                }
              />
              <EditorFieldSpan>
                <Input
                  label="Subtitle"
                  value={config.ecosystemIntro?.subtitle ?? ""}
                  onChange={(v) =>
                    onChange({
                      ...config,
                      ecosystemIntro: { ...config.ecosystemIntro!, subtitle: v },
                    })
                  }
                />
              </EditorFieldSpan>
            </EditorFieldsGrid>
          </EditorAccordion>

          <EditorAccordion
            sectionId="connectivityShowcase"
            title="Connectivity showcase"
            enabled={sections.connectivityShowcase}
            onEnabledChange={(enabled) => setSection("connectivityShowcase", enabled)}
          >
            <EditorFieldsGrid>
              <Input
                label="Title"
                value={config.connectivityShowcase?.title ?? ""}
                onChange={(v) =>
                  onChange({
                    ...config,
                    connectivityShowcase: { ...config.connectivityShowcase!, title: v },
                  })
                }
              />
              <EditorFieldSpan>
                <Input
                  label="Subtitle"
                  value={config.connectivityShowcase?.subtitle ?? ""}
                  onChange={(v) =>
                    onChange({
                      ...config,
                      connectivityShowcase: { ...config.connectivityShowcase!, subtitle: v },
                    })
                  }
                />
              </EditorFieldSpan>
              <EditorFieldSpan>
                <MarketingMediaField
                  label="Center phone image"
                  value={config.connectivityShowcase?.centerImageUrl ?? ""}
                  onChange={(v) =>
                    commitMedia({
                      ...config,
                      connectivityShowcase: {
                        ...config.connectivityShowcase!,
                        centerImageUrl: v || undefined,
                      },
                    })
                  }
                  mediaType="image"
                  uploadSubdir="connectivity-center"
                  uploadScope={uploadScope}
                  layout="hero"
                />
              </EditorFieldSpan>
            </EditorFieldsGrid>
            <EditorSectionNote>
              Center phone image appears beside the connectivity cards on the public homepage (#connectivity). It is not used in the hero banner.
            </EditorSectionNote>
            <EditorItemList
              onAdd={() =>
                commit({
                  ...config,
                  connectivityShowcase: {
                    ...config.connectivityShowcase!,
                    cards: [
                      ...config.connectivityShowcase!.cards,
                      {
                        id: `card-${Date.now()}`,
                        iconKey: "message",
                        title: "New card",
                        body: "Description",
                      },
                    ],
                  },
                })
              }
              addLabel="+ Add connectivity card"
            >
              {config.connectivityShowcase?.cards.map((card, i) => (
                <EditorItemPanel
                  key={card.id}
                  title={`Card ${i + 1}`}
                  onRemove={
                    (config.connectivityShowcase?.cards.length ?? 0) <= 1
                      ? undefined
                      : () =>
                          commit({
                            ...config,
                            connectivityShowcase: {
                              ...config.connectivityShowcase!,
                              cards: config.connectivityShowcase!.cards.filter((_, idx) => idx !== i),
                            },
                          })
                  }
                  removeLabel="Remove card"
                >
                  <EditorFieldsGrid>
                    <Input
                      label="Icon key"
                      value={card.iconKey}
                      onChange={(v) => {
                        const cards = [...config.connectivityShowcase!.cards];
                        cards[i] = { ...card, iconKey: v };
                        onChange({ ...config, connectivityShowcase: { ...config.connectivityShowcase!, cards } });
                      }}
                    />
                    <Input
                      label="Title"
                      value={card.title}
                      onChange={(v) => {
                        const cards = [...config.connectivityShowcase!.cards];
                        cards[i] = { ...card, title: v };
                        onChange({ ...config, connectivityShowcase: { ...config.connectivityShowcase!, cards } });
                      }}
                    />
                    <EditorFieldSpan>
                      <Input
                        label="Body"
                        value={card.body}
                        onChange={(v) => {
                          const cards = [...config.connectivityShowcase!.cards];
                          cards[i] = { ...card, body: v };
                          onChange({ ...config, connectivityShowcase: { ...config.connectivityShowcase!, cards } });
                        }}
                      />
                    </EditorFieldSpan>
                  </EditorFieldsGrid>
                </EditorItemPanel>
              ))}
            </EditorItemList>
          </EditorAccordion>

          <EditorAccordion
            sectionId="featureGrid"
            title="Feature grid"
            enabled={sections.featureGrid}
            onEnabledChange={(enabled) => setSection("featureGrid", enabled)}
          >
            <EditorSectionNote>Three-column feature cards on the platform homepage.</EditorSectionNote>
            <EditorItemList
              onAdd={() =>
                commit({
                  ...config,
                  featureSections: [
                    ...config.featureSections,
                    {
                      id: `section-${Date.now()}`,
                      title: "New",
                      titleSerif: "feature",
                      body: "Description",
                    } satisfies HomepageFeatureSection,
                  ],
                })
              }
              addLabel="+ Add feature card"
            >
              {config.featureSections.map((section, i) => (
                <EditorItemPanel
                  key={section.id}
                  title={`Feature card ${i + 1}`}
                  onRemove={
                    config.featureSections.length <= 1
                      ? undefined
                      : () =>
                          commit({
                            ...config,
                            featureSections: config.featureSections.filter((_, idx) => idx !== i),
                          })
                  }
                  removeLabel="Remove card"
                >
                  <EditorFieldsGrid>
                    <Input
                      label="Title"
                      value={section.title}
                      onChange={(v) => {
                        const featureSections = [...config.featureSections];
                        featureSections[i] = { ...section, title: v };
                        onChange({ ...config, featureSections });
                      }}
                    />
                    <Input
                      label="Serif phrase"
                      value={section.titleSerif}
                      onChange={(v) => {
                        const featureSections = [...config.featureSections];
                        featureSections[i] = { ...section, titleSerif: v };
                        onChange({ ...config, featureSections });
                      }}
                    />
                    <Input
                      label="Icon keys (comma-separated)"
                      value={(section.iconKeys ?? []).join(", ")}
                      onChange={(v) => {
                        const featureSections = [...config.featureSections];
                        featureSections[i] = {
                          ...section,
                          iconKeys: v
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        };
                        onChange({ ...config, featureSections });
                      }}
                    />
                    <EditorFieldSpan>
                      <Input
                        label="Body"
                        value={section.body}
                        onChange={(v) => {
                          const featureSections = [...config.featureSections];
                          featureSections[i] = { ...section, body: v };
                          onChange({ ...config, featureSections });
                        }}
                      />
                    </EditorFieldSpan>
                  </EditorFieldsGrid>
                </EditorItemPanel>
              ))}
            </EditorItemList>
          </EditorAccordion>

          <EditorAccordion sectionId="brandSignup" title="Brand signup" enabled>
            <EditorFieldsGrid>
              <Input
                label="Promo title"
                value={config.brandSignup?.promoTitle ?? ""}
                onChange={(v) =>
                  onChange({ ...config, brandSignup: { ...config.brandSignup!, promoTitle: v } })
                }
              />
              <Input
                label="Promo subtitle"
                value={config.brandSignup?.promoSubtitle ?? ""}
                onChange={(v) =>
                  onChange({ ...config, brandSignup: { ...config.brandSignup!, promoSubtitle: v } })
                }
              />
              <EditorFieldSpan>
                <MarketingMediaField
                  label="Promo image"
                  value={config.brandSignup?.promoImageUrl ?? ""}
                  onChange={(v) =>
                    commitMedia({
                      ...config,
                      brandSignup: {
                        ...config.brandSignup!,
                        promoImageUrl: v || undefined,
                      },
                    })
                  }
                  mediaType="image"
                  uploadSubdir="brand-signup-promo"
                  uploadScope={uploadScope}
                  layout="hero"
                />
              </EditorFieldSpan>
              <Input
                label="Step 1 label"
                value={config.brandSignup?.steps[0] ?? ""}
                onChange={(v) => {
                  const steps = [...(config.brandSignup?.steps ?? ["", "", ""])] as [string, string, string];
                  steps[0] = v;
                  onChange({ ...config, brandSignup: { ...config.brandSignup!, steps } });
                }}
              />
              <Input
                label="Step 2 label"
                value={config.brandSignup?.steps[1] ?? ""}
                onChange={(v) => {
                  const steps = [...(config.brandSignup?.steps ?? ["", "", ""])] as [string, string, string];
                  steps[1] = v;
                  onChange({ ...config, brandSignup: { ...config.brandSignup!, steps } });
                }}
              />
              <Input
                label="Step 3 label"
                value={config.brandSignup?.steps[2] ?? ""}
                onChange={(v) => {
                  const steps = [...(config.brandSignup?.steps ?? ["", "", ""])] as [string, string, string];
                  steps[2] = v;
                  onChange({ ...config, brandSignup: { ...config.brandSignup!, steps } });
                }}
              />
              <Input
                label="Form title"
                value={config.brandSignup?.formTitle ?? ""}
                onChange={(v) =>
                  onChange({ ...config, brandSignup: { ...config.brandSignup!, formTitle: v } })
                }
              />
              <Input
                label="Form subtitle"
                value={config.brandSignup?.formSubtitle ?? ""}
                onChange={(v) =>
                  onChange({ ...config, brandSignup: { ...config.brandSignup!, formSubtitle: v } })
                }
              />
              <Input
                label="Submit button label"
                value={config.brandSignup?.submitLabel ?? ""}
                onChange={(v) =>
                  onChange({ ...config, brandSignup: { ...config.brandSignup!, submitLabel: v } })
                }
              />
            </EditorFieldsGrid>
          </EditorAccordion>
        </>
      ) : null}

      {!isPlatformEditor ? (
      <>
      <EditorAccordion
        sectionId="featureScroll"
        title="Feature sections (phone blocks)"
        enabled={sections.featureScroll}
        onEnabledChange={(enabled) => setSection("featureScroll", enabled)}
      >
        <EditorSectionNote>
          Remove blocks you do not need. Keep at least one when this section is enabled — the public site supports any count.
        </EditorSectionNote>
        <EditorItemList
          onAdd={() =>
            commit({
              ...config,
              featureSections: [
                ...config.featureSections,
                {
                  id: `section-${Date.now()}`,
                  title: "New",
                  titleSerif: "section.",
                  body: "Description",
                } satisfies HomepageFeatureSection,
              ],
            })
          }
          addLabel="+ Add feature section"
        >
          {config.featureSections.map((section, i) => (
            <EditorItemPanel
              key={section.id}
              title={`Feature block ${i + 1}`}
              onRemove={
                config.featureSections.length <= 1
                  ? undefined
                  : () =>
                      commit({
                        ...config,
                        featureSections: config.featureSections.filter((_, idx) => idx !== i),
                      })
              }
              removeLabel="Remove this block"
            >
              <EditorFieldsGrid>
                <Input
                  label="Title"
                  value={section.title}
                  onChange={(v) => {
                    const featureSections = [...config.featureSections];
                    featureSections[i] = { ...section, title: v };
                    onChange({ ...config, featureSections });
                  }}
                />
                <Input
                  label="Serif phrase"
                  value={section.titleSerif}
                  onChange={(v) => {
                    const featureSections = [...config.featureSections];
                    featureSections[i] = { ...section, titleSerif: v };
                    onChange({ ...config, featureSections });
                  }}
                />
                <EditorFieldSpan>
                  <Input
                    label="Body"
                    value={section.body}
                    onChange={(v) => {
                      const featureSections = [...config.featureSections];
                      featureSections[i] = { ...section, body: v };
                      onChange({ ...config, featureSections });
                    }}
                  />
                </EditorFieldSpan>
                <EditorFieldSpan>
                  <MarketingMediaField
                    label="Phone screen video"
                    value={section.videoUrl ?? ""}
                    onChange={(v) => {
                      const featureSections = [...config.featureSections];
                      featureSections[i] = { ...section, videoUrl: v || undefined };
                      commitMedia({ ...config, featureSections });
                    }}
                    mediaType="video"
                    uploadSubdir={`feature-${section.id}`}
                    uploadScope={uploadScope}
                    layout="hero"
                  />
                </EditorFieldSpan>
              </EditorFieldsGrid>
            </EditorItemPanel>
          ))}
        </EditorItemList>
      </EditorAccordion>

      <EditorAccordion
        sectionId="highlights"
        title="Highlight cards (horizontal scroller)"
        enabled={sections.highlights}
        onEnabledChange={(enabled) => setSection("highlights", enabled)}
      >
        <EditorSectionNote>
          Each card appears in the horizontal scroller. Remove cards to show fewer items (e.g. 3 instead of 5).
        </EditorSectionNote>
        <EditorItemList
          onAdd={() =>
            commit({
              ...config,
              showcaseCards: [
                ...config.showcaseCards,
                {
                  id: `showcase-${Date.now()}`,
                  title: "New",
                  titleItalic: "highlight",
                  body: "Description",
                  layout: "image-dark",
                } satisfies HomepageShowcaseCard,
              ],
            })
          }
          addLabel="+ Add highlight card"
        >
          {config.showcaseCards.map((card, i) => (
            <EditorItemPanel
              key={card.id}
              title={`Highlight card ${i + 1}`}
              onRemove={() =>
                commit({
                  ...config,
                  showcaseCards: config.showcaseCards.filter((_, idx) => idx !== i),
                })
              }
              removeLabel="Remove this card"
            >
              <EditorFieldsGrid>
                <Input
                  label="Title"
                  value={card.title}
                  onChange={(v) => {
                    const showcaseCards = [...config.showcaseCards];
                    showcaseCards[i] = { ...card, title: v };
                    onChange({ ...config, showcaseCards });
                  }}
                />
                <Input
                  label="Italic phrase"
                  value={card.titleItalic}
                  onChange={(v) => {
                    const showcaseCards = [...config.showcaseCards];
                    showcaseCards[i] = { ...card, titleItalic: v };
                    onChange({ ...config, showcaseCards });
                  }}
                />
                <EditorFieldSpan>
                  <Input
                    label="Body"
                    value={card.body}
                    onChange={(v) => {
                      const showcaseCards = [...config.showcaseCards];
                      showcaseCards[i] = { ...card, body: v };
                      onChange({ ...config, showcaseCards });
                    }}
                  />
                </EditorFieldSpan>
                <EditorFieldSpan>
                  <MarketingMediaField
                    label="Background image or video"
                    value={card.imageUrl ?? ""}
                    onChange={(v) => {
                      const showcaseCards = [...config.showcaseCards];
                      showcaseCards[i] = { ...card, imageUrl: v || undefined };
                      commitMedia({ ...config, showcaseCards });
                    }}
                    mediaType="image"
                    uploadSubdir={`showcase-${card.id}-bg`}
                    uploadScope={uploadScope}
                    layout="hero"
                    required={requireLeadPhoto && i === 0}
                  />
                </EditorFieldSpan>
                <EditorFieldSpan>
                  <MarketingMediaField
                    label="Phone image (white-phone layout)"
                    value={card.phoneImageUrl ?? ""}
                    onChange={(v) => {
                      const showcaseCards = [...config.showcaseCards];
                      showcaseCards[i] = { ...card, phoneImageUrl: v || undefined };
                      commitMedia({ ...config, showcaseCards });
                    }}
                    mediaType="image"
                    uploadSubdir={`showcase-${card.id}-phone`}
                    uploadScope={uploadScope}
                    layout="hero"
                  />
                </EditorFieldSpan>
              </EditorFieldsGrid>
            </EditorItemPanel>
          ))}
        </EditorItemList>
      </EditorAccordion>
      </>
      ) : null}

      {!isPlatformEditor ? (
      <EditorAccordion
        sectionId="upcomingEvents"
        title="Upcoming events"
        enabled={sections.upcomingEvents}
        onEnabledChange={(enabled) => setSection("upcomingEvents", enabled)}
      >
        <UpcomingEventsEditorFields
          config={config}
          onChange={onChange}
          commit={commit}
          commitMedia={commitMedia}
          uploadScope={uploadScope}
          portalMode={portalMode}
        />
      </EditorAccordion>
      ) : null}

      {!isPlatformEditor && portalMode === "brand" ? (
      <EditorAccordion
        sectionId="about"
        title="About Us"
        description="Company story, key features, team photos — full /about page"
        enabled={sections.about}
        onEnabledChange={(enabled) => setSection("about", enabled)}
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

      {!isPlatformEditor ? (
      <EditorAccordion
        sectionId="testimonials"
        title="Testimonials"
        enabled={sections.testimonials}
        onEnabledChange={(enabled) => setSection("testimonials", enabled)}
        splitAside={
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
            <EditorFieldSpan>
              <div className="ed-testimonial-editor__tip">
                <p className="ed-testimonial-editor__tip-title">
                  <span className="material-symbols-outlined ed-ms-icon" aria-hidden>
                    info
                  </span>
                  Editor tip
                </p>
                <p className="ed-text-sm ed-muted">
                  Keep testimonial quotes between 50–100 characters for optimal readability on mobile devices.
                </p>
              </div>
            </EditorFieldSpan>
          </EditorFieldsGrid>
        }
      >
        {testimonialsManagedExternally ? (
          testimonialsExternalHint ?? (
            <p className="ed-text-sm ed-muted">Published success stories appear on the live site automatically.</p>
          )
        ) : (
          <TestimonialsEditorSection
            items={config.testimonials.items}
            onChange={(items) => onChange({ ...config, testimonials: { ...config.testimonials, items } })}
            onCommit={(items) => commit({ ...config, testimonials: { ...config.testimonials, items } })}
          />
        )}
      </EditorAccordion>
      ) : null}

      <EditorAccordion
        sectionId="faq"
        title="FAQ"
        enabled={sections.faq}
        onEnabledChange={(enabled) => setSection("faq", enabled)}
      >
        <EditorItemList
          onAdd={() =>
            commit({
              ...config,
              faq: [...config.faq, { question: "New question?", answer: "Answer here." } satisfies HomepageFaq],
            })
          }
          addLabel="+ Add FAQ"
        >
          {config.faq.map((f, i) => (
            <EditorItemPanel
              key={`${f.question}-${i}`}
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

      {portalMode === "brand" && onLegalPagesChange ? (
        <FooterLegalPagesEditor
          uploadScope={{ mode: "brand", brandId: brandId ?? null }}
          legalPages={legalPages}
          onLegalPagesChange={onLegalPagesChange}
        />
      ) : null}

      {isPlatformEditor && onLegalPagesChange ? (
        <FooterLegalPagesEditor
          uploadScope={{ mode: "platform" }}
          legalPages={legalPages}
          onLegalPagesChange={onLegalPagesChange}
        />
      ) : null}

      {portalMode === "brand" && onSocialConnectChange ? (
        <SocialMediaConnectEditor socialConnect={socialConnect} onSocialConnectChange={onSocialConnectChange} />
      ) : null}
      </HomepageEditorSections>

      <EditorStaticSection
        sectionId="privacyFooter"
        title={isPlatformEditor ? "Pre-footer CTA & site footer" : "Privacy & Footer"}
      >
        <EditorFieldsGrid>
          {!isPlatformEditor ? (
            <>
              <EditorFieldSpan>
                <ToggleField
                  label="Show privacy section"
                  description="Trust block on homepage."
                  checked={sections.privacy}
                  onChange={(enabled) => setSection("privacy", enabled)}
                />
              </EditorFieldSpan>
            </>
          ) : null}
          {isPlatformEditor ? (
            <EditorFieldSpan>
              <ToggleField
                label="Show pre-footer CTA"
                description="Light call-to-action band above the site footer."
                checked={sections.footerCta}
                onChange={(enabled) => setSection("footerCta", enabled)}
              />
            </EditorFieldSpan>
          ) : null}
          <EditorFieldSpan>
            <ToggleField
              label="Show site footer"
              description="Link columns and copyright."
              checked={sections.footer}
              onChange={(enabled) => setSection("footer", enabled)}
            />
          </EditorFieldSpan>
          {!isPlatformEditor ? (
            <>
              <Input
                label="Privacy title"
                value={config.privacy.title}
                onChange={(v) => onChange({ ...config, privacy: { ...config.privacy, title: v } })}
              />
              <Input
                label="Privacy body"
                value={config.privacy.body}
                onChange={(v) => onChange({ ...config, privacy: { ...config.privacy, body: v } })}
              />
            </>
          ) : null}
          <Input
            label={isPlatformEditor ? "Pre-footer CTA title" : "Footer CTA title"}
            value={config.footerCta.title}
            onChange={(v) => onChange({ ...config, footerCta: { ...config.footerCta, title: v } })}
          />
          <Input
            label={isPlatformEditor ? "Pre-footer CTA subtitle" : "Footer CTA subtitle"}
            value={config.footerCta.subtitle}
            onChange={(v) => onChange({ ...config, footerCta: { ...config.footerCta, subtitle: v } })}
          />
          {isPlatformEditor ? (
            <>
              <Input
                label="Pre-footer CTA button label"
                value={config.footerCta.ctaLabel}
                onChange={(v) =>
                  onChange({ ...config, footerCta: { ...config.footerCta, ctaLabel: v } })
                }
              />
              <NavLinkHrefField
                label="Pre-footer CTA button link"
                value={config.footerCta.ctaHref}
                marketingTheme={marketingTheme}
                portalMode={portalMode}
                sections={sections}
                onChange={(v) =>
                  onChange({ ...config, footerCta: { ...config.footerCta, ctaHref: v } })
                }
              />
            </>
          ) : null}
          {!isPlatformEditor ? <FooterRichEditorFields config={config} onChange={onChange} /> : null}
          <Input
            label="Copyright"
            value={config.footer.copyright}
            onChange={(v) => onChange({ ...config, footer: { ...config.footer, copyright: v } })}
          />
          {isPlatformEditor ? (
            <>
              <EditorFieldSpan>
                <EditorSectionNote>
                  Footer columns use fixed headings: Product, Company, Connect, and Legal. Admin-only links are
                  removed automatically when the page is saved.
                </EditorSectionNote>
              </EditorFieldSpan>
              <FooterColumnLinksEditor
                title="Product links"
                links={config.footer.productLinks}
                onChange={(links) => updateFooterLinks("productLinks", links)}
                marketingTheme={marketingTheme}
                portalMode={portalMode}
                sections={sections}
              />
              <FooterColumnLinksEditor
                title="Company links"
                links={config.footer.companyLinks}
                onChange={(links) => updateFooterLinks("companyLinks", links)}
                marketingTheme={marketingTheme}
                portalMode={portalMode}
                sections={sections}
              />
              <FooterColumnLinksEditor
                title="Connect links"
                links={config.footer.connectLinks}
                onChange={(links) => updateFooterLinks("connectLinks", links)}
                marketingTheme={marketingTheme}
                portalMode={portalMode}
                sections={sections}
              />
              <NavLinkHrefField
                label="Legal — Privacy link"
                value={config.footer.privacyHref}
                marketingTheme={marketingTheme}
                portalMode={portalMode}
                sections={sections}
                onChange={(v) =>
                  onChange({ ...config, footer: { ...config.footer, privacyHref: v } })
                }
              />
              <NavLinkHrefField
                label="Legal — Terms link"
                value={config.footer.termsHref}
                marketingTheme={marketingTheme}
                portalMode={portalMode}
                sections={sections}
                onChange={(v) =>
                  onChange({ ...config, footer: { ...config.footer, termsHref: v } })
                }
              />
              <NavLinkHrefField
                label="Legal — Refund link"
                value={config.footer.refundHref}
                marketingTheme={marketingTheme}
                portalMode={portalMode}
                sections={sections}
                onChange={(v) =>
                  onChange({ ...config, footer: { ...config.footer, refundHref: v } })
                }
              />
            </>
          ) : (
            <>
              <EditorFieldSpan>
                <EditorSectionNote>
                  Privacy, Terms, and Refund policies are managed under the <strong>Privacy, Terms &amp; Refund</strong> accordion above.
                  Footer link columns are editable below.
                </EditorSectionNote>
              </EditorFieldSpan>
              <FooterColumnLinksEditor
                title="Product links"
                links={config.footer.productLinks}
                onChange={(links) => updateFooterLinks("productLinks", links)}
                marketingTheme={marketingTheme}
                portalMode={portalMode}
                sections={sections}
              />
              <FooterColumnLinksEditor
                title="Company links"
                links={config.footer.companyLinks}
                onChange={(links) => updateFooterLinks("companyLinks", links)}
                marketingTheme={marketingTheme}
                portalMode={portalMode}
                sections={sections}
              />
              <FooterColumnLinksEditor
                title="Connect links"
                links={config.footer.connectLinks}
                onChange={(links) => updateFooterLinks("connectLinks", links)}
                marketingTheme={marketingTheme}
                portalMode={portalMode}
                sections={sections}
              />
            </>
          )}
          <EditorFieldSpan>
            <MarketingMediaField
              label={isPlatformEditor ? "Pre-footer side image" : "Footer CTA background image or video"}
              value={config.footerCta.backgroundImageUrl ?? ""}
              onChange={(v) =>
                commitMedia({
                  ...config,
                  footerCta: { ...config.footerCta, backgroundImageUrl: v || undefined },
                })
              }
              mediaType="image"
              uploadSubdir="footer-background"
              uploadScope={uploadScope}
              layout="hero"
              recommendedSize="1920×800px"
              required={requireLeadPhoto}
            />
          </EditorFieldSpan>
        </EditorFieldsGrid>
      </EditorStaticSection>
    </>
  );
}

function FooterColumnLinksEditor({
  title,
  links,
  onChange,
  marketingTheme,
  portalMode,
  sections,
}: {
  title: string;
  links: HomepageLink[];
  onChange: (links: HomepageLink[]) => void;
  marketingTheme: MarketingTheme;
  portalMode: PortalMode;
  sections: HomepageSectionVisibility;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const onDragStart = (index: number) => (e: DragEvent) => {
    setDragIndex(index);
    setDragOverIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  };

  const onDrop = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    onChange(moveItem(links, dragIndex, index));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <EditorFieldSpan>
      <EditorItemList
        onAdd={() => onChange([...links, { label: "New link", href: "#" }])}
        addLabel={`+ Add ${title.toLowerCase().replace(/ links$/, "")} link`}
      >
        {links.map((link, i) => (
          <EditorItemPanel
            key={`footer-${title}-${i}-${link.label}`}
            title={`${title} ${i + 1}`}
            onRemove={() => onChange(links.filter((_, idx) => idx !== i))}
            removeLabel="Remove link"
            className={[
              dragIndex === i ? "ed-editor-nav-row--dragging" : "",
              dragOverIndex === i && dragIndex !== i ? "ed-editor-nav-row--drop-target" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            dragHandleProps={{
              draggable: true,
              onDragStart: onDragStart(i),
              onDragOver: onDragOver(i),
              onDrop: onDrop(i),
              onDragEnd,
            }}
          >
            <Input
              label="Label"
              value={link.label}
              onChange={(v) => {
                const next = [...links];
                next[i] = { ...link, label: v };
                onChange(next);
              }}
            />
            <NavLinkHrefField
              value={link.href}
              marketingTheme={marketingTheme}
              portalMode={portalMode}
              sections={sections}
              onChange={(v) => {
                const next = [...links];
                next[i] = { ...link, href: v };
                onChange(next);
              }}
            />
          </EditorItemPanel>
        ))}
      </EditorItemList>
    </EditorFieldSpan>
  );
}

function NavigationEditorSection({
  config,
  updateNavLinks,
  marketingTheme,
  portalMode,
}: {
  config: HomepageConfig;
  updateNavLinks: (links: HomepageLink[]) => void;
  marketingTheme: MarketingTheme;
  portalMode: PortalMode;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const onDragStart = (index: number) => (e: DragEvent) => {
    setDragIndex(index);
    setDragOverIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  };

  const onDrop = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    updateNavLinks(moveItem(config.nav.links, dragIndex, index));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <EditorStaticSection
      sectionId="navigation"
      title="Navigation Management"
      headerAction={
        <Button
          variant="primary"
          onClick={() =>
            updateNavLinks([...config.nav.links, { label: "New item", href: "#" } satisfies HomepageLink])
          }
        >
          + Add menu item
        </Button>
      }
    >
      <EditorSectionNote>
        Manage primary links in the top header bar. Pick a section target from the dropdown or choose Custom link for
        external URLs and paths.
      </EditorSectionNote>
      <EditorItemList>
        {config.nav.links.map((link, i) => (
          <EditorItemPanel
            key={`nav-link-${i}`}
            title={`Menu item ${i + 1}`}
            variant="nav"
            onRemove={() => updateNavLinks(config.nav.links.filter((_, idx) => idx !== i))}
            removeLabel="Remove menu item"
            className={[
              dragIndex === i ? "ed-editor-nav-row--dragging" : "",
              dragOverIndex === i && dragIndex !== i ? "ed-editor-nav-row--drop-target" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            dragHandleProps={{
              draggable: true,
              onDragStart: onDragStart(i),
              onDragOver: onDragOver(i),
              onDrop: onDrop(i),
              onDragEnd,
            }}
          >
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
          </EditorItemPanel>
        ))}
      </EditorItemList>
    </EditorStaticSection>
  );
}

function TestimonialsEditorSection({
  items,
  onChange,
  onCommit,
}: {
  items: HomepageTestimonial[];
  onChange: (items: HomepageTestimonial[]) => void;
  onCommit: (items: HomepageTestimonial[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const updateItem = (index: number, patch: Partial<HomepageTestimonial>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const removeItem = (index: number) => {
    onCommit(items.filter((_, i) => i !== index));
  };

  const move = (from: number, to: number) => {
    onCommit(moveItem(items, from, to));
  };

  const onDragStart = (index: number) => (e: DragEvent) => {
    setDragIndex(index);
    setDragOverIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  };

  const onDrop = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    onCommit(moveItem(items, dragIndex, index));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <EditorItemList
      onAdd={() =>
        onCommit([
          ...items,
          {
            quote: "Add a testimonial quote between 50 and 100 characters for best results.",
            author: "Author name",
          },
        ])
      }
      addLabel="+ Add testimonial"
      className="ed-testimonial-editor"
    >
      {items.map((t, i) => {
        const quoteStatus = testimonialQuoteLengthHint(t.quote.trim().length);
        return (
          <EditorItemPanel
            key={`testimonial-${i}-${t.author}`}
            title={`Testimonial ${i + 1}`}
            onRemove={() => removeItem(i)}
            removeLabel="Remove testimonial"
            className={[
              "ed-testimonial-editor__item",
              dragIndex === i ? "ed-testimonial-editor__item--dragging" : "",
              dragOverIndex === i && dragIndex !== i ? "ed-testimonial-editor__item--drop-target" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div
              draggable
              onDragStart={onDragStart(i)}
              onDragOver={onDragOver(i)}
              onDrop={onDrop(i)}
              onDragEnd={onDragEnd}
            >
              <div className="ed-testimonial-editor__toolbar">
                <span className="ed-testimonial-editor__handle" aria-hidden>
                  ⋮⋮ Drag
                </span>
                <Button variant="ghost" onClick={() => move(i, i - 1)} disabled={i === 0}>
                  Move up
                </Button>
                <Button variant="ghost" onClick={() => move(i, i + 1)} disabled={i === items.length - 1}>
                  Move down
                </Button>
              </div>
              <EditorFieldsGrid>
                <EditorFieldSpan>
                  <Input label="Quote" value={t.quote} onChange={(v) => updateItem(i, { quote: v })} />
                  <p
                    className={[
                      "ed-testimonial-editor__char-hint",
                      quoteStatus !== "ok" ? "ed-testimonial-editor__char-hint--warn" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {formatTestimonialQuoteCount(t.quote.trim().length)}
                    {quoteStatus === "short" ? " — quote is shorter than recommended." : null}
                    {quoteStatus === "long" ? " — quote exceeds recommended length." : null}
                  </p>
                </EditorFieldSpan>
                <Input label="Author" value={t.author} onChange={(v) => updateItem(i, { author: v })} />
              </EditorFieldsGrid>
            </div>
          </EditorItemPanel>
        );
      })}
    </EditorItemList>
  );
}
