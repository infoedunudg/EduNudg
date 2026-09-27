# Brand About Us

## Purpose

Brand marketing sites can publish a themed **About Us** page (`/about`) with company story, differentiators, longer “what we do” copy, and a team photo grid (photo → name → role). Chrome follows `brands.marketing_theme` (Novu Mastermind, Abacus Classic, Spark Academy, or EduLearn). Novu and Abacus Classic can optionally show the same content as a homepage `#about` teaser. Spark Academy and EduLearn publish About only on `/about`.

## Requirements

### Brand About Us editor

GIVEN a brand admin opens Homepage Configuration
WHEN they edit About Us fields (story, philosophy, features, team members with photos, hero banner, philosophy image) and save
THEN the config is stored in `brand_settings.settings.landing.about`
AND uploads use `brand-assets` (`heroImageUrl`, `imageUrl`, `philosophyImageUrl`, member photos)
AND saves run `preserveCustomMarketingMediaUrls`

### Dedicated public About page

GIVEN `about.publishPage` is not false and About has content
WHEN a visitor opens `/about` on the brand host
THEN Novu and Abacus Classic render the dedicated About layout (hero, story, philosophy, features, what we do, team grid, optional CTAs)
AND Spark Academy instead composes `/about` from homepage blocks: Hero, Features, Journey, Mentors
AND the viewport scrolls to the top of the page (smooth unless `prefers-reduced-motion`)
AND a hash target is left alone
AND Novu/Abacus/EduLearn roots use a theme modifier (`about-us--novu`, `about-us--abacus-classic`, or `about-us--edu-learn`) matching `brands.marketing_theme`

GIVEN a Spark Academy brand
WHEN a visitor opens `/about`
THEN the page uses the same homepage section components as `/` (`SparkAcademyHero`, `FeaturesSection`, `JourneySection`, `MentorsSection`) with `landing.about` copy
AND it SHALL NOT render Mastermind-only About chrome (`.about-us__hero`, numbered `.about-us__feature`, `.about-us__cta-band`)
AND section ids are `about-hero`, `about-features`, `about-journey`, `about-team` so homepage hashes (`#hero`, `#features`, `#founders`) still resolve to `/`
AND the hero enroll CTA uses `SparkAcademyCta` (lead modals when the layout provides them)
AND the hero SHALL NOT render homepage badges (About chip, Course/Learners floats, stats bar)
AND Features SHALL NOT render Last month / Learning Progress floats
AND the public homepage `/` still renders those badges on Hero and Features
AND `landing.about.heroImageUrl` fills the `/about` hero photo when set
AND `landing.about.philosophyImageUrl` fills the Journey / philosophy highlight photo when set

GIVEN an EduLearn brand
WHEN a visitor opens `/about`
THEN the dedicated About layout uses `.about-us--edu-learn` and EduLearn CTAs
AND it SHALL NOT compose `/about` from Spark homepage section components

GIVEN About is unpublished or empty
WHEN a visitor opens `/about`
THEN they are redirected to `/`

### Optional homepage section

GIVEN `sections.about` is enabled and About has content
WHEN an Abacus Classic or Novu public homepage renders
THEN `#about` appears after Gallery on Abacus Classic (after FAQ on Novu when there is no gallery) with a condensed About teaser and a link to `/about` when the page is published
AND public nav includes About Us → `#about` unless `/about` or `#about` already exists

GIVEN a Spark Academy public homepage
AND `sections.about` is enabled and About has content
WHEN a visitor opens `/`
THEN the homepage SHALL NOT render `#about`, `ABOUT {brand}`, or `WHAT MAKES US DIFFERENT?`
AND those blocks remain on `/about` when the page is published
AND leftover `#about` nav links are rewritten to `/about`
AND public nav SHALL NOT auto-inject About Us — About appears only when it is a Navigation & CTAs menu item

GIVEN `sections.about` is disabled
WHEN an Abacus Classic or Novu public homepage renders
THEN the About homepage block is omitted (full `/about` may still be available)
AND the auto-injected About Us nav link is omitted

### Nav presets

GIVEN a brand admin edits nav links
WHEN they open the Link dropdown
THEN Abacus Classic and Novu options include `About page (/about)` and `About section (#about)`
AND Spark Academy options include `About page (/about)` and SHALL NOT include `About section (#about)`

### Spark Academy nav presets

GIVEN a Spark Academy brand admin edits Navigation & CTAs
WHEN they open a menu item Link dropdown
THEN options SHALL NOT include `Programs (#programs)` or `About us (#features)`
AND courses use `Courses (#programs)` (Spark `#curriculum` is an in-section alias, not a second option)
AND the features block uses `Features (#features)`
AND About page (`/about`) remains available
AND About section (`#about`) is omitted
AND options include `Login (/login)`
AND options include `Photo gallery (#gallery)` when the Photo gallery section is on

### Spark Academy photo gallery

GIVEN a Spark Academy public homepage
AND Homepage Configuration **Photo gallery** has at least one image URL
WHEN a visitor opens the brand site
THEN `#gallery` renders those images and title
AND empty or URL-less slots are omitted
AND the section sits after FAQ

### Spark Academy heading type scale

GIVEN a Spark Academy public homepage
WHEN section titles render (courses, features, journey, mentors, testimonials, FAQ, gallery, upcoming events)
THEN they share Inter, `--sa-h2-size` (`clamp(1.75rem, 4vw, 2.25rem)`), weight 800, and navy color
AND card / list headings share `--sa-h3-size` (1.0625rem, weight 700)
AND the hero remains the larger display title (`--sa-h1-size`)
AND footer column labels stay small uppercase chrome (not section titles)

### Mentors / Leadership editor seeds one example profile

Brand Homepage mentors accordion (`landing.founders`) SHALL use the same title as the public section for that theme: Spark **Meet Our Expert Mentors**, EduLearn **Meet our leadership**, Abacus **Leadership profiles**. It SHALL seed a single dummy profile so staff can see how to fill a card. Spark Academy SHALL NOT pre-fill five Unsplash stock mentors. Add, update, and delete of mentor cards SHALL remain available. Saved custom names/photos SHALL be kept. Extra leftover Spark Unsplash stock cards MAY collapse to one example on load.

- **GIVEN** a Spark Academy brand with no saved mentors, or only leftover Unsplash stock names
- **WHEN** brand staff open `/app/homepage` **Meet Our Expert Mentors**
- **THEN** they see one example profile
- **AND** they can still add, edit, or delete mentor cards
- **AND** the accordion title matches the public heading (`regression_spark_homepage_mentors_accordion_matches_public_heading`)

### Spark Academy mentors show role badge and title

Spark Academy **Meet Our Expert Mentors** SHALL render the same Homepage founder fields as Abacus Classic leadership: **Role badge** (`roleBadge`, e.g. FOUNDER & CEO) and **Title** (`title`, e.g. company name) together. The card SHALL NOT hide the role badge when title is filled.

- **GIVEN** a Spark Academy public homepage whose mentor profile has role badge `FOUNDER & CEO`, name, and title company name
- **WHEN** a visitor views **Meet Our Expert Mentors**
- **THEN** the card shows the role badge, the person’s name, and the title
- **AND** it does not replace the role badge with the title

### EduLearn leadership shows role badge and title

EduLearn public sites SHALL render Homepage **Meet our leadership** (`landing.founders`) at `#founders` with the same fields as Abacus and Spark: role badge, name, and title. The Homepage accordion SHALL use the same title (`regression_edu_learn_homepage_mentors_accordion_matches_public_heading`).

- **GIVEN** an EduLearn public homepage whose Leadership profile has role badge `FOUNDER & CEO`, name, and title company name
- **WHEN** a visitor views **Meet our leadership**
- **THEN** the card shows the role badge, the person’s name, and the title

