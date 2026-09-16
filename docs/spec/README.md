# Specification index

Authoritative docs for franchise/student journey v1. Plan: [franchise_student_journey_spec](/.cursor/plans/franchise_student_journey_spec_27f6ef6a.plan.md).

## What lives where

| Content type | Location | Notes |
|--------------|----------|-------|
| **Behavioral requirements** (what the system should do) | [`openspec/specs/`](../../openspec/specs/) | GIVEN/WHEN/THEN scenarios; edit here when behavior changes |
| **Active feature work** | [`openspec/changes/`](../../openspec/changes/) | Proposals, design, tasks, delta specs until archived |
| **API / schema reference** | This folder + [`../database/`](../database/) | RPC catalog, data-flow, ERD, table dictionary |
| **How to build safely** | [`../agent-playbook/`](../agent-playbook/), `.cursor/rules/`, `edunudg-*` skills | DoD, tenant safety, migrations |
| **Ops / runbooks** | [`../ops/`](../ops/) | Local URLs, handoff, test users |

[`functional-requirements.md`](./functional-requirements.md) is a **traceability index** (FR IDs); canonical behavior lives in `openspec/specs/`.

## Reference documents

| Document | Purpose |
|----------|---------|
| [portal-host-matrix.md](./portal-host-matrix.md) | What runs on each hostname |
| [navigation-spec.md](./navigation-spec.md) | Left sidebar menus per portal |
| [data-flow.md](./data-flow.md) | Records between platform / brand / center / student |
| [functional-requirements.md](./functional-requirements.md) | FR ID index → links to `openspec/specs/` |
| OpenSpec behavioral specs | [`openspec/specs/`](../../openspec/specs/) | GIVEN/WHEN/THEN requirements; supersedes FR tables over time |
| [staff-login](../../openspec/specs/staff-login/spec.md) | Platform/brand/center `/login` labels + exact accessible-name testing |
| [marketing-homepage](../../openspec/specs/marketing-homepage/spec.md) | Platform public bundle vs config-only React Query keys; brand Homepage vs Center Site Configuration; pricing ticks use CSS Unicode escape U+2713 |
| [public-seo](../../openspec/specs/public-seo/spec.md) | Automatic SEO/AEO/GEO for public pages: derived title/canonical/JSON-LD, robots/sitemap/llms, first-HTML injection |
| [marketing-footer](../../openspec/specs/marketing-footer/spec.md) | Public footer columns + legal pages; Spark has no newsletter CTA |
| [brand-upcoming-events](../../openspec/specs/brand-upcoming-events/spec.md) | Homepage upcoming events (competitions/workshops/demos) |
| [platform-settings](../../openspec/specs/platform-settings/spec.md) | Platform settings / feature flags |
| [platform-brand-onboarding](../../openspec/specs/platform-brand-onboarding/spec.md) | Brand signup approve + credential-skip on theme save |
| [student-leads](../../openspec/specs/student-leads/spec.md) | Brand/center student leads + Abacus/Spark modals; center `/app/leads` Curriculum chrome |
| [center-students-workspace](../../openspec/specs/center-students-workspace/spec.md) | Center `/app/students` pipeline chrome (Linked / Unassigned / Programs / Total) |
| [center-student-csv-import](../../openspec/specs/center-student-csv-import/spec.md) | Center `/app/students` CSV bulk enroll (template + `import_center_students`) |
| [center-fees-workspace](../../openspec/specs/center-fees-workspace/spec.md) | Center `/app/fees` pipeline chrome (Outstanding / Paid / Overdue / Total) |
| [center-inventory-workspace](../../openspec/specs/center-inventory-workspace/spec.md) | Center `/app/inventory` pipeline chrome; stock limited to SKUs tied to assigned curriculum |
| [franchise-applications](../../openspec/specs/franchise-applications/spec.md) | Franchise apply + approve provision |
| [franchise-center-management](../../openspec/specs/franchise-center-management/spec.md) | Brand `/app/centers` workspace (Import / Export Franchise; Delete franchise popup) |
| [brand-students-workspace](../../openspec/specs/brand-students-workspace/spec.md) | Brand `/app/students` all-franchise roster (contact + curriculum levels; Export CSV) |
| [franchise-center-csv-import](../../openspec/specs/franchise-center-csv-import/spec.md) | Platform and brand CSV/Excel bulk center import |
| [brand-curriculum-workspace](../../openspec/specs/brand-curriculum-workspace/spec.md) | Brand `/app/curriculum` courses/levels/units; on/off toggle; mobile **Edit course** overlay matches desktop controls; parent marketing stays editable after create; Spark public courses use published syllabus |
| [brand-batches-feature-flag](../../openspec/specs/brand-batches-feature-flag/spec.md) | Per-brand Batches module gate |
| [brand-dashboard](../../openspec/specs/brand-dashboard/spec.md) | Brand `/app` Today at a glance; Center Health is six equal checks (curriculum / feedback / students / franchises / homepage / franchise site) |
| [brand-success-stories](../../openspec/specs/brand-success-stories/spec.md) | Brand `/app/success-stories` pipeline CRUD; published rows feed brand **and** franchise testimonials (hidden when none) |
| [brand-merchandise](../../openspec/specs/brand-merchandise/spec.md) | Brand `/app/merchandise` pipeline chrome; catalog tied to courses/levels; center shop/inventory filtered by assigned courses |
| [student-learn-portal](../../openspec/specs/student-learn-portal/spec.md) | Learn host enrollment-gated portal |
| [agent-artifact-sync](../../openspec/specs/agent-artifact-sync/spec.md) | Mandatory sync of specs/docs/tests/skills/agents; agent boundaries |
| [rpc-catalog.md](./rpc-catalog.md) | Supabase RPC signatures |
| [data-model-extensions.md](./data-model-extensions.md) | Migration 016+ tables/columns |
| [technical-architecture.md](./technical-architecture.md) | Stack, timezone, security |
| [ui-shell-standards.md](./ui-shell-standards.md) | Responsive app layout, compact backend KPIs |
| [../dashboards/kpi-spec.md](../dashboards/kpi-spec.md) | Dashboard metrics by portal |
| [../ops/platform-admin-portal-handoff.md](../ops/platform-admin-portal-handoff.md) | Platform admin cross-portal sign-in |
| [services-layer.md](./services-layer.md) | Auth, DB, payments, integrations as services |
| [feature-flags.md](./feature-flags.md) | Module/integration ON/OFF |
| [merchandise.md](./merchandise.md) | Catalog, photos, center shop, orders, payments |
| [competitions.md](./competitions.md) | Brand events, question bank, student quiz |
| [manual-leads.md](./manual-leads.md) | Staff manual lead / signup entry by portal |

## Journeys

- [platform-brand-onboarding.md](../journeys/platform-brand-onboarding.md)
- [franchise-owner.md](../journeys/franchise-owner.md)
- [prospective-student.md](../journeys/prospective-student.md)
- [brand-operator.md](../journeys/brand-operator.md)
- [student-learn-portal.md](../journeys/student-learn-portal.md)
- [center-enrollment.md](../journeys/center-enrollment.md) — legacy; superseded by prospective-student for v1
