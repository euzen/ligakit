"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Trophy, Users, CalendarDays, Zap, Medal,
  Radio, ChevronRight,
} from "lucide-react";
import type { StandingRow, GroupStandings } from "@/lib/standings";
import { CompetitionAwards } from "@/components/competition-awards";
import { CompetitionNoticeBoard } from "@/components/competition-notice-board";

interface Match {
  id: string;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  scheduledAt: string | null;
  round: number | null;
  note: string | null;
  matchState: string | null;
}

interface LiveMatch {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  matchState: string | null;
  homeTeam: { name: string } | null;
  awayTeam: { name: string } | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
}

interface TeamPlayer {
  id: string;
  name: string;
  number: number | null;
  teamName: string;
}

interface Props {
  locale: string;
  competitionId: string;
  competitionType: string;
  canManage: boolean;
  standings: StandingRow[] | null;
  groupStandings: GroupStandings[] | null;
  liveMatches: LiveMatch[];
  stats: {
    teamCount: number;
    matchCount: number;
    playedCount: number;
    totalGoals: number;
    topScorer: string | null;
  };
  matchesSection: React.ReactNode;
  teamsSection: React.ReactNode;
  bracketSection: React.ReactNode | null;
  statsSection: React.ReactNode;
  statusSection: React.ReactNode;
  bracketWinner?: string | null;
  bracketRunnerUp?: string | null;
  bracketThird?: string | null;
  players: TeamPlayer[];
}

const FORM_COLORS: Record<string, string> = {
  W: "bg-green-500 text-white",
  D: "bg-yellow-400 text-black",
  L: "bg-red-500 text-white",
};
const FORM_LABELS: Record<string, string> = { W: "V", D: "R", L: "P" };

const MEDAL_COLORS = ["text-yellow-500", "text-slate-400", "text-amber-700"];

export function CompetitionDetailClient({
  locale,
  competitionId,
  competitionType,
  canManage,
  standings,
  groupStandings,
  liveMatches,
  stats,
  matchesSection,
  teamsSection,
  bracketSection,
  statsSection,
  statusSection,
  bracketWinner,
  bracketRunnerUp,
  bracketThird,
  players,
}: Props) {
  const cs = locale === "cs";

  const tabs = [
    standings || groupStandings ? { id: "table", label: cs ? "Tabulka" : "Standings" } : null,
    (competitionType === "TOURNAMENT" || competitionType === "CUP") && bracketSection ? { id: "bracket", label: cs ? "Pavouk" : "Bracket" } : null,
    { id: "matches", label: cs ? "Zápasy" : "Matches" },
    { id: "teams", label: cs ? "Týmy" : "Teams" },
    { id: "stats", label: cs ? "Statistiky" : "Stats" },
    { id: "awards", label: cs ? "Vyhlášení" : "Awards" },
    { id: "board", label: cs ? "Nástěnka" : "Notice board" },
  ].filter(Boolean) as { id: string; label: string }[];

  const defaultTab = standings || groupStandings ? "table" : (competitionType === "TOURNAMENT" || competitionType === "CUP") ? "bracket" : "matches";

  const validTabIds = tabs.map(t => t.id);

  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (validTabIds.includes(hash)) setActiveTab(hash);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [statusValue, setStatusValue] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatusValue(newStatus);
        toast.success(cs ? "Stav soutěže uložen" : "Competition status saved");
      }
    } finally {
      setSavingStatus(false);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(cs ? "cs-CZ" : "en-US", { day: "numeric", month: "short" });

  return (
    <div className="space-y-6">
      {/* Live banner */}
      {liveMatches.length > 0 && (
        <div className="rounded-xl bg-red-600 text-white px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 font-bold">
            <Radio className="size-4 animate-pulse" />
            {cs ? "Právě se hraje" : "Live now"}
          </span>
          <div className="flex flex-wrap gap-2 flex-1">
            {liveMatches.map((m) => {
              const home = m.homeTeam?.name ?? m.homeTeamName ?? "?";
              const away = m.awayTeam?.name ?? m.awayTeamName ?? "?";
              return (
                <a
                  key={m.id}
                  href={`/${locale}/matches/${m.id}/scoreboard`}
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1 text-sm font-medium transition-colors"
                >
                  {home} <span className="tabular-nums font-black">{m.homeScore ?? 0}:{m.awayScore ?? 0}</span> {away}
                  <ChevronRight className="size-3.5 opacity-70" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Status quick-change + Stats cards */}
      <div className="space-y-4">
        {canManage && (
          <div className="flex items-center gap-2">
            {statusSection}
            <select
              value={statusValue ?? ""}
              onChange={(e) => { if (e.target.value) handleStatusChange(e.target.value); }}
              disabled={savingStatus}
              className="h-8 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            >
              <option value="" disabled>{cs ? "Změnit stav…" : "Change status…"}</option>
              <option value="DRAFT">{cs ? "Koncept" : "Draft"}</option>
              <option value="ACTIVE">{cs ? "Aktivní" : "Active"}</option>
              <option value="FINISHED">{cs ? "Ukončená" : "Finished"}</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Users className="size-4 text-blue-500" />} label={cs ? "Týmy" : "Teams"} value={stats.teamCount} />
          <StatCard
            icon={<CalendarDays className="size-4 text-violet-500" />}
            label={cs ? "Zápasy" : "Matches"}
            value={`${stats.playedCount}/${stats.matchCount}`}
          />
          <StatCard icon={<Zap className="size-4 text-green-500" />} label={cs ? "Góly" : "Goals"} value={stats.totalGoals} />
          <StatCard
            icon={<Trophy className="size-4 text-yellow-500" />}
            label={cs ? "Nejlepší střelec" : "Top scorer"}
            value={stats.topScorer ?? "—"}
            small
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-0 flex-wrap items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              window.history.replaceState(null, "", `#${tab.id}`);
            }}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
        {canManage && (
          <a
            href={`/${locale}/schedule/${competitionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto mb-px px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap flex items-center gap-1"
          >
            {cs ? "Veřejný rozpis" : "Public schedule"}
            <span className="opacity-60">↗</span>
          </a>
        )}
      </div>

      {/* Tab content */}
      <div>
        {/* Standings tab */}
        {activeTab === "table" && (
          <div className="space-y-6">
            {standings && (
              <StandingsTable standings={standings} locale={locale} competitionId={competitionId} />
            )}
            {groupStandings && groupStandings.map((g) => (
              <div key={g.groupLabel}>
                <h3 className="font-semibold mb-2">{g.groupLabel}</h3>
                <StandingsTable standings={g.rows} locale={locale} competitionId={competitionId} />
              </div>
            ))}
          </div>
        )}

        {/* Bracket tab */}
        {activeTab === "bracket" && bracketSection}

        {/* Matches tab */}
        {activeTab === "matches" && matchesSection}

        {/* Teams tab */}
        {activeTab === "teams" && teamsSection}

        {/* Stats tab */}
        {activeTab === "stats" && statsSection}

        {/* Notice board tab */}
        {activeTab === "board" && (
          <div className="pt-2">
            <CompetitionNoticeBoard
              competitionId={competitionId}
              canManage={canManage}
              locale={locale}
            />
          </div>
        )}

        {/* Awards tab */}
        {activeTab === "awards" && (
          <CompetitionAwards
            competitionId={competitionId}
            competitionType={competitionType}
            canManage={canManage}
            locale={locale}
            standings={standings}
            groupStandings={groupStandings}
            bracketWinner={bracketWinner}
            bracketRunnerUp={bracketRunnerUp}
            bracketThird={bracketThird}
            players={players}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {icon}
          {label}
        </div>
        <div className={`font-bold tabular-nums truncate ${small ? "text-sm" : "text-2xl"}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function StandingsTable({
  standings,
  locale,
  competitionId: _competitionId,
}: {
  standings: StandingRow[];
  locale: string;
  competitionId: string;
}) {
  const cs = locale === "cs";
  const t = {
    pos: "#", team: cs ? "Tým" : "Team", p: "Z", w: "V", d: "R", l: "P",
    gfga: "G", gd: "+/-", pts: cs ? "B" : "Pts", form: cs ? "Forma" : "Form",
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 pl-4">{t.pos}</TableHead>
              <TableHead>{t.team}</TableHead>
              <TableHead className="text-center w-8">{t.p}</TableHead>
              <TableHead className="text-center w-8 hidden sm:table-cell">{t.w}</TableHead>
              <TableHead className="text-center w-8 hidden sm:table-cell">{t.d}</TableHead>
              <TableHead className="text-center w-8 hidden sm:table-cell">{t.l}</TableHead>
              <TableHead className="text-center w-12 hidden sm:table-cell">{t.gfga}</TableHead>
              <TableHead className="text-center w-8 hidden md:table-cell">{t.gd}</TableHead>
              <TableHead className="text-center w-10 font-bold">{t.pts}</TableHead>
              <TableHead className="hidden lg:table-cell w-28">{t.form}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((row, i) => (
              <TableRow key={row.teamId} className="hover:bg-muted/40 cursor-pointer transition-colors">
                <TableCell className="pl-4">
                  {i < 3 ? (
                    <Medal className={`size-4 ${MEDAL_COLORS[i]}`} />
                  ) : (
                    <span className="text-muted-foreground text-sm">{i + 1}</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {row.teamLogo
                      ? <img src={row.teamLogo} alt="" className="size-5 rounded-full object-cover shrink-0" />
                      : <span className="size-5 rounded-full bg-muted shrink-0" />}
                    {row.teamName}
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums">{row.played}</TableCell>
                <TableCell className="text-center tabular-nums text-green-600 dark:text-green-400 hidden sm:table-cell">{row.won}</TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground hidden sm:table-cell">{row.drawn}</TableCell>
                <TableCell className="text-center tabular-nums text-destructive hidden sm:table-cell">{row.lost}</TableCell>
                <TableCell className="text-center tabular-nums text-sm hidden sm:table-cell">{row.goalsFor}:{row.goalsAgainst}</TableCell>
                <TableCell className="text-center tabular-nums text-sm hidden md:table-cell">
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </TableCell>
                <TableCell className="text-center tabular-nums font-bold">{row.points}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex gap-0.5">
                    {row.form.map((f, fi) => (
                      <span
                        key={fi}
                        className={`size-5 rounded text-[10px] font-bold flex items-center justify-center ${FORM_COLORS[f]}`}
                        title={f === "W" ? (cs ? "Výhra" : "Win") : f === "D" ? (cs ? "Remíza" : "Draw") : (cs ? "Prohra" : "Loss")}
                      >
                        {FORM_LABELS[f]}
                      </span>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
