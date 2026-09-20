# Marketing footer

## Requirements

### Shared footer shell

GIVEN a public marketing site (platform, brand, or center)
WHEN the site footer renders
THEN link columns and legal links use the shared `mkt-footer-shell` typography tokens
AND legal link labels are **Privacy Policy**, **Terms & Conditions**, and **Refund Policy**

### Legal policy pages

GIVEN an admin uploads a privacy, terms, or refund document in Homepage Configuration
WHEN they save and a visitor opens `/legal/{kind}`
THEN the published PDF or converted Word HTML is shown
AND Word-derived HTML is sanitized with DOMPurify before storage and before `dangerouslySetInnerHTML` inject
AND `<script>`, event handlers, and `javascript:` URLs are stripped
AND the footer includes a link to that route when configured or uploaded

Traceability: regression — `regression_legal_html_strips_script_and_event_handlers`, `regression_legal_page_strips_script_tags_before_inject`.

### Brand footer editing

GIVEN a brand admin edits Homepage Configuration
WHEN they update footer Product, Company, or Connect links
THEN the public brand and center footers reflect those links after save

### Center inheritance

GIVEN a center public site
WHEN the footer renders
THEN legal links may still follow brand uploads
AND social icons use brand `social_connect` (not franchise `social_links`)
AND address/phone use Franchise Management Location & Contact via `centerFooterContactFromProfile` on Novu, Abacus Classic, and Spark Academy
AND brand Head office / Our presence / Spark placeholder phone MUST NOT appear

### Spark Academy has no newsletter CTA

GIVEN a Spark Academy public brand or center site
WHEN the site footer renders
THEN it uses a column grid (brand, Explore, Contact, presence on brand hosts)
AND it MUST NOT render `footerCta` copy, an email/newsletter form, or a Login/arrow CTA — including leftover Novu “Start your network differently.” text in stored landing JSON

#### Scenario: Spark footer ignores leftover Novu CTA

- **GIVEN** Spark Academy landing JSON still has `footerCta.title` “Start your network differently.”
- **WHEN** the public Spark footer renders
- **THEN** that heading and any email/newsletter controls are absent
- **AND** Explore / Contact columns remain

### No WhatsApp float on brand landing

GIVEN a brand public landing page (any marketing theme)
WHEN social_connect includes WhatsApp phone, bubble title/body, or whatsappEnabled
THEN the page MUST NOT render a floating WhatsApp chat button or chat preview bubble
AND Social Media Connect in the homepage editor only configures Facebook and Instagram footer icons
