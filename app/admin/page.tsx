import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import PeriodStatsGrid, {
  type PeriodKey,
  type PeriodStats,
} from "@/components/PeriodStatsGrid";
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
  today_clicks: number | string;
  today_unique: number | string;
  clicks_7d: number | string;
  unique_7d: number | string;
  month_clicks: number | string;
  month_unique: number | string;
};

type DailyStat = {
  day: string;
  clicks: number | string;
};

type ClickRecord = {
  id: number | string;
  link_id: string;
  link_name: string;
  slug: string;
  destination_url: string;
  visitor_id: string;
  country_code: string | null;
  user_agent: string | null;
  clicked_at: string;
  local_day: string;
};

function number(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString("uk-UA");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function kyivDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function shiftDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function displayDateKey(dateKey: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

function parsePeriod(value: string | string[] | undefined): PeriodKey | null {
  if (typeof value !== "string") return null;
  return ["today", "week", "month", "all"].includes(value)
    ? (value as PeriodKey)
    : null;
}

function periodLabel(period: PeriodKey, todayLabel: string) {
  if (period === "today") return `Сьогодні · ${todayLabel}`;
  if (period === "week") return "За останні 7 днів";
  if (period === "month") return "За місяць";
  return "Всього";
}

function toPeriodStats(source: {
  today_clicks?: number | string | null;
  today_unique?: number | string | null;
  clicks_7d?: number | string | null;
  unique_7d?: number | string | null;
  month_clicks?: number | string | null;
  month_unique?: number | string | null;
  total_clicks?: number | string | null;
  unique_visitors?: number | string | null;
  clicks?: number | string | null;
}) : PeriodStats {
  return {
    todayClicks: Number(source.today_clicks ?? 0),
    todayUnique: Number(source.today_unique ?? 0),
    weekClicks: Number(source.clicks_7d ?? 0),
    weekUnique: Number(source.unique_7d ?? 0),
    monthClicks: Number(source.month_clicks ?? 0),
    monthUnique: Number(source.month_unique ?? 0),
    totalClicks: Number(source.total_clicks ?? source.clicks ?? 0),
    totalUnique: Number(source.unique_visitors ?? 0),
  };
}

function shortVisitorId(value: string) {
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function deviceLabel(userAgent: string | null) {
  if (!userAgent) return "Невідомий пристрій";
  if (/ipad|tablet/i.test(userAgent)) return "Планшет";
  if (/mobile|iphone|android/i.test(userAgent)) return "Мобільний";
  return "Компʼютер";
}

function countryLabel(countryCode: string | null) {
  if (!countryCode) return "Невідомо / локально";

  try {
    const names = new Intl.DisplayNames(["uk"], { type: "region" });
    return `${names.of(countryCode) ?? countryCode} (${countryCode})`;
  } catch {
    return countryCode;
  }
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
  const selectedPeriod = parsePeriod(params.period);
  const requestedLinkId = typeof params.link === "string" ? params.link : null;

  const todayKey = kyivDateKey();
  const todayLabel = displayDateKey(todayKey);
  const weekStartKey = shiftDateKey(todayKey, -6);
  const monthStartKey = `${todayKey.slice(0, 7)}-01`;

  let links: LinkStat[] = [];
  let overall = {
    total_clicks: 0,
    unique_visitors: 0,
    clicks_7d: 0,
    unique_7d: 0,
    today_clicks: 0,
    today_unique: 0,
    month_clicks: 0,
    month_unique: 0,
  };
  let daily: DailyStat[] = [];
  let records: ClickRecord[] = [];
  let recordCount = 0;
  let databaseError = "";

  try {
    const supabase = getSupabaseAdmin();
    const [linksResult, overallResult, dailyResult] = await Promise.all([
      supabase.from("link_stats").select("*").order("created_at", { ascending: false }),
      supabase.from("overall_stats").select("*").maybeSingle(),
      supabase.from("daily_stats").select("*").order("day", { ascending: true }).limit(14),
    ]);

    const firstError = linksResult.error ?? overallResult.error ?? dailyResult.error;

    if (firstError) {
      const details = [firstError.code, firstError.message, firstError.details, firstError.hint]
        .filter(Boolean)
        .join(" · ");
      databaseError = details || "Supabase повернув невідому помилку.";
    } else if (
      overallResult.data &&
      !("today_clicks" in overallResult.data)
    ) {
      databaseError = "Схема Supabase застаріла. Виконай актуальний supabase/schema.sql для TrackLink v0.2.0.";
      links = (linksResult.data ?? []) as LinkStat[];
    } else {
      links = (linksResult.data ?? []) as LinkStat[];
      overall = {
        total_clicks: Number(overallResult.data?.total_clicks ?? 0),
        unique_visitors: Number(overallResult.data?.unique_visitors ?? 0),
        clicks_7d: Number(overallResult.data?.clicks_7d ?? 0),
        unique_7d: Number(overallResult.data?.unique_7d ?? 0),
        today_clicks: Number(overallResult.data?.today_clicks ?? 0),
        today_unique: Number(overallResult.data?.today_unique ?? 0),
        month_clicks: Number(overallResult.data?.month_clicks ?? 0),
        month_unique: Number(overallResult.data?.month_unique ?? 0),
      };
      daily = (dailyResult.data ?? []) as DailyStat[];

      const selectedLink = requestedLinkId
        ? links.find((link) => link.id === requestedLinkId) ?? null
        : null;

      if (selectedPeriod) {
        let recordQuery = supabase
          .from("click_records")
          .select("*", { count: "exact" })
          .order("clicked_at", { ascending: false })
          .limit(100);

        if (selectedLink) recordQuery = recordQuery.eq("link_id", selectedLink.id);
        if (selectedPeriod === "today") recordQuery = recordQuery.eq("local_day", todayKey);
        if (selectedPeriod === "week") {
          recordQuery = recordQuery.gte("local_day", weekStartKey).lte("local_day", todayKey);
        }
        if (selectedPeriod === "month") {
          recordQuery = recordQuery.gte("local_day", monthStartKey).lte("local_day", todayKey);
        }

        const recordsResult = await recordQuery;
        if (recordsResult.error) {
          const details = [
            recordsResult.error.code,
            recordsResult.error.message,
            recordsResult.error.details,
            recordsResult.error.hint,
          ]
            .filter(Boolean)
            .join(" · ");
          databaseError = details || "Не вдалося завантажити записи переходів.";
        } else {
          records = (recordsResult.data ?? []) as ClickRecord[];
          recordCount = recordsResult.count ?? records.length;
        }
      }
    }
  } catch (error) {
    databaseError = error instanceof Error ? error.message : "Не вдалося підключитися до Supabase.";
  }

  const selectedLink = requestedLinkId
    ? links.find((link) => link.id === requestedLinkId) ?? null
    : null;
  const maxDaily = Math.max(1, ...daily.map((item) => Number(item.clicks)));
  const overallStats = toPeriodStats(overall);
  const latestClickAt = links.reduce<string | null>((latest, link) => {
    if (!link.last_click_at) return latest;
    if (!latest || new Date(link.last_click_at) > new Date(latest)) return link.last_click_at;
    return latest;
  }, null);
  const environment = process.env.VERCEL
    ? "Vercel"
    : process.env.NODE_ENV === "production"
      ? "Production"
      : "Local development";

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

      {databaseError ? (
        <section className="database-error">
          <h2>Не вдалося завантажити дані Supabase</h2>
          <p>{databaseError}</p>
          <div className="database-error-help">
            Перевір <code>SUPABASE_URL</code> і <code>SUPABASE_SECRET_KEY</code> у <code>.env.local</code>.
            Також виконай актуальний <code>supabase/schema.sql</code> у Supabase SQL Editor після оновлення TrackLink.
          </div>
        </section>
      ) : null}

      <section className="panel system-panel">
        <div className="panel-heading">
          <div>
            <h2>System / Database</h2>
            <p className="muted">Стан застосунку та бази даних без відображення секретних ключів.</p>
          </div>
        </div>
        <div className="system-grid">
          <article className="system-card">
            <div className="system-card-heading">
              <strong>System</strong>
              <span className="status status-on">Online</span>
            </div>
            <dl>
              <div><dt>Версія</dt><dd>{APP_VERSION}</dd></div>
              <div><dt>Середовище</dt><dd>{environment}</dd></div>
              <div><dt>Короткий URL</dt><dd>/{"{slug}"}</dd></div>
            </dl>
          </article>
          <article className="system-card">
            <div className="system-card-heading">
              <strong>Database</strong>
              <span className={`status ${databaseError ? "status-off" : "status-on"}`}>
                {databaseError ? "Error" : "Connected"}
              </span>
            </div>
            <dl>
              <div><dt>Сервіс</dt><dd>Supabase / PostgreSQL</dd></div>
              <div><dt>Посилань</dt><dd>{number(links.length)}</dd></div>
              <div><dt>Записів переходів</dt><dd>{number(overall.total_clicks)}</dd></div>
              <div><dt>Останній запис</dt><dd>{formatDate(latestClickAt)}</dd></div>
            </dl>
          </article>
        </div>
      </section>

      <section className="stats-section">
        <PeriodStatsGrid
          stats={overallStats}
          todayLabel={todayLabel}
          selectedPeriod={selectedPeriod}
          selectedLinkId={selectedLink?.id ?? null}
        />
      </section>

      {selectedPeriod ? (
        <section className="panel records-panel" id="records">
          <div className="panel-heading records-heading">
            <div>
              <div className="eyebrow">Деталі переходів</div>
              <h2>
                {periodLabel(selectedPeriod, todayLabel)}
                {selectedLink ? ` · ${selectedLink.name}` : " · усі посилання"}
              </h2>
              <p className="muted">
                Відвідувач визначається анонімним cookie ID. IP-адреса не зберігається.
              </p>
            </div>
            <a className="button button-ghost button-small" href="/admin">Закрити</a>
          </div>

          <div className="records-summary">
            Знайдено: <strong>{number(recordCount)}</strong>
            {recordCount > 100 ? " · показано 100 останніх записів" : ""}
          </div>

          {records.length === 0 ? (
            <div className="empty-state">За вибраний період переходів немає.</div>
          ) : (
            <div className="records-table-wrap">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Коли</th>
                    <th>Відвідувач</th>
                    <th>Країна</th>
                    <th>Посилання</th>
                    <th>Куди перейшов</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="nowrap">{formatDate(record.clicked_at)}</td>
                      <td>
                        <code>{shortVisitorId(record.visitor_id)}</code>
                        <span className="record-secondary">{deviceLabel(record.user_agent)}</span>
                      </td>
                      <td>{countryLabel(record.country_code)}</td>
                      <td>
                        <strong>{record.link_name}</strong>
                        <span className="record-secondary">/{record.slug}</span>
                      </td>
                      <td className="record-destination">
                        <a href={record.destination_url} target="_blank" rel="noreferrer">
                          {record.destination_url}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Останні 14 днів</h2>
            <p className="muted">Агрегована кількість зарахованих переходів по днях.</p>
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
            <p className="muted">Наприклад: Telegram → /tg → твій інтернет-магазин.</p>
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
              const trackingUrl = `${baseUrl}/${link.slug}`;
              const linkStats = toPeriodStats(link);

              return (
                <article className="link-card" key={link.id}>
                  <div className="link-card-main">
                    <div className="link-title-row">
                      <div>
                        <h3>{link.name}</h3>
                        <div className="tracking-url">{trackingUrl}</div>
                        <div className="link-last-click">Останній перехід: {formatDate(link.last_click_at)}</div>
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

                    <PeriodStatsGrid
                      stats={linkStats}
                      todayLabel={todayLabel}
                      linkId={link.id}
                      selectedPeriod={selectedPeriod}
                      selectedLinkId={selectedLink?.id ?? null}
                      compact
                    />

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
