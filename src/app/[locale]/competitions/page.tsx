import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompetitionsClient } from "@/components/competitions-client";

export default async function CompetitionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("competitions");
  const isAdmin = session.user.role === "ADMINISTRATOR";
  const userId = session.user.id;

  const competitions = await prisma.competition.findMany({
    where: isAdmin
      ? undefined
      : { OR: [{ isPublic: true }, { organizerId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      sport: { select: { name: true, icon: true } },
      organizer: { select: { id: true, name: true, email: true } },
      _count: { select: { teams: true, matches: true } },
      matches: {
        select: { status: true, matchState: true },
      },
    },
  });

  const enriched = competitions.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    type: c.type,
    status: c.status,
    isPublic: c.isPublic,
    startDate: c.startDate?.toISOString() ?? null,
    endDate: c.endDate?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    sport: c.sport,
    organizer: c.organizer,
    teamCount: c._count.teams,
    matchCount: c._count.matches,
    playedCount: c.matches.filter((m) => m.status === "PLAYED").length,
    hasLive: c.matches.some((m) => m.matchState === "LIVE"),
    isOwn: c.organizer.id === userId,
  }));

  const sports = [...new Map(
    competitions.filter((c) => c.sport).map((c) => [c.sport!.name, c.sport!])
  ).values()];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: locale === "cs" ? "Přehled" : "Dashboard", href: `/${locale}/dashboard` },
            { label: t("title") },
          ]} />
          <CompetitionsClient
            competitions={enriched}
            sports={sports}
            locale={locale}
            isAdmin={isAdmin}
            userId={userId}
            labels={{
              title: t("title"),
              subtitle: t("subtitle"),
              create: t("create"),
              noCompetitions: t("noCompetitions"),
              noCompetitionsDesc: t("noCompetitionsDesc"),
              teamsCount: t("teamsCount"),
              matchesCount: t("matchesCount"),
              statusDRAFT: t("statusDRAFT"),
              statusACTIVE: t("statusACTIVE"),
              statusFINISHED: t("statusFINISHED"),
              typeLEAGUE: t("typeLEAGUE"),
              typeCUP: t("typeCUP"),
              typeTOURNAMENT: t("typeTOURNAMENT"),
            }}
          />
        </div>
      </main>
    </div>
  );
}
