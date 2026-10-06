# TrackLink

Version: **v0.4.2**


TrackLink is a small self-hosted redirect and click analytics app for Telegram, Facebook, Instagram, ads, email campaigns, Patreon links, and other traffic sources.

Ukrainian documentation: [README.ua.md](./README.ua.md)  
Release history: [PATCHLIST.md](./PATCHLIST.md)  
Development roadmap: [ROADMAP.md](./ROADMAP.md)

Short tracking URLs look like this:

- `https://your-domain.com/tg`
- `https://your-domain.com/instagram`
- `https://your-domain.com/fb`

All links can redirect to the same destination while keeping separate statistics for each slug.

## Features

- unlimited tracking links;
- English is the default UI language with an EN / UA switcher on login, admin, and demo pages;
- deletion confirmation dialogs for links and groups;
- public `/demo` page with static sample data and no Supabase/admin access;
- link groups for organizing destinations or campaigns such as Patreon, GitHub, and YouTube;
- pastel background color presets for every group;
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

## Important upgrade step

If you see `Could not find the background_color column ... in the schema cache`, run `supabase/migrations/v0.4.2_group_colors.sql` in Supabase SQL Editor. The migration also asks PostgREST to refresh its schema cache.

Version `v0.4.2` requires the group-color migration once. You can either run the full current `supabase/schema.sql` or only `supabase/migrations/v0.4.2_group_colors.sql`. Both are safe for an existing TrackLink database.

After updating the code, open **Supabase -> SQL Editor** and run the current file:

```text
supabase/schema.sql
```

The script is designed to upgrade an existing TrackLink database. It keeps the v0.2.0 analytics/country changes, adds the `link_groups` table plus `group_id` on tracking links, and adds `background_color` for colored group sections. Existing links remain valid and are placed in `No group` until you assign them.

Existing click records remain in the database. Old records will not have country information because it was not collected before v0.2.0.

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
