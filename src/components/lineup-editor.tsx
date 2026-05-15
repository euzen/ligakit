"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, UserMinus, Save, Lock, LayoutGrid } from "lucide-react";
import { FORMATIONS, getFormation, type Formation } from "@/lib/formations";
import { TacticalPitch } from "@/components/tactical/tactical-pitch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  
  // Formation state
  const [homeFormation, setHomeFormation] = useState<string>("no-formation");
  const [awayFormation, setAwayFormation] = useState<string>("no-formation");
  const [homePositions, setHomePositions] = useState<Array<{playerId?: string; guestPlayerId?: string; positionIndex: number; name: string; number: number | null}>>([]);
  const [awayPositions, setAwayPositions] = useState<Array<{playerId?: string; guestPlayerId?: string; positionIndex: number; name: string; number: number | null}>>([]);
  
  // Active side and position for assignment
  const [activeSide, setActiveSide] = useState<"home" | "away" | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  
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
        const data = await lineupRes.json() as {
          players: MatchPlayerRecord[];
          formations: { home: string | null; away: string | null };
          positions: { home: Array<{playerId?: string; guestPlayerId?: string; positionIndex: number; name: string; number: number | null}>; away: Array<{playerId?: string; guestPlayerId?: string; positionIndex: number; name: string; number: number | null}> };
        };
        setHomeLineup(data.players.filter((p) => p.teamSide === "HOME").map((p) => ({
          playerId: p.playerId ?? undefined,
          guestPlayerId: p.guestPlayerId ?? undefined,
          slot: p.slot, shirtNumber: p.shirtNumber,
        })));
        setAwayLineup(data.players.filter((p) => p.teamSide === "AWAY").map((p) => ({
          playerId: p.playerId ?? undefined,
          guestPlayerId: p.guestPlayerId ?? undefined,
          slot: p.slot, shirtNumber: p.shirtNumber,
        })));
        // Load formations and positions
        setHomeFormation(data.formations.home || "no-formation");
        setAwayFormation(data.formations.away || "no-formation");
        setHomePositions(data.positions.home ?? []);
        setAwayPositions(data.positions.away ?? []);
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
      // Strip UI-only fields (name, number) from positions before sending to API
      const stripPositionFields = (pos: typeof homePositions[0]) => ({
        positionIndex: pos.positionIndex,
        playerId: pos.playerId,
        guestPlayerId: pos.guestPlayerId,
      });

      const res = await fetch(`/api/matches/${matchId}/lineup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          home: homeLineup,
          away: awayLineup,
          homeFormation: homeFormation === "no-formation" ? null : homeFormation,
          awayFormation: awayFormation === "no-formation" ? null : awayFormation,
          homePositions: homePositions.length > 0 ? homePositions.map(stripPositionFields) : null,
          awayPositions: awayPositions.length > 0 ? awayPositions.map(stripPositionFields) : null,
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({ success: true }));
        toast.success(cs ? "Nominace a formace uloženy" : "Lineup and formations saved");
        // Update local state with saved data
        if (data.formations) {
          setHomeFormation(data.formations.home || "no-formation");
          setAwayFormation(data.formations.away || "no-formation");
        }
        if (data.positions) {
          setHomePositions(data.positions.home ?? []);
          setAwayPositions(data.positions.away ?? []);
        }
      } else {
        let errorMsg = cs ? "Chyba při ukládání" : "Error saving";
        try {
          const data = await res.json();
          if (data.error === "MATCH_ALREADY_STARTED") {
            errorMsg = cs ? "Zápas již byl spuštěn, nelze měnit nominaci" : "Match already started";
          } else if (data.error) {
            errorMsg = data.error;
          }
        } catch {
          // JSON parse error, use default message
        }
        toast.error(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  // Formation helpers
  const getFormationForSide = (side: "home" | "away") => side === "home" ? homeFormation : awayFormation;
  const getSetFormationForSide = (side: "home" | "away") => side === "home" ? setHomeFormation : setAwayFormation;
  const getPositionsForSide = (side: "home" | "away") => side === "home" ? homePositions : awayPositions;
  const getSetPositionsForSide = (side: "home" | "away") => side === "home" ? setHomePositions : setAwayPositions;
  const getRosterForSide = (side: "home" | "away") => side === "home" ? homeRoster : awayRoster;
  const getLineupForSide = (side: "home" | "away") => side === "home" ? homeLineup : awayLineup;

  const handleFormationChange = (side: "home" | "away", formationKey: string) => {
    const setFormation = getSetFormationForSide(side);
    const setPositions = getSetPositionsForSide(side);
    setFormation(formationKey || "no-formation");
    // Clear positions when formation changes (only if actually changed to a different formation)
    if (formationKey && formationKey !== "no-formation") {
      setPositions([]);
    }
  };

  const handlePositionClick = (side: "home" | "away", positionIndex: number) => {
    if (locked) return;
    setActiveSide(side);
    setSelectedPosition(positionIndex);
  };

  const assignPlayerToPosition = (side: "home" | "away", player: RosterPlayer, isGuestSide: boolean) => {
    if (selectedPosition === null || activeSide !== side) return;
    
    const positions = getPositionsForSide(side);
    const setPositions = getSetPositionsForSide(side);
    const playerId = isGuestSide ? player.id : player.id;
    const guestPlayerId = isGuestSide ? player.id : undefined;
    
    // Remove player from other positions first
    const filtered = positions.filter((p) => 
      (isGuestSide ? p.guestPlayerId !== guestPlayerId : p.playerId !== playerId)
    );
    
    // Add to selected position
    setPositions([
      ...filtered,
      {
        positionIndex: selectedPosition,
        playerId: isGuestSide ? undefined : playerId,
        guestPlayerId: isGuestSide ? guestPlayerId : undefined,
        name: player.name,
        number: player.number,
      },
    ]);
    
    // Also add to lineup as starter if not already
    const lineup = getLineupForSide(side);
    const setLineup = side === "home" ? setHomeLineup : setAwayLineup;
    const existing = lineup.find((e) => entryKey(e) === player.id);
    if (!existing) {
      setLineup([...lineup, {
        playerId: isGuestSide ? undefined : player.id,
        guestPlayerId: isGuestSide ? player.id : undefined,
        slot: "STARTER",
        shirtNumber: player.number,
      }]);
    }
    
    setSelectedPosition(null);
    toast.success(cs ? `${player.name} přiřazen na pozici` : `${player.name} assigned to position`);
  };

  const removePlayerFromPosition = (side: "home" | "away", positionIndex: number) => {
    const positions = getPositionsForSide(side);
    const setPositions = getSetPositionsForSide(side);
    setPositions(positions.filter((p) => p.positionIndex !== positionIndex));
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

      {/* Formation Editor */}
      <div className="grid lg:grid-cols-2 gap-6">
        {(["home", "away"] as const).map((side) => {
          const name = side === "home" ? homeName : awayName;
          const roster = getRosterForSide(side);
          const teamId = side === "home" ? homeTeamId : awayTeamId;
          const isGuestSide = !teamId;
          const formation = getFormationForSide(side);
          const formationObj = getFormation(formation);
          const positions = getPositionsForSide(side);
          const lineup = getLineupForSide(side);
          const isActive = activeSide === side;

          return (
            <div key={side} className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${side === "home" ? "bg-blue-500" : "bg-orange-500"}`} />
                  {name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {lineup.filter((e) => e.slot === "STARTER").length} + {lineup.filter((e) => e.slot === "SUBSTITUTE").length}
                  </Badge>
                </h3>
              </div>

              {/* Formation Selector */}
              <div className="flex items-center gap-2">
                <LayoutGrid className="size-4 text-muted-foreground" />
                <Select
                  value={formation}
                  onValueChange={(v) => handleFormationChange(side, v || "no-formation")}
                  disabled={locked}
                >
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-formation">{cs ? "Bez formace" : "No formation"}</SelectItem>
                    {FORMATIONS.map((f) => (
                      <SelectItem key={f.key} value={f.key}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formation !== "no-formation" && formationObj && (
                  <span className="text-xs text-muted-foreground">
                    {formationObj.positions.length} {cs ? "hráčů" : "players"}
                  </span>
                )}
              </div>

              {roster.length === 0 && !teamId ? (
                <p className="text-sm text-muted-foreground italic">
                  {cs ? "Hostující tým nemá soupisku." : "Guest team has no roster."}
                </p>
              ) : roster.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  {cs ? "Soupiska je prázdná." : "Roster is empty."}
                </p>
              ) : (
                <>
                  {/* Tactical Pitch */}
                  {formationObj && (
                    <div className={`rounded-xl border p-3 ${isActive ? "ring-2 ring-primary" : ""}`}>
                      <p className="text-xs text-muted-foreground mb-2">
                        {cs 
                          ? (selectedPosition !== null && isActive 
                            ? `Klikni na hráče pro přiřazení na pozici ${formationObj.positions[selectedPosition]?.label || ""}` 
                            : "Klikni na pozici pro výběr, pak na hráče pro přiřazení")
                          : (selectedPosition !== null && isActive
                            ? `Click a player to assign to position ${formationObj.positions[selectedPosition]?.label || ""}`
                            : "Click a position to select, then click a player to assign")
                        }
                      </p>
                      <TacticalPitch
                        formation={formationObj}
                        side={side}
                        selectedPlayers={positions.map((p) => ({
                          positionIndex: p.positionIndex,
                          playerId: p.playerId,
                          name: p.name,
                          number: p.number,
                        }))}
                        onPositionClick={!locked ? (idx) => handlePositionClick(side, idx) : undefined}
                        readonly={locked}
                      />
                    </div>
                  )}

                  {/* Player Assignment List */}
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-muted-foreground font-semibold w-8">#</th>
                          <th className="px-3 py-2 text-left text-xs text-muted-foreground font-semibold">{cs ? "Hráč" : "Player"}</th>
                          <th className="px-2 py-2 text-center text-xs text-muted-foreground font-semibold w-20">{cs ? "Dres" : "Shirt"}</th>
                          <th className="px-2 py-2 text-center text-xs text-muted-foreground font-semibold w-16">{cs ? "Pozice" : "Pos"}</th>
                          <th className="px-2 py-2 text-center text-xs text-muted-foreground font-semibold w-20">{cs ? "Status" : "Status"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {roster.map((player) => {
                          const entry = lineup.find((e) => entryKey(e) === player.id);
                          const isStarter = entry?.slot === "STARTER";
                          const isSub = entry?.slot === "SUBSTITUTE";
                          const assignedPos = positions.find((p) => 
                            isGuestSide ? p.guestPlayerId === player.id : p.playerId === player.id
                          );
                          const canAssign = isActive && selectedPosition !== null && !locked && isStarter;

                          return (
                            <tr 
                              key={player.id} 
                              className={`transition-colors ${
                                entry ? (isStarter ? "bg-blue-50/60 dark:bg-blue-950/30" : "bg-yellow-50/60 dark:bg-yellow-950/20") : "hover:bg-muted/30"
                              } ${canAssign ? "cursor-pointer hover:bg-green-50/60" : ""}`}
                              onClick={() => canAssign && assignPlayerToPosition(side, player, isGuestSide)}
                            >
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
                                {assignedPos && formationObj ? (
                                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                                    {formationObj.positions[assignedPos.positionIndex]?.label || assignedPos.positionIndex + 1}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); !locked && togglePlayer(side, player, "STARTER", isGuestSide); }}
                                    disabled={locked}
                                    className={`inline-flex items-center justify-center size-6 rounded border transition-colors ${
                                      isStarter
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "border-input hover:bg-muted text-muted-foreground"
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                    title={cs ? "Základní sestava" : "Starter"}
                                  >
                                    <UserPlus className="size-3" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); !locked && togglePlayer(side, player, "SUBSTITUTE", isGuestSide); }}
                                    disabled={locked}
                                    className={`inline-flex items-center justify-center size-6 rounded border transition-colors ${
                                      isSub
                                        ? "bg-yellow-500 border-yellow-500 text-white"
                                        : "border-input hover:bg-muted text-muted-foreground"
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                    title={cs ? "Náhradník" : "Substitute"}
                                  >
                                    <UserMinus className="size-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {!locked && (
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {cs ? "Uložit nominaci a formace" : "Save lineup and formations"}
        </Button>
      )}
    </div>
  );
}
