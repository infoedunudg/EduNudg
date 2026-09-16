# franchise-center-csv-import Specification

## Purpose

Platform admins and brand staff (owner/admin) bulk-onboard franchise centers for a brand from a CSV or Excel template, provisioning center records and center portal hostnames safely. Platform UI is `/admin/brands/:slug`; brand UI is `/app/centers`.

## Related

- Platform brand onboarding: `openspec/specs/platform-brand-onboarding/spec.md`
- Franchise center management: `openspec/specs/franchise-center-management/spec.md`
- Franchise inquiry approval (single-center path): `approve_franchise_inquiry` RPC
- Platform data export center columns: `apps/web/src/lib/platformDataExportHelpers.ts`

## Requirements

### Requirement: CSV template download

Platform admins and brand staff SHALL download a franchise center import template from the import dialog.

#### Scenario: Download template

- **GIVEN** platform admin is on `/admin/brands/:slug` or brand staff is on `/app/centers`
- **WHEN** they open **Import Franchise** and click **Download template**
- **THEN** the browser downloads an Excel workbook (`.xlsx`) with a `Franchises` sheet and a `Curriculum` sheet
- **AND** Franchises headers include `Owner Name` (stored as `franchise_centers.name`), `city`, `proposed_franchise_name` (Display Name), `state`, `country`, `address`, `pincode`, `mobile_number`, `owner_email`, and `curriculum_assignment`
- **AND** the sample `Owner Name` cell is `Amit Sharma`
- **AND** the `country` sample cell is `IN`
- **AND** `Curriculum` lists the brand’s course names for the `curriculum_assignment` dropdown
- **AND** the template SHALL NOT include `center_slug`, `display_name`, `contact_phone`, `region`, or `short_description`

#### Scenario: Map spreadsheet columns to stored fields

- **WHEN** a file uses `Owner Name` (or legacy `name`), `proposed_franchise_name`, and `state`
- **THEN** those values are stored as `franchise_centers.name` (Franchise Owner), `display_name` (Display Name), and `region` (State)
- **AND** `mobile_number` is stored as `contact_phone`
- **AND** a blank `country` is stored as `IN`
- **AND** `curriculum_assignment` matches Curriculum course names and is applied via `sync_center_program_enablement` after create
- **AND** `short_description` is not written from the spreadsheet
- **AND** regression `regression_franchise_csv_maps_owner_display_state_and_curriculum` stays green
- **AND** regression `regression_franchise_import_template_uses_owner_name_header` stays green

### Requirement: Auto-generated center URL

The system SHALL create `franchise_centers.slug` from the franchise **name** (slugified). Callers SHALL NOT be required to supply `center_slug`.

#### Scenario: Slug from name

- **GIVEN** a CSV row with name `Andheri West` and city `Mumbai`
- **WHEN** the row is imported
- **THEN** the stored slug is `andheri-west`
- **AND** the center hostname is `{slug}.{brand_slug}.localhost`

#### Scenario: Unique suffix on collision

- **WHEN** two rows in the same file share a name, or the derived slug is already used by a row processed earlier in the import
- **THEN** the later row stores `andheri-west-2` (then `-3`, …)
- **AND** does not ask the user to type a slug

#### Scenario: Reimport restores a deleted franchise

- **GIVEN** a franchise whose slug was derived from name `Andheri West` was soft-deleted
- **WHEN** the same spreadsheet row (`name` + other fields) is imported again
- **THEN** that existing `franchise_centers` row is overwritten (city, address, phone, display name, …)
- **AND** `deleted_at` is cleared and `status` becomes `active`
- **AND** the existing center id and URL slug are reused (no duplicate hostname)
- **AND** student and lead rows on that center remain
- **AND** a live franchise with the same derived slug is also overwritten and set `active`

#### Scenario: Legacy CSV with center_slug column

- **WHEN** an older file still includes a `center_slug` column
- **THEN** that column is ignored
- **AND** the slug is still derived from `name`

### Requirement: Client-side spreadsheet validation

The SPA SHALL parse CSV and Excel (`.xlsx` / `.xls`) files locally, enforce limits, and preview rows before import. The first worksheet is used for Excel files. Student and lead imports remain CSV-only.

#### Scenario: Reject invalid file type

- **WHEN** the user selects a file that is not `.csv`, `.xlsx`, or `.xls`, or a file larger than 2 MB
- **THEN** the UI shows an error and does not call the server

#### Scenario: Accept Excel workbook

- **WHEN** the user selects a valid `.xlsx` or `.xls` file whose first sheet has `name` and `city` columns
- **THEN** the UI shows the same preview table as CSV
- **AND** only rows without client validation errors are eligible for import
- **AND** regression `regression_franchise_import_accepts_xlsx` stays green

#### Scenario: Reject binary content in CSV

- **WHEN** the selected `.csv` file contains null bytes in the first 8 KB
- **THEN** the UI rejects it as binary and does not call the server

#### Scenario: Preview valid and invalid rows

- **WHEN** the user selects a valid CSV with required columns
- **THEN** the UI shows a preview table with per-row validation errors
- **AND** only rows without client validation errors are eligible for import

#### Scenario: Sanitize formula injection

- **WHEN** a cell begins with `=`, `+`, `-`, `@`, or tab
- **THEN** the client neutralizes the leading character before validation and RPC submission

### Requirement: Secure bulk import RPC

The system SHALL create franchise centers via `import_franchise_centers(p_brand_id, p_rows)` using parameterized JSON rows only.

#### Scenario: Authorized import

- **GIVEN** caller is platform admin or has brand access for `p_brand_id` (`brand_owner` / `brand_admin`)
- **WHEN** valid rows are submitted
- **THEN** each row inserts or overwrites an `active` `franchise_centers` record with slug derived from name
- **AND** matching soft-deleted centers are restored instead of inserting a duplicate slug
- **AND** inserts or reuses a primary `domain_mappings` row with hostname `{derived_slug}.{brand_slug}.localhost` and `portal_type = center`
- **AND** optionally inserts a `center_owner` membership invite when `owner_email` matches an auth user

#### Scenario: Reject unauthorized caller

- **WHEN** caller lacks platform admin and brand access
- **THEN** the RPC raises `Not authorized`

#### Scenario: Reject SQL injection payloads

- **WHEN** row text contains SQL metacharacters or script tags
- **THEN** values are stored as plain text via bound parameters
- **AND** no dynamic SQL is constructed from user input

#### Scenario: Enforce subscription center limit

- **WHEN** `brand_settings.features.max_franchise_centers` would be exceeded
- **THEN** remaining rows fail with `Brand franchise center limit reached`

#### Scenario: Partial success

- **WHEN** some rows fail validation or hit duplicate slugs
- **THEN** valid rows are still created
- **AND** the RPC returns `{ created: [...], errors: [...] }`
- **AND** the import dialog stays open, highlights failed spreadsheet rows, and lists each RPC error (mapped from submitted-row index to CSV/Excel line number)
- **AND** regression `regression_franchise_import_shows_server_row_errors` stays green

#### Scenario: Audit successful import

- **WHEN** at least one center is created
- **THEN** `log_platform_audit` records `import_franchise_centers` for the brand

### Requirement: Import UI on brand detail

Platform admins SHALL import centers from the Franchise centers card on `/admin/brands/:slug`.

#### Scenario: Open import dialog

- **WHEN** platform admin clicks **Import Franchise** on the Franchise centers card
- **THEN** a modal opens with template download, file picker, preview, and import action

#### Scenario: Refresh list after import

- **WHEN** import creates one or more centers
- **THEN** the Franchise centers list and domain mappings refresh without a full page reload

### Requirement: Import UI on brand franchise management

Brand staff with `centers.create` (`brand_owner`, `brand_admin`) SHALL import centers from Franchise Management at `/app/centers` using the same CSV/Excel dialog and `import_franchise_centers` RPC as platform admins.

#### Scenario: Open import dialog from brand portal

- **GIVEN** brand owner or brand admin is on `/app/centers`
- **WHEN** they click **Import Franchise**
- **THEN** a modal opens with template download, file picker, preview, and import action
- **AND** confirmed rows call `import_franchise_centers` for the current brand only

#### Scenario: Refresh brand directory after import

- **WHEN** import creates one or more centers
- **THEN** the Franchise Management directory refreshes without a full page reload
