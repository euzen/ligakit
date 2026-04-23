"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, Loader2, Tag } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Position {
  id: string;
  name: string;
  _count: { players: number };
}

interface PositionManagerProps {
  sportId: string;
  locale: string;
  initialPositions: Position[];
}

export function PositionManager({ sportId, locale, initialPositions }: PositionManagerProps) {
  const t = useTranslations("sports");

  const [positions, setPositions] = useState(initialPositions);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = newName.trim();
    if (!trimmed) { setError(t("fieldRequired")); return; }

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, name: trimmed, _count: { players: 0 } };
    setPositions((prev) => [...prev, optimistic].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName("");
    setIsAdding(true);
    try {
      const res = await fetch(`/api/sports/${sportId}/positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Rollback
        setPositions((prev) => prev.filter((p) => p.id !== tempId));
        setNewName(trimmed);
        setError(data.error === "NAME_EXISTS" ? t("positionExists") : data.error);
        return;
      }
      // Replace temp with real
      setPositions((prev) =>
        prev.map((p) => (p.id === tempId ? data : p)).sort((a, b) => a.name.localeCompare(b.name)),
      );
      toast.success(t("positionCreated"));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/sports/${sportId}/positions/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t("positionDeleted"));
        setPositions((prev) => prev.filter((p) => p.id !== id));
        setDeleteTarget(null);
      } else {
        toast.error(locale === "cs" ? "Chyba při mazání" : "Error deleting");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="flex gap-2">
        {error && (
          <Alert variant="destructive" className="py-1.5">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
        <Input
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setError(""); }}
          placeholder={t("positionNamePlaceholder")}
          disabled={isAdding}
          className="flex-1"
        />
        <Button type="submit" disabled={isAdding} size="sm" className="shrink-0">
          {isAdding ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          {t("addPosition")}
        </Button>
      </form>

      {positions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2 text-center">{t("noPositions")}</p>
      ) : (
        <ul className="space-y-1.5">
          {positions.map((pos) => (
            <li
              key={pos.id}
              className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 bg-card"
            >
              <Tag className="size-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm">{pos.name}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                {pos._count.players}
              </Badge>
              <button
                onClick={() => setDeleteTarget(pos.id)}
                disabled={deletingId === pos.id}
                className="inline-flex items-center justify-center size-6 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                {deletingId === pos.id
                  ? <Loader2 className="size-3 animate-spin" />
                  : <Trash2 className="size-3" />
                }
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={locale === "cs" ? "Smazat pozici" : "Delete Position"}
        description={t("deletePositionConfirm")}
        confirmLabel={locale === "cs" ? "Smazat" : "Delete"}
        cancelLabel={locale === "cs" ? "Zrušit" : "Cancel"}
        isLoading={deletingId !== null}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        variant="destructive"
      />
    </div>
  );
}
