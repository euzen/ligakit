"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface TeamDeleteButtonProps {
  teamId: string;
  locale: string;
  confirmText: string;
  successText: string;
}

export function TeamDeleteButton({
  teamId,
  locale,
  confirmText,
  successText,
}: TeamDeleteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(successText);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(locale === "cs" ? "Chyba při mazání" : "Error deleting team");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-destructive/40 bg-destructive/5 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="size-3.5" />
        {locale === "cs" ? "Smazat" : "Delete"}
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={locale === "cs" ? "Smazat tým" : "Delete Team"}
        description={confirmText}
        confirmLabel={locale === "cs" ? "Smazat" : "Delete"}
        cancelLabel={locale === "cs" ? "Zrušit" : "Cancel"}
        isLoading={isLoading}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
