import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy, Users, CalendarDays, Plus, ArrowRight,
  ShieldCheck, Activity, Clock, UserCircle,
} from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  FINISHED: "bg-muted text-muted-foreground",
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session) redirect(`/${locale}/login`);

  const cs = locale === "cs";
  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMINISTRATOR";

  const [myTeams, myCompetitions, adminStats] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: userId },
      include: { sport: true, _count: { select: { players: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.competition.findMany({
      where: { organizerId: userId },
      include: {
        sport: true,
        _count: { select: { teams: true, matches: true } },
        matches: {
          where: { status: "SCHEDULED", scheduledAt: { gte: new Date() } },
          orderBy: { scheduledAt: "asc" },
          take: 3,
          select: {
            id: true, scheduledAt: true,
            homeTeamName: true, awayTeamName: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    isAdmin ? prisma.$transaction([
      prisma.user.count(),
      prisma.competition.count(),
      prisma.team.count(),
      prisma.match.count(),
    ]) : Promise.resolve(null),
  ]);

  const totalTeams = myTeams.length;
  const totalCompetitions = myCompetitions.length;
  const activeCompetitions = myCompetitions.filter(c => c.status === "ACTIVE").length;
  const totalMatches = myCompetitions.reduce((s, c) => s + c._count.matches, 0);

  const upcomingMatches = myCompetitions
    .flatMap(c => c.matches.map(m => ({ ...m, competitionName: c.name, competitionId: c.id })))
    .sort((a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0))
    .slice(0, 5);

  const statusLabel: Record<string, string> = cs
    ? { DRAFT: "Příprava", ACTIVE: "Aktivní", FINISHED: "Ukončená" }
    : { DRAFT: "Draft", ACTIVE: "Active", FINISHED: "Finished" };

  const typeLabel: Record<string, string> = cs
    ? { LEAGUE: "Liga", TOURNAMENT: "Turnaj", CUP: "Pohár" }
    : { LEAGUE: "League", TOURNAMENT: "Tournament", CUP: "Cup" };

  const fmt = (d: Date) => new Date(d).toLocaleString(cs ? "cs-CZ" : "en-US", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header + Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {cs ? `Vítej, ${session.user.name ?? session.user.email}!` : `Welcome, ${session.user.name ?? session.user.email}!`}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {cs ? "Přehled tvé aktivity v LigaKit" : "Your LigaKit activity overview"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/${locale}/competitions/new`}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="size-4" />
              {cs ? "Nová soutěž" : "New Competition"}
            </a>
            <a href={`/${locale}/teams/new`}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors">
              <Plus className="size-4" />
              {cs ? "Nový tým" : "New Team"}
            </a>
            <a href={`/${locale}/profile`}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors">
              <UserCircle className="size-4" />
              {cs ? "Profil" : "Profile"}
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: cs ? "Moje týmy" : "My Teams", value: totalTeams, icon: Users, color: "text-blue-500", href: `/${locale}/teams` },
            { label: cs ? "Moje soutěže" : "My Competitions", value: totalCompetitions, icon: Trophy, color: "text-yellow-500", href: `/${locale}/competitions` },
            { label: cs ? "Aktivní soutěže" : "Active Competitions", value: activeCompetitions, icon: Activity, color: "text-green-500", href: `/${locale}/competitions` },
            { label: cs ? "Celkem zápasů" : "Total Matches", value: totalMatches, icon: CalendarDays, color: "text-purple-500", href: `/${locale}/competitions` },
          ].map(stat => (
            <a key={stat.label} href={stat.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-0.5">{stat.value}</p>
                    </div>
                    <stat.icon className={`size-5 ${stat.color} mt-0.5`} />
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Recent Competitions */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="size-4" />
                {cs ? "Moje soutěže" : "My Competitions"}
              </CardTitle>
              <a href={`/${locale}/competitions`} className="text-xs text-primary hover:underline flex items-center gap-1">
                {cs ? "Všechny" : "All"} <ArrowRight className="size-3" />
              </a>
            </CardHeader>
            <CardContent>
              {myCompetitions.length === 0 ? (
                <div className="text-center py-6">
                  <Trophy className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{cs ? "Zatím žádné soutěže" : "No competitions yet"}</p>
                  <a href={`/${locale}/competitions/new`} className="text-xs text-primary hover:underline mt-1 inline-block">
                    {cs ? "Vytvořit první soutěž →" : "Create first competition →"}
                  </a>
                </div>
              ) : (
                <ul className="space-y-2">
                  {myCompetitions.map(c => (
                    <li key={c.id}>
                      <a href={`/${locale}/competitions/${c.id}`}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors group">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{typeLabel[c.type]} · {c._count.teams} {cs ? "týmů" : "teams"}</p>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[c.status]}`}>
                          {statusLabel[c.status]}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Matches */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="size-4" />
                {cs ? "Nejbližší zápasy" : "Upcoming Matches"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingMatches.length === 0 ? (
                <div className="text-center py-6">
                  <CalendarDays className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {cs ? "Žádné naplánované zápasy" : "No scheduled matches"}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {upcomingMatches.map(m => {
                    const home = m.homeTeam?.name ?? m.homeTeamName ?? "?";
                    const away = m.awayTeam?.name ?? m.awayTeamName ?? "?";
                    return (
                      <li key={m.id}>
                        <a href={`/${locale}/competitions/${m.competitionId}`}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{home} <span className="text-muted-foreground font-normal">vs</span> {away}</p>
                            <p className="text-xs text-muted-foreground truncate">{m.competitionName}</p>
                          </div>
                          {m.scheduledAt && (
                            <span className="text-xs text-muted-foreground shrink-0">{fmt(m.scheduledAt)}</span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* My Teams */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4" />
                {cs ? "Moje týmy" : "My Teams"}
              </CardTitle>
              <a href={`/${locale}/teams`} className="text-xs text-primary hover:underline flex items-center gap-1">
                {cs ? "Všechny" : "All"} <ArrowRight className="size-3" />
              </a>
            </CardHeader>
            <CardContent>
              {myTeams.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{cs ? "Zatím žádné týmy" : "No teams yet"}</p>
                  <a href={`/${locale}/teams/new`} className="text-xs text-primary hover:underline mt-1 inline-block">
                    {cs ? "Vytvořit první tým →" : "Create first team →"}
                  </a>
                </div>
              ) : (
                <ul className="space-y-2">
                  {myTeams.map(t => (
                    <li key={t.id}>
                      <a href={`/${locale}/teams/${t.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors group">
                        {t.logoUrl
                          ? <img src={t.logoUrl} alt="" className="size-8 rounded object-cover shrink-0" />
                          : <div className="size-8 rounded bg-muted flex items-center justify-center shrink-0"><Users className="size-4 text-muted-foreground" /></div>
                        }
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.sport?.name ?? (cs ? "Bez sportu" : "No sport")} · {t._count.players} {cs ? "hráčů" : "players"}</p>
                        </div>
                        <ArrowRight className="size-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Admin Stats or Profile card */}
          {isAdmin && adminStats ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  {cs ? "Admin přehled" : "Admin Overview"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: cs ? "Uživatelé" : "Users", value: (adminStats as number[])[0] },
                    { label: cs ? "Soutěže" : "Competitions", value: (adminStats as number[])[1] },
                    { label: cs ? "Týmy" : "Teams", value: (adminStats as number[])[2] },
                    { label: cs ? "Zápasy" : "Matches", value: (adminStats as number[])[3] },
                  ].map(s => (
                    <div key={s.label} className="bg-background/60 rounded-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-xl font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>
                <a href={`/${locale}/admin`}
                  className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  <ShieldCheck className="size-4" />
                  {cs ? "Otevřít administraci" : "Open Admin Panel"}
                </a>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCircle className="size-4" />
                  {cs ? "Můj účet" : "My Account"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 py-1">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {(session.user.name ?? session.user.email ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{session.user.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {cs ? "Uživatel" : "User"}
                  </Badge>
                </div>
                <a href={`/${locale}/profile`}
                  className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors">
                  <UserCircle className="size-4" />
                  {cs ? "Upravit profil" : "Edit Profile"}
                </a>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
