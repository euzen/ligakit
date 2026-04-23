"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Shield, UserCheck, Trash2, Pencil } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface UserActionsMenuProps {
  userId: string;
  currentRole: "USER" | "ADMINISTRATOR";
  currentUserId: string;
  locale: string;
}

export function UserActionsMenu({
  userId,
  currentRole,
  currentUserId,
  locale,
}: UserActionsMenuProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isSelf = userId === currentUserId;

  const handleRoleChange = async (newRole: "USER" | "ADMINISTRATOR") => {
    if (newRole === currentRole) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast.success(t("roleChanged"));
        router.refresh();
      } else {
        toast.error(locale === "cs" ? "Chyba při změně role" : "Error changing role");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t("userDeleted"));
        setDeleteOpen(false);
        router.refresh();
      } else {
        toast.error(locale === "cs" ? "Chyba při mazání" : "Error deleting user");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSelf) {
    return (
      <span className="text-xs text-muted-foreground italic">
        {locale === "cs" ? "Váš účet" : "Your account"}
      </span>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger disabled={isLoading}>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreHorizontal className="size-4" />
            <span className="sr-only">{locale === "cs" ? "Akce" : "Actions"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => { window.location.href = `/${locale}/admin/users/${userId}/edit`; }}
          >
            <Pencil className="size-4" />
            {locale === "cs" ? "Upravit profil" : "Edit Profile"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {currentRole !== "ADMINISTRATOR" && (
            <DropdownMenuItem onClick={() => handleRoleChange("ADMINISTRATOR")}>
              <Shield className="size-4" />
              {locale === "cs" ? "Povýšit na administrátora" : "Promote to Administrator"}
            </DropdownMenuItem>
          )}
          {currentRole !== "USER" && (
            <DropdownMenuItem onClick={() => handleRoleChange("USER")}>
              <UserCheck className="size-4" />
              {locale === "cs" ? "Nastavit jako uživatele" : "Set as User"}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            variant="destructive"
          >
            <Trash2 className="size-4" />
            {t("deleteUser")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={locale === "cs" ? "Smazat uživatele" : "Delete User"}
        description={t("deleteConfirm")}
        confirmLabel={locale === "cs" ? "Smazat" : "Delete"}
        cancelLabel={locale === "cs" ? "Zrušit" : "Cancel"}
        isLoading={isLoading}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
