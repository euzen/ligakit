"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PlayerRosterActions, type RosterPlayer } from "@/components/player-roster-actions";

interface MatchEvent {
  id: string;
  type: string;
  teamSide: string;
  minute: number | null;
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
  competition: { name: string; periodCount: number | null; periodDuration: number | null };
  homePlayers: RosterPlayer[];
  awayPlayers: RosterPlayer[];
}

function ElapsedTimer({ startedAt, state, periodDuration, periodOffset }: { startedAt: string | null; state: string | null; periodDuration?: number | null; periodOffset?: number | null }) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setElapsed(0);
    if (!startedAt || state !== "LIVE") return;
    const start = new Date(startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    ref.current = setInterval(update, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [startedAt, state]);

  if (state === null) return null;
  if (!startedAt && !periodOffset) return null;

  const totalSeconds = elapsed + (periodOffset ?? 0);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const isOver = periodDuration != null && m >= periodDuration;
  return (
    <span className={`font-mono text-xl tabular-nums font-bold ${isOver ? "text-red-400 animate-pulse" : "text-white"}`}>
      {m}:{s.toString().padStart(2, "0")}
      {isOver && <span className="ml-1 text-xs">⏰</span>}
    </span>
  );
}

function getCurrentMinute(startedAt: string | null, periodOffset?: number | null): number | null {
  const offsetSecs = periodOffset ?? 0;
  if (!startedAt) return offsetSecs > 0 ? Math.floor(offsetSecs / 60) + 1 : null;
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return Math.max(1, Math.floor((elapsed + offsetSecs) / 60) + 1);
}

function buildPeriods(count: number | null): { value: number; label: string }[] {
  const n = count ?? 2;
  const periods: { value: number; label: string }[] = [];
  if (n === 1) {
    periods.push({ value: 1, label: "Zápas" });
  } else if (n === 2) {
    periods.push({ value: 1, label: "1. pol." }, { value: 2, label: "2. pol." });
  } else {
    for (let i = 1; i <= n; i++) periods.push({ value: i, label: `${i}.` });
  }
  periods.push({ value: n + 1, label: "Prodl." }, { value: n + 2, label: "Pen." });
  return periods;
}

export default function RefereePage() {
  const params = useParams();
  const matchId = params.id as string;
  const token = params.token as string;

  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [homeManualName, setHomeManualName] = useState("");
  const [awayManualName, setAwayManualName] = useState("");
  const [minute, setMinute] = useState("");
  const [invalid, setInvalid] = useState(false);

  const fetchMatch = useCallback(async () => {
    const res = await fetch(`/api/matches/${matchId}/live`);
    if (!res.ok) { setInvalid(true); return; }
    setMatch(await res.json());
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 4000);
    return () => clearInterval(interval);
  }, [fetchMatch]);

  const control = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/matches/${matchId}/control`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...body }),
    });
    if (res.ok) setMatch(await res.json());
    else toast.error("Chyba");
  };

  const addEvent = async (type: string, teamSide: string, playerName?: string) => {
    const autoMinute = match?.matchState === "LIVE"
      ? getCurrentMinute(match.startedAt, match.periodOffset)
      : null;
    const effectiveMinute = minute ? Number(minute) : autoMinute;
    const res = await fetch(`/api/matches/${matchId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        type,
        teamSide,
        minute: effectiveMinute,
        playerName: playerName?.trim() || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setMatch(data.match);
      setHomeManualName("");
      setAwayManualName("");
      toast.success(type === "GOAL" ? `⚽ Gól! (${effectiveMinute}')` : "Přidáno");
    } else {
      toast.error("Chyba — zkontrolujte přístup");
    }
  };

  const undoLast = async () => {
    const res = await fetch(`/api/matches/${matchId}/events`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      const data = await res.json();
      setMatch(data.match);
      toast.success("Zrušeno");
    }
  };

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
        <div className="space-y-2">
          <p className="text-4xl">⛔</p>
          <p className="font-semibold">Neplatný nebo expirovaný odkaz</p>
          <p className="text-sm text-muted-foreground">Požádejte organizátora o nový odkaz.</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Načítání…
      </div>
    );
  }

  const homeName = match.homeTeam?.name ?? match.homeTeamName ?? "Domácí";
  const awayName = match.awayTeam?.name ?? match.awayTeamName ?? "Hosté";
  const state = match.matchState;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-sm mx-auto">

      {/* Score header */}
      <div className="bg-gray-950 text-white text-center py-4 px-4 space-y-1">
        <p className="text-xs text-gray-400 uppercase tracking-widest">{match.competition.name}</p>
        <div className="flex items-center justify-center gap-4">
          <span className="text-lg font-bold flex-1 text-right truncate">{homeName}</span>
          <span className="text-4xl font-black tabular-nums whitespace-nowrap">
            {match.homeScore ?? 0} : {match.awayScore ?? 0}
          </span>
          <span className="text-lg font-bold flex-1 text-left truncate">{awayName}</span>
        </div>
        <div className="flex items-center justify-center gap-3">
          {state && (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${
              state === "LIVE" ? "text-red-400" :
              state === "PAUSED" ? "text-yellow-400" :
              state === "FINISHED" ? "text-gray-400" :
              "text-gray-500"
            }`}>
              {state === "LIVE" ? "● LIVE" : state === "PAUSED" ? "PAUZA" : state === "FINISHED" ? "KONEC" : "ČEKÁ"}
            </span>
          )}
          <ElapsedTimer startedAt={match.startedAt} state={state ?? null} periodDuration={match.competition.periodDuration} periodOffset={match.periodOffset} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* State controls */}
        <div className="flex flex-wrap gap-2 justify-center">
          {(!state || state === "UPCOMING") && (
            <button
              onClick={() => control({ matchState: "LIVE", period: 1 })}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform"
            >
              ▶ Spustit
            </button>
          )}
          {state === "LIVE" && (
            <>
              <button
                onClick={() => control({ matchState: "PAUSED" })}
                className="flex-1 py-3 bg-yellow-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform"
              >
                ⏸ Pauza
              </button>
              <button
                onClick={() => control({ endPeriod: true })}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform"
              >
                ⏱ Konec části
              </button>
            </>
          )}
          {state === "PAUSED" && (
            <button
              onClick={() => control({ matchState: "LIVE" })}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform"
            >
              ▶ Pokračovat
            </button>
          )}
          {(state === "LIVE" || state === "PAUSED") && (
            <button
              onClick={() => { if (confirm("Ukončit zápas?")) control({ matchState: "FINISHED" }); }}
              className="flex-1 py-3 bg-red-700 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform"
            >
              ⏹ Konec
            </button>
          )}
        </div>

        {/* Period */}
        <div className="flex gap-2 flex-wrap">
          {buildPeriods(match.competition.periodCount).map((p) => (
            <button
              key={p.value}
              onClick={() => control({ period: p.value })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors active:scale-95 ${
                match.period === p.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Minute input */}
        <div className="flex justify-end">
          <input
            type="number"
            min={1}
            max={120}
            placeholder="Min"
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="w-16 px-2 py-2 rounded-lg border bg-background text-sm text-center"
          />
        </div>

        <PlayerRosterActions
          players={match.homePlayers ?? []}
          teamName={homeName}
          side="HOME"
          onEvent={addEvent}
          manualName={homeManualName}
          onManualNameChange={setHomeManualName}
        />

        <PlayerRosterActions
          players={match.awayPlayers ?? []}
          teamName={awayName}
          side="AWAY"
          onEvent={addEvent}
          manualName={awayManualName}
          onManualNameChange={setAwayManualName}
        />

        {/* Undo */}
        <button
          onClick={undoLast}
          className="w-full py-3 border rounded-xl text-sm text-destructive font-medium active:scale-95 transition-transform"
        >
          ↩️ Zrušit poslední událost
        </button>

        {/* Recent events */}
        {match.events.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Poslední události</p>
            {[...match.events].reverse().slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-sm py-1 border-b last:border-0">
                <span>{e.type === "GOAL" ? "⚽" : e.type === "OWN_GOAL" ? "⚽" : e.type === "YELLOW_CARD" ? "🟨" : "🟥"}</span>
                <span className="font-medium">{e.teamSide === "HOME" ? homeName : awayName}</span>
                {e.playerName && <span className="text-muted-foreground text-xs">{e.playerName}</span>}
                {e.minute && <span className="text-muted-foreground text-xs ml-auto">{e.minute}&apos;</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
