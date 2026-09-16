# Journey: Brand operator

Brand staff use `http://{brand}.localhost:9000/app/*`.

## Primary menus (v1)

| Menu | Purpose |
|------|---------|
| Home | Compact KPI grid: unassigned leads, stale leads, new franchise applications |
| **Student Leads** | Assign, reallocate, view lost with reasons |
| **Franchise Applications** | Approve/reject; Add Franchise modal; provisions center + domain |
| Franchise Centers | Master-detail `/app/centers` — profile (no Social Media), open frontend/backend, disable/enable, delete, curriculum, **Import Franchise** CSV/Excel, **Export Franchise** |
| **Students** | Master-detail `/app/students` — same chrome as Franchise Management; search by student, franchise, or city; read-only contact + curriculum levels; **Export CSV** downloads the full roster |
| Curriculum | Master-detail `/app/curriculum` — pipeline header + Active/Drafts/Programs/Total KPIs; courses/levels/units; on/off toggle in course detail header (mobile **Edit course** overlay includes the same controls); parent marketing stays editable after create |
| Merchandise | Catalog, promos, payment settings, and franchise orders — pipeline header + Active/Draft/Orders/Total KPIs; each tab is list + detail |
| Analytics | Cross-center metrics |
| Settings | White-label login copy (live split-login preview), **`lead_stale_days`**, **timezone**. Logo is Homepage **Site logo**. |
| **Billing** | Pay EduNudg platform subscription (payment gateway) |

## Student lead operations

1. **Unassigned** — brand applications awaiting center pick.
2. **Assign** — suggestions from pincode; confirm manually; may override to any center.
3. **Stale** — franchise inactive 15+ days (configurable); reallocate to another center.
4. **Lost** — view-only list with `lost_reason` (set by center). **Reopen** action for brand when business warrants.

## Franchise operations

- Approve inquiry → center host live + operator invite (same transaction).
- **Import Franchise** CSV/Excel on `/app/centers` — same template and `import_franchise_centers` RPC as platform admins ([ops](../ops/franchise-center-csv-import.md)). Reimporting the same Franchise Owner **name** overwrites that franchise and reactivates it if it was deleted. Rows with `owner_email` receive the brand-derived initial backend password (one-word lowercase brand name + `@123`), shown on completion.
- **Export Franchise** downloads every live franchise (`{brandSlug}-franchises-{date}.csv`) even when the directory is filtered.
- Selecting a franchise smoothly brings the second-column detail panel to the top while the sticky first-column directory remains in place.
- Open that franchise’s **Frontend** (public site) and **Backend** (`/app`) from the franchise detail panel (**View Frontend** / **View Backend**).
- **Disable / Enable** franchise (`suspended` ↔ `active`). **Delete franchise** opens a confirmation popup, then soft-deletes (`deleted_at`). Approved Franchise Applications stay as history on **Decided** with a DELETED badge (sorted after live decided rows).
- Read-only visibility into any student/center under brand from **Students** (`/app/students`) — contact details and current curriculum levels for growth planning. **Export CSV** in the page header downloads the full roster (`{brandSlug}-students-{date}.csv`).

## Billing

- Brand pays **EduNudg** subscription (platform admin / invoices).
- Royalties and kits are **brand ↔ franchise**, not platform.

## Related

- [Navigation spec](../spec/navigation-spec.md)
- [Data flow](../spec/data-flow.md)
