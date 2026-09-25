---
name: edunudg-rls-policy
description: Write or review Supabase RLS policies for EduNudg multi-tenant tables.
---

# RLS Policy

## Helpers (use these)

- `public.is_platform_admin()`
- `public.has_brand_access(uuid)` — brand/platform memberships only (`user_brand_ids` excludes `scope_type = 'center'`)
- `public.has_center_access(uuid)` — own center, or brand/platform oversight of that brand’s centers
- `public.has_center_staff_for_brand(uuid)` — center membership under a brand (SELECT catalog/chrome only)
- `public.student_enrolled_at_accessible_center(uuid)` — student enrolled at a center the caller can access
- `auth.uid()`

## Tenant scope rules

| Role | Brand-wide mutate / all centers | Own center only |
|------|----------------------------------|-----------------|
| Platform admin | Yes | — |
| Brand owner / brand admin | Yes (that brand) | — |
| Center staff | **No** | Yes |

Never treat an active center membership as `has_brand_access`. Regression: `regression_center_staff_membership_does_not_grant_brand_access` in `supabase/tests/rls_center_staff_tenant_scope.sql`.

## Policy pattern

```sql
CREATE POLICY "brand_select" ON public.example
  FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id));
```

Center staff reading brand catalog:

```sql
CREATE POLICY "programs_center_read" ON public.programs
  FOR SELECT TO authenticated
  USING (public.has_center_staff_for_brand(brand_id));
```

## Verify

Run `pnpm test:rls` and add case per role in `supabase/tests/rls_*.sql`.
