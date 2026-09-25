# Table Dictionary

## Audit columns (mutable tables)

All mutable business tables: `created_at`, `updated_at`, `created_by`, `updated_by` + `set_row_audit()` trigger.

## Append-only (no updated_by)

| Table | Notes |
|-------|-------|
| `financial_events` | `created_by` only |
| `platform_audit_logs` | `created_by` only |
| `enrollment_history` | `created_by` only |
| `brand_status_events` | `created_by` only |
| `auth_audit_logs` | `created_by` only; login/logout/failure/denied. Network IP stamped by Edge Function `auth-audit`, not the SPA. |
| `access_audit_logs` | `created_by` only; sensitive staff actions (export, view_pii, credentials, handoff). |
| `client_error_reports` | `created_by` only; fatal SPA errors. Platform-only SELECT. |
| `lead_events` | timeline |
| `lead_assignment_history` | reassignments |

## Core

| Table | Scope | Description |
|-------|-------|-------------|
| `profiles` | user | Extended auth user profile |
| `brands` | platform | Franchise brand tenant |
| `franchise_centers` | brand | Physical center / franchise; public profile fields below. CSV import sets `slug` from **name** (unique `-2` suffix if needed). Reimport of the same `name` overwrites that row (including soft-deleted) and sets `status` `active` (`102`). |
| `memberships` | auth | User role per scope. Inquiry/CSV franchise owners start as `invited`; first staff login calls `accept_own_invited_memberships()` (migration `101`) so they are not signed out immediately. |
| `auth_audit_logs` | auth | Append-only sign-in events (`login_success`, `login_failure`, `logout`, `access_denied`) with `portal`, optional `brand_id`/`center_id`, session dedup. Platform `/admin/audit` Auth stream. Full IP is platform-only. Tenant staff read via `list_tenant_staff_audit` (failed-login emails and raw IP redacted). |
| `access_audit_logs` | audit | Sensitive actions: CSV export, Copy Profile URL, owner credentials, platform portal handoff. Platform SELECT; tenant via `list_tenant_staff_audit`. |
| `client_error_reports` | audit | Fatal SPA errors (ErrorBoundary, `window.onerror`, `unhandledrejection`). Platform `/admin/audit` Errors stream only. |
| `domain_mappings` | routing | Hostname → portal |
| `platform_brand_signups` | platform | Self-serve EduNudg brand signup queue |

### `franchise_centers` public profile (migration `046`)

| Column | Type | Notes |
|--------|------|-------|
| `display_name`, `short_description` | text | Shown on center public site |
| `address_line1`, `city`, `region`, `pincode`, `country` | text | Location |
| `contact_phone` | text | Phone / WhatsApp on public site; staff email from auth (Google/social login) |
| `photo_url` | text | `brand-assets` path `{brand_id}/centers/{center_id}/photo.{ext}` |
| `social_links` | jsonb | Array of `{platform, url}` (max 6) |

Center staff update via RPC `update_center_public_profile_rpc` (requires `has_center_access`).

### Franchise lifecycle & curriculum (migration `052`)

| Table | Scope | Description |
|-------|-------|-------------|
| `center_status_events` | brand | Append-only audit when brand suspends/re-enables a franchise |
| `center_curriculum_enablement` | brand | Published `curriculum_version_id` pins per center; sync via `sync_center_curriculum_enablement` |

RPC `set_franchise_center_status` — brand-only `active` ↔ `suspended` (Disable/Enable in Brand Backend). RPC `soft_delete_franchise_center` — brand/platform sets `deleted_at` and `closed`. RPC `import_franchise_centers` — create or overwrite by slug from **name**; soft-deleted matches are restored (`deleted_at` cleared, `active`). Center staff access gated via `user_center_ids()` (operational centers only).

## Leads & recruitment

| Table | Scope | Description |
|-------|-------|-------------|
| `leads` | brand / center | Student pipeline; `lead_source` brand \| center; nullable `center_id`; optional CSV-aligned `login_email`, `address_line1`, `state`, `program_name`, `starting_level` (migration `090`; do not reuse prefix `089`) |
| `lead_events` | brand | Merge, lost, reopen, assign audit |
| `lead_assignment_history` | brand | Center reassignments |
| `franchise_inquiries` | brand | Prospective franchisee applications. Soft-deleting the converted center does not delete the inquiry; Franchise Applications shows it on **Decided** with a DELETED badge. |

## Students

| Table | Scope | Description |
|-------|-------|-------------|
| `students` | brand | `source_lead_id` optional lineage; CSV import via `import_center_students` auto-assigns `STU-NNN` `student_code` |
| `student_profiles` | brand | Extended profile JSON/columns; CSV import fills school, address, city, state, pincode; phone copies WhatsApp |

## Merchandise (Phase D)

| Table | Scope | Description |
|-------|-------|-------------|
| `merchandise_catalog` | brand | SKUs centers can order (see columns below) |
| `merchandise_catalog_programs` | brand | SKU ↔ course (+ optional `level_id`); franchise shop/inventory use `list_center_active_merchandise_catalog` so brand owners on a franchise host still only see assigned courses |
| `merchandise_orders` | center | Orders to brand |
| `merchandise_order_lines` | center | Line items (optional `student_id`) |
| `student_merchandise_allocations` | center | Hidden from student portal |
| `merchandise_promo_codes` | brand | Checkout promo codes |
| `merchandise_invoices` | center | Per-order invoices |
| `merchandise_payments` | center | Payment records |
| `merchandise_reminder_log` | center | Payment reminder audit |
| `student_level_progress` | center | Level progress on learn dashboard; `enrollment_id` required on new writes |
| `brand_competitions` | brand | Competition calendar; `fee_type`, registration window |
| `student_competition_registrations` | center | Student self-enroll (free); paid Coming soon |
| `student_competition_entries` | center | Post-event results |
| `competition_question_bank` | brand | MCQ bank tagged to course + level |
| `competition_question_options` | brand | Options for a bank question (`is_correct`) |
| `competition_question_papers` | brand | PDF/Excel/CSV papers tagged to course + level (`file_url` is `brand-private:{path}`; signed URLs at read time) |
| `brand_competition_questions` | brand | Snapshotted questions attached to an event |
| `brand_competition_papers` | brand | Papers attached to an event (enrolled students only) |
| `student_competition_attempts` | center | One quiz attempt per student per competition |
| `student_competition_attempt_answers` | center | Selected options + correctness after submit |

### `merchandise_catalog` columns (notable)

| Column | Type | Notes |
|--------|------|-------|
| `photo_urls` | `text[]` | Up to 5 public image URLs; slot *n* stored at index *n−1*. Files live in `brand-assets` at `{brand_id}/merchandise/{id}/photo-{1-5}.{ext}`. Re-upload replaces same slot. |

Centers with `merchandise` enabled can **SELECT** active rows **tied to a curriculum assigned to their franchise** (policy `merchandise_catalog_center_read`, migrations `045` + `084`). Brand membership `FOR ALL` still matches every SKU, so franchise Shop/Inventory **must** call `list_center_active_merchandise_catalog` (migrations `085` + `088` + `089`). SKUs with no curriculum link stay on the brand catalog only. Optional `level_id` is the brand tag; visibility stays program-based.

## Campaigns & ops (Phase E)

| Table | Scope | Description |
|-------|-------|-------------|
| `brand_campaigns` | brand | Promotions for centers (mutations via RPC) |
| `student_assessments` | center | Level checks and scores (mutations via RPC) |
| `brand_success_stories` | brand | Parent/franchise testimonials (brand-managed CRUD) |

## Curriculum extensions (`019`)

| Column | Table | Purpose |
|--------|-------|---------|
| `why_take`, `what_you_learn`, `marketing_video_url` | `programs`, `levels` | Abacus marketing copy |
| `marketing_image_url` | `programs` | Course banner URL; Storage object is per course (`program-marketing/{program_id}`), not a shared brand slot |
| `is_active` | `programs` | Course on/off; false hides from public curriculum and batch pickers, not from `/app/curriculum` |
| `id` in `brand_public_curriculum_json` | (RPC JSON) | Public course URLs (`/courses/:slug`) disambiguate name collisions; migration `093` |
| `abacus_level_code`, `topics_covered` | `levels` | Level label + topic list (jsonb array) |

## Settings JSON keys (`brand_settings.settings`)

| Key | Default | Purpose |
|-----|---------|---------|
| `lead_stale_days` | 15 | SLA after assign |
| `timezone` | Asia/Kolkata | Display + SLA |
| `features` | object | Module flags |
| `integrations` | object | Auth/payment flags |
| `landing` | object | Marketing copy |

## Public RPC

| Function | Description |
|----------|-------------|
| `log_auth_audit_event` | Append auth audit (anon: `login_failure` only) |
| `get_portal_branding` | Login + staff chrome (Site logo; franchise `display_name`) |
| `get_brand_landing_public` | Brand marketing |
| `submit_franchise_inquiry_v2` | Franchise application |
| `submit_brand_student_application` | Student application (`lead_source=brand`) |
| `get_center_landing_public` | Center marketing (brand logo only; curriculum = enabled programs; `brand_founders` from brand `landing.founders`) |
| `center_public_curriculum_json` | Published programs assigned to that franchise (`center_program_enablement`) |
| `submit_center_student_registration` | Center registration (`lead_source=center`) |
| `submit_platform_brand_signup` | Platform B2B signup |
| `approve_platform_brand_signup` | Platform admin |
| `suggest_centers_for_lead` | Pincode suggestions |
| `assign_lead_to_center` / `reassign_lead` | Brand manual assign |
| `update_lead_status` | Center SLA reset |
| `mark_lead_lost` | Center only |
| `reopen_lead` | Brand only |
| `convert_lead_to_student` | Center staff |
| `create_platform_brand_signup_staff` | Platform manual brand signup |
| `create_franchise_inquiry_staff` | Brand manual franchise application |
| `create_brand_student_lead_staff` | Brand manual student lead (CSV-aligned extras) |
| `create_center_student_lead_staff` | Center manual student lead (CSV-aligned extras) |

See migrations `016`–`019`.
