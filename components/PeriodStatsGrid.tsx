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
  linkId?: string;
  selectedPeriod?: PeriodKey | null;
  selectedLinkId?: string | null;
  compact?: boolean;
};

function formatNumber(value: number) {
  return value.toLocaleString("uk-UA");
}

export default function PeriodStatsGrid({
  stats,
  todayLabel,
  linkId,
  selectedPeriod,
  selectedLinkId,
  compact = false,
}: Props) {
  const items: Array<{
    key: PeriodKey;
    label: string;
    clicks: number;
    unique: number;
  }> = [
    {
      key: "today",
      label: `Сьогодні · ${todayLabel}`,
      clicks: stats.todayClicks,
      unique: stats.todayUnique,
    },
    {
      key: "week",
      label: "За останні 7 днів",
      clicks: stats.weekClicks,
      unique: stats.weekUnique,
    },
    {
      key: "month",
      label: "За місяць",
      clicks: stats.monthClicks,
      unique: stats.monthUnique,
    },
    {
      key: "all",
      label: "Всього",
      clicks: stats.totalClicks,
      unique: stats.totalUnique,
    },
  ];

  return (
    <div className={`period-stats-grid${compact ? " period-stats-grid-compact" : ""}`}>
      {items.map((item) => {
        const params = new URLSearchParams({ period: item.key });
        if (linkId) params.set("link", linkId);

        const active =
          selectedPeriod === item.key &&
          (linkId ? selectedLinkId === linkId : !selectedLinkId);

        return (
          <a
            key={item.key}
            className={`period-card${active ? " period-card-active" : ""}`}
            href={`/admin?${params.toString()}#records`}
          >
            <div className="period-card-title">{item.label}</div>
            <div className="period-card-metrics">
              <div>
                <span>Унікальні</span>
                <strong>{formatNumber(item.unique)}</strong>
              </div>
              <div>
                <span>Всього переходів</span>
                <strong>{formatNumber(item.clicks)}</strong>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
