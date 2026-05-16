import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompetitionTeamsManager } from "@/components/competition-teams-manager";
import { CompetitionMatchesManager } from "@/components/competition-matches-manager";
import { MatchSchedule } from "@/components/match-schedule";
import { CompetitionDetailClient } from "@/components/competition-detail-client";
import { CompetitionStatsSection, type CompetitionStats } from "@/components/competition-stats-section";
import { DrawWizard } from "@/components/draw-wizard";
import { TournamentBracket } from "@/components/tournament-bracket";
import { ExportMenu } from "@/components/export-menu";
import { computeStandings, computeGroupStandings } from "@/lib/standings";
import { Trophy, CalendarDays, Pencil, Dumbbell, Lock, Globe } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  FINISHED: "outline",
};

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();

  const t = await getTranslations("competitions");

  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      sport: {
        select: {
          id: true, name: true, icon: true,
          eventTypes: { select: { name: true, affectsScore: true } },
        },
      },
      organizer: { select: { id: true, name: true, email: true } },
      teams: {
        orderBy: { joinedAt: "asc" },
        include: { team: { select: { id: true, name: true, logoUrl: true } } },
      },
      matches: {
        orderBy: [{ round: "asc" }, { scheduledAt: "asc" }],
        include: {
          homeTeam: { select: { id: true, name: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, logoUrl: true } },
          events: { select: { type: true, teamSide: true } },
        },
      },
    },
  });

  if (!competition) notFound();

  const isAdmin = session?.user.role === "ADMINISTRATOR";
  const isOrganizer = session ? competition.organizerId === session.user.id : false;
  const canManage = isAdmin || isOrganizer;

  if (!competition.isPublic && !canManage) notFound();

  // Recalculate scores from events
  const sportEventTypes = competition.sport?.eventTypes ?? [];
  const matchesWithScore = competition.matches.map((m) => {
    let homeScore = 0;
    let awayScore = 0;
    for (const e of m.events) {
      const et = sportEventTypes.find((t) => t.name === e.type);
      const scores = et?.affectsScore || e.type === "GOAL" || e.type === "OWN_GOAL";
      if (!scores) continue;
      if (e.type === "OWN_GOAL") {
        if (e.teamSide === "HOME") awayScore++; else homeScore++;
      } else {
        if (e.teamSide === "HOME") homeScore++; else awayScore++;
      }
    }
    const hasEvents = m.events.length > 0;
    return {
      ...m,
      homeScore: hasEvents ? homeScore : m.homeScore,
      awayScore: hasEvents ? awayScore : m.awayScore,
    };
  });
  // Replace matches with recalculated scores
  const competitionWithScore = { ...competition, matches: matchesWithScore };

  const [allTeams, myTeams, matchEvents, rosterPlayers] = await Promise.all([
    canManage ? prisma.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, logoUrl: true } }) : Promise.resolve([]),
    session ? prisma.team.findMany({ where: { ownerId: session.user.id }, orderBy: { name: "asc" }, select: { id: true, name: true, logoUrl: true } }) : Promise.resolve([]),
    prisma.matchEvent.findMany({
      where: { match: { competitionId: id } },
      select: { type: true, teamSide: true, playerName: true, matchId: true },
    }),
    prisma.player.findMany({
      where: { team: { competitions: { some: { competitionId: id } } } },
      select: { id: true, name: true, number: true, team: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const players = rosterPlayers.map(p => ({
    id: p.id,
    name: p.name,
    number: p.number,
    teamName: p.team.name,
  }));

  // Determine bracket podium for TOURNAMENT/CUP
  let bracketWinner: string | null = null;
  let bracketRunnerUp: string | null = null;
  let bracketThird: string | null = null;

  if (competition.type === "TOURNAMENT" || competition.type === "CUP") {
    const bracketMatches = competition.matches.filter(m => m.bracketPos !== null && m.status === "PLAYED");
    if (bracketMatches.length > 0) {
      // Final = highest round, bracketPos 0
      const maxRound = Math.max(...bracketMatches.map(m => m.round ?? 0));
      const finalMatch = bracketMatches.find(m => m.round === maxRound && m.bracketPos === 0);
      if (finalMatch && finalMatch.homeScore !== null && finalMatch.awayScore !== null) {
        const homeWon = finalMatch.homeScore > finalMatch.awayScore;
        bracketWinner = homeWon
          ? (finalMatch.homeTeam?.name ?? finalMatch.homeTeamName)
          : (finalMatch.awayTeam?.name ?? finalMatch.awayTeamName);
        bracketRunnerUp = homeWon
          ? (finalMatch.awayTeam?.name ?? finalMatch.awayTeamName)
          : (finalMatch.homeTeam?.name ?? finalMatch.homeTeamName);
      }
      // 3rd place match: bracketPos === -1
      const thirdMatch = bracketMatches.find(m => m.bracketPos === -1);
      if (thirdMatch && thirdMatch.homeScore !== null && thirdMatch.awayScore !== null) {
        const homeWon = thirdMatch.homeScore > thirdMatch.awayScore;
        bracketThird = homeWon
          ? (thirdMatch.homeTeam?.name ?? thirdMatch.homeTeamName)
          : (thirdMatch.awayTeam?.name ?? thirdMatch.awayTeamName);
      }
    }
  }

  const teamsForStandings = competitionWithScore.teams.map((ct) => ({
    team: ct.team ?? { id: ct.guestName ?? ct.id, name: ct.guestName ?? "?", logoUrl: null },
  }));

  const standings = competitionWithScore.type === "LEAGUE"
    ? computeStandings(teamsForStandings, competitionWithScore.matches)
    : null;

  const groupStandings = competitionWithScore.type === "CUP"
    ? computeGroupStandings(teamsForStandings, competitionWithScore.matches)
    : null;

  const matchTeams = competition.teams.filter((ct) => ct.team !== null).map((ct) => ct.team!);
  const guestTeamNames = competition.teams.filter((ct) => ct.team === null && ct.guestName).map((ct) => ct.guestName!);

  const exportMatches = competitionWithScore.matches.map((m) => ({
    round: m.round, note: m.note,
    homeTeamName: m.homeTeam?.name ?? m.homeTeamName ?? "?",
    awayTeamName: m.awayTeam?.name ?? m.awayTeamName ?? "?",
    homeScore: m.homeScore, awayScore: m.awayScore,
    scheduledAt: m.scheduledAt, status: m.status,
  }));
  const exportStandings = standings ? standings.map((row, i) => ({ pos: i + 1, ...row })) : null;

  const playedMatches = competitionWithScore.matches.filter((m) => m.status === "PLAYED");
  const totalGoals = playedMatches.reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);

  // ── Competition statistics ──────────────────────────────────────────────
  // Top scorers
  const scorerMap = new Map<string, { name: string; teamName: string; goals: number }>();
  for (const ev of matchEvents) {
    if (ev.type !== "GOAL" || !ev.playerName) continue;
    const match = competitionWithScore.matches.find((m) => m.id === ev.matchId);
    if (!match) continue;
    const teamName = ev.teamSide === "HOME"
      ? (match.homeTeam?.name ?? match.homeTeamName ?? "?")
      : (match.awayTeam?.name ?? match.awayTeamName ?? "?");
    const key = `${ev.playerName}__${teamName}`;
    const existing = scorerMap.get(key);
    scorerMap.set(key, existing
      ? { ...existing, goals: existing.goals + 1 }
      : { name: ev.playerName, teamName, goals: 1 });
  }
  const topScorers = [...scorerMap.values()].sort((a, b) => b.goals - a.goals).slice(0, 10);

  // Cards
  const cardMap = new Map<string, { name: string; teamName: string; yellow: number; red: number }>();
  for (const ev of matchEvents) {
    if ((ev.type !== "YELLOW_CARD" && ev.type !== "RED_CARD") || !ev.playerName) continue;
    const match = competitionWithScore.matches.find((m) => m.id === ev.matchId);
    if (!match) continue;
    const teamName = ev.teamSide === "HOME"
      ? (match.homeTeam?.name ?? match.homeTeamName ?? "?")
      : (match.awayTeam?.name ?? match.awayTeamName ?? "?");
    const key = `${ev.playerName}__${teamName}`;
    const existing2 = cardMap.get(key) ?? { name: ev.playerName, teamName, yellow: 0, red: 0 };
    cardMap.set(key, {
      ...existing2,
      yellow: existing2.yellow + (ev.type === "YELLOW_CARD" ? 1 : 0),
      red: existing2.red + (ev.type === "RED_CARD" ? 1 : 0),
    });
  }
  const topCards = [...cardMap.values()]
    .sort((a, b) => (b.red * 3 + b.yellow) - (a.red * 3 + a.yellow))
    .slice(0, 10);

  // Team stats from played matches
  const teamStatsMap = new Map<string, { name: string; scored: number; conceded: number; played: number }>();
  for (const m of playedMatches) {
    const homeName = m.homeTeam?.name ?? m.homeTeamName ?? "?";
    const awayName = m.awayTeam?.name ?? m.awayTeamName ?? "?";
    const homeScored = m.homeScore ?? 0;
    const awayScored = m.awayScore ?? 0;
    const home = teamStatsMap.get(homeName) ?? { name: homeName, scored: 0, conceded: 0, played: 0 };
    teamStatsMap.set(homeName, { ...home, scored: home.scored + homeScored, conceded: home.conceded + awayScored, played: home.played + 1 });
    const away = teamStatsMap.get(awayName) ?? { name: awayName, scored: 0, conceded: 0, played: 0 };
    teamStatsMap.set(awayName, { ...away, scored: away.scored + awayScored, conceded: away.conceded + homeScored, played: away.played + 1 });
  }
  const teamStatsList = [...teamStatsMap.values()].filter((t) => t.played > 0);
  const bestAttack = teamStatsList.length > 0 ? teamStatsList.reduce((a, b) => b.scored > a.scored ? b : a) : null;
  const worstAttack = teamStatsList.length > 0 ? teamStatsList.reduce((a, b) => b.scored < a.scored ? b : a) : null;
  const bestDefense = teamStatsList.length > 0 ? teamStatsList.reduce((a, b) => b.conceded < a.conceded ? b : a) : null;
  const avgGoalsPerMatch = playedMatches.length > 0 ? totalGoals / playedMatches.length : null;

  const competitionStats: CompetitionStats = { topScorers, topCards, bestAttack, worstAttack, bestDefense, avgGoalsPerMatch };

  // Top scorer for stat card
  const topScorerName = topScorers[0] ? `${topScorers[0].name} (${topScorers[0].goals})` : null;

  const liveMatches = competitionWithScore.matches
    .filter((m) => (m as { matchState?: string | null }).matchState === "LIVE")
    .map((m) => ({
      id: m.id,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      matchState: (m as { matchState?: string | null }).matchState ?? null,
      homeTeam: m.homeTeam ? { name: m.homeTeam.name } : null,
      awayTeam: m.awayTeam ? { name: m.awayTeam.name } : null,
      homeTeamName: m.homeTeamName,
      awayTeamName: m.awayTeamName,
    }));

  const stats = {
    teamCount: competition.teams.length,
    matchCount: competition.matches.length,
    playedCount: playedMatches.length,
    totalGoals,
    topScorer: topScorerName,
  };

  const matchesSection = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="size-4" />
          {t("matches")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {canManage ? (
          <CompetitionMatchesManager
            competitionId={id}
            initialMatches={competitionWithScore.matches as Parameters<typeof CompetitionMatchesManager>[0]["initialMatches"]}
            teams={matchTeams}
            guestTeamNames={guestTeamNames}
            canManage={canManage}
            isTournament={competition.type === "TOURNAMENT"}
            locale={locale}
          />
        ) : (
          <MatchSchedule
            matches={competitionWithScore.matches as Parameters<typeof MatchSchedule>[0]["matches"]}
            locale={locale}
          />
        )}
      </CardContent>
    </Card>
  );

  const teamsSection = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="size-4" />
          {t("teams")} ({competition.teams.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CompetitionTeamsManager
          competitionId={id}
          isPublic={competition.isPublic}
          initialTeams={competition.teams as Parameters<typeof CompetitionTeamsManager>[0]["initialTeams"]}
          availableTeams={allTeams}
          myTeams={myTeams}
          canManage={canManage}
          locale={locale}
        />
      </CardContent>
    </Card>
  );

  const bracketSection = (competition.type === "TOURNAMENT" || competition.type === "CUP") ? (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="size-4" />
          {t("bracket")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TournamentBracket
          matches={competitionWithScore.matches as Parameters<typeof TournamentBracket>[0]["matches"]}
          locale={locale}
        />
      </CardContent>
    </Card>
  ) : null;

  const statsSection = (
    <CompetitionStatsSection stats={competitionStats} locale={locale} />
  );

  const statusSection = (
    <Badge variant={STATUS_VARIANT[competition.status]}>{t(`status${competition.status}`)}</Badge>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: locale === "cs" ? "Přehled" : "Dashboard", href: `/${locale}/dashboard` },
            { label: t("title"), href: `/${locale}/competitions` },
            { label: competition.name },
          ]} />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 shrink-0">
                {competition.logoUrl
                  ? <img src={competition.logoUrl} alt="" className="size-7 object-contain rounded-lg" />
                  : competition.sport?.icon
                    ? <img src={competition.sport.icon} alt="" className="size-7 object-cover rounded-lg" />
                    : <Trophy className="size-7 text-primary" />}
              </div>
              <div className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight">{competition.name}</h1>
                {competition.description && (
                  <p className="text-muted-foreground">{competition.description}</p>
                )}
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline">{t(`type${competition.type}`)}</Badge>
                  <Badge variant="outline" className="gap-1">
                    {competition.isPublic
                      ? <><Globe className="size-3" />{locale === "cs" ? "Veřejný" : "Public"}</>
                      : <><Lock className="size-3" />{locale === "cs" ? "Soukromý" : "Private"}</>}
                  </Badge>
                  {competition.sport && (
                    <Badge variant="secondary" className="gap-1">
                      {competition.sport.icon
                        ? <img src={competition.sport.icon} alt="" className="size-3.5 object-cover rounded-sm" />
                        : <Dumbbell className="size-3.5" />}
                      {competition.sport.name}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {t("organizer")}: <span className="font-medium text-foreground">
                      {competition.organizer.name ?? competition.organizer.email}
                    </span>
                  </span>
                </div>
                {(competition.startDate || competition.endDate) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="size-3.5" />
                    {competition.startDate && new Date(competition.startDate).toLocaleDateString(locale === "cs" ? "cs-CZ" : "en-US")}
                    {competition.startDate && competition.endDate && " — "}
                    {competition.endDate && new Date(competition.endDate).toLocaleDateString(locale === "cs" ? "cs-CZ" : "en-US")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <ExportMenu
                competitionName={competition.name}
                competitionType={competition.type as "LEAGUE" | "CUP" | "TOURNAMENT"}
                matches={exportMatches}
                standings={exportStandings}
                locale={locale}
              />
              {!session && (
                <a
                  href={`/${locale}/login`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  {locale === "cs" ? "Přihlásit se" : "Sign in"}
                </a>
              )}
              {canManage && (
                <>
                  <DrawWizard
                    competitionId={id}
                    competitionType={competition.type as "LEAGUE" | "CUP" | "TOURNAMENT"}
                    teamCount={competition.teams.length}
                    teams={competition.teams.map((ct) => ({
                      id: ct.teamId ?? null,
                      name: ct.team?.name ?? ct.guestName ?? "?",
                    }))}
                    hasExistingMatches={competition.matches.length > 0}
                    locale={locale}
                  />
                  <a
                    href={`/${locale}/competitions/${id}/edit`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-sm hover:bg-muted transition-colors"
                  >
                    <Pencil className="size-3.5" />
                    {locale === "cs" ? "Upravit" : "Edit"}
                  </a>
                </>
              )}
            </div>
          </div>

          <CompetitionDetailClient
            locale={locale}
            competitionId={id}
            competitionType={competition.type}
            canManage={canManage}
            standings={standings}
            groupStandings={groupStandings}
            liveMatches={liveMatches}
            stats={stats}
            matchesSection={matchesSection}
            teamsSection={teamsSection}
            bracketSection={bracketSection}
            statsSection={statsSection}
            statusSection={statusSection}
            bracketWinner={bracketWinner}
            bracketRunnerUp={bracketRunnerUp}
            bracketThird={bracketThird}
            players={players}
          />
        </div>
      </main>
    </div>
  );
}
