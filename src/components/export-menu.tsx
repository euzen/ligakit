"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileText, Printer, ChevronDown } from "lucide-react";

interface ExportTeam {
  name: string;
}

interface ExportMatch {
  round: number | null;
  note: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: Date | string | null;
  status: string;
}

interface ExportStandingRow {
  pos: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

interface ExportMenuProps {
  competitionName: string;
  competitionType: "LEAGUE" | "TOURNAMENT" | "CUP";
  matches: ExportMatch[];
  standings: ExportStandingRow[] | null;
  locale: string;
}

function escapeCSV(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCSV).join(",");
}

function downloadCSV(filename: string, content: string) {
  const bom = "\uFEFF"; // UTF-8 BOM for Excel
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtDate(d: Date | string | null, locale: string): string {
  if (!d) return "";
  return new Date(d).toLocaleString(locale === "cs" ? "cs-CZ" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ExportMenu({
  competitionName,
  competitionType,
  matches,
  standings,
  locale,
}: ExportMenuProps) {
  const isCS = locale === "cs";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const exportMatchesCSV = () => {
    const headers = isCS
      ? row("Kolo", "Skupina/Fáze", "Domácí", "Hosté", "Výsledek", "Datum", "Status")
      : row("Round", "Group/Stage", "Home", "Away", "Score", "Date", "Status");

    const lines = matches.map((m) => {
      const score =
        m.homeScore !== null && m.awayScore !== null
          ? `${m.homeScore}:${m.awayScore}`
          : "";
      const statusLabel = isCS
        ? { SCHEDULED: "Plánováno", PLAYED: "Odehráno", CANCELLED: "Zrušeno" }[m.status] ?? m.status
        : m.status;
      return row(
        m.round,
        m.note,
        m.homeTeamName,
        m.awayTeamName,
        score,
        fmtDate(m.scheduledAt, locale),
        statusLabel,
      );
    });

    downloadCSV(
      `${competitionName}-zapasy.csv`,
      [headers, ...lines].join("\n"),
    );
    setOpen(false);
  };

  const exportStandingsCSV = () => {
    if (!standings) return;
    const headers = isCS
      ? row("#", "Tým", "Z", "V", "R", "P", "Skóre", "+/-", "Body")
      : row("#", "Team", "P", "W", "D", "L", "Goals", "GD", "Pts");

    const lines = standings.map((r) =>
      row(
        r.pos,
        r.teamName,
        r.played,
        r.won,
        r.drawn,
        r.lost,
        `${r.goalsFor}:${r.goalsAgainst}`,
        r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff,
        r.points,
      ),
    );

    downloadCSV(
      `${competitionName}-tabulka.csv`,
      [headers, ...lines].join("\n"),
    );
    setOpen(false);
  };

  const printPage = () => {
    window.print();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-sm hover:bg-muted transition-colors"
      >
        <Download className="size-3.5" />
        {isCS ? "Export" : "Export"}
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-48 rounded-lg border bg-popover shadow-md py-1 text-sm">
          <button
            onClick={exportMatchesCSV}
            className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
          >
            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
            {isCS ? "Zápasy (CSV)" : "Matches (CSV)"}
          </button>

          {standings && (
            <button
              onClick={exportStandingsCSV}
              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
            >
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              {isCS ? "Tabulka (CSV)" : "Standings (CSV)"}
            </button>
          )}

          <div className="my-1 border-t" />

          <button
            onClick={printPage}
            className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
          >
            <Printer className="size-3.5 shrink-0 text-muted-foreground" />
            {isCS ? "Tisknout / PDF" : "Print / PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
