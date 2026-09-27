# marketing-homepage Specification

## Purpose

Platform public marketing chrome on the platform host (`/`) loads homepage config and legal pages without colliding with config-only React Query caches used by favicon, shell branding, and login.

## Related

- Frontend: [`docs/frontend/marketing-landing.md`](../../../docs/frontend/marketing-landing.md)
- Ops: [`docs/ops/runbook.md`](../../../docs/ops/runbook.md) — Marketing homepage & brand themes
- Footer: [`openspec/specs/marketing-footer/spec.md`](../marketing-footer/spec.md)
- Settings: [`openspec/specs/platform-settings/spec.md`](../platform-settings/spec.md)

## Requirements

### Requirement: Separate React Query keys for config vs public bundle

The SPA SHALL cache raw `HomepageConfig` separately from the public chrome bundle `{ config, legalPages }`. Sharing one key SHALL NOT be allowed.

Traceability: regression — login stuck on Loading when config-only cache poisoned the public layout.

#### Scenario: Public layout uses public-bundle key

- **WHEN** `MarketingPublicLayout` fetches marketing chrome
- **THEN** it uses `MARKETING_PUBLIC_BUNDLE_QUERY_KEY` (`["marketing-homepage", "public-bundle"]`)
- **AND** the cache value shape is `{ config, legalPages }`

#### Scenario: Favicon and editors use config-only key

- **WHEN** favicon, shell branding, or homepage editors load config
- **THEN** they use `MARKETING_HOMEPAGE_CONFIG_QUERY_KEY` (`["marketing-homepage"]`)
- **AND** the cache value is raw `HomepageConfig` (not a bundle)

#### Scenario: Keys must differ

- **GIVEN** both query keys exist in `homepageApi.ts`
- **WHEN** tests assert key identity
- **THEN** `MARKETING_PUBLIC_BUNDLE_QUERY_KEY` is not equal to `MARKETING_HOMEPAGE_CONFIG_QUERY_KEY`
- **AND** the public-bundle key shares the same root segment for invalidation grouping

### Requirement: Login survives shared marketing navigation

Navigating from the platform public homepage to `/login` SHALL NOT leave the login page stuck on Loading because of a mismatched React Query cache shape.

#### Scenario: Marketing home then login

- **WHEN** a visitor loads platform `/` then navigates to `/login`
- **THEN** the login form (Email field) becomes available
- **AND** the page is not stuck on a loading state caused by homepage query-cache collision
- **AND** the same Site nav and enterprise footer as `/` remain visible

### Requirement: Platform login shares homepage chrome

Platform `/login` SHALL use `MarketingPublicLayout` (`marketing-page--login`) so `EnterpriseNav` and `EnterpriseSiteFooter` wrap the staff login form. Login SHALL NOT mount a full-viewport admin `ThemeProvider` under that layout.

#### Scenario: Direct /login load shows nav and footer

- **GIVEN** the platform host
- **WHEN** a visitor opens `/login` without visiting `/` first
- **THEN** navigation labelled `Site` and `footer.ent-footer` are present with the login form

### Requirement: Legacy Novu seed discard must not drop uploaded media

`isLegacyPlatformHomepageSeed` SHALL return false when the stored row already has enterprise platform blocks or public URLs under `brand-assets`. Only virgin Novu seed (Novu theme markers without enterprise/custom media) MAY be replaced with `DEFAULT_HOMEPAGE_CONFIG` at read time.

#### Scenario: Customized row with Novu markers keeps brand-assets URLs

- **GIVEN** `platform_settings.marketing_homepage` still has `theme.bgGradient` or a Novu `themeNote`
- **AND** the row includes enterprise blocks or `brand-assets` media URLs
- **WHEN** the public homepage or `/admin/homepage` loads config
- **THEN** the client merges the stored config (including hero/logo media URLs)
- **AND** does not substitute stock Unsplash defaults

### Requirement: Brand and center landings preserve stored media

Brand and center public/editor loads SHALL merge stored `landing` / `center_landing` partials. Fallbacks SHALL pass available landing JSON. Saves SHALL preserve existing `brand-assets` URLs over stock Unsplash. Seed upserts SHALL not full-replace `brand_settings.settings`.

#### Scenario: Incomplete brand name still keeps landing media

- **GIVEN** `get_brand_landing_public` returns landing JSON with `brand-assets` URLs
- **AND** `brand_name` is missing
- **WHEN** the public brand landing loads
- **THEN** the fallback path still merges the landing partial (media URLs remain)

#### Scenario: Brand marketing save does not overwrite uploads with Unsplash

- **GIVEN** stored `landing.hero.backgroundImageUrl` points at `brand-assets`
- **AND** the editor draft contains an Unsplash default for that field
- **WHEN** `saveBrandMarketingLanding` runs
- **THEN** the stored `brand-assets` URL is kept

### Requirement: Brand Site logo is the identity image

Brand identity copy and logo SHALL live in `brand_settings.settings.landing.meta` (Homepage **Site name** / **Site logo**). Brand staff upload on `/app/homepage` **Site** → **Site logo**. Platform admins SHALL upload the same Site logo (and persist a renamed brand name as `landing.meta.siteName`) on `/admin/brands/:slug` into that JSON — not a separate identity store. Brand `/app/settings` SHALL NOT include a Brand Identity / logo card. Saving the brand homepage or platform Site logo SHALL copy `landing.meta.logoUrl` onto `brands.logo_url` when the Site logo is non-empty. `get_portal_branding` SHALL prefer that Site logo over `brands.logo_url`.

#### Scenario: Settings has no Brand Identity card

- **WHEN** brand staff open `/app/settings`
- **THEN** there is no Brand Identity card or logo uploader

#### Scenario: Homepage save updates portal logo

- **WHEN** brand staff save `/app/homepage` with a Site logo URL
- **THEN** `brands.logo_url` is set to that URL
- **AND** login / student / app chrome use it

#### Scenario: Platform brand detail writes Homepage identity

- **WHEN** a platform admin uploads a logo on `/admin/brands/:slug`
- **THEN** `landing.meta.logoUrl` is set to that URL
- **AND** `brands.logo_url` matches it
- **AND** other `brand_settings.settings` keys and landing sections are preserved

#### Scenario: Staff mobile bar shows Site logo

- **GIVEN** brand or center staff are on `/app` with a Site logo
- **AND** the viewport is mobile
- **THEN** the staff top bar shows that logo beside the product name

#### Scenario: Center staff chrome shows franchise by brand

- **GIVEN** franchise staff are on center `/app` (including `/app/merchandise`)
- **THEN** the sidebar and mobile bar show the franchise display name next to the Site logo
- **AND** a smaller “by {brand}” line appears under the franchise name when the names differ
- **AND** `/login` uses the same lockup (franchise name, then “by {brand}”)

#### Scenario: Public nav logo is franchise size without a frame

- **GIVEN** a brand public homepage with a Site logo
- **WHEN** a visitor opens the brand host `/` or a franchise host `/`
- **THEN** the sticky nav logo uses the same size on both hosts
- **AND** the logo has no ring, border, or background frame

### Requirement: Spark Academy public headings share one type scale

Spark Academy public landings SHALL use shared `--sa-h2-*` tokens for section titles and `--sa-h3-*` for card/list headings. Features, journey, mentors, and testimonials SHALL NOT use a different clamp size than courses/FAQ/gallery. Upcoming events and `/about` titles SHALL inherit the same Spark tokens. The hero MAY stay larger (`--sa-h1-size`). Footer column labels SHALL remain small uppercase chrome.

#### Scenario: Section titles share sa-section-title

- **GIVEN** a Spark Academy public homepage
- **WHEN** courses, features, journey, mentors, testimonials, FAQ, and gallery titles render
- **THEN** each section `h2` includes `sa-section-title`
- **AND** CSS uses `--sa-h2-size` `clamp(1.75rem, 4vw, 2.25rem)` at weight 800

### Requirement: Public course detail uses homepage theme chrome

Brand and center `/courses/:slug` SHALL render inside `BrandPublicLayout` / `CenterPublicLayout` so nav, footer, CSS variables, and lead modals match that host’s homepage. The page SHALL NOT wrap a second `marketing-page--*` class. Hash section links from this route SHALL resolve to `/#…` like `/about`.

#### Scenario: Course page stays in public layout

- **GIVEN** a Spark, Abacus, EduLearn, or Novu public host
- **WHEN** a visitor opens a published `/courses/:slug`
- **THEN** the same theme nav and footer as `/` are present
- **AND** **Enroll now** on the course page can open the existing lead modal

### Requirement: Spark Academy image floats stay off the subject

On Spark Academy Features, overlay badges SHALL sit on the corners of the entire image section (`.sa-features__visual`) — Last month at top-left, Learning Progress at bottom-right — and SHALL NOT be nested on the photo itself so the subject stays visible.

#### Scenario: Hero course tag sits at the photo top-left on mobile

- **GIVEN** a Spark Academy public homepage with a featured course float
- **WHEN** the viewport is stacked (`max-width: 1023px`)
- **THEN** the Course tag is inside `sa-hero__photo-stage`
- **AND** CSS pins `.sa-hero__float-card--course` to the top-left of that photo

#### Scenario: Features overlay cards sit on visual corners

- **GIVEN** a Spark Academy public homepage Features section
- **WHEN** the section renders on desktop or mobile
- **THEN** Last month and Learning Progress cards are direct children of `sa-features__visual`
- **AND** they are not inside `sa-features__photo-stage`
- **AND** CSS pins Last month to the top-left and Learning Progress to the bottom-right of the visual

### Requirement: Spark Academy Features omits the stats-card action

Spark Academy **Powerful Features for Your Learning Journey** SHALL render Last month value and Learning Progress overlays only. It SHALL NOT render a stats-card action (including leftover `floatStatsAction` / “View all →”). Homepage Configuration SHALL NOT expose a Stats card action field.

#### Scenario: Features Last month card has no View all control

- **GIVEN** a Spark Academy public homepage Features section
- **AND** stored landing JSON still has `featuresShowcase.floatStatsAction` “View all →”
- **WHEN** the section renders
- **THEN** the Last month overlay does not include a View all control
- **AND** `.sa-features__float-btn` is not in the DOM

### Requirement: Spark Academy Journey shows YouTube below the photo

Spark Academy **Our Journey to Excellence** SHALL keep the highlight photo/stats card. When Homepage **Trust & video** has a YouTube URL, the public homepage SHALL also render a 16:9 embed under that grid (`#trust`). Watch, youtu.be, embed, and Shorts URLs SHALL convert to `youtube.com/embed/{id}`. An empty URL SHALL omit the video block.

#### Scenario: YouTube URL renders beside the existing photo

- **GIVEN** a Spark Academy public homepage with a Journey highlight image
- **AND** `trustMedia.youtubeUrl` is a YouTube Shorts or watch URL
- **WHEN** a visitor opens `/`
- **THEN** the highlight photo still renders
- **AND** a video iframe under Journey uses `https://www.youtube.com/embed/{id}`
- **AND** EduLearn **Why choose us** shows the same embed under the stats photo when that URL is set

### Requirement: Spark Academy success stories cards are centered

Spark Academy **Success stories** (`#testimonials`) SHALL center story cards in the row when there are fewer than a full grid of cards (`sa-testimonials__grid--center`).

#### Scenario: Partial testimonial row is centered

- **WHEN** a Spark Academy public homepage shows Success stories
- **THEN** the testimonials grid uses `sa-testimonials__grid--center`
- **AND** leftover cards sit in the center of the row, not the left edge

### Requirement: Homepage editor omits curriculum catalog editors

Brand `/app/homepage` and `/app/center-site` SHALL NOT show **Courses designed for success**, **Programs grid**, or **Curriculum syllabus** accordions (Abacus Classic, Spark Academy, and EduLearn). Course banners and syllabus live on **Curriculum** (`/app/curriculum`). Public course grids SHALL keep rendering published curriculum. Stored `programsSection` JSON SHALL NOT be cleared by hiding the editor.

#### Scenario: Brand homepage hides course catalog accordions

- **GIVEN** a brand user on `/app/homepage` with Abacus Classic, Spark Academy, or EduLearn
- **THEN** the editor has no **Courses designed for success**, **Programs grid**, or **Curriculum syllabus** row
- **AND** there is no **+ Add program card** upload on that page
- **AND** Site, Navigation & CTAs, and Hero remain

### Requirement: First photo in each homepage section is required

Brand `/app/homepage` and `/app/center-site` photo uploads SHALL be required for the first image field in each editor section. Additional photos in the same section stay optional. **Save changes** SHALL not persist when a required photo is empty; the save bar SHALL list the missing fields. Center Site SHALL NOT require About Us photos (that accordion is brand-only). When the homepage **Hero** section is enabled, About Us **Hero banner image** SHALL NOT be required — Spark `/about` already falls back to the homepage Hero photo. About Us hero is required only when Hero is off and About is in play.

- **GIVEN** a brand owner on Homepage Configuration or Center Site Configuration
- **WHEN** a section has one or more photo upload fields
- **THEN** the first photo field is marked required
- **AND** later photos in that section are optional
- **AND** save is blocked until each required photo has a URL
- **AND** the save error names the editor section (e.g. `Why us (feature blocks) → Features image`) so staff know which accordion to open
- **AND** save focuses the first missing section accordion
- **AND** a filled homepage Hero photo does not produce an About Us **Hero banner image** save error
- **AND** regression `regression_required_photo_error_names_editor_section` stays green

### Requirement: Unsaved homepage edits ask to save

When Homepage Configuration or Center Site Configuration has unsaved edits, navigating to another in-app page SHALL show **Save your changes?** and scroll to the bottom save bar. The dialog SHALL match the public marketing theme of the site and SHALL offer only **OK** (save, then leave) and **Cancel** (stay). A dirty page SHALL also use the browser `beforeunload` prompt. The guard SHALL work with `BrowserRouter` (in-app link interception) and SHALL NOT call `useBlocker`.

- **GIVEN** a brand owner has unsaved homepage or center-site edits
- **WHEN** they navigate to another staff page
- **THEN** a save dialog appears
- **AND** the viewport scrolls to the save bar at the bottom
- **AND** they remain on the editor until they choose **OK** or **Cancel**

### Requirement: Homepage editor Save stays available

Brand `/app/homepage`, `/app/center-site`, and platform `/admin/homepage` **Save changes** SHALL stay clickable when the form is clean. Discard SHALL appear only when there are unsaved edits. **Save changes** SHALL disable only while a save is in flight. The save-bar status SHALL say **You have unsaved changes.** when dirty, **Saved.** briefly after a successful save, and **No unsaved changes.** when clean — never “draft” for save state.

#### Scenario: Clean homepage editor can still save

- **GIVEN** a brand owner opens Homepage Configuration with no unsaved edits
- **WHEN** they click **Save changes**
- **THEN** the save action runs
- **AND** the button is not disabled because the form is clean

#### Scenario: Save bar status is clear about unsaved vs saved

- **GIVEN** a brand owner on Homepage Configuration
- **WHEN** the form has unsaved edits
- **THEN** the save bar shows **You have unsaved changes.**
- **AND** after a successful save it shows **Saved.** (not “All changes saved.” / “draft”)
- **AND** when clean again it shows **No unsaved changes.**
- **AND** regression `regression_homepage_save_bar_status_avoids_draft_wording` stays green

### Requirement: Navigation CTA labels are draft until Save

On Abacus Classic and Spark Academy Homepage Configuration, **Primary CTA label (demo)** and **Secondary CTA label (franchise)** SHALL update local editor state only (`onChange`). They SHALL NOT call persist/refetch on each keystroke. They SHALL update `nav` only — not `hero`.

#### Scenario: Typing CTA labels does not persist

- **GIVEN** a Spark Academy brand admin has Navigation & CTAs open
- **WHEN** they type in Primary CTA label or Secondary CTA label
- **THEN** the editor config updates locally
- **AND** `hero.ctaLabel` / `hero.secondaryCtaLabel` are unchanged
- **AND** no save/persist runs until they click **Save changes**

### Requirement: Spark Academy hero CTA is independent

Spark Academy and Abacus Classic Homepage Configuration **Hero** SHALL include **Hero CTA label** and **Hero CTA link**. The public hero button SHALL use `hero.ctaLabel` / `hero.ctaHref`, falling back to Navigation & CTAs Primary CTA only when those hero fields are empty.

#### Scenario: Hero CTA field does not change the header button

- **GIVEN** a Spark Academy brand admin has Hero open
- **WHEN** they change Hero CTA label or Hero CTA link
- **THEN** `hero.ctaLabel` / `hero.ctaHref` update locally
- **AND** `nav.ctaLabel` / `nav.ctaHref` stay unchanged
- **AND** no save/persist runs until they click **Save changes**

#### Scenario: Public hero uses the Hero CTA

- **GIVEN** a Spark Academy public homepage whose Hero CTA label differs from the Navigation Primary CTA
- **WHEN** a visitor opens `/`
- **THEN** the hero button shows the Hero CTA label
- **AND** the header button still shows the Navigation Primary CTA

### Requirement: Spark Academy nav comes from Navigation & CTAs

Spark Academy public nav SHALL render `nav.links`, the primary CTA, and the secondary franchise CTA from Homepage Configuration **Navigation & CTAs**. It SHALL NOT hardcode a brand **Login** button (`nav.adminHref`). Franchise hosts SHALL keep **Student Login** in the header and hamburger drawer, SHALL NOT show a hardcoded brand **Login**, and SHALL NOT show the secondary franchise CTA.

#### Scenario: Brand header omits hardcoded Login

- **GIVEN** a Spark Academy brand public homepage whose Navigation & CTAs menu items do not include Login
- **WHEN** a visitor opens `/`
- **THEN** the header and hamburger drawer do not show a **Login** control
- **AND** adding a **Login** → `/login` menu item in Navigation & CTAs shows that link in the header and drawer

#### Scenario: Brand nav shows secondary franchise CTA

- **GIVEN** a Spark Academy brand public homepage with a Secondary CTA label and href in Navigation & CTAs
- **WHEN** a visitor opens `/`
- **THEN** desktop header actions include that secondary CTA
- **AND** the hamburger drawer includes the same secondary CTA
- **AND** on viewports `max-width: 1023px` the secondary CTA is hidden from the header (`sa-nav__cta--header`) and shown only in the left-hand drawer
- **AND** the drawer uses Spark Academy type and colors (`marketing-page--spark-academy`, Inter, navy/blue tokens)

#### Scenario: Hamburger drawer shows logo before brand name

- **GIVEN** a Spark Academy public homepage with a Site logo URL
- **WHEN** a visitor opens the hamburger menu
- **THEN** the left-hand drawer shows the brand logo immediately before the site name

#### Scenario: Franchise hamburger menu keeps Student Login

- **GIVEN** a Spark Academy franchise public homepage
- **WHEN** a visitor opens the hamburger menu
- **THEN** the drawer includes **Student Login**
- **AND** it does not include a hardcoded brand **Login**

### Requirement: Spark Academy photo gallery is a horizontal marquee

Spark Academy **Photo gallery** (`#gallery`, including **Moments from our journey**) SHALL render as a single-row CSS marquee. The image set SHALL be duplicated so the loop is seamless. Every photo SHALL participate in the horizontal scroll; photos SHALL NOT wrap into extra rows. Auto-scroll SHALL pause on hover and SHALL NOT run when `prefers-reduced-motion: reduce`.

#### Scenario: Gallery marquee scrolls all photos

- **GIVEN** a Spark Academy public homepage with four or more gallery images
- **WHEN** a visitor opens `/`
- **THEN** the gallery is a single horizontal row
- **AND** the track is duplicated for a continuous loop
- **AND** photos do not wrap into additional rows

### Requirement: Spark Academy success stories are a mobile carousel

On viewports `max-width: 767px`, Spark Academy **Success stories** (`#testimonials`) SHALL render as a horizontal snap carousel (`sa-testimonials__carousel`) and auto-advance when there is more than one story. Auto-scroll SHALL pause on user swipe and SHALL NOT run when `prefers-reduced-motion: reduce`. Desktop SHALL keep the centered wrapping grid.

#### Scenario: Mobile success stories auto-scroll

- **GIVEN** a Spark Academy public homepage with more than one Success story
- **WHEN** the viewport is `max-width: 767px`
- **THEN** the stories track is a horizontal carousel
- **AND** it auto-advances to the next card

### Requirement: Spark Academy homepage uses motion that respects reduced-motion

Spark Academy public `/` SHALL animate the hero on load (rise/fade, floating photo cards) and scroll-reveal lower sections (`sa-reveal` + `useScrollReveal`). Cards, list rows, and other items inside those sections SHALL enter with a delayed fade-and-scale (`sa-reveal-item` / `sa-item-in`), distinct from the section’s vertical lift. Section lift and item entries SHALL be unhurried (about one second per beat, with ~200ms stagger) so they remain visible while scrolling. Animations SHALL disable when `prefers-reduced-motion: reduce`.

#### Scenario: Spark homepage sections use reveal classes

- **GIVEN** a Spark Academy public homepage
- **WHEN** a visitor opens `/`
- **THEN** courses, features, journey, mentors, testimonials, FAQ, and gallery sections have `sa-reveal`
- **AND** course cards, feature rows, journey rows, mentor/testimonial cards, and FAQ items have `sa-reveal-item`
- **AND** CSS includes unhurried inner fade-and-scale (`sa-item-in` ~1.1s, distinct from the ~0.95s section lift) plus reduced-motion fallbacks

### Requirement: Center enrollment template has its own brand nav page

Brand staff SHALL edit the parent enrollment template (`center_landing`) at `/app/center-site` (**Center Site Configuration**). The brand Homepage editor at `/app/homepage` SHALL NOT include that Center sites panel.

#### Scenario: Homepage editor is brand site only

- **GIVEN** a brand user on `/app/homepage`
- **THEN** they see **Homepage Configuration** for the brand recruitment site
- **AND** they do not see **Center sites (parent enrollment template)** on that page

#### Scenario: Center Site Configuration is a left-nav item

- **GIVEN** a brand user in the `/app` shell
- **WHEN** they open **Center Site Configuration**
- **THEN** they land on `/app/center-site`
- **AND** they can edit the parent enrollment template

### Requirement: EduLearn theme uses existing landing JSON

`edu-learn` SHALL be a valid `brands.marketing_theme`. Public brand and center sites SHALL render EduLearn chrome (`marketing-page--edu-learn`) from the same `landing` / `center_landing` JSON as other themes. Switching theme SHALL NOT wipe stored media URLs.

#### Scenario: EduLearn public homepage uses screenshot layout blocks

- **GIVEN** a brand with `marketing_theme = edu-learn`
- **WHEN** a visitor opens `/`
- **THEN** the page uses a cream/off-white canvas (`#F6F3ED`), orange CTAs, forest-green frames, and rounded feature/testimonial/resource cards
- **AND** hero, features, stats, testimonials, gallery resources, and footer CTA read from homepage config
- **AND** enroll/apply CTAs open lead modals (`ac-modal--edu-learn`)
- **AND** course cards pad title and description inside `.el-course-card__body` so copy is not clipped

#### Scenario: EduLearn reuses Spark courses and franchise apply

- **GIVEN** a brand whose stored `landing` JSON was edited under Spark Academy (curriculum courses, FAQ, **Apply franchise** nav)
- **WHEN** platform admin sets `marketing_theme = edu-learn`
- **THEN** the public homepage still lists published Curriculum courses at `#programs` (with `#curriculum` alias)
- **AND** FAQ items from stored landing still render
- **AND** the header still shows **Apply franchise** from `nav.secondaryCtaLabel` / `nav.secondaryCtaHref`

#### Scenario: EduLearn footer shows contact address

- **GIVEN** a brand with `marketing_theme = edu-learn` and Homepage Head office address/phone saved
- **WHEN** a visitor opens the brand public site
- **THEN** `EduLearnFooter` shows a **Contact** block with that address and phone
- **AND** a franchise public site overlays Franchise Management Location & Contact as **This center** instead of brand HQ

### Requirement: Pricing feature checkmarks survive production CSS

Platform homepage **Simple pricing for growing brands.** feature bullets SHALL use a CSS Unicode escape (`content: "\2713"`) for the checkmark glyph. Raw UTF-8 checkmarks and double-encoded mojibake (`â` plus C1 controls) SHALL NOT appear in `marketing.css` `content` values — production CSS minify strips those controls and leaves `â` on Vercel.

#### Scenario: Pricing bullets use an ASCII-safe checkmark escape

- **GIVEN** `marketing.css` styles `.novu-pricing-card__features li::before`
- **WHEN** the production stylesheet is built
- **THEN** `content` is `"\2713"` (CHECK MARK)
- **AND** the rule does not contain a raw `✓` or the mojibake sequence U+00E2 U+009C U+0093

Traceability: regression — `regression_pricing_feature_checkmarks_use_css_unicode_escape`.
