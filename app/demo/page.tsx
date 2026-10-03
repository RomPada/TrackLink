import CopyButton from "@/components/CopyButton";
import PeriodStatsGrid, {
  type PeriodKey,
  type PeriodStats,
} from "@/components/PeriodStatsGrid";
import { APP_NAME, APP_VERSION } from "@/lib/app-meta";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type DemoLink = {
  id: string;
  name: string;
  slug: string;
  destination: string;
  group: string;
  stats: PeriodStats;
  lastClick: string;
};

type DemoRecord = {
  id: string;
  linkId: string;
  time: string;
  visitor: string;
  country: string;
  device: string;
  group: string;
  linkName: string;
  slug: string;
  destination: string;
};

function parsePeriod(value: string | string[] | undefined): PeriodKey | null {
  if (typeof value !== "string") return null;
  return ["today", "week", "month", "all"].includes(value)
    ? (value as PeriodKey)
    : null;
}

function kyivDateLabel() {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function periodLabel(period: PeriodKey, todayLabel: string) {
  if (period === "today") return `Сьогодні · ${todayLabel}`;
  if (period === "week") return "За останні 7 днів";
  if (period === "month") return "За місяць";
  return "Всього";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const demoLinks: DemoLink[] = [
  {
    id: "patreon-tg",
    name: "Telegram",
    slug: "pt-tg",
    destination: "https://patreon.com/brand",
    group: "Patreon",
    stats: { todayClicks: 18, todayUnique: 14, weekClicks: 126, weekUnique: 83, monthClicks: 492, monthUnique: 261, totalClicks: 1842, totalUnique: 704 },
    lastClick: "5 хв тому",
  },
  {
    id: "patreon-ig",
    name: "Instagram",
    slug: "pt-ig",
    destination: "https://patreon.com/brand",
    group: "Patreon",
    stats: { todayClicks: 31, todayUnique: 24, weekClicks: 204, weekUnique: 132, monthClicks: 745, monthUnique: 389, totalClicks: 2691, totalUnique: 1038 },
    lastClick: "2 хв тому",
  },
  {
    id: "github-tg",
    name: "Telegram",
    slug: "gh-tg",
    destination: "https://github.com/brand/project",
    group: "GitHub",
    stats: { todayClicks: 9, todayUnique: 8, weekClicks: 61, weekUnique: 47, monthClicks: 251, monthUnique: 176, totalClicks: 914, totalUnique: 511 },
    lastClick: "14 хв тому",
  },
  {
    id: "youtube-ig",
    name: "Instagram",
    slug: "yt-ig",
    destination: "https://youtube.com/@brand",
    group: "YouTube",
    stats: { todayClicks: 22, todayUnique: 17, weekClicks: 144, weekUnique: 101, monthClicks: 588, monthUnique: 342, totalClicks: 2037, totalUnique: 890 },
    lastClick: "8 хв тому",
  },
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
    ["patreon-ig", 2, "visitor-a91c…12ef", "Україна (UA)", "Мобільний"],
    ["patreon-tg", 7, "visitor-6bf2…04ac", "Польща (PL)", "Мобільний"],
    ["youtube-ig", 16, "visitor-3cc1…e80d", "Німеччина (DE)", "Компʼютер"],
    ["github-tg", 29, "visitor-9f02…a713", "Україна (UA)", "Компʼютер"],
    ["patreon-ig", 55, "visitor-174e…62dd", "Чехія (CZ)", "Планшет"],
  ] as const;

  return templates.map(([linkId, minutesAgo, visitor, country, device], index) => {
    const link = demoLinks.find((item) => item.id === linkId)!;
    return {
      id: `demo-${index}`,
      linkId,
      time: formatDate(new Date(now - minutesAgo * 60_000)),
      visitor,
      country,
      device,
      group: link.group,
      linkName: link.name,
      slug: link.slug,
      destination: link.destination,
    };
  });
}

export default async function DemoPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const selectedPeriod = parsePeriod(params.period);
  const selectedLinkId = typeof params.link === "string" ? params.link : null;
  const selectedLink = selectedLinkId
    ? demoLinks.find((link) => link.id === selectedLinkId) ?? null
    : null;
  const todayLabel = kyivDateLabel();
  const records = makeDemoRecords().filter((record) => !selectedLink || record.linkId === selectedLink.id);
  const groups = ["Patreon", "GitHub", "YouTube"];
  const chart = [18, 24, 31, 27, 42, 36, 55, 49, 61, 44, 72, 65, 58, 80];
  const maxDaily = Math.max(...chart);

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">{APP_NAME} · Demo</div>
          <h1>Демонстрація TrackLink</h1>
          <p className="muted version-note">{APP_VERSION}</p>
        </div>
        <a className="button button-ghost" href="/login">До входу</a>
      </header>

      <div className="demo-notice">
        <strong>Демо-режим.</strong> Усі дані на цій сторінці тестові. Сторінка не підключається до Supabase,
        не записує переходи й не надає адміністративних прав.
      </div>

      <section className="panel system-panel">
        <div className="panel-heading">
          <div>
            <h2>System / Database</h2>
            <p className="muted">Приклад того, як виглядає системний блок у робочій версії.</p>
          </div>
        </div>
        <div className="system-grid">
          <article className="system-card">
            <div className="system-card-heading">
              <strong>System</strong>
              <span className="status status-on">Demo</span>
            </div>
            <dl>
              <div><dt>Версія</dt><dd>{APP_VERSION}</dd></div>
              <div><dt>Режим</dt><dd>Public demo</dd></div>
              <div><dt>Короткий URL</dt><dd>/&#123;slug&#125;</dd></div>
            </dl>
          </article>
          <article className="system-card">
            <div className="system-card-heading">
              <strong>Database</strong>
              <span className="status demo-status">Not connected</span>
            </div>
            <dl>
              <div><dt>Джерело</dt><dd>Static demo data</dd></div>
              <div><dt>Груп</dt><dd>3</dd></div>
              <div><dt>Посилань</dt><dd>4</dd></div>
              <div><dt>Реальні записи</dt><dd>0</dd></div>
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
          basePath="/demo"
        />
      </section>

      {selectedPeriod ? (
        <section className="panel records-panel" id="records">
          <div className="panel-heading records-heading">
            <div>
              <div className="eyebrow">Демо · Деталі переходів</div>
              <h2>
                {periodLabel(selectedPeriod, todayLabel)}
                {selectedLink ? ` · ${selectedLink.name}` : " · усі посилання"}
              </h2>
              <p className="muted">Це приклад тестових записів, а не реальні користувачі.</p>
            </div>
            <a className="button button-ghost button-small" href="/demo">Закрити</a>
          </div>

          <div className="records-table-wrap">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Коли</th>
                  <th>Відвідувач</th>
                  <th>Країна</th>
                  <th>Група</th>
                  <th>Посилання</th>
                  <th>Куди перейшов</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="nowrap">{record.time}</td>
                    <td>
                      <code>{record.visitor}</code>
                      <span className="record-secondary">{record.device}</span>
                    </td>
                    <td>{record.country}</td>
                    <td>{record.group}</td>
                    <td>
                      <strong>{record.linkName}</strong>
                      <span className="record-secondary">/{record.slug}</span>
                    </td>
                    <td className="record-destination">{record.destination}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Останні 14 днів</h2>
            <p className="muted">Демонстраційний приклад агрегованої статистики.</p>
          </div>
        </div>
        <div className="bars">
          {chart.map((clicks, index) => {
            const height = Math.max(8, Math.round((clicks / maxDaily) * 120));
            return (
              <div className="bar-item" key={`${clicks}-${index}`}>
                <span className="bar-value">{clicks}</span>
                <div className="bar" style={{ height }} />
                <span className="bar-label">-{13 - index}д</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel demo-disabled-panel">
        <div className="panel-heading">
          <div>
            <h2>Створити нове посилання</h2>
            <p className="muted">У демо форма показана лише для ознайомлення і нічого не зберігає.</p>
          </div>
        </div>
        <div className="form-grid demo-form">
          <label>Назва<input value="Telegram" readOnly /></label>
          <label>Slug<input value="telegram" readOnly /></label>
          <label>Група<select value="Patreon" disabled><option>Patreon</option></select></label>
          <label className="wide">Кінцева адреса<input value="https://patreon.com/brand" readOnly /></label>
          <div className="wide form-actions">
            <button className="button button-primary" type="button" disabled>Створити посилання</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Твої посилання · Demo</h2>
            <p className="muted">Приклад групування посилань за кінцевим ресурсом.</p>
          </div>
        </div>

        <div className="link-groups-list">
          {groups.map((group) => {
            const groupLinks = demoLinks.filter((link) => link.group === group);
            return (
              <details className="link-group" key={group} open>
                <summary className="link-group-heading">
                  <span>{group}</span>
                  <span className="link-group-count">{groupLinks.length} посилань</span>
                </summary>
                <div className="link-list">
                  {groupLinks.map((link) => {
                    const demoUrl = `https://go.brand.link/${link.slug}`;
                    return (
                      <article className="link-card" key={link.id}>
                        <div className="link-card-main">
                          <div className="link-title-row">
                            <div>
                              <div className="link-name-line">
                                <h3>{link.name}</h3>
                                <span className="group-badge">{link.group}</span>
                              </div>
                              <div className="tracking-url">{demoUrl}</div>
                              <div className="link-last-click">Останній перехід: {link.lastClick}</div>
                            </div>
                            <span className="status status-on">Активне</span>
                          </div>

                          <div className="inline-actions">
                            <CopyButton value={demoUrl} />
                            <span className="button button-ghost button-small demo-disabled-action">Перевірити</span>
                          </div>

                          <PeriodStatsGrid
                            stats={link.stats}
                            todayLabel={todayLabel}
                            linkId={link.id}
                            selectedPeriod={selectedPeriod}
                            selectedLinkId={selectedLink?.id ?? null}
                            compact
                            basePath="/demo"
                          />

                          <div className="destination">
                            <span>Куди веде:</span>{link.destination}
                          </div>
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
