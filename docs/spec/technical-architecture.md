# Technical architecture

## Stack

- **Frontend:** Vite + React SPA (`apps/web`), React Router, TanStack Query
- **Backend:** Supabase Postgres + RLS + RPC; Storage buckets for brand assets
- **Auth:** Supabase Auth (email/password, Google); WhatsApp OTP Phase D for students
- **Forbidden:** Next.js, service role in browser

## Tenant resolution

1. Hostname → `domain_mappings` → `portalType`: `platform` | `brand` | `center` | `learn` | `parents`
2. Expose `portalMode` to marketing: `platform` | `brand` | `center` (not slug booleans alone)
3. Staff routes: `/admin` (platform), `/app` (brand/center)

## Timezone (FR-X01)

| Layer | Rule |
|-------|------|
| Database | `timestamptz` stored UTC |
| Default | **`Asia/Kolkata`** for all brands unless `brand_settings.timezone` set |
| Platform admin UI | Platform settings default IST |
| SLA | `lead_stale_days` + assign timestamp interpreted in **brand timezone** |
| Display | Format dates in UI using brand/platform TZ setting |

## Auth & sessions

- Brand/center staff: Google + email on `/login`
- Primary submit accessible name is exactly **`Log in`**; OAuth buttons use **`Log in with {Provider}`** — Playwright tests use `{ exact: true }`; Vitest/Testing Library uses `exactAccessibleName` / `/^…$/` (not `exact: true`) — see `openspec/specs/staff-login/spec.md`
- Session length: configure Supabase JWT/refresh for ~7 days; fix “Remember me” conflated with email storage
- **Phase C:** `RequireMembership` — session user must have active membership for resolved brand/center

## Security

- RLS on all tenant tables; storage policies per bucket
- Public writes only through RPC
- `has_brand_access`, `has_center_access`, `is_platform_admin` helpers (`user_brand_ids` excludes center-scoped memberships; see `107_center_staff_tenant_scope.sql`)

## Branding & brand-assets storage

Public bucket: **`brand-assets`** (migration `015_brand_assets_storage.sql`). RLS: brand staff with `has_brand_access(brand_id)` manage objects under `{brand_id}/…`; anon/authenticated read.

| Asset | DB field / table | Object path |
|-------|------------------|-------------|
| Brand logo | Homepage **Site logo** (`landing.meta.logoUrl`); platform `/admin/brands/:slug` writes the same JSON; synced to `brands.logo_url` | `{brand_id}/marketing/…` (editor upload) or `{brand_id}/logo.{ext}` (platform / legacy) |
| Merchandise product photo (×5 per SKU) | `merchandise_catalog.photo_urls` | `{brand_id}/merchandise/{catalog_item_id}/photo-{1-5}.{ext}` |
| Marketing videos | editor config | under `{brand_id}/…` (see runbook) |

| Host | Nav logo |
|------|----------|
| Brand public | `landing.meta.logoUrl` (homepage Site logo); fallback `brands.logo_url` |
| Center public | Same brand logo; center facts from DB text fields |
| Platform | EduNudg marketing assets |

## Subscription billing

- `brand_subscriptions` links brand to `subscription_plans`
- Does **not** disable brand public forms
- Optional billing banner on brand `/app` if overdue

## Modular architecture

- **Theme:** `@edunudg/ui` — [ui-shell-standards.md](./ui-shell-standards.md)
- **Services:** [services-layer.md](./services-layer.md) — auth, payments, integrations
- **Feature modules:** one folder per capability under `apps/web/src/features/`
- **Flags:** [feature-flags.md](./feature-flags.md)
- **Agents:** [modular-architecture.md](../agent-playbook/modular-architecture.md)

## Brand subscription payment

Brand portal `/app/billing` → payment gateway service → Edge webhook → RPC updates `platform_invoices` and subscription period. Franchise never uses this flow.

## Phased delivery

| Phase | Scope |
|-------|--------|
| A | Migration 016, RPCs, platform signup approve, timezone/SLA settings |
| B | Brand public dual forms, `/app/leads`, `/app/franchise-applications` |
| C | Center public registration, `/app/leads` / `/app/students` / `/app/fees` / `/app/inventory` / `/app/merchandise` Curriculum pipeline chrome, convert, membership gate |
| D | Student learn minimal nav; kits; fees matrix |
| E | Campaigns; RPC-only hardening |

## Related

- [Portal host matrix](./portal-host-matrix.md)
- [Data flow](./data-flow.md)
- [Navigation spec](./navigation-spec.md)
