"use client";

import { useState } from "react";

export interface RosterPlayer {
  id: string;
  name: string;
  number: number | null;
  slot?: string;
}

interface Props {
  players: RosterPlayer[];
  teamName: string;
  side: "HOME" | "AWAY";
  onEvent: (type: string, side: "HOME" | "AWAY", playerName: string, player2Name?: string) => void;
  /** Fallback manual name input when roster is empty */
  manualName: string;
  onManualNameChange: (v: string) => void;
}

const ACTIONS = [
  { type: "GOAL",        label: "⚽", title: "Gól",        className: "bg-green-600 hover:bg-green-700 text-white" },
  { type: "OWN_GOAL",   label: "⚽↩", title: "Vlastní",   className: "bg-gray-600 hover:bg-gray-700 text-white" },
  { type: "YELLOW_CARD", label: "🟨", title: "Žlutá",     className: "bg-yellow-500 hover:bg-yellow-600 text-white" },
  { type: "RED_CARD",    label: "🟥", title: "Červená",   className: "bg-red-700 hover:bg-red-800 text-white" },
];

export function PlayerRosterActions({
  players,
  teamName,
  side,
  onEvent,
  manualName,
  onManualNameChange,
}: Props) {
  const [subOut, setSubOut] = useState<string | null>(null);

  const handleSubIn = (inName: string) => {
    if (!subOut) return;
    onEvent("SUBSTITUTION", side, subOut, inName);
    setSubOut(null);
  };

  if (players.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{teamName}</p>
        <input
          type="text"
          placeholder="Jméno hráče (volitelné)"
          value={manualName}
          onChange={(e) => onManualNameChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {ACTIONS.map((a) => (
            <button
              key={a.type}
              onClick={() => onEvent(a.type, side, manualName)}
              title={a.title}
              className={`flex-1 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform ${a.className}`}
            >
              {a.label} {a.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{teamName}</p>

      {subOut ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 p-3 space-y-2">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            🔄 Střídání – vychází <strong>{subOut}</strong>, vyber nastupujícího:
          </p>
          <ul className="divide-y rounded-lg border overflow-hidden">
            {players.filter((p) => p.name !== subOut).map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => handleSubIn(p.name)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-card hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-left"
                >
                  <span className="w-7 text-right text-xs tabular-nums text-muted-foreground shrink-0 font-mono">{p.number ?? ""}</span>
                  <span className="flex-1 text-sm font-medium">{p.name}</span>
                  <span className="text-emerald-600 text-xs font-bold">↓ nastupuje</span>
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setSubOut(null)} className="text-xs text-muted-foreground hover:text-foreground">
            ✕ Zrušit
          </button>
        </div>
      ) : (() => {
        const starters = players.filter((p) => p.slot !== "SUBSTITUTE");
        const subs = players.filter((p) => p.slot === "SUBSTITUTE");
        const renderRow = (p: RosterPlayer) => (
          <li key={p.id} className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted/40 transition-colors">
            <span className="w-7 text-right text-xs tabular-nums text-muted-foreground shrink-0 font-mono">
              {p.number ?? ""}
            </span>
            <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
            <div className="flex gap-1 shrink-0">
              {ACTIONS.map((a) => (
                <button
                  key={a.type}
                  onClick={() => onEvent(a.type, side, p.name)}
                  title={`${a.title} — ${p.name}`}
                  className={`size-8 rounded-lg text-sm flex items-center justify-center active:scale-90 transition-transform ${a.className}`}
                >
                  {a.label}
                </button>
              ))}
              <button
                onClick={() => setSubOut(p.name)}
                title={`Střídání — ${p.name} vychází`}
                className="size-8 rounded-lg text-sm flex items-center justify-center active:scale-90 transition-transform bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                🔄
              </button>
            </div>
          </li>
        );
        return (
          <div className="space-y-1">
            <ul className="divide-y rounded-xl border overflow-hidden">
              {starters.map(renderRow)}
            </ul>
            {subs.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 pt-1">Náhradníci</p>
                <ul className="divide-y rounded-xl border overflow-hidden opacity-80">
                  {subs.map(renderRow)}
                </ul>
              </>
            )}
          </div>
        );
      })()}

      {/* Fallback for unlisted player */}
      {!subOut && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground select-none py-1">
            + Hráč není v soupisce
          </summary>
          <div className="pt-2 flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Jméno hráče…"
              value={manualName}
              onChange={(e) => onManualNameChange(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm"
            />
            {ACTIONS.map((a) => (
              <button
                key={a.type}
                onClick={() => onEvent(a.type, side, manualName)}
                title={a.title}
                className={`px-3 py-2 rounded-lg font-bold text-sm active:scale-95 transition-transform ${a.className}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
