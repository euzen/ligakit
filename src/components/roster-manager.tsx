"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Check, X, Plus, Loader2, Users, Hash } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Position {
  id: string;
  name: string;
}

interface Player {
  id: string;
  number: number | null;
  name: string;
  positionId: string | null;
  position: { id: string; name: string } | null;
}

interface RosterManagerProps {
  teamId: string;
  locale: string;
  initialPlayers: Player[];
  positions: Position[];
}

export function RosterManager({
  teamId,
  locale,
  initialPlayers,
  positions,
}: RosterManagerProps) {
  const t = useTranslations("roster");

  const [players, setPlayers] = useState(initialPlayers);

  // Add form
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newPositionId, setNewPositionId] = useState("");
  const [addError, setAddError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editPositionId, setEditPositionId] = useState("");
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const sortPlayers = (list: Player[]) =>
    [...list].sort((a, b) => {
      if (a.number != null && b.number != null) return a.number - b.number;
      if (a.number != null) return -1;
      if (b.number != null) return 1;
      return a.name.localeCompare(b.name);
    });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    const trimmedName = newName.trim();
    if (!trimmedName) { setAddError(t("fieldRequired")); return; }

    const num = newNumber !== "" ? Number(newNumber) : null;
    const posId = newPositionId || null;
    const resolvedPosition = posId ? (positions.find((p) => p.id === posId) ?? null) : null;

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: Player = {
      id: tempId,
      name: trimmedName,
      number: num,
      positionId: posId,
      position: resolvedPosition,
    };
    setPlayers((prev) => sortPlayers([...prev, optimistic]));
    setNewName("");
    setNewNumber("");
    setNewPositionId("");
    setIsAdding(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, number: num, positionId: posId }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Rollback
        setPlayers((prev) => prev.filter((p) => p.id !== tempId));
        setNewName(trimmedName);
        setNewNumber(num != null ? String(num) : "");
        setNewPositionId(posId ?? "");
        setAddError(data.error === "NAME_REQUIRED" ? t("fieldRequired") : data.error);
        return;
      }
      // Replace temp with real record
      setPlayers((prev) => sortPlayers(prev.map((p) => (p.id === tempId ? data : p))));
      toast.success(t("playerCreated"));
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.name);
    setEditNumber(player.number?.toString() ?? "");
    setEditPositionId(player.positionId ?? "");
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
  };

  const handleSave = async (id: string) => {
    setEditError("");
    if (!editName.trim()) { setEditError(t("fieldRequired")); return; }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/players/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          number: editNumber !== "" ? Number(editNumber) : null,
          positionId: editPositionId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error === "NAME_REQUIRED" ? t("fieldRequired") : data.error);
        return;
      }
      toast.success(t("playerUpdated"));
      setPlayers((prev) =>
        prev.map((p) => (p.id === id ? data : p)).sort((a, b) => {
          if (a.number != null && b.number != null) return a.number - b.number;
          if (a.number != null) return -1;
          if (b.number != null) return 1;
          return a.name.localeCompare(b.name);
        }),
      );
      setEditingId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/teams/${teamId}/players/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t("playerDeleted"));
        setPlayers((prev) => prev.filter((p) => p.id !== id));
        setDeleteTarget(null);
      } else {
        toast.error(locale === "cs" ? "Chyba při mazání" : "Error deleting player");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add player form */}
      <form onSubmit={handleAdd} className="space-y-3">
        {addError && (
          <Alert variant="destructive">
            <AlertDescription>{addError}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-[4rem_1fr] gap-2">
          <div>
            <Label htmlFor="newNumber" className="text-xs mb-1 block">{t("playerNumber")}</Label>
            <Input
              id="newNumber"
              type="number"
              min={0}
              max={999}
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder={t("playerNumberPlaceholder")}
              disabled={isAdding}
              className="text-center"
            />
          </div>
          <div>
            <Label htmlFor="newPlayerName" className="text-xs mb-1 block">{t("playerName")} *</Label>
            <Input
              id="newPlayerName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("playerNamePlaceholder")}
              disabled={isAdding}
              required
            />
          </div>
        </div>
        {positions.length > 0 && (
          <div>
            <Label className="text-xs mb-1 block">{t("playerPosition")}</Label>
            <Select
              value={newPositionId}
              onValueChange={(val) => setNewPositionId(val ?? "")}
              disabled={isAdding}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("noPosition")}>
                  {positions.find((p) => p.id === newPositionId)?.name ?? t("noPosition")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("noPosition")}</SelectItem>
                {positions.map((pos) => (
                  <SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button type="submit" disabled={isAdding} className="w-full">
          {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {t("addPlayer")}
        </Button>
      </form>

      <Separator />

      {/* Players list */}
      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center text-muted-foreground">
          <Users className="size-10 opacity-30" />
          <p>{t("noPlayers")}</p>
          <p className="text-sm">{t("noPlayersDesc")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {players.map((player) => (
            <li key={player.id} className="rounded-lg border bg-card">
              {editingId === player.id ? (
                <div className="p-3 space-y-2">
                  {editError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">{editError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min={0}
                      max={999}
                      value={editNumber}
                      onChange={(e) => setEditNumber(e.target.value)}
                      className="w-16 text-center shrink-0"
                      disabled={isSaving}
                      placeholder="#"
                    />
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                      disabled={isSaving}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSave(player.id)}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center size-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center size-9 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  {positions.length > 0 && (
                    <Select
                      value={editPositionId}
                      onValueChange={(val) => setEditPositionId(val ?? "")}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("noPosition")}>
                          {positions.find((p) => p.id === editPositionId)?.name ?? t("noPosition")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t("noPosition")}</SelectItem>
                        {positions.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-10 text-center shrink-0">
                    {player.number != null ? (
                      <span className="text-sm font-bold text-primary">#{player.number}</span>
                    ) : (
                      <Hash className="size-4 text-muted-foreground mx-auto" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{player.name}</p>
                    {player.position && (
                      <p className="text-xs text-muted-foreground">{player.position.name}</p>
                    )}
                  </div>
                  {player.position && (
                    <Badge variant="secondary" className="shrink-0 text-xs hidden sm:inline-flex">
                      {player.position.name}
                    </Badge>
                  )}
                  <button
                    onClick={() => startEdit(player)}
                    className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(player.id)}
                    disabled={deletingId === player.id}
                    className="inline-flex items-center justify-center size-8 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    {deletingId === player.id
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <Trash2 className="size-3.5" />
                    }
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={locale === "cs" ? "Smazat hráče" : "Delete Player"}
        description={t("deleteConfirm")}
        confirmLabel={locale === "cs" ? "Smazat" : "Delete"}
        cancelLabel={locale === "cs" ? "Zrušit" : "Cancel"}
        isLoading={deletingId !== null}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        variant="destructive"
      />
    </div>
  );
}
