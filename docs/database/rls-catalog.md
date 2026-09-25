# RLS Catalog

## Helper functions

| Function | Purpose |
|----------|---------|
| `is_platform_admin()` | Platform super_admin / ops |
| `has_brand_access(uuid)` | Brand or platform scope (**not** center memberships) |
| `has_center_access(uuid)` | Own center via `user_center_ids()`, or all centers under a brand the caller has brand/platform access to, or platform admin |
| `user_brand_ids()` | Brand IDs from active `scope_type IN ('brand','platform')` memberships (excludes center scope — migration `107_center_staff_tenant_scope.sql`) |
| `user_center_ids()` | Center IDs from active center memberships (operational centers) plus brand_owner/brand_admin oversight |
| `has_center_staff_for_brand(uuid)` | Active center membership under that brand (catalog SELECT / chrome; not brand-wide mutate) |
| `student_enrolled_at_accessible_center(uuid)` | Student has an enrollment at a center the caller can access |

## Policy patterns

- **Platform tables**: `is_platform_admin()` for mutations; read where noted
- **Brand-scoped**: `has_brand_access(brand_id)` — brand/platform staff only
- **Center-scoped**: `has_center_access(center_id)` — franchise staff stay on their center(s)
- **Center brand catalog read**: `has_center_staff_for_brand(brand_id)` SELECT-only on programs/levels/brands/inventory where needed
- **Students**: brand access **or** `student_enrolled_at_accessible_center(id)` so center staff see only students enrolled at their centers
- **domain_mappings**: public read for hostname resolution
- **Append-only**: `financial_events`, `enrollment_history`, `platform_audit_logs`, `auth_audit_logs`, `access_audit_logs`, `client_error_reports`
- **Direct INSERT blocked**: `financial_events` (ledger writes via SECURITY DEFINER RPC / service role only)
- **Self-scoped INSERT**: `auth_audit_logs` (`user_id = auth.uid()`)
- **SECURITY DEFINER RPCs**: `authenticated` only except public marketing/signup allowlist (see `028_security_rls_rpc_hardening.sql` and `100_revoke_anon_security_definer_execute.sql`). Always `REVOKE FROM PUBLIC, anon` before `GRANT`. Anon may also execute `log_auth_audit_event` (failure only) and `log_client_error_event`. Tenant audit lists use `list_tenant_staff_audit` (redacts failed-login identifiers and omits raw IP). New SECURITY DEFINER functions inherit Supabase default `anon` EXECUTE until a sweep or explicit revoke.
- **Function search_path**: all `public` functions must `SET search_path = public` (see `029_function_search_path_hardening.sql`).

See migrations `003_rls_helpers.sql` through `008_finance_analytics.sql`.
