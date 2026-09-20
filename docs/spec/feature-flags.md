# Feature flags

ON/OFF control for product modules and integrations. Flags must gate **nav**, **routes**, and **RPC** (server rejects when disabled for security-sensitive features).

## Storage

| Scope | Location | Example keys |
|-------|----------|----------------|
| Platform | `platform_settings.settings.features` jsonb | `platform_brand_signup`, `payment_gateway` |
| Brand | `brand_settings.settings.features` jsonb | `student_leads`, `franchise_applications`, `campaigns`, `merchandise`, `batches`, `competitions` |
| Brand integrations | `brand_settings.settings.integrations` jsonb | `google_auth`, `whatsapp_otp`, `payment_razorpay` |
| Env fallback | `import.meta.env` | Dev overrides only — not sole source in prod |

Default for **new** keys: `false` until explicitly enabled in Settings UI or seed.

## v1 module flags (brand)

| Key | Default | When ON |
|-----|---------|---------|
| `student_leads` | true (after migration) | Student Leads nav, brand application form, lead RPCs |
| `franchise_applications` | true | Franchise Applications nav, franchise form |
| `brand_billing` | true | Settings/Billing — pay platform subscription |
| `campaigns` | false | Phase E |
| `merchandise` | false | Phase D — catalog (incl. product photos), center shop, orders, payments |
| `batches` | false | Center Batches module, student self-join, batch RPCs / RLS |
| `competitions` | false | Brand Competitions module, question bank, student Events / quiz |

## Integration flags

| Key | Scope | Notes |
|-----|-------|-------|
| `auth_google` | brand + center | Social sign-in |
| `auth_email` | brand + center | Email/password |
| `auth_whatsapp_student` | learn | Student OTP |
| `payment_gateway` | brand | Platform subscription checkout |

## UI pattern

```typescript
// apps/web/src/hooks/useFeatureFlag.ts
export function useFeatureFlag(key: string): boolean {
  // resolve platform vs brand scope from TenantProvider
}
```

Learn (and brand/center) clients load brand flags via RPC `get_brand_feature_flags(p_brand_id)` — not a direct `brand_settings` SELECT — so students without `has_brand_access` still see flag-gated nav (e.g. Events when `competitions` is ON).

- Sidebar: omit items when flag false.
- Route: optional `FeatureFlagRoute` wrapper redirecting to `/app` if off.

## Admin UI (phased)

- Platform `/admin/settings` — platform flags + gateway credentials (secrets via env/Edge only); **Export Data** downloads an Excel workbook of brands, franchise centers, and students (see `openspec/specs/platform-settings/spec.md`).
- Platform `/admin/brands/:slug` — per-brand feature toggles (platform admin).
- Brand `/app/settings` — **White-label & Login Copy** (headline + subtext on every brand/center/student/parent `/login`; live split-login preview as you type; cache cleared on save). SLA + timezone. No Brand Identity / logo; Site logo is Homepage `landing.meta`. Feature toggles are platform-admin only.

## RPC guard

```sql
IF NOT (brand_settings.settings->'features'->>'student_leads')::boolean THEN
  RAISE EXCEPTION 'feature_disabled';
END IF;
```

## Related

- [services-layer.md](./services-layer.md)
