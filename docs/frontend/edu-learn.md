# EduLearn marketing theme

Green/orange public brand sites (`marketing_theme = 'edu-learn'`). Visual reference: **cream page** (`#F6F3ED`, not Novu black), rounded cards, forest green (`#1E5631`), orange CTAs (`#F9A825`), doodle underlines.

Platform admins assign the theme at **Platform → Brands → Edit** → **Brand settings** → **Website theme**. Brand owners edit the **same** homepage JSON at `{brand}.localhost:9000/app/homepage` and `{brand}.localhost:9000/app/center-site`. Course catalog rows (**Courses designed for success** / **Curriculum syllabus**) are hidden there — publish courses on **Curriculum**.

Hero photo sits in a teal organic blob with doodles; teacher/classroom cards overlap the photo. Stats use overlapping orange + teal tiles. Header CTA is a pill outline; Get Started is solid orange. Brand nav includes **Apply franchise** from stored Navigation & CTAs (same field as Spark).

Switching a brand from Spark or Abacus to EduLearn keeps the existing `landing` JSON: course catalog, FAQ, nav links, and franchise apply labels. EduLearn restyles those blocks; it does not replace them with empty placeholder-only homepage content.

| Piece | Component | Content source |
|-------|-----------|----------------|
| Nav | `EduLearnNav` | Navigation & CTAs |
| Hero | `EduLearnHero` | Hero + Site logo |
| Courses | `EduLearnCourses` | Published Curriculum (`#programs` / `#curriculum`), same as Spark. Cards use `.el-course-card` with padded body text (not the gallery overlay layout). Course banners use `object-fit: contain` so the full upload is visible. Media and title link to `/courses/:slug`; **Enroll now** stays a lead-modal button. `/courses/:slug` uses a forest-green hero and sticky enroll offer card. |
| Feature cards | `EduLearnFeatures` | Features (`featureSections`, first 3) |
| Stats | `EduLearnStats` | Trust / journey + live center/student counts. YouTube URL from Trust & video renders below the photo (`#trust`) |
| Leadership | `EduLearnMentors` | Homepage **Meet our leadership** accordion (`#founders`). Role badge, name, and title match Abacus / Spark (`regression_edu_learn_mentor_card_shows_role_badge_and_title`) |
| Events | `UpcomingEventsSection` | Homepage upcoming events |
| Testimonials | `EduLearnTestimonials` | Published brand success stories only; omitted when none |
| FAQ | `EduLearnFaq` | Homepage FAQ |
| Resources | `EduLearnResources` | Photo gallery (first 3 images) |
| Green band | `EduLearnCtaBand` | Footer CTA |
| Footer | `EduLearnFooter` | Footer + Social Media Connect. Legal links (Privacy / Terms / Refund) use `.el-footer__legal` flex gap so labels do not run together. Brand footers show Homepage **Head office** address/phone; franchise public footers overlay Franchise Management address/phone (`This center`) and hide brand HQ. |

Lead modals: same `#enroll` / `#apply` stack as Spark/Abacus, skinned `ac-modal--edu-learn`. Trust & video YouTube renders under stats when set (`regression_edu_learn_stats_renders_youtube_below_photo`, `regression_edu_learn_stats_video_css_is_fluid_on_mobile`).

About Us (`/about`) uses `.about-us--edu-learn`. Homepage does not mount an About teaser; leftover `#about` nav rewrites to `/about`.

## Related

- [Marketing landing pages](./marketing-landing.md)
- OpenSpec: [`marketing-homepage`](../../openspec/specs/marketing-homepage/spec.md), [`brand-about-us`](../../openspec/specs/brand-about-us/spec.md)
