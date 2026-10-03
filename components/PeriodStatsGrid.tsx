import { localeFor, translations, type Language } from "@/lib/i18n";

export type PeriodKey = "today" | "week" | "month" | "all";

export type PeriodStats = {
  todayClicks: number;
  todayUnique: number;
  weekClicks: number;
  weekUnique: number;
  monthClicks: number;
  monthUnique: number;
  totalClicks: number;
  totalUnique: number;
};

type Props = {
  stats: PeriodStats;
  todayLabel: string;
  language?: Language;
  linkId?: string;
  selectedPeriod?: PeriodKey | null;
  selectedLinkId?: string | null;
  compact?: boolean;
  basePath?: string;
};

export default function PeriodStatsGrid({
  stats,
  todayLabel,
  language = "en",
  linkId,
  selectedPeriod,
  selectedLinkId,
  compact = false,
  basePath = "/admin",
}: Props) {
  const text = translations[language].period;
  const formatNumber = (value: number) => value.toLocaleString(localeFor(language));
  const items: Array<{ key: PeriodKey; label: string; clicks: number; unique: number }> = [
    { key: "today", label: `${text.today} · ${todayLabel}`, clicks: stats.todayClicks, unique: stats.todayUnique },
    { key: "week", label: text.week, clicks: stats.weekClicks, unique: stats.weekUnique },
    { key: "month", label: text.month, clicks: stats.monthClicks, unique: stats.monthUnique },
    { key: "all", label: text.all, clicks: stats.totalClicks, unique: stats.totalUnique },
  ];

  return (
    <div className={`period-stats-grid${compact ? " period-stats-grid-compact" : ""}`}>
      {items.map((item) => {
        const params = new URLSearchParams({ period: item.key });
        if (linkId) params.set("link", linkId);
        const active = selectedPeriod === item.key && (linkId ? selectedLinkId === linkId : !selectedLinkId);

        return (
          <a
            key={item.key}
            className={`period-card${active ? " period-card-active" : ""}`}
            href={`${basePath}?${params.toString()}#records`}
          >
            <div className="period-card-title">{item.label}</div>
            <div className="period-card-metrics">
              <div><span>{text.unique}</span><strong>{formatNumber(item.unique)}</strong></div>
              <div><span>{text.totalClicks}</span><strong>{formatNumber(item.clicks)}</strong></div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
