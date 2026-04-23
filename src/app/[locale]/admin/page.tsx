import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Shield, UserCheck, Trophy, Dumbbell, ClipboardList } from "lucide-react";
import { AdminCharts } from "@/components/admin-charts";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMINISTRATOR") redirect(`/${locale}/dashboard`);

  const t = await getTranslations("admin");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const [totalUsers, adminCount, totalTeams, totalSports, totalCompetitions, recentUsers, teamsWithSport] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMINISTRATOR" } }),
    prisma.team.count(),
    prisma.sport.count(),
    prisma.competition.count(),
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.team.findMany({
      select: { sport: { select: { name: true } } },
    }),
  ]);
  const userCount = totalUsers - adminCount;

  // Build day-by-day counts for area chart
  const dayMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const u of recentUsers) {
    const key = new Date(u.createdAt).toISOString().slice(0, 10);
    if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  const newUsersPerDay = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));

  // Teams by sport for pie chart
  const sportCountMap = new Map<string, number>();
  for (const team of teamsWithSport) {
    const name = team.sport?.name ?? (locale === "cs" ? "Bez sportu" : "No sport");
    sportCountMap.set(name, (sportCountMap.get(name) ?? 0) + 1);
  }
  const teamsBySport = Array.from(sportCountMap.entries()).map(([name, value]) => ({ name, value }));

  const stats = [
    {
      label: t("totalUsers"),
      value: totalUsers,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: t("administrators"),
      value: adminCount,
      icon: Shield,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: t("regularUsers"),
      value: userCount,
      icon: UserCheck,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: t("totalTeams"),
      value: totalTeams,
      icon: Trophy,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: locale === "cs" ? "Sporty" : "Sports",
      value: totalSports,
      icon: Dumbbell,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
    {
      label: locale === "cs" ? "Soutěže" : "Competitions",
      value: totalCompetitions,
      icon: ClipboardList,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <stat.icon className={`size-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <AdminCharts newUsersPerDay={newUsersPerDay} teamsBySport={teamsBySport} locale={locale} />

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            <Card>
              <CardHeader>
                <CardTitle>{t("users")}</CardTitle>
                <CardDescription>{t("usersDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={`/${locale}/admin/users`}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors gap-2"
                >
                  <Users className="size-4" />
                  {t("users")}
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("teams")}</CardTitle>
                <CardDescription>{t("teamsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={`/${locale}/admin/teams`}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors gap-2"
                >
                  <Trophy className="size-4" />
                  {t("teams")}
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{locale === "cs" ? "Číselník sportů" : "Sports Registry"}</CardTitle>
                <CardDescription>{locale === "cs" ? "Správa dostupných sportů" : "Manage available sports"}</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={`/${locale}/admin/sports`}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors gap-2"
                >
                  <Dumbbell className="size-4" />
                  {locale === "cs" ? "Spravovat sporty" : "Manage Sports"}
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{locale === "cs" ? "Soutěže" : "Competitions"}</CardTitle>
                <CardDescription>{locale === "cs" ? "Správa všech soutěží a turnajů" : "Manage all competitions"}</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={`/${locale}/admin/competitions`}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors gap-2"
                >
                  <Trophy className="size-4" />
                  {locale === "cs" ? "Spravovat" : "Manage"}
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{locale === "cs" ? "Audit log" : "Audit Log"}</CardTitle>
                <CardDescription>{locale === "cs" ? "Historie administrativních akcí" : "History of admin actions"}</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={`/${locale}/admin/audit`}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors gap-2"
                >
                  <ClipboardList className="size-4" />
                  {locale === "cs" ? "Zobrazit log" : "View Log"}
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
