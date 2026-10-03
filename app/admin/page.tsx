import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import {
  createLinkAction,
  deleteLinkAction,
  logoutAction,
  toggleLinkAction,
  updateLinkAction,
} from "@/app/actions";
import { isAdmin } from "@/lib/auth";
import { APP_NAME, APP_VERSION } from "@/lib/app-meta";
import { getSupabaseAdmin } from "@/lib/supabase";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type LinkStat = {
  id: string;
  name: string;
  slug: string;
  destination_url: string;
  is_active: boolean;
  created_at: string;
  clicks: number | string;
  unique_visitors: number | string;
  last_click_at: string | null;
};

type DailyStat = {
  day: string;
  clicks: number | string;
};

function number(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString("uk-UA");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  if (!(await isAdmin())) redirect("/login");

  const [params, baseUrl] = await Promise.all([searchParams, getBaseUrl()]);
  const ok = typeof params.ok === "string" ? params.ok : "";
  const errorMessage = typeof params.error === "string" ? params.error : "";

  const supabase = getSupabaseAdmin();
  const [linksResult, overallResult, dailyResult] = await Promise.all([
    supabase.from("link_stats").select("*").order("created_at", { ascending: false }),
    supabase.from("overall_stats").select("*").single(),
    supabase.from("daily_stats").select("*").order("day", { ascending: true }).limit(14),
  ]);

  if (linksResult.error) throw linksResult.error;
  if (overallResult.error) throw overallResult.error;
  if (dailyResult.error) throw dailyResult.error;

  const links = (linksResult.data ?? []) as LinkStat[];
  const overall = overallResult.data as {
    total_clicks: number | string;
    unique_visitors: number | string;
    clicks_7d: number | string;
    clicks_24h: number | string;
  };
  const daily = (dailyResult.data ?? []) as DailyStat[];
  const maxDaily = Math.max(1, ...daily.map((item) => Number(item.clicks)));

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">{APP_NAME}</div>
          <h1>Переходи за посиланнями</h1>
          <p className="muted version-note">{APP_VERSION}</p>
        </div>
        <form action={logoutAction}>
          <button className="button button-ghost" type="submit">Вийти</button>
        </form>
      </header>

      {ok ? <div className="alert alert-success">{ok}</div> : null}
      {errorMessage ? <div className="alert alert-error">{errorMessage}</div> : null}

      <section className="stats-grid">
        <article className="stat-card">
          <span>Всього переходів</span>
          <strong>{number(overall.total_clicks)}</strong>
        </article>
        <article className="stat-card">
          <span>Унікальні відвідувачі</span>
          <strong>{number(overall.unique_visitors)}</strong>
        </article>
        <article className="stat-card">
          <span>За 7 днів</span>
          <strong>{number(overall.clicks_7d)}</strong>
        </article>
        <article className="stat-card">
          <span>За 24 години</span>
          <strong>{number(overall.clicks_24h)}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Останні 14 днів</h2>
            <p className="muted">Кількість зарахованих переходів по днях.</p>
          </div>
        </div>
        <div className="bars">
          {daily.length === 0 ? (
            <p className="muted">Поки що переходів немає.</p>
          ) : (
            daily.map((item) => {
              const clicks = Number(item.clicks);
              const height = Math.max(8, Math.round((clicks / maxDaily) * 120));
              return (
                <div className="bar-item" key={item.day} title={`${item.day}: ${clicks}`}>
                  <span className="bar-value">{clicks}</span>
                  <div className="bar" style={{ height }} />
                  <span className="bar-label">
                    {new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "2-digit" }).format(
                      new Date(`${item.day}T12:00:00Z`)
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Створити нове посилання</h2>
            <p className="muted">Наприклад: Telegram → /go/tg → твій інтернет-магазин.</p>
          </div>
        </div>

        <form action={createLinkAction} className="form-grid">
          <label>
            Назва
            <input name="name" placeholder="Telegram" required />
          </label>
          <label>
            Slug
            <input name="slug" placeholder="tg" pattern="[A-Za-z0-9_-]+" required />
          </label>
          <label className="wide">
            Кінцева адреса
            <input name="destinationUrl" type="url" placeholder="https://shop.example.com" required />
          </label>
          <div className="wide form-actions">
            <button className="button button-primary" type="submit">Створити посилання</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Твої посилання</h2>
            <p className="muted">Превʼю-боти соцмереж і браузерний prefetch не зараховуються.</p>
          </div>
        </div>

        {links.length === 0 ? (
          <div className="empty-state">Створи перше посилання вище.</div>
        ) : (
          <div className="link-list">
            {links.map((link) => {
              const trackingUrl = `${baseUrl}/go/${link.slug}`;
              return (
                <article className="link-card" key={link.id}>
                  <div className="link-card-main">
                    <div className="link-title-row">
                      <div>
                        <h3>{link.name}</h3>
                        <div className="tracking-url">{trackingUrl}</div>
                      </div>
                      <span className={`status ${link.is_active ? "status-on" : "status-off"}`}>
                        {link.is_active ? "Активне" : "Вимкнене"}
                      </span>
                    </div>

                    <div className="inline-actions">
                      <CopyButton value={trackingUrl} />
                      <a className="button button-ghost button-small" href={`${trackingUrl}?test=1`} target="_blank" rel="noreferrer">
                        Перевірити
                      </a>
                    </div>

                    <div className="mini-stats">
                      <div><span>Переходи</span><strong>{number(link.clicks)}</strong></div>
                      <div><span>Унікальні</span><strong>{number(link.unique_visitors)}</strong></div>
                      <div><span>Останній</span><strong className="small-strong">{formatDate(link.last_click_at)}</strong></div>
                    </div>

                    <div className="destination">
                      <span>Куди веде:</span>
                      <a href={link.destination_url} target="_blank" rel="noreferrer">{link.destination_url}</a>
                    </div>
                  </div>

                  <details className="link-settings">
                    <summary>Налаштування</summary>
                    <form action={updateLinkAction} className="form-grid compact-form">
                      <input type="hidden" name="id" value={link.id} />
                      <label>
                        Назва
                        <input name="name" defaultValue={link.name} required />
                      </label>
                      <label>
                        Slug
                        <input name="slug" defaultValue={link.slug} pattern="[A-Za-z0-9_-]+" required />
                      </label>
                      <label className="wide">
                        Кінцева адреса
                        <input name="destinationUrl" type="url" defaultValue={link.destination_url} required />
                      </label>
                      <div className="wide form-actions">
                        <button className="button button-primary button-small" type="submit">Зберегти</button>
                      </div>
                    </form>

                    <div className="danger-row">
                      <form action={toggleLinkAction}>
                        <input type="hidden" name="id" value={link.id} />
                        <input type="hidden" name="nextValue" value={String(!link.is_active)} />
                        <button className="button button-ghost button-small" type="submit">
                          {link.is_active ? "Вимкнути" : "Увімкнути"}
                        </button>
                      </form>
                      <form action={deleteLinkAction}>
                        <input type="hidden" name="id" value={link.id} />
                        <button className="button button-danger button-small" type="submit">Видалити</button>
                      </form>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
