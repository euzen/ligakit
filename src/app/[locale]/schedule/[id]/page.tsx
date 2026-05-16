import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SchedulePage } from "@/components/schedule-page";

export default async function PublicSchedulePageRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const competition = await prisma.competition.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      isPublic: true,
      type: true,
      sport: { select: { icon: true, name: true, eventTypes: { select: { name: true, affectsScore: true } } } },
      logoUrl: true,
      matches: {
        orderBy: [{ round: "asc" }, { scheduledAt: "asc" }],
        select: {
          id: true,
          round: true,
          note: true,
          bracketPos: true,
          homeTeamName: true,
          awayTeamName: true,
          homeScore: true,
          awayScore: true,
          status: true,
          scheduledAt: true,
          matchState: true,
          period: true,
          startedAt: true,
          periodOffset: true,
          homeTeam: { select: { id: true, name: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, logoUrl: true } },
          events: { select: { type: true, teamSide: true } },
        },
      },
    },
  });

  if (!competition || !competition.isPublic) notFound();

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
      events: undefined,
      homeScore: hasEvents ? homeScore : m.homeScore,
      awayScore: hasEvents ? awayScore : m.awayScore,
    };
  });

  const competitionWithScore = { ...competition, matches: matchesWithScore };

  return (
    <SchedulePage
      competition={competitionWithScore as Parameters<typeof SchedulePage>[0]["competition"]}
      locale={locale}
    />
  );
}
