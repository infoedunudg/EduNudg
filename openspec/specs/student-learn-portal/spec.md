# student-learn-portal Specification

## Purpose

Enrolled students authenticate at `learn.{brand}` and view a comprehensive dashboard of their franchise center enrollment, curriculum progress, exams/assessments, and brand competitions. All data is scoped to active center enrollment for transparency between student and franchise.

## Related

- Data flow: [`docs/spec/data-flow.md`](../../../docs/spec/data-flow.md) Flow 8 (student portal access)
- Journey: [`docs/journeys/student-learn-portal.md`](../../../docs/journeys/student-learn-portal.md)
- Navigation: [`docs/spec/navigation-spec.md`](../../../docs/spec/navigation-spec.md) — learn portal routes
- Traceability: FR-S10+ in [`docs/spec/functional-requirements.md`](../../../docs/spec/functional-requirements.md)
- Tenant invariants: [`docs/agent-playbook/forbidden-patterns.md`](../../../docs/agent-playbook/forbidden-patterns.md)

## Requirements

### Requirement: Active center enrollment gate

The system SHALL NOT return learn portal data unless the authenticated user is linked to a student with at least one **active** `student_enrollments` row where `center_id` is not null under the resolved brand.

Traceability: FR-S10

#### Scenario: Enrolled student accesses portal

- **WHEN** student S has `students.user_id = auth.uid()` and an active enrollment at center C under brand B
- **THEN** learn portal RPCs succeed for brand B
- **AND** the response includes `enrollment.center_id` and center details

#### Scenario: User without active enrollment blocked

- **WHEN** authenticated user U has no student row or no active enrollment under brand B
- **THEN** `get_student_learn_home(B)` raises error code `NO_ACTIVE_ENROLLMENT`
- **AND** the UI shows a full-page message to contact their center or brand — not an empty dashboard

#### Scenario: Withdrawn enrollment blocks portal

- **WHEN** student S has only enrollments with status other than `active`
- **THEN** learn portal RPCs raise `NO_ACTIVE_ENROLLMENT`

### Requirement: Enrollment-scoped academic records

The system SHALL scope all progress, assessment, and competition records written after this change to `enrollment_id`, `center_id`, and `brand_id`.

Traceability: FR-S11

#### Scenario: Center records progress with enrollment

- **WHEN** center staff call `record_student_level_progress` for student S at center C
- **THEN** the row includes `enrollment_id` from S's active enrollment at C
- **AND** `center_id` and `brand_id` match that enrollment

#### Scenario: Student reads only own enrollment-scoped data

- **WHEN** student S at center A requests learn portal data
- **THEN** progress, assessments, registrations, and results for other students are not returned
- **AND** data from a prior enrollment at another center is not mixed into the active enrollment view without explicit enrollment history UI

### Requirement: Learn portal resolves brand scope

The learn (and parents) host SHALL resolve `brandId` via `get_portal_branding` when `domain_mappings` lacks a learn row, so Home/Progress queries (`enabled: !!brandId`) run. Without `brandId`, the SPA MUST NOT render a blank dashboard.

#### Scenario: Learn host without domain mapping still loads brand id

- **GIVEN** hostname `learn.{brandSlug}.localhost` (or same-origin `?portal=learn&brand=`) with no `domain_mappings` row
- **WHEN** `resolveTenantScope` runs
- **THEN** it calls `get_portal_branding` for that brand slug and sets `tenant.brandId`
- **AND** student Home/Progress RPCs are enabled (`regression_learn_portal_needs_brand_id_from_branding`)

### Requirement: Student portal authentication

Center staff SHALL invite students to the learn portal; students SHALL link their auth account to their student record on first login.

Traceability: FR-S12

#### Scenario: Center invites student

- **WHEN** center staff with `has_center_access(C)` call `invite_student_portal_access(S.id)` and `students.login_email` is set for student S enrolled at C
- **THEN** an auth invite is sent to `login_email`
- **AND** the invite is auditable on the student record

#### Scenario: Student links on first login

- **WHEN** student accepts invite, authenticates, and calls `link_student_auth_user(S.id, B)` while `students.user_id` is null
- **THEN** `students.user_id` is set to `auth.uid()`
- **AND** subsequent learn portal RPCs resolve student S

#### Scenario: Auth link is unique per brand

- **WHEN** two student rows under the same brand attempt to link the same `user_id`
- **THEN** the second link is rejected

### Requirement: Learn login uses franchise public chrome

Learn host `/login` SHALL render the franchise public nav and footer (same theme as `{center}.{brand}/`) when the franchise is known from `?center=`, a franchise-host referrer, or sessionStorage for that brand. Nav, CTA, and footer links SHALL point at the franchise public origin so they do not stay on the learn app. When no franchise can be resolved, the brand public nav/footer MAY be used instead. The login split SHALL NOT use a full-viewport `ThemeProvider` shell that hides that chrome. Franchise **Student Login** and **Copy Profile URL** SHALL include the center slug so this chrome can load. Regression: `regression_learn_login_renders_franchise_nav_and_footer`.

#### Scenario: Student login from a franchise site keeps that franchise header and footer

- **GIVEN** a visitor opens `learn.{brand}/login?center={center}` (or arrives from `{center}.{brand}` with that slug stored)
- **WHEN** the login form is ready
- **THEN** the franchise public header and footer are visible
- **AND** the layout root has class `marketing-page--login`
- **AND** enroll lead modals SHALL NOT mount on `/login`

### Requirement: Comprehensive learn dashboard

The system SHALL provide `get_student_learn_home(brand_id)` returning a single JSON payload sufficient to render the full dashboard without additional round-trips for core widgets.

Traceability: FR-S13

#### Scenario: Dashboard payload includes all widget groups

- **WHEN** enrolled student with progress, assessments, and competitions calls `get_student_learn_home(B)`
- **THEN** the response includes keys: `student`, `brand`, `enrollment`, `center`, `curriculum_ladder`, `stats`, `upcoming_competitions`, `my_registrations`, `recent_results`, `recent_assessments`, `recent_activity`, `quick_actions`

#### Scenario: Sparse data renders gracefully

- **WHEN** enrolled student has enrollment only (no progress, assessments, or competitions yet)
- **THEN** the RPC succeeds
- **AND** `stats` show zeros
- **AND** `curriculum_ladder` shows appropriate empty state (all `not_started` if curriculum pinned, or empty ladder with reason if not)
- **AND** no error is raised

#### Scenario: Dashboard shows my center card

- **WHEN** enrolled student loads the home dashboard
- **THEN** the UI displays center `display_name`, city/area, `contact_phone`, and public marketing URL
- **AND** brand name/logo is visible

### Requirement: Learn portal navigation

The learn portal SHALL expose navigation items: Dashboard (`/`), Progress (`/progress`), Activity (`/activity`), and Profile (`/profile`). Competitions (`/competitions`, labeled Events) SHALL appear only when `brand_settings.settings.features.competitions` is true. Learn clients SHALL load that flag via `get_brand_feature_flags(brand_id)` (SECURITY DEFINER) because students cannot SELECT `brand_settings` under RLS. Home “Recommended for You” competition cards SHALL link to `/competitions`.

Traceability: FR-S14, FR-S22; regression — `regression_learn_nav_shows_events_when_competitions_flag_on`

#### Scenario: Authenticated student sees expanded nav

- **WHEN** student opens the learn portal shell and `features.competitions` is true
- **THEN** sidebar lists Dashboard, Progress, Events, Activity, and Profile
- **AND** kits/merchandise routes are not present (FR-S03)

#### Scenario: Events hidden when Competitions is off

- **WHEN** student opens the learn portal shell and `features.competitions` is false
- **THEN** Events is omitted from sidebar and bottom nav
- **AND** `/competitions` redirects to `/`

#### Scenario: Learn loads competitions flag without brand_settings SELECT

- **GIVEN** an authenticated student without `has_brand_access`
- **WHEN** the Learn shell resolves feature flags
- **THEN** `get_brand_feature_flags` returns `settings.features` for the brand
- **AND** Events nav appears when `competitions` is true

### Requirement: Curriculum progress ladder

The system SHALL display curriculum levels from the enrollment's pinned `curriculum_version_id`, merged with `student_level_progress` status per level.

Traceability: FR-S15

#### Scenario: Ladder ordered by curriculum

- **WHEN** enrollment has `curriculum_version_id` set and center recorded progress for 2 levels
- **THEN** `curriculum_ladder.levels` are ordered by `levels.sort_order`
- **AND** each level has status `completed`, `in_progress`, or `not_started`
- **AND** `completion_pct` reflects completed levels over total levels

#### Scenario: No curriculum version pinned

- **WHEN** active enrollment has null `curriculum_version_id`
- **THEN** the progress UI shows empty state: center has not assigned a curriculum yet
- **AND** contact center CTA uses center phone from dashboard payload

#### Scenario: Progress detail page

- **WHEN** student opens `/progress`
- **THEN** full ladder and assessment history are shown via `get_student_progress_detail(B)`

### Requirement: Exam and assessment visibility

Center-recorded assessments (exams) SHALL appear on the student dashboard and progress views when `visible_to_student = true`.

Traceability: FR-S16

#### Scenario: Visible assessment on dashboard

- **WHEN** center recorded assessment A for student S with `visible_to_student = true`
- **THEN** A appears in `recent_assessments` on home and in progress detail
- **AND** fields include `assessment_type`, `score`, `max_score`, `assessed_at`

#### Scenario: Hidden assessment omitted

- **WHEN** assessment A has `visible_to_student = false`
- **THEN** student learn RPCs omit A

### Requirement: Free competition self-enrollment

Students SHALL self-register for brand competitions where `fee_type = free`, `registration_mode = open`, and the current time is within the registration window.

Traceability: FR-S17

#### Scenario: Successful free registration

- **WHEN** student S meets eligibility and competition K has `fee_type = free`, open registration window, and `registration_mode = open`
- **THEN** `register_student_for_competition(K.id)` creates `student_competition_registrations` with status `registered`
- **AND** `enrollment_id` and `center_id` are copied from S's active enrollment
- **AND** K appears in `my_registrations` on dashboard

#### Scenario: Registration window closed

- **WHEN** student attempts to register after `registration_closes_at`
- **THEN** the RPC rejects with error code `REGISTRATION_CLOSED`

#### Scenario: Withdraw registration

- **WHEN** student calls `withdraw_competition_registration` for an active free registration before the event
- **THEN** registration status becomes `withdrawn`
- **AND** the student may re-register if the window is still open

#### Scenario: Competitions list filters

- **WHEN** student opens `/competitions`
- **THEN** tabs or filters show upcoming (open/closed), my registrations, and past results via `get_student_competitions(B, filter)`

### Requirement: Paid competition enrollment deferred

The system SHALL display paid competitions but MUST NOT process payment or create paid registrations in v2.

Traceability: FR-S18

#### Scenario: Paid competition shows Coming soon

- **WHEN** competition K has `fee_type = paid`
- **THEN** dashboard and competitions list show a paid badge and disabled Enroll control labeled "Coming soon — online payment"
- **AND** optional display of `fee_amount` and `fee_currency` is read-only

#### Scenario: Paid registration rejected

- **WHEN** student calls `register_student_for_competition(K.id)` for paid competition K
- **THEN** the RPC rejects with error code `PAID_ENROLLMENT_NOT_AVAILABLE`

### Requirement: Competition and exam results

Past competition results recorded by center staff SHALL appear on the student dashboard and competitions history.

Traceability: FR-S19

#### Scenario: Recent results on dashboard

- **WHEN** center recorded `student_competition_entries` for student S
- **THEN** `recent_results` includes competition name, event date, `result_rank`, and optional numeric rank/score
- **AND** full history is available on `/competitions` past tab

### Requirement: Student competition quiz

When a competition has attached questions, enrolled students SHALL take a one-attempt quiz on `/competitions`. The server SHALL score answers and write `student_competition_entries.score`. Quiz payloads SHALL omit correct answers until after submit.

Traceability: FR-S22

#### Scenario: Take quiz from My registrations

- **GIVEN** student S is registered for competition K with questions and the quiz window is open
- **WHEN** S opens `/competitions` My registrations
- **THEN** Take quiz is available
- **AND** submitting stores the attempt score for Past results

### Requirement: Activity timeline

The system SHALL provide a unified recent activity feed derived from level progress, assessments, competition registrations, and results.

Traceability: FR-S20

#### Scenario: Activity feed on dashboard

- **WHEN** student has recent academic events
- **THEN** `recent_activity` returns up to 10 items with `type`, `title`, `subtitle`, `occurred_at`, and optional `href`
- **AND** `/activity` shows the full paginated timeline

### Requirement: Student profile and transparency

The profile page SHALL show student demographics, active enrollment, and center contact details. Students MAY upload a profile photo; after **Save profile**, `student_profiles.photo_url` SHALL be returned on both `get_student_profile` and `get_student_learn_home` so the learn shell header avatar shows the photo (not only initials).

Traceability: FR-S21

#### Scenario: Profile shows enrollment context

- **WHEN** student opens `/profile`
- **THEN** the page shows student name, code, DOB, school/city from `student_profiles`
- **AND** active enrollment: center name, enrolled date, batch if assigned, curriculum version label
- **AND** center contact phone and public URL
- **AND** **Center website** rewrites RPC `http://{center}.{brand}.localhost:9000/` via `resolveCenterWebsiteUrl` / `centerPortalUrl` so Vercel same-origin opens `/?portal=center&brand=…&center=…` (never raw localhost:9000)

#### Scenario: Saved photo appears in learn header

- **GIVEN** student S has `student_profiles.photo_url` set
- **WHEN** learn shell loads `get_student_learn_home`
- **THEN** `student.profile.photo_url` is present
- **AND** the header avatar uses that URL (`regression_learn_header_shows_student_profile_photo_when_photo_url_set`)

Traceability: regression — `regression_vercel_center_website_rewrites_localhost_rpc_url`, `regression_vercel_profile_center_website_avoids_localhost_rpc_url`.

#### Scenario: Profile does not expose other students

- **WHEN** student S views profile
- **THEN** only S's data under brand B is shown

### Requirement: Tenant isolation

Student learn portal data SHALL never cross brand or center boundaries via RLS and RPC guards.

Traceability: FR-X03

#### Scenario: Cross-brand denial

- **WHEN** student S under brand A calls learn RPC with brand B id
- **THEN** access is denied or empty

#### Scenario: Cross-student denial

- **WHEN** student S attempts to read registration or progress for student T
- **THEN** RLS denies direct table access and RPCs do not accept arbitrary student ids from the client

## REMOVED Requirements

(None — new capability)
