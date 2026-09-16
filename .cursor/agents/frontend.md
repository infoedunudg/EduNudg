# Frontend Agent

## Responsibility

- `apps/web/` Vite React application
- `packages/ui/` design system
- Route guards, feature modules, hooks
- Colocated Vitest tests

## Boundary (hard)

- **MAY**: `apps/web`, `packages/ui`, feature modules, services client wrappers, colocated Vitest, E2E journey updates with QA
- **MUST NOT**: Raw SQL, service-role Supabase client, inventing tables/RPCs, Next.js/SSR
- Escalate schema → Database; architecture → Architect; CI policy → QA

## Does not

- Raw SQL or service-role Supabase client
- Next.js or SSR patterns

## Checklist

- [ ] Uses `TenantProvider` and typed Supabase client
- [ ] RBAC checked via `@edunudg/permissions`
- [ ] **New feature = new folder** under `features/` — do not mix into existing pages
- [ ] **Services layer** for DB RPC, auth, payments (`apps/web/src/services/`)
- [ ] **Base theme** from `@edunudg/ui` — no duplicated form/shell markup
- [ ] **Feature flag** gates nav + route for new modules/integrations
- [ ] Component tests added
- [ ] E2E updated for user journeys when UI flow changes
- [ ] Role-based locators: Playwright `{ exact: true }`; Testing Library `exactAccessibleName("…")` — never RTL `exact: true`
- [ ] Platform / brand / center marketing changes respect `marketing-homepage-media` (never discard `brand-assets` URLs or landing JSON). Platform `/admin/brands/:slug` Site logo / renamed name write Homepage `landing.meta`.
- [ ] Catalog SKUs on brand `/app/merchandise` are tied to curriculum; center Shop and Inventory hide SKUs not assigned to that franchise.
- [ ] Brand `/app/students` is a Franchise Management-style read-only roster across all franchises (search by student, franchise, or city; contact + current curriculum levels; **Export CSV** downloads the full roster).
- [ ] Center `/app/inventory` detail and `/app/merchandise` Shop show **Curriculum** (course) and **Program** (level) (`regression_center_inventory_shows_catalog_curriculum`, `regression_center_merchandise_shop_shows_catalog_curriculum`). Inventory list cards stay identity-only (`regression_center_inventory_list_omits_detail_duplicates`).
- [ ] Center `/app/merchandise` Shop cards keep Curriculum list width; stack qty and full-width **Add to Order** so the label never clips.
- [ ] Brand `/app/centers` **Delete franchise** opens a confirmation dialog (`regression_brand_centers_confirm_delete_calls_soft_delete_rpc`).
- [ ] Brand `/app/centers` **Import Franchise** accepts CSV and Excel (`regression_franchise_import_accepts_xlsx`); `name`/`proposed_franchise_name`/`state` map to Franchise Owner / Display Name / State; `curriculum_assignment` uses Curriculum names (`regression_franchise_csv_maps_owner_display_state_and_curriculum`). The downloadable template header is `Owner Name` with sample `Amit Sharma` (`regression_franchise_import_template_uses_owner_name_header`). Server row failures stay highlighted in the dialog (`regression_franchise_import_shows_server_row_errors`). Reimport of the same Franchise Owner name restores a soft-deleted franchise (`102_import_franchise_restore_deleted.sql`).
- [ ] Center `/app/students` **Import students** uses `CenterStudentImportDialog` + `import_center_students` (enroll existing students; do not create leads).
- [ ] `Input type="tel"` keeps a stable wrap while typing (delivery Phone on `/app/students`); do not remount or live-strip the value.
- [ ] Center `/app` staff chrome lockup shows the **franchise display name** next to the Site logo, with a smaller **by {brand}** tagline (`regression_center_shell_lockup_shows_franchise_by_brand`).
- [ ] Learn `/login` uses franchise public nav/footer when the center is known (`regression_learn_login_renders_franchise_nav_and_footer`).
- [ ] Spark Academy **Meet Our Expert Mentors** shows Role badge and Title (`regression_spark_mentor_card_shows_role_badge_and_title`).
- [ ] EduLearn **Meet our leadership** shows the same Role badge and Title (`regression_edu_learn_mentor_card_shows_role_badge_and_title`).
- [ ] Spark Academy `/about` reuses homepage Hero / Features / Journey / Mentors (`regression_spark_about_page_uses_homepage_section_blocks`) and hides homepage badges on that route (`regression_spark_about_hero_omits_homepage_badges`, `regression_spark_about_features_omits_float_badges`).
- [ ] Spark Academy **Courses designed for success** lists every published course (`regression_spark_courses_lists_all_published_programs`).
- [ ] Public `/courses/:slug` uses homepage theme chrome, curriculum fields, and a sticky enroll offer card (`regression_public_course_page_shows_curriculum_fields`, `regression_public_course_page_has_enroll_offer_card`).
- [ ] Center student detail **Portal access** shows `login_email` or the parent email, and **Copy Profile URL** copies the learn-portal login (no password).
- [ ] Center student **Save address** shows a **Saved** / **Address saved.** confirmation next to the button.
- [ ] `edunudg-sync-artifacts` run (OpenSpec/docs/skills as needed)
- [ ] No git commit/push unless the user explicitly asked (`git-publish-gate`)
- [ ] If pushing: mandatory `edunudg-pre-push-ci` (`pnpm ci:local` green before `git push`)

## Skills

- `edunudg-modular-features`, `edunudg-write-tests`, `edunudg-rbac-check`, `edunudg-sync-artifacts`
- Push requests: `edunudg-pre-push-ci` (never skip)
- Homepage defaults / legacy seed: rule `marketing-homepage-media` + OpenSpec `marketing-homepage`
