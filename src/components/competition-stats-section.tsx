interface TopScorer {
  name: string;
  teamName: string;
  goals: number;
}

interface TopCard {
  name: string;
  teamName: string;
  yellow: number;
  red: number;
}

interface TeamStat {
  name: string;
  scored: number;
  conceded: number;
  played: number;
}

export interface CompetitionStats {
  topScorers: TopScorer[];
  topCards: TopCard[];
  bestAttack: TeamStat | null;
  worstAttack: TeamStat | null;
  bestDefense: TeamStat | null;
  avgGoalsPerMatch: number | null;
}

interface Props {
  stats: CompetitionStats;
  locale: string;
}

export function CompetitionStatsSection({ stats, locale }: Props) {
  const cs = locale === "cs";

  const hasScorers = stats.topScorers.length > 0;
  const hasCards = stats.topCards.length > 0;
  const hasTeamStats = stats.bestAttack || stats.bestDefense || stats.avgGoalsPerMatch !== null;

  if (!hasScorers && !hasCards && !hasTeamStats) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
        <span className="text-4xl">📊</span>
        <p className="text-sm">{cs ? "Statistiky budou k dispozici po odehrání zápasů" : "Stats will be available after matches are played"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top scorers */}
      {hasScorers && (
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b flex items-center gap-2">
            <span className="text-base">⚽</span>
            <span className="font-semibold text-sm">{cs ? "Střelci" : "Top scorers"}</span>
          </div>
          <ul className="divide-y">
            {stats.topScorers.map((s, i) => (
              <li key={`${s.name}-${s.teamName}`} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-5 text-xs text-muted-foreground font-mono tabular-nums text-right shrink-0">
                  {i + 1}.
                </span>
                <span className="flex-1 font-medium text-sm">{s.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">{s.teamName}</span>
                <span className="flex items-center gap-1 font-bold text-sm tabular-nums shrink-0">
                  <span>⚽</span>
                  {s.goals}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Team stats */}
      {hasTeamStats && (
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b flex items-center gap-2">
            <span className="text-base">📈</span>
            <span className="font-semibold text-sm">{cs ? "Týmové statistiky" : "Team stats"}</span>
          </div>
          <ul className="divide-y">
            {stats.avgGoalsPerMatch !== null && (
              <li className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{cs ? "Průměr gólů / zápas" : "Avg goals / match"}</span>
                <span className="font-bold tabular-nums">{stats.avgGoalsPerMatch.toFixed(2)}</span>
              </li>
            )}
            {stats.bestAttack && (
              <li className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{cs ? "Nejlepší útok" : "Best attack"}</span>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{stats.bestAttack.name}</span>
                  <span className="font-bold text-green-600 tabular-nums">{stats.bestAttack.scored} {cs ? "gólů" : "goals"}</span>
                </span>
              </li>
            )}
            {stats.worstAttack && (
              <li className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{cs ? "Nejhorší útok" : "Worst attack"}</span>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{stats.worstAttack.name}</span>
                  <span className="font-bold text-red-500 tabular-nums">{stats.worstAttack.scored} {cs ? "gólů" : "goals"}</span>
                </span>
              </li>
            )}
            {stats.bestDefense && (
              <li className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{cs ? "Nejlepší obrana" : "Best defense"}</span>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{stats.bestDefense.name}</span>
                  <span className="font-bold text-blue-600 tabular-nums">{stats.bestDefense.conceded} {cs ? "obdrženo" : "conceded"}</span>
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Cards */}
      {hasCards && (
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b flex items-center gap-2">
            <span className="text-base">🟨</span>
            <span className="font-semibold text-sm">{cs ? "Karty" : "Cards"}</span>
          </div>
          <ul className="divide-y">
            {stats.topCards.map((c) => (
              <li key={`${c.name}-${c.teamName}`} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 font-medium text-sm">{c.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">{c.teamName}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {c.yellow > 0 && (
                    <span className="flex items-center gap-0.5 text-sm font-bold tabular-nums">
                      🟨 {c.yellow}
                    </span>
                  )}
                  {c.red > 0 && (
                    <span className="flex items-center gap-0.5 text-sm font-bold tabular-nums">
                      🟥 {c.red}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
