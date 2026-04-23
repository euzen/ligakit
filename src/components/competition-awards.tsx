"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Trophy, Plus, Trash2, Loader2, Star, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StandingRow, GroupStandings } from "@/lib/standings";

const AWARD_ICONS = [
  { key: "⚽", label: "Fotbal" },
  { key: "🏀", label: "Basketbal" },
  { key: "🏐", label: "Volejbal" },
  { key: "🏒", label: "Hokej" },
  { key: "🎾", label: "Tenis" },
  { key: "🏸", label: "Badminton" },
  { key: "🥊", label: "Box" },
  { key: "🏆", label: "Pohár" },
  { key: "🥇", label: "Zlato" },
  { key: "🥈", label: "Stříbro" },
  { key: "🥉", label: "Bronz" },
  { key: "🎖️", label: "Medaile" },
  { key: "⭐", label: "Hvězda" },
  { key: "🌟", label: "Záře" },
  { key: "🔥", label: "Oheň" },
  { key: "⚡", label: "Blesk" },
  { key: "👑", label: "Koruna" },
  { key: "🎯", label: "Terč" },
  { key: "💪", label: "Síla" },
  { key: "🦁", label: "Lev" },
  { key: "🦅", label: "Orel" },
  { key: "🐉", label: "Drak" },
  { key: "🛡️", label: "Štít" },
  { key: "⚔️", label: "Meče" },
  { key: "🎗️", label: "Stuha" },
  { key: "📣", label: "Megafon" },
  { key: "🤝", label: "Fair play" },
  { key: "😤", label: "Bojovník" },
];

interface Award {
  id: string;
  title: string;
  recipientName: string;
  icon: string | null;
  playerId: string | null;
  sortOrder: number;
  player: { id: string; name: string; number: number | null } | null;
}

interface TeamPlayer {
  id: string;
  name: string;
  number: number | null;
  teamName: string;
}

interface PodiumEntry {
  position: 1 | 2 | 3;
  name: string;
}

interface Props {
  competitionId: string;
  competitionType: string;
  canManage: boolean;
  locale: string;
  standings: StandingRow[] | null;
  groupStandings: GroupStandings[] | null;
  /** bracket matches for determining TOURNAMENT/CUP podium */
  bracketWinner?: string | null;
  bracketRunnerUp?: string | null;
  bracketThird?: string | null;
  /** players from all teams in this competition */
  players: TeamPlayer[];
}

const POSITION_ICONS = ["🥇", "🥈", "🥉"];
const POSITION_COLORS = [
  "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10",
  "border-slate-300 bg-slate-50 dark:bg-slate-900/10",
  "border-amber-700/50 bg-amber-50 dark:bg-amber-900/10",
];

export function CompetitionAwards({
  competitionId,
  competitionType,
  canManage,
  locale,
  standings,
  groupStandings,
  bracketWinner,
  bracketRunnerUp,
  bracketThird,
  players,
}: Props) {
  const cs = locale === "cs";
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New award form state
  const [title, setTitle] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>("⭐");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [playerSearch, setPlayerSearch] = useState("");
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`/api/competitions/${competitionId}/awards`)
      .then(r => r.json())
      .then(data => { setAwards(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [competitionId]);

  // Compute podium from standings or bracket
  const podium = useMemo<PodiumEntry[]>(() => {
    if (competitionType === "LEAGUE" && standings && standings.length > 0) {
      return standings.slice(0, 3).map((row, i) => ({
        position: (i + 1) as 1 | 2 | 3,
        name: row.teamName,
      }));
    }
    if ((competitionType === "TOURNAMENT" || competitionType === "CUP")) {
      const result: PodiumEntry[] = [];
      if (bracketWinner) result.push({ position: 1, name: bracketWinner });
      if (bracketRunnerUp) result.push({ position: 2, name: bracketRunnerUp });
      if (bracketThird) result.push({ position: 3, name: bracketThird });
      return result;
    }
    if (groupStandings && groupStandings.length > 0) {
      return groupStandings[0].rows.slice(0, 3).map((row, i) => ({
        position: (i + 1) as 1 | 2 | 3,
        name: row.teamName,
      }));
    }
    return [];
  }, [competitionType, standings, groupStandings, bracketWinner, bracketRunnerUp, bracketThird]);

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.toLowerCase();
    return players.filter(p =>
      p.name.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [players, playerSearch]);

  const handleSelectPlayer = (p: TeamPlayer) => {
    setSelectedPlayerId(p.id);
    setRecipientName(p.name);
    setPlayerSearch(p.name);
    setShowPlayerDropdown(false);
  };

  const handleSaveAward = async () => {
    if (!title.trim() || !recipientName.trim()) {
      toast.error(cs ? "Vyplňte název ocenění a příjemce" : "Fill in the award title and recipient");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/awards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          recipientName: recipientName.trim(),
          icon: selectedIcon,
          playerId: selectedPlayerId,
          sortOrder: awards.length,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error === "DB_ERROR" ? `DB: ${err.detail}` : (err.error || "FAILED"));
      }
      const award = await res.json();
      console.log("[Awards] created:", award);
      setAwards(prev => [...prev, award]);
      setTitle("");
      setRecipientName("");
      setSelectedIcon("⭐");
      setSelectedPlayerId(null);
      setPlayerSearch("");
      setShowForm(false);
      toast.success(cs ? "Ocenění přidáno" : "Award added");
    } catch (e) {
      console.error("[Awards] save error:", e);
      const msg = e instanceof Error ? e.message : "";
      toast.error(msg === "Forbidden"
        ? (cs ? "Nemáš oprávnění" : "Not authorized")
        : msg === "MISSING_FIELDS"
        ? (cs ? "Vyplňte název i příjemce" : "Fill in title and recipient")
        : (cs ? "Chyba při ukládání" : "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (awardId: string) => {
    setDeletingId(awardId);
    try {
      await fetch(`/api/competitions/${competitionId}/awards/${awardId}`, { method: "DELETE" });
      setAwards(prev => prev.filter(a => a.id !== awardId));
      toast.success(cs ? "Ocenění smazáno" : "Award deleted");
    } catch {
      toast.error(cs ? "Chyba při mazání" : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Podium */}
      {podium.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Background gradient header */}
            <div className="relative bg-gradient-to-b from-primary/10 to-transparent pt-6 pb-0 px-4">
              <div className="flex items-center gap-2 mb-4 justify-center">
                <Trophy className="size-5 text-yellow-500" />
                <span className="font-semibold text-sm">{cs ? "Vyhlášení výsledků" : "Final Results"}</span>
              </div>

              {/* Podium stage */}
              <div className="flex items-end justify-center gap-2 sm:gap-4">
                {/* 2nd place */}
                {podium[1] ? (
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                    <div className="text-2xl">🥈</div>
                    <div className="text-center">
                      <p className="font-bold text-sm leading-tight">{podium[1].name}</p>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-t-lg h-16 flex items-center justify-center">
                      <span className="text-2xl font-black text-slate-400 dark:text-slate-500">2</span>
                    </div>
                  </div>
                ) : <div className="flex-1 max-w-[140px]" />}

                {/* 1st place */}
                {podium[0] ? (
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[160px]">
                    <div className="size-14 rounded-full bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center text-3xl shadow-lg shadow-yellow-400/20">
                      🏆
                    </div>
                    <div className="text-center">
                      <p className="font-black text-base leading-tight">{podium[0].name}</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">{cs ? "Vítěz" : "Winner"}</p>
                    </div>
                    <div className="w-full bg-yellow-400 rounded-t-lg h-24 flex items-center justify-center">
                      <span className="text-3xl font-black text-yellow-700">1</span>
                    </div>
                  </div>
                ) : <div className="flex-1 max-w-[160px]" />}

                {/* 3rd place */}
                {podium[2] ? (
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                    <div className="text-2xl">🥉</div>
                    <div className="text-center">
                      <p className="font-bold text-sm leading-tight">{podium[2].name}</p>
                    </div>
                    <div className="w-full bg-amber-700/30 dark:bg-amber-800/40 rounded-t-lg h-10 flex items-center justify-center">
                      <span className="text-xl font-black text-amber-700/60">3</span>
                    </div>
                  </div>
                ) : <div className="flex-1 max-w-[140px]" />}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Awards */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="size-4 text-primary" />
            {cs ? "Individuální ocenění" : "Individual Awards"}
          </CardTitle>
          {canManage && !showForm && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="size-4" />
              {cs ? "Přidat" : "Add"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add form */}
          {canManage && showForm && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4 mb-2">
              {/* Icon picker */}
              <div className="space-y-2">
                <Label className="text-xs">{cs ? "Ikona ocenění" : "Award icon"}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {AWARD_ICONS.map(ic => (
                    <button
                      key={ic.key}
                      type="button"
                      title={ic.label}
                      onClick={() => setSelectedIcon(ic.key)}
                      className={`size-9 rounded-lg text-lg flex items-center justify-center transition-all border-2 ${
                        selectedIcon === ic.key
                          ? "border-primary bg-primary/10 scale-110 shadow-sm"
                          : "border-transparent hover:border-muted-foreground/30 hover:bg-muted"
                      }`}
                    >
                      {ic.key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{cs ? "Název ocenění" : "Award title"}</Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={cs ? "např. Nejlepší střelec" : "e.g. Top Scorer"}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5 relative">
                  <Label className="text-xs">{cs ? "Příjemce" : "Recipient"}</Label>
                  <div className="relative">
                    <Input
                      value={recipientName}
                      onChange={e => {
                        setRecipientName(e.target.value);
                        setPlayerSearch(e.target.value);
                        setSelectedPlayerId(null);
                        if (players.length > 0) setShowPlayerDropdown(true);
                      }}
                      onFocus={() => players.length > 0 && setShowPlayerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowPlayerDropdown(false), 150)}
                      placeholder={cs ? "Jméno hráče nebo týmu" : "Player or team name"}
                      className="h-8 text-sm"
                    />
                    {players.length > 0 && showPlayerDropdown && filteredPlayers.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredPlayers.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2"
                            onMouseDown={() => handleSelectPlayer(p)}
                          >
                            <span>{p.name}</span>
                            <span className="text-xs text-muted-foreground">{p.teamName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview */}
              {title && recipientName && (
                <div className="rounded-lg border bg-background p-3 flex items-center gap-3">
                  <span className="text-2xl">{selectedIcon}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">{title}</p>
                    <p className="font-semibold text-sm">{recipientName}</p>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">{cs ? "náhled" : "preview"}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveAward} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  {cs ? "Uložit" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setTitle(""); setRecipientName(""); setSelectedPlayerId(null); setPlayerSearch(""); setSelectedIcon("⭐"); }}>
                  {cs ? "Zrušit" : "Cancel"}
                </Button>
              </div>
            </div>
          )}

          {/* Awards list */}
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : awards.length === 0 ? (
            <div className="text-center py-8">
              <Star className="size-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {cs ? "Zatím žádná individuální ocenění" : "No individual awards yet"}
              </p>
              {canManage && !showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  {cs ? "Přidat první ocenění →" : "Add first award →"}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {awards.map(award => {
                const icon = award.icon && award.icon.trim() !== "" ? award.icon : "⭐";
                return (
                  <div
                    key={award.id}
                    className="group relative flex items-center gap-4 rounded-xl border bg-gradient-to-br from-muted/40 to-muted/10 px-4 py-4 hover:border-primary/30 transition-colors"
                  >
                    {/* Icon circle */}
                    <div className="size-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl shrink-0 shadow-sm">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{award.title}</p>
                      <p className="font-bold text-base truncate mt-0.5">{award.recipientName}</p>
                      {award.player && (
                        <span className="text-xs text-primary/70">ze soupisu</span>
                      )}
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleDelete(award.id)}
                        disabled={deletingId === award.id}
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 size-6 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      >
                        {deletingId === award.id
                          ? <Loader2 className="size-3 animate-spin" />
                          : <Trash2 className="size-3" />
                        }
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
