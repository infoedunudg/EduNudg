# Navigation spec — left sidebar (`/admin`, `/app`)

Target state for v1 implementation. Source of truth for menu labels; routes must exist in `AppRoutes.tsx` when marked **new**.

**Confirmed (product):**

- Brand: separate **Student Leads** and **Franchise Applications**
- Platform: self-serve approvals on **`/admin/brands`** (manual add + pending queue + brand list)
- Student (`learn.*`): **Dashboard** + **Profile** only in v1

---

## Platform — `/admin` (EduNudg ops)

| Section | Item | Route | Status |
|---------|------|-------|--------|
| Main menu | Home | `/admin` | Exists |
| Features | Brands | `/admin/brands` | Exists — list; **Edit** → detail with **Brand settings** |
| | ↳ Brand detail | `/admin/brands/:brandSlug` | Exists — KPIs, settings (**Website theme**, Site logo → Homepage `landing.meta`), domains and centers paginate after 10 rows |
| | ↳ Brand signups | `/admin/brands` | Manual add + pending queue + approve |
| | Subscriptions | `/admin/subscriptions` | Exists |
| | Revenue & Usage | `/admin/revenue` | Exists |
| | Audit Logs | `/admin/audit` | Exists — mutations + Auth + Access + Errors; search; 25/50/100 rows; loads newest 2000 per table |
| General | Settings | `/admin/settings` | Exists |
| | Homepage (marketing editor) | `/admin/homepage` | Exists — platform homepage editor only |
| Footer | Log out | — | Exists |

**Not in platform nav:** student leads, franchise applications, center operations (brand-scoped).

---

## Brand — `/app` (brand owner / admin)

On mobile, the staff top bar shows the brand Site logo beside the product name.

| Section | Item | Route | Status |
|---------|------|-------|--------|
| Main menu | Home | `/app` | Exists — Today at a glance; Center Health is six equal checks (1 curriculum, 2 feedbacks, 2 students, 2 franchises, homepage content, franchise site content); login reminder popup when below 100% |
| Features | **Student Leads** | `/app/leads` | Exists — same pipeline chrome as Franchise Applications; Pending review / Decided; KPI stats; search; list + stacked detail (assignment below applicant); manual add, assign |
| | **Franchise Applications** | `/app/franchise-applications` | Exists — Pending review / Decided; KPI stats; Add Franchise modal; deleted centers stay on Decided |
| | Franchise Centers | `/app/centers` | Exists — import CSV/Excel, **Export Franchise**, view frontend/backend, disable/enable, **Delete franchise** popup (soft-delete); no Social Media editor |
| | **Students** | `/app/students` | Exists — Franchise Management chrome; all-franchise roster; search by student, franchise, or city; read-only contact + curriculum levels; **Export CSV** downloads the full roster |
| | Curriculum | `/app/curriculum` | Exists — pipeline header + Active/Drafts/Programs/Total KPIs; 2-column master-detail on desktop; mobile **Edit course** opens the same editable overlay (live toggle + Save); add via **+ Add Curriculum** in the page header (no **+** on Courses) |
| | **Competitions** | `/app/competitions` | Exists — Events + question bank; gated by `competitions` (default off) |
| | Campaigns | `/app/campaigns` | Exists — CRUD |
| | **Success stories** | `/app/success-stories` | Exists — pipeline chrome like Franchise Applications; KPI stats (Published, Draft, With photo, Total); Published / Draft tabs; Add Story modal; list + detail |
| | Merchandise | `/app/merchandise` | Exists — pipeline header + Active/Draft/Orders/Total KPIs; Catalog / Promo Codes / Orders / Payment settings each use desktop list + detail |
| | Analytics | `/app/analytics` | Exists — KPIs + Performance Breakdown pulse (14D/30D) |
| General | **Homepage** | `/app/homepage` | Exists — brand public site editor |
| | **Center Site Configuration** | `/app/center-site` | Exists — parent enrollment template (`center_landing`) |
| | Settings | `/app/settings` | Exists — white-label + SLA; logo is Homepage Site logo |
| | **Audit Logs** | `/app/audit` | Exists — Auth + Access for this brand (masked IP; no Errors). Brand owner/admin. |
| | **Billing** | `/app/billing` | Exists — subscription checkout stub |
| Footer | Log out | — | Exists |

**Removed from Settings-only:** franchise inquiry list (moves to Franchise Applications).

---

## Center (franchise) — `/app`

On desktop and mobile, the staff chrome lockup shows the **franchise display name** next to the Site logo, with a smaller **by {brand}** line under it when the names differ. Login uses the same lockup.

| Section | Item | Route | Status |
|---------|------|-------|--------|
| Main menu | Home | `/app` | Exists — open leads KPI |
| Features | **Leads** | `/app/leads` | Exists — curriculum-style pipeline chrome (KPI stats Open/Converted/Lost/Total, search, filter tabs, list + detail); list cards like Franchise Applications; manual add, convert, mark lost |
| | Students | `/app/students` | Exists — same pipeline chrome (Linked/Unassigned/Programs/Total); **Import students** CSV; **Copy Profile URL** copies learn-portal login (no password); **Save address** confirms next to the button |
| | Batches | `/app/batches` | Exists — gated by brand feature `batches` (default off) |
| | Fees & Payments | `/app/fees` | Exists — same pipeline chrome (Outstanding/Paid/Overdue/Total); Invoices / Payments tabs |
| | Inventory | `/app/inventory` | Exists — same pipeline chrome (In stock / Low stock / Incoming / Total); list is name / SKU / stock badge; column 2 shows Curriculum (course) and Program (level), left-aligns a 50% photo beside stock facts, puts On the way and Orders on one row, and uses a primary **Place New Order** button |
| | Merchandise | `/app/merchandise` | Exists — same pipeline chrome (Catalog / Unpaid / Orders / Total); Shop / My Orders; Shop list is one horizontal card per SKU with Curriculum/Program under the SKU and stacked qty / full-width Add to Order; checkout + order history |
| | Assessments | `/app/assessments` | Phase D |
| | Reports | `/app/reports` | Phase D |
| General | Settings | `/app/settings` | Exists — public profile (photo, address, phone) |
| | **Audit Logs** | `/app/audit` | Exists — Auth + Access for this center (masked IP; no Errors). Center owner/manager. |
| Footer | Log out | — | Exists |

**Center `/app/settings`:** franchise staff edit display name, description, address, photo, and phone. Login email is read-only from auth; public marketing URL is the center website. Footer social icons use brand Social Media Connect.

**Center `/app/leads`:** assigned leads + direct `lead_source = center`; status changes reset SLA; **Convert** action. Page chrome matches center Curriculum (`PipelinePageHeader`, `LeadKpiGrid`, search + `FilterTabs`, `PipelineWorkspace`). Center `/app/students`, `/app/fees`, `/app/inventory`, and `/app/merchandise` use the same stats + list/detail chrome.

---

## Student — `learn.*` host

Authenticated student chrome uses the same franchise lockup as center staff (franchise name, then “by {brand}”) from the student’s center, with the brand Site logo.

| Section | Item | Route | Status |
|---------|------|-------|--------|
| Main | Dashboard | `/` | Exists |
| Main | Progress | `/progress` | Exists |
| Main | Competitions | `/competitions` | Exists — labeled Events; gated by brand `competitions` flag |
| Main | Activity | `/activity` | Exists |
| General | Profile | `/profile` | Exists |
| — | Kits / merchandise | — | **Not in nav** (FR-S03) |

No sidebar required on mobile — single column shell acceptable.

---

## Parents — `parents.*` host

Out of v1 scope. Spec placeholder: mirror student minimal nav when built.

---

## Public marketing nav (top bar, not sidebar)

| Host | CTA anchors |
|------|-------------|
| Platform | Sign in → `/login`; brand signup section on `/` |
| Brand | `#apply` franchise, `#enroll-student` student application; `/login` uses brand public nav/footer |
| Center | `#register` student registration; **Student Login** → `learn.{brand}/login?center={center}` |
| Learn | `/login` uses that franchise public nav/footer when the center is known |

Indexable public **routes** (not hashes): platform `/` + `/legal/:kind`; brand `/`, `/about`, `/courses/:slug`, `/legal/:kind`; center `/`, `/courses/:slug`, `/legal/:kind`. See [`public-seo`](../../openspec/specs/public-seo/spec.md).

---

## Implementation notes

- Update [`apps/web/src/lib/portalNav.tsx`](../../apps/web/src/lib/portalNav.tsx) when routes are added.
- Home active state: exact match for `/admin` and `/app` (regression tests required).
- App pages use `PageGrid`, `PageGridFull`, `FormGrid` from `@edunudg/ui` — see [ui-shell-standards.md](./ui-shell-standards.md).
- Manual lead entry: [manual-leads.md](./manual-leads.md).
