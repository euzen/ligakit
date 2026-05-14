"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, UserMinus, Save, Lock } from "lucide-react";

interface RosterPlayer {
  id: string;
  name: string;
  number: number | null;
  position: { id: string; name: string; labelCs: string; labelEn: string } | null;
}

interface LineupEntry {
  playerId?: string;
  guestPlayerId?: string;
  slot: "STARTER" | "SUBSTITUTE";
  shirtNumber: number | null;
}

interface MatchPlayerRecord {
  id: string;
  playerId: string | null;
  guestPlayerId: string | null;
  teamSide: string;
  slot: "STARTER" | "SUBSTITUTE";
  shirtNumber: number | null;
  player: RosterPlayer | null;
  guestPlayer: { id: string; name: string; number: number | null } | null;
}

interface LineupEditorProps {
  matchId: string;
  locale: string;
  homeName: string;
  awayName: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  competitionId: string | null;
  matchState: string | null;
}

export function LineupEditor({
  matchId,
  locale,
  homeName,
  awayName,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  competitionId,
  matchState,
}: LineupEditorProps) {
  const cs = locale === "cs";
  const locked = matchState === "LIVE" || matchState === "FINISHED" || matchState === "PAUSED";

  const [homeRoster, setHomeRoster] = useState<RosterPlayer[]>([]);
  const [awayRoster, setAwayRoster] = useState<RosterPlayer[]>([]);
  const [homeLineup, setHomeLineup] = useState<LineupEntry[]>([]);
  const [awayLineup, setAwayLineup] = useState<LineupEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const posLabel = (pos: RosterPlayer["position"]) => {
    if (!pos) return "";
    return (cs ? pos.labelCs : pos.labelEn) || pos.name;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lineupRes, homeRes, awayRes] = await Promise.all([
        fetch(`/api/matches/${matchId}/lineup`),
        homeTeamId ? fetch(`/api/teams/${homeTeamId}/players`) : Promise.resolve(null),
        awayTeamId ? fetch(`/api/teams/${awayTeamId}/players`) : Promise.resolve(null),
      ]);

      if (lineupRes.ok) {
        const data: MatchPlayerRecord[] = await lineupRes.json();
        setHomeLineup(data.filter((p) => p.teamSide === "HOME").map((p) => ({
          playerId: p.playerId ?? undefined,
          guestPlayerId: p.guestPlayerId ?? undefined,
          slot: p.slot, shirtNumber: p.shirtNumber,
        })));
        setAwayLineup(data.filter((p) => p.teamSide === "AWAY").map((p) => ({
          playerId: p.playerId ?? undefined,
          guestPlayerId: p.guestPlayerId ?? undefined,
          slot: p.slot, shirtNumber: p.shirtNumber,
        })));
      }

      // For guest teams fetch players from competitionTeam
      if (homeTeamId) {
        if (homeRes?.ok) setHomeRoster(await homeRes.json());
      } else if (homeTeamName && competitionId) {
        const ct = await fetch(`/api/competitions/${competitionId}/guest-players?guestName=${encodeURIComponent(homeTeamName)}`);
        if (ct.ok) setHomeRoster(await ct.json());
      }
      if (awayTeamId) {
        if (awayRes?.ok) setAwayRoster(await awayRes.json());
      } else if (awayTeamName && competitionId) {
        const ct = await fetch(`/api/competitions/${competitionId}/guest-players?guestName=${encodeURIComponent(awayTeamName)}`);
        if (ct.ok) setAwayRoster(await ct.json());
      }
    } finally {
      setLoading(false);
    }
  }, [matchId, homeTeamId, awayTeamId, homeTeamName, awayTeamName, competitionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const entryKey = (e: LineupEntry) => e.guestPlayerId ?? e.playerId ?? "";

  const togglePlayer = (
    side: "home" | "away",
    player: RosterPlayer,
    slot: "STARTER" | "SUBSTITUTE",
    isGuestSide: boolean,
  ) => {
    const lineup = side === "home" ? homeLineup : awayLineup;
    const setLineup = side === "home" ? setHomeLineup : setAwayLineup;
    const key = player.id;
    const existing = lineup.find((e) => entryKey(e) === key);
    const newEntry: LineupEntry = isGuestSide
      ? { guestPlayerId: player.id, slot, shirtNumber: player.number }
      : { playerId: player.id, slot, shirtNumber: player.number };

    if (existing) {
      if (existing.slot === slot) {
        setLineup(lineup.filter((e) => entryKey(e) !== key));
      } else {
        setLineup(lineup.map((e) => entryKey(e) === key ? { ...e, slot } : e));
      }
    } else {
      setLineup([...lineup, newEntry]);
    }
  };

  const updateShirt = (side: "home" | "away", playerId: string, val: string) => {
    const setLineup = side === "home" ? setHomeLineup : setAwayLineup;
    setLineup((prev) => prev.map((e) => entryKey(e) === playerId
      ? { ...e, shirtNumber: val === "" ? null : Number(val) }
      : e,
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/lineup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ home: homeLineup, away: awayLineup }),
      });
      if (res.ok) {
        toast.success(cs ? "Nominace uložena" : "Lineup saved");
      } else {
        const data = await res.json();
        if (data.error === "MATCH_ALREADY_STARTED") {
          toast.error(cs ? "Zápas již byl spuštěn, nelze měnit nominaci" : "Match already started");
        } else {
          toast.error(data.error ?? "Error");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" />
        {cs ? "Načítání…" : "Loading…"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {locked && (
        <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <Lock className="size-4 shrink-0" />
          {cs ? "Zápas byl spuštěn – nominace je uzamčena." : "Match started – lineup is locked."}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {([
          { side: "home" as const, name: homeName, roster: homeRoster, lineup: homeLineup, teamId: homeTeamId, isGuestSide: !homeTeamId },
          { side: "away" as const, name: awayName, roster: awayRoster, lineup: awayLineup, teamId: awayTeamId, isGuestSide: !awayTeamId },
        ]).map(({ side, name, roster, lineup, teamId, isGuestSide }) => (
          <div key={side} className="space-y-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${side === "home" ? "bg-blue-500" : "bg-orange-500"}`} />
              {name}
              <Badge variant="secondary" className="ml-auto text-xs">
                {lineup.filter((e) => e.slot === "STARTER").length} + {lineup.filter((e) => e.slot === "SUBSTITUTE").length}
              </Badge>
            </h3>

            {roster.length === 0 && !teamId ? (
              <p className="text-sm text-muted-foreground italic">
                {cs ? "Hostující tým nemá soupisku." : "Guest team has no roster."}
              </p>
            ) : roster.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {cs ? "Soupiska je prázdná." : "Roster is empty."}
              </p>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-muted-foreground font-semibold w-8">#</th>
                      <th className="px-3 py-2 text-left text-xs text-muted-foreground font-semibold">{cs ? "Hráč" : "Player"}</th>
                      <th className="px-2 py-2 text-center text-xs text-muted-foreground font-semibold w-20">{cs ? "Dres" : "Shirt"}</th>
                      <th className="px-2 py-2 text-center text-xs text-muted-foreground font-semibold w-20">{cs ? "Základ" : "Starter"}</th>
                      <th className="px-2 py-2 text-center text-xs text-muted-foreground font-semibold w-20">{cs ? "Náhr." : "Sub"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {roster.map((player) => {
                      const entry = lineup.find((e) => entryKey(e) === player.id);
                      const isStarter = entry?.slot === "STARTER";
                      const isSub = entry?.slot === "SUBSTITUTE";
                      return (
                        <tr key={player.id} className={`transition-colors ${entry ? (isStarter ? "bg-blue-50/60 dark:bg-blue-950/30" : "bg-yellow-50/60 dark:bg-yellow-950/20") : "hover:bg-muted/30"}`}>
                          <td className="px-3 py-2 text-muted-foreground text-xs tabular-nums">
                            {player.number != null ? `#${player.number}` : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium leading-tight">{player.name}</p>
                            {player.position && (
                              <p className="text-xs text-muted-foreground">{posLabel(player.position)}</p>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {entry ? (
                              <Input
                                type="number"
                                min={0}
                                max={99}
                                value={entry.shirtNumber ?? ""}
                                onChange={(e) => updateShirt(side, player.id, e.target.value)}
                                disabled={locked}
                                className="w-14 h-7 text-center text-xs mx-auto"
                              />
                            ) : <span className="text-muted-foreground/40">—</span>}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              onClick={() => !locked && togglePlayer(side, player, "STARTER", isGuestSide)}
                              disabled={locked}
                              className={`inline-flex items-center justify-center size-7 rounded-lg border transition-colors ${
                                isStarter
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-input hover:bg-muted text-muted-foreground"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                              title={cs ? "Základní sestava" : "Starter"}
                            >
                              <UserPlus className="size-3.5" />
                            </button>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              onClick={() => !locked && togglePlayer(side, player, "SUBSTITUTE", isGuestSide)}
                              disabled={locked}
                              className={`inline-flex items-center justify-center size-7 rounded-lg border transition-colors ${
                                isSub
                                  ? "bg-yellow-500 border-yellow-500 text-white"
                                  : "border-input hover:bg-muted text-muted-foreground"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                              title={cs ? "Náhradník" : "Substitute"}
                            >
                              <UserMinus className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {!locked && (
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {cs ? "Uložit nominaci" : "Save lineup"}
        </Button>
      )}
    </div>
  );
}
