"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trophy, Share2, Download, ChevronDown, ChevronUp, Sun, Moon, Timer } from "lucide-react";
import { TacticalPitch } from "@/components/tactical/tactical-pitch";
import { getFormation } from "@/lib/formations";

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
  affectsScore: boolean;
  color: string | null;
  icon: string | null;
}

interface PositionInfo {
  positionIndex: number;
  playerId?: string;
  guestPlayerId?: string;
  name: string;
  number: number | null;
}

interface LiveMatch {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  matchState: string | null;
  period: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeTeam: { id: string; name: string; logoUrl?: string | null } | null;
  awayTeam: { id: string; name: string; logoUrl?: string | null } | null;
  events: MatchEvent[];
  periodOffset: number | null;
  competition: { name: string };
  eventTypes: EventType[];
  formations: { home: string | null; away: string | null };
  positions: { home: PositionInfo[]; away: PositionInfo[] };
  venue: string | null;
  referee: string | null;
}

export default function MatchPresentationPage() {
  const params = useParams();
  const matchId = params.id as string;
  const locale = params.locale as string;
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [lineupsExpanded, setLineupsExpanded] = useState(true);

  // Timer state - must be before any conditional returns
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!match?.startedAt) return;
    const start = new Date(match.startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [match?.startedAt]);

  const t = useTranslations("presentation");
  const tCommon = useTranslations("common");

  // Live refresh interval
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}/live`, { cache: "no-store" });
        if (!res.ok) throw new Error("Not found");
        setMatch(await res.json());
      } catch {
        setMatch(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();

    // Auto-refresh every 10 seconds for live broadcast
    const interval = setInterval(fetchMatch, 10000);
    return () => clearInterval(interval);
  }, [matchId]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-slate-950" : "bg-slate-100"}`}>
        <div className="size-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"}`}>
        <p className="text-2xl opacity-50">{tCommon("notFound")}</p>
      </div>
    );
  }

  const homeName = match.homeTeam?.name ?? match.homeTeamName ?? t("home");
  const awayName = match.awayTeam?.name ?? match.awayTeamName ?? t("away");

  const allEvents = [...match.events].sort((a, b) => {
    const aTotal = a.minute != null ? a.minute * 100 + (a.addedTime ?? 0) : -1;
    const bTotal = b.minute != null ? b.minute * 100 + (b.addedTime ?? 0) : -1;
    if (bTotal !== aTotal) return bTotal - aTotal;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const isGoalType = (type: string) => {
    const et = match.eventTypes.find((e) => e.name === type);
    return et?.affectsScore ?? false;
  };

  const getEventEmoji = (type: string) => {
    if (type === "SUBSTITUTION") return "🔄";
    if (type === "RED_CARD" || type === "YELLOW_RED") return "🟥";
    if (type.includes("CARD")) return "🟨";
    if (type === "OWN_GOAL") return "⚽ (VG)";
    if (isGoalType(type)) return "⚽";
    return "⏱️";
  };

  const getEventLabel = (type: string) => {
    const et = match.eventTypes.find((e) => e.name === type);
    return et?.labelCs ?? type;
  };

  // Timer calculations (useState/useEffect moved to top of component)
  const totalSeconds = elapsed + (match.periodOffset ?? 0);
  const timerMinutes = Math.floor(totalSeconds / 60);
  const timerSeconds = totalSeconds % 60;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${homeName} vs ${awayName}`,
        text: `Výsledek: ${match.homeScore ?? 0}:${match.awayScore ?? 0}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t("linkCopied"));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Theme classes
  const themeClasses = darkMode
    ? "bg-slate-950 text-white"
    : "bg-slate-100 text-slate-900";
  const cardClasses = darkMode
    ? "bg-slate-900/50 border-white/10"
    : "bg-white border-slate-200";
  const headerClasses = darkMode
    ? "bg-slate-900 border-b border-white/10"
    : "bg-white border-b border-slate-200";
  const subtextClasses = darkMode ? "text-slate-400" : "text-slate-500";
  const btnClasses = darkMode
    ? "bg-slate-800 hover:bg-slate-700"
    : "bg-slate-200 hover:bg-slate-300 text-slate-700";
  const eventHighlightHome = darkMode ? "bg-blue-600/10" : "bg-blue-50";
  const eventBorderHome = darkMode ? "border-blue-500/20" : "border-blue-200";
  const eventHighlightAway = darkMode ? "bg-orange-500/10" : "bg-orange-50";
  const eventBorderAway = darkMode ? "border-orange-500/20" : "border-orange-200";

  return (
    <div className={`min-h-screen ${themeClasses}`}>
      {/* Header */}
      <header className={`${headerClasses} px-4 py-4`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Trophy className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight">LIGAKIT</h1>
              <p className={`text-xs ${subtextClasses}`}>{match.competition.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {match.matchState === "LIVE" && (
              <div className="flex items-center gap-1.5 bg-red-600/10 px-2.5 py-1 rounded-lg border border-red-600/20">
                <div className="relative flex h-1.5 w-1.5">
                  <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <div className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">ŽIVĚ</span>
              </div>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${btnClasses}`}
              title={t("theme.toggle")}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={handleShare}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${btnClasses}`}
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">{t("share")}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors text-white"
            >
              <Download size={16} />
              <span className="hidden sm:inline">{t("pdf")}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Score Section */}
        <section className={`${cardClasses} rounded-2xl border p-6 md:p-8`}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-3">
              <div className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center border ${darkMode ? "bg-slate-800 border-white/10" : "bg-slate-100 border-slate-200"}`}>
                {match.homeTeam?.logoUrl ? (
                  <img src={match.homeTeam.logoUrl} alt="" className="w-3/4 h-3/4 object-contain" />
                ) : (
                  <Trophy size={48} className="text-blue-500 opacity-60" />
                )}
              </div>
              <h2 className="text-lg md:text-xl font-black uppercase text-center">{homeName}</h2>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4 text-5xl md:text-7xl font-black">
                <span className="text-blue-500">{match.homeScore ?? 0}</span>
                <span className={darkMode ? "text-slate-600" : "text-slate-300"}>:</span>
                <span className="text-orange-500">{match.awayScore ?? 0}</span>
              </div>
              <span className={`text-sm ${subtextClasses}`}>
                {match.matchState === "FINISHED" ? t("finalScore") : t("liveScore")}
              </span>
              {match.matchState === "LIVE" && match.startedAt && (
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-100"}`}>
                  <Timer className="text-blue-500 shrink-0" size={12} />
                  <span className="text-sm font-black tabular-nums italic">
                    {timerMinutes}:{timerSeconds.toString().padStart(2, "0")}
                  </span>
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-3">
              <div className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center border ${darkMode ? "bg-slate-800 border-white/10" : "bg-slate-100 border-slate-200"}`}>
                {match.awayTeam?.logoUrl ? (
                  <img src={match.awayTeam.logoUrl} alt="" className="w-3/4 h-3/4 object-contain" />
                ) : (
                  <Trophy size={48} className="text-orange-500 opacity-60" />
                )}
              </div>
              <h2 className="text-lg md:text-xl font-black uppercase text-center">{awayName}</h2>
            </div>
          </div>
        </section>

        {/* Formations - Collapsible */}
        {(match.formations.home || match.formations.away) && (
          <section className={`${cardClasses} rounded-2xl border p-6`}>
            <button
              onClick={() => setLineupsExpanded(!lineupsExpanded)}
              className="w-full flex items-center justify-between mb-4"
            >
              <h3 className="text-lg font-black uppercase text-center flex-1">{t("lineups")}</h3>
              <div className={`p-2 rounded-lg ${btnClasses}`}>
                {lineupsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            {lineupsExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Home Formation */}
                {match.formations.home && (
                  <div className="flex flex-col items-center gap-4">
                    <h4 className={`text-sm font-bold uppercase ${darkMode ? "text-blue-400" : "text-blue-600"}`}>{homeName}</h4>
                    <div className={`rounded-xl p-4 border ${darkMode ? "bg-slate-800/50 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                      {(() => {
                        const formation = getFormation(match.formations.home);
                        if (!formation) return <span className={subtextClasses}>{t("unknownFormation")}</span>;
                        return (
                          <TacticalPitch
                            formation={formation}
                            side="home"
                            selectedPlayers={match.positions.home.map(p => ({
                              positionIndex: p.positionIndex,
                              playerId: p.playerId,
                              name: p.name,
                              number: p.number,
                            }))}
                            readonly
                            compact={false}
                          />
                        );
                      })()}
                    </div>
                    {match.positions.home.length > 0 && (
                      <div className="text-sm space-y-1">
                        {match.positions.home
                          .filter(p => p.name)
                          .map((p, i) => (
                            <div key={i} className={`flex items-center gap-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                              <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {p.number ?? "?"}
                              </span>
                              <span>{p.name}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Away Formation */}
                {match.formations.away && (
                  <div className="flex flex-col items-center gap-4">
                    <h4 className={`text-sm font-bold uppercase ${darkMode ? "text-orange-400" : "text-orange-600"}`}>{awayName}</h4>
                    <div className={`rounded-xl p-4 border ${darkMode ? "bg-slate-800/50 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                      {(() => {
                        const formation = getFormation(match.formations.away);
                        if (!formation) return <span className={subtextClasses}>{t("unknownFormation")}</span>;
                        return (
                          <TacticalPitch
                            formation={formation}
                            side="away"
                            selectedPlayers={match.positions.away.map(p => ({
                              positionIndex: p.positionIndex,
                              playerId: p.playerId,
                              name: p.name,
                              number: p.number,
                            }))}
                            readonly
                            compact={false}
                          />
                        );
                      })()}
                    </div>
                    {match.positions.away.length > 0 && (
                      <div className="text-sm space-y-1">
                        {match.positions.away
                          .filter(p => p.name)
                          .map((p, i) => (
                            <div key={i} className={`flex items-center gap-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                              <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {p.number ?? "?"}
                              </span>
                              <span>{p.name}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Events Timeline - Scoreboard Style */}
        {allEvents.length > 0 && (
          <section className={`${cardClasses} rounded-2xl border p-6`}>
            <h3 className="text-lg font-black uppercase mb-6">📋 {t("matchEvents")}</h3>
            <div className="space-y-2">
              {allEvents.map((ev, index) => {
                const minuteStr = ev.minute != null
                  ? `${ev.minute}${ev.addedTime ? `+${ev.addedTime}` : ""}'`
                  : "";
                const isHome = ev.teamSide === "HOME";
                const isSub = ev.type === "SUBSTITUTION";
                const isOwnGoal = ev.type === "OWN_GOAL";
                const label = getEventLabel(ev.type);

                // Card styles based on theme
                const homeCardBg = darkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200";
                const awayCardBg = darkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200";
                const highlightHome = darkMode ? "bg-blue-600/20 border-blue-500/40" : "bg-blue-50 border-blue-300";
                const highlightAway = darkMode ? "bg-orange-500/20 border-orange-500/40" : "bg-orange-50 border-orange-300";

                const rowCls = `flex items-center gap-1.5 px-2 py-1.5 rounded-lg border w-full ${index === 0 ? (isHome ? highlightHome : highlightAway) : (isHome ? homeCardBg : awayCardBg)}`;

                const HomeCard = (
                  <div className={rowCls}>
                    <div className="min-w-0 flex-1 text-right">
                      {isSub ? (
                        <p className={`text-xs font-black uppercase italic tracking-tight leading-tight flex items-center gap-1 justify-end flex-wrap ${darkMode ? "" : "text-slate-800"}`}>
                          <span className="text-red-500">↓ {ev.playerName ?? "?"}</span>
                          <span className={darkMode ? "text-slate-600" : "text-slate-400"}>/</span>
                          <span className="text-emerald-500">↑ {ev.player2Name ?? "?"}</span>
                        </p>
                      ) : (
                        <p className={`text-xs font-black uppercase italic tracking-tight truncate leading-tight flex items-center gap-1 justify-end flex-wrap ${darkMode ? "" : "text-slate-800"}`}>
                          {isOwnGoal && <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-red-600 text-white leading-none shrink-0">VG</span>}
                          {ev.playerName
                            ? <>{ev.playerName}{!isOwnGoal && <span className={`font-normal opacity-50 not-italic ${darkMode ? "" : "text-slate-500"}`}> ({label})</span>}</>
                            : (!isOwnGoal && label)
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
                        <p className={`text-xs font-black uppercase italic tracking-tight leading-tight flex items-center gap-1 flex-wrap ${darkMode ? "" : "text-slate-800"}`}>
                          <span className="text-red-500">↓ {ev.playerName ?? "?"}</span>
                          <span className={darkMode ? "text-slate-600" : "text-slate-400"}>/</span>
                          <span className="text-emerald-500">↑ {ev.player2Name ?? "?"}</span>
                        </p>
                      ) : (
                        <p className={`text-xs font-black uppercase italic tracking-tight truncate leading-tight flex items-center gap-1 flex-wrap ${darkMode ? "" : "text-slate-800"}`}>
                          {ev.playerName
                            ? <>{ev.playerName}{!isOwnGoal && <span className={`font-normal opacity-50 not-italic ${darkMode ? "" : "text-slate-500"}`}> ({label})</span>}</>
                            : (!isOwnGoal && label)
                          }
                          {isOwnGoal && <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-red-600 text-white leading-none shrink-0">VG</span>}
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
                      <span className={`text-[10px] font-black tabular-nums ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
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
          </section>
        )}

        {/* Footer */}
        <footer className={`text-center text-sm pt-4 ${subtextClasses}`}>
          <p>{t("generatedBy")} • https://ligakit.cz</p>
        </footer>
      </main>
    </div>
  );
}
