# Brand upcoming events

## Purpose

Brand (and center template) homepage editors can add an **Upcoming events** section — competitions, workshops, demos, and other events — shown on public marketing sites for all themes when enabled and when upcoming items exist.

## Requirements

### Homepage section like leadership profiles

GIVEN a brand admin opens Homepage Configuration
WHEN they enable **Upcoming events** and add event cards (type, title, start date, optional end date, time, duration, location, image, CTA)
THEN the config is saved in `brand_settings.settings.landing.upcomingEvents`
AND the public brand homepage renders `#events` with date-badge cards

### Center Site Configuration on franchise websites

GIVEN a brand admin opens **Center Site Configuration** (`/app/center-site`)
WHEN they enable **Upcoming events** and upload a cover image for an event
THEN the config is saved in `brand_settings.settings.center_landing.upcomingEvents`
AND franchise/center public sites (from `get_center_landing_public`) render `#events` with that cover image
AND Spark / Abacus / EduLearn center merges preserve `upcomingEvents` (including `imageUrl`) from the stored partial

### Separate Storage slots for Homepage vs Center Site covers

GIVEN Homepage and Center Site both have an event at index 0
WHEN staff upload cover images in each editor
THEN Homepage uses `brand-assets` folder `event-0` and Center Site uses `center-event-0`
AND uploading on Center Site does not replace the Homepage event file (and vice versa)

### Upcoming-only visibility

GIVEN events with past and future dates
WHEN the public homepage renders
THEN only events whose end date (or start date if no end) is today or later are shown
AND items are sorted soonest-first
AND `maxItems` caps how many cards appear when set

### Empty hide

GIVEN the section is enabled but no upcoming events remain
WHEN the public homepage renders
THEN the Upcoming events block is omitted

### All themes

GIVEN Abacus Classic, Spark Academy, or Novu brand themes
WHEN upcoming events are configured
THEN each theme layout includes the shared `UpcomingEventsSection`

GIVEN a Spark Academy public homepage
WHEN `#events` renders
THEN the section title uses the Spark `--sa-h2-*` heading tokens (same as other Spark section titles)

### Optional media

GIVEN an event with an uploaded cover image in `brand-assets`
WHEN the section renders
THEN the card shows the image
AND saves use `preserveCustomMarketingMediaUrls` so stock URLs cannot wipe uploads
