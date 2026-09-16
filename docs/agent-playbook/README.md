# EduNudg Agent Playbook

Instructions for humans and AI agents working on EduNudg.

## Read first

1. [Definition of Done](./definition-of-done.md) — includes **artifact sync**
2. [Forbidden Patterns](./forbidden-patterns.md)
3. [Modular architecture](./modular-architecture.md) — theme, services, flags, one-feature-per-folder
4. [AGENTS.md](../../AGENTS.md) at repo root — roles, boundaries, escalation
5. [Spec index](../spec/README.md) — franchise/student journey FRs
6. Always-apply rules: `artifact-sync`, `agent-boundaries`, `git-publish-gate`, `marketing-homepage-media` in `.cursor/rules/`

## Frontend docs

- [Marketing landing pages](../frontend/marketing-landing.md) — platform / brand / center public `/` theme
- [Abacus Classic theme](../frontend/abacus-classic.md) — brand marketing theme variant
- [Spark Academy theme](../frontend/spark-academy.md) — Educat-style theme + shared lead modals
- [EduLearn theme](../frontend/edu-learn.md) — green/orange public layout + shared lead modals
- [UI shell standards](../spec/ui-shell-standards.md) — backend KPI grid, forms, accessibility

## Operations

- [Runbook](../ops/runbook.md) — local URLs (port 9000), git + Cursor push gates
- [Franchise center CSV / Excel import](../ops/franchise-center-csv-import.md)
- [Platform admin portal handoff](../ops/platform-admin-portal-handoff.md) — cross-host support login
- [Test users](../ops/test-users.md) — seeded accounts and troubleshooting

## Project stack

- **Frontend**: Vite + React + React Router (SPA)
- **Backend**: Supabase (Postgres, Auth, RLS, Storage, Edge Functions)
- **Deploy**: Vercel (static SPA + rewrites) via GitHub Actions CD
- **Local dev**: http://localhost:9000 (`pnpm dev`, port fixed via `--strictPort`)

## Change workflow (OpenSpec)

Behavioral specs and feature planning live in [`openspec/`](../../openspec/).

1. **Propose** — `/opsx:propose "your idea"` (or `openspec-propose` skill) before behavior-changing work
2. **Implement** — `/opsx:apply` + relevant `edunudg-*` skill
3. **Sync** — `edunudg-sync-artifacts` (specs, docs, tests, skills, agents)
4. **Archive** — `/opsx:archive` merges deltas into `openspec/specs/`

Skip OpenSpec for typos, refactors with zero behavior change, and dependency bumps. Required for new routes, RPC/RLS changes, and UAT fixes that change expected behavior. See [definition-of-done](./definition-of-done.md).

CLI: `pnpm openspec:update` refreshes Cursor slash commands. Requires Node.js ≥ 20.19.

## Skills (`.cursor/skills/`)

Use the skill matching your task before writing code. OpenSpec skills (`openspec-*`) handle planning; `edunudg-*` skills handle implementation. **`edunudg-sync-artifacts` is required before finish.**

## Guardrails

| Rule | Purpose |
|------|---------|
| `artifact-sync` | Specs + docs + tests + skills + agents stay in sync |
| `agent-boundaries` | Hard MAY / MUST NOT per Architect, Database, Frontend, QA |
| `git-publish-gate` | No commit/push unless the user explicitly asks; push requires green local CI |
| `marketing-homepage-media` | Never discard platform/brand/center `brand-assets` URLs or landing JSON |
| OpenSpec [`agent-artifact-sync`](../../openspec/specs/agent-artifact-sync/spec.md) | Behavioral requirements for the sync system |

Local CI mirror: `pnpm ci:local` (skill `edunudg-pre-push-ci` — **mandatory before every push**). Cursor: `.cursor/hooks/gate-git-push.sh` **denies** push without a green stamp; stop finish-gate fails turns that pushed without CI. Git backup: `.githooks/pre-push` (`pnpm hooks:install`).
Artifact sync is automatic — do not ask the user to approve docs/tests/skills updates.

## Phases

- **MVP (Phase 1)**: Platform, Brand, Center portals (Tiers 1–3)
- **Later**: Student quest portal, Parent cognitive radar, full AI copilot
