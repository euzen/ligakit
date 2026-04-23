"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface MatchEvent {
  id: string;
  type: string;
  teamSide: string;
  minute: number | null;
  addedTime: number | null;
  playerName: string | null;
}

interface LiveMatch {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  matchState: string | null;
  period: number | null;
  startedAt: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  events: MatchEvent[];
  periodOffset: number | null;
  competition: { name: string };
}

const PERIOD_LABELS: Record<number, string> = {
  1: "1. poločas",
  2: "2. poločas",
  3: "Prodloužení",
  4: "Penalty",
};

const EVENT_ICONS: Record<string, string> = {
  GOAL: "⚽",
  OWN_GOAL: "⚽",
  YELLOW_CARD: "🟨",
  RED_CARD: "🟥",
};

function ElapsedTimer({ startedAt, periodOffset }: { startedAt: string | null; periodOffset?: number | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt && !periodOffset) return null;
  const totalSeconds = elapsed + (periodOffset ?? 0);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return (
    <span className="tabular-nums">
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
}

export default function ScoreboardPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [error, setError] = useState(false);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/live`, { cache: "no-store" });
      if (!res.ok) { setError(true); return; }
      setMatch(await res.json());
    } catch {
      setError(true);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 3000);
    return () => clearInterval(interval);
  }, [fetchMatch]);

  const homeName = match?.homeTeam?.name ?? match?.homeTeamName ?? "?";
  const awayName = match?.awayTeam?.name ?? match?.awayTeamName ?? "?";

  const allEvents = (match?.events ?? [])
    .slice()
    .sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));

  const isLive = match?.matchState === "LIVE";
  const isPaused = match?.matchState === "PAUSED";
  const isFinished = match?.matchState === "FINISHED";

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <p className="text-2xl opacity-50">Zápas nenalezen</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="animate-pulse text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col select-none overflow-hidden">
      {/* Competition name */}
      <div className="text-center pt-6 pb-2">
        <p className="text-gray-400 text-sm tracking-widest uppercase">
          {match.competition.name}
        </p>
      </div>

      {/* Main scoreboard */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">

        {/* Teams + Score — always vertically centered, no variable-height content inside */}
        <div className="w-full max-w-5xl grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Home name */}
          <h1 className="text-right text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none text-white">
            {homeName}
          </h1>

          {/* Score + status */}
          <div className="flex flex-col items-center gap-3 px-4 md:px-8">
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-4xl md:text-6xl lg:text-7xl font-black tabular-nums leading-none text-yellow-400">
                {match.homeScore ?? 0}
              </span>
              <span className="text-3xl md:text-5xl lg:text-6xl font-light text-gray-600">:</span>
              <span className="text-4xl md:text-6xl lg:text-7xl font-black tabular-nums leading-none text-yellow-400">
                {match.awayScore ?? 0}
              </span>
            </div>

            <div className="flex items-center gap-3 justify-center">
              {isLive && (
                <span className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                  <span className="size-2 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              )}
              {isPaused && (
                <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                  PŘESTÁVKA
                </span>
              )}
              {isFinished && (
                <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                  KONEC
                </span>
              )}
            </div>

            {match.period && (
              <p className="text-gray-500 text-xs uppercase tracking-widest">
                {PERIOD_LABELS[match.period] ?? `Část ${match.period}`}
              </p>
            )}
          </div>

          {/* Away name */}
          <h1 className="text-left text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none text-white">
            {awayName}
          </h1>
        </div>

        {/* Timer row */}
        {isLive && match.startedAt && (
          <div className="text-center">
            <span className="text-white text-5xl md:text-7xl font-mono font-bold tabular-nums">
              <ElapsedTimer startedAt={match.startedAt} periodOffset={match.periodOffset} />
            </span>
          </div>
        )}

        {/* Events timeline — livesport style */}
        {allEvents.length > 0 && (
          <div className="w-full max-w-3xl space-y-1">
            {allEvents.map((e) => {
              const isHome = e.teamSide === "HOME";
              const isGoal = e.type === "GOAL" || e.type === "OWN_GOAL";
              const teamName = isHome ? homeName : awayName;
              const minuteStr = e.minute
                ? `${e.minute}${e.addedTime ? `+${e.addedTime}` : ""}'`
                : "";
              return (
                <div
                  key={e.id}
                  className={`grid grid-cols-[1fr_3rem_1fr] items-center gap-2 py-1.5 border-b border-gray-800/60 last:border-0`}
                >
                  {/* Home side */}
                  {isHome ? (
                    <div className="flex items-center justify-end gap-2 text-right">
                      <div>
                        <p className={`font-semibold leading-tight ${isGoal ? "text-white text-lg md:text-2xl" : "text-gray-300 text-base md:text-xl"}`}>
                          {e.playerName ?? teamName}
                          {e.type === "OWN_GOAL" && <span className="text-gray-500 text-sm ml-1">(vl.)</span>}
                        </p>
                        {e.playerName && (
                          <p className="text-gray-500 text-xs">{teamName}</p>
                        )}
                      </div>
                      <span className="text-2xl md:text-3xl shrink-0">{EVENT_ICONS[e.type] ?? ""}</span>
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Minute */}
                  <div className="text-center">
                    <span className="text-gray-500 text-xs font-mono tabular-nums">{minuteStr}</span>
                  </div>

                  {/* Away side */}
                  {!isHome ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl md:text-3xl shrink-0">{EVENT_ICONS[e.type] ?? ""}</span>
                      <div>
                        <p className={`font-semibold leading-tight ${isGoal ? "text-white text-lg md:text-2xl" : "text-gray-300 text-base md:text-xl"}`}>
                          {e.playerName ?? teamName}
                          {e.type === "OWN_GOAL" && <span className="text-gray-500 text-sm ml-1">(vl.)</span>}
                        </p>
                        {e.playerName && (
                          <p className="text-gray-500 text-xs">{teamName}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-4">
        <p className="text-gray-700 text-xs">ligakit.cz</p>
      </div>
    </div>
  );
}
