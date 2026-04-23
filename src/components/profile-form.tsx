"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileNameSchema,
  type ProfileNameValues,
} from "@/lib/schemas";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, KeyRound, Eye, EyeOff } from "lucide-react";

interface ProfileFormProps {
  locale: string;
  initialName: string;
  email: string;
  hasPassword: boolean;
  adminMode?: { targetUserId: string };
}

export function ProfileForm({ locale, initialName, email, hasPassword, adminMode }: ProfileFormProps) {
  const t = useTranslations("profile");
  const { update: updateSession } = useSession();

  const apiUrl = adminMode
    ? `/api/admin/users/${adminMode.targetUserId}/profile`
    : "/api/profile";

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [nameServerError, setNameServerError] = useState("");
  const [pwServerError, setPwServerError] = useState("");

  // Two static schemas — admin skips currentPassword
  const adminPwSchema = z.object({
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(1),
  }).refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "mismatch" });

  const userPwSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(1),
  }).refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "mismatch" });

  type AdminPwValues = z.infer<typeof adminPwSchema>;
  type UserPwValues = z.infer<typeof userPwSchema>;

  const nameForm = useForm<ProfileNameValues>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: { name: initialName },
  });

  const adminPwForm = useForm<AdminPwValues>({ resolver: zodResolver(adminPwSchema) });
  const userPwForm = useForm<UserPwValues>({ resolver: zodResolver(userPwSchema) });

  const onSaveName = async (values: ProfileNameValues) => {
    setNameServerError("");
    const res = await fetch(apiUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "name", name: values.name }),
    });
    if (!res.ok) { setNameServerError(locale === "cs" ? "Chyba při ukládání" : "Error saving"); return; }
    if (!adminMode) await updateSession({ name: values.name?.trim() || null });
    toast.success(t("infoSaved"));
  };

  const handlePwResponse = async (res: Response) => {
    const data = await res.json();
    if (!res.ok) {
      if (data.error === "WRONG_PASSWORD") setPwServerError(t("wrongPassword"));
      else if (data.error === "PASSWORD_TOO_SHORT") setPwServerError(t("passwordTooShort"));
      else setPwServerError(locale === "cs" ? "Chyba při změně hesla" : "Error changing password");
      return false;
    }
    return true;
  };

  const onSaveAdminPw = async (values: AdminPwValues) => {
    setPwServerError("");
    const res = await fetch(apiUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "password", newPassword: values.newPassword }),
    });
    if (await handlePwResponse(res)) { adminPwForm.reset(); toast.success(t("passwordSaved")); }
  };

  const onSaveUserPw = async (values: UserPwValues) => {
    setPwServerError("");
    const res = await fetch(apiUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "password", currentPassword: values.currentPassword, newPassword: values.newPassword }),
    });
    if (await handlePwResponse(res)) { userPwForm.reset(); toast.success(t("passwordSaved")); }
  };

  return (
    <div className="space-y-6">
      {/* Name card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            {t("infoTitle")}
          </CardTitle>
          <CardDescription>{t("infoDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={nameForm.handleSubmit(onSaveName)} className="space-y-4">
            {nameServerError && (
              <Alert variant="destructive"><AlertDescription>{nameServerError}</AlertDescription></Alert>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("nameLabel")}</Label>
                <Input
                  id="name"
                  placeholder={t("namePlaceholder")}
                  disabled={nameForm.formState.isSubmitting}
                  {...nameForm.register("name")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("emailLabel")}</Label>
                <Input value={email} disabled className="bg-muted/50 cursor-not-allowed" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={nameForm.formState.isSubmitting} size="sm">
                {nameForm.formState.isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                {t("saveInfo")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4" />
            {t("passwordTitle")}
          </CardTitle>
          <CardDescription>{t("passwordDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasPassword && !adminMode ? (
            <p className="text-sm text-muted-foreground py-2">
              {locale === "cs"
                ? "Váš účet nemá nastavené heslo (přihlášení přes OAuth)."
                : "Your account has no password (OAuth sign-in)."}
            </p>
          ) : adminMode ? (
            /* Admin form — no current password field */
            <form onSubmit={adminPwForm.handleSubmit(onSaveAdminPw)} className="space-y-4">
              {pwServerError && (
                <Alert variant="destructive"><AlertDescription>{pwServerError}</AlertDescription></Alert>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw-a">{t("newPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="new-pw-a"
                      type={showNew ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-9"
                      aria-invalid={!!adminPwForm.formState.errors.newPassword}
                      {...adminPwForm.register("newPassword")}
                    />
                    <button type="button" onClick={() => setShowNew((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {adminPwForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive">{t("passwordTooShort")}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw-a">{t("confirmPassword")}</Label>
                  <Input
                    id="confirm-pw-a"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!adminPwForm.formState.errors.confirmPassword}
                    {...adminPwForm.register("confirmPassword")}
                  />
                  {adminPwForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">{t("passwordMismatch")}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={adminPwForm.formState.isSubmitting} size="sm">
                  {adminPwForm.formState.isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                  {t("savePassword")}
                </Button>
              </div>
            </form>
          ) : (
            /* User form — requires current password */
            <form onSubmit={userPwForm.handleSubmit(onSaveUserPw)} className="space-y-4">
              {pwServerError && (
                <Alert variant="destructive"><AlertDescription>{pwServerError}</AlertDescription></Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="current-pw">{t("currentPassword")}</Label>
                <div className="relative">
                  <Input
                    id="current-pw"
                    type={showCurrent ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-9"
                    aria-invalid={!!userPwForm.formState.errors.currentPassword}
                    {...userPwForm.register("currentPassword")}
                  />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {userPwForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">{locale === "cs" ? "Povinné pole" : "Required"}</p>
                )}
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">{t("newPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="new-pw"
                      type={showNew ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-9"
                      aria-invalid={!!userPwForm.formState.errors.newPassword}
                      {...userPwForm.register("newPassword")}
                    />
                    <button type="button" onClick={() => setShowNew((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {userPwForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive">{t("passwordTooShort")}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw">{t("confirmPassword")}</Label>
                  <Input
                    id="confirm-pw"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!userPwForm.formState.errors.confirmPassword}
                    {...userPwForm.register("confirmPassword")}
                  />
                  {userPwForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">{t("passwordMismatch")}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={userPwForm.formState.isSubmitting} size="sm">
                  {userPwForm.formState.isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                  {t("savePassword")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
