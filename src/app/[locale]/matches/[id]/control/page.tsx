"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayerRosterActions, type RosterPlayer } from "@/components/player-roster-actions";

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

  if (state === "UPCOMING" || state === null) return null;
  if (!startedAt && !periodOffset) return null;

  const totalSeconds = elapsed + (periodOffset ?? 0);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const limit = periodDuration ?? null;
  const isOver = limit !== null && m >= limit;
  return (
    <span className={`font-mono text-2xl tabular-nums font-bold ${isOver ? "text-red-500 animate-pulse" : ""}`}>
      {m}:{s.toString().padStart(2, "0")}
      {isOver && <span className="ml-2 text-sm font-normal">⏰ čas části vypršel</span>}
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
    periods.push({ value: 1, label: "1. poločas" }, { value: 2, label: "2. poločas" });
  } else {
    for (let i = 1; i <= n; i++) periods.push({ value: i, label: `${i}. část` });
  }
  periods.push({ value: n + 1, label: "Prodloužení" }, { value: n + 2, label: "Penalty" });
  return periods;
}

export default function ControlPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [homeManualName, setHomeManualName] = useState("");
  const [awayManualName, setAwayManualName] = useState("");
  const [minute, setMinute] = useState("");
  const [refereeUrl, setRefereeUrl] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);

  const fetchMatch = useCallback(async () => {
    const res = await fetch(`/api/matches/${matchId}/live`);
    if (res.ok) setMatch(await res.json());
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 5000);
    return () => clearInterval(interval);
  }, [fetchMatch]);

  const control = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/matches/${matchId}/control`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setMatch(data);
    } else {
      toast.error("Chyba při ovládání zápasu");
    }
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
      toast.success(type === "GOAL" ? `Gól přidán ⚽ (${effectiveMinute}')` : "Událost přidána");
    } else {
      toast.error("Chyba");
    }
  };

  const undoLast = async () => {
    const res = await fetch(`/api/matches/${matchId}/events`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const data = await res.json();
      setMatch(data.match);
      toast.success("Poslední událost zrušena");
    }
  };

  const generateRefereeLink = async () => {
    setGeneratingToken(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/referee-token`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const url = `${window.location.origin}/cs/matches/${matchId}/referee/${data.token}`;
        setRefereeUrl(url);
      }
    } finally {
      setGeneratingToken(false);
    }
  };

  const homeName = match?.homeTeam?.name ?? match?.homeTeamName ?? "Domácí";
  const awayName = match?.awayTeam?.name ?? match?.awayTeamName ?? "Hosté";
  const state = match?.matchState;

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Načítání…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">{match.competition.name}</p>
        <h1 className="text-xl font-bold">{homeName} vs {awayName}</h1>
        <div className="text-4xl font-black tabular-nums">
          {match.homeScore ?? 0} : {match.awayScore ?? 0}
        </div>
        <ElapsedTimer startedAt={match.startedAt} state={state ?? null} periodDuration={match.competition.periodDuration} periodOffset={match.periodOffset} />
        {state && (
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${
            state === "LIVE" ? "bg-red-600 text-white" :
            state === "PAUSED" ? "bg-yellow-600 text-white" :
            state === "FINISHED" ? "bg-gray-600 text-white" :
            "bg-muted text-muted-foreground"
          }`}>
            {state === "LIVE" ? "● LIVE" : state === "PAUSED" ? "PAUZA" : state === "FINISHED" ? "KONEC" : "NESPUŠTĚNO"}
          </span>
        )}
      </div>

      {/* Match state controls */}
      <div className="rounded-xl border p-4 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ovládání zápasu</p>
        <div className="flex flex-wrap gap-2">
          {(!state || state === "UPCOMING") && (
            <Button onClick={() => control({ matchState: "LIVE", period: 1 })} className="gap-1.5 bg-green-600 hover:bg-green-700">
              ▶ Spustit
            </Button>
          )}
          {state === "LIVE" && (
            <>
              <Button onClick={() => control({ matchState: "PAUSED" })} variant="outline" className="gap-1.5">
                ⏸ Pauza
              </Button>
              <Button
                onClick={() => control({ endPeriod: true })}
                variant="outline"
                className="gap-1.5 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
              >
                ⏱ Ukončit část
              </Button>
            </>
          )}
          {state === "PAUSED" && (
            <Button onClick={() => control({ matchState: "LIVE" })} className="gap-1.5 bg-green-600 hover:bg-green-700">
              ▶ Pokračovat
            </Button>
          )}
          {(state === "LIVE" || state === "PAUSED") && (
            <Button onClick={() => control({ matchState: "FINISHED" })} variant="destructive" className="gap-1.5">
              ⏹ Ukončit zápas
            </Button>
          )}
        </div>

        {/* Period selector */}
        <div className="flex gap-2 flex-wrap">
          {buildPeriods(match.competition.periodCount).map((p) => (
            <button
              key={p.value}
              onClick={() => control({ period: p.value })}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                match.period === p.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event input */}
      <div className="rounded-xl border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Přidat událost</p>
          <Input
            type="number"
            min={1}
            max={120}
            placeholder="Min."
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="w-20 h-8 text-sm"
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

        <Button size="sm" variant="outline" onClick={undoLast} className="gap-1 text-destructive hover:text-destructive w-full">
          ↩️ Zrušit poslední událost
        </Button>
      </div>

      {/* Event log */}
      {match.events.length > 0 && (
        <div className="rounded-xl border p-4 space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Události</p>
          <ul className="space-y-1 text-sm">
            {[...match.events].reverse().map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-sm">
                <span>{e.type === "GOAL" ? "⚽" : e.type === "OWN_GOAL" ? "⚽(vl.)" : e.type === "YELLOW_CARD" ? "🟨" : "🟥"}</span>
                <span className="font-medium">{e.teamSide === "HOME" ? homeName : awayName}</span>
                {e.playerName && <span className="text-muted-foreground">{e.playerName}</span>}
                {e.minute && <span className="text-muted-foreground text-xs">{e.minute}{e.addedTime ? `+${e.addedTime}` : ""}&apos;</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scoreboard + Referee links */}
      <div className="rounded-xl border p-4 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sdílení</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex-1 font-mono truncate">
              {window?.location?.origin}/cs/matches/{matchId}/scoreboard
            </span>
            <Button
              size="sm" variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/cs/matches/${matchId}/scoreboard`);
                toast.success("Odkaz zkopírován");
              }}
            >
              Kopírovat scoreboard
            </Button>
          </div>

          {refereeUrl ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex-1 font-mono truncate">{refereeUrl}</span>
              <Button
                size="sm" variant="outline"
                onClick={() => { navigator.clipboard.writeText(refereeUrl); toast.success("Odkaz zkopírován"); }}
              >
                Kopírovat
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={generateRefereeLink} disabled={generatingToken}>
              {generatingToken ? "Generuji…" : "Vygenerovat odkaz pro rozhodčího"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
