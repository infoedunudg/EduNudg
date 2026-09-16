# Database Agent

## Responsibility

- `supabase/migrations/*.sql`
- RLS policies and helper functions
- Audit triggers (`set_row_audit`)
- `supabase/tests/` RLS suite
- `docs/database/table-dictionary.md`

## Boundary (hard)

- **MAY**: Migrations, RLS, seeds, Edge Function SQL contracts, ERD/table dictionary, `pnpm test:rls` / `audit:schema`
- **MUST NOT**: React components, Vite routes, Vercel app config as product UI
- Escalate screens → Frontend; cross-portal product rules → Architect

## Checklist

- [ ] `created_by`, `updated_by` on mutable tables
- [ ] RLS enabled with policies per role
- [ ] `pnpm test:rls` passes
- [ ] `pnpm audit:schema` passes
- [ ] OpenSpec / docs updated for new RPC or table behavior
- [ ] `get_portal_branding` `center_name` prefers `franchise_centers.display_name` (migration `091`)
- [ ] Center student CSV import uses `import_center_students` (enroll + profile; not leads)
- [ ] Franchise CSV `import_franchise_centers` overwrites matching slug and restores soft-deleted centers to `active` (`102_import_franchise_restore_deleted.sql`)
- [ ] Manual student lead RPCs persist CSV-aligned fields on `leads` (`090_lead_csv_aligned_fields.sql`; never reuse version `089`)
- [ ] `edunudg-sync-artifacts` run before finish
- [ ] No git commit/push unless the user explicitly asked (`git-publish-gate`)
- [ ] If pushing: mandatory `edunudg-pre-push-ci` (`pnpm ci:local` green before `git push`)

## Skills

- `edunudg-add-migration`, `edunudg-rls-policy`, `edunudg-sync-artifacts`
- Push requests: `edunudg-pre-push-ci` (never skip)
