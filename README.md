# TrackLink

Version: **v0.7.1**

> **v0.7.1:** Fixed the TypeScript errors in the notifications and Web Push modules that blocked Vercel production builds. The v0.7.0 database migration and environment variables remain unchanged.


TrackLink is a small self-hosted redirect and click analytics app for Telegram, Facebook, Instagram, ads, email campaigns, Patreon links, and other traffic sources.

Release history: [PATCHLIST.md](./PATCHLIST.md)  
Development roadmap: [ROADMAP.md](./ROADMAP.md)

Short tracking URLs look like this:

- `https://your-domain.com/tg`
- `https://your-domain.com/instagram`
- `https://your-domain.com/fb`

All links can redirect to the same destination while keeping separate statistics for each slug.

## Features

- Installable Android PWA with admin-only Web Push, notification preferences, test push and a protected daily-summary Cron job.

- unlimited tracking links;
- English-only interface for login, admin, and demo;
- deletion confirmation dialogs for links and groups;
- public `/demo` page with static sample data and no Supabase/admin access;
- link groups for organizing destinations or campaigns such as Patreon, GitHub, and YouTube;
- pastel background color presets for every group;
- drag-and-drop sorting of links within groups, with up/down controls;
- custom group dropdown with color indicators and keyboard support;
- copy-tracking-link buttons, including immediately after creating a new link;
- custom SVG/PNG/ICO favicon;
- short redirect route `/[slug]` instead of `/go/[slug]`;
- backward compatibility for old `/go/[slug]` links;
- aggregated statistics for today, the last 7 days, the current month, and all time;
- both total clicks and approximate unique visitors for every period;
- the same four-period analytics for every individual tracking link;
- clickable period cards that open recent click records;
- click record details: anonymous visitor ID, date/time, country, source link, destination, and device type;
- country detection from Vercel geolocation headers without storing the visitor IP address;
- 14-day aggregate activity chart;
- System / Database status block;
- link creation, editing, enable/disable, and deletion;
- password-protected admin area;
- filtering of common social preview bots and browser prefetch requests;
- no IP address storage;
- `referrer` is no longer stored.

## Upgrade to v0.5.0 — required one-time migration

**Before using the new ordering feature**, open **Supabase → SQL Editor** and run:

```text
supabase/migrations/v0.5.0_link_order.sql
```

You can also run the complete updated `supabase/schema.sql` instead. The migration adds `links.sort_order`, fills the order for existing links, updates `link_stats`, and installs the `reorder_links_in_group` database function. It preserves your existing groups, links, URLs, and click history. Refresh the admin page after the SQL editor reports success. Do not run the old v0.4.3 schema after applying the migration.

### Reordering links

In **Your links**, drag the grip at the left of a link card to another position **inside the same group**. The changed order saves to Supabase. Use the ↑/↓ buttons for touchscreens or keyboard operation. Moving a link to a different group is still done through that link's **Settings → Group** menu.

### Sharing a tracking URL

Each link has a **Copy tracking link** button. After creating a link, TrackLink also shows the new full URL with a prominent copy button. It is the short URL (e.g. `https://your-domain.com/tg`) you should paste on Telegram, Instagram, Patreon, etc., not the destination URL.

### Favicon

The browser tab icon is provided by `app/icon.svg`, `app/icon.png`, and `app/favicon.ico`.

## Older database upgrades

If you have not previously installed the v0.4.2+ group-color migrations, prefer running the **entire** updated `supabase/schema.sql` rather than only the v0.5.0 migration. The complete script updates all features through v0.5.0 and keeps existing link and click data.

If you see `Could not find the background_color column ... in the schema cache`, the full schema can also fix that and refresh PostgREST's schema cache. Earlier click records may have an unknown country because it was not collected before v0.2.0.

## 1. Create a Supabase project

1. Create a new Supabase project.
2. Open `SQL Editor`.
3. Run the full `supabase/schema.sql` file.
4. In `Settings -> API Keys`, create or copy a **Secret key** in the format `sb_secret_...`.
5. Copy the `Project URL`.

> Never expose the Secret key in client-side code or commit it to GitHub.

## 2. Run locally

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example` and fill in:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxx
ADMIN_PASSWORD=your-strong-password
ADMIN_SECRET=a-long-random-secret
```

Use a random string of at least 40 characters for `ADMIN_SECRET`.

Run the app:

```bash
npm run dev
```

Admin area:

`http://localhost:3000/admin`

Public demo (no database connection or admin access):

`http://localhost:3000/demo`

A test tracking URL can look like:

`http://localhost:3000/tg`

Country detection is normally unavailable on localhost, so local records can show the country as unknown/local.

## 3. GitHub

Create a repository and upload the project code. Do not commit `.env.local`; it is excluded by `.gitignore`.

## 4. Vercel

1. In Vercel, choose `Add New -> Project`.
2. Import the GitHub repository.
3. Add these Environment Variables in `Settings -> Environment Variables`:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `ADMIN_PASSWORD`
   - `ADMIN_SECRET`
4. Deploy.

After deployment, links can look like:

- `https://your-project.vercel.app/tg`
- `https://your-project.vercel.app/instagram`
- `https://your-project.vercel.app/facebook`

You can later connect a custom domain such as `brand.link`, producing URLs like `https://brand.link/tg`.

## Link groups

Create groups such as `Patreon`, `GitHub`, or `YouTube` and assign any tracking link to one group. Groups are used to organize the admin list; links can be moved between groups at any time. Deleting a group does **not** delete its links — those links become ungrouped.

## Public demo

The login screen includes an `Open demo` button. `/demo` uses static sample data only: it does not connect to Supabase, does not record clicks, and does not grant admin permissions. It is intended for showing the interface and basic analytics flow.

## Aggregated statistics

TrackLink calculates statistics in PostgreSQL/Supabase views instead of loading all raw click records into the dashboard.

The dashboard contains four periods:

- Today — based on the `Europe/Kyiv` calendar date;
- Last 7 days — today plus the previous six calendar days;
- Month — the current calendar month;
- All time.

Each period shows:

- unique visitors;
- total clicks.

Clicking a period opens its detailed records. To keep the admin page responsive, the detail view shows up to the latest 100 matching records while also displaying the full matching count.

## How unique visitors are counted

On the first counted visit, TrackLink stores an anonymous `tt_visitor` cookie containing a random UUID. Later visits from the same browser reuse that ID.

This is **not an absolute user identity**. Another browser, device, cleared cookies, or some in-app browsers can create a new ID. Treat `Unique Visitors` as an approximation.

## Country detection and privacy

On Vercel, TrackLink reads the platform-provided `x-vercel-ip-country` request header and stores only the two-letter country code in the click record.

IP addresses are not stored by TrackLink. IP-based country detection is approximate. Existing records from versions before v0.2.0 do not contain a country value.

## Social preview bots

Telegram, Facebook, LinkedIn, and similar platforms can open URLs automatically to generate link previews. These requests should not count as human clicks. `lib/bots.ts` filters common preview/crawler user agents, and HEAD requests are ignored.

## Data structure

`link_groups` stores optional link groups.

`links` stores tracking links and an optional `group_id`.

`clicks` stores each counted redirect with:

- `link_id`;
- anonymous `visitor_id`;
- `country_code`;
- user-agent;
- timestamp.

The old `referrer` field is removed in v0.2.0.

## Reserved slugs

Because tracking links now live at the domain root, these system paths cannot be used as link slugs:

- `admin`
- `login`
- `demo`
- `go`
- `api`
- `_next`

## Troubleshooting

### Admin page shows a Supabase error after upgrading

Run the latest `supabase/schema.sql` again in Supabase SQL Editor. Version v0.3.0 requires the link-groups table/column in addition to the v0.2.0 analytics fields and views.

Also check:

- `SUPABASE_URL` in `.env.local`;
- `SUPABASE_SECRET_KEY` must be a server Secret key in the form `sb_secret_...`, not `sb_publishable_...`.

Restart `npm run dev` after changing `.env.local`.

### Hydration mismatch in development

If the warning contains foreign attributes such as `bis_skin_checked`, `bis_register`, or `__processed_...`, a browser extension is modifying the HTML before React hydrates it. Test in an incognito window or temporarily disable the extension for `localhost`.

## v0.6.0 updates

- English-only UI; the EN/UA language switcher and Ukrainian translation bundle were removed.
- Demo uses sample visitors from a range of countries other than Ukraine. The demo never accesses the database.
- In **Click details**, each real record now has a **Delete** button and confirmation dialog. Deleting a click is permanent and immediately changes summary statistics.
- The demo table also supports deletion, but only in browser memory; refreshing restores its sample rows.
- The 14-day chart starts with **Today**, then **Yesterday**, followed by older dates; days without clicks show zero.

There is no SQL migration for this version. Previous migrations (including v0.5.0 link ordering) still apply to older installations.

## v0.7.0 — Android PWA and Web Push notifications

TrackLink can be installed as a PWA on Android from Chrome, and can send system notifications even when the site is closed. A mobile-native APK is not needed. HTTPS is required in production; `http://localhost` is permitted for development.

**Push is opt-in and admin-only.** Only a logged-in TrackLink administrator can enable push on a device. Visitors who open your short tracking links do not see any push permission prompt. The public demo does not connect to push or the database.

### 1. Apply the Supabase migration

In your Supabase project's **SQL Editor**, run:

```text
supabase/migrations/v0.7.0_push_notifications.sql
```

It creates `push_subscriptions`, `push_preferences`, `push_daily_dispatches`, and the `tracklink_push_daily_stats()` database function. It does **not** delete, rewrite, or reset existing links/clicks. Existing tracking URLs continue to work. For fresh installs, the complete `supabase/schema.sql` includes this migration.

### 2. Generate VAPID keys

In a terminal inside the TrackLink project folder, run:

```bash
npm run vapid:generate
```

This prints `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. **Generate them once per TrackLink installation** and keep them stable — rotating them invalidates existing browser push subscriptions. Never commit private keys, `.env.local`, or a cron secret to GitHub.

Add these new environment variables to `.env.local` **and** Vercel Project → Settings → Environment Variables:

```env
VAPID_PUBLIC_KEY=<generated-public-key>
VAPID_PRIVATE_KEY=<generated-private-key>
VAPID_SUBJECT=mailto:you@your-real-domain.example
CRON_SECRET=<separate-random-secret-of-16-or-more-characters>
```

Replace the placeholder subject with a **real** contact email address (or a valid `https://` contact URL). Some push services reject invalid VAPID subjects. Keep existing variables `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD` and `ADMIN_SECRET` unchanged.

Restart the local Next.js server after editing `.env.local`. Redeploy Vercel after adding environment variables there.

### 3. Install and enable notifications on Android

1. Open the **production HTTPS** TrackLink address in **Chrome on Android**, for example `https://your-domain.com/admin`.
2. Log in to your TrackLink admin account.
3. Chrome menu → **Add to Home screen** / **Install app** (wording depends on Android and Chrome versions).
4. Open the installed TrackLink app, find **Notifications / PWA**, tap **Enable notifications**, and allow notifications when Android/Chrome asks.
5. Tap **Send test push** to check delivery.
6. Choose preferences and tap **Save settings**.

The PWA has a TrackLink icon, `standalone` display mode, and a service worker that handles push events. It does not cache tracking redirects or analytics pages for offline use.

### Push preferences

- **Every click:** off by default (can generate a lot of notifications).
- **New unique visitor:** on by default, using TrackLink's anonymous browser cookie ID.
- **Click milestones:** on by default (100, 500, 1,000, 2,000, 3,000… clicks per link).
- **Daily summary:** off by default. Summarizes *yesterday's* clicks and unique visitors using `Europe/Kyiv` calendar dates.

Options apply to **all registered devices** (up to 10). Notification events are sent on a best-effort basis after a successful click insert; analytics/redirects never depend on successful push delivery. Because the browser push provider and Android control final delivery, arrival is not guaranteed or precisely timed. New-visitor and milestone detection may be approximate under high concurrent traffic. There is no push notification for simulated demo clicks.

### Daily summaries — Vercel Cron

`vercel.json` schedules `/api/cron/daily-summary` at **07:00 UTC once per day** (roughly 09:00 or 10:00 Kyiv time depending on daylight saving). This is compatible with Vercel Hobby's daily cron frequency restriction; on Hobby the job may start at any time within the scheduled hour. The endpoint requires `Authorization: Bearer <CRON_SECRET>`. Without `CRON_SECRET`, requests return HTTP 401. Set it in Vercel project environment variables before deploying.

A `push_daily_dispatches` table prevents routine duplicate sends for the same calendar day. The notification is sent only if `Daily summary` is enabled. For an empty day, the message reports zero clicks.

### Troubleshooting

- **Push settings show a database error:** apply the `v0.7.0` SQL migration, then refresh the page. Check your Supabase project and API key.
- **Push not configured:** set all three `VAPID_...` values, restart/redeploy, then refresh.
- **Permission denied:** allow notifications in Android system settings and browser site settings, then retry.
- **No push on a device:** use `Send test push`, check internet/notifications/battery restrictions, and resubscribe when the subscription expires.
- **No daily summary:** enable the preference, ensure `CRON_SECRET` is set, and review the Vercel Cron logs.
- **No Install app button:** use the Android Chrome menu; browser support and installation choices vary.

### Security and privacy

Push subscriptions (device-specific endpoints and public encryption material) are stored in **Supabase with RLS enabled and no public policies**. Push API endpoints require the authenticated admin cookie, and mutations check their request origin. The private VAPID signing key stays on the server. `push_subscriptions` are deleted automatically when a push service reports expiration (HTTP 404/410). TrackLink does not add IP storage or expose visitor names.
