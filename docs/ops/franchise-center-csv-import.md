# Franchise center CSV / Excel import

Platform admins and brand staff bulk-onboard franchise centers from a CSV or Excel (`.xlsx` / `.xls`) file:

- **Platform** — **Platform → Brands → Edit** (`/admin/brands/:slug`) → Franchise centers → **Import Franchise**
- **Brand** — **Franchise Management** (`/app/centers`) → **Import Franchise**; **Export Franchise** downloads an `.xlsx` roster (`name` = Franchise Owner, `proposed_franchise_name` = Display Name, `state`, `curriculum_assignment`, plus a Curriculum sheet) as `{brandSlug}-franchises-{date}.xlsx`

Both surfaces use the same dialog, client validation, and RPC.

## Spec

Canonical behavior: [`openspec/specs/franchise-center-csv-import/spec.md`](../../openspec/specs/franchise-center-csv-import/spec.md).

## Flow

1. Download the Excel template (`Franchises` + `Curriculum` sheets). Headers: `Owner Name` (stored as Franchise Owner / `franchise_centers.name`; sample `Amit Sharma`), `city`, `proposed_franchise_name` (Display Name), `state`, `country` default `IN`, `address`, `pincode`, `mobile_number`, `owner_email`, `curriculum_assignment`. The franchise URL slug is created from **Owner Name**. CSV upload still works; a legacy `name` column is accepted.
2. Fill rows locally; SPA validates file type (`.csv`, `.xlsx`, `.xls`), size (≤ 2 MB). Excel uses the first worksheet. Empty `country` becomes `IN`. `Owner Name` (or `name`) → Franchise Owner, `proposed_franchise_name` → Display Name, `state` → State (`franchise_centers.region`), `mobile_number` → `contact_phone`. `curriculum_assignment` must match a Curriculum course name (semicolon-separated if several) and is applied after create. `short_description` is not imported or exported.
3. Preview valid vs invalid rows in the import dialog.
4. Confirm → RPC `import_franchise_centers(p_brand_id, p_rows)` provisions centers + hostnames. A row whose **name** matches an existing franchise (including a soft-deleted one) **overwrites** that center, clears `deleted_at`, and sets `status` to `active` (same id and URL).
5. If the server rejects rows, the dialog stays open with a highlighted error panel listing **Spreadsheet row N** and a plain-language reason (duplicate URL, limit, validation). Failed rows are marked in the preview table.
6. Platform audit log records `import_franchise_centers` for the brand.

## Security notes

- Prefer parameterized JSON rows via the RPC — do not build dynamic SQL from CSV cells.
- Client validation is UX only; the RPC enforces auth (`is_platform_admin()` or `has_brand_access(p_brand_id)`) and tenant scope.
- Center staff cannot create centers (`centers.create` is platform + brand owner/admin only).
- UI: `FranchiseCenterImportDialog` + helpers in `apps/web/src/lib/franchiseCenterImport*`.

## Tests

- Vitest: `FranchiseCenterImportDialog.test.tsx`, `franchiseCenterImportHelpers.test.ts` (`regression_franchise_import_shows_server_row_errors`, `regression_franchise_import_maps_server_errors_to_spreadsheet_rows`, `regression_franchise_import_template_uses_owner_name_header`)
- Brand detail regressions on `/admin/brands/:slug` including `regression_brand_detail_paginates_centers_and_domains`
- Brand Franchise Management regression: `regression_brand_centers_shows_franchise_csv_import`, `regression_brand_centers_exports_full_franchise_csv`, `regression_franchise_import_accepts_xlsx`

## Related

- [Platform brand onboarding journey](../journeys/platform-brand-onboarding.md)
- [Brand operator journey](../journeys/brand-operator.md)
- [OpenSpec platform-brand-onboarding](../../openspec/specs/platform-brand-onboarding/spec.md)
- [OpenSpec franchise-center-management](../../openspec/specs/franchise-center-management/spec.md)
