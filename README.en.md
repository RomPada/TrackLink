# TrackLink

Version: **v0.1.2**

TrackLink is a small self-hosted click tracker for Telegram, Facebook, Instagram, ads, email campaigns, Patreon links, and other traffic sources.

Example links:

- `https://your-domain.com/go/tg`
- `https://your-domain.com/go/instagram`
- `https://your-domain.com/go/fb`

All links can redirect to the same destination while keeping separate statistics for each slug.

## Features

- unlimited tracking links;
- redirect route `/go/[slug]`;
- total click count;
- approximate unique visitors via anonymous cookie ID;
- 24-hour and 7-day stats;
- 14-day activity chart;
- edit name, slug, and destination URL;
- enable or disable links;
- delete links;
- password-protected admin area;
- filtering of major social preview bots and browser prefetch requests;
- no IP address storage.

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

After deployment, you can create links such as:

- `https://your-project.vercel.app/go/tg`
- `https://your-project.vercel.app/go/instagram`
- `https://your-project.vercel.app/go/facebook`

You can later connect a custom domain such as `go.brand.com`.

## How unique visitors are counted

On the first tracked visit, TrackLink stores an anonymous `tt_visitor` cookie containing a random UUID. Later visits from the same browser reuse that ID.

This is **not an absolute user identity**. Another browser, device, cleared cookies, or some in-app browsers can create a new ID. Treat `Unique Visitors` as an approximation.

## Social preview bots

Telegram, Facebook, LinkedIn, and similar platforms can open URLs automatically to generate link previews. These requests should not count as human clicks. `lib/bots.ts` filters common preview/crawler user agents, and HEAD requests are ignored.

## Data structure

`links` stores tracking links.

`clicks` stores each counted redirect with:

- `link_id`;
- anonymous `visitor_id`;
- referrer;
- user-agent;
- timestamp.

IP addresses are not stored.

## Possible next improvements

The current architecture can later support:

- UTM parameters;
- CSV/Excel export;
- custom date ranges;
- QR codes;
- campaign groups;
- multiple administrators;
- Supabase Auth instead of one shared password;
- webhook or Telegram notifications;
- a custom short domain such as `go.brand.com/tg`.
