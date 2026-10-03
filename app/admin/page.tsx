import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import CopyButton from "@/components/CopyButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PeriodStatsGrid, { type PeriodKey, type PeriodStats } from "@/components/PeriodStatsGrid";
import {
  createGroupAction,
  createLinkAction,
  deleteGroupAction,
  deleteLinkAction,
  logoutAction,
  toggleLinkAction,
  updateGroupAction,
  updateLinkAction,
} from "@/app/actions";
import { isAdmin } from "@/lib/auth";
import { APP_NAME, APP_VERSION } from "@/lib/app-meta";
import {
  linksCountLabel,
  localeFor,
  translations,
  type Language,
} from "@/lib/i18n";
import { getLanguage } from "@/lib/language";
import { getSupabaseAdmin } from "@/lib/supabase";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type LinkGroup = { id: string; name: string; created_at: string };
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
  group_id: string | null;
  group_name: string | null;
};
type DailyStat = { day: string; clicks: number | string };
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
  group_id: string | null;
  group_name: string | null;
};

function number(value: number | string | null | undefined, language: Language) {
  return Number(value ?? 0).toLocaleString(localeFor(language));
}

function formatDate(value: string | null, language: Language) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(localeFor(language), {
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
  const get = (type: "year" | "month" | "day") => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function shiftDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function displayDateKey(dateKey: string, language: Language) {
  return new Intl.DateTimeFormat(localeFor(language), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

function parsePeriod(value: string | string[] | undefined): PeriodKey | null {
  if (typeof value !== "string") return null;
  return ["today", "week", "month", "all"].includes(value) ? (value as PeriodKey) : null;
}

function periodLabel(period: PeriodKey, todayLabel: string, language: Language) {
  const text = translations[language].period;
  if (period === "today") return `${text.today} · ${todayLabel}`;
  if (period === "week") return text.week;
  if (period === "month") return text.month;
  return text.all;
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
}): PeriodStats {
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

function deviceLabel(userAgent: string | null, language: Language) {
  const text = translations[language].device;
  if (!userAgent) return text.unknown;
  if (/ipad|tablet/i.test(userAgent)) return text.tablet;
  if (/mobile|iphone|android/i.test(userAgent)) return text.mobile;
  return text.computer;
}

function countryLabel(countryCode: string | null, language: Language) {
  if (!countryCode) return translations[language].device.unknownCountry;
  try {
    const names = new Intl.DisplayNames([language], { type: "region" });
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

  const [params, baseUrl, language] = await Promise.all([searchParams, getBaseUrl(), getLanguage()]);
  const text = translations[language];
  const ok = typeof params.ok === "string" ? params.ok : "";
  const errorMessage = typeof params.error === "string" ? params.error : "";
  const selectedPeriod = parsePeriod(params.period);
  const requestedLinkId = typeof params.link === "string" ? params.link : null;

  const todayKey = kyivDateKey();
  const todayLabel = displayDateKey(todayKey, language);
  const weekStartKey = shiftDateKey(todayKey, -6);
  const monthStartKey = `${todayKey.slice(0, 7)}-01`;

  let groups: LinkGroup[] = [];
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
    const [groupsResult, linksResult, overallResult, dailyResult] = await Promise.all([
      supabase.from("link_groups").select("*").order("name", { ascending: true }),
      supabase.from("link_stats").select("*").order("created_at", { ascending: false }),
      supabase.from("overall_stats").select("*").maybeSingle(),
      supabase.from("daily_stats").select("*").order("day", { ascending: true }).limit(14),
    ]);

    const firstError = groupsResult.error ?? linksResult.error ?? overallResult.error ?? dailyResult.error;
    if (firstError) {
      const details = [firstError.code, firstError.message, firstError.details, firstError.hint].filter(Boolean).join(" · ");
      databaseError = details || text.dashboard.unknownDatabaseError;
    } else if (overallResult.data && !("today_clicks" in overallResult.data)) {
      databaseError = text.dashboard.schemaOutdated;
    } else {
      groups = (groupsResult.data ?? []) as LinkGroup[];
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

      const selectedLinkForQuery = requestedLinkId ? links.find((link) => link.id === requestedLinkId) ?? null : null;
      if (selectedPeriod) {
        let recordQuery = supabase
          .from("click_records")
          .select("*", { count: "exact" })
          .order("clicked_at", { ascending: false })
          .limit(100);

        if (selectedLinkForQuery) recordQuery = recordQuery.eq("link_id", selectedLinkForQuery.id);
        if (selectedPeriod === "today") recordQuery = recordQuery.eq("local_day", todayKey);
        if (selectedPeriod === "week") recordQuery = recordQuery.gte("local_day", weekStartKey).lte("local_day", todayKey);
        if (selectedPeriod === "month") recordQuery = recordQuery.gte("local_day", monthStartKey).lte("local_day", todayKey);

        const recordsResult = await recordQuery;
        if (recordsResult.error) {
          const details = [recordsResult.error.code, recordsResult.error.message, recordsResult.error.details, recordsResult.error.hint]
            .filter(Boolean)
            .join(" · ");
          databaseError = details || text.dashboard.recordsError;
        } else {
          records = (recordsResult.data ?? []) as ClickRecord[];
          recordCount = recordsResult.count ?? records.length;
        }
      }
    }
  } catch (error) {
    databaseError = error instanceof Error ? error.message : text.dashboard.connectionError;
  }

  const selectedLink = requestedLinkId ? links.find((link) => link.id === requestedLinkId) ?? null : null;
  const maxDaily = Math.max(1, ...daily.map((item) => Number(item.clicks)));
  const overallStats = toPeriodStats(overall);
  const latestClickAt = links.reduce<string | null>((latest, link) => {
    if (!link.last_click_at) return latest;
    if (!latest || new Date(link.last_click_at) > new Date(latest)) return link.last_click_at;
    return latest;
  }, null);
  const environment = process.env.VERCEL ? "Vercel" : process.env.NODE_ENV === "production" ? "Production" : "Local development";

  const linksByGroup = new Map<string | null, LinkStat[]>();
  for (const link of links) {
    const current = linksByGroup.get(link.group_id) ?? [];
    current.push(link);
    linksByGroup.set(link.group_id, current);
  }

  function renderLinkCard(link: LinkStat) {
    const trackingUrl = `${baseUrl}/${link.slug}`;
    const linkStats = toPeriodStats(link);

    return (
      <article className="link-card" key={link.id}>
        <div className="link-card-main">
          <div className="link-title-row">
            <div>
              <div className="link-name-line">
                <h3>{link.name}</h3>
                {link.group_name ? <span className="group-badge">{link.group_name}</span> : null}
              </div>
              <div className="tracking-url">{trackingUrl}</div>
              <div className="link-last-click">{text.common.lastClick} {formatDate(link.last_click_at, language)}</div>
            </div>
            <span className={`status ${link.is_active ? "status-on" : "status-off"}`}>
              {link.is_active ? text.common.active : text.common.paused}
            </span>
          </div>

          <div className="inline-actions">
            <CopyButton value={trackingUrl} language={language} />
            <a className="button button-ghost button-small" href={`${trackingUrl}?test=1`} target="_blank" rel="noreferrer">
              {text.common.check}
            </a>
          </div>

          <PeriodStatsGrid
            stats={linkStats}
            todayLabel={todayLabel}
            language={language}
            linkId={link.id}
            selectedPeriod={selectedPeriod}
            selectedLinkId={selectedLink?.id ?? null}
            compact
          />

          <div className="destination">
            <span>{text.common.destination}</span>
            <a href={link.destination_url} target="_blank" rel="noreferrer">{link.destination_url}</a>
          </div>
        </div>

        <details className="link-settings">
          <summary>{text.common.settings}</summary>
          <form action={updateLinkAction} className="form-grid compact-form">
            <input type="hidden" name="id" value={link.id} />
            <label>{text.createLink.name}<input name="name" defaultValue={link.name} required /></label>
            <label>{text.createLink.slug}<input name="slug" defaultValue={link.slug} pattern="[A-Za-z0-9_-]+" required /></label>
            <label>
              {text.createLink.group}
              <select name="groupId" defaultValue={link.group_id ?? ""}>
                <option value="">{text.common.noGroup}</option>
                {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </label>
            <label className="wide">
              {text.createLink.destination}
              <input name="destinationUrl" type="url" defaultValue={link.destination_url} required />
            </label>
            <div className="wide form-actions">
              <button className="button button-primary button-small" type="submit">{text.common.save}</button>
            </div>
          </form>

          <div className="danger-row">
            <form action={toggleLinkAction}>
              <input type="hidden" name="id" value={link.id} />
              <input type="hidden" name="nextValue" value={String(!link.is_active)} />
              <button className="button button-ghost button-small" type="submit">
                {link.is_active ? text.common.disable : text.common.enable}
              </button>
            </form>
            <form action={deleteLinkAction}>
              <input type="hidden" name="id" value={link.id} />
              <ConfirmSubmitButton
                label={text.common.delete}
                title={text.yourLinks.confirmTitle}
                message={text.yourLinks.confirmBody}
                cancelLabel={text.common.cancel}
                confirmLabel={text.common.delete}
              />
            </form>
          </div>
        </details>
      </article>
    );
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">{APP_NAME}</div>
          <h1>{text.dashboard.title}</h1>
          <p className="muted version-note">{APP_VERSION}</p>
        </div>
        <div className="topbar-actions">
          <LanguageSwitcher language={language} />
          <form action={logoutAction}>
            <button className="button button-ghost" type="submit">{text.common.logout}</button>
          </form>
        </div>
      </header>

      {ok ? <div className="alert alert-success">{ok}</div> : null}
      {errorMessage ? <div className="alert alert-error">{errorMessage}</div> : null}

      {databaseError ? (
        <section className="database-error">
          <h2>{text.dashboard.databaseErrorTitle}</h2>
          <p>{databaseError}</p>
          <div className="database-error-help">{text.dashboard.databaseErrorHelp}</div>
        </section>
      ) : null}

      <section className="panel system-panel">
        <div className="panel-heading"><div><h2>System / Database</h2><p className="muted">{text.dashboard.systemDescription}</p></div></div>
        <div className="system-grid">
          <article className="system-card">
            <div className="system-card-heading"><strong>{text.dashboard.system}</strong><span className="status status-on">{text.dashboard.online}</span></div>
            <dl>
              <div><dt>{text.dashboard.version}</dt><dd>{APP_VERSION}</dd></div>
              <div><dt>{text.dashboard.environment}</dt><dd>{environment}</dd></div>
              <div><dt>{text.dashboard.shortUrl}</dt><dd>/&#123;slug&#125;</dd></div>
            </dl>
          </article>
          <article className="system-card">
            <div className="system-card-heading"><strong>{text.dashboard.database}</strong><span className={`status ${databaseError ? "status-off" : "status-on"}`}>{databaseError ? "Error" : text.dashboard.connected}</span></div>
            <dl>
              <div><dt>{text.dashboard.service}</dt><dd>Supabase / PostgreSQL</dd></div>
              <div><dt>{text.dashboard.groups}</dt><dd>{number(groups.length, language)}</dd></div>
              <div><dt>{text.dashboard.links}</dt><dd>{number(links.length, language)}</dd></div>
              <div><dt>{text.dashboard.clickRecords}</dt><dd>{number(overall.total_clicks, language)}</dd></div>
              <div><dt>{text.dashboard.lastRecord}</dt><dd>{formatDate(latestClickAt, language)}</dd></div>
            </dl>
          </article>
        </div>
      </section>

      <section className="stats-section">
        <PeriodStatsGrid stats={overallStats} todayLabel={todayLabel} language={language} selectedPeriod={selectedPeriod} selectedLinkId={selectedLink?.id ?? null} />
      </section>

      {selectedPeriod ? (
        <section className="panel records-panel" id="records">
          <div className="panel-heading records-heading">
            <div>
              <div className="eyebrow">{text.dashboard.detailsEyebrow}</div>
              <h2>{periodLabel(selectedPeriod, todayLabel, language)} · {selectedLink ? selectedLink.name : text.dashboard.allLinks}</h2>
              <p className="muted">{text.dashboard.privacy}</p>
            </div>
            <a className="button button-ghost button-small" href="/admin">{text.common.close}</a>
          </div>
          <div className="records-summary">
            {text.dashboard.found} <strong>{number(recordCount, language)}</strong>
            {recordCount > 100 ? ` · ${text.dashboard.shown100}` : ""}
          </div>
          {records.length === 0 ? <div className="empty-state">{text.dashboard.noPeriodClicks}</div> : (
            <div className="records-table-wrap">
              <table className="records-table">
                <thead><tr><th>{text.dashboard.when}</th><th>{text.dashboard.visitor}</th><th>{text.dashboard.country}</th><th>{text.dashboard.group}</th><th>{text.dashboard.sourceLink}</th><th>{text.dashboard.clickedTo}</th></tr></thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="nowrap">{formatDate(record.clicked_at, language)}</td>
                      <td><code>{shortVisitorId(record.visitor_id)}</code><span className="record-secondary">{deviceLabel(record.user_agent, language)}</span></td>
                      <td>{countryLabel(record.country_code, language)}</td>
                      <td>{record.group_name ?? text.common.noGroup}</td>
                      <td><strong>{record.link_name}</strong><span className="record-secondary">/{record.slug}</span></td>
                      <td className="record-destination"><a href={record.destination_url} target="_blank" rel="noreferrer">{record.destination_url}</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-heading"><div><h2>{text.dashboard.last14}</h2><p className="muted">{text.dashboard.last14Description}</p></div></div>
        <div className="bars">
          {daily.length === 0 ? <p className="muted">{text.dashboard.noClicksYet}</p> : daily.map((item) => {
            const clicks = Number(item.clicks);
            const height = Math.max(8, Math.round((clicks / maxDaily) * 120));
            return (
              <div className="bar-item" key={item.day} title={`${item.day}: ${clicks}`}>
                <span className="bar-value">{clicks}</span><div className="bar" style={{ height }} />
                <span className="bar-label">{new Intl.DateTimeFormat(localeFor(language), { day: "2-digit", month: "2-digit" }).format(new Date(`${item.day}T12:00:00Z`))}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>{text.groups.title}</h2><p className="muted">{text.groups.description}</p></div></div>
        <form action={createGroupAction} className="group-create-form">
          <label>{text.groups.newGroup}<input name="name" placeholder={text.groups.placeholder} required maxLength={80} /></label>
          <button className="button button-primary" type="submit">{text.groups.create}</button>
        </form>

        {groups.length > 0 ? (
          <div className="group-manager-list">
            {groups.map((group) => (
              <div className="group-manager-row" key={group.id}>
                <form action={updateGroupAction} className="group-rename-form">
                  <input type="hidden" name="id" value={group.id} />
                  <input name="name" defaultValue={group.name} required maxLength={80} />
                  <button className="button button-ghost button-small" type="submit">{text.common.rename}</button>
                </form>
                <div className="group-manager-meta">{linksCountLabel(linksByGroup.get(group.id)?.length ?? 0, language)}</div>
                <form action={deleteGroupAction}>
                  <input type="hidden" name="id" value={group.id} />
                  <ConfirmSubmitButton
                    label={text.common.delete}
                    title={text.groups.confirmTitle}
                    message={text.groups.confirmBody}
                    cancelLabel={text.common.cancel}
                    confirmLabel={text.common.delete}
                  />
                </form>
              </div>
            ))}
          </div>
        ) : <div className="empty-state group-empty">{text.groups.noGroups}</div>}
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>{text.createLink.title}</h2><p className="muted">{text.createLink.description}</p></div></div>
        <form action={createLinkAction} className="form-grid">
          <label>{text.createLink.name}<input name="name" placeholder="Telegram" required /></label>
          <label>{text.createLink.slug}<input name="slug" placeholder="tg" pattern="[A-Za-z0-9_-]+" required /></label>
          <label>
            {text.createLink.group}
            <select name="groupId" defaultValue=""><option value="">{text.common.noGroup}</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
          </label>
          <label className="wide">{text.createLink.destination}<input name="destinationUrl" type="url" placeholder="https://patreon.com/yourname" required /></label>
          <div className="wide form-actions"><button className="button button-primary" type="submit">{text.createLink.create}</button></div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>{text.yourLinks.title}</h2><p className="muted">{text.yourLinks.description}</p></div></div>
        {links.length === 0 ? <div className="empty-state">{text.yourLinks.empty}</div> : (
          <div className="link-groups-list">
            {groups.map((group) => {
              const groupLinks = linksByGroup.get(group.id) ?? [];
              if (groupLinks.length === 0) return null;
              return (
                <details className="link-group" key={group.id} open>
                  <summary className="link-group-heading"><span>{group.name}</span><span className="link-group-count">{linksCountLabel(groupLinks.length, language)}</span></summary>
                  <div className="link-list">{groupLinks.map(renderLinkCard)}</div>
                </details>
              );
            })}
            {(linksByGroup.get(null)?.length ?? 0) > 0 ? (
              <details className="link-group link-group-ungrouped" open>
                <summary className="link-group-heading"><span>{text.common.noGroup}</span><span className="link-group-count">{linksCountLabel(linksByGroup.get(null)?.length ?? 0, language)}</span></summary>
                <div className="link-list">{(linksByGroup.get(null) ?? []).map(renderLinkCard)}</div>
              </details>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
