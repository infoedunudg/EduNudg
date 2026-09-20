# Marketing landing pages (shared base theme)

Public marketing landings share one UI kit under `apps/web/src/features/marketing/`. The same layout and CSS apply to:

| Host | Route `/` | Config source |
|------|-----------|---------------|
| Platform | `MarketingPublicLayout` | `platform_settings` key `marketing_homepage` |
| Brand | `BrandPublicLayout` | RPC `get_brand_landing_public` + `buildBrandLandingConfig` |
| Center | `CenterPublicLayout` | RPC `get_center_landing_public` + theme-aware merge (`mergeAbacusClassicCenterLandingConfig`, `mergeSparkAcademyCenterLandingConfig`, `mergeEduLearnCenterLandingConfig`, or `buildCenterLandingConfig`) |

**Platform legacy gate:** `isLegacyPlatformHomepageSeed()` only replaces the virgin Novu seed. Rows with enterprise blocks or uploaded `brand-assets` URLs are merged as-is (Novu `bgGradient` / `themeNote` alone must not discard media).

**Brand / center content safety:** public + editor paths must always merge stored `landing` / `center_landing`. Fallbacks must not drop landing JSON. Saves use `preserveCustomMarketingMediaUrls`. Seed must not full-replace `brand_settings.settings`. See rule `marketing-homepage-media` and `marketingMediaGuard.ts`. Brand `/app` Center Health treats homepage (`landing` via `/app/homepage`) and franchise site (`center_landing` via `/app/center-site`) as set only when stored JSON has real content (`hasConfiguredMarketingLanding`); empty `{}` or seed-only `{ hero: { subtitle } }` does not count.

**Public SEO / AEO / GEO:** titles, descriptions, canonicals, Open Graph, robots, and JSON-LD are derived automatically (`derivePublicSeo` in `publicSeo.ts`) from landing, published courses, legal uploads, and franchise identity. No SEO editor fields. `PortalDocumentHead` applies the same snapshot in the SPA. Production Vercel rewrites `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/.well-known/ai.txt` ahead of the SPA catch-all, and injects head tags only on indexable HTML (`/`, `/about`, `/courses/:slug`, `/legal/:kind`). `/login` and `/app` stay on static `/index.html` so a function crash cannot take down staff login. Sitemaps list real routes only (not `#programs`, `/login`, or unpublished `/about`). Center homepages localize `{Brand} in {City}` and canonicalize to the center host. Spec: [`openspec/specs/public-seo/spec.md`](../../openspec/specs/public-seo/spec.md).

**Legal HTML:** Word uploads are converted with Mammoth, then sanitized via `sanitizeLegalHtml` (DOMPurify) before Storage write and again before public inject (`BrandLegalPageContent`). Spec: [`openspec/specs/marketing-footer/spec.md`](../../openspec/specs/marketing-footer/spec.md).

## Brand marketing themes

Platform admins assign a theme per brand at **Platform → Brands → Edit** (`/admin/brands/:slug`) in **Brand settings** → **Website theme**. Stored on `brands.marketing_theme`. **Site logo** and a renamed **Name** on that same form persist to Homepage `landing.meta` (shared with `{brand}/app/homepage`) — `brands.logo_url` is only the login/chrome copy.

| Theme | Layout | Editor (brand owners) |
|-------|--------|------------------------|
| `novu` (default) | Phone-scroll features, Novu nav | `HomepageEditorForm` at `/app/homepage` and `/app/center-site` |
| `abacus-classic` | Success Abacus-style sections, dual CTAs, modals | `AbacusClassicEditorForm` at `/app/homepage` and `/app/center-site` |
| `spark-academy` | Educat-style courses grid, mentors, journey stats | `AbacusClassicEditorForm` at `/app/homepage` and `/app/center-site` |
| `edu-learn` | Green/orange EduLearn layout (doodle underlines, rounded cards). Same courses, FAQ, and **Apply franchise** as Spark when that JSON exists | `AbacusClassicEditorForm` at `/app/homepage` and `/app/center-site` |

Brand owners edit **content** at `{brand}.localhost:9000/app/homepage` (brand site) and `{brand}.localhost:9000/app/center-site` (center enrollment template). Theme selection is platform-only (brand detail **Brand settings**, not the brands list).

**Required photos:** the first photo upload in each editor section is mandatory (Site logo, Hero background, first mentor photo, first gallery image, Spark Features / Journey images, first event cover when events exist). Extra photos in the same section stay optional. About Us **Hero banner image** is not required when homepage Hero is enabled — Spark `/about` uses that Hero photo as fallback (`regression_spark_homepage_hero_photo_satisfies_about_hero_requirement`). Save lists missing required photos. Regressions: `regression_required_photo_shows_asterisk_and_hint_when_empty`, `regression_spark_homepage_requires_first_photo_per_section`.

**Unsaved navigation:** leaving `/app/homepage` or `/app/center-site` with draft edits opens **Save your changes?** (themed to the site’s marketing theme) and scrolls to the bottom save bar (`regression_unsaved_marketing_navigation_opens_dialog_and_scrolls`, `regression_unsaved_marketing_dialog_uses_website_theme_and_ok_cancel`). Buttons are **OK** (save, then leave) and **Cancel** (stay). Browser tab close uses `beforeunload`. The SPA uses `BrowserRouter`, so this guard intercepts in-app `<a>` clicks — it must not call `useBlocker` (`regression_unsaved_marketing_hook_does_not_require_data_router`).

**Social Media Connect** configures Facebook and Instagram footer icons only. Brand public landing does **not** show a floating WhatsApp chat button or message bubble (legacy `social_connect` WhatsApp fields are ignored on render).

**Center public footer:** icons use brand **Social Media Connect** (`social_connect` Facebook/Instagram) — the same URLs as the brand homepage. They must **not** use `franchise_centers.social_links`. Center Settings has no **Social presence** / **+ Add social link** editor; profile save passes through existing `social_links` (`regression_center_settings_omits_social_presence`, `regression_center_landing_footer_uses_brand_social_connect`). Brand landing stays Facebook/Instagram only (no WhatsApp float). Franchise Management (`/app/centers`) has no Social Media section (`regression_brand_centers_detail_omits_social_media_section`).

**Center public contact:** all four themes overlay Franchise Management Location & Contact in the footer (`centerFooterContactFromProfile` → `centerContact` on `CenterPublicLayout`). Novu adds a **This center** column (and still shows the about-center blurb). Abacus replaces **Head office** with **This center**. Spark **Contact Us** uses the franchise phone and address (no `(222)` placeholder). EduLearn uses the same franchise overlay in `EduLearnFooter`. Brand HQ / “Our presence” stay on the **brand** site only.

**Center public nav lockup:** franchise hosts (`brandSlug` on `AbacusClassicNav` / `SparkAcademyNav` / `EduLearnNav` / `MarketingNav`) use `--franchise` modifiers so the franchise site name is larger and bolder, with a smaller **by {brand}** line when the names differ (`regression_franchise_nav_shows_center_then_by_brand`). The brand Site logo uses the same size on brand and franchise public nav and has no ring or frame (`regression_public_nav_logo_matches_franchise_size_without_border`).

When a brand switches from Novu to Abacus Classic, Spark Academy, or EduLearn, stored `landing` JSON is merged with the new theme defaults. **Novu-era section toggles do not disable Abacus/Spark/EduLearn sections** until the brand owner saves from the alternate-theme editor (detected via Abacus/Spark-specific fields in JSON; EduLearn also honors those markers). Shared copy (hero, FAQ, testimonials, features, courses, **Apply franchise**) is preserved. See `mergeAbacusClassicSectionVisibility()` / `mergeEduLearnSectionVisibility()` in `homepageSections.ts`.

Brand detail (`/admin/brands/:slug`) covers performance KPIs, brand settings (**Website theme**, **Site logo** / name into Homepage `landing.meta`), domains, and franchise centers.

Abacus Classic sections (in order): hero → programs grid (from brand curriculum DB) → feature grid → founders → trust/video + stat cards → success stories carousel → FAQ → photo gallery → **About Us** (`#about`, when enabled) → rich footer (live center/student counts + custom stats). Brand staff manage carousel quotes at `/app/success-stories` (pipeline chrome + Published/Draft/With photo/Total KPIs).

**Public testimonials are brand success stories only.** Brand and franchise homepages (`applyPublishedSuccessStoriesToPublicLanding`) replace theme dummy quotes with published `brand_success_stories`. If the brand has none, `#testimonials` is omitted (no Spark “What Our Learners Are Saying” placeholders) so new franchise onboarding stays empty until real feedback exists. Regression: `regression_center_hides_dummy_testimonials_when_brand_has_no_stories`, `regression_center_shows_brand_success_stories_on_homepage`, `regression_brand_hides_dummy_testimonials_when_no_published_stories`.

Center enrollment sites (`{center}.{brand}`) inherit the brand's `marketing_theme`. Program cards on the franchise public site are **that center’s enabled programs** (`center_program_enablement`), not the full brand catalog. Center sites accordion copy/images still apply when a card name matches an enabled course. Center copy (hero, city) comes from `mergeAbacusClassicCenterLandingConfig()` merged with `brand_settings.center_landing`.

The brand homepage editor previews center landing with placeholder **Sample Center**. On View Frontend, `overlayCenterLandingIdentity` replaces that placeholder with Franchise Identity **Display name** (else franchise name). Copyright drops the redundant “Part of {brand}” when those names match.

Brand **Mentors / Leadership** (homepage accordion; Spark public label is Meet Our Expert Mentors) stores people in `landing.founders`. The editor seeds **one** dummy card so staff can see the fields; Spark no longer pre-fills five Unsplash stock mentors (`regression_spark_mentors_default_to_one_example_profile`). Leftover saved stock names collapse to that one example on load (`regression_spark_mentors_collapse_saved_stock_placeholders_to_one`); custom mentors and empty **Add** cards stay (`regression_spark_mentors_keep_custom_profiles_and_one_stock_example`). Template names **Founder name** / **Name** are never shown on the live brand or franchise site (`visiblePublicFounders`). Set the real person’s name in that accordion. Spark mentor cards show **Role badge** and **Title** together (Abacus shows both; Spark used to hide the badge when title was set) — `regression_spark_mentor_card_shows_role_badge_and_title`. EduLearn renders the same fields in **Meet our leadership** (`#founders`) — `regression_edu_learn_mentor_card_shows_role_badge_and_title`.

Center/franchise **Mentors** (`#founders`) always keep the brand homepage founder(s) from `landing.founders`. When Franchise Identity has a distinct owner name (not the display/brand name) or a center master photo, that franchiser card is **first**, then the brand owner. If the franchiser is missing, the brand owner stays in first place. Theme placeholders (`Founder name`, Sample Center, Spark Unsplash stock mentors) are omitted. RPC `get_center_landing_public` returns `brand_founders` for this overlay (`overlayCenterFoundersFromIdentity`).

**Franchise apply is brand-only:** center public layouts run `sanitizeCenterPublicNavConfig()` so **Apply franchise** / `#apply` secondary CTAs never appear on center hosts (Vercel `?portal=center` or `{center}.{brand}.localhost`). Brand landings keep dual CTAs.

**Upcoming events:** Homepage editor section (like Leadership profiles). Brand adds competitions / workshops / demos with optional image, date, time, duration. Public `#events` shows only upcoming items (capped by `maxItems`). Works on Abacus, Spark, EduLearn, and Novu brand themes.

**Trust & video YouTube:** Abacus Classic embeds in `#trust`. Spark Academy keeps the Journey highlight photo and adds a 16:9 embed under `#journey` (`#trust`) when `trustMedia.youtubeUrl` is set (`regression_spark_journey_renders_youtube_below_photo`). EduLearn does the same under Why choose us. Shorts URLs convert to embed (`regression_youtube_shorts_url_converts_to_embed`).

**About Us (brand only):** Homepage editor **About Us** accordion stores `landing.about` (company story, philosophy, differentiators, what we do, team photo grid, dual CTAs). Public route **`/about`** when `publishPage` is not false and content exists; unpublished/empty redirects to `/`. Loading `/about` scrolls the viewport to the top (`regression_about_page_scrolls_to_top_on_load`) unless a hash is present. Novu keeps the Mastermind navy layout; Abacus Classic uses `.about-us--abacus-classic`. Spark Academy `/about` reuses homepage Hero / Features / Journey / Mentors blocks (`SparkAcademyAbout`; `regression_spark_about_page_uses_homepage_section_blocks`) instead of Mastermind About chrome. About-only media is `landing.about.heroImageUrl` and `philosophyImageUrl`. Spark `/about` omits homepage hero/features badges (`regression_spark_about_hero_omits_homepage_badges`, `regression_spark_about_features_omits_float_badges`). Optional homepage `#about` teaser via section toggle (`sections.about`, default off) — **Abacus Classic and Novu only**, after Gallery. Spark Academy does **not** render `#about` / ABOUT / WHAT MAKES US DIFFERENT on `/` (`regression_spark_homepage_omits_about_teaser_sections`); leftover `#about` nav is rewritten to `/about`. When the homepage About section is enabled on Abacus/Novu, public nav auto-injects **About Us → `#about`**. Spark does **not** auto-inject About Us — that menu item comes from **Navigation & CTAs** (`regression_spark_does_not_inject_about_nav`). Media via `brand-assets` + `preserveCustomMarketingMediaUrls`. Regression: `regression_spark_about_page_uses_spark_theme_classes`.

Program cards are edited on **Curriculum**, not Homepage. Brand `/app/homepage` and `/app/center-site` hide **Courses designed for success**, **Programs grid**, and **Curriculum syllabus** (`regression_homepage_hides_courses_and_curriculum_syllabus_editors`). On the **brand** site for **Abacus Classic**, leftover named `programsSection` cards still win if they exist in stored JSON; otherwise the grid falls back to all published curriculum programs. On **Spark Academy** and **EduLearn**, **Courses** prefers published `/app/curriculum` (`publicCurriculum`); leftover homepage cards are used only when no published courses exist (`resolveSparkCoursePrograms`). Curriculum Course Banner files live per course in `brand-assets` (`{brandId}/marketing/program-marketing/{courseId}/asset.{ext}`); public cards still read `programs.marketing_image_url`. On a **franchise (center)** site, `get_center_landing_public` returns only programs in `center_program_enablement`, and Center sites cards are restricted to those names (`restrictProgramsSectionToEnabledCurriculum`).

**Public nav anchors (all themes)**

Nav links are configured in the homepage editor (`config.nav.links`). Brand owners choose **labels** freely; hrefs must match on-page section IDs.

Hash section links (`#gallery`, `#faq`, …) are resolved with `resolveMarketingSectionHref` via `MarketingSectionNavLink` in Abacus / Spark / Novu navs: on `/` they stay as `#…`; from `/about`, `/courses/:slug`, or other routes they become `/#…` so Gallery and other homepage sections remain reachable.

| Theme | Default programs link | Curriculum / programs target | Full curriculum tree |
|-------|----------------------|------------------------------|----------------------|
| `novu` | — (auto **Curriculum** when published programs exist) | `#curriculum` → `CurriculumPublicSection` | Yes |
| `abacus-classic` | **Programs** → `#programs` | **`#curriculum`** → syllabus section (`AbacusCurriculumSection`) | No (marketing grid + syllabus tree) |
| `spark-academy` | **Courses** → `#programs` | `#curriculum` alias scrolls to **Courses designed for success** (published syllabus cards) | No |
| `edu-learn` | **Courses** → `#programs` | `#curriculum` alias scrolls to **Courses** (published syllabus cards) | No |

`syncMarketingNavLinks()` in `marketingPublicSite.ts` auto-adds **Curriculum → `#curriculum`** on Novu only when RPC returns published programs. Alternate themes keep default **Programs** links; custom `#curriculum` hrefs still work via an in-section anchor alias.

Direct URLs such as `/#curriculum` scroll after the landing bundle loads (`scrollToMarketingHash` in `BrandPublicLayout` / `CenterPublicLayout`).

### Homepage editor nav Link dropdown

In **Navigation & CTAs** (Abacus/Spark) or **Navigation Management** (Novu), each menu item **Link** field is a theme-aware dropdown plus optional **Custom link** text input. Presets match on-page section IDs above; Novu brand vs center templates differ (`#apply` vs `#register`). Helpers live in `marketingNavSectionOptions()` / `NavLinkHrefField` (`HomepageEditorShell.tsx`). Legacy mistyped anchors such as `#FoundersSection` normalize to `#founders` when saved.

**Spark Academy Link dropdown:** do not list `Programs (#programs)` or `About us (#features)` — those duplicated Abacus-style labels. Use `Courses (#programs)` for the courses block (`#curriculum` is an in-section alias, not a second option) and `Features (#features)` for the features block. Include `Photo gallery (#gallery)` and `Login (/login)`. `About page (/about)` stays; `About section (#about)` is omitted (no homepage teaser). Regression: `regression_spark_nav_dropdown_omits_duplicate_programs_and_about_us`, `regression_spark_login_is_nav_preset`.

**Spark Academy photo gallery:** public `#gallery` reads `config.gallery` from **Photo gallery** in `/app/homepage` / `/app/center-site`. Empty galleries stay hidden. Photos use a single-row CSS marquee so every image scrolls horizontally (no wrapping grid). Regression: `regression_spark_photo_gallery_renders_homepage_images`, `regression_spark_gallery_marquee_duplicates_photos_for_loop`, `regression_spark_gallery_marquee_css_scrolls_all_photos`.

**Spark Academy public nav:** header and hamburger drawer render **Navigation & CTAs** menu items and the primary CTA. The secondary franchise CTA is in the desktop header and, on mobile/tablet (`max-width: 1023px`), only in the left-hand drawer. The drawer uses Spark Academy Inter and navy/blue tokens and shows the Site logo immediately before the brand name. Brand hosts do not hardcode **Login**. Franchise hosts keep **Student Login** and omit the secondary franchise CTA. Regression: `regression_spark_nav_omits_hardcoded_login_on_brand_site`, `regression_spark_nav_shows_secondary_cta_from_navigation`, `regression_spark_mobile_secondary_cta_header_uses_drawer_only_class`, `regression_spark_nav_drawer_css_uses_theme_tokens_and_hides_header_secondary`, `regression_spark_drawer_shows_logo_before_brand_name`, `regression_spark_drawer_uses_student_login_on_franchise`.

**Homepage editor Save:** **Save changes** stays clickable with no edits (`EditorSaveBar` disables only while Saving…). Discard still appears only for unsaved diffs. Regression: `regression_homepage_save_stays_enabled_when_clean`.

**Navigation & CTAs labels:** Primary CTA label and Secondary CTA label update the local `nav` draft only — they must not copy into `hero` or persist/refetch on each keystroke (`regression_nav_cta_labels_do_not_persist_on_type`).

**Hero CTA (Abacus/Spark):** **Hero CTA label** and **Hero CTA link** in the Hero accordion control the public hero button (`hero.ctaLabel` / `hero.ctaHref`). Empty values fall back to the header Primary CTA. Regression: `regression_hero_cta_is_independent_of_nav_primary`, `regression_spark_hero_uses_hero_cta_not_nav`.

**Spark Academy headings:** section `h2`s share `--sa-h2-*` (Inter, `clamp(1.75rem, 4vw, 2.25rem)`, weight 800). Card/list `h3`s share `--sa-h3-*`. Hero stays `--sa-h1-size`. Upcoming events and `/about` titles inherit the same Spark tokens. Regression: `regression_spark_section_headings_share_type_scale`.

**Spark Academy Success stories:** desktop keeps a centered wrapping grid. On `max-width: 767px` the track is a horizontal snap carousel that auto-advances (paused on swipe / `prefers-reduced-motion`). Regression: `regression_spark_testimonials_mobile_carousel_markup`, `regression_spark_testimonials_mobile_autoscroll_advances`.

**Spark Academy photo floats:** hero Course stays on `sa-hero__photo-stage` (top-left). Features Last month / Learning Progress sit on `sa-features__visual` corners (top-left / bottom-right) so they do not cover the photo. Last month has no **View all →** action (`regression_spark_features_omits_view_all_float_action`). Regression: `regression_spark_hero_course_float_anchors_to_photo_stage`, `regression_spark_features_floats_sit_on_visual_corners`.

**Abacus Classic syllabus:** Toggle **Curriculum syllabus** in the homepage editor (visible by default). Content comes from published `/app/curriculum` data; no separate copy fields in v1.

**Spark Academy syllabus:** The same published `/app/curriculum` catalog fills **Courses designed for success**. Homepage program cards do not override published courses (`regression_spark_courses_use_published_curriculum_over_homepage_cards`). Published courses still show if leftover `programsGrid` is off (`regression_spark_courses_show_published_syllabus_even_if_programs_grid_off`). The section title and course cards are centered (`sa-section-head--center`, `sa-courses__grid--center`). Every published course is listed (`regression_spark_courses_lists_all_published_programs`). Course media/title open `/courses/:slug` (`regression_spark_course_card_links_to_public_detail`). The detail page uses a cinematic hero + viewport-fixed enroll offer card (`regression_public_course_page_has_enroll_offer_card`, `regression_public_course_enroll_card_stays_sticky_while_scrolling`), the same public layout/theme as `/`, and the Spark `--sa-page` canvas (`regression_spark_course_page_uses_courses_section_background`, `regression_public_course_page_shows_curriculum_fields`).

See [Abacus Classic theme](./abacus-classic.md) for Sprint 1–3 scope, component map, automated tests, and manual QA checklists.

See [Spark Academy theme](./spark-academy.md) for Educat-style sections and shared lead-modal deep links.

See [EduLearn theme](./edu-learn.md) for the green/orange screenshot layout (same homepage JSON, Curriculum courses, **Apply franchise**, and lead modals).

See `apps/web/src/features/marketing/abacus-classic/`, `apps/web/src/features/marketing/spark-academy/`, and `apps/web/src/features/marketing/edu-learn/`.

## Platform React Query keys (do not collapse)

| Key constant | Value | Consumers | Cache shape |
|--------------|-------|-----------|-------------|
| `MARKETING_HOMEPAGE_CONFIG_QUERY_KEY` | `["marketing-homepage"]` | Favicon, shell branding, editors | `HomepageConfig` |
| `MARKETING_PUBLIC_BUNDLE_QUERY_KEY` | `["marketing-homepage", "public-bundle"]` | `MarketingPublicLayout` | `{ config, legalPages }` |

Sharing one key caused login to stick on **Loading…** after visiting the public homepage. Spec: [`openspec/specs/marketing-homepage/spec.md`](../../openspec/specs/marketing-homepage/spec.md).

**Platform `/login` chrome:** `MarketingPublicLayout` wraps `/login` with the same `EnterpriseNav` + `EnterpriseSiteFooter` as `/`. The layout root adds `marketing-page--login` so the form sits between header and footer without a full-viewport admin `ThemeProvider`. Regression: `regression_login_renders_platform_nav_and_footer`, `regression_platform_login_renders_marketing_nav_and_footer`.

**Brand `/login` chrome:** `BrandPublicLayout` wraps `{brand}/login` with the same theme nav and footer as `{brand}/` (Abacus Classic, Spark Academy, or Novu). Regression: `regression_brand_login_renders_public_nav_and_footer`.

**Learn `/login` chrome:** `LearnPublicLoginLayout` wraps `learn.{brand}/login` with franchise public nav/footer when `?center=`, a franchise-host referrer, or sessionStorage identifies the center (Student Login and Copy Profile URL pass that slug). Nav/CTA/footer links use the franchise public origin. Without a center, brand public chrome is the fallback. Regression: `regression_learn_login_renders_franchise_nav_and_footer`.

## Lead modals (Abacus / Spark)

Deep links `#enroll`, `#enroll-student`, `#register` → enroll modal; `#apply` → franchise modal. Spark Academy skins those dialogs (`ac-modal--spark`, Inter/navy/pill). Center Path B passes `centerSlug` so enroll submits `submit_center_student_registration`. See [spark-academy.md](./spark-academy.md) and [abacus-classic.md](./abacus-classic.md). The Spark homepage also fades the hero in, scroll-reveals sections with an unhurried vertical lift (`sa-reveal` ~0.95s), then staggers items inside each block with a slower fade-and-scale (`sa-reveal-item` ~1.1s; `prefers-reduced-motion` off). Regression: `regression_spark_lead_modals_use_theme_classes`, `regression_spark_homepage_motion_css_respects_reduced_motion`, `regression_spark_section_items_stagger_inside_blocks`.

Staff apps live under `/login` (public) and `/app` (authenticated) for brand and center portals.

Admin portal styling (Vivid Logic): shared shell, dark mode toggle, uniform two-column homepage editor UX (`EditorFieldsGrid`, card panels, primary/danger buttons), and center detail layout — see [Vivid Logic admin UX](./vivid-logic-admin.md).

## Components

| Piece | File | Notes |
|-------|------|--------|
| Nav | `MarketingNav.tsx` | Logo, hamburger dropdown, CTA; theme via `useNavTheme` |
| Hero + sections | `MarketingContent.tsx` | Scroll-reveal, enrollment/franchise forms |
| Feature phone | `FeatureScrollSection.tsx` | Desktop: 3-column scroll-driven; mobile/tablet: stacked snap |
| Highlights | `HighlightsScroller.tsx` | Horizontal cards; nav buttons below carousel |
| Footer CTA | `FooterSection.tsx` | Dark band + link columns |
| Styles | `marketing.css` | All `novu-*` tokens |
| Pricing | `PlatformPricingSection.tsx` | Live `subscription_plans`; feature ticks use CSS Unicode escape U+2713 (not a raw `✓`, which production minify can render as `â`) |

## Navigation behavior

### Desktop (≥1024px)

- Nav slides in after hero headline animation (`useHeroIntroComplete`).
- Centered glass pill: section links + CTA (no Apple icon in nav).
- Theme follows content under the nav (`useNavTheme` uses `elementsFromPoint`, not sticky hero bounds).
- Over **white** content: nav bar uses black gradient + white type (`novu-nav-bar--light`).
- Logo from `config.meta.logoUrl` (homepage **Site logo**). Brand `/app/settings` does not upload a logo. Platform `/admin/brands/:slug` **Site logo** and a renamed brand name write the same `landing.meta` fields. Saving `/app/homepage` (or the platform Site logo) copies that URL onto `brands.logo_url` for login / student / app chrome. Fallback initial badge when empty.

### Mobile / tablet (&lt;1024px)

- **Two-column bar**: `[hamburger + logo + name]` left, **CTA right-aligned** (grid `1fr auto`; hidden center pill removed from layout).
- Hamburger opens a **dropdown** (not full-screen) before the logo with section links.
- CTA uses `MarketingCtaLink` with `showIcon={false}`.

## Feature section (product / phone stage)

Brand and center marketing editors (**Feature sections (phone blocks)**) support **any number of blocks** (minimum 1 when the section is enabled). Removing extra blocks no longer breaks the public site.

### Desktop (≥1024px)

- Tall scroll region (`min-height: N × 100svh`, `N` = block count) with sticky center phone.
- Copy in left/right columns advances with scroll progress (first half of blocks left, remainder right).
- Section videos from `HomepageConfig.featureSections[].videoUrl`.

### Mobile / tablet (&lt;1024px)

- **One feature per viewport**: each `.novu-features-stack__item` is `min-height: 100dvh` with `scroll-snap-align: start` on `html:has(.marketing-page)`.
- Each screen = **centered phone stage** + copy block (no separate carousel).
- Brand/center landings merge default demo videos via `withDefaultFeatureVideos()` when URLs are omitted.

## CTAs

- Shared component: `MarketingCtaLink.tsx` (stagger label + optional Apple icon).
- Nav: no icon. Hero and footer: icon on dark surfaces (`on-dark` white button).

## Related code

- `apps/web/src/lib/marketingFeatureSections.ts` — default phone videos; Abacus program marquee palette
- `apps/web/src/types/homepage.ts` — `HomepageConfig` including `meta.logoUrl`
- `apps/web/src/features/platform/BrandEditForm.tsx` — **Website theme** and **Site logo** on `/admin/brands/:slug` (logo/name persist to Homepage `landing.meta`)
- `apps/web/src/features/platform/HomepageEditorPage.tsx` — `/admin/homepage`
- `apps/web/src/routes/AppRoutes.tsx` — public `/` vs staff `/app`; `/auth/handoff` on all portal hosts

## Local URLs

See [Operations runbook](../ops/runbook.md#urls-port-9000).
