# Franchise center CSV / Excel import

Platform admins and brand staff bulk-onboard franchise centers from a CSV or Excel (`.xlsx` / `.xls`) file:

- **Platform** — **Platform → Brands → Edit** (`/admin/brands/:slug`) → Franchise centers → **Import Franchise**
- **Brand** — **Franchise Management** (`/app/centers`) → **Import Franchise**; **Export Franchise** downloads an `.xlsx` roster (`name` = Franchise Owner, `proposed_franchise_name` = Display Name, `state`, `curriculum_assignment`, plus a Curriculum sheet) as `{brandSlug}-franchises-{date}.xlsx`

Both surfaces use the same dialog, client validation, and RPC.

## Spec

Canonical behavior: [`openspec/specs/franchise-center-csv-import/spec.md`](../../openspec/specs/franchise-center-csv-import/spec.md).

## Flow

1. Download the Excel template (`Franchises` + `Curriculum` sheets). Headers: `Owner Name` (stored as Franchise Owner / `franchise_centers.name`; sample `Amit Sharma`), `city`, `proposed_franchise_name` (Display Name), `state`, `country` default `IN`, `address`, `pincode`, `mobile_number`, `owner_email`, `curriculum_assignment`. The franchise URL slug is created from **Owner Name**. CSV upload still works; a legacy `name` column is accepted.
2. Fill rows locally; SPA validates file type (`.csv`, `.xlsx`, `.xls`), size (≤ 2 MB). Excel uses the first worksheet. Empty `country` becomes `IN`. `Owner Name` (or `name`) → Franchise Owner, `proposed_franchise_name` → Display Name, `state` → State (`franchise_centers.region`), `mobile_number` → `contact_phone`. `curriculum_assignment` must match a Curriculum course name (semicolon-separated if several) and is applied after create. `short_description` is not imported or exported. Spreadsheet parsing uses SheetJS `xlsx` (community); keep uploads trusted/staff-only and within the 2 MB cap — npm has no free patched release for known SheetJS CVEs.
3. Preview valid vs invalid rows in the import dialog.
4. Confirm → RPC `import_franchise_centers(p_brand_id, p_rows)` provisions centers + hostnames. A row whose **name** matches an existing franchise (including a soft-deleted one) **overwrites** that center, clears `deleted_at`, and sets `status` to `active` (same id and URL).
5. For each successful row with `owner_email`, `center-owner-credentials` creates or updates backend access. The shared initial password is the lowercase brand name as one alphanumeric word plus `@123` (`Smart Brain Abacus` → `smartbrainabacus@123`). A restored franchise without a CSV email reuses its existing owner login when available.
6. The completion view stays open and displays the default password, provisioned login count, and rows skipped because no owner email exists.
7. If the server rejects rows, the dialog stays open with a highlighted error panel listing **Spreadsheet row N** and a plain-language reason (duplicate URL, limit, validation). Failed rows are marked in the preview table.
8. Platform audit log records `import_franchise_centers` for the brand.

## Existing-franchise password backfill

The script uses a platform-admin session and the deployed `center-owner-credentials` Edge Function. It does not use or expose a service-role key.

```bash
# Preview only
PLATFORM_ADMIN_EMAIL=admin@edunudg.com \
PLATFORM_ADMIN_PASSWORD='your-platform-password' \
pnpm franchises:set-default-passwords

# Apply password changes
PLATFORM_ADMIN_EMAIL=admin@edunudg.com \
PLATFORM_ADMIN_PASSWORD='your-platform-password' \
pnpm franchises:set-default-passwords -- --apply
```

The script reads Supabase URL and anon key from `apps/web/.env`, skips franchises without `owner_email`, and skips one Auth email shared across multiple brands because a single user cannot hold different brand-derived passwords.

## Security notes

- Prefer parameterized JSON rows via the RPC — do not build dynamic SQL from CSV cells.
- Client validation is UX only; the RPC enforces auth (`is_platform_admin()` or `has_brand_access(p_brand_id)`) and tenant scope.
- Center staff cannot create centers (`centers.create` is platform + brand owner/admin only).
- This password is predictable and shared by every franchise under a brand. Treat it as an initial password only, share it out-of-band, and change each franchise password under **Franchise Identity** after first login.
- UI: `FranchiseCenterImportDialog` + helpers in `apps/web/src/lib/franchiseCenterImport*`.

## Tests

- Vitest: `FranchiseCenterImportDialog.test.tsx`, `franchiseCenterImportHelpers.test.ts` (`regression_franchise_import_shows_server_row_errors`, `regression_franchise_import_maps_server_errors_to_spreadsheet_rows`, `regression_franchise_import_template_uses_owner_name_header`, `regression_imported_franchises_receive_brand_default_password`, `regression_brand_name_builds_shared_franchise_default_password`)
- Brand detail regressions on `/admin/brands/:slug` including `regression_brand_detail_paginates_centers_and_domains`
- Brand Franchise Management regression: `regression_brand_centers_shows_franchise_csv_import`, `regression_brand_centers_exports_full_franchise_csv`, `regression_franchise_import_accepts_xlsx`

## Related

- [Platform brand onboarding journey](../journeys/platform-brand-onboarding.md)
- [Brand operator journey](../journeys/brand-operator.md)
- [OpenSpec platform-brand-onboarding](../../openspec/specs/platform-brand-onboarding/spec.md)
- [OpenSpec franchise-center-management](../../openspec/specs/franchise-center-management/spec.md)
