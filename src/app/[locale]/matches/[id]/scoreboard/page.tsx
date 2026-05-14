"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Trophy, Timer, Sun, Moon } from "lucide-react";

interface MatchEvent {
  id: string;
  type: string;
  teamSide: string;
  minute: number | null;
  addedTime: number | null;
  playerName: string | null;
  player2Name: string | null;
  createdAt: string;
}

interface EventType {
  name: string;
  labelCs: string;
  labelEn: string;
  affectsScore: boolean;
  color: string | null;
  icon: string | null;
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
  homeTeam: { id: string; name: string; logoUrl?: string | null } | null;
  awayTeam: { id: string; name: string; logoUrl?: string | null } | null;
  events: MatchEvent[];
  periodOffset: number | null;
  competition: { name: string };
  eventTypes: EventType[];
}

const PERIOD_LABELS: Record<number, string> = {
  1: "1. poločas",
  2: "2. poločas",
  3: "Prodloužení",
  4: "Penalty",
};

const ICON_EMOJI: Record<string, string> = {
  "target": "⚽",
  "circle-dot": "⚽",
  "circle-x": "❌",
  "square": "🟨",
  "hand": "✋",
  "flag": "🚩",
  "flag-triangle-right": "🚩",
  "arrow-right-left": "�",
  "clock": "⏱",
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
  const totalSeconds = elapsed + (periodOffset ?? 0);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return <span className="tabular-nums">{m}:{s.toString().padStart(2, "0")}</span>;
}

export default function ScoreboardPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [error, setError] = useState(false);
  const [dark, setDark] = useState(true);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/live`, { cache: "no-store" });
      if (!res.ok) { setError(true); return; }
      setMatch(await res.json());
    } catch { setError(true); }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 5000);
    return () => clearInterval(interval);
  }, [fetchMatch]);

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <p className="text-2xl opacity-50">Zápas nenalezen</p>
    </div>
  );

  if (!match) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="size-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );

  const homeName = match.homeTeam?.name ?? match.homeTeamName ?? "?";
  const awayName = match.awayTeam?.name ?? match.awayTeamName ?? "?";

  const allEvents = [...match.events].sort((a, b) => {
    const aTotal = a.minute != null ? a.minute * 100 + (a.addedTime ?? 0) : -1;
    const bTotal = b.minute != null ? b.minute * 100 + (b.addedTime ?? 0) : -1;
    if (bTotal !== aTotal) return bTotal - aTotal;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const isLive = match.matchState === "LIVE";
  const isPaused = match.matchState === "PAUSED";
  const isFinished = match.matchState === "FINISHED";

  const eventLabel = (type: string) => {
    const et = match.eventTypes.find((e) => e.name === type);
    return et?.labelCs ?? type;
  };

  const isGoalType = (type: string) => {
    const et = match.eventTypes.find((e) => e.name === type);
    return et?.affectsScore ?? false;
  };

  const isCardType = (type: string) => type.includes("CARD");

  const getEventEmoji = (type: string) => {
    const et = match.eventTypes.find((e) => e.name === type);
    const icon = et?.icon ?? "";
    if (type === "SUBSTITUTION" || icon === "arrow-right-left") return "🔄";
    if (icon === "circle-x") return "🛑";
    if (icon === "hand") return "✋";
    if (icon === "flag-triangle-right" || icon === "flag") return "🚩";
    if (type === "RED_CARD" || type === "YELLOW_RED") return "🟥";
    if (isCardType(type)) return "🟨";
    if (isGoalType(type) && icon !== "target") return "⚽";
    if (icon === "target" && !isGoalType(type)) return "⚽️";
    if (isGoalType(type)) return "⚽";
    if (icon === "circle-dot") return "⚽";
    return "⏱️";
  };

  const bg = dark ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900";
  const card = dark ? "bg-slate-900/50 border-white/5" : "bg-white border-slate-200 shadow-sm";
  const mutedText = dark ? "text-slate-500" : "text-slate-400";
  const logoBox = dark ? "bg-slate-800 border-white/5" : "bg-slate-100 border-slate-200";
  const timerBox = dark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200";
  const eventRow = dark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200";
  const eventHighlight = dark ? "bg-blue-600/20 border-blue-500/40" : "bg-blue-50 border-blue-300";
  const dividerColor = dark ? "text-slate-700" : "text-slate-300";

  return (
    <div className={`fixed inset-0 flex flex-col select-none overflow-hidden font-sans p-2 gap-2 transition-colors duration-300 ${bg}`}>

      {/* Top bar */}
      <div className="flex justify-between items-center shrink-0 px-1">
        <div className="flex items-center gap-2">
          <div className="bg-blue-700 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
            <Trophy className="text-white" size={14} />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-tighter leading-none">
              LIGAKIT
            </h1>
            <p className={`text-[9px] font-bold uppercase tracking-widest leading-none mt-0.5 ${mutedText}`}>
              {match.competition.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {match.period && (
            <span className={`text-[9px] font-black uppercase tracking-widest italic ${mutedText}`}>
              {PERIOD_LABELS[match.period] ?? `Část ${match.period}`}
            </span>
          )}
          {isLive && (
            <div className="flex items-center gap-1.5 bg-red-600/10 px-2.5 py-1 rounded-lg border border-red-600/20">
              <div className="relative flex h-1.5 w-1.5">
                <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <div className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500">Živě</span>
            </div>
          )}
          {isPaused && (
            <div className="flex items-center gap-1.5 bg-yellow-600/10 px-2.5 py-1 rounded-lg border border-yellow-600/20">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-500">Přestávka</span>
            </div>
          )}
          {isFinished && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${dark ? "bg-slate-700/50 border-slate-600/30" : "bg-slate-200 border-slate-300"}`}>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-slate-600"}`}>Konec</span>
            </div>
          )}
          <button
            onClick={() => setDark((v) => !v)}
            className={`p-1.5 rounded-lg transition-all ${dark ? "bg-slate-800 text-yellow-400 hover:bg-slate-700" : "bg-white text-slate-800 shadow border border-slate-200 hover:bg-slate-50"}`}
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Score section */}
      <div className={`${allEvents.length > 0 ? "shrink-0 h-[25%]" : "flex-1"} min-h-0 rounded-2xl border backdrop-blur-md flex items-center justify-center relative overflow-hidden ${card}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[60%] bg-blue-600/10 blur-[100px] pointer-events-none" />

        <div className="flex items-center justify-around w-full px-4 lg:px-12 relative z-10 gap-2">
          {/* Home */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <div className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center shadow-lg shrink-0 border ${logoBox}`}>
              {match.homeTeam?.logoUrl
                ? <img src={match.homeTeam.logoUrl} alt="" className="w-3/4 h-3/4 object-contain" />
                : <Trophy size={40} className="text-blue-500 opacity-60" />
              }
            </div>
            <h2 className="text-xs md:text-lg lg:text-2xl font-black uppercase italic tracking-tighter text-center leading-none">
              {homeName}
            </h2>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-2 lg:gap-4 px-2 lg:px-8 shrink-0">
            <div className="flex items-center gap-1 lg:gap-4 leading-none">
              <span className={`text-[1.7rem] md:text-[2.55rem] lg:text-[3.85rem] font-black tabular-nums tracking-tighter ${(match.homeScore ?? 0) > (match.awayScore ?? 0) ? "text-blue-500" : dark ? "text-white" : "text-slate-900"}`}>
                {match.homeScore ?? 0}
              </span>
              <span className={`text-[1.05rem] md:text-[1.5rem] lg:text-[2.1rem] font-black ${dividerColor}`}>:</span>
              <span className={`text-[1.7rem] md:text-[2.55rem] lg:text-[3.85rem] font-black tabular-nums tracking-tighter ${(match.awayScore ?? 0) > (match.homeScore ?? 0) ? "text-blue-500" : dark ? "text-white" : "text-slate-900"}`}>
                {match.awayScore ?? 0}
              </span>
            </div>

            {isLive && match.startedAt && (
              <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${timerBox}`}>
                <Timer className="text-blue-500 shrink-0" size={12} />
                <span className="text-lg font-black tabular-nums tracking-widest italic">
                  <ElapsedTimer startedAt={match.startedAt} periodOffset={match.periodOffset} />
                </span>
              </div>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <div className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center shadow-lg shrink-0 border ${logoBox}`}>
              {match.awayTeam?.logoUrl
                ? <img src={match.awayTeam.logoUrl} alt="" className="w-3/4 h-3/4 object-contain" />
                : <Trophy size={40} className="text-orange-500 opacity-60" />
              }
            </div>
            <h2 className="text-xs md:text-lg lg:text-2xl font-black uppercase italic tracking-tighter text-center leading-none">
              {awayName}
            </h2>
          </div>
        </div>
      </div>

      {/* Events section */}
      {allEvents.length > 0 && (
        <div className={`flex-1 min-h-0 rounded-2xl border backdrop-blur-md flex flex-col p-3 ${card}`}>
          <div className="flex justify-between items-center mb-2 shrink-0">
            <h3 className="text-sm lg:text-base font-black uppercase italic flex items-center gap-2">
              <span className="text-base">📋</span>
              Průběh utkání
            </h3>
            <div className="bg-blue-600/10 px-3 py-1 rounded-lg border border-blue-600/20 text-blue-500 text-[10px] font-black uppercase tracking-widest hidden sm:block">
              Live Sync
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="flex flex-col gap-1">
              {allEvents.map((ev, index) => {
                const isHome = ev.teamSide === "HOME";
                const minuteStr = ev.minute != null
                  ? `${ev.minute}${ev.addedTime ? `+${ev.addedTime}` : ""}'`
                  : "";
                const label = eventLabel(ev.type);
                const isSub = ev.type === "SUBSTITUTION";
                const rowCls = `flex items-center gap-1.5 px-2 py-1.5 rounded-lg border w-full ${index === 0 ? eventHighlight : eventRow}`;

                const HomeCard = (
                  <div className={rowCls}>
                    <div className="min-w-0 flex-1 text-right">
                      {isSub ? (
                        <p className="text-xs font-black uppercase italic tracking-tight leading-tight flex items-center gap-1 justify-end flex-wrap">
                          <span className="text-red-500">↓ {ev.playerName ?? "?"}</span>
                          <span className={dark ? "text-slate-600" : "text-slate-300"}>/</span>
                          <span className="text-emerald-500">↑ {ev.player2Name ?? "?"}</span>
                        </p>
                      ) : (
                        <p className="text-xs font-black uppercase italic tracking-tight truncate leading-tight">
                          {ev.playerName
                            ? <>{ev.playerName} <span className="font-normal opacity-50 not-italic">({label})</span></>
                            : label
                          }
                        </p>
                      )}
                    </div>
                    <span className="text-base leading-none shrink-0">{getEventEmoji(ev.type)}</span>
                  </div>
                );

                const AwayCard = (
                  <div className={rowCls}>
                    <span className="text-base leading-none shrink-0">{getEventEmoji(ev.type)}</span>
                    <div className="min-w-0 flex-1 text-left">
                      {isSub ? (
                        <p className="text-xs font-black uppercase italic tracking-tight leading-tight flex items-center gap-1 flex-wrap">
                          <span className="text-red-500">↓ {ev.playerName ?? "?"}</span>
                          <span className={dark ? "text-slate-600" : "text-slate-300"}>/</span>
                          <span className="text-emerald-500">↑ {ev.player2Name ?? "?"}</span>
                        </p>
                      ) : (
                        <p className="text-xs font-black uppercase italic tracking-tight truncate leading-tight">
                          {ev.playerName
                            ? <>{ev.playerName} <span className="font-normal opacity-50 not-italic">({label})</span></>
                            : label
                          }
                        </p>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div key={ev.id} className="grid grid-cols-[1fr_2.5rem_1fr] items-center gap-1">
                    <div className={isHome ? "" : "invisible pointer-events-none"}>
                      {HomeCard}
                    </div>
                    <div className="flex items-center justify-center">
                      <span className={`text-[10px] font-black tabular-nums ${dark ? "text-slate-500" : "text-slate-400"}`}>
                        {minuteStr}
                      </span>
                    </div>
                    <div className={!isHome ? "" : "invisible pointer-events-none"}>
                      {AwayCard}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
