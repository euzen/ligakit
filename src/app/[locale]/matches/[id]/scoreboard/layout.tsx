import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      homeScore: true,
      awayScore: true,
      homeTeamName: true,
      awayTeamName: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      competition: { select: { name: true } },
    },
  });

  if (!match) return { title: "Scoreboard – LigaKit" };

  const home = match.homeTeam?.name ?? match.homeTeamName ?? "?";
  const away = match.awayTeam?.name ?? match.awayTeamName ?? "?";
  const score =
    match.homeScore !== null && match.awayScore !== null
      ? `${match.homeScore} : ${match.awayScore}`
      : "vs";
  const title = `${home} ${score} ${away} – ${match.competition.name}`;

  return {
    title,
    openGraph: {
      title,
      description: `Živý výsledek zápasu ${home} vs ${away} – ${match.competition.name}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description: `${home} ${score} ${away}`,
    },
  };
}

export default function ScoreboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
