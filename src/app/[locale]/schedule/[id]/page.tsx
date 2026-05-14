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
      sport: { select: { icon: true, name: true } },
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
        },
      },
    },
  });

  if (!competition || !competition.isPublic) notFound();

  return (
    <SchedulePage
      competition={competition as Parameters<typeof SchedulePage>[0]["competition"]}
      locale={locale}
    />
  );
}
