"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Check, X, Plus, Loader2, Dumbbell, ImagePlus } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Sport {
  id: string;
  name: string;
  icon: string | null;
  _count: { teams: number };
}

interface SportManagerProps {
  locale: string;
  sports: Sport[];
}

export function SportManager({ locale, sports: initialSports }: SportManagerProps) {
  const t = useTranslations("sports");
  const router = useRouter();

  const [sports, setSports] = useState(initialSports);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newIconFile, setNewIconFile] = useState<File | null>(null);
  const [newIconPreview, setNewIconPreview] = useState<string>("");
  const [addError, setAddError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const addFileRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIconFile, setEditIconFile] = useState<File | null>(null);
  const [editIconPreview, setEditIconPreview] = useState<string>("");
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const uploadIcon = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/sports/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url as string;
  };

  const handleFileChange = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (s: string) => void,
  ) => {
    if (!file) { setFile(null); setPreview(""); return; }
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!newName.trim()) { setAddError(t("fieldRequired")); return; }
    setIsAdding(true);
    try {
      let iconUrl: string | null = null;
      if (newIconFile) {
        iconUrl = await uploadIcon(newIconFile);
        if (!iconUrl) { setAddError(locale === "cs" ? "Chyba při nahrávání ikony" : "Error uploading icon"); return; }
      }
      const res = await fetch("/api/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, icon: iconUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error === "NAME_EXISTS" ? t("nameExists") : data.error);
        return;
      }
      toast.success(t("sportCreated"));
      setSports((prev) => [...prev, { ...data, _count: { teams: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewIconFile(null);
      setNewIconPreview("");
      if (addFileRef.current) addFileRef.current.value = "";
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (sport: Sport) => {
    setEditingId(sport.id);
    setEditName(sport.name);
    setEditIconFile(null);
    setEditIconPreview(sport.icon ?? "");
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
    setEditIconFile(null);
    setEditIconPreview("");
  };

  const handleSave = async (id: string) => {
    setEditError("");
    if (!editName.trim()) { setEditError(t("fieldRequired")); return; }
    setIsSaving(true);
    try {
      let iconUrl: string | undefined = undefined;
      if (editIconFile) {
        const uploaded = await uploadIcon(editIconFile);
        if (!uploaded) { setEditError(locale === "cs" ? "Chyba při nahrávání ikony" : "Error uploading icon"); return; }
        iconUrl = uploaded;
      }
      const res = await fetch(`/api/sports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, ...(iconUrl !== undefined && { icon: iconUrl }) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error === "NAME_EXISTS" ? t("nameExists") : data.error);
        return;
      }
      toast.success(t("sportUpdated"));
      setSports((prev) =>
        prev.map((s) => (s.id === id ? { ...s, name: data.name, icon: data.icon } : s))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
      setEditIconFile(null);
      setEditIconPreview("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/sports/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t("sportDeleted"));
        setSports((prev) => prev.filter((s) => s.id !== id));
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(locale === "cs" ? "Chyba při mazání" : "Error deleting");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form onSubmit={handleAdd} className="space-y-3">
        {addError && (
          <Alert variant="destructive">
            <AlertDescription>{addError}</AlertDescription>
          </Alert>
        )}
        <div className="flex gap-3 items-end">
          {/* Icon upload */}
          <div className="shrink-0">
            <Label className="text-xs mb-1 block">{t("sportIcon")}</Label>
            <button
              type="button"
              onClick={() => addFileRef.current?.click()}
              disabled={isAdding}
              className="size-12 rounded-lg border-2 border-dashed border-border hover:border-primary/60 transition-colors flex items-center justify-center overflow-hidden bg-muted/40 shrink-0"
            >
              {newIconPreview ? (
                <Image src={newIconPreview} alt="" width={48} height={48} className="object-cover size-full" unoptimized />
              ) : (
                <ImagePlus className="size-5 text-muted-foreground" />
              )}
            </button>
            <input
              ref={addFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null, setNewIconFile, setNewIconPreview)}
            />
          </div>
          {/* Name input */}
          <div className="flex-1">
            <Label htmlFor="newName" className="text-xs mb-1 block">{t("sportName")} *</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("sportNamePlaceholder")}
              disabled={isAdding}
              required
            />
          </div>
          <Button type="submit" disabled={isAdding} className="shrink-0">
            {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {t("addSport")}
          </Button>
        </div>
      </form>

      <Separator />

      {/* Sports list */}
      {sports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center text-muted-foreground">
          <Dumbbell className="size-10 opacity-30" />
          <p>{t("noSports")}</p>
          <p className="text-sm">{t("noSportsDesc")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sports.map((sport) => (
            <li key={sport.id} className="rounded-lg border bg-card">
              {editingId === sport.id ? (
                <div className="p-3 space-y-2">
                  {editError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">{editError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2 items-center">
                    {/* Edit icon upload */}
                    <button
                      type="button"
                      onClick={() => editFileRef.current?.click()}
                      disabled={isSaving}
                      className="size-10 rounded-lg border-2 border-dashed border-border hover:border-primary/60 transition-colors flex items-center justify-center overflow-hidden bg-muted/40 shrink-0"
                      title={locale === "cs" ? "Změnit ikonu" : "Change icon"}
                    >
                      {editIconPreview ? (
                        <Image src={editIconPreview} alt="" width={40} height={40} className="object-cover size-full" unoptimized />
                      ) : (
                        <ImagePlus className="size-4 text-muted-foreground" />
                      )}
                    </button>
                    <input
                      ref={editFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files?.[0] ?? null, setEditIconFile, setEditIconPreview)}
                    />
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                      disabled={isSaving}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSave(sport.id)}
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
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="size-9 rounded-lg overflow-hidden shrink-0 bg-muted flex items-center justify-center border">
                    {sport.icon ? (
                      <Image src={sport.icon} alt={sport.name} width={36} height={36} className="object-cover size-full" unoptimized />
                    ) : (
                      <Dumbbell className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="flex-1 font-medium">{sport.name}</span>
                  <Badge variant="secondary" className="shrink-0">
                    {sport._count.teams} {t("teams")}
                  </Badge>
                  <button
                    onClick={() => startEdit(sport)}
                    className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(sport.id)}
                    disabled={deletingId === sport.id}
                    className="inline-flex items-center justify-center size-8 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    {deletingId === sport.id
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
        title={locale === "cs" ? "Smazat sport" : "Delete Sport"}
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
