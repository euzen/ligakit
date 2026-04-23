"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Trash2, Loader2 } from "lucide-react";

interface AdminDeleteCompetitionProps {
  competitionId: string;
  locale: string;
}

export function AdminDeleteCompetition({ competitionId, locale }: AdminDeleteCompetitionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isCS = locale === "cs";

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(isCS ? "Soutěž byla smazána" : "Competition deleted");
        router.refresh();
      } else {
        toast.error(isCS ? "Chyba při mazání" : "Delete failed");
      }
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center size-7 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        title={isCS ? "Smazat" : "Delete"}
      >
        {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={isCS ? "Smazat soutěž" : "Delete competition"}
        description={isCS ? "Opravdu smazat tuto soutěž? Budou smazány i všechny zápasy." : "Really delete this competition? All matches will be deleted too."}
        confirmLabel={isCS ? "Smazat" : "Delete"}
        cancelLabel={isCS ? "Zrušit" : "Cancel"}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
