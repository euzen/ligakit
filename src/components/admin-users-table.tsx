"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UserActionsMenu } from "@/components/user-actions-menu";
import { ChevronUp, ChevronDown, ChevronsUpDown, Trash2, ShieldCheck, ShieldOff } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMINISTRATOR";
  createdAt: Date;
}

interface AdminUsersTableProps {
  users: User[];
  currentUserId: string;
  locale: string;
  sort: string;
  order: string;
  roleFilter: string;
}

function SortIcon({ col, sort, order }: { col: string; sort: string; order: string }) {
  if (sort !== col) return <ChevronsUpDown className="size-3.5 opacity-40" />;
  return order === "asc"
    ? <ChevronUp className="size-3.5" />
    : <ChevronDown className="size-3.5" />;
}

export function AdminUsersTable({
  users,
  currentUserId,
  locale,
  sort,
  order,
  roleFilter,
}: AdminUsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"delete" | "makeAdmin" | "makeUser" | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const isCS = locale === "cs";

  const updateParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  const handleSort = (col: string) => {
    if (sort === col) {
      updateParam("order", order === "asc" ? "desc" : "asc");
    } else {
      const p = new URLSearchParams(searchParams.toString());
      p.set("sort", col);
      p.set("order", "asc");
      p.delete("page");
      startTransition(() => router.push(`${pathname}?${p.toString()}`));
    }
  };

  const toggleAll = () => {
    if (selected.size === users.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const executeBulk = async () => {
    if (!bulkAction) return;
    setIsBusy(true);
    const ids = [...selected].filter((id) => id !== currentUserId);
    try {
      if (bulkAction === "delete") {
        await Promise.all(
          ids.map((id) =>
            fetch(`/api/admin/users/${id}`, { method: "DELETE" }),
          ),
        );
        toast.success(isCS ? `Smazáno ${ids.length} uživatelů` : `Deleted ${ids.length} users`);
      } else {
        const role = bulkAction === "makeAdmin" ? "ADMINISTRATOR" : "USER";
        await Promise.all(
          ids.map((id) =>
            fetch(`/api/admin/users/${id}/role`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role }),
            }),
          ),
        );
        toast.success(isCS ? `Role změněna pro ${ids.length} uživatelů` : `Role updated for ${ids.length} users`);
      }
      setSelected(new Set());
      router.refresh();
    } catch {
      toast.error(isCS ? "Chyba při provádění akce" : "Error performing action");
    } finally {
      setIsBusy(false);
      setBulkAction(null);
    }
  };

  const roleFilterOptions = [
    { value: "", label: isCS ? "Všechny role" : "All roles" },
    { value: "USER", label: isCS ? "Uživatelé" : "Users" },
    { value: "ADMINISTRATOR", label: isCS ? "Administrátoři" : "Admins" },
  ];

  const SortHead = ({ col, label, className }: { col: string; label: string; className?: string }) => (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground transition-colors${className ? ` ${className}` : ""}`}
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon col={col} sort={sort} order={order} />
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {roleFilterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParam("role", opt.value)}
            className={`h-8 px-3 rounded-lg text-sm border transition-colors ${
              roleFilter === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            }`}
          >
            {opt.label}
          </button>
        ))}

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span className="text-sm text-muted-foreground">
              {isCS ? `${selected.size} vybráno` : `${selected.size} selected`}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkAction("makeAdmin")}
              className="h-8 gap-1.5"
            >
              <ShieldCheck className="size-3.5" />
              {isCS ? "Povýšit na admina" : "Make Admin"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkAction("makeUser")}
              className="h-8 gap-1.5"
            >
              <ShieldOff className="size-3.5" />
              {isCS ? "Snížit na uživatele" : "Make User"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBulkAction("delete")}
              className="h-8 gap-1.5"
            >
              <Trash2 className="size-3.5" />
              {isCS ? "Smazat" : "Delete"}
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={selected.size === users.length && users.length > 0}
                ref={(el) => {
                  if (el) el.indeterminate = selected.size > 0 && selected.size < users.length;
                }}
                onChange={toggleAll}
                className="rounded border-border"
              />
            </TableHead>
            <SortHead col="name" label={isCS ? "Jméno" : "Name"} />
            <SortHead col="email" label="Email" className="hidden md:table-cell" />
            <SortHead col="role" label={isCS ? "Role" : "Role"} />
            <SortHead col="createdAt" label={isCS ? "Registrace" : "Registered"} className="hidden sm:table-cell" />
            <TableHead className="text-right">{isCS ? "Akce" : "Actions"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                {isCS ? "Žádní uživatelé" : "No users found"}
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} data-selected={selected.has(user.id)}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(user.id)}
                    onChange={() => toggleOne(user.id)}
                    className="rounded border-border"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {user.name ?? (
                    <span className="text-muted-foreground italic">
                      {isCS ? "Bez jména" : "No name"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "ADMINISTRATOR" ? "default" : "secondary"}>
                    {user.role === "ADMINISTRATOR"
                      ? (isCS ? "Administrátor" : "Administrator")
                      : (isCS ? "Uživatel" : "User")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                  {new Date(user.createdAt).toLocaleDateString(isCS ? "cs-CZ" : "en-US")}
                </TableCell>
                <TableCell className="text-right">
                  <UserActionsMenu
                    userId={user.id}
                    currentRole={user.role}
                    currentUserId={currentUserId}
                    locale={locale}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={bulkAction !== null}
        onOpenChange={(open) => { if (!open) setBulkAction(null); }}
        title={
          bulkAction === "delete"
            ? (isCS ? "Smazat vybrané" : "Delete selected")
            : bulkAction === "makeAdmin"
            ? (isCS ? "Povýšit na admina" : "Make Admin")
            : (isCS ? "Snížit na uživatele" : "Make User")
        }
        description={
          bulkAction === "delete"
            ? (isCS
                ? `Opravdu smazat ${selected.size} uživatelů? Akce je nevratná.`
                : `Really delete ${selected.size} users? This cannot be undone.`)
            : (isCS
                ? `Změnit roli pro ${selected.size} uživatelů?`
                : `Change role for ${selected.size} users?`)
        }
        confirmLabel={bulkAction === "delete" ? (isCS ? "Smazat" : "Delete") : (isCS ? "Potvrdit" : "Confirm")}
        cancelLabel={isCS ? "Zrušit" : "Cancel"}
        isLoading={isBusy}
        onConfirm={executeBulk}
        variant={bulkAction === "delete" ? "destructive" : "default"}
      />
    </div>
  );
}
