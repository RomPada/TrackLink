# TrackLink — Patch List

Release history is maintained in English.

---

## v0.6.0 — English-only UI and click record controls

- Removed Ukrainian UI translations and language switcher; TrackLink now displays English only.
- Replaced Ukraine-related country examples in demo with sample international locations.
- Added confirmed deletion for individual click records in the protected admin dashboard.
- Added a demo-only delete control that changes local sample rows without contacting Supabase.
- Reversed the 14-day charts so Today is the first bar, then Yesterday, then older days.
- Included zero-activity days in the real chart.
- No database migration is needed for this release.

**Commit:** `feat: add click record deletion and simplify English UI`  
**Release tag:** `v0.6.0`

---

## v0.5.1 — Fix TypeScript keyboard event types in group selector

- Fixed `TS2769` in `components/GroupSelect.tsx` that blocked Vercel production builds.
- Separated React keyboard event types used by the group selector button from native DOM keyboard events used by `document.addEventListener` / `removeEventListener`.
- Kept keyboard navigation, Escape handling, group selection, and the existing UI unchanged.
- No database migration is required; the v0.5.0 SQL migration is still required if not previously applied.

**Commit:** `fix: correct keyboard event types in group selector`  
**Release tag:** `v0.5.1`

---

## v0.5.0 — Short-link sharing, group picker and custom ordering

- Added a custom TrackLink favicon in SVG, PNG and ICO formats.
- Replaced native group selects in admin forms with a styled dropdown, pastel group indicators and keyboard controls.
- Made the copy-tracking-link buttons explicit; the newly created URL is immediately ready to copy.
- Added drag-and-drop sorting of links *within* each group, plus accessible up/down controls.
- Saved group-specific ordering in Supabase with a transactional RPC and strict validation.
- Added `sort_order` to the database, filled initial ordering for existing links, and extended the `link_stats` view.
- Added the one-time database migration `supabase/migrations/v0.5.0_link_order.sql`.

**Commit:** `feat: add sortable links and group picker`  
**Release tag:** `v0.5.0`

---


## v0.4.3 — Group background and in-place color updates

- Removed the success banner after changing a group color.
- Group color changes now update in place without redirecting the admin page to the top.
- Applied the selected pastel color to the full group container, not only its header and color controls.
- Kept individual link cards light for readability while showing the group color around them.
- Updated the demo page to reflect the same full-group background behavior.
- No new database migration is required if the v0.4.2 group-color migration has already been applied.

**Commit:** `fix: preserve scroll and apply color to full group`  
**Release tag:** `v0.4.3`

---


## v0.4.2 — Group color placement and Supabase migration fix

- Moved the pastel group-color selector into each group inside `Your links`.
- Group color changes now have a dedicated server action and no longer affect normal group creation/renaming.
- Simplified and realigned the group manager: clean name field, color indicator, link count, rename, and delete controls.
- Removed the nested border-on-border look from group name inputs.
- Empty groups are now also displayed in `Your links`, so their color can be configured before links are assigned.
- Added a dedicated `supabase/migrations/v0.4.2_group_colors.sql` migration.
- Added `NOTIFY pgrst, 'reload schema'` so Supabase/PostgREST refreshes the API schema cache after the migration.
- Added a clear migration-specific message if `background_color` is missing.
- Updated the public demo to show the group color selector in the same location.

**Commit:** `fix: move group colors into sections and repair migration`  
**Release tag:** `v0.4.2`

---


## v0.4.1 — Group styling polish and pastel color coding

- Refined the group-name field styling and spacing in the group manager.
- Restyled group selectors and dropdown fields to look cleaner and more consistent.
- Added pastel background color presets for link groups.
- Added background-color selection when creating or editing a group.
- Applied selected group colors to grouped link sections and group badges.
- Updated the demo page to reflect group color styling.
- Added the `background_color` field to the Supabase schema upgrade script.

**Commit:** `feat: add group color themes and polish group inputs`  
**Release tag:** `v0.4.1`

---

## v0.4.0 — Bilingual UI and safer destructive actions

- Added site-wide EN / UA language switching on login, admin, and demo pages.
- English is now the default interface language.
- Language selection is persisted in a cookie.
- Centered the `Open demo` button label.
- Updated the password visibility icon so its visual state matches whether the password is hidden or visible.
- Improved spacing and styling of the `New group` field.
- Added confirmation dialogs before deleting links or groups.
- Localized admin action messages, period cards, click details, demo content, and controls.
- Added `ROADMAP.md` with the planned TrackLink development directions.
- No database schema migration is required for this release.

**Commit:** `feat: add bilingual UI and delete confirmations`  
**Release tag:** `v0.4.0`

---

## v0.3.0 — Public demo and link groups

- Added a public `/demo` page accessible from the login screen.
- Demo mode uses only static sample data and does not connect to Supabase or grant admin permissions.
- Added demo period analytics, click-detail examples, grouped links, and a read-only create-link form.
- Added persistent link groups backed by the new `link_groups` Supabase table.
- Added group selection when creating or editing a tracking link.
- Added group creation, rename, and deletion in the admin area.
- Deleting a group keeps its links and moves them to `No group`.
- Grouped the `Your links` section into collapsible destination/campaign sections.
- Added group names to detailed click records.
- Reserved the `/demo` slug so it cannot be used as a tracking link.
- Updated the application and database schema version to `v0.3.0`.

**Commit:** `feat: add public demo and link groups`  
**Release tag:** `v0.3.0`

---

## v0.2.0 — Period analytics, click details and short URLs

- Added the `System / Database` status section.
- Rebuilt top-level analytics into four periods: today, last 7 days, current month, and all time.
- Added `Unique` and `Total clicks` metrics to every period card.
- Made period cards clickable; selecting one opens matching click records.
- Added the same four-period analytics to every individual tracking link.
- Replaced generated `/go/[slug]` URLs with short root URLs such as `/tg`.
- Kept `/go/[slug]` working for backward compatibility with already published links.
- Moved aggregate calculations into Supabase/PostgreSQL views.
- Added country code to click records using Vercel geolocation headers.
- Removed `referrer` from stored click records and the database schema.
- Added click detail rows with anonymous visitor ID, time, country, source link, destination, and device type.
- Added reserved root slugs to avoid collisions with TrackLink system routes.
- Updated the application version to `v0.2.0`.

**Commit:** `feat: add period analytics and short tracking URLs`  
**Release tag:** `v0.2.0`

---

## v0.1.4 — Documentation structure update

- Made `README.md` the primary English README for GitHub.
- Kept the Ukrainian documentation in `README.ua.md`.
- Removed the duplicate `README.en.md` file.
- Merged the separate English and Ukrainian changelogs into one bilingual `PATCHLIST.md`.
- Added direct links between the main README, Ukrainian README, and patch list.
- Updated the application version to `v0.1.4`.

**Commit:** `docs: simplify documentation structure`  
**Release tag:** `v0.1.4`

---

## v0.1.3 — Admin diagnostics fix and password visibility

- Added a show/hide password button on the login page.
- Supabase errors are no longer thrown into the UI as raw JavaScript objects.
- Added a readable database diagnostics panel.
- Added validation to prevent using an `sb_publishable_...` key as `SUPABASE_SECRET_KEY`.
- Documented browser-extension hydration mismatch troubleshooting.
- Updated the application version to `v0.1.3`.

**Commit:** `fix: improve admin diagnostics and password visibility`  
**Release tag:** `v0.1.3`

---

## v0.1.2 — TrackLink rename

- Renamed the project from `Transition Tracker` to `TrackLink`.
- Updated the app title and metadata.
- Updated the package name to `tracklink`.
- Updated internal admin cookie/session identifiers.
- Updated English and Ukrainian documentation for the new project name.

**Commit:** `chore: rename project to TrackLink`  
**Release tag:** `v0.1.2`

---

## v0.1.1 — UI contrast and documentation update

- Simplified the login screen.
- Made the project name the main login title.
- Improved dashboard contrast.
- Made link cards more visually distinct.
- Added visible app version metadata.
- Added English and Ukrainian README files.
- Added English and Ukrainian changelogs.

**Commit:** `style: improve admin UI contrast`  
**Release tag:** `v0.1.1`

---

## v0.1.0 — Initial MVP release

- Created redirect tracking through `/go/[slug]`.
- Added a password-protected admin area.
- Added link creation, editing, deletion, enable and disable actions.
- Added total clicks, unique visitors, 24-hour and 7-day stats.
- Added a 14-day chart.
- Added preview-bot filtering.
- Added the Supabase schema and deployment-ready project structure.

**Commit:** `feat: create initial link tracking MVP`  
**Release tag:** `v0.1.0`
