# Platform Navigation

## Public `/` (`http://localhost:9000`)

EduNudg marketing homepage + **self-serve brand signup** (B2B). No franchise or student forms. Sign-in: `/login` (same Site nav and enterprise footer as `/`).

Details: [Portal host matrix](../spec/portal-host-matrix.md), [Platform brand onboarding](../journeys/platform-brand-onboarding.md).

## App `/admin` (authenticated)

See [Navigation spec](../spec/navigation-spec.md).

- Command Center (Home) — compact KPI grid
- Brands — manual signup, pending approvals, brand list; **Edit** → `/admin/brands/:slug` (**Brand settings** includes **Website theme**)
- Brand detail — performance KPIs, **Brand settings** (name, **Site logo**, login, **Website theme**). Site logo and renamed site name save to Homepage `landing.meta` (same store as `{brand}/app/homepage`). Domains and franchise centers (**Import Franchise** CSV/Excel bulk onboarding) paginate after 10 rows
- Subscriptions & Billing
- Revenue & Usage — compact KPI grid
- Audit Logs — mutations, **Auth**, **Access**, and **Errors**. Search, 25/50/100 rows per page, newest 2000 per table.
- Platform Settings (default timezone IST)
- Homepage — EduNudg marketing editor only
