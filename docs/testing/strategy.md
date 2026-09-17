# Testing Strategy

## Pyramid

| Layer | Tool |
|-------|------|
| Unit | Vitest |
| Integration | Vitest + Supabase local |
| RLS | `supabase/tests/*.sql` |
| E2E | Playwright |

## UAT scenario IDs

Checklist IDs (`E2E-01`, `P-01`, `B-03`, `NEG-01`, …) live in [`uat-scenarios.md`](./uat-scenarios.md). Prefer tagging new tests with the ID in the `describe`/`test` title.

**Locked product rules for leads:** WhatsApp merge auto-reopens **lost** leads; **converted** re-apply is rejected. Learn portal asserts production routes (dashboard, progress, competitions, activity, profile).

## Playwright hosts (hybrid)

| Mode | How |
|------|-----|
| **CI / default** | `http://127.0.0.1:9000/…?portal=brand&brand=…` via `e2e/helpers/portal.ts` |
| **Local UAT** | `E2E_USE_LOCAL_HOSTS=1` → `{brand}.localhost:9000` subdomains |

Auth storage: `e2e/auth.setup.ts` → `e2e/.auth/*.json` (gitignored). Seed users: [`docs/ops/test-users.md`](../ops/test-users.md).

Golden paths **skip** when `VITE_SUPABASE_URL` / anon key are missing. Public lead **submit** specs (E2E-02 apply, E2E-03–07) also skip unless `get_brand_landing_public('abacusworld')` returns an active seed brand — a cloud project with anon keys but no `test-users.sql` otherwise fails with **Brand not found** / **Center not found**. OAuth (AUTH-08) and live Razorpay checkout (B-26 / C-25) are **manual-skip**. Stale SLA tests backdate via SQL (`e2e/helpers/sql.ts`) — never wait calendar days. **E2E-01** **hard-deletes** ephemeral `E2E Brand …` tenants after approve (`e2e/helpers/brandCleanup.ts` → `hardDeleteEphemeralE2EBrands` / `purge_ephemeral_e2e_brands`): removes matching brands, `brand_subscriptions` (so `/admin/subscriptions` stays clean), signups, and audit logs. SQL or platform RPC when `DATABASE_URL` is unset; UI soft-archive is last resort only. Manual wipe: [`scripts/purge-ephemeral-e2e-brand-subscriptions.sql`](../../scripts/purge-ephemeral-e2e-brand-subscriptions.sql). **E2E-03–08** create student leads with `makeE2ELeadFields` and hard-delete via `hardDeleteEphemeralE2ELeads` (SQL **or** platform/brand RPC when `DATABASE_URL` is unset) plus Playwright `globalTeardown`, so brand/center `/app/leads` stay clean. One-shot manual wipe: [`scripts/purge-ephemeral-e2e-leads.sql`](../../scripts/purge-ephemeral-e2e-leads.sql) (uses a TEMP TABLE — do not split `WITH doomed` across statements). Novu seed forms use **Phone** / **Preferred city**; modal themes use **WhatsApp number** / **City** (`e2e/helpers/leadModals.ts`). Public `/courses/:slug` e2e skips when the seed homepage has no course cards.

## Policy

Every feature and bug fix includes tests in the same PR.

### Critical regression suites

| Area | Test file(s) |
|------|----------------|
| Platform admin cross-portal handoff | `platformAdminPortalAccess.critical.test.tsx`, `AuthHandoffPage.test.tsx`, `portalHandoffUrl.test.ts` |
| Backend KPI theme (all staff dashboards) | `backendKpiTheme.test.tsx` |
| Brand portal login / tenant scope | `LoginPage.brandPortal.test.tsx`, `resolveTenantScope.test.ts` |
| Staff login accessible names | `LoginPage.test.tsx`, `exactAccessibleName.test.ts`, `e2e/platform-smoke.spec.ts` |
| Agent guardrails / artifact sync | `regression_agentGuardrails.test.ts` |
| E2E ephemeral brand matchers / cleanup | `e2eEphemeralBrand.test.ts`, `e2e/helpers/brandCleanup.ts` |
| E2E ephemeral student lead matchers / cleanup | `e2eEphemeralLead.test.ts`, `e2e/helpers/leadCleanup.ts` |
| Brand success stories page | `BrandSuccessStoriesPage.test.tsx` |
| Platform dashboard signup queries (PostgREST column names) | `platformDashboardApi.test.ts` |
| Workspace package type exports | `regression_workspacePackageExports.test.ts` |

## Local package tests

`pnpm test` runs `scripts/assert-workspace-test-bins.mjs` first. If `@edunudg/tenant` / `@edunudg/permissions` fail with `Cannot find module .../vitest/vitest.mjs`, the vitest symlink is broken — run **`pnpm install`** (incomplete `node_modules` after interrupted installs). Regression: `regression_workspaceVitestInstall.test.ts`.

### Playwright / Testing Library accessible names

Role name prefixes collide (`Log in` vs `Log in with Google`):

- **Playwright**: `{ name: "Log in", exact: true }`
- **Testing Library**: `{ name: exactAccessibleName("Log in") }` — **never** `{ exact: true }` (fails `tsc`)

See OpenSpec [`staff-login`](../../openspec/specs/staff-login/spec.md). Helper: `apps/web/src/test/exactAccessibleName.ts`.

## CI

- GitHub: `.github/workflows/ci.yml` — Node **24**, audit:schema, build, typecheck, test, test:rls, e2e
- Vitest **≥4** (workspace) — required for Node 24 + jsdom + React Router client navigations (AbortSignal/`undici` compatibility)
- Login portal tests that mount `RequireMembership` mock `@/lib/supabase` so center status does not hit the network
- Local mirror before push: **`pnpm ci:local`** (skill `edunudg-pre-push-ci` — mandatory; auto-fix, then push only when green). Cursor **`gate-git-push.sh` denies** push without a green stamp; **`.githooks/pre-push`** is backup (`pnpm hooks:install`).
- `@edunudg/web` `build` post-check is `scripts/assert-web-dist.mjs` (cross-platform) — not Unix `test -f` / `ls` (`regression_webBuildAssertsDistCrossPlatform`).

## Local dev

- `pnpm dev` → http://localhost:9000 (strict port, see `apps/web/vite.config.ts`)

Coverage: ≥80% on `packages/*`.
