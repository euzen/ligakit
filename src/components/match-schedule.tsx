"use client";

import { useState, useMemo } from "react";
import { CalendarDays, Clock, Radio, MapPin, Shuffle, Presentation, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ScheduleMatch {
  id: string;
  round: number | null;
  note: string | null;
  bracketPos: number | null;
  homeTeam: { id: string; name: string; logoUrl?: string | null } | null;
  awayTeam: { id: string; name: string; logoUrl?: string | null } | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  scheduledAt: Date | string | null;
  matchState?: string | null;
  venue?: string | null;
}

interface MatchScheduleProps {
  matches: ScheduleMatch[];
  locale: string;
  canManage?: boolean;
  onRequestDraw?: () => void;
}

function teamName(m: ScheduleMatch, side: "home" | "away") {
  if (side === "home") return m.homeTeam?.name ?? m.homeTeamName ?? "?";
  return m.awayTeam?.name ?? m.awayTeamName ?? "?";
}

function teamLogo(m: ScheduleMatch, side: "home" | "away"): string | null | undefined {
  return side === "home" ? m.homeTeam?.logoUrl : m.awayTeam?.logoUrl;
}

function TeamLogo({ url, name }: { url?: string | null; name: string }) {
  if (!url) return <span className="size-5 rounded-full bg-muted shrink-0" />;
  return <img src={url} alt={name} className="size-5 rounded-full object-cover shrink-0" />;
}

function formatDay(date: Date, locale: string) {
  return date.toLocaleDateString(locale === "cs" ? "cs-CZ" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: Date, locale: string) {
  return date.toLocaleTimeString(locale === "cs" ? "cs-CZ" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function matchLabel(m: ScheduleMatch, isCS: boolean): string | null {
  if (!m.note) return m.round ? `${isCS ? "Kolo" : "Round"} ${m.round}` : null;
  const labels: Record<string, string> = isCS
    ? { F: "Finále", SF: "Semifinále", QF: "Čtvrtfinále", R16: "Osmifinále", "3rd": "O 3. místo" }
    : { F: "Final", SF: "Semi-final", QF: "Quarter-final", R16: "Round of 16", "3rd": "3rd Place" };
  return labels[m.note] ?? m.note;
}

function StatusBadge({ status, matchState, isCS }: { status: string; matchState?: string | null; isCS: boolean }) {
  if (matchState === "LIVE") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
        <Radio className="size-3 animate-pulse" />
        LIVE
      </span>
    );
  }
  if (status === "PLAYED") {
    return <Badge variant="default" className="text-xs px-1.5 py-0">{isCS ? "Odehráno" : "Played"}</Badge>;
  }
  if (status === "CANCELLED") {
    return <Badge variant="destructive" className="text-xs px-1.5 py-0">{isCS ? "Zrušeno" : "Cancelled"}</Badge>;
  }
  return <Badge variant="secondary" className="text-xs px-1.5 py-0">{isCS ? "Plánováno" : "Scheduled"}</Badge>;
}

export function MatchSchedule({ matches, locale, canManage, onRequestDraw }: MatchScheduleProps) {
  const isCS = locale === "cs";

  // Filter state
  const [filterRound, setFilterRound] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");

  // Derive unique rounds for filter
  const allRounds = useMemo(
    () => [...new Set(matches.map((m) => m.round ?? 0))].sort((a, b) => a - b),
    [matches],
  );

  // Derive unique team names for filter
  const allTeams = useMemo(() => {
    const names = new Set<string>();
    for (const m of matches) {
      names.add(m.homeTeam?.name ?? m.homeTeamName ?? "?");
      names.add(m.awayTeam?.name ?? m.awayTeamName ?? "?");
    }
    return [...names].sort();
  }, [matches]);

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (filterRound !== "all" && String(m.round ?? 0) !== filterRound) return false;
      if (filterStatus !== "all" && m.status !== filterStatus) return false;
      if (filterTeam !== "all") {
        const home = m.homeTeam?.name ?? m.homeTeamName ?? "?";
        const away = m.awayTeam?.name ?? m.awayTeamName ?? "?";
        if (home !== filterTeam && away !== filterTeam) return false;
      }
      return true;
    });
  }, [matches, filterRound, filterStatus, filterTeam]);

  // Group: matches with date → by calendar day; matches without date → separate bucket
  const { dayGroups, noDayMatches } = useMemo(() => {
    const withDate: ScheduleMatch[] = [];
    const noDate: ScheduleMatch[] = [];
    for (const m of filtered) {
      if (m.scheduledAt) withDate.push(m);
      else noDate.push(m);
    }

    // Sort by scheduledAt
    withDate.sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

    // Group by day key YYYY-MM-DD
    const map = new Map<string, { date: Date; matches: ScheduleMatch[] }>();
    for (const m of withDate) {
      const d = new Date(m.scheduledAt!);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { date: d, matches: [] });
      map.get(key)!.matches.push(m);
    }

    return {
      dayGroups: [...map.values()],
      noDayMatches: noDate,
    };
  }, [filtered]);

  if (matches.length === 0) {
    if (canManage) {
      return (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="p-3 rounded-2xl bg-muted">
            <CalendarDays className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">{isCS ? "Zatím žádné zápasy" : "No matches yet"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{isCS ? "Vygeneruj rozlosování jedním kliknutím" : "Generate the schedule in one click"}</p>
          </div>
          {onRequestDraw && (
            <button
              onClick={onRequestDraw}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Shuffle className="size-3.5" />
              {isCS ? "Spustit losování" : "Run draw"}
            </button>
          )}
        </div>
      );
    }
    return (
      <p className="text-center text-muted-foreground py-8 text-sm">
        {isCS ? "Zápasy budou zveřejněny po vygenerování rozlosování." : "Matches will appear once the schedule is generated."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Round filter */}
        <select
          value={filterRound}
          onChange={(e) => setFilterRound(e.target.value)}
          className="h-8 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">{isCS ? "Všechna kola" : "All rounds"}</option>
          {allRounds.map((r) => (
            <option key={r} value={String(r)}>
              {r === 0 ? (isCS ? "Bez kola" : "No round") : `${isCS ? "Kolo" : "Round"} ${r}`}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-8 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">{isCS ? "Všechny stavy" : "All statuses"}</option>
          <option value="SCHEDULED">{isCS ? "Plánováno" : "Scheduled"}</option>
          <option value="PLAYED">{isCS ? "Odehráno" : "Played"}</option>
          <option value="CANCELLED">{isCS ? "Zrušeno" : "Cancelled"}</option>
        </select>

        {/* Team filter */}
        {allTeams.length > 1 && (
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="h-8 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">{isCS ? "Všechny týmy" : "All teams"}</option>
            {allTeams.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}

        {(filterRound !== "all" || filterStatus !== "all" || filterTeam !== "all") && (
          <button
            onClick={() => { setFilterRound("all"); setFilterStatus("all"); setFilterTeam("all"); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isCS ? "Zrušit filtr" : "Clear filter"}
          </button>
        )}
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-6 text-sm">
          {isCS ? "Žádné zápasy neodpovídají filtru." : "No matches match the filter."}
        </p>
      )}

      {/* Day groups */}
      {dayGroups.map(({ date, matches: dayMatches }) => {
        const today = isToday(date);
        return (
          <div key={date.toISOString().slice(0, 10)}>
            {/* Day header */}
            <div className={`flex items-center gap-2 mb-2 pb-1.5 border-b ${today ? "border-primary" : "border-border"}`}>
              <CalendarDays className={`size-4 shrink-0 ${today ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-semibold capitalize ${today ? "text-primary" : "text-foreground"}`}>
                {formatDay(date, locale)}
                {today && (
                  <span className="ml-2 text-xs font-normal text-primary">
                    {isCS ? "— dnes" : "— today"}
                  </span>
                )}
              </span>
            </div>

            {/* Match rows */}
            <div className="space-y-2">
              {dayMatches.map((m) => (
                <MatchRow key={m.id} match={m} isCS={isCS} locale={locale} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Matches without date */}
      {noDayMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-dashed border-border">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">
              {isCS ? "Datum neurčeno" : "Date not set"}
            </span>
          </div>
          <div className="space-y-2">
            {noDayMatches.map((m) => (
              <MatchRow key={m.id} match={m} isCS={isCS} locale={locale} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchRow({ match: m, isCS, locale }: { match: ScheduleMatch; isCS: boolean; locale: string }) {
  const home = teamName(m, "home");
  const away = teamName(m, "away");
  const isPlayed = m.status === "PLAYED";
  const isLive = m.matchState === "LIVE";
  const isCancelled = m.status === "CANCELLED";
  const homeWon = isPlayed && m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore;
  const awayWon = isPlayed && m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore;
  const label = matchLabel(m, isCS);
  const time = m.scheduledAt ? formatTime(new Date(m.scheduledAt), locale) : null;

  return (
    <div
      className={`rounded-lg border bg-card overflow-hidden transition-colors ${
        isLive ? "border-red-500/50 bg-red-500/5" : isCancelled ? "opacity-60" : ""
      }`}
    >
      {/* Desktop layout */}
      <div className="hidden sm:block px-4 py-3">
        <div className="grid grid-cols-[64px_1fr_auto_1fr_auto] items-center gap-3">
          {/* Time */}
          <span className={`text-sm font-bold tabular-nums ${isLive ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
            {isLive ? "LIVE" : (time ?? "—")}
          </span>

          {/* Home team */}
          <span className={`flex items-center justify-end gap-1.5 text-sm truncate ${homeWon ? "font-semibold" : ""}`}>
            {home}
            <TeamLogo url={teamLogo(m, "home")} name={home} />
          </span>

          {/* Score / VS */}
          <div className="flex items-center gap-1.5 min-w-[72px] justify-center">
            {isPlayed ? (
              <>
                <span className={`text-lg font-black tabular-nums w-6 text-center ${homeWon ? "text-foreground" : "text-muted-foreground"}`}>
                  {m.homeScore}
                </span>
                <span className="text-muted-foreground font-bold">:</span>
                <span className={`text-lg font-black tabular-nums w-6 text-center ${awayWon ? "text-foreground" : "text-muted-foreground"}`}>
                  {m.awayScore}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground font-medium">vs</span>
            )}
          </div>

          {/* Away team */}
          <span className={`flex items-center gap-1.5 text-sm truncate ${awayWon ? "font-semibold" : ""}`}>
            <TeamLogo url={teamLogo(m, "away")} name={away} />
            {away}
          </span>

          {/* Status + label + links */}
          <div className="flex flex-col items-end gap-1 min-w-[80px]">
            <StatusBadge status={m.status} matchState={m.matchState} isCS={isCS} />
            {label && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
            )}
            <div className="flex flex-col gap-0.5 mt-0.5">
              <a
                href={`/${locale}/matches/${m.id}/presentation`}
                className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                title={isCS ? "Prezentace zápasu" : "Match presentation"}
              >
                <Presentation size={9} />
                {isCS ? "Prezentace" : "Report"}
              </a>
              <a
                href={`/${locale}/matches/${m.id}/scoreboard`}
                className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                title={isCS ? "Scoreboard" : "Scoreboard"}
              >
                <LayoutGrid size={9} />
                Scoreboard
              </a>
            </div>
          </div>
        </div>
        {m.venue && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground pl-[76px]">
            <MapPin className="size-3 shrink-0" />
            {m.venue}
          </div>
        )}
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden px-3 py-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isLive ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
              {isLive ? "LIVE" : (time ?? "—")}
            </span>
            {label && <span className="text-xs text-muted-foreground">{label}</span>}
          </div>
          <StatusBadge status={m.status} matchState={m.matchState} isCS={isCS} />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <span className={`flex items-center gap-1.5 text-sm truncate ${homeWon ? "font-semibold" : ""}`}>
            <TeamLogo url={teamLogo(m, "home")} name={home} />
            {home}
          </span>
          {isPlayed ? (
            <span className="text-base font-black tabular-nums text-center">
              {m.homeScore}:{m.awayScore}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground text-center">vs</span>
          )}
          <span className={`flex items-center justify-end gap-1.5 text-sm truncate ${awayWon ? "font-semibold" : ""}`}>
            {away}
            <TeamLogo url={teamLogo(m, "away")} name={away} />
          </span>
        </div>
        {m.venue && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {m.venue}
          </div>
        )}
        {/* Links mobile */}
        <div className="flex items-center justify-center gap-3">
          <a
            href={`/${locale}/matches/${m.id}/presentation`}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            title={isCS ? "Prezentace zápasu" : "Match presentation"}
          >
            <Presentation size={9} />
            {isCS ? "Prezentace" : "Report"}
          </a>
          <a
            href={`/${locale}/matches/${m.id}/scoreboard`}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
            title={isCS ? "Scoreboard" : "Scoreboard"}
          >
            <LayoutGrid size={9} />
            Scoreboard
          </a>
        </div>
      </div>
    </div>
  );
}
