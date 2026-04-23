import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { GuestRosterClient } from "@/components/guest-roster-client";

export default async function GuestRosterPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;

  const ct = await prisma.competitionTeam.findUnique({
    where: { rosterToken: token },
    include: {
      competition: { select: { name: true } },
      guestPlayers: { orderBy: { number: "asc" } },
    },
  });

  if (!ct) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <GuestRosterClient
          token={token}
          locale={locale}
          teamName={ct.guestName ?? "?"}
          competitionName={ct.competition.name}
          initialPlayers={ct.guestPlayers}
        />
      </main>
    </div>
  );
}
