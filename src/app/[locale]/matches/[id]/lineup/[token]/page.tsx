"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
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

export default function LineupTokenPage() {
  const params = useParams();
  const matchId = params.id as string;
  const token = params.token as string;
  const locale = params.locale as string;
  const cs = locale === "cs";

  const [teamName, setTeamName] = useState<string>("");
  const [teamSide, setTeamSide] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [lineup, setLineup] = useState<LineupEntry[]>([]);
  const [matchState, setMatchState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const locked = matchState === "LIVE" || matchState === "FINISHED" || matchState === "PAUSED";

  const fetchData = useCallback(async () => {
    const [liveRes, lineupRes] = await Promise.all([
      fetch(`/api/matches/${matchId}/live`),
      fetch(`/api/matches/${matchId}/lineup?token=${token}`),
    ]);

    if (!liveRes.ok || !lineupRes.ok) {
      setInvalid(true);
      setLoading(false);
      return;
    }

    const live = await liveRes.json();
    const lineupJson = await lineupRes.json();
    const lineupData: MatchPlayerRecord[] = lineupJson.players ?? [];

    setMatchState(live.matchState);

    // Resolve which side this token belongs to by checking lineupData or live match
    // We'll derive it from the token via a dedicated endpoint
    const tokenRes = await fetch(`/api/matches/${matchId}/lineup-token/resolve?token=${token}`);
    if (!tokenRes.ok) { setInvalid(true); setLoading(false); return; }
    const { side, teamId: tid, isGuest: guest, guestPlayers } = await tokenRes.json();
    setTeamSide(side);
    setTeamId(tid);
    setIsGuest(guest);

    const name = side === "HOME"
      ? (live.homeTeam?.name ?? live.homeTeamName ?? (cs ? "Domácí" : "Home"))
      : (live.awayTeam?.name ?? live.awayTeamName ?? (cs ? "Hosté" : "Away"));
    setTeamName(name);

    if (guest) {
      setRoster(guestPlayers ?? []);
    } else if (tid) {
      const rosterRes = await fetch(`/api/teams/${tid}/players`);
      if (rosterRes.ok) setRoster(await rosterRes.json());
    }

    const myLineup = lineupData
      .filter((mp) => mp.teamSide === side)
      .map((mp) => ({
        playerId: mp.playerId ?? undefined,
        guestPlayerId: mp.guestPlayerId ?? undefined,
        slot: mp.slot,
        shirtNumber: mp.shirtNumber,
      }));
    setLineup(myLineup);
    setLoading(false);
  }, [matchId, token, cs]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const posLabel = (pos: RosterPlayer["position"]) => {
    if (!pos) return "";
    return (cs ? pos.labelCs : pos.labelEn) || pos.name;
  };

  const entryKey = (e: LineupEntry) => e.guestPlayerId ?? e.playerId ?? "";
  const playerKey = (player: RosterPlayer) => player.id;

  const togglePlayer = (player: RosterPlayer, slot: "STARTER" | "SUBSTITUTE") => {
    const key = playerKey(player);
    const existing = lineup.find((e) => entryKey(e) === key);
    const newEntry: LineupEntry = isGuest
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

  const updateShirt = (playerId: string, val: string) => {
    setLineup((prev) => prev.map((e) => entryKey(e) === playerId
      ? { ...e, shirtNumber: val === "" ? null : Number(val) }
      : e,
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { token };
      if (teamSide === "HOME") body.home = lineup;
      else body.away = lineup;

      const res = await fetch(`/api/matches/${matchId}/lineup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(cs ? "Nominace uložena ✓" : "Lineup saved ✓");
      } else {
        const data = await res.json();
        if (data.error === "MATCH_ALREADY_STARTED") {
          toast.error(cs ? "Zápas již byl spuštěn, nominaci nelze měnit." : "Match already started.");
        } else {
          toast.error(data.error ?? "Error");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <p className="text-4xl">⛔</p>
          <p className="font-semibold">{cs ? "Neplatný nebo expirovaný odkaz" : "Invalid or expired link"}</p>
          <p className="text-sm text-muted-foreground">{cs ? "Požádejte organizátora o nový odkaz." : "Ask the organizer for a new link."}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" />
        {cs ? "Načítání…" : "Loading…"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto space-y-5">
      <div className="text-center space-y-1 pt-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          {cs ? "Nominace – " : "Lineup – "}{teamName}
        </p>
        <h1 className="text-xl font-bold">{teamName}</h1>
        <Badge variant="secondary">
          {lineup.filter((e) => e.slot === "STARTER").length} {cs ? "základní" : "starters"} · {lineup.filter((e) => e.slot === "SUBSTITUTE").length} {cs ? "náhradníků" : "subs"}
        </Badge>
      </div>

      {locked && (
        <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <Lock className="size-4 shrink-0" />
          {cs ? "Zápas byl spuštěn – nominace je uzamčena." : "Match started – lineup is locked."}
        </div>
      )}

      {roster.length === 0 && !teamId && !isGuest ? (
        <p className="text-center text-muted-foreground text-sm italic">
          {cs ? "Tento tým nemá soupisku." : "This team has no roster."}
        </p>
      ) : roster.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm italic">
          {cs ? "Soupiska je prázdná." : "Roster is empty."}
        </p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-semibold w-10">#</th>
                <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-semibold">{cs ? "Hráč" : "Player"}</th>
                <th className="px-2 py-2.5 text-center text-xs text-muted-foreground font-semibold w-16">{cs ? "Dres" : "Shirt"}</th>
                <th className="px-2 py-2.5 text-center text-xs text-muted-foreground font-semibold w-16">{cs ? "Základ" : "Start"}</th>
                <th className="px-2 py-2.5 text-center text-xs text-muted-foreground font-semibold w-16">{cs ? "Náhr." : "Sub"}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {roster.map((player) => {
                const entry = lineup.find((e) => entryKey(e) === player.id);
                const isStarter = entry?.slot === "STARTER";
                const isSub = entry?.slot === "SUBSTITUTE";
                return (
                  <tr key={player.id} className={`transition-colors ${isStarter ? "bg-blue-50/60 dark:bg-blue-950/30" : isSub ? "bg-yellow-50/60 dark:bg-yellow-950/20" : "hover:bg-muted/30"}`}>
                    <td className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">
                      {player.number != null ? `#${player.number}` : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium leading-tight">{player.name}</p>
                      {player.position && (
                        <p className="text-xs text-muted-foreground">{posLabel(player.position)}</p>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {entry ? (
                        <Input
                          type="number" min={0} max={99}
                          value={entry.shirtNumber ?? ""}
                          onChange={(e) => updateShirt(player.id, e.target.value)}
                          disabled={locked}
                          className="w-14 h-7 text-center text-xs mx-auto"
                        />
                      ) : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        onClick={() => !locked && togglePlayer(player, "STARTER")}
                        disabled={locked}
                        className={`inline-flex items-center justify-center size-8 rounded-lg border transition-colors ${isStarter ? "bg-blue-600 border-blue-600 text-white" : "border-input hover:bg-muted text-muted-foreground"} disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <UserPlus className="size-3.5" />
                      </button>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        onClick={() => !locked && togglePlayer(player, "SUBSTITUTE")}
                        disabled={locked}
                        className={`inline-flex items-center justify-center size-8 rounded-lg border transition-colors ${isSub ? "bg-yellow-500 border-yellow-500 text-white" : "border-input hover:bg-muted text-muted-foreground"} disabled:opacity-40 disabled:cursor-not-allowed`}
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

      {!locked && (
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2 sticky bottom-4">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {cs ? "Uložit nominaci" : "Save lineup"}
        </Button>
      )}
    </div>
  );
}
