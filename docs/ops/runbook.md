# EduNudg Operations Runbook

## Local development (no Docker)

- **Frontend**: Vite on http://localhost:9000 (`pnpm dev`)
- **Backend**: [Supabase Cloud](https://supabase.com) — direct connection via `VITE_SUPABASE_URL` + anon key

Do **not** run `supabase start` (that requires Docker Desktop).

```bash
pnpm install
cp .env.example apps/web/.env
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from Supabase Dashboard → API
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
pnpm dev
```

Full setup: [supabase-cloud-setup.md](./supabase-cloud-setup.md)

### URLs (port 9000)

| URL | Portal |
|-----|--------|
| http://localhost:9000/ | Platform marketing homepage (shared nav + footer) |
| http://localhost:9000/login | Platform admin / staff login (same Site nav + footer as `/`) |
| http://localhost:9000/admin | Platform app (Command Center KPIs) |
| http://localhost:9000/admin/brands | Brands list — **Brand backend** opens target brand `/app`; **Edit** → brand detail |
| http://localhost:9000/admin/brands/:slug | Brand detail — KPIs, settings (**Site logo** / name → Homepage `landing.meta`), domains, centers |
| http://localhost:9000/admin/revenue | Revenue & usage KPIs |
| http://localhost:9000/admin/homepage | Platform marketing homepage editor |
| http://abacusworld.localhost:9000/ | Abacus World franchise landing (public) |
| http://smart-brain-abacus.localhost:9000/ | Smart Brain Abacus (Abacus Classic theme) |
| http://abacusworld.localhost:9000/login | Brand staff login (same public nav + footer as `/`) |
| http://smart-brain-abacus.localhost:9000/login | Smart Brain Abacus staff login (Abacus Classic nav + footer) |
| http://abacusworld.localhost:9000/app | Brand operator backend (compact KPI dashboard) |
| http://abacusworld.localhost:9000/app/analytics | Brand analytics KPIs + Performance Breakdown pulse |
| http://{brand}.localhost:9000/auth/handoff | Platform-admin cross-portal sign-in (token in query) |
| http://koramangala.abacusworld.localhost:9000/ | Center parent enrollment landing (public) |
| http://koramangala.abacusworld.localhost:9000/login | Center staff login |
| http://koramangala.abacusworld.localhost:9000/app | Center operations dashboard |
| http://learn.abacusworld.localhost:9000/login | Student login (franchise public nav + footer when `?center=` is known) |

New franchise owners must use the center login URL (or `/login?portal=center&brand=…&center=…` on Vercel), not platform `/login`. New brand owners use `{brand}.localhost:9000/login`. Apply migration `101_accept_own_invited_memberships.sql` so invited owner rows activate on first staff sign-in. Student (learn) login does not use staff memberships.

**Marketing landing UI** (shared nav, hero, feature phone stage, footer): see [marketing-landing.md](../frontend/marketing-landing.md). On mobile/tablet, nav CTA is right-aligned; feature blocks snap one per screen.

**White-label copy** (optional): Brand Settings → **White-label & Login Copy**. Saves `login_headline` / `login_subtext` on `brand_settings.settings`. Login screens read them via `get_portal_branding`. Empty fields use per-portal defaults. Settings shows a mini login split that updates as you type (hero stays visible). **Save Copy** publishes and clears the in-memory branding cache so `/login` (desktop, where the real hero is shown) picks up new text.

Hosts (add to `/etc/hosts`):

```
127.0.0.1 localhost admin.localhost abacusworld.localhost koramangala.abacusworld.localhost learn.abacusworld.localhost smart-brain-abacus.localhost
```

### Platform admin cross-portal access

Signed-in platform admin can open **Brand backend** or **Open** on brand detail domains to land on another host’s `/app` (or learn/parents `/`). Uses Edge Function `platform-portal-handoff` and `/auth/handoff` — see [platform-admin-portal-handoff.md](./platform-admin-portal-handoff.md).

### Supabase Dashboard (Auth)

**Authentication → URL configuration**

- Site URL: `http://localhost:9000` (not `localhost:3000`)
- Redirect URLs: `http://localhost:9000/**`

**Google / social login rollout:** [google-oauth-rollout-runbook.md](./google-oauth-rollout-runbook.md) — access tables, SQL to grant platform membership, per-portal test checklists.

## Deploy (Vercel)

1. Link repo to Vercel (Root Directory: `apps/web`)
2. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (same cloud project or production project)
3. **Portal hosts** — pick one:
   - **Same-origin (default on `*.vercel.app`)**: leave `VITE_PORTAL_BASE_DOMAIN` unset. Brand / Franchise / Student portals open on the same URL with `?portal=&brand=` (and `center=` when needed). Platform **Brand backend** handoff uses this automatically.
   - **Real multi-host**: set `VITE_PORTAL_BASE_DOMAIN=yourdomain.com`, add wildcard DNS `*.yourdomain.com` → Vercel, and map hosts in `domain_mappings` (seed rows still use `*.localhost` for local; the SPA rewrites them when the base domain is set).
4. Supabase Auth → add production Site URL / Redirect URLs for `https://edunudg-hub.vercel.app/**` (and custom domains when used)

**Client demo URLs (Smart Brain Abacus on Vercel):** [demo-smart-brain-abacus-urls.md](./demo-smart-brain-abacus-urls.md)

### Deploy

**Production on `main` / `master`:** Vercel Git auto-deploy is enabled for those branches only (`apps/web/vercel.json` → `git.deploymentEnabled`). Other branches do not auto-deploy.

**PR previews + optional Actions production:** [`.github/workflows/cd.yml`](../../.github/workflows/cd.yml) uses remote Vercel builds when repository secrets are set. If secrets are missing, CD skips the CLI deploy with a warning (does not fail on empty `--token=`). CD `setup-node` must set `package-manager-cache: false` (and must not set `cache: pnpm`) — those jobs never install pnpm; v5 otherwise auto-detects `packageManager` in root `package.json` and fails with `Unable to locate executable file: pnpm`, then Post Run cache save fails with `Path Validation Error`.

Do not use local `vercel build` + `vercel deploy --prebuilt` for this Vite SPA when `VITE_*` settings are marked **Sensitive** in Vercel. `vercel pull` intentionally downloads those values as `[SENSITIVE]`; a local build then embeds that marker in the browser bundle. Remote `vercel deploy` builds inside Vercel with the real protected values.

**One-time Actions secrets** — **repository** secrets (Settings → Secrets and variables → Actions). Requires **repo admin**. Empty `VERCEL_TOKEN` previously caused `You defined "--token", but it's missing a value`.

| Secret | Where to get it |
|--------|-----------------|
| `VERCEL_TOKEN` | [Vercel → Account → Tokens](https://vercel.com/account/tokens) (create a token; MCP cannot mint this) |
| `VERCEL_ORG_ID` | Vercel team id (`team_…`) — MCP `list_teams`, or `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | Project id (`prj_…`) — MCP `list_projects` / `get_project`, or `.vercel/project.json` → `projectId` |

Current production project (team **chetanbhansali-3860's projects**): project **edunudg-hub** → `https://edunudg-hub.vercel.app`.

```bash
# Prefer pnpm dlx if `vercel` is not on PATH (no global install required)
pnpm dlx vercel@latest login
pnpm dlx vercel@latest link --cwd apps/web
# Do not commit apps/web/.vercel/

# Token: paste when prompted (from https://vercel.com/account/tokens)
gh secret set VERCEL_TOKEN

# Or set org/project from MCP / dashboard without linking:
#   VERCEL_ORG_ID     = team_…   (list_teams → id)
#   VERCEL_PROJECT_ID = prj_…    (list_projects → id for edunudg-hub)
printf '%s' 'team_…' | gh secret set VERCEL_ORG_ID
printf '%s' 'prj_…'  | gh secret set VERCEL_PROJECT_ID

# After link:
node -p "require('./apps/web/.vercel/project.json').orgId" | gh secret set VERCEL_ORG_ID
node -p "require('./apps/web/.vercel/project.json').projectId" | gh secret set VERCEL_PROJECT_ID
```

CD uploads source with `vercel deploy` so Vercel performs the build with protected environment variables available. Manual re-run: Actions → CD → **Run workflow**.

After Actions secrets work, you can turn off Git production deploys to avoid double builds by setting `"git": { "deploymentEnabled": false }` in `apps/web/vercel.json`.

Do **not** put empty values in a GitHub Environment named `production` for these keys — empty environment secrets override repo secrets.

| Event | Behavior |
|-------|----------|
| Push to `main` / `master` | Vercel Git production deploy |
| Pull request | Actions preview deploy (if secrets set) + PR comment |
| CI success on `main` / `master` | Actions production deploy when secrets set (`workflow_run` after [CI](../../.github/workflows/ci.yml)) |

## Migrations

```bash
supabase migration new my_change
supabase db push
pnpm dlx supabase functions deploy auth-audit
```

Auth audit (login/logout) uses migration `097_auth_audit_events.sql`. Access logs and SPA error reports use `098_error_and_access_audit.sql`. `099_revoke_anon_access_audit.sql` revokes direct `anon` EXECUTE on access/tenant audit RPCs (Supabase default privileges grant `anon` even after `REVOKE FROM PUBLIC`). Platform `/admin/audit` streams: Mutations, Auth, Access, Errors. Brand/center `/app/audit` is Auth + Access only. Deploy `auth-audit` so IP/country are stored; the SPA still logs auth events via RPC if the function is missing. Apply 098 then 099 with `supabase db push` (or the SQL editor) before Errors/Access appear. If `rls_security_hardening.sql` fails on leftover `anon` EXECUTE (e.g. `competition_quiz_meta_for_student`), apply `100_revoke_anon_security_definer_execute.sql` — it re-sweeps all public SECURITY DEFINER functions.

## Tests

```bash
pnpm test
pnpm audit:schema
pnpm test:e2e
pnpm ci:local   # full GitHub CI mirror — required before push (see edunudg-pre-push-ci)
pnpm hooks:install  # installs .githooks/pre-push (also runs on pnpm install via prepare)
```

`git push` is blocked until `pnpm ci:local` is green (or a recent stamp exists for the same HEAD). Emergency bypass: `SKIP_CI_LOCAL=1 git push` (user-approved only).

**Enforcement layers:**

| File | Role |
|------|------|
| `.cursor/skills/edunudg-pre-push-ci` | Agent must run `pnpm ci:local` → auto-fix → green **before** push |
| `.cursor/hooks.json` | `beforeShellExecution` on `git push` → `gate-git-push.sh`; `stop` finish-gate also checks push+CI |
| `.cursor/hooks/gate-git-push.sh` | **Denies** `git push` without a recent green stamp for HEAD; **asks** for `SKIP_CI_LOCAL=1` |
| `.githooks/pre-push` | Backup: runs `pnpm ci:local` (or accepts stamp) before allowing the push |

Skill: `edunudg-pre-push-ci`. OpenSpec: [`agent-artifact-sync`](../../openspec/specs/agent-artifact-sync/spec.md).

RLS SQL tests (optional, against cloud DB):

```bash
export DATABASE_URL="postgresql://..."   # from Dashboard → Database
pnpm test:rls
```

## Marketing homepage & brand themes

- Public config key: `platform_settings.marketing_homepage` (migration `009_marketing_homepage.sql`)
- Anonymous users can **read**; platform admins can **read/write** via RLS
- Virgin Novu seed (no enterprise blocks / no `brand-assets` URLs) is replaced at read time with `DEFAULT_HOMEPAGE_CONFIG`. Customized rows that still carry Novu markers (`theme.bgGradient`, `meta.themeNote`) are **kept** and merged — otherwise uploaded hero/logo assets appear “reset” while files remain in Storage. Never Save from `/admin/homepage` while viewing substituted defaults.
- Brand/center landings: always merge `landing` / `center_landing`; saves use `preserveCustomMarketingMediaUrls`; seed uses `EXCLUDED.settings || brand_settings.settings` so existing content wins. Rule: `marketing-homepage-media`.
- Edit platform homepage at **Platform → Homepage** (`/admin/homepage`) after signing in as `admin@edunudg.com`
- **Brand marketing themes** (Novu / Abacus Classic / Spark Academy / EduLearn) are assigned on **Platform → Brands → Edit** → **Brand settings** → **Website theme**
- Saving theme/name/status alone does **not** call `brand-owner-credentials` — only when login email/password fields change (see [edge-functions](./edge-functions.md))
- Brand **Franchise Centers** → Franchise Identity: set center **Login email** / **Password** the same way (`center-owner-credentials`); profile-only saves do not call the edge function; passwords must be at least 6 characters (`admin` is too short)
- React Query: keep `MARKETING_HOMEPAGE_CONFIG_QUERY_KEY` vs `MARKETING_PUBLIC_BUNDLE_QUERY_KEY` separate ([marketing-homepage OpenSpec](../../openspec/specs/marketing-homepage/spec.md))
- Platform `/` pricing ticks: `marketing.css` must use `content: "\2713"` (CSS Unicode escape). A raw `✓` that gets double-encoded shows as `â` on Vercel while localhost still looks like a tick.
- Upload hero, highlight, and feature videos via file pickers in the editor (stored in Supabase `brand-assets`)
- Brand owners edit brand page **content** at `{brand}.localhost:9000/app/homepage`
- Brand owners edit the center enrollment template at `{brand}.localhost:9000/app/center-site`
- Public SEO is automatic (`derivePublicSeo`): no extra editor fields. Vercel serves `/robots.txt`, `/sitemap.xml`, `/llms.txt` via `/api/public-seo` and injects head tags through `/api/seo-document` on indexable paths only. `/login` rewrites to `/index.html` (never the SEO function). Preview hosts (`*-git-*.vercel.app` or `VERCEL_ENV=preview`) are `noindex`.

## Franchise center CSV / Excel import

Bulk-onboard centers from platform brand detail or brand Franchise Management (CSV, `.xlsx`, or `.xls`) — see [franchise-center-csv-import](./franchise-center-csv-import.md).

## Center student CSV import

Franchise staff bulk-enroll existing students from **Students** (`/app/students`) → **Import students** — see [center-student-csv-import](./center-student-csv-import.md). Walk-in enquiries still use **Leads** → **Import CSV**. **Add student lead** on `/app/leads` uses the same CSV template fields.

## Merchandise product photos

- Enable **`merchandise`** on platform **Brand detail** → Features (or `brand_settings.settings.features.merchandise`).
- Apply migration `045_merchandise_catalog_photos.sql`: `supabase db push`
- Brand staff: **Brand portal → Merchandise → Catalog** — add SKUs, tie each SKU to curriculum, then upload up to **5 photos per product** (PNG/JPEG/WebP/GIF, 5 MB).
- Apply migration `084_merchandise_catalog_programs.sql`, `085_merchandise_catalog_levels.sql`, `087_fix_sync_merchandise_catalog_programs.sql`, `088_list_center_merchandise_catalog_price_bigint.sql`, then `089_list_center_merchandise_catalog_setof.sql`: `supabase db push` — brand catalog tags courses **and** levels; franchise Shop and Inventory call `list_center_active_merchandise_catalog` so only assigned-course SKUs appear.
- Apply migration `090_lead_csv_aligned_fields.sql` so staff lead lists can select `login_email`, `address_line1`, `state`, `program_name`, `starting_level` (do not reuse prefix `089` — that version is the merchandise SETOF RPC).
- Storage path: `{brand_id}/merchandise/{catalog_item_id}/photo-{1-5}.{ext}` in the **`brand-assets`** bucket (re-upload to a slot replaces that slot).
- Franchise centers see photos on **Center portal → Merchandise → Shop**.

See [merchandise spec](../spec/merchandise.md).

## Curriculum course banners

- Brand staff: **Brand portal → Curriculum** — Course Media & Visuals → Course Banner (Thumbnail).
- Storage path: `{brand_id}/marketing/program-marketing/{program_id}/asset.{ext}` in the **`brand-assets`** bucket. Adding a course uses a draft UUID folder until `programs.id` exists.
- Do **not** reuse a brand-wide `program-marketing/asset.*` slot — that overwrites every course that pointed at the same file.
- Existing `marketing_image_url` values keep working; a new upload writes a new per-course object and **Save** updates only that course. Preview Video stays a URL field.
- If a saved banner file is missing, Course Banner still shows the empty dropzone plus **Upload image** (do not hide the picker behind a zero-height broken `<img>`).

See [brand-curriculum-workspace spec](../../openspec/specs/brand-curriculum-workspace/spec.md).

## Center public profile (franchise settings)

- Apply migration `046_center_public_profile.sql`: `supabase db push`
- Franchise staff: **Center portal → Settings** (`/app/settings`) — update photo, address, and phone. Sign-in email comes from Google/social auth; public site URL is the center marketing host (no separate website field). Staff cannot add franchise social links here.
- Center photo storage: `{brand_id}/centers/{center_id}/photo.{ext}` in **`brand-assets`** bucket.
- Changes appear on the center public site (`{center}.{brand}.localhost:9000`) via `get_center_landing_public`.
- Mentors: franchiser (Franchise Identity name + master photo) first when present; brand homepage founder always remains (`brand_founders` from migration `083`).
- Footer social icons on the **center** site use brand Homepage → Social Media Connect, not `franchise_centers.social_links`.
- Footer address/phone on the **center** site (Novu, Abacus, Spark) use Franchise Management Location & Contact — not brand Head office.

```bash
supabase db push   # applies 009 if not yet applied
```

## OAuth (Google / Facebook)

Configure in **Supabase Dashboard → Authentication → Providers** when ready. No local `config.toml` changes required for cloud.

## OpenSpec (behavioral specs)

EduNudg uses [OpenSpec](https://openspec.dev/) for testable requirements and change proposals. Reference docs stay in `docs/`; behavior lives in `openspec/specs/`.

**Requirements:** Node.js ≥ 20.19.

```bash
pnpm install                    # includes @fission-ai/openspec devDependency
pnpm openspec:update            # refresh Cursor /opsx:* slash commands
pnpm exec openspec list         # active changes
pnpm exec openspec validate --all --strict
pnpm exec openspec archive <change-name> -y
```

**Cursor workflow:** `/opsx:propose` → review artifacts in `openspec/changes/` → `/opsx:apply` → `/opsx:archive`.

**Telemetry opt-out (optional):** `export OPENSPEC_TELEMETRY=0` or `export DO_NOT_TRACK=1`.

See [`openspec/README.md`](../../openspec/README.md) and [`docs/agent-playbook/README.md`](../agent-playbook/README.md).

## Ephemeral E2E cleanup (local / shared Supabase)

After Playwright (or interrupted runs), wipe leftover `E2E Brand …` rows so `/admin/brands`, `/admin/subscriptions`, and `/admin/audit` stay clean. Seed plans (`starter` / `growth` / `enterprise`) are never deleted.

```bash
pnpm db:push   # applies migrations 069–072 (purge RPCs)
```

- Prefer RPC: `SELECT public.purge_ephemeral_e2e_brands();` (also clears `brand_subscriptions`)
- One-shot SQL Editor script: [`scripts/purge-ephemeral-e2e-brand-subscriptions.sql`](../../scripts/purge-ephemeral-e2e-brand-subscriptions.sql)
- Leads: [`scripts/purge-ephemeral-e2e-leads.sql`](../../scripts/purge-ephemeral-e2e-leads.sql) or `purge_ephemeral_e2e_leads()`

E2E suites hard-delete via `e2e/helpers/brandCleanup.ts` + `globalTeardown` (SQL when `DATABASE_URL` is set, else platform-admin RPC).

## Security

- Never commit `service_role` key or `DATABASE_URL` to git
- Verify RLS after every migration
- Use anon key only in the browser
