"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Trash2, Loader2 } from "lucide-react";

interface ConfirmDeleteCompetitionProps {
  competitionId: string;
  locale: string;
}

export function ConfirmDeleteCompetition({ competitionId, locale }: ConfirmDeleteCompetitionProps) {
  const t = useTranslations("competitions");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t("competitionDeleted"));
        router.push(`/${locale}/competitions`);
        router.refresh();
      } else {
        toast.error("Error");
      }
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        {locale === "cs" ? "Smazat soutěž" : "Delete competition"}
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={locale === "cs" ? "Smazat soutěž" : "Delete competition"}
        description={t("deleteConfirm")}
        confirmLabel={locale === "cs" ? "Smazat" : "Delete"}
        cancelLabel={locale === "cs" ? "Zrušit" : "Cancel"}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
