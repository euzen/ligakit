"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UserMinus, UserPlus, Users, Globe, Lock, Loader2, ChevronUp, Link, Plus, Trash2, ClipboardList, Copy } from "lucide-react";

interface Team { id: string; name: string; logoUrl: string | null }
interface GuestPlayer {
  id: string;
  name: string;
  number: number | null;
}

interface CompetitionTeam {
  id: string;
  teamId: string | null;
  guestName: string | null;
  rosterToken: string | null;
  isWaitlisted: boolean;
  team: Team | null;
  joinedAt: Date;
  guestPlayers?: GuestPlayer[];
}

interface CompetitionTeamsManagerProps {
  competitionId: string;
  isPublic: boolean;
  initialTeams: CompetitionTeam[];
  /** All teams in the system (for organizer select) */
  availableTeams: Team[];
  /** Teams owned by the current user (for self-registration in public) */
  myTeams: Team[];
  canManage: boolean;
  locale: string;
}

export function CompetitionTeamsManager({
  competitionId,
  isPublic,
  initialTeams,
  availableTeams,
  myTeams,
  canManage,
  locale,
}: CompetitionTeamsManagerProps) {
  const t = useTranslations("competitions");
  const router = useRouter();
  const isCS = locale === "cs";

  const [teams, setTeams] = useState(initialTeams);
  const [removeTarget, setRemoveTarget] = useState<CompetitionTeam | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Guest name input (both public and private)
  const [guestName, setGuestName] = useState("");
  const [privateTeamId, setPrivateTeamId] = useState("");
  const [isAddingPrivate, setIsAddingPrivate] = useState(false);

  // Public organizer select state
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [isAddingPublic, setIsAddingPublic] = useState(false);

  // Public self-registration state
  const [mySelectedTeamId, setMySelectedTeamId] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Guest roster expansion
  const [expandedRoster, setExpandedRoster] = useState<string | null>(null);
  const [rosterPlayers, setRosterPlayers] = useState<Record<string, GuestPlayer[]>>({});
  const [rosterLoading, setRosterLoading] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerNumber, setNewPlayerNumber] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copyingRosterFor, setCopyingRosterFor] = useState<string | null>(null);

  // Registered team roster (read-only)
  const [expandedTeamRoster, setExpandedTeamRoster] = useState<string | null>(null);
  const [teamRosterPlayers, setTeamRosterPlayers] = useState<Record<string, { id: string; name: string; number: number | null; position: { name: string; labelCs: string; labelEn: string } | null }[]>>({});
  const [teamRosterLoading, setTeamRosterLoading] = useState<string | null>(null);

  const loadTeamRoster = async (ct: CompetitionTeam) => {
    if (!ct.teamId) return;
    if (expandedTeamRoster === ct.id) { setExpandedTeamRoster(null); return; }
    setExpandedTeamRoster(ct.id);
    if (teamRosterPlayers[ct.id]) return;
    setTeamRosterLoading(ct.id);
    try {
      const res = await fetch(`/api/teams/${ct.teamId}/players`);
      if (res.ok) {
        const data = await res.json();
        setTeamRosterPlayers((prev) => ({ ...prev, [ct.id]: data }));
      }
    } finally {
      setTeamRosterLoading(null);
    }
  };

  const loadRoster = async (ct: CompetitionTeam) => {
    if (expandedRoster === ct.id) { setExpandedRoster(null); return; }
    setExpandedRoster(ct.id);
    if (rosterPlayers[ct.id]) return;
    setRosterLoading(ct.id);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/guest-teams/${ct.id}/players`);
      if (res.ok) {
        const data = await res.json();
        setRosterPlayers((prev) => ({ ...prev, [ct.id]: data }));
      }
    } finally {
      setRosterLoading(null);
    }
  };

  const handleAddPlayer = async (ct: CompetitionTeam) => {
    if (!newPlayerName.trim()) return;
    setAddingPlayer(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/guest-teams/${ct.id}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlayerName.trim(), number: newPlayerNumber ? Number(newPlayerNumber) : null }),
      });
      if (res.ok) {
        const player = await res.json();
        setRosterPlayers((prev) => ({ ...prev, [ct.id]: [...(prev[ct.id] ?? []), player] }));
        setNewPlayerName("");
        setNewPlayerNumber("");
        toast.success(isCS ? "Hráč přidán" : "Player added");
      }
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleDeletePlayer = async (ct: CompetitionTeam, playerId: string) => {
    setDeletingPlayerId(playerId);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/guest-teams/${ct.id}/players/${playerId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRosterPlayers((prev) => ({ ...prev, [ct.id]: (prev[ct.id] ?? []).filter((p) => p.id !== playerId) }));
        toast.success(isCS ? "Hráč odebrán" : "Player removed");
      }
    } finally {
      setDeletingPlayerId(null);
    }
  };

  const handleCopyToken = (token: string) => {
    const url = `${window.location.origin}/${locale}/guest-roster/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success(isCS ? "Odkaz zkopírován" : "Link copied");
  };

  const registeredTeamIds = new Set(teams.map((t) => t.teamId).filter(Boolean));
  const myTeamsNotIn = myTeams.filter((t) => !registeredTeamIds.has(t.id));
  const allTeamsNotIn = availableTeams.filter((t) => !registeredTeamIds.has(t.id));

  const callAdd = async (body: object, setLoading: (v: boolean) => void) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error === "ALREADY_IN"
          ? (isCS ? "Tým je již přihlášen" : "Team already registered")
          : data.error === "CAPACITY_FULL"
          ? (isCS ? "Soutěž je plně obsazena a náhradníci nejsou povoleni" : "Competition is full and waitlist is disabled")
          : data.error;
        toast.error(errMsg);
        return;
      }
      setTeams((prev) => [...prev, data]);
      if (data.isWaitlisted) {
        toast.success(isCS ? "Tým přidán jako náhradník" : "Team added to waitlist");
      } else {
        toast.success(t("teamAdded"));
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrivate = async () => {
    if (!guestName.trim() && !privateTeamId) return;
    await callAdd(
      privateTeamId ? { teamId: privateTeamId } : { guestName: guestName.trim() },
      setIsAddingPrivate,
    );
    setGuestName("");
    setPrivateTeamId("");
  };

  const handleAddPublic = async () => {
    if (!selectedTeamId) return;
    await callAdd({ teamId: selectedTeamId }, setIsAddingPublic);
    setSelectedTeamId("");
  };

  const handleSelfRegister = async () => {
    if (!mySelectedTeamId) return;
    await callAdd({ teamId: mySelectedTeamId }, setIsRegistering);
    setMySelectedTeamId("");
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/teams`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          canManage
            ? { entryId: removeTarget.id }
            : { teamId: removeTarget.teamId },
        ),
      });
      if (res.ok) {
        setTeams((prev) => prev.filter((t) => t.id !== removeTarget.id));
        toast.success(t("teamRemoved"));
        setRemoveTarget(null);
        router.refresh();
      }
    } finally {
      setIsRemoving(false);
    }
  };

  const displayName = (ct: CompetitionTeam) => ct.team?.name ?? ct.guestName ?? "?";
  const displayLogo = (ct: CompetitionTeam) => ct.team?.logoUrl ?? null;

  return (
    <div className="space-y-4">
      {/* Visibility badge */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {isPublic
          ? <><Globe className="size-3.5" />{isCS ? "Veřejný turnaj" : "Public competition"}</>
          : <><Lock className="size-3.5" />{isCS ? "Soukromý turnaj" : "Private competition"}</>
        }
      </div>

      {/* ── PRIVATE + PUBLIC (canManage): organizer adds guest by name or picks from system ── */}
      {canManage && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{isCS ? "Přidat tým" : "Add team"}</p>
          <div className="flex gap-2">
            <Input
              placeholder={isCS ? "Název týmu..." : "Team name..."}
              value={guestName}
              onChange={(e) => { setGuestName(e.target.value); setPrivateTeamId(""); }}
              className="flex-1 h-8 text-sm"
              disabled={!!privateTeamId}
            />
          </div>
          {allTeamsNotIn.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">{isCS ? "nebo ze systému:" : "or from system:"}</span>
              <Select value={privateTeamId} onValueChange={(v) => { setPrivateTeamId(v ?? ""); setGuestName(""); }}>
                <SelectTrigger className="flex-1 h-8 text-sm"><SelectValue placeholder={isCS ? "Vybrat tým..." : "Select team..."} /></SelectTrigger>
                <SelectContent>
                  {allTeamsNotIn.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            size="sm"
            onClick={handleAddPrivate}
            disabled={(!guestName.trim() && !privateTeamId) || isAddingPrivate}
            className="gap-1.5"
          >
            {isAddingPrivate ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
            {isCS ? "Přidat" : "Add"}
          </Button>
        </div>
      )}

      {/* ── PUBLIC: organizer can force-add any system team ── */}
      {isPublic && canManage && allTeamsNotIn.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedTeamId} onValueChange={(v) => setSelectedTeamId(v ?? "")}>
            <SelectTrigger className="flex-1"><SelectValue placeholder={t("addTeamPlaceholder")} /></SelectTrigger>
            <SelectContent>
              {allTeamsNotIn.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleAddPublic} disabled={!selectedTeamId || isAddingPublic} className="gap-1.5 shrink-0" type="button">
            {isAddingPublic ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            {t("addTeam")}
          </Button>
        </div>
      )}

      {/* ── PUBLIC: team owner self-registers ── */}
      {isPublic && !canManage && myTeamsNotIn.length > 0 && (
        <div className="rounded-lg border border-dashed p-3 space-y-2">
          <p className="text-xs font-medium">{isCS ? "Přihlásit svůj tým" : "Register your team"}</p>
          <div className="flex gap-2">
            <Select value={mySelectedTeamId} onValueChange={(v) => setMySelectedTeamId(v ?? "")}>
              <SelectTrigger className="flex-1"><SelectValue placeholder={isCS ? "Vybrat tým..." : "Select team..."} /></SelectTrigger>
              <SelectContent>
                {myTeamsNotIn.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleSelfRegister} disabled={!mySelectedTeamId || isRegistering} className="gap-1.5 shrink-0" type="button">
              {isRegistering ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              {isCS ? "Přihlásit" : "Register"}
            </Button>
          </div>
        </div>
      )}

      {/* Teams list */}
      {teams.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <Users className="size-8 opacity-30" />
          <p className="text-sm">{t("noTeams")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {teams.map((ct) => {
            const isMyTeam = !canManage && ct.teamId && myTeams.some((m) => m.id === ct.teamId);
            const canRemove = canManage || isMyTeam;
            return (
              <li key={ct.id} className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  {displayLogo(ct) ? (
                    <img src={displayLogo(ct)!} alt="" className="size-7 rounded object-cover shrink-0" />
                  ) : (
                    <div className="size-7 rounded border bg-muted flex items-center justify-center shrink-0">
                      <Users className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="flex-1 font-medium text-sm">{displayName(ct)}</span>
                  {ct.isWaitlisted && (
                    <Badge variant="secondary" className="text-[10px] bg-yellow-100 text-yellow-800 border-yellow-300">
                      {isCS ? "Náhradník" : "Waitlist"}
                    </Badge>
                  )}
                  {!ct.teamId && (
                    <Badge variant="outline" className="text-[10px]">{isCS ? "Host" : "Guest"}</Badge>
                  )}
                  <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                    {new Date(ct.joinedAt).toLocaleDateString()}
                  </Badge>
                  {/* Registered team roster toggle */}
                  {ct.teamId && (
                    <button
                      onClick={() => loadTeamRoster(ct)}
                      title={isCS ? "Soupiska týmu" : "Team roster"}
                      className="inline-flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                    >
                      {expandedTeamRoster === ct.id
                        ? <ChevronUp className="size-3.5" />
                        : <ClipboardList className="size-3.5" />}
                    </button>
                  )}
                  {/* Guest roster actions */}
                  {canManage && !ct.teamId && (
                    <>
                      {ct.rosterToken && (
                        <button
                          onClick={() => handleCopyToken(ct.rosterToken!)}
                          title={isCS ? "Kopírovat odkaz na soupisku" : "Copy roster link"}
                          className="inline-flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                        >
                          {copiedToken === ct.rosterToken
                            ? <span className="text-[9px] font-bold text-green-600">OK</span>
                            : <Link className="size-3.5" />}
                        </button>
                      )}
                      <button
                        onClick={() => loadRoster(ct)}
                        title={isCS ? "Soupiska" : "Roster"}
                        className="inline-flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                      >
                        {expandedRoster === ct.id
                          ? <ChevronUp className="size-3.5" />
                          : <ClipboardList className="size-3.5" />}
                      </button>
                    </>
                  )}
                  {canRemove && (
                    <button
                      onClick={() => setRemoveTarget(ct)}
                      className="inline-flex items-center justify-center size-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <UserMinus className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Expanded registered team roster (read-only) */}
                {expandedTeamRoster === ct.id && ct.teamId && (
                  <div className="border-t bg-muted/30 px-3 py-3">
                    {teamRosterLoading === ct.id ? (
                      <div className="flex justify-center py-3">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (teamRosterPlayers[ct.id] ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        {isCS ? "Soupiska je prázdná" : "Roster is empty"}
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {(teamRosterPlayers[ct.id] ?? [])
                          .map((p) => (
                            <li key={p.id} className="flex items-center gap-2 text-sm">
                              <span className="w-6 text-right tabular-nums text-muted-foreground text-xs shrink-0 font-mono">
                                {p.number != null ? `#${p.number}` : ""}
                              </span>
                              <span className="flex-1 font-medium">{p.name}</span>
                              {p.position && (
                                <span className="text-xs text-muted-foreground">
                                  {(isCS ? p.position.labelCs : p.position.labelEn) || p.position.name}
                                </span>
                              )}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Expanded guest roster */}
                {expandedRoster === ct.id && canManage && !ct.teamId && (
                  <div className="border-t bg-muted/30 px-3 py-3 space-y-3">
                    {/* Add player form */}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="#"
                        value={newPlayerNumber}
                        onChange={(e) => setNewPlayerNumber(e.target.value)}
                        className="w-14 h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <input
                        type="text"
                        placeholder={isCS ? "Jméno hráče…" : "Player name…"}
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddPlayer(ct); }}
                        className="flex-1 h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        onClick={() => handleAddPlayer(ct)}
                        disabled={!newPlayerName.trim() || addingPlayer}
                        className="h-8 px-2.5 rounded-md bg-primary text-primary-foreground text-sm inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        {addingPlayer ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                      </button>
                    </div>

                    {/* Copy roster from another guest team */}
                    {teams.filter((t) => t.id !== ct.id && !t.teamId).length > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          className="flex-1 h-8 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring text-muted-foreground"
                          defaultValue=""
                          id={`copy-source-${ct.id}`}
                        >
                          <option value="" disabled>{isCS ? "Kopírovat soupisku z…" : "Copy roster from…"}</option>
                          {teams.filter((t) => t.id !== ct.id && !t.teamId).map((t) => (
                            <option key={t.id} value={t.id}>{t.guestName ?? "?"}</option>
                          ))}
                        </select>
                        <button
                          disabled={copyingRosterFor === ct.id}
                          onClick={async () => {
                            const sel = (document.getElementById(`copy-source-${ct.id}`) as HTMLSelectElement)?.value;
                            if (!sel) return;
                            setCopyingRosterFor(ct.id);
                            try {
                              const res = await fetch(`/api/competitions/${competitionId}/guest-teams/${ct.id}/copy-roster`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ sourceCtId: sel }),
                              });
                              if (res.ok) {
                                const data = await res.json();
                                const fresh = await fetch(`/api/competitions/${competitionId}/guest-teams/${ct.id}/players`);
                                if (fresh.ok) { const fp = await fresh.json(); setRosterPlayers((prev) => ({ ...prev, [ct.id]: fp })); }
                                toast.success(isCS ? `Zkopírováno ${data.copied} hráčů` : `Copied ${data.copied} players`);
                              } else {
                                toast.error(isCS ? "Kopírování selhalo" : "Copy failed");
                              }
                            } finally {
                              setCopyingRosterFor(null);
                            }
                          }}
                          className="h-8 px-2.5 rounded-md border bg-background text-sm inline-flex items-center gap-1 hover:bg-muted disabled:opacity-50"
                        >
                          {copyingRosterFor === ct.id ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
                    )}

                    {/* Players list */}
                    {rosterLoading === ct.id ? (
                      <div className="flex justify-center py-3">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (rosterPlayers[ct.id] ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        {isCS ? "Soupiska je prázdná" : "Roster is empty"}
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {(rosterPlayers[ct.id] ?? [])
                          .slice().sort((a, b) => (a.number ?? 999) - (b.number ?? 999))
                          .map((p) => (
                            <li key={p.id} className="flex items-center gap-2 text-sm">
                              <span className="w-6 text-right tabular-nums text-muted-foreground text-xs shrink-0">
                                {p.number ?? ""}
                              </span>
                              <span className="flex-1">{p.name}</span>
                              <button
                                onClick={() => handleDeletePlayer(ct, p.id)}
                                disabled={deletingPlayerId === p.id}
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                              >
                                {deletingPlayerId === p.id
                                  ? <Loader2 className="size-3 animate-spin" />
                                  : <Trash2 className="size-3" />}
                              </button>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
        title={t("removeTeam")}
        description={t("removeTeamConfirm")}
        confirmLabel={t("removeTeam")}
        cancelLabel={isCS ? "Zrušit" : "Cancel"}
        isLoading={isRemoving}
        onConfirm={handleRemove}
        variant="destructive"
      />
    </div>
  );
}
