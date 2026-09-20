# brand-merchandise Specification

## Purpose

Brand staff manage the merchandise catalog, promo codes, payment settings, and franchise orders at `/app/merchandise`, gated by the `merchandise` feature flag.

## Related

- Product: [`docs/spec/merchandise.md`](../../../docs/spec/merchandise.md)
- Journey: [`docs/journeys/brand-operator.md`](../../../docs/journeys/brand-operator.md)
- Navigation: [`docs/spec/navigation-spec.md`](../../../docs/spec/navigation-spec.md)
- Competitions stay off this page: [`brand-competitions-module`](../brand-competitions-module/spec.md)

## Requirements

### Requirement: Pipeline chrome on Merchandise

Brand staff SHALL manage merchandise at `/app/merchandise` with the same pipeline chrome as Franchise Applications: page header, KPI stats strip, search, section tabs, and a list with detail beside it on desktop for Catalog, Promo Codes, Orders, and Payment settings.

#### Scenario: Page chrome matches franchise applications

- **GIVEN** a brand user on `/app/merchandise`
- **THEN** the page uses `PipelinePageHeader` + `LeadKpiGrid` like Franchise Applications
- **AND** stats cards show Active, Draft, Orders, and Total
- **AND** **+ Add Merchandise** remains in the page header on the Catalog section
- **AND** **+ Add Promo Code** appears in the page header on the Promo Codes section
- **AND** section tabs remain Catalog, Promo Codes, Orders, and Payment settings

#### Scenario: KPI cards filter catalog or open orders

- **GIVEN** a brand user on `/app/merchandise`
- **WHEN** they click Active, Draft, or Total
- **THEN** the Catalog section is shown with that catalog filter
- **WHEN** they click Orders
- **THEN** the Orders section is shown

#### Scenario: Desktop catalog is list plus detail

- **GIVEN** a brand user on `/app/merchandise` Catalog on desktop with at least one SKU
- **THEN** the page uses `PipelineWorkspace`
- **AND** column 1 lists SKUs and column 2 shows the selected catalog card

#### Scenario: Desktop promo, orders, and payment tabs match catalog

- **GIVEN** a brand user on `/app/merchandise` on desktop
- **WHEN** they open Promo Codes, Orders, or Payment settings
- **THEN** each tab uses `PipelineWorkspace` with a list in column 1 and the selected item in column 2
- **AND** typing in search filters the current tab and does not switch to Catalog
- **AND** Promo Codes can add from the page header into the detail column
- **AND** Payment settings lists Payment mode, Razorpay, Invoice details, and Reminders

### Requirement: Competitions is not a Merchandise tab

The Merchandise page SHALL NOT include a Competitions tab.

#### Scenario: Merchandise catalog has no Competitions tab

- **GIVEN** brand staff is on `/app/merchandise`
- **WHEN** the page renders
- **THEN** section tabs are Catalog, Promo Codes, Orders, and Payment settings
- **AND** no Competitions tab is present

### Requirement: Catalog SKUs are tied to curriculum

Brand staff SHALL assign each merchandise SKU to one or more curriculum courses and MAY tag specific levels. Franchise `/app/merchandise` Shop and `/app/inventory` SHALL list only active SKUs linked to a course in that center’s `center_program_enablement`, via `list_center_active_merchandise_catalog` (not a brand-wide catalog SELECT). SKUs with no curriculum link SHALL NOT appear on the franchise shop or inventory.

#### Scenario: Brand catalog editor assigns curriculum

- **GIVEN** a brand user adding or editing a catalog SKU
- **WHEN** the catalog form renders
- **THEN** a Curriculum picker lists brand courses and their levels
- **AND** an Active SKU cannot save until at least one course or level is selected
- **AND** saving those tags calls `sync_merchandise_catalog_programs` with a jsonb array of `{program_id, level_id}` (parsed via `SELECT value FROM jsonb_array_elements`)

#### Scenario: Center shop hides unrelated kits

- **GIVEN** a franchise whose assigned curriculum is Abacus Core
- **AND** the brand catalog has a Vedic Math kit and an Abacus Core kit
- **WHEN** center staff open `/app/merchandise` Shop
- **THEN** only the Abacus Core kit is listed

#### Scenario: Brand owner on franchise host sees assigned kits only

- **GIVEN** a user with brand access opens the franchise Shop or Inventory
- **WHEN** the catalog loads
- **THEN** the client calls `list_center_active_merchandise_catalog` for that center
- **AND** SKUs for courses not assigned to the franchise are omitted

Traceability: regression — `regression_unassigned_sku_is_hidden_from_center`, `regression_sku_visible_when_center_has_matching_curriculum`, `regression_merchandise_curriculum_picker_toggles_course`, `regression_merchandise_curriculum_picker_toggles_level`, `regression_list_active_merchandise_catalog_filters_by_center_curriculum`, `regression_list_center_active_catalog_rpc_returns_bigint_price_cents`, `regression_list_center_active_catalog_rpc_returns_setof_catalog`, `regression_list_active_catalog_falls_back_when_rpc_price_type_mismatches`, `regression_sync_merchandise_catalog_programs_reads_jsonb_array_value_column`, `regression_postgrest_error_object_is_not_generic_something_went_wrong`, `regression_center_merchandise_shop_row_image_is_at_least_double_width`, `regression_center_merchandise_shop_shows_catalog_curriculum`.

### Requirement: Pipeline chrome on center Merchandise

Center staff SHALL shop and track kit orders at `/app/merchandise` with the same pipeline chrome as Curriculum: page header, KPI stats strip, search, section tabs, and list + detail on desktop.

#### Scenario: Center shop chrome matches curriculum

- **GIVEN** a center user on `/app/merchandise`
- **THEN** the page uses `PipelinePageHeader` + `LeadKpiGrid` like Curriculum
- **AND** stats cards show Catalog, Unpaid, Orders, and Total
- **AND** section tabs remain Shop and My Orders
- **AND** desktop Shop keeps the catalog beside checkout in `PipelineWorkspace`
- **AND** Shop catalog cards are full-width horizontal rows (one SKU per row), not a two-column product grid
- **AND** the Shop list includes only SKUs tied to curriculum assigned to that franchise (`center_program_enablement`)
- **AND** desktop My Orders keeps order history beside allocations and shipping directory

#### Scenario: Shop catalog matches inventory list density

- **GIVEN** a center user on `/app/merchandise` Shop on desktop
- **THEN** each catalog SKU is a horizontal card spanning the list column
- **AND** the card header uses an 8rem photo beside title + price (badge/SKU and Curriculum/Program under the title), while quantity and **Add to Order** stack in a full-width footer so the add label is never clipped at Curriculum list width
- **AND** the title wraps within the remaining flex space (`min-width: 0`, `overflow-wrap: anywhere`) so it never paints over the price
- **AND** the price stays `flex: 0 0 auto` with `white-space: nowrap` so it remains readable beside the title
- **AND** the desktop list/detail split matches Curriculum (`minmax(16rem, 0.95fr)` list, `minmax(0, 2.05fr)` detail)
- **AND** the list does not place two product cards side by side

#### Scenario: Shop cards name curriculum and program

- **GIVEN** a center SKU tagged to Abacus Core Level 1
- **WHEN** staff open `/app/merchandise` Shop
- **THEN** the catalog card shows **Curriculum: Abacus Core** and **Program: Level 1**
- **AND** search also matches those course and level names

Traceability: regression — `regression_center_merchandise_shop_shows_catalog_curriculum`, `regression_center_merchandise_shop_title_wraps_instead_of_overlapping_price`, `regression_center_merchandise_shop_row_image_is_at_least_double_width`.

### Requirement: Razorpay checkout Edge Function is authenticated

Center staff SHALL start Razorpay checkout only through the `merchandise-razorpay-checkout` Edge Function with a signed-in JWT. The function SHALL reject anonymous callers and callers without center, brand, or platform access to the order.

#### Scenario: Checkout requires membership on the order

- **GIVEN** a merchandise order for a franchise center
- **WHEN** `merchandise-razorpay-checkout` is invoked without a valid user JWT
- **THEN** the function returns 401
- **WHEN** a signed-in user without center, brand, or platform access to that order calls it
- **THEN** the function returns 403
- **WHEN** a center (or brand/platform) member for that order calls it
- **THEN** the function may create a Razorpay order (or return the Razorpay stub when keys are unset)

Traceability: regression — `regression_merchandise_razorpay_checkout_requires_membership`.

### Requirement: Payment reminder cron is fail-closed

The `merchandise-payment-reminders` Edge Function SHALL require a configured `CRON_SECRET` and matching `x-cron-secret` header. Missing secret configuration SHALL return 503; a wrong or missing header SHALL return 401.

#### Scenario: Reminders reject open callers

- **GIVEN** `CRON_SECRET` is unset in Edge Function secrets
- **WHEN** any client POSTs `merchandise-payment-reminders`
- **THEN** the function returns 503 and does not run service-role reminder processing
- **GIVEN** `CRON_SECRET` is set
- **WHEN** the request omits or mismatches `x-cron-secret`
- **THEN** the function returns 401

Traceability: regression — `regression_merchandise_reminders_require_cron_secret`.
