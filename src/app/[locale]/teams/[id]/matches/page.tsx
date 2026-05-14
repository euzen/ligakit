import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, CalendarDays, Shield } from "lucide-react";

export default async function TeamMatchesPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const cs = locale === "cs";

  const team = await prisma.team.findUnique({
    where: { id },
    select: { id: true, name: true, logoUrl: true },
  });

  if (!team) notFound();

  // All matches where this team participated (home or away)
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: id }, { awayTeamId: id }],
      status: "PLAYED",
    },
    orderBy: { scheduledAt: "desc" },
    include: {
      homeTeam: { select: { id: true, name: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, logoUrl: true } },
      competition: { select: { id: true, name: true, type: true, logoUrl: true } },
    },
  });

  const getResult = (m: typeof matches[0]) => {
    const isHome = m.homeTeamId === id;
    const myScore = isHome ? m.homeScore : m.awayScore;
    const opponentScore = isHome ? m.awayScore : m.homeScore;
    if (myScore === null || opponentScore === null) return null;
    if (myScore > opponentScore) return "W";
    if (myScore < opponentScore) return "L";
    return "D";
  };

  const resultStyles: Record<string, string> = {
    W: "bg-green-500 text-white",
    D: "bg-yellow-400 text-black",
    L: "bg-red-500 text-white",
  };
  const resultLabels: Record<string, string> = {
    W: cs ? "V" : "W",
    D: "R",
    L: cs ? "P" : "L",
  };

  const wins = matches.filter((m) => getResult(m) === "W").length;
  const draws = matches.filter((m) => getResult(m) === "D").length;
  const losses = matches.filter((m) => getResult(m) === "L").length;
  const goalsScored = matches.reduce((s, m) => {
    const isHome = m.homeTeamId === id;
    return s + ((isHome ? m.homeScore : m.awayScore) ?? 0);
  }, 0);
  const goalsConceded = matches.reduce((s, m) => {
    const isHome = m.homeTeamId === id;
    return s + ((isHome ? m.awayScore : m.homeScore) ?? 0);
  }, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Back */}
        <a
          href={`/${locale}/teams`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          {cs ? "Zpět na týmy" : "Back to teams"}
        </a>

        {/* Team header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {team.logoUrl
              ? <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
              : <Shield className="size-7 text-muted-foreground" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
            <p className="text-sm text-muted-foreground">
              {cs ? "Archiv zápasů" : "Match archive"} · {matches.length} {cs ? "odehraných zápasů" : "played matches"}
            </p>
          </div>
        </div>

        {/* Stats summary */}
        {matches.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: cs ? "Zápasy" : "Played", value: matches.length },
              { label: cs ? "Výhry" : "Wins", value: wins, color: "text-green-600" },
              { label: cs ? "Remízy" : "Draws", value: draws, color: "text-yellow-600" },
              { label: cs ? "Prohry" : "Losses", value: losses, color: "text-red-600" },
              { label: cs ? "Góly S/O" : "GF/GA", value: `${goalsScored}:${goalsConceded}` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
                <p className={`text-xl font-bold tabular-nums ${s.color ?? ""}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Match list */}
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
            <Trophy className="size-10 opacity-30" />
            <p className="font-medium">{cs ? "Žádné odehrané zápasy" : "No played matches yet"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => {
              const isHome = m.homeTeamId === id;
              const opponent = isHome ? m.awayTeam : m.homeTeam;
              const opponentName = opponent?.name ?? (isHome ? m.awayTeamName : m.homeTeamName) ?? "?";
              const myScore = isHome ? m.homeScore : m.awayScore;
              const opponentScore = isHome ? m.awayScore : m.homeScore;
              const result = getResult(m);

              return (
                <div
                  key={m.id}
                  className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                >
                  {/* Result badge */}
                  <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${result ? resultStyles[result] : "bg-muted text-muted-foreground"}`}>
                    {result ? resultLabels[result] : "–"}
                  </span>

                  {/* Score */}
                  <span className="text-lg font-black tabular-nums w-14 text-center shrink-0">
                    {myScore ?? "–"}:{opponentScore ?? "–"}
                  </span>

                  {/* Opponent */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      <span className="text-muted-foreground text-xs mr-1">{cs ? (isHome ? "doma vs." : "venku vs.") : (isHome ? "H vs." : "A vs.")}</span>
                      {opponentName}
                    </p>
                    {m.competition && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        {m.competition.logoUrl
                          ? <img src={m.competition.logoUrl} alt="" className="size-3 rounded-sm" />
                          : <Trophy className="size-3" />}
                        {m.competition.name}
                        {m.round && <span className="ml-1">· {cs ? "Kolo" : "Round"} {m.round}</span>}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  {m.scheduledAt && (
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                      <CalendarDays className="size-3" />
                      {new Date(m.scheduledAt).toLocaleDateString(cs ? "cs-CZ" : "en-US")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
