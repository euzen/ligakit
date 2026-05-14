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
import { Pencil, Trash2, Check, X, Plus, Loader2, Users, Hash, Download, Upload, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Position {
  id: string;
  name: string;
  labelCs?: string;
  labelEn?: string;
}

interface Player {
  id: string;
  number: number | null;
  name: string;
  positionId: string | null;
  position: { id: string; name: string; labelCs?: string; labelEn?: string } | null;
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

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);

  const posLabel = (pos: { name: string; labelCs?: string; labelEn?: string } | null) => {
    if (!pos) return "";
    return (locale === "cs" ? pos.labelCs : pos.labelEn) || pos.name;
  };

  type SortKey = "number" | "name" | "position";
  const [sortKey, setSortKey] = useState<SortKey>("number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "number") {
      if (a.number == null && b.number == null) cmp = 0;
      else if (a.number == null) cmp = 1;
      else if (b.number == null) cmp = -1;
      else cmp = a.number - b.number;
    } else if (sortKey === "name") {
      cmp = a.name.localeCompare(b.name);
    } else if (sortKey === "position") {
      const pa = posLabel(a.position);
      const pb = posLabel(b.position);
      cmp = pa.localeCompare(pb);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const sortPlayers = (list: Player[]) =>
    [...list].sort((a, b) => {
      if (a.number != null && b.number != null) return a.number - b.number;
      if (a.number != null) return -1;
      if (b.number != null) return 1;
      return a.name.localeCompare(b.name);
    });

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/roster/export`);
      if (!res.ok) { toast.error(locale === "cs" ? "Export selhal" : "Export failed"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "soupiska.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(locale === "cs" ? "Export selhal" : "Export failed");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    setImportResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`/api/teams/${teamId}/roster/import`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Import failed"); return; }
      setImportResult(data);
      if (data.created > 0 || data.updated > 0) {
        const fresh = await fetch(`/api/teams/${teamId}/players`);
        if (fresh.ok) setPlayers(sortPlayers(await fresh.json()));
        const msg = locale === "cs"
          ? `Přidáno: ${data.created}, aktualizováno: ${data.updated}`
          : `Created: ${data.created}, updated: ${data.updated}`;
        toast.success(msg);
      }
    } finally {
      setImporting(false);
    }
  };

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
      {/* Export / Import toolbar */}
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-blue-700 hover:text-blue-700 transition-all"
        >
          <Download className="size-3.5" />
          {locale === "cs" ? "Exportovat xlsx" : "Export xlsx"}
        </button>
        <label className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-blue-700 hover:text-blue-700 transition-all cursor-pointer">
          {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          {locale === "cs" ? "Importovat xlsx" : "Import xlsx"}
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
        </label>
      </div>

      {importResult && (
        <div className={`rounded-xl border px-4 py-3 text-sm space-y-1 ${
          importResult.errors.length > 0 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"
        }`}>
          <p className="font-semibold">
            {locale === "cs"
              ? `Přidáno: ${importResult.created} hráčů · Aktualizováno: ${importResult.updated}`
              : `Created: ${importResult.created} · Updated: ${importResult.updated}`}
          </p>
          {importResult.errors.map((e, i) => (
            <p key={i} className="text-xs text-red-600">{e}</p>
          ))}
        </div>
      )}

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
                  {posLabel(positions.find((p) => p.id === newPositionId) ?? null) || t("noPosition")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("noPosition")}</SelectItem>
                {positions.map((pos) => (
                  <SelectItem key={pos.id} value={pos.id}>{posLabel(pos)}</SelectItem>
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

      {/* Players table */}
      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center text-muted-foreground">
          <Users className="size-10 opacity-30" />
          <p>{t("noPlayers")}</p>
          <p className="text-sm">{t("noPlayersDesc")}</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {(["number", "name", "position"] as const).map((key) => {
                  const labels: Record<string, string> = {
                    number: "#",
                    name: locale === "cs" ? "Jméno" : "Name",
                    position: locale === "cs" ? "Pozice" : "Position",
                  };
                  const active = sortKey === key;
                  return (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className={`px-3 py-2.5 text-left font-semibold cursor-pointer select-none whitespace-nowrap hover:bg-muted transition-colors ${
                        key === "number" ? "w-14" : ""
                      } ${active ? "text-primary" : "text-muted-foreground"}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {labels[key]}
                        {active
                          ? sortDir === "asc"
                            ? <ChevronUp className="size-3.5" />
                            : <ChevronDown className="size-3.5" />
                          : <ChevronsUpDown className="size-3.5 opacity-40" />
                        }
                      </span>
                    </th>
                  );
                })}
                <th className="w-20" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-muted/30 transition-colors">
                  {editingId === player.id ? (
                    <td colSpan={4} className="px-3 py-2">
                      {editError && (
                        <Alert variant="destructive" className="py-2 mb-2">
                          <AlertDescription className="text-xs">{editError}</AlertDescription>
                        </Alert>
                      )}
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number" min={0} max={999}
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
                        {positions.length > 0 && (
                          <Select
                            value={editPositionId}
                            onValueChange={(val) => setEditPositionId(val ?? "")}
                            disabled={isSaving}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder={t("noPosition")}>
                                {posLabel(positions.find((p) => p.id === editPositionId) ?? null) || t("noPosition")}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">{t("noPosition")}</SelectItem>
                              {positions.map((pos) => (
                                <SelectItem key={pos.id} value={pos.id}>{posLabel(pos)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
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
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 w-14 text-center">
                        {player.number != null
                          ? <span className="font-bold text-primary tabular-nums">#{player.number}</span>
                          : <Hash className="size-3.5 text-muted-foreground mx-auto" />}
                      </td>
                      <td className="px-3 py-2.5 font-medium">{player.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {player.position ? posLabel(player.position) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => startEdit(player)}
                            className="inline-flex items-center justify-center size-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(player.id)}
                            disabled={deletingId === player.id}
                            className="inline-flex items-center justify-center size-7 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50"
                          >
                            {deletingId === player.id
                              ? <Loader2 className="size-3.5 animate-spin" />
                              : <Trash2 className="size-3.5" />}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
