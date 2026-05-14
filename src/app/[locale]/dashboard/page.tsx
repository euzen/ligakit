import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/prisma";
import {
  Trophy, Users, CalendarDays, Plus, ArrowRight,
  ShieldCheck, Activity, Clock, UserCircle,
} from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 font-bold",
  DRAFT: "bg-orange-100 text-orange-600 font-bold",
  FINISHED: "bg-slate-100 text-slate-500 font-bold",
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
    <div className="min-h-screen bg-slate-50">
      <Navbar locale={locale} />
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header + Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {cs ? `Vítej, ${session.user.name ?? session.user.email}!` : `Welcome, ${session.user.name ?? session.user.email}!`}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {cs ? "Přehled tvé aktivity v LigaKit" : "Your LigaKit activity overview"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/${locale}/competitions/new`}
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 shadow-md shadow-blue-100 transition-all">
              <Plus className="size-4" />
              {cs ? "Nová soutěž" : "New Competition"}
            </a>
            <a href={`/${locale}/teams/new`}
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full border border-slate-200 bg-white text-sm font-bold hover:border-blue-700 hover:text-blue-700 transition-all">
              <Plus className="size-4" />
              {cs ? "Nový tým" : "New Team"}
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: cs ? "Moje týmy" : "My Teams", value: totalTeams, icon: Users, iconBg: "bg-blue-100", iconColor: "text-blue-700", href: `/${locale}/teams` },
            { label: cs ? "Moje soutěže" : "My Competitions", value: totalCompetitions, icon: Trophy, iconBg: "bg-orange-100", iconColor: "text-orange-500", href: `/${locale}/competitions` },
            { label: cs ? "Aktivní soutěže" : "Active Competitions", value: activeCompetitions, icon: Activity, iconBg: "bg-green-100", iconColor: "text-green-600", href: `/${locale}/competitions` },
            { label: cs ? "Celkem zápasů" : "Total Matches", value: totalMatches, icon: CalendarDays, iconBg: "bg-slate-100", iconColor: "text-slate-600", href: `/${locale}/competitions` },
          ].map(stat => (
            <a key={stat.label} href={stat.href}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`size-5 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{stat.label}</p>
            </a>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Recent Competitions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="size-4 text-orange-500" />
                {cs ? "Moje soutěže" : "My Competitions"}
              </h2>
              <a href={`/${locale}/competitions`} className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1">
                {cs ? "Všechny" : "All"} <ArrowRight className="size-3" />
              </a>
            </div>
            <div className="p-4">
              {myCompetitions.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="size-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">{cs ? "Zatím žádné soutěže" : "No competitions yet"}</p>
                  <a href={`/${locale}/competitions/new`} className="text-xs font-bold text-blue-700 hover:underline mt-2 inline-block">
                    {cs ? "Vytvořit první soutěž →" : "Create first competition →"}
                  </a>
                </div>
              ) : (
                <ul className="space-y-1">
                  {myCompetitions.map(c => (
                    <li key={c.id}>
                      <a href={`/${locale}/competitions/${c.id}`}
                        className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-slate-900 group-hover:text-blue-700 transition-colors">{c.name}</p>
                          <p className="text-xs text-slate-400">{typeLabel[c.type]} · {c._count.teams} {cs ? "týmů" : "teams"}</p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[c.status]}`}>
                          {statusLabel[c.status]}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Upcoming Matches */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="size-4 text-blue-700" />
                {cs ? "Nejbližší zápasy" : "Upcoming Matches"}
              </h2>
            </div>
            <div className="p-4">
              {upcomingMatches.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="size-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    {cs ? "Žádné naplánované zápasy" : "No scheduled matches"}
                  </p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {upcomingMatches.map(m => {
                    const home = m.homeTeam?.name ?? m.homeTeamName ?? "?";
                    const away = m.awayTeam?.name ?? m.awayTeamName ?? "?";
                    return (
                      <li key={m.id}>
                        <a href={`/${locale}/competitions/${m.competitionId}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-slate-900">{home} <span className="text-slate-400 font-normal">vs</span> {away}</p>
                            <p className="text-xs text-slate-400 truncate">{m.competitionName}</p>
                          </div>
                          {m.scheduledAt && (
                            <span className="text-xs text-slate-400 shrink-0 font-medium">{fmt(m.scheduledAt)}</span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* My Teams */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Users className="size-4 text-blue-700" />
                {cs ? "Moje týmy" : "My Teams"}
              </h2>
              <a href={`/${locale}/teams`} className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1">
                {cs ? "Všechny" : "All"} <ArrowRight className="size-3" />
              </a>
            </div>
            <div className="p-4">
              {myTeams.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="size-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">{cs ? "Zatím žádné týmy" : "No teams yet"}</p>
                  <a href={`/${locale}/teams/new`} className="text-xs font-bold text-blue-700 hover:underline mt-2 inline-block">
                    {cs ? "Vytvořit první tým →" : "Create first team →"}
                  </a>
                </div>
              ) : (
                <ul className="space-y-1">
                  {myTeams.map(t => (
                    <li key={t.id}>
                      <a href={`/${locale}/teams/${t.id}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                        {t.logoUrl
                          ? <img src={t.logoUrl} alt="" className="size-9 rounded-xl object-cover shrink-0" />
                          : <div className="size-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><Users className="size-4 text-blue-700" /></div>
                        }
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate text-slate-900 group-hover:text-blue-700 transition-colors">{t.name}</p>
                          <p className="text-xs text-slate-400">{t.sport?.name ?? (cs ? "Bez sportu" : "No sport")} · {t._count.players} {cs ? "hráčů" : "players"}</p>
                        </div>
                        <ArrowRight className="size-3.5 text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Admin Stats or Profile card */}
          {isAdmin && adminStats ? (
            <div className="bg-blue-700 rounded-2xl shadow-xl shadow-blue-100 overflow-hidden text-white">
              <div className="px-6 py-4 border-b border-blue-600">
                <h2 className="font-bold flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  {cs ? "Admin přehled" : "Admin Overview"}
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: cs ? "Uživatelé" : "Users", value: (adminStats as number[])[0] },
                    { label: cs ? "Soutěže" : "Competitions", value: (adminStats as number[])[1] },
                    { label: cs ? "Týmy" : "Teams", value: (adminStats as number[])[2] },
                    { label: cs ? "Zápasy" : "Matches", value: (adminStats as number[])[3] },
                  ].map(s => (
                    <div key={s.label} className="bg-blue-600/50 rounded-xl px-4 py-3">
                      <p className="text-xs text-blue-200 font-medium">{s.label}</p>
                      <p className="text-2xl font-extrabold">{s.value}</p>
                    </div>
                  ))}
                </div>
                <a href={`/${locale}/admin`}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white text-blue-700 text-sm font-bold hover:bg-blue-50 transition-colors shadow-md">
                  <ShieldCheck className="size-4" />
                  {cs ? "Otevřít administraci" : "Open Admin Panel"}
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <UserCircle className="size-4 text-blue-700" />
                  {cs ? "Můj účet" : "My Account"}
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="size-11 rounded-2xl bg-blue-700 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                    {(session.user.name ?? session.user.email ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{session.user.name ?? "—"}</p>
                    <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                    {cs ? "Uživatel" : "User"}
                  </span>
                </div>
                <a href={`/${locale}/profile`}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 hover:border-blue-700 hover:text-blue-700 transition-all">
                  <UserCircle className="size-4" />
                  {cs ? "Upravit profil" : "Edit Profile"}
                </a>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
