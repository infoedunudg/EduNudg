# center-public-profile Specification

## Purpose

Franchise staff maintain how their center appears on the public marketing host: contact details, photo, and description. Footer social icons come from brand Social Media Connect (`social_connect`), not franchise `social_links`. Changes in center Settings flow to the public landing page via `get_center_landing_public`.

## Related

- Migration: [`supabase/migrations/046_center_public_profile.sql`](../../../supabase/migrations/046_center_public_profile.sql)
- Runbook: [`docs/ops/runbook.md`](../../../docs/ops/runbook.md) — Center public profile section
- Portal matrix: [`docs/spec/portal-host-matrix.md`](../../../docs/spec/portal-host-matrix.md)

## Requirements
### Requirement: Center public profile settings

Franchise staff SHALL edit center public profile fields at `/app/settings`: display name, short description, address line, city, region, pincode, country, contact phone, and photo. Center Settings SHALL NOT show a Social presence editor or **+ Add social link**. Profile Save SHALL pass through existing `franchise_centers.social_links` without editing them.

#### Scenario: Staff saves profile

- **WHEN** center staff submit the public profile form with valid data
- **THEN** the system calls `update_center_public_profile_rpc` for their center
- **AND** persisted fields update on `franchise_centers`

#### Scenario: Sign-in email is read-only

- **WHEN** center staff view Settings account section
- **THEN** sign-in email from auth is displayed
- **AND** it is not editable in the profile form

#### Scenario: Public site URL shown

- **WHEN** center staff view Settings
- **THEN** the center marketing URL (`{center}.{brand}` host) is displayed for reference

### Requirement: Center photo upload

Franchise staff SHALL upload a center photo stored in the `brand-assets` bucket at `{brand_id}/centers/{center_id}/photo.{ext}`.

#### Scenario: Photo appears after upload

- **WHEN** center staff upload a valid image (PNG, JPEG, WebP, or GIF within size limit)
- **THEN** `photo_url` is saved on the center record
- **AND** the photo appears on the center public landing page

#### Scenario: Oversized photo error near Save

- **WHEN** center staff upload a photo larger than 5 MB
- **THEN** the client rejects the upload with a clear size message before Storage
- **AND** the error is shown next to **Save profile** / **Save Changes** in a highlighted danger card, not only at the top of the form as plain text
- **AND** regressions `regression_center_photo_rejects_images_over_5mb`, `regression_franchise_photo_error_shows_near_save_via_onError`, and `regression_mutation_error_uses_highlighted_danger_card` stay green

### Requirement: Social links RPC validation

The RPC SHALL still accept `social_links` as a JSON array of `{platform, url}` with at most six entries when a save pass-through sends the existing column. Center Settings SHALL NOT collect new links.

#### Scenario: Reject invalid social links

- **WHEN** a save payload contains more than six social links or non-array `social_links`
- **THEN** the RPC rejects the update with an error message

#### Scenario: Center Settings omits Social presence

- **WHEN** franchise staff open `/app/settings`
- **THEN** Public Center Profile has no **Social presence** section and no **+ Add social link**
- **AND** Save profile still sends existing `social_links` unchanged

### Requirement: Public landing reflects profile

The center public homepage SHALL display profile fields from `get_center_landing_public` including display name, description, address, contact phone, and photo.

Footer social icons on the **center** host SHALL use brand `social_connect` (the same Social Media Connect Facebook/Instagram URLs as the brand homepage), not `franchise_centers.social_links`. Brand **Franchise Management** (`/app/centers`) and center **Settings** SHALL NOT show or edit those links. Brand landing Social Media Connect remains Facebook/Instagram only and SHALL NOT show a WhatsApp float.

On a **center** host, Novu, Abacus Classic, and Spark Academy footers SHALL show the same franchise Location & Contact overlay (`centerFooterContactFromProfile`) — street, city · region · pincode, and phone — and SHALL NOT show brand `headOffice`, brand “Our presence”, or Spark’s placeholder phone. Brand hosts keep Head office / presence unchanged.

#### Scenario: Footer social uses brand Social Media Connect

- **GIVEN** the brand Social Media Connect points at the brand owner's Facebook/Instagram
- **AND** leftover `franchise_centers.social_links` still exist on the franchise row
- **WHEN** a visitor opens the center public site (View Frontend)
- **THEN** the footer icons open the brand Social Media Connect URLs
- **AND** do not use the franchise `social_links` (including leftover YouTube)

#### Scenario: Public page after settings save

- **WHEN** a visitor opens the center public homepage after staff save profile changes
- **THEN** updated display name, blurb, contact, and photo are visible
- **AND** footer social icons still come from brand Social Media Connect
- **AND** the nav shows the brand logo only (no center logo)

#### Scenario: Franchise frontend nav highlights logo and name

- **WHEN** a visitor opens a center (franchise) public site
- **THEN** the sticky nav uses a franchise lockup (`ac-nav--franchise` / `sa-nav--franchise` / `el-nav--franchise` / `novu-nav-bar--franchise`)
- **AND** the brand logo matches the brand homepage nav size and has no ring or frame
- **AND** the site name is the franchise display name, larger and bolder than on the brand homepage nav
- **AND** a smaller “by {brand}” line appears under the franchise name when the names differ

#### Scenario: Footer contact uses franchise address on every theme

- **GIVEN** Franchise Management saved this center’s address and phone
- **AND** the brand homepage Head office still lists the brand owner HQ
- **WHEN** a visitor opens View Frontend (Novu, Abacus Classic, Spark Academy, or EduLearn)
- **THEN** the footer shows **This center** / **Contact Us** with the franchise address and phone
- **AND** does not show brand Head office, brand presence cities, or a placeholder phone

#### Scenario: Footer blurb uses franchise name not Sample Center

- **GIVEN** the brand center-landing template still contains the editor placeholder **Sample Center**
- **AND** Franchise Identity name / display name is saved (e.g. Smart Brain Abacus)
- **WHEN** a visitor opens that center’s public site
- **THEN** the footer description and site name use the franchise display name
- **AND** do not show **Sample Center**
- **AND** copyright omits “Part of {brand}” when the franchise name matches the brand name

#### Scenario: Mentors show franchiser first then brand founder

- **GIVEN** Franchise Identity has a center owner name or master photo
- **AND** the brand homepage has a founder profile
- **WHEN** a visitor opens that center’s public site
- **THEN** Mentors / Leadership lists the franchiser first
- **AND** the brand founder remains on the page after the franchiser
- **AND** Center sites placeholders such as **Founder name** / **Sample Center** are not shown, even when a photo was uploaded for that template row

#### Scenario: Mentors fall back to brand owner first

- **GIVEN** Franchise Identity has no distinct owner name and no master photo
- **AND** the brand homepage has a founder profile
- **WHEN** a visitor opens that center’s public site
- **THEN** Mentors / Leadership shows the brand founder in first place

### Requirement: Franchise public programs match center enablement

The center public homepage SHALL list only programs assigned to that franchise in `center_program_enablement` (via `center_public_curriculum_json`). Center sites marketing cards SHALL be restricted to matching enabled program names.

#### Scenario: WHAT WE TEACH shows only subscribed courses

- **GIVEN** the brand Center sites template lists Abacus, Vedic Mathematics, and Handwriting
- **AND** Franchise Management enabled only Abacus for this center
- **WHEN** a visitor opens that franchise public site
- **THEN** WHAT WE TEACH / courses / syllabus show Abacus only
- **AND** Vedic Mathematics and Handwriting cards are omitted

### Requirement: No franchise apply on center public landing

Center (franchise) public landing pages SHALL NOT show brand franchise-application CTAs. **Apply franchise** (and `#apply` / `apply` secondary CTAs) are brand-homepage only.

#### Scenario: Center Abacus Classic nav omits Apply franchise

- **WHEN** a visitor opens a center public site on Abacus Classic (or Spark) theme
- **THEN** the sticky nav and hero MUST NOT show an **Apply franchise** button
- **AND** `sanitizeCenterPublicNavConfig` strips secondary franchise CTAs and `#apply` nav links before render

#### Scenario: Authorized editors

- **WHEN** a user without center, brand, or platform access attempts to update another center's profile
- **THEN** `update_center_public_profile_rpc` rejects the request

### Requirement: Center public course detail uses enabled catalog

Center `/courses/:slug` SHALL use the same `publicCurriculum` as the center homepage (`center_public_curriculum_json` / enabled programs only). A slug for a brand course that is not enabled at that center SHALL redirect to `/`.

#### Scenario: Disabled center program is not addressable

- **GIVEN** a center host whose public curriculum omits a brand course
- **WHEN** a visitor opens that course’s `/courses/:slug` on the center host
- **THEN** they are redirected to `/`


