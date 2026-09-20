# Competitions

Brand-managed events, curriculum question bank, and student quiz. Gated by `brand_settings.settings.features.competitions` (default **off**). Independent of Merchandise.

## Portals & routes

| Portal | Route | Purpose |
|--------|-------|---------|
| Platform | `/admin/brands/:slug` | Features toggle **Competitions** |
| Brand | `/app/competitions` | Events CRUD, question bank, attach questions (manual or random). Platform admins on Brand backend have the same create/update/delete controls as brand owners. |
| Learn | `/competitions` | Enroll, take quiz, past results (Events nav). **View papers** only after enroll (My registrations; Upcoming once registered). Enroll switches to My registrations and opens papers when attached. |

Learn Events nav uses `get_brand_feature_flags` (migration `105`) so students can read `features.competitions` without SELECT on `brand_settings`. Home Recommended cards link to `/competitions`.

## Question bank

- Tagged to curriculum `programs` (course) + `levels`
- MCQ with 2–6 options and at least one correct answer
- Attaching to an event **snapshots** prompt + options; bank edits do not change in-flight papers
- Attached set locks after the first student attempt (`QUESTIONS_LOCKED`)

## Question papers (files)

- Brand uploads **PDF / Excel / CSV** under Competitions → **Question papers** (course + level)
- Files live in `brand-assets` at `{brand_id}/competitions/papers/{paper_id}/…`
- Staff attach papers to an **Event**: Events → event → **Questions & papers** → select course/level → Attach selected papers
- Question papers bank prompts **Go to Events to attach** after upload (library alone is not enough for students)
- Students see **View papers** only after enroll (`get_student_competition_papers` raises `NOT_REGISTERED` otherwise)
- Upcoming enroll cards do **not** show papers before registration; after enroll, Learn opens **My registrations** (and papers when attached)
- PDF opens in an in-app viewer + Download; Excel/CSV are download-only

## Student quiz

- One attempt; server scores all-or-nothing per question (selected set equals correct set)
- Quiz window: registered, competition active, `event_date` today or earlier (or null)
- Correct answers are omitted from `get_student_competition_quiz` until after submit
- Submit upserts `student_competition_entries.score`

RPCs live in migration `081_competitions_module.sql`. Spec: [`openspec/specs/brand-competitions-module/spec.md`](../../openspec/specs/brand-competitions-module/spec.md).
