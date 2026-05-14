"use client";

interface Team { id: string | null; name: string; logoUrl: string | null }

interface BracketMatch {
  id: string;
  round: number | null;
  bracketPos: number | null;
  note: string | null;
  stage?: string | null;  // bracket stage label: QF, SF, F, R16, etc.
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: Date | string | null;
  status: string;
}

interface TournamentBracketProps {
  matches: BracketMatch[];
  locale: string;
}

const STAGE_LABEL_CS: Record<string, string> = {
  F: "Finále",
  SF: "Semifinále",
  QF: "Čtvrtfinále",
  R16: "Osmifinále",
  R32: "Šestnáctifinále",
  "3rd": "Zápas o 3. místo",
};

const STAGE_LABEL_EN: Record<string, string> = {
  F: "Final",
  SF: "Semi-final",
  QF: "Quarter-final",
  R16: "Round of 16",
  R32: "Round of 32",
  "3rd": "3rd Place Match",
};

function teamName(match: BracketMatch, side: "home" | "away"): string {
  if (side === "home") return match.homeTeam?.name ?? match.homeTeamName ?? "TBD";
  return match.awayTeam?.name ?? match.awayTeamName ?? "TBD";
}

function isTBD(name: string) {
  return name === "TBD" || name.startsWith("Winner ");
}

function fmtDate(d: Date | string | null, locale: string) {
  if (!d) return null;
  return new Date(d).toLocaleString(locale === "cs" ? "cs-CZ" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function MatchCard({ match, locale }: { match: BracketMatch; locale: string }) {
  const isCS = locale === "cs";
  const home = teamName(match, "home");
  const away = teamName(match, "away");
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const dateStr = !hasScore ? fmtDate(match.scheduledAt, locale) : null;

  const homeWon = hasScore && match.homeScore! > match.awayScore!;
  const awayWon = hasScore && match.awayScore! > match.homeScore!;

  return (
    <div className="rounded-lg border bg-card overflow-hidden w-52 shrink-0 shadow-sm">
      {/* Home */}
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b ${
          homeWon ? "bg-green-500/10" : ""
        }`}
      >
        <span
          className={`flex-1 text-sm truncate ${
            isTBD(home) ? "text-muted-foreground italic" : homeWon ? "font-semibold" : ""
          }`}
        >
          {home}
        </span>
        {hasScore && (
          <span
            className={`tabular-nums text-sm font-bold w-5 text-center ${
              homeWon ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            }`}
          >
            {match.homeScore}
          </span>
        )}
      </div>
      {/* Away */}
      <div
        className={`flex items-center gap-2 px-3 py-2 ${
          awayWon ? "bg-green-500/10" : ""
        }`}
      >
        <span
          className={`flex-1 text-sm truncate ${
            isTBD(away) ? "text-muted-foreground italic" : awayWon ? "font-semibold" : ""
          }`}
        >
          {away}
        </span>
        {hasScore && (
          <span
            className={`tabular-nums text-sm font-bold w-5 text-center ${
              awayWon ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            }`}
          >
            {match.awayScore}
          </span>
        )}
      </div>
      {/* Date / status footer */}
      {(dateStr || match.status === "CANCELLED") && (
        <div className={`px-3 py-1 text-xs text-center border-t ${
          match.status === "CANCELLED"
            ? "bg-destructive/10 text-destructive"
            : "text-muted-foreground"
        }`}>
          {match.status === "CANCELLED"
            ? (isCS ? "Zrušeno" : "Cancelled")
            : dateStr
          }
        </div>
      )}
    </div>
  );
}

export function TournamentBracket({ matches, locale }: TournamentBracketProps) {
  const isCS = locale === "cs";
  const stageLabels = isCS ? STAGE_LABEL_CS : STAGE_LABEL_EN;

  // Filter out group stage matches (CUP) - only show bracket/knockout matches
  const allBracketMatches = matches.filter(m => m.bracketPos !== null && !m.note?.startsWith("Skupina"));

  // Separate 3rd place match (bracketPos === -1)
  const thirdPlaceMatch = allBracketMatches.find(m => m.bracketPos === -1) ?? null;
  const bracketMatches = allBracketMatches.filter(m => m.bracketPos !== -1);

  if (bracketMatches.length === 0 && !thirdPlaceMatch) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm">
        {isCS ? "Pavouk bude dostupný po losování." : "Bracket will be available after the draw."}
      </p>
    );
  }

  // Group by round, sort rounds ascending (round 1 = earliest, max = final)
  const roundMap = new Map<number, BracketMatch[]>();
  for (const m of bracketMatches) {
    const r = m.round ?? 0;
    if (!roundMap.has(r)) roundMap.set(r, []);
    roundMap.get(r)!.push(m);
  }
  // Sort each round by bracketPos so visual alignment is correct
  for (const [, arr] of roundMap) {
    arr.sort((a, b) => (a.bracketPos ?? 0) - (b.bracketPos ?? 0));
  }
  const rounds = [...roundMap.keys()].sort((a, b) => a - b);

  // Derive stage label from note field
  const getStageLabel = (round: number): string => {
    const roundMatches = roundMap.get(round)!;
    const noteLabel = roundMatches[0]?.note;
    if (noteLabel && stageLabels[noteLabel]) return stageLabels[noteLabel];
    if (noteLabel) return noteLabel;
    const size = roundMatches.length * 2;
    return stageLabels[`R${size}`] ?? (isCS ? `Kolo ${round}` : `Round ${round}`);
  };

  return (
    <div className="space-y-6">
      {/* Main bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8 min-w-max items-start">
          {rounds.map((round, colIndex) => {
            const roundMatches = roundMap.get(round)!;
            const label = getStageLabel(round);

            // Vertical spacing: later rounds have matches spaced further apart
            const spacingMultiplier = Math.pow(2, colIndex);
            const cardHeight = 72;
            const gap = (spacingMultiplier - 1) * cardHeight;

            return (
              <div key={round} className="flex flex-col" style={{ gap: 0 }}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 text-center w-52">
                  {label}
                </p>
                <div className="flex flex-col" style={{ gap: `${gap + 8}px` }}>
                  {roundMatches.map((m, i) => {
                    const topOffset = colIndex === 0 ? 0 : gap / 2;
                    return (
                      <div key={m.id} style={{ marginTop: i === 0 ? topOffset : 0 }}>
                        <MatchCard match={m} locale={locale} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3rd place match – shown separately below the bracket */}
      {thirdPlaceMatch && (
        <div className="border-t pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {stageLabels["3rd"]}
          </p>
          <MatchCard match={thirdPlaceMatch} locale={locale} />
        </div>
      )}
    </div>
  );
}
