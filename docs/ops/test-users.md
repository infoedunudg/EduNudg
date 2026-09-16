# Test users

## Quick steps

1. Apply schema: `supabase db push`
2. Run [`supabase/seed/test-users.sql`](../../supabase/seed/test-users.sql) in **SQL Editor** (brand, center, domains, auth users)
3. Copy [`apps/web/.env.example`](../../apps/web/.env.example) → `apps/web/.env` with your Supabase **Project URL** and **anon** key
4. `pnpm dev` → open **http://localhost:9000/login** and sign in

Google OAuth per portal (tables, SQL, test checklists): [google-oauth-rollout-runbook.md](./google-oauth-rollout-runbook.md).

**Password for seeded brand/center/student accounts:** `admin`  
**Platform admin (`admin@edunudg.com`):** `admin1` (6+ characters; `admin` is rejected by Auth).

## Accounts

| Persona | Email | Role | Where to log in |
|---------|-------|------|-----------------|
| Platform admin | `admin@edunudg.com` | `platform_super_admin` | http://localhost:9000/login → redirects to `/admin` (`admin1`) |
| Franchisor (brand) | `owner@edunudg.com` | `brand_owner` | http://abacusworld.localhost:9000/login |
| Franchise (center) | `center@edunudg.com` | `center_owner` | http://koramangala.abacusworld.localhost:9000/login |
| Student | `student@edunudg.com` | student (`students.user_id` linked) | http://learn.abacusworld.localhost:9000/login |

Student **learn portal** shows dashboard with curriculum ladder (3/8 levels), exams, free/paid upcoming competitions, and past results after seed + migration `048_student_learn_portal.sql`.

Student **data** (enrollment at Koramangala) is visible when logged in as **center** or **brand** under Students.

Add to `/etc/hosts` if needed:

```
127.0.0.1 abacusworld.localhost koramangala.abacusworld.localhost learn.abacusworld.localhost
```

Optional: run [`supabase/seed/seed.sql`](../../supabase/seed/seed.sql) first for subscription plans (not required for login).

## Brand login credentials (platform admin)

On **Platform → Brands**, click **Edit** (or open the brand name) to go to **brand detail** (`/admin/brands/:slug`) and set **Login email** and **Password** for the franchisor (`brand_owner`). Password is required only when creating a new login; leave it blank on edit to keep the existing password.

The brand signs in at `{slug}.localhost:9000/login` (dev) using that email and password. This provisions Supabase Auth + `memberships` via the `brand-owner-credentials` Edge Function — deploy after schema push:

```bash
pnpm dlx supabase@2.104.0 db push
pnpm dlx supabase@2.104.0 functions deploy brand-owner-credentials
```

## Franchise (center) login credentials (brand staff)

On **Brand → Franchise Centers** (`/app/centers`), open a center and use **Franchise Identity** → **Login email** / **Password**. Password is required only when creating a new login; leave blank to keep the existing password. **New passwords must be at least 6 characters** — `admin` (5 characters) is rejected by Supabase Auth (HTTP 400). Use `admin1` or longer.

CSV/Excel franchise import automatically provisions rows that have `owner_email`. Their initial password is the brand name collapsed to lowercase alphanumeric characters plus `@123` (`Smart Brain Abacus` → `smartbrainabacus@123`), and the completion dialog displays it. Rows without an owner email have no backend login. Treat the shared brand password as temporary and replace it under **Franchise Identity** after first login. Existing live franchises can be backfilled using the dry-run/apply instructions in [`franchise-center-csv-import.md`](./franchise-center-csv-import.md).

The franchise signs in at `{center}.{brand}.localhost:9000/login` (dev) using that email and password. This provisions Auth + `center_owner` membership via `center-owner-credentials`:

```bash
pnpm dlx supabase@2.104.0 db push
pnpm dlx supabase@2.104.0 functions deploy center-owner-credentials
```

If center login fails after setting credentials: confirm migration `073_center_owner_credentials.sql` is applied and the edge function is deployed.

**Login then immediate logout on a new franchise or new brand:** `/login` used to treat empty memberships as access-denied while the query was still loading, and inquiry/CSV franchise owners plus approved brand signups stay `invited` until first login. Apply migration `101_accept_own_invited_memberships.sql` (`supabase db push`) so invited `center_owner` / `brand_owner` rows activate on sign-in. Use the franchise login URL (`{center}.{brand}.localhost:9000/login` or `/login?portal=center&brand=…&center=…`) or the brand login URL (`{brand}.localhost:9000/login`), not the platform `/login`. Student (learn) login does not use staff memberships and is not signed out for an empty memberships list.

Seeded demo brand login remains `owner@edunudg.com` / `admin` at http://abacusworld.localhost:9000/login when `test-users.sql` has been applied.

Playwright public lead **submits** (franchise apply, brand/center student apply, merge, lost, stale) require that same seed: `hasE2ESeedTenant()` probes `get_brand_landing_public('abacusworld')`. A connected cloud project without `abacusworld` skips those mutations instead of failing with **Brand not found**. Staff `/app` specs can still run when seed users exist.

## Demo URL sheet (Vercel)

Bookmark list for **Smart Brain Abacus** client demos: [demo-smart-brain-abacus-urls.md](./demo-smart-brain-abacus-urls.md)

## Platform admin cross-portal handoff

As `admin@edunudg.com` on http://localhost:9000/admin/brands:

1. Click **View Frontend ↗** on a row — opens `{slug}.localhost:9000/` (public marketing site).
2. Click **Brand backend** on a row (or **Open** on brand detail → Domains) — should open `{slug}.localhost:9000/app` signed in as platform admin.
3. Requires Edge Function `platform-portal-handoff` deployed (see [platform-admin-portal-handoff.md](./platform-admin-portal-handoff.md)).

| Issue | Fix |
|-------|-----|
| Redirect to `localhost:3000` / connection refused | Set Supabase Site URL to `http://localhost:9000`; redeploy `platform-portal-handoff` |
| Stays on login after handoff | Check function logs; confirm `/auth/handoff?token_hash=…` URL on correct host |

## Brand marketing QA (feature phone blocks)

After editing **Brand → Marketing pages → Feature sections (phone blocks)**:

1. Remove blocks 3 & 4 (or any subset) and **Save**.
2. Open `{slug}.localhost:9000/` at desktop width (≥1024px).
3. Confirm the page loads and only your remaining blocks appear in the phone stage.

## Alternative: Dashboard + SQL (no auth insert)

If `test-users.sql` fails on `auth.users` (schema drift):

1. **Authentication → Users → Add user** — create platform admin with password `admin1`; other emails with password `admin`
2. Copy each user's UUID from the dashboard
3. Run only the `profiles` + `memberships` sections from `test-users.sql`, replacing UUIDs

Or use CLI:

```bash
supabase auth admin create-user --email admin@edunudg.com --password 'admin1' --email-confirm
```

Then insert memberships with the returned user id.

## Remove test users

```sql
DELETE FROM public.student_enrollments WHERE student_id = 'e0000000-0000-4000-8000-000000000001';
DELETE FROM public.students WHERE id = 'e0000000-0000-4000-8000-000000000001';
DELETE FROM public.memberships WHERE user_id::text LIKE 'f0000000-0000-4000-8000-%';
DELETE FROM public.profiles WHERE id::text LIKE 'f0000000-0000-4000-8000-%';
DELETE FROM auth.identities WHERE user_id::text LIKE 'f0000000-0000-4000-8000-%';
DELETE FROM auth.users WHERE email LIKE '%@edunudg.com';
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Sign in succeeds but page stays on `/login` | Fixed in app: redirects to `/admin` (platform) or `/` (brand/center). Restart `pnpm dev`. |
| `ERR_NAME_NOT_RESOLVED` / `your_project_ref.supabase.co` | Set real `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `apps/web/.env`, restart dev server |
| Login "Invalid credentials" | Re-run `test-users.sql` or reset password in Dashboard; platform admin is `admin@edunudg.com` / `admin1` |
| Brand login not working after platform edit | Deploy `brand-owner-credentials` Edge Function; set login email + password on Brands → Edit |
| Center login not working after brand centers edit | Deploy `center-owner-credentials`; apply migration `073`; set Login email + Password under Franchise Identity |
| Center login fails / stays on wrong portal on Vercel | Use `/login?portal=center&brand={brand}&center={center}` (not `{center}.{brand}.localhost:9000/login`). See [demo-smart-brain-abacus-urls.md](./demo-smart-brain-abacus-urls.md) |
| No data after login | Check `memberships.status = 'active'` |
| Brand/center portal wrong | Use subdomain hosts above; run `test-users.sql` for `domain_mappings` |
| Brand login access denied (owner) | App resolves brand via slug + `get_portal_branding`; ensure `test-users.sql` brand id matches domain slug |
| Platform admin **Open** fails | Deploy `platform-portal-handoff`; see [platform-admin-portal-handoff.md](./platform-admin-portal-handoff.md) |
