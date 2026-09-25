# Staff Login

Platform, brand, and center staff sign in at `/login` with email/password and optional OAuth providers.

## Requirements

### Requirement: Login form exposes a unique primary submit control

The staff login form SHALL render a primary email/password submit button whose accessible name is exactly `Log in` (or `Signing in…` while the request is in flight). OAuth actions SHALL use distinct accessible names that include the provider (`Log in with Google`, `Log in with Facebook`, `Log in with WhatsApp`). When passkeys are enabled, a secondary **Log in with passkey** control SHALL appear below social providers. Users MUST register a passkey while signed in (Settings → Passkeys) before passkey login succeeds.

#### Scenario: Passkey login requires prior registration

- **GIVEN** passkeys are enabled and the user has no `passkey_credentials` row
- **WHEN** they choose **Log in with passkey**
- **THEN** the app SHALL show a clear error (no passkey found / not registered)
- **AND** SHALL NOT create a session

#### Scenario: Passkey registration while signed in

- **GIVEN** a signed-in staff user on platform, brand, or center settings
- **WHEN** they add a passkey from Settings
- **THEN** the SPA SHALL call `passkey-verify` with `register-options` and `register-verify`
- **AND** store the credential in `passkey_credentials`

#### Scenario: Primary submit is distinguishable from OAuth

- **GIVEN** a visitor opens `/login` on the platform portal with Google (and any other) OAuth enabled
- **WHEN** assistive tech or tests query `role=button` with accessible name `Log in`
- **THEN** using an **exact** name match resolves to the primary email submit control only
- **AND** substring matching without exactness also matches OAuth buttons whose names start with `Log in with …`

#### Scenario: OAuth returns to login for membership gate

- **GIVEN** a staff portal with Google auth enabled
- **WHEN** the user completes Google OAuth
- **THEN** Supabase SHALL redirect to `{origin}/login` (preserving safe `?next=` when present)
- **AND** if the user lacks portal membership the app SHALL sign them out automatically and show: `{email} is not authorized for this website. Contact your administrator to request access.`
- **AND** post-login `?next=` values MUST be same-origin relative paths (`/admin`, `/app`) — protocol-relative (`//…`) and absolute URLs are rejected
- **AND** same-origin `?portal=` / `?brand=` / `?center=` query params SHALL be kept on the post-login `/app` or `/admin` URL

#### Scenario: Split-screen platform login smoke

- **GIVEN** the platform marketing login page
- **WHEN** the page loads
- **THEN** heading `Welcome back!`, platform account copy, Email field, and exact `Log in` submit are visible
- **AND** `Log in with Google` is available when Google auth is enabled
- **AND** the page SHALL render the same enterprise Site nav and site footer as platform `/`

### Requirement: New franchise staff login stays signed in

Staff `/login` SHALL NOT sign the user out until memberships for the current user have been fetched. Invited **brand** (`approve_platform_brand_signup`) and **center** (franchise inquiry approval or CSV import) memberships SHALL become `active` on that first successful staff sign-in via `accept_own_invited_memberships`. Learn and parents `/login` SHALL NOT use staff memberships and SHALL NOT sign the user out for an empty memberships list.

#### Scenario: Memberships still loading are not access-denied

- **GIVEN** a franchise owner has just signed in on a center `/login`
- **AND** the memberships query has not finished
- **WHEN** the login gate evaluates access
- **THEN** the app SHALL NOT call sign-out
- **AND** SHALL wait until memberships are fetched

#### Scenario: New brand owner is not signed out while memberships load

- **GIVEN** a `brand_owner` has just signed in on a brand `/login`
- **AND** the memberships query has not finished
- **WHEN** the login gate evaluates access
- **THEN** the app SHALL NOT call sign-out

#### Scenario: Invited franchise owner can enter the center portal

- **GIVEN** a `center_owner` membership with status `invited` for the current franchise host
- **WHEN** that user signs in with a valid password
- **THEN** `accept_own_invited_memberships` SHALL set the row to `active`
- **AND** the app SHALL redirect to `/app` (keeping portal query params on same-origin hosts)

#### Scenario: Auth bounce back to login keeps same-origin portal query

- **GIVEN** a staff session on `/app?portal=center&brand=…&center=…` (Vercel same-origin)
- **WHEN** `RequireAuth` or `RequireMembership` sends the user to login
- **THEN** the destination SHALL be `/login?portal=center&brand=…&center=…`
- **AND** SHALL fall back to the sticky portal override when the current search string is empty
- **AND** SHALL NOT land on bare `/login` while a center/brand portal context is known

#### Scenario: Invited brand owner can enter the brand portal

- **GIVEN** a `brand_owner` membership with status `invited` (platform brand signup approved, credentials not yet synced)
- **WHEN** that user signs in on the brand host
- **THEN** `accept_own_invited_memberships` SHALL set the row to `active`
- **AND** the app SHALL NOT sign them out for an empty memberships list during that accept

#### Scenario: Student login ignores staff memberships

- **GIVEN** a learner session on the learn portal with no staff `memberships` row
- **WHEN** `/login` evaluates access
- **THEN** the app SHALL NOT call sign-out
- **AND** SHALL send the learner to the student home

### Requirement: Platform login uses public marketing chrome

Platform host `/login` SHALL render as a child of `MarketingPublicLayout` with the homepage Site header (`EnterpriseNav`) and site footer (`EnterpriseSiteFooter`). The login split SHALL NOT use a full-viewport `ThemeProvider` shell that hides that chrome.

#### Scenario: Platform login keeps homepage nav and footer

- **GIVEN** a visitor opens `/login` on the platform host
- **WHEN** the login form is ready
- **THEN** navigation labelled `Site` is visible
- **AND** the enterprise site footer is visible
- **AND** the layout root has class `marketing-page--login`

### Requirement: Brand login uses that brand’s public marketing chrome

Brand host `/login` SHALL render as a child of `BrandPublicLayout` with the same nav and footer as brand `/` for the assigned `marketing_theme` (Abacus Classic, Spark Academy, or Novu). The login split SHALL NOT use a full-viewport `ThemeProvider` shell that hides that chrome.

#### Scenario: Brand login keeps homepage nav and footer

- **GIVEN** a visitor opens `/login` on a brand host (for example `smart-brain-abacus.localhost`)
- **WHEN** the login form is ready
- **THEN** the brand public header (Abacus `header.ac-nav`, Spark `header.sa-nav`, or Novu `.novu-nav-bar`) is visible
- **AND** the matching site footer is visible
- **AND** the layout root has class `marketing-page--login`
- **AND** enroll/apply lead modals SHALL NOT mount on `/login` (so staff Email is unique)

### Requirement: Learn login uses franchise public marketing chrome

Learn host `/login` SHALL render as a child of `LearnPublicLoginLayout`. When the franchise is known, that layout uses `CenterPublicLayout` (`marketing-page--login`) with the same nav and footer as `{center}.{brand}/`. When it is not, brand public chrome MAY wrap the form. The login split SHALL NOT use a full-viewport `ThemeProvider` shell that hides that chrome. Regression: `regression_learn_login_renders_franchise_nav_and_footer`.

#### Scenario: Student login keeps franchise nav and footer

- **GIVEN** a visitor opens `/login` on the learn host with a known franchise (`?center=` or franchise referrer)
- **WHEN** the login form is ready
- **THEN** the franchise public header (Abacus `header.ac-nav`, Spark `header.sa-nav`, EduLearn `header.el-nav`, or Novu `.novu-nav-bar`) is visible
- **AND** the matching site footer is visible
- **AND** the layout root has class `marketing-page--login`

### Requirement: Automated tests use library-correct exact name matchers

Exact accessible-name matching SHALL use the API supported by each test library:

| Library | Exact match for primary `Log in` |
|---------|----------------------------------|
| **Playwright** (`e2e/`) | `{ name: "Log in", exact: true }` |
| **Testing Library** (Vitest) | `{ name: exactAccessibleName("Log in") }` which is `/^Log in$/` — **not** `{ exact: true }` (invalid on `ByRoleOptions`; fails `tsc`) |

OAuth queries SHALL use the full provider label with the same library-specific exact matcher. Playwright staff login Email SHALL target `.ed-login-card` so public marketing chrome cannot match extra Email fields. A regression E2E SHALL assert that Playwright non-exact `Log in` matches more than one button when OAuth is shown. A Vitest regression SHALL fail if Testing Library role queries pass `exact: true`.

#### Scenario: Testing Library rejects Playwright exact option

- **GIVEN** a Vitest + Testing Library component test
- **WHEN** `getByRole` is called with `{ name: "…", exact: true }`
- **THEN** TypeScript SHALL report that `exact` does not exist on `ByRoleOptions`
- **AND** authors SHALL switch to `exactAccessibleName("…")` from `@/test/exactAccessibleName`

### Requirement: Login failures and denials emit auth audit events

Staff `/login` SHALL report `login_failure` when email/password (or OTP) auth returns an error, and `access_denied` when a session exists but the user has no portal membership. Reporting SHALL be best-effort and MUST NOT replace the existing user-visible error copy. See `openspec/specs/auth-audit-logs/spec.md`.

#### Scenario: Wrong password still shows the existing error

- **GIVEN** a staff login form on any portal
- **WHEN** `signInWithEmail` returns an error
- **THEN** the page shows the existing sign-in failed message
- **AND** the client attempts to record `login_failure` without including the password
