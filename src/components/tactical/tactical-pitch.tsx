"use client";

import { useMemo } from "react";
import type { Formation } from "@/lib/formations";

interface TacticalPitchProps {
  formation?: Formation;
  side: "home" | "away";
  selectedPlayers: Array<{
    positionIndex: number;
    playerId?: string;
    name: string;
    number: number | null;
  }>;
  onPositionClick?: (index: number) => void;
  readonly?: boolean;
  compact?: boolean;
}

export function TacticalPitch({
  formation,
  side,
  selectedPlayers,
  onPositionClick,
  readonly = false,
  compact = false,
}: TacticalPitchProps) {
  const positions = formation?.positions ?? [];

  const width = compact ? 120 : 280;
  const height = compact ? 180 : 420;
  const playerRadius = compact ? 10 : 14;

  const colorClass = side === "home"
    ? "fill-blue-600 stroke-blue-700"
    : "fill-orange-500 stroke-orange-600";

  const textClass = side === "home"
    ? "text-blue-700 dark:text-blue-300"
    : "text-orange-700 dark:text-orange-300";

  const toSvgCoord = (x: number, y: number) => ({
    cx: (x / 100) * width,
    cy: (y / 100) * height,
  });

  return (
    <div className="relative inline-block">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="rounded-lg border bg-green-700"
      >
        {/* Pitch markings */}
        <rect x="2" y="2" width={width - 4} height={height - 4} fill="#15803d" stroke="white" strokeWidth="2" />

        {/* Center line */}
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="white" strokeWidth="2" />

        {/* Center circle */}
        <circle cx={width / 2} cy={height / 2} r={compact ? 20 : 40} fill="none" stroke="white" strokeWidth="2" />

        {/* Center spot */}
        <circle cx={width / 2} cy={height / 2} r={compact ? 2 : 3} fill="white" />

        {/* Penalty areas */}
        <rect x={width * 0.15} y={height - 2} width={width * 0.7} height={compact ? 25 : 50} fill="none" stroke="white" strokeWidth="2" />
        <rect x={width * 0.15} y={0} width={width * 0.7} height={compact ? 25 : 50} fill="none" stroke="white" strokeWidth="2" />

        {/* Goal areas */}
        <rect x={width * 0.35} y={height - 2} width={width * 0.3} height={compact ? 10 : 20} fill="none" stroke="white" strokeWidth="2" />
        <rect x={width * 0.35} y={0} width={width * 0.3} height={compact ? 10 : 20} fill="none" stroke="white" strokeWidth="2" />

        {/* Penalty spots */}
        <circle cx={width / 2} cy={height - (compact ? 18 : 36)} r={compact ? 1.5 : 2} fill="white" />
        <circle cx={width / 2} cy={compact ? 18 : 36} r={compact ? 1.5 : 2} fill="white" />

        {/* Players */}
        {positions.map((pos, idx) => {
          const { cx, cy } = toSvgCoord(pos.x, pos.y);
          const player = selectedPlayers.find((p) => p.positionIndex === idx);
          const isClickable = !readonly && onPositionClick;

          return (
            <g key={idx} className={isClickable ? "cursor-pointer" : ""}>
              {/* Position circle */}
              <circle
                cx={cx}
                cy={cy}
                r={player ? playerRadius : playerRadius * 0.8}
                className={`${player ? colorClass : "fill-white/20 stroke-white/40"} transition-all`}
                strokeWidth="2"
                onClick={() => isClickable && onPositionClick(idx)}
              />

              {/* Player number */}
              {player?.number && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-white text-[8px] font-bold pointer-events-none"
                  style={{ fontSize: compact ? 8 : 10 }}
                >
                  {player.number}
                </text>
              )}

              {/* Role label (GK/DEF/MID/FWD) */}
              {!player && !compact && (
                <text
                  x={cx}
                  y={cy + playerRadius + 8}
                  textAnchor="middle"
                  className="fill-white/60 text-[8px] uppercase"
                >
                  {pos.role}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Player names below pitch */}
      {!compact && selectedPlayers.length > 0 && (
        <div className={`mt-2 text-xs ${textClass} space-y-0.5`}>
          {selectedPlayers.slice(0, 5).map((p, i) => (
            <div key={i} className="flex gap-1">
              <span className="font-bold min-w-[20px]">{p.number ?? "?"}</span>
              <span className="truncate">{p.name}</span>
            </div>
          ))}
          {selectedPlayers.length > 5 && (
            <div className="text-muted-foreground italic">+ {selectedPlayers.length - 5} dalších</div>
          )}
        </div>
      )}
    </div>
  );
}
