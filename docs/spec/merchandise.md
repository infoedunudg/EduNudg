# Merchandise ordering

Brand-managed catalog; franchise centers place orders from an ecommerce-style shop. Gated by the `merchandise` feature flag. Competitions are a separate module (`/app/competitions`, flag `competitions`).

## Portals & routes

| Portal | Route | Purpose |
|--------|-------|---------|
| Brand | `/app/merchandise` | Catalog CRUD, promos, payment settings, order fulfillment — pipeline chrome like Franchise Applications (`PipelinePageHeader` + Active/Draft/Orders/Total KPIs); Catalog / Promo Codes / Orders / Payment settings each use desktop list + detail |
| Center | `/app/merchandise` | Shop + checkout and order history — pipeline chrome like Curriculum (`PipelinePageHeader` + Catalog/Unpaid/Orders/Total KPIs); Shop / My Orders tabs; Shop list is one horizontal product card per row (same list density as Inventory) |
| Platform | `/admin/brands/:slug` | Enable `merchandise` feature toggle |

Legacy `/app/kits` redirects to `/app/merchandise`.

## Product photos

- **Max 5 photos** per catalog SKU, stored in the public **`brand-assets`** Supabase bucket (same bucket as brand logos).
- **Object path:** `{brand_id}/merchandise/{catalog_item_id}/photo-{slot}.{ext}` where `slot` is `1`–`5`.
- **Replacement:** uploading to a slot deletes any existing `photo-{slot}.*` files in that folder before upload (consistent naming enables upsert).
- **Database:** `merchandise_catalog.photo_urls` — `text[]`, max length 5; index `0` = slot 1, etc. Empty strings mean no photo in that slot.
- **Client:** `apps/web/src/lib/merchandiseProductPhotoStorage.ts`
- **Brand UI:** five upload slots per catalog row on brand `/app/merchandise` → Catalog. Each SKU is tied to one or more curriculum courses and optional levels; Active items require at least one course/level tag.
- **Center shop / inventory:** `list_center_active_merchandise_catalog` — only SKUs linked to programs in that franchise’s `center_program_enablement` (the same assignment as `/app/centers?center=…`). Do not list via brand-wide `merchandise_catalog` SELECT (brand `FOR ALL` would show every SKU). Unlinked SKUs stay hidden. After the RPC returns SKUs, hydrate course and level names from `merchandise_catalog_programs` so Inventory and Shop can show **Curriculum** (course) and **Program** (level). Regression: `regression_unassigned_sku_is_hidden_from_center`, `regression_inventory_omits_skus_not_in_assigned_catalog`, `regression_list_active_merchandise_catalog_filters_by_center_curriculum`, `regression_center_inventory_shows_catalog_curriculum`, `regression_center_merchandise_shop_shows_catalog_curriculum`.
- **Center UI:** Shop catalog uses horizontal product cards (`ed-product-card--row`), one SKU per row in the pipeline list column. Header is an 8rem square photo (at least 2× the prior 3.25rem thumb) with title+price on the right, then badge/SKU and **Curriculum** / **Program** (`CatalogCurriculumMeta`); the title wraps (`min-width: 0`, `overflow-wrap: anywhere`) so it never paints over the nowrap price; quantity and **Add to Order** stack in a full-width footer so the add label is never truncated at Curriculum list width (`regression_center_merchandise_shop_add_label_is_not_truncated`, `regression_center_merchandise_shop_row_image_is_at_least_double_width`, `regression_center_merchandise_shop_title_wraps_instead_of_overlapping_price`, `regression_center_merchandise_shop_shows_catalog_curriculum`).

Allowed MIME types match the `brand-assets` bucket: PNG, JPEG, WebP, GIF (5 MB per file).

## Center shop UX

1. **Shop** tab — one horizontal catalog card per SKU. An 8rem photo sits left of title + price; badge, SKU, **Curriculum** (course), and **Program** (level) wrap under the title. Quantity and **Add to Order** stack in a full-width footer so the add label is never truncated at Curriculum list width (`regression_center_merchandise_shop_add_label_is_not_truncated`, `regression_center_merchandise_shop_row_image_is_at_least_double_width`, `regression_center_merchandise_shop_shows_catalog_curriculum`). Desktop `PipelineWorkspace` list column uses the same width as Curriculum (`minmax(16rem, 0.95fr)` / `minmax(0, 2.05fr)`). Do not fill empty descriptions with boilerplate copy (`regression_center_merchandise_shop_omits_placeholder_description`). Checkout in the detail column on desktop (shipping, promo, payment). Page chrome matches Curriculum (`PipelinePageHeader`, `LeadKpiGrid`, search, `FilterTabs`, `PipelineWorkspace`). Do not use a two-up product grid in column 1 (`regression_center_merchandise_shop_cards_are_horizontal_one_per_row`, `regression_center_merchandise_list_column_matches_curriculum_width`).
2. **My orders** tab — order history in the list column; allocations and student shipping addresses in detail.

## Payments

Brand-configurable: Razorpay checkout, invoice/bank transfer, or both (`brand_settings.settings.merchandise`).

- **Razorpay start:** SPA calls Edge Function `merchandise-razorpay-checkout` via `functions.invoke` (session JWT). The function requires a signed-in user with `has_center_access`, `has_brand_access`, or `is_platform_admin` for the order; anonymous `order_id` lookups are rejected (`regression_merchandise_razorpay_checkout_requires_membership`).
- **Payment reminders:** Edge Function `merchandise-payment-reminders` is cron-only. Set `CRON_SECRET` in function secrets and pass `x-cron-secret` from the scheduler. Missing secret → 503; wrong header → 401 (`regression_merchandise_reminders_require_cron_secret`).

## Related

- Canonical behavior: [`openspec/specs/brand-merchandise/spec.md`](../../openspec/specs/brand-merchandise/spec.md)
- [feature-flags.md](./feature-flags.md) — `merchandise` key
- [navigation-spec.md](./navigation-spec.md) — sidebar entries
- [table-dictionary.md](../database/table-dictionary.md) — schema
- Migration `045_merchandise_catalog_photos.sql` — `photo_urls` + center catalog read policy
- Migration `084_merchandise_catalog_programs.sql` — SKU ↔ curriculum + center shop/inventory filter
- Migration `085_merchandise_catalog_levels.sql` — optional `level_id` tags + `list_center_active_merchandise_catalog`
- Migration `087_fix_sync_merchandise_catalog_programs.sql` — curriculum save RPC reads `jsonb_array_elements` column `value`
- Migration `089_list_center_merchandise_catalog_setof.sql` — center catalog RPC returns `SETOF merchandise_catalog`
