# Smart Brain Abacus — demo URLs

Bookmark sheet for client demos on **Vercel** (`https://edunudg-hub.vercel.app`).

| Constant | Value |
|----------|-------|
| Production base | `https://edunudg-hub.vercel.app` |
| Brand slug | `smart-brain-abacus` |
| Portal suffix | `?portal=brand&brand=smart-brain-abacus` |

On `*.vercel.app` (same-origin mode), every brand/center/learn URL needs `portal` and `brand` query params. The path (`/`, `/login`, `/app`) comes **before** the `?`. Staff auth bounces (`RequireAuth` / `RequireMembership`) MUST keep those params (or restore the sticky portal override) — bare `/login` on a Preview host drops center context and signs franchise owners out. Regressions: `regression_login_redirect_keeps_portal_query_from_search`, `regression_login_redirect_restores_sticky_center_portal_when_search_empty`, `regression_no_membership_redirect_keeps_center_portal_query`.

**Wrong:** `...?brand=smart-brain-abacus/login` — `/login` becomes part of the slug.  
**Right:** `.../login?portal=brand&brand=smart-brain-abacus`

Franchise **Student Login** and **Copy Profile URL** use `learnPortalLoginUrl` → `/login?portal=learn&brand=smart-brain-abacus&center={center}` (path before `?`; never append `/login` after the query). Regression: `regression_vercel_student_login_uses_path_before_portal_query`. Learn `/login` loads that franchise’s public nav/footer from the center slug (`regression_learn_login_renders_franchise_nav_and_footer`).

See also: [platform-admin-portal-handoff.md](./platform-admin-portal-handoff.md), [test-users.md](./test-users.md), [runbook.md](./runbook.md).

---

## Platform admin (you)

No `?portal=` params — platform host only.

| Purpose | URL |
|---------|-----|
| Platform login | https://edunudg-hub.vercel.app/login |
| Admin home | https://edunudg-hub.vercel.app/admin |
| All brands | https://edunudg-hub.vercel.app/admin/brands |
| Smart Brain Abacus detail | https://edunudg-hub.vercel.app/admin/brands/smart-brain-abacus |

**Seeded login:** `admin@edunudg.com` / `admin1` (when `test-users.sql` applied).

**Demo buttons (prefer these over typing URLs):**

- **View Frontend** → public brand homepage
- **Brand backend** → platform-admin handoff → brand `/app` signed in

---

## Brand public website

| Purpose | URL |
|---------|-----|
| Homepage | https://edunudg-hub.vercel.app/?portal=brand&brand=smart-brain-abacus |
| Terms | https://edunudg-hub.vercel.app/legal/terms?portal=brand&brand=smart-brain-abacus |
| Privacy | https://edunudg-hub.vercel.app/legal/privacy?portal=brand&brand=smart-brain-abacus |

From the homepage, **Partner login** in nav/footer goes to `/login` in the same tab (portal context stored in `sessionStorage`).

---

## Brand login and access

| Purpose | URL |
|---------|-----|
| Brand owner login | https://edunudg-hub.vercel.app/login?portal=brand&brand=smart-brain-abacus |
| Brand staff app | https://edunudg-hub.vercel.app/app?portal=brand&brand=smart-brain-abacus |
| Platform admin handoff | Use **Brand backend** on admin Brands list (opens `/auth/handoff?...&next=/app`) |

**Before demo:** Platform → Brands → Edit → set **Login email** and **Password** for the franchisor (`brand-owner-credentials` Edge Function must be deployed).

---

## Brand backend (`/app`)

Append `?portal=brand&brand=smart-brain-abacus` to each path.

| Screen | URL |
|--------|-----|
| Dashboard | https://edunudg-hub.vercel.app/app?portal=brand&brand=smart-brain-abacus |
| Franchise centers | https://edunudg-hub.vercel.app/app/centers?portal=brand&brand=smart-brain-abacus |
| Students | https://edunudg-hub.vercel.app/app/students?portal=brand&brand=smart-brain-abacus |
| Center detail | https://edunudg-hub.vercel.app/app/centers/{center-slug}?portal=brand&brand=smart-brain-abacus |
| Student leads | https://edunudg-hub.vercel.app/app/leads?portal=brand&brand=smart-brain-abacus |
| Franchise applications | https://edunudg-hub.vercel.app/app/franchise-applications?portal=brand&brand=smart-brain-abacus |
| Curriculum | https://edunudg-hub.vercel.app/app/curriculum?portal=brand&brand=smart-brain-abacus |
| Analytics | https://edunudg-hub.vercel.app/app/analytics?portal=brand&brand=smart-brain-abacus |
| Success stories | https://edunudg-hub.vercel.app/app/success-stories?portal=brand&brand=smart-brain-abacus |
| Homepage editor | https://edunudg-hub.vercel.app/app/homepage?portal=brand&brand=smart-brain-abacus |
| Brand settings | https://edunudg-hub.vercel.app/app/settings?portal=brand&brand=smart-brain-abacus |
| Billing | https://edunudg-hub.vercel.app/app/billing?portal=brand&brand=smart-brain-abacus |
| Campaigns | https://edunudg-hub.vercel.app/app/campaigns?portal=brand&brand=smart-brain-abacus |
| Merchandise | https://edunudg-hub.vercel.app/app/merchandise?portal=brand&brand=smart-brain-abacus |

Replace `{center-slug}` with the slug from **Franchise centers** after you create a center.

---

## Center URLs (if centers exist under this brand)

Seed data includes the brand only — no default center. Create centers in the brand app first, then use these patterns.

| Purpose | URL |
|---------|-----|
| Center public site | https://edunudg-hub.vercel.app/?portal=center&brand=smart-brain-abacus&center={center-slug} |
| Center login | https://edunudg-hub.vercel.app/login?portal=center&brand=smart-brain-abacus&center={center-slug} |
| Center staff app (backend) | https://edunudg-hub.vercel.app/app?portal=center&brand=smart-brain-abacus&center={center-slug} |
| Center leads | https://edunudg-hub.vercel.app/app/leads?portal=center&brand=smart-brain-abacus&center={center-slug} |
| Center students | https://edunudg-hub.vercel.app/app/students?portal=center&brand=smart-brain-abacus&center={center-slug} |
| Center settings | https://edunudg-hub.vercel.app/app/settings?portal=center&brand=smart-brain-abacus&center={center-slug} |

**Do not use** `{center}.smart-brain-abacus.localhost:9000/login` on Vercel — that host only works in local `/etc/hosts` + `pnpm dev`. Franchise Identity now links the environment-aware `portalLoginUrl` (same-origin query params on `*.vercel.app`).

---

## Student / parent portals (if configured)

| Purpose | URL |
|---------|-----|
| Student portal home | https://edunudg-hub.vercel.app/?portal=learn&brand=smart-brain-abacus |
| Student login | https://edunudg-hub.vercel.app/login?portal=learn&brand=smart-brain-abacus&center={center-slug} |
| Parent portal | https://edunudg-hub.vercel.app/?portal=parents&brand=smart-brain-abacus |

---

## Local dev equivalents

| Purpose | URL |
|---------|-----|
| Public homepage | http://smart-brain-abacus.localhost:9000/ |
| Brand login | http://smart-brain-abacus.localhost:9000/login |
| Brand app | http://smart-brain-abacus.localhost:9000/app |
| Student learn | http://learn.smart-brain-abacus.localhost:9000/ |
| Platform admin brand detail | http://localhost:9000/admin/brands/smart-brain-abacus |

Local uses subdomain routing — no `?portal=` params required. Re-seed (or ensure `learn.smart-brain-abacus.localhost` in `domain_mappings`) so learn resolves `brandId`; SPA also fills `brandId` via `get_portal_branding` for learn/parents.

---

## Top 5 bookmarks (copy/paste)

```
https://edunudg-hub.vercel.app/admin/brands/smart-brain-abacus
https://edunudg-hub.vercel.app/?portal=brand&brand=smart-brain-abacus
https://edunudg-hub.vercel.app/login?portal=brand&brand=smart-brain-abacus
https://edunudg-hub.vercel.app/app?portal=brand&brand=smart-brain-abacus
https://edunudg-hub.vercel.app/app/homepage?portal=brand&brand=smart-brain-abacus
```

---

## Suggested 10–15 minute demo flow

1. Admin brand detail → show KPIs and settings.
2. **View Frontend** → public Abacus Classic landing page.
3. Brand owner login → `/app` → centers, homepage editor.
4. Back to admin → **Brand backend** → platform support access without brand password.
5. (Optional) Center URLs if a franchise center exists in production.

---

## Pre-demo checklist

1. Supabase Auth redirect URLs include `https://edunudg-hub.vercel.app/**`
2. Edge functions deployed: `platform-portal-handoff`, `brand-owner-credentials`, `center-owner-credentials`
3. Brand owner login email + password set on brand detail
4. Browser bookmarks loaded (top 5 above)
5. Use admin **View Frontend** / **Brand backend** buttons — avoid manual URL edits in the address bar
