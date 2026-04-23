import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompetitionTeamsManager } from "@/components/competition-teams-manager";
import { CompetitionMatchesManager } from "@/components/competition-matches-manager";
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
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("competitions");

  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      sport: { select: { id: true, name: true, icon: true } },
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
        },
      },
    },
  });

  if (!competition) notFound();

  const isAdmin = session.user.role === "ADMINISTRATOR";
  const isOrganizer = competition.organizerId === session.user.id;
  const canManage = isAdmin || isOrganizer;

  if (!competition.isPublic && !canManage) notFound();

  const [allTeams, myTeams, matchEvents] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, logoUrl: true } }),
    prisma.team.findMany({ where: { ownerId: session.user.id }, orderBy: { name: "asc" }, select: { id: true, name: true, logoUrl: true } }),
    prisma.matchEvent.findMany({
      where: { match: { competitionId: id } },
      select: { type: true, teamSide: true, playerName: true, matchId: true },
    }),
  ]);

  const teamsForStandings = competition.teams.map((ct) => ({
    team: ct.team ?? { id: ct.guestName ?? ct.id, name: ct.guestName ?? "?", logoUrl: null },
  }));

  const standings = competition.type === "LEAGUE"
    ? computeStandings(teamsForStandings, competition.matches)
    : null;

  const groupStandings = competition.type === "CUP"
    ? computeGroupStandings(teamsForStandings, competition.matches)
    : null;

  const matchTeams = competition.teams.filter((ct) => ct.team !== null).map((ct) => ct.team!);
  const guestTeamNames = competition.teams.filter((ct) => ct.team === null && ct.guestName).map((ct) => ct.guestName!);

  const exportMatches = competition.matches.map((m) => ({
    round: m.round, note: m.note,
    homeTeamName: m.homeTeam?.name ?? m.homeTeamName ?? "?",
    awayTeamName: m.awayTeam?.name ?? m.awayTeamName ?? "?",
    homeScore: m.homeScore, awayScore: m.awayScore,
    scheduledAt: m.scheduledAt, status: m.status,
  }));
  const exportStandings = standings ? standings.map((row, i) => ({ pos: i + 1, ...row })) : null;

  const playedMatches = competition.matches.filter((m) => m.status === "PLAYED");
  const totalGoals = playedMatches.reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);

  // ── Competition statistics ──────────────────────────────────────────────
  // Top scorers
  const scorerMap = new Map<string, { name: string; teamName: string; goals: number }>();
  for (const ev of matchEvents) {
    if (ev.type !== "GOAL" || !ev.playerName) continue;
    const match = competition.matches.find((m) => m.id === ev.matchId);
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
    const match = competition.matches.find((m) => m.id === ev.matchId);
    if (!match) continue;
    const teamName = ev.teamSide === "HOME"
      ? (match.homeTeam?.name ?? match.homeTeamName ?? "?")
      : (match.awayTeam?.name ?? match.awayTeamName ?? "?");
    const key = `${ev.playerName}__${teamName}`;
    const existing = cardMap.get(key) ?? { name: ev.playerName, teamName, yellow: 0, red: 0 };
    cardMap.set(key, {
      ...existing,
      yellow: existing.yellow + (ev.type === "YELLOW_CARD" ? 1 : 0),
      red: existing.red + (ev.type === "RED_CARD" ? 1 : 0),
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

  const liveMatches = competition.matches
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
        <CompetitionMatchesManager
          competitionId={id}
          initialMatches={competition.matches as Parameters<typeof CompetitionMatchesManager>[0]["initialMatches"]}
          teams={matchTeams}
          guestTeamNames={guestTeamNames}
          canManage={canManage}
          isTournament={competition.type === "TOURNAMENT"}
          locale={locale}
        />
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
          matches={competition.matches as Parameters<typeof TournamentBracket>[0]["matches"]}
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
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
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
                {competition.sport?.icon
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
              {canManage && (
                <>
                  <DrawWizard
                    competitionId={id}
                    competitionType={competition.type as "LEAGUE" | "CUP" | "TOURNAMENT"}
                    teamCount={competition.teams.length}
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
          />
        </div>
      </main>
    </div>
  );
}
