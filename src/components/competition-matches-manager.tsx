"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Pencil, Trash2, Plus, Check, X, Loader2, Calendar, Tv } from "lucide-react";

function toLocalDatetimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Team { id: string; name: string; logoUrl: string | null }

/** A "slot" entry shown in the team selectors — either a real Team or a guest name entry */
interface TeamSlot {
  /** real Team id, or "" for guest entries */
  id: string;
  name: string;
  isGuest: boolean;
}

interface Match {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore: number | null;
  awayScore: number | null;
  status: "SCHEDULED" | "PLAYED" | "CANCELLED";
  scheduledAt: Date | null;
  round: number | null;
  note: string | null;
}

interface CompetitionMatchesManagerProps {
  competitionId: string;
  initialMatches: Match[];
  /** System teams registered to the competition */
  teams: Team[];
  /** Guest team names registered to the competition */
  guestTeamNames: string[];
  canManage: boolean;
  isTournament?: boolean;
  locale: string;
}

function resolveTeamName(m: Match, side: "home" | "away"): string {
  if (side === "home") return m.homeTeam?.name ?? m.homeTeamName ?? "?";
  return m.awayTeam?.name ?? m.awayTeamName ?? "?";
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  SCHEDULED: "secondary",
  PLAYED: "default",
  CANCELLED: "destructive",
};

export function CompetitionMatchesManager({
  competitionId,
  initialMatches,
  teams,
  guestTeamNames,
  canManage,
  isTournament = false,
  locale,
}: CompetitionMatchesManagerProps) {
  const t = useTranslations("competitions");
  const isCS = locale === "cs";
  const router = useRouter();

  // Build unified slot list: system teams first, then guests
  const slots: TeamSlot[] = [
    ...teams.map((t) => ({ id: t.id, name: t.name, isGuest: false })),
    ...guestTeamNames.map((name) => ({ id: `guest:${name}`, name, isGuest: true })),
  ];

  const [matches, setMatches] = useState(initialMatches);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Filters
  const [filterRound, setFilterRound] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Bulk date
  const [bulkDate, setBulkDate] = useState("");
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const allRounds = [...new Set(matches.map((m) => m.round ?? 0))].sort((a, b) => a - b);

  const filteredMatches = matches.filter((m) => {
    if (filterRound !== "all" && String(m.round ?? 0) !== filterRound) return false;
    if (filterStatus !== "all" && m.status !== filterStatus) return false;
    return true;
  });

  const handleBulkDate = async () => {
    if (!bulkDate || filterRound === "all") return;
    const roundMatches = filteredMatches.filter((m) => String(m.round ?? 0) === filterRound);
    setIsBulkSaving(true);
    try {
      await Promise.all(
        roundMatches.map((m) =>
          fetch(`/api/competitions/${competitionId}/matches/${m.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scheduledAt: bulkDate }),
          }),
        ),
      );
      setMatches((prev) =>
        prev.map((m) =>
          String(m.round ?? 0) === filterRound
            ? { ...m, scheduledAt: new Date(bulkDate) }
            : m,
        ),
      );
      toast.success(isCS ? "Datum nastaveno pro celé kolo" : "Date set for entire round");
      setBulkDate("");
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Add form
  const [addHome, setAddHome] = useState("");
  const [addAway, setAddAway] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addRound, setAddRound] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Edit form
  const [editHome, setEditHome] = useState("");
  const [editAway, setEditAway] = useState("");
  const [editStatus, setEditStatus] = useState<string>("SCHEDULED");
  const [editDate, setEditDate] = useState("");
  const [editRound, setEditRound] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (m: Match) => {
    setEditingId(m.id);
    setEditHome(m.homeScore !== null ? String(m.homeScore) : "");
    setEditAway(m.awayScore !== null ? String(m.awayScore) : "");
    setEditStatus(m.status);
    setEditDate(m.scheduledAt ? toLocalDatetimeInput(new Date(m.scheduledAt)) : "");
    setEditRound(m.round !== null ? String(m.round) : "");
  };

  const slotToPayload = (slotId: string) => {
    if (slotId.startsWith("guest:")) return { teamName: slotId.slice(6) };
    return { teamId: slotId };
  };

  const handleAdd = async () => {
    if (!addHome || !addAway) return;
    setIsAdding(true);
    const homePayload = slotToPayload(addHome);
    const awayPayload = slotToPayload(addAway);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeamId: homePayload.teamId ?? null,
          awayTeamId: awayPayload.teamId ?? null,
          homeTeamName: homePayload.teamName ?? null,
          awayTeamName: awayPayload.teamName ?? null,
          scheduledAt: addDate || null,
          round: addRound ? Number(addRound) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setMatches((prev) => [...prev, data]);
      setAddHome(""); setAddAway(""); setAddDate(""); setAddRound("");
      setShowAddForm(false);
      toast.success(t("matchCreated"));
    } finally {
      setIsAdding(false);
    }
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/matches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore: editHome !== "" ? Number(editHome) : null,
          awayScore: editAway !== "" ? Number(editAway) : null,
          status: editStatus,
          scheduledAt: editDate || null,
          round: editRound ? Number(editRound) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      // Strip bracketResult before storing in local state
      const { bracketResult, ...matchData } = data;
      setMatches((prev) => prev.map((m) => (m.id === id ? matchData : m)));
      setEditingId(null);
      toast.success(t("matchSaved"));
      // Handle bracket slot fill
      if (bracketResult?.filled) {
        toast.success(
          isCS
            ? `${bracketResult.winner} postupuje do dalšího kola`
            : `${bracketResult.winner} advances to next round`,
          { duration: 4000 },
        );
      } else if (bracketResult?.drawWarning) {
        toast.warning(
          isCS
            ? `Remíza — nelze automaticky postoupit: ${bracketResult.drawWarning}`
            : `Draw — cannot auto-advance: ${bracketResult.drawWarning}`,
          { duration: 8000 },
        );
      } else if (bracketResult?.isFinal) {
        toast.success(
          isCS
            ? `Vítěz turnaje: ${bracketResult.winner} 🏆`
            : `Tournament winner: ${bracketResult.winner} 🏆`,
          { duration: 8000 },
        );
      }
      // Warn if bracketPos missing (old draw — needs re-draw)
      if (isTournament && bracketResult?.reason === "no_bracket_pos") {
        toast.warning(
          isCS
            ? "Pavouk nemá pozice — proveď nové losování pro automatický postup"
            : "Bracket has no positions — run a new draw for auto-advancement",
          { duration: 8000 },
        );
      }
      // Always refresh server data so standings/bracket stay up to date
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/matches/${deleteTarget}`, { method: "DELETE" });
      if (res.ok) {
        setMatches((prev) => prev.filter((m) => m.id !== deleteTarget));
        toast.success(t("matchDeleted"));
        setDeleteTarget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const fmt = (d: Date | null) => d
    ? new Date(d).toLocaleString(isCS ? "cs-CZ" : "en-US", { dateStyle: "short", timeStyle: "short" })
    : "—";

  const grouped = filteredMatches.reduce<Record<number | string, Match[]>>((acc, m) => {
    const key = m.round ?? 0;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Add button */}
      {canManage && (
        <div>
          {!showAddForm ? (
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)} className="gap-1.5">
              <Plus className="size-4" />
              {t("addMatch")}
            </Button>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t("homeTeam")}</Label>
                  <Select value={addHome} onValueChange={(v) => setAddHome(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("homeTeam")}>
                        {slots.find((s) => s.id === addHome)?.name ?? t("homeTeam")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {slots.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}{s.isGuest ? " (host)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("awayTeam")}</Label>
                  <Select value={addAway} onValueChange={(v) => setAddAway(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("awayTeam")}>
                        {slots.find((s) => s.id === addAway)?.name ?? t("awayTeam")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {slots.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}{s.isGuest ? " (host)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t("scheduledAt")}</Label>
                  <Input type="datetime-local" value={addDate} onChange={(e) => setAddDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("round")}</Label>
                  <Input type="number" min={1} value={addRound} onChange={(e) => setAddRound(e.target.value)} placeholder="1" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                  <X className="size-4" />
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={!addHome || !addAway || isAdding}>
                  {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {t("addMatch")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter bar */}
      {matches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterRound} onValueChange={(v) => setFilterRound(v ?? "all")}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue>
                {filterRound === "all"
                  ? (isCS ? "Všechna kola" : "All rounds")
                  : filterRound === "0"
                    ? (isCS ? "Bez kola" : "No round")
                    : `${isCS ? "Kolo" : "Round"} ${filterRound}`
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isCS ? "Všechna kola" : "All rounds"}</SelectItem>
              {allRounds.map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {r === 0 ? (isCS ? "Bez kola" : "No round") : `${isCS ? "Kolo" : "Round"} ${r}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue>
                {filterStatus === "all"
                  ? (isCS ? "Všechny" : "All")
                  : t(`matchStatus${filterStatus}`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isCS ? "Všechny" : "All"}</SelectItem>
              {["SCHEDULED", "PLAYED", "CANCELLED"].map((s) => (
                <SelectItem key={s} value={s}>{t(`matchStatus${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(filterRound !== "all" || filterStatus !== "all") && (
            <button
              onClick={() => { setFilterRound("all"); setFilterStatus("all"); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isCS ? "Zrušit filtr" : "Clear filter"}
            </button>
          )}
          {/* Bulk date setter — only when a specific round is selected */}
          {canManage && filterRound !== "all" && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Input
                type="datetime-local"
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
                className="h-8 text-xs w-44"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkDate}
                disabled={!bulkDate || isBulkSaving}
                className="h-8 text-xs gap-1"
              >
                {isBulkSaving ? <Loader2 className="size-3 animate-spin" /> : <Calendar className="size-3" />}
                {isCS ? "Nastavit kolu" : "Set round"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Matches */}
      {filteredMatches.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">
          {matches.length === 0 ? t("noMatches") : (isCS ? "Žádné zápasy neodpovídají filtru" : "No matches match the filter")}
        </p>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([round, roundMatches]) => (
            <div key={round}>
              {Number(round) > 0 && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {t("round")} {round}
                </p>
              )}
              <ul className="space-y-2">
                {roundMatches.map((m) => (
                  <li key={m.id} className="rounded-lg border bg-card overflow-hidden">
                    {editingId === m.id ? (
                      <div className="p-3 space-y-3">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                          <span className="text-sm font-medium truncate">{resolveTeamName(m, "home")}</span>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number" min={0} value={editHome}
                              onChange={(e) => setEditHome(e.target.value)}
                              className="w-14 text-center h-8" placeholder="0"
                            />
                            <span className="text-muted-foreground">:</span>
                            <Input
                              type="number" min={0} value={editAway}
                              onChange={(e) => setEditAway(e.target.value)}
                              className="w-14 text-center h-8" placeholder="0"
                            />
                          </div>
                          <span className="text-sm font-medium truncate text-right">{resolveTeamName(m, "away")}</span>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-2">
                          <Select value={editStatus} onValueChange={(v) => setEditStatus(v ?? "SCHEDULED")}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue>{t(`matchStatus${editStatus}`)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {["SCHEDULED", "PLAYED", "CANCELLED"].map((s) => (
                                <SelectItem key={s} value={s}>{t(`matchStatus${s}`)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-8 text-xs" />
                          <Input type="number" min={1} value={editRound} onChange={(e) => setEditRound(e.target.value)} className="h-8 text-xs" placeholder={t("round")} />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="inline-flex items-center justify-center size-8 rounded-md border hover:bg-muted transition-colors">
                            <X className="size-4" />
                          </button>
                          <button onClick={() => handleSave(m.id)} disabled={isSaving} className="inline-flex items-center justify-center size-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">{resolveTeamName(m, "home")}</span>
                          <div className="text-center shrink-0 px-2 flex flex-col items-center gap-0.5">
                            {m.homeScore !== null && m.awayScore !== null ? (
                              <span className="font-bold tabular-nums text-sm">{m.homeScore} : {m.awayScore}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">vs</span>
                            )}
                            {m.scheduledAt && (
                              <span className="text-muted-foreground text-[10px] flex items-center gap-0.5 whitespace-nowrap">
                                <Calendar className="size-2.5" />{fmt(m.scheduledAt)}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium truncate text-right">{resolveTeamName(m, "away")}</span>
                        </div>
                        <Badge variant={STATUS_VARIANTS[m.status]} className="text-[10px] shrink-0 hidden sm:flex">
                          {t(`matchStatus${m.status}`)}
                        </Badge>
                        <div className="flex gap-1 shrink-0">
                          <a
                            href={`/cs/matches/${m.id}/control`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={isCS ? "Ovládat zápas" : "Control match"}
                            className="inline-flex items-center justify-center size-7 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Tv className="size-3.5" />
                          </a>
                          {canManage && (
                            <>
                              <button onClick={() => startEdit(m)} className="inline-flex items-center justify-center size-7 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                <Pencil className="size-3.5" />
                              </button>
                              <button onClick={() => setDeleteTarget(m.id)} className="inline-flex items-center justify-center size-7 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                                <Trash2 className="size-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t("matchDeleted")}
        description={t("deleteMatchConfirm")}
        confirmLabel={isCS ? "Smazat" : "Delete"}
        cancelLabel={isCS ? "Zrušit" : "Cancel"}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
