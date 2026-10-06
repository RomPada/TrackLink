import CopyButton from "@/components/CopyButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PeriodStatsGrid, { type PeriodKey, type PeriodStats } from "@/components/PeriodStatsGrid";
import { APP_NAME, APP_VERSION } from "@/lib/app-meta";
import { linksCountLabel, localeFor, translations, type Language } from "@/lib/i18n";
import { getLanguage } from "@/lib/language";
import { DEFAULT_GROUP_COLOR } from "@/lib/group-colors";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type DemoGroup = {
  name: string;
  color: string;
};

type DemoLink = {
  id: string;
  name: string;
  slug: string;
  destination: string;
  group: string;
  stats: PeriodStats;
  lastClickMinutes: number;
};

type DemoRecord = {
  id: string;
  linkId: string;
  date: Date;
  visitor: string;
  countryCode: string;
  device: "mobile" | "computer" | "tablet";
  group: string;
  linkName: string;
  slug: string;
  destination: string;
};

function parsePeriod(value: string | string[] | undefined): PeriodKey | null {
  if (typeof value !== "string") return null;
  return ["today", "week", "month", "all"].includes(value) ? (value as PeriodKey) : null;
}

function dateLabel(language: Language) {
  return new Intl.DateTimeFormat(localeFor(language), {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function periodLabel(period: PeriodKey, todayLabel: string, language: Language) {
  const text = translations[language].period;
  if (period === "today") return `${text.today} · ${todayLabel}`;
  if (period === "week") return text.week;
  if (period === "month") return text.month;
  return text.all;
}

function formatDate(date: Date, language: Language) {
  return new Intl.DateTimeFormat(localeFor(language), {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function countryLabel(code: string, language: Language) {
  try {
    const names = new Intl.DisplayNames([language], { type: "region" });
    return `${names.of(code) ?? code} (${code})`;
  } catch {
    return code;
  }
}

const demoLinks: DemoLink[] = [
  {
    id: "patreon-tg",
    name: "Telegram",
    slug: "pt-tg",
    destination: "https://patreon.com/brand",
    group: "Patreon",
    stats: { todayClicks: 18, todayUnique: 14, weekClicks: 126, weekUnique: 83, monthClicks: 492, monthUnique: 261, totalClicks: 1842, totalUnique: 704 },
    lastClickMinutes: 5,
  },
  {
    id: "patreon-ig",
    name: "Instagram",
    slug: "pt-ig",
    destination: "https://patreon.com/brand",
    group: "Patreon",
    stats: { todayClicks: 31, todayUnique: 24, weekClicks: 204, weekUnique: 132, monthClicks: 745, monthUnique: 389, totalClicks: 2691, totalUnique: 1038 },
    lastClickMinutes: 2,
  },
  {
    id: "github-tg",
    name: "Telegram",
    slug: "gh-tg",
    destination: "https://github.com/brand/project",
    group: "GitHub",
    stats: { todayClicks: 9, todayUnique: 8, weekClicks: 61, weekUnique: 47, monthClicks: 251, monthUnique: 176, totalClicks: 914, totalUnique: 511 },
    lastClickMinutes: 14,
  },
  {
    id: "youtube-ig",
    name: "Instagram",
    slug: "yt-ig",
    destination: "https://youtube.com/@brand",
    group: "YouTube",
    stats: { todayClicks: 22, todayUnique: 17, weekClicks: 144, weekUnique: 101, monthClicks: 588, monthUnique: 342, totalClicks: 2037, totalUnique: 890 },
    lastClickMinutes: 8,
  },
];


const demoGroups: DemoGroup[] = [
  { name: "Patreon", color: "#f6e9e3" },
  { name: "GitHub", color: "#e8eef7" },
  { name: "YouTube", color: "#f7e8ee" },
];

const overallStats: PeriodStats = {
  todayClicks: 80,
  todayUnique: 63,
  weekClicks: 535,
  weekUnique: 328,
  monthClicks: 2076,
  monthUnique: 1043,
  totalClicks: 7484,
  totalUnique: 3143,
};

function makeDemoRecords(): DemoRecord[] {
  const now = Date.now();
  const templates = [
    ["patreon-ig", 2, "visitor-a91c…12ef", "UA", "mobile"],
    ["patreon-tg", 7, "visitor-6bf2…04ac", "PL", "mobile"],
    ["youtube-ig", 16, "visitor-3cc1…e80d", "DE", "computer"],
    ["github-tg", 29, "visitor-9f02…a713", "UA", "computer"],
    ["patreon-ig", 55, "visitor-174e…62dd", "CZ", "tablet"],
  ] as const;

  return templates.map(([linkId, minutesAgo, visitor, countryCode, device], index) => {
    const link = demoLinks.find((item) => item.id === linkId)!;
    return {
      id: `demo-${index}`,
      linkId,
      date: new Date(now - minutesAgo * 60_000),
      visitor,
      countryCode,
      device,
      group: link.group,
      linkName: link.name,
      slug: link.slug,
      destination: link.destination,
    };
  });
}

export default async function DemoPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, language] = await Promise.all([searchParams, getLanguage()]);
  const text = translations[language];
  const selectedPeriod = parsePeriod(params.period);
  const selectedLinkId = typeof params.link === "string" ? params.link : null;
  const selectedLink = selectedLinkId ? demoLinks.find((link) => link.id === selectedLinkId) ?? null : null;
  const todayLabel = dateLabel(language);
  const records = makeDemoRecords().filter((record) => !selectedLink || record.linkId === selectedLink.id);
  const groups = demoGroups;
  const chart = [18, 24, 31, 27, 42, 36, 55, 49, 61, 44, 72, 65, 58, 80];
  const maxDaily = Math.max(...chart);
  const deviceText = text.device;

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">{APP_NAME} · Demo</div>
          <h1>{text.demo.title}</h1>
          <p className="muted version-note">{APP_VERSION}</p>
        </div>
        <div className="topbar-actions">
          <LanguageSwitcher language={language} />
          <a className="button button-ghost" href="/login">{text.demo.backToLogin}</a>
        </div>
      </header>

      <div className="demo-notice"><strong>{text.demo.noticeTitle}</strong> {text.demo.notice}</div>

      <section className="panel system-panel">
        <div className="panel-heading"><div><h2>System / Database</h2><p className="muted">{text.demo.systemDescription}</p></div></div>
        <div className="system-grid">
          <article className="system-card">
            <div className="system-card-heading"><strong>{text.dashboard.system}</strong><span className="status status-on">Demo</span></div>
            <dl>
              <div><dt>{text.dashboard.version}</dt><dd>{APP_VERSION}</dd></div>
              <div><dt>{text.demo.mode}</dt><dd>{text.demo.publicDemo}</dd></div>
              <div><dt>{text.dashboard.shortUrl}</dt><dd>/&#123;slug&#125;</dd></div>
            </dl>
          </article>
          <article className="system-card">
            <div className="system-card-heading"><strong>{text.dashboard.database}</strong><span className="status demo-status">{text.demo.notConnected}</span></div>
            <dl>
              <div><dt>{text.demo.source}</dt><dd>{text.demo.staticData}</dd></div>
              <div><dt>{text.dashboard.groups}</dt><dd>3</dd></div>
              <div><dt>{text.dashboard.links}</dt><dd>4</dd></div>
              <div><dt>{text.demo.realRecords}</dt><dd>0</dd></div>
            </dl>
          </article>
        </div>
      </section>

      <section className="stats-section">
        <PeriodStatsGrid stats={overallStats} todayLabel={todayLabel} language={language} selectedPeriod={selectedPeriod} selectedLinkId={selectedLink?.id ?? null} basePath="/demo" />
      </section>

      {selectedPeriod ? (
        <section className="panel records-panel" id="records">
          <div className="panel-heading records-heading">
            <div>
              <div className="eyebrow">{text.demo.detailsEyebrow}</div>
              <h2>{periodLabel(selectedPeriod, todayLabel, language)} · {selectedLink ? selectedLink.name : text.dashboard.allLinks}</h2>
              <p className="muted">{text.demo.detailsNote}</p>
            </div>
            <a className="button button-ghost button-small" href="/demo">{text.common.close}</a>
          </div>
          <div className="records-table-wrap">
            <table className="records-table">
              <thead><tr><th>{text.dashboard.when}</th><th>{text.dashboard.visitor}</th><th>{text.dashboard.country}</th><th>{text.dashboard.group}</th><th>{text.dashboard.sourceLink}</th><th>{text.dashboard.clickedTo}</th></tr></thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="nowrap">{formatDate(record.date, language)}</td>
                    <td><code>{record.visitor}</code><span className="record-secondary">{record.device === "mobile" ? deviceText.mobile : record.device === "tablet" ? deviceText.tablet : deviceText.computer}</span></td>
                    <td>{countryLabel(record.countryCode, language)}</td>
                    <td>{record.group}</td>
                    <td><strong>{record.linkName}</strong><span className="record-secondary">/{record.slug}</span></td>
                    <td className="record-destination">{record.destination}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-heading"><div><h2>{text.dashboard.last14}</h2><p className="muted">{text.demo.last14Description}</p></div></div>
        <div className="bars">
          {chart.map((clicks, index) => {
            const height = Math.max(8, Math.round((clicks / maxDaily) * 120));
            return <div className="bar-item" key={`${clicks}-${index}`}><span className="bar-value">{clicks}</span><div className="bar" style={{ height }} /><span className="bar-label">{text.demo.daysAgo(13 - index)}</span></div>;
          })}
        </div>
      </section>

      <section className="panel demo-disabled-panel">
        <div className="panel-heading"><div><h2>{text.createLink.title}</h2><p className="muted">{text.demo.formDescription}</p></div></div>
        <div className="form-grid demo-form">
          <label>{text.createLink.name}<input value="Telegram" readOnly /></label>
          <label>{text.createLink.slug}<input value="telegram" readOnly /></label>
          <label>{text.createLink.group}<select value="Patreon" disabled><option>Patreon</option></select></label>
          <label className="wide">{text.createLink.destination}<input value="https://patreon.com/brand" readOnly /></label>
          <div className="wide form-actions"><button className="button button-primary" type="button" disabled>{text.demo.createDisabled}</button></div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>{text.demo.yourLinksTitle}</h2><p className="muted">{text.demo.yourLinksDescription}</p></div></div>
        <div className="link-groups-list">
          {groups.map((group) => {
            const groupLinks = demoLinks.filter((link) => link.group === group.name);
            return (
              <details className="link-group" key={group.name} open>
                <summary className="link-group-heading" style={{ backgroundColor: group.color }}><span><span className="group-color-dot" style={{ backgroundColor: group.color }} aria-hidden="true" />{group.name}</span><span className="link-group-count">{linksCountLabel(groupLinks.length, language)}</span></summary>
                <div className="link-list">
                  {groupLinks.map((link) => {
                    const demoUrl = `https://go.brand.link/${link.slug}`;
                    return (
                      <article className="link-card" key={link.id}>
                        <div className="link-card-main">
                          <div className="link-title-row">
                            <div>
                              <div className="link-name-line"><h3>{link.name}</h3><span className="group-badge" style={{ backgroundColor: demoGroups.find((item) => item.name === link.group)?.color ?? DEFAULT_GROUP_COLOR }}>{link.group}</span></div>
                              <div className="tracking-url">{demoUrl}</div>
                              <div className="link-last-click">{text.common.lastClick} {text.demo.lastClickMinutes(link.lastClickMinutes)}</div>
                            </div>
                            <span className="status status-on">{text.common.active}</span>
                          </div>
                          <div className="inline-actions"><CopyButton value={demoUrl} language={language} /><span className="button button-ghost button-small demo-disabled-action">{text.common.check}</span></div>
                          <PeriodStatsGrid stats={link.stats} todayLabel={todayLabel} language={language} linkId={link.id} selectedPeriod={selectedPeriod} selectedLinkId={selectedLink?.id ?? null} compact basePath="/demo" />
                          <div className="destination"><span>{text.common.destination}</span>{link.destination}</div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </main>
  );
}
