"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EventType {
  name: string;
  labelCs: string;
  labelEn: string;
  value: number;
  affectsScore: boolean;
  color: string | null;
  icon: string | null;
}

interface MatchEvent {
  id: string;
  type: string;
  teamSide: string;
  minute: number | null;
  addedTime: number | null;
  playerName: string | null;
  player2Name: string | null;
}

interface LiveMatch {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  events: MatchEvent[];
  eventTypes: EventType[];
}

interface EditState {
  type: string;
  teamSide: string;
  minute: string;
  addedTime: string;
  playerName: string;
  player2Name: string;
}

export default function MatchEventsPage() {
  const params = useParams();
  const matchId = params.id as string;
  const locale = params.locale as string;
  const cs = locale === "cs";

  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New event form
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState<EditState>({ type: "", teamSide: "HOME", minute: "", addedTime: "", playerName: "", player2Name: "" });
  const [adding, setAdding] = useState(false);

  const fetchMatch = useCallback(async () => {
    const res = await fetch(`/api/matches/${matchId}/live`);
    if (res.ok) setMatch(await res.json());
    setLoading(false);
  }, [matchId]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);

  const eventLabel = (type: string) => {
    const et = match?.eventTypes.find((e) => e.name === type);
    if (!et) return type;
    return (cs ? et.labelCs : et.labelEn) || et.name;
  };

  const ICON_EMOJI: Record<string, string> = {
    "target": "⚽",
    "circle-dot": "⚽",
    "circle-x": "❌",
    "square": "🟨",
    "hand": "✋",
    "flag": "🚩",
    "flag-triangle-right": "🚩",
    "arrow-right-left": "🔄",
    "clock": "⏱",
    "whistle": "📯",
  };

  const eventIcon = (type: string) => {
    const et = match?.eventTypes.find((e) => e.name === type);
    const icon = et?.icon ?? "";
    return ICON_EMOJI[icon] ?? "•";
  };

  const startEdit = (ev: MatchEvent) => {
    setEditingId(ev.id);
    setEditState({
      type: ev.type,
      teamSide: ev.teamSide,
      minute: ev.minute != null ? String(ev.minute) : "",
      addedTime: ev.addedTime != null ? String(ev.addedTime) : "",
      playerName: ev.playerName ?? "",
      player2Name: ev.player2Name ?? "",
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditState(null); };

  const saveEdit = async () => {
    if (!editingId || !editState) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/events`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: editingId,
          type: editState.type,
          teamSide: editState.teamSide,
          minute: editState.minute,
          addedTime: editState.addedTime,
          playerName: editState.playerName,
          player2Name: editState.player2Name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMatch((prev) => prev ? { ...prev, ...data.match, eventTypes: prev.eventTypes } : prev);
        setEditingId(null);
        setEditState(null);
        toast.success(cs ? "Událost uložena" : "Event saved");
      } else {
        toast.error("Error");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm(cs ? "Smazat tuto událost?" : "Delete this event?")) return;
    setDeletingId(eventId);
    try {
      const res = await fetch(`/api/matches/${matchId}/events`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) {
        const data = await res.json();
        setMatch((prev) => prev ? { ...prev, ...data.match, eventTypes: prev.eventTypes } : prev);
        toast.success(cs ? "Událost smazána" : "Event deleted");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const addEvent = async () => {
    if (!newEvent.type) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newEvent.type,
          teamSide: newEvent.teamSide,
          minute: newEvent.minute || null,
          addedTime: newEvent.addedTime || null,
          playerName: newEvent.playerName || null,
          player2Name: newEvent.player2Name || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMatch((prev) => prev ? { ...prev, ...data.match, eventTypes: prev.eventTypes } : prev);
        setNewEvent({ type: newEvent.type, teamSide: newEvent.teamSide, minute: "", addedTime: "", playerName: "", player2Name: "" });
        setShowAdd(false);
        toast.success(cs ? "Událost přidána" : "Event added");
      }
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> {cs ? "Načítání…" : "Loading…"}
      </div>
    );
  }

  if (!match) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">404</div>;
  }

  const homeName = match.homeTeam?.name ?? match.homeTeamName ?? (cs ? "Domácí" : "Home");
  const awayName = match.awayTeam?.name ?? match.awayTeamName ?? (cs ? "Hosté" : "Away");

  const teamColor = (side: string) => side === "HOME" ? "text-blue-600" : "text-orange-600";
  const teamBg = (side: string) => side === "HOME" ? "bg-blue-50 dark:bg-blue-950/30" : "bg-orange-50 dark:bg-orange-950/30";

  const EditRow = ({ ev }: { ev: MatchEvent }) => {
    if (!editState) return null;
    return (
      <tr className="bg-muted/60">
        <td className="px-3 py-2" colSpan={2}>
          <div className="flex gap-2 flex-wrap">
            <Select value={editState.teamSide} onValueChange={(v) => setEditState({ ...editState, teamSide: v ?? "HOME" })}>
              <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="HOME">{homeName}</SelectItem>
                <SelectItem value="AWAY">{awayName}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={editState.type} onValueChange={(v) => setEditState({ ...editState, type: v ?? "" })}>
              <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {match.eventTypes.map((et) => (
                  <SelectItem key={et.name} value={et.name}>
                    {ICON_EMOJI[et.icon ?? ""] ?? "•"} {cs ? et.labelCs : et.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </td>
        <td className="px-2 py-2">
          <Input
            type="number" min={0} max={120} placeholder="Min"
            value={editState.minute}
            onChange={(e) => setEditState({ ...editState, minute: e.target.value })}
            className="h-7 text-xs w-16"
          />
        </td>
        <td className="px-2 py-2">
          <div className="flex flex-col gap-1">
            <Input
              type="text" placeholder={cs ? "Hráč (vychází)" : "Player (out)"}
              value={editState.playerName}
              onChange={(e) => setEditState({ ...editState, playerName: e.target.value })}
              className="h-7 text-xs w-36"
            />
            {editState.type === "SUBSTITUTION" && (
              <Input
                type="text" placeholder={cs ? "Hráč (nastupuje)" : "Player (in)"}
                value={editState.player2Name}
                onChange={(e) => setEditState({ ...editState, player2Name: e.target.value })}
                className="h-7 text-xs w-36"
              />
            )}
          </div>
        </td>
        <td className="px-2 py-2">
          <div className="flex gap-1">
            <button
              onClick={saveEdit} disabled={saving}
              className="inline-flex items-center justify-center size-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            </button>
            <button
              onClick={cancelEdit}
              className="inline-flex items-center justify-center size-7 rounded-md border hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <a href={`/${locale}/matches/${matchId}/control`} className="text-xs text-muted-foreground hover:underline">
              ← {cs ? "Zpět na ovládání" : "Back to control"}
            </a>
            <h1 className="text-xl font-bold mt-1">
              {homeName} <span className="text-muted-foreground font-normal text-base">vs</span> {awayName}
            </h1>
          </div>
          <div className="text-2xl font-black tabular-nums">
            {match.homeScore ?? 0} : {match.awayScore ?? 0}
          </div>
        </div>

        {/* Score summary */}
        <div className="grid grid-cols-2 gap-3">
          {(["HOME", "AWAY"] as const).map((side) => {
            const evs = match.events.filter((e) => e.teamSide === side);
            return (
              <div key={side} className={`rounded-xl border p-3 ${teamBg(side)}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${teamColor(side)}`}>
                  {side === "HOME" ? homeName : awayName}
                </p>
                <p className="text-2xl font-black">
                  {match.events.filter((e) => {
                    const et = match.eventTypes.find((t) => t.name === e.type);
                    return e.teamSide === side && et?.affectsScore;
                  }).reduce((sum, e) => {
                    const et = match.eventTypes.find((t) => t.name === e.type);
                    return sum + (et?.value ?? 0);
                  }, 0)}
                </p>
                <p className="text-xs text-muted-foreground">{evs.length} {cs ? "událostí" : "events"}</p>
              </div>
            );
          })}
        </div>

        {/* Add event */}
        <div className="rounded-xl border overflow-hidden">
          <button
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
            onClick={() => setShowAdd((v) => !v)}
          >
            <Plus className="size-4" />
            {cs ? "Přidat událost" : "Add event"}
          </button>
          {showAdd && (
            <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Select value={newEvent.teamSide} onValueChange={(v) => setNewEvent({ ...newEvent, teamSide: v ?? "HOME" })}>
                  <SelectTrigger className="h-8 text-sm w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOME">{homeName}</SelectItem>
                    <SelectItem value="AWAY">{awayName}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newEvent.type} onValueChange={(v) => setNewEvent({ ...newEvent, type: v ?? "" })}>
                  <SelectTrigger className="h-8 text-sm w-40"><SelectValue placeholder={cs ? "Typ…" : "Type…"} /></SelectTrigger>
                  <SelectContent>
                    {match.eventTypes.map((et) => (
                      <SelectItem key={et.name} value={et.name}>
                        {ICON_EMOJI[et.icon ?? ""] ?? "•"} {cs ? et.labelCs : et.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number" min={0} max={120} placeholder={cs ? "Min" : "Min"}
                  value={newEvent.minute}
                  onChange={(e) => setNewEvent({ ...newEvent, minute: e.target.value })}
                  className="h-8 text-sm w-16"
                />
                <Input
                  type="text" placeholder={cs ? "Hráč (vychází)" : "Player (out)"}
                  value={newEvent.playerName}
                  onChange={(e) => setNewEvent({ ...newEvent, playerName: e.target.value })}
                  className="h-8 text-sm flex-1 min-w-32"
                />
                {newEvent.type === "SUBSTITUTION" && (
                  <Input
                    type="text" placeholder={cs ? "Hráč (nastupuje)" : "Player (in)"}
                    value={newEvent.player2Name}
                    onChange={(e) => setNewEvent({ ...newEvent, player2Name: e.target.value })}
                    className="h-8 text-sm flex-1 min-w-32"
                  />
                )}
              </div>
              <Button size="sm" onClick={addEvent} disabled={!newEvent.type || adding} className="gap-1.5">
                {adding ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                {cs ? "Přidat" : "Add"}
              </Button>
            </div>
          )}
        </div>

        {/* Events table */}
        {match.events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {cs ? "Žádné události" : "No events"}
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-semibold">{cs ? "Tým / Typ" : "Team / Type"}</th>
                  <th className="px-2 py-2.5 text-left text-xs text-muted-foreground font-semibold w-16">{cs ? "Min" : "Min"}</th>
                  <th className="px-2 py-2.5 text-left text-xs text-muted-foreground font-semibold">{cs ? "Hráč" : "Player"}</th>
                  <th className="px-2 py-2.5 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[...match.events].sort((a, b) => {
                  const aT = a.minute != null ? a.minute * 100 + (a.addedTime ?? 0) : -1;
                  const bT = b.minute != null ? b.minute * 100 + (b.addedTime ?? 0) : -1;
                  return aT - bT;
                }).map((ev) => (
                  <Fragment key={ev.id}>
                    <tr className={`transition-colors hover:bg-muted/30 ${editingId === ev.id ? "opacity-40" : ""}`}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{eventIcon(ev.type)}</span>
                          <div>
                            <p className="font-medium leading-tight">{eventLabel(ev.type)}</p>
                            <p className={`text-xs font-medium ${teamColor(ev.teamSide)}`}>
                              {ev.teamSide === "HOME" ? homeName : awayName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        {ev.minute != null && (
                          <Badge variant="outline" className="text-xs font-mono">
                            {ev.minute}{ev.addedTime ? `+${ev.addedTime}` : ""}&apos;
                          </Badge>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground text-xs">
                        {ev.type === "SUBSTITUTION"
                          ? <span>↑ {ev.playerName ?? "?"} / ↓ {ev.player2Name ?? "?"}</span>
                          : ev.playerName ?? "—"
                        }
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => startEdit(ev)}
                            className="inline-flex items-center justify-center size-7 rounded-md border hover:bg-muted text-muted-foreground transition-colors"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => deleteEvent(ev.id)}
                            disabled={deletingId === ev.id}
                            className="inline-flex items-center justify-center size-7 rounded-md border hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors disabled:opacity-50"
                          >
                            {deletingId === ev.id
                              ? <Loader2 className="size-3.5 animate-spin" />
                              : <Trash2 className="size-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editingId === ev.id && <EditRow ev={ev} />}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
