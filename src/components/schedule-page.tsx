"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Trophy, Sun, Moon, CalendarDays, Clock, Radio } from "lucide-react";

interface ScheduleMatch {
  id: string;
  round: number | null;
  note: string | null;
  bracketPos: number | null;
  homeTeam: { id: string; name: string; logoUrl?: string | null } | null;
  awayTeam: { id: string; name: string; logoUrl?: string | null } | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  scheduledAt: Date | string | null;
  matchState?: string | null;
  period?: number | null;
  startedAt?: Date | string | null;
  periodOffset?: number | null;
}

interface Competition {
  id: string;
  name: string;
  logoUrl: string | null;
  sport: { icon: string | null; name: string } | null;
  matches: ScheduleMatch[];
}

interface SchedulePageProps {
  competition: Competition;
  locale: string;
}

const STAGE_LABELS: Record<string, { cs: string; en: string }> = {
  F:   { cs: "Finále",       en: "Final" },
  SF:  { cs: "Semifinále",   en: "Semi-final" },
  QF:  { cs: "Čtvrtfinále",  en: "Quarter-final" },
  R16: { cs: "Osmifinále",   en: "Round of 16" },
  "3rd": { cs: "O 3. místo", en: "3rd Place" },
};

function tName(m: ScheduleMatch, side: "home" | "away") {
  return side === "home"
    ? (m.homeTeam?.name ?? m.homeTeamName ?? "?")
    : (m.awayTeam?.name ?? m.awayTeamName ?? "?");
}

function tLogo(m: ScheduleMatch, side: "home" | "away") {
  return side === "home" ? m.homeTeam?.logoUrl : m.awayTeam?.logoUrl;
}

function matchLabel(m: ScheduleMatch, isCS: boolean): string | null {
  if (!m.note) return m.round ? `${isCS ? "Kolo" : "Round"} ${m.round}` : null;
  const entry = STAGE_LABELS[m.note];
  return entry ? (isCS ? entry.cs : entry.en) : m.note;
}

function fmtDay(date: Date, locale: string) {
  return date.toLocaleDateString(locale === "cs" ? "cs-CZ" : "en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function fmtTime(date: Date, locale: string) {
  return date.toLocaleTimeString(locale === "cs" ? "cs-CZ" : "en-US", {
    hour: "2-digit", minute: "2-digit",
  });
}

const PERIOD_LABELS: Record<number, { cs: string; en: string }> = {
  1: { cs: "1. pol.",   en: "1st H" },
  2: { cs: "2. pol.",   en: "2nd H" },
  3: { cs: "Prodl.",    en: "ET" },
  4: { cs: "Pen.",      en: "Pen." },
};

function ElapsedTimer({ startedAt, periodOffset }: { startedAt: Date | string | null | undefined; periodOffset?: number | null }) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!startedAt) { setElapsed(0); return; }
    const start = new Date(startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    ref.current = setInterval(update, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [startedAt]);
  // When paused (startedAt=null), periodOffset holds the frozen elapsed seconds
  const total = startedAt ? elapsed + (periodOffset ?? 0) : (periodOffset ?? 0);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return <span className="tabular-nums">{m}:{s.toString().padStart(2, "0")}</span>;
}

function isToday(d: Date) {
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function SchedulePage({ competition, locale }: SchedulePageProps) {
  const isCS = locale === "cs";
  const [dark, setDark] = useState(true);
  const [filterRound, setFilterRound] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [matches, setMatches] = useState<ScheduleMatch[]>(competition.matches);

  // Poll every 5s – always, so live scores and state changes appear automatically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/competitions/${competition.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setMatches(data.matches ?? []);
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [competition.id]);

  const allRounds = useMemo(
    () => [...new Set(matches.map((m) => m.round ?? 0))].sort((a, b) => a - b),
    [matches],
  );

  const filtered = useMemo(() => matches.filter((m) => {
    if (filterRound !== "all" && String(m.round ?? 0) !== filterRound) return false;
    if (filterStatus !== "all" && m.status !== filterStatus) return false;
    return true;
  }), [matches, filterRound, filterStatus]);

  const { dayGroups, noDayMatches } = useMemo(() => {
    const withDate = filtered.filter((m) => m.scheduledAt)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
    const noDate = filtered.filter((m) => !m.scheduledAt);
    const map = new Map<string, { date: Date; matches: ScheduleMatch[] }>();
    for (const m of withDate) {
      const d = new Date(m.scheduledAt!);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { date: d, matches: [] });
      map.get(key)!.matches.push(m);
    }
    return { dayGroups: [...map.values()], noDayMatches: noDate };
  }, [filtered]);

  // ── Theme tokens (mirrors scoreboard) ──────────────────────────────────
  const bg       = dark ? "bg-slate-950 text-white"          : "bg-slate-100 text-slate-900";
  const card     = dark ? "bg-slate-900/60 border-white/5"   : "bg-white border-slate-200 shadow-sm";
  const muted    = dark ? "text-slate-500"                   : "text-slate-400";
  const logoBox  = dark ? "bg-slate-800 border-white/5"      : "bg-slate-100 border-slate-200";
  const rowBg    = dark ? "bg-white/5 border-white/5 hover:bg-white/8"  : "bg-slate-50 border-slate-200 hover:bg-slate-100";
  const rowLive  = dark ? "bg-red-600/15 border-red-500/30"  : "bg-red-50 border-red-200";
  const dayHdr   = dark ? "border-white/10"                  : "border-slate-200";
  const dayToday = dark ? "border-blue-500"                  : "border-blue-500";
  const selectCls = dark
    ? "bg-slate-800 border-white/10 text-white focus:ring-blue-500"
    : "bg-white border-slate-200 text-slate-900 focus:ring-blue-500";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${bg}`}>

      {/* ── Top bar ── */}
      <div className={`shrink-0 flex items-center justify-between px-4 py-3 border-b ${dark ? "border-white/5" : "border-slate-200"}`}>
        <div className="flex items-center gap-3">
          {/* Competition logo / icon */}
          <div className={`size-10 rounded-xl flex items-center justify-center border shrink-0 ${logoBox}`}>
            {competition.logoUrl
              ? <img src={competition.logoUrl} alt="" className="size-7 object-contain" />
              : competition.sport?.icon
                ? <img src={competition.sport.icon} alt="" className="size-7 object-cover" />
                : <Trophy size={20} className="text-blue-500 opacity-70" />}
          </div>
          <div>
            <h1 className="text-sm font-black uppercase italic tracking-tighter leading-none">
              {competition.name}
            </h1>
            <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5 ${muted}`}>
              {isCS ? "Rozpis zápasů" : "Match Schedule"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Back link */}
          <a
            href={`/${locale}/competitions/${competition.id}`}
            className={`hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-colors ${dark ? "border-white/10 text-slate-400 hover:text-white hover:border-white/20" : "border-slate-200 text-slate-500 hover:text-slate-900"}`}
          >
            ← {isCS ? "Přehled" : "Overview"}
          </a>
          {/* Dark/light toggle */}
          <button
            onClick={() => setDark((v) => !v)}
            className={`p-2 rounded-lg transition-all ${dark ? "bg-slate-800 text-yellow-400 hover:bg-slate-700" : "bg-white text-slate-800 shadow border border-slate-200 hover:bg-slate-50"}`}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className={`shrink-0 flex flex-wrap items-center gap-2 px-4 py-2.5 border-b ${dark ? "border-white/5" : "border-slate-200"}`}>
        <select
          value={filterRound}
          onChange={(e) => setFilterRound(e.target.value)}
          className={`h-8 rounded-lg border px-2 text-xs font-bold uppercase tracking-wide focus:outline-none focus:ring-1 ${selectCls}`}
        >
          <option value="all">{isCS ? "Všechna kola" : "All rounds"}</option>
          {allRounds.map((r) => (
            <option key={r} value={String(r)}>
              {r === 0 ? (isCS ? "Bez kola" : "No round") : `${isCS ? "Kolo" : "Round"} ${r}`}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`h-8 rounded-lg border px-2 text-xs font-bold uppercase tracking-wide focus:outline-none focus:ring-1 ${selectCls}`}
        >
          <option value="all">{isCS ? "Všechny stavy" : "All statuses"}</option>
          <option value="SCHEDULED">{isCS ? "Plánováno" : "Scheduled"}</option>
          <option value="PLAYED">{isCS ? "Odehráno" : "Played"}</option>
          <option value="CANCELLED">{isCS ? "Zrušeno" : "Cancelled"}</option>
        </select>
        {(filterRound !== "all" || filterStatus !== "all") && (
          <button
            onClick={() => { setFilterRound("all"); setFilterStatus("all"); }}
            className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${dark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-900"}`}
          >
            {isCS ? "Zrušit filtr" : "Clear"}
          </button>
        )}
        <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest ${muted}`}>
          {filtered.length} {isCS ? "zápasů" : "matches"}
        </span>
      </div>

      {/* ── Match list ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {filtered.length === 0 && (
          <p className={`text-center py-16 text-sm font-bold uppercase tracking-widest ${muted}`}>
            {isCS ? "Žádné zápasy" : "No matches"}
          </p>
        )}

        {dayGroups.map(({ date, matches: dayMatches }) => {
          const today = isToday(date);
          return (
            <div key={date.toISOString().slice(0, 10)}>
              {/* Day header */}
              <div className={`flex items-center gap-2 mb-2 pb-1.5 border-b ${today ? dayToday : dayHdr}`}>
                <CalendarDays size={13} className={today ? "text-blue-500" : muted} />
                <span className={`text-[11px] font-black uppercase italic tracking-widest capitalize ${today ? "text-blue-500" : muted}`}>
                  {fmtDay(date, locale)}
                  {today && <span className="ml-2 not-italic normal-case font-bold opacity-70">{isCS ? "— dnes" : "— today"}</span>}
                </span>
              </div>
              <div className="space-y-1.5">
                {dayMatches.map((m) => (
                  <MatchRow key={m.id} match={m} isCS={isCS} locale={locale} dark={dark} rowBg={rowBg} rowLive={rowLive} muted={muted} />
                ))}
              </div>
            </div>
          );
        })}

        {noDayMatches.length > 0 && (
          <div>
            <div className={`flex items-center gap-2 mb-2 pb-1.5 border-b border-dashed ${dayHdr}`}>
              <Clock size={13} className={muted} />
              <span className={`text-[11px] font-black uppercase italic tracking-widest ${muted}`}>
                {isCS ? "Datum neurčeno" : "Date not set"}
              </span>
            </div>
            <div className="space-y-1.5">
              {noDayMatches.map((m) => (
                <MatchRow key={m.id} match={m} isCS={isCS} locale={locale} dark={dark} rowBg={rowBg} rowLive={rowLive} muted={muted} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchRow({
  match: m, isCS, locale, dark, rowBg, rowLive, muted,
}: {
  match: ScheduleMatch; isCS: boolean; locale: string;
  dark: boolean; rowBg: string; rowLive: string; muted: string;
}) {
  const home = tName(m, "home");
  const away = tName(m, "away");
  const homeLogo = tLogo(m, "home");
  const awayLogo = tLogo(m, "away");
  const isPlayed = m.status === "PLAYED";
  const isLive = m.matchState === "LIVE";
  const isPaused = m.matchState === "PAUSED";
  const isCancelled = m.status === "CANCELLED";
  const homeWon = isPlayed && m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore;
  const awayWon = isPlayed && m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore;
  const label = matchLabel(m, isCS);
  const time = m.scheduledAt ? fmtTime(new Date(m.scheduledAt), locale) : null;

  const logoBox = dark ? "bg-slate-800 border-white/5" : "bg-slate-100 border-slate-200";

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${isLive ? rowLive : isPaused ? (dark ? "bg-yellow-600/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-200") : isPlayed ? (dark ? "bg-emerald-600/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200") : isCancelled ? `${rowBg} opacity-50` : rowBg}`}>
      {/* Desktop */}
      <div className="hidden sm:grid sm:grid-cols-[160px_1fr_96px_1fr_90px] items-center gap-3 px-4 py-3">
        {/* Time */}
        {isLive ? (
          <span className="flex items-center gap-1.5 text-sm font-black italic whitespace-nowrap text-red-400">
            <Radio size={11} className="animate-pulse shrink-0" />
            <span>LIVE</span>
            {m.period && (
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {isCS ? (PERIOD_LABELS[m.period]?.cs ?? `Část ${m.period}`) : (PERIOD_LABELS[m.period]?.en ?? `Part ${m.period}`)}
              </span>
            )}
            {m.startedAt && (
              <span className="text-[10px] font-black tabular-nums not-italic">
                <ElapsedTimer startedAt={m.startedAt} periodOffset={m.periodOffset} />
              </span>
            )}
          </span>
        ) : isPaused ? (
          <span className="flex items-center gap-1.5 text-sm font-black italic whitespace-nowrap text-yellow-500">
            <span>{isCS ? "Přestávka" : "Half-time"}</span>
            {m.period && (
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {isCS ? (PERIOD_LABELS[m.period]?.cs ?? `Část ${m.period}`) : (PERIOD_LABELS[m.period]?.en ?? `Part ${m.period}`)}
              </span>
            )}
            <span className="text-[10px] font-black tabular-nums not-italic">
              <ElapsedTimer startedAt={null} periodOffset={m.periodOffset} />
            </span>
          </span>
        ) : (
          <span className={`text-sm font-black tabular-nums italic ${muted}`}>{time ?? "—"}</span>
        )}

        {/* Home */}
        <div className={`flex items-center justify-end gap-2 min-w-0 ${homeWon ? "font-black" : ""}`}>
          <span className="text-sm truncate">{home}</span>
          <div className={`size-8 rounded-lg border shrink-0 flex items-center justify-center ${logoBox}`}>
            {homeLogo
              ? <img src={homeLogo} alt={home} className="size-6 object-contain" />
              : <Trophy size={14} className="text-blue-500 opacity-50" />}
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-1.5">
          {(isPlayed || isLive || isPaused) && m.homeScore !== null && m.awayScore !== null ? (
            <>
              <span className={`text-xl font-black tabular-nums w-7 text-center tracking-tighter ${homeWon ? "text-blue-500" : (isLive || isPaused) ? "text-red-400" : dark ? "text-white" : "text-slate-900"}`}>
                {m.homeScore}
              </span>
              <span className={`text-base font-black ${(isLive || isPaused) ? "text-red-600" : dark ? "text-slate-600" : "text-slate-300"}`}>:</span>
              <span className={`text-xl font-black tabular-nums w-7 text-center tracking-tighter ${awayWon ? "text-blue-500" : (isLive || isPaused) ? "text-red-400" : dark ? "text-white" : "text-slate-900"}`}>
                {m.awayScore}
              </span>
            </>
          ) : isCancelled ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
              {isCS ? "Zrušeno" : "Cancelled"}
            </span>
          ) : (
            <span className={`text-xs font-black uppercase tracking-widest italic ${muted}`}>vs</span>
          )}
        </div>

        {/* Away */}
        <div className={`flex items-center gap-2 min-w-0 ${awayWon ? "font-black" : ""}`}>
          <div className={`size-8 rounded-lg border shrink-0 flex items-center justify-center ${logoBox}`}>
            {awayLogo
              ? <img src={awayLogo} alt={away} className="size-6 object-contain" />
              : <Trophy size={14} className="text-orange-500 opacity-50" />}
          </div>
          <span className="text-sm truncate">{away}</span>
        </div>

        {/* Label */}
        <div className="flex flex-col items-end gap-0.5">
          {label && (
            <span className={`text-[10px] font-black uppercase italic tracking-widest ${muted}`}>{label}</span>
          )}
          {isPlayed && !isCancelled && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">
              {isCS ? "Odehráno" : "Played"}
            </span>
          )}
          {!isPlayed && !isCancelled && !isLive && !isPaused && (
            <span className={`text-[9px] font-bold uppercase tracking-widest ${muted}`}>
              {isCS ? "Plánováno" : "Scheduled"}
            </span>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden px-3 py-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase italic tracking-widest text-red-400">
                <span className="flex items-center gap-1"><Radio size={10} className="animate-pulse" />LIVE</span>
                {m.period && (
                  <span className="text-[9px] font-bold tracking-widest">
                    {isCS ? (PERIOD_LABELS[m.period]?.cs ?? `Část ${m.period}`) : (PERIOD_LABELS[m.period]?.en ?? `Part ${m.period}`)}
                  </span>
                )}
                {m.startedAt && (
                  <span className="tabular-nums">
                    <ElapsedTimer startedAt={m.startedAt} periodOffset={m.periodOffset} />
                  </span>
                )}
              </span>
            ) : isPaused ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase italic tracking-widest text-yellow-500">
                {isCS ? "Přestávka" : "HT"}
                {m.period && (
                  <span className="text-[9px] font-bold tracking-widest">
                    {isCS ? (PERIOD_LABELS[m.period]?.cs ?? `Část ${m.period}`) : (PERIOD_LABELS[m.period]?.en ?? `Part ${m.period}`)}
                  </span>
                )}
                <span className="tabular-nums">
                  <ElapsedTimer startedAt={null} periodOffset={m.periodOffset} />
                </span>
              </span>
            ) : (
              <span className={`text-[10px] font-black uppercase italic tracking-widest ${muted}`}>{time ?? "—"}</span>
            )}
          </div>
          {label && <span className={`text-[10px] font-black uppercase italic tracking-widest ${muted}`}>{label}</span>}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* Home mobile */}
          <div className={`flex items-center gap-1.5 min-w-0 ${homeWon ? "font-black" : ""}`}>
            <div className={`size-6 rounded-md border shrink-0 flex items-center justify-center ${dark ? "bg-slate-800 border-white/5" : "bg-slate-100 border-slate-200"}`}>
              {homeLogo
                ? <img src={homeLogo} alt={home} className="size-4 object-contain" />
                : <Trophy size={10} className="text-blue-500 opacity-50" />}
            </div>
            <span className="text-xs truncate">{home}</span>
          </div>
          {/* Score mobile */}
          {(isPlayed || isLive || isPaused) && m.homeScore !== null && m.awayScore !== null ? (
            <span className={`text-base font-black tabular-nums text-center tracking-tighter ${(isLive || isPaused) ? "text-red-400" : dark ? "text-white" : "text-slate-900"}`}>
              {m.homeScore}:{m.awayScore}
            </span>
          ) : (
            <span className={`text-[10px] font-black uppercase italic text-center ${muted}`}>vs</span>
          )}
          {/* Away mobile */}
          <div className={`flex items-center justify-end gap-1.5 min-w-0 ${awayWon ? "font-black" : ""}`}>
            <span className="text-xs truncate text-right">{away}</span>
            <div className={`size-6 rounded-md border shrink-0 flex items-center justify-center ${dark ? "bg-slate-800 border-white/5" : "bg-slate-100 border-slate-200"}`}>
              {awayLogo
                ? <img src={awayLogo} alt={away} className="size-4 object-contain" />
                : <Trophy size={10} className="text-orange-500 opacity-50" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
