"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teamSchema, type TeamValues } from "@/lib/schemas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ImagePlus, X } from "lucide-react";

interface Sport {
  id: string;
  name: string;
  icon: string | null;
}

interface TeamFormProps {
  locale: string;
  teamId?: string;
  initialValues?: {
    name: string;
    description?: string | null;
    logoUrl?: string | null;
    sportId?: string | null;
  };
  sports?: Sport[];
  backHref: string;
  isAdmin?: boolean;
}

export function TeamForm({
  locale,
  teamId,
  initialValues,
  sports = [],
  backHref,
  isAdmin = false,
}: TeamFormProps) {
  const t = useTranslations("teams");
  const router = useRouter();

  const [sportId, setSportId] = useState<string>(initialValues?.sportId ?? "");
  const [serverError, setServerError] = useState("");

  // Logo upload state
  const [logoPreview, setLogoPreview] = useState<string>(initialValues?.logoUrl ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!teamId;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
    },
  });

  const handleLogoChange = (file: File | null) => {
    if (!file) { setLogoFile(null); setLogoPreview(initialValues?.logoUrl ?? ""); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return logoPreview || null;
    setIsUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", logoFile);
      const res = await fetch("/api/teams/upload", { method: "POST", body: fd });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url as string;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const onSubmit = async (values: TeamValues) => {
    setServerError("");
    let logoUrl: string | null = null;
    if (logoFile) {
      logoUrl = await uploadLogo();
      if (logoUrl === null && logoFile) {
        setServerError(locale === "cs" ? "Chyba při nahrávání loga" : "Error uploading logo");
        return;
      }
    } else {
      logoUrl = logoPreview || null;
    }

    try {
      const url = isEdit ? `/api/teams/${teamId}` : "/api/teams";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          logoUrl,
          sportId: sportId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error === "NAME_REQUIRED" ? t("fieldRequired") : data.error);
        return;
      }
      toast.success(isEdit ? t("teamUpdated") : t("teamCreated"));
      router.push(backHref);
      router.refresh();
    } catch {
      setServerError(locale === "cs" ? "Neočekávaná chyba" : "Unexpected error");
    }
  };

  const isBusy = isSubmitting || isUploadingLogo;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{isEdit ? t("editTitle") : t("createTeam")}</CardTitle>
        {isAdmin && isEdit && (
          <CardDescription className="text-amber-600 dark:text-amber-400">
            {t("managedByAdmin")}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">{t("teamName")} *</Label>
            <Input
              id="name"
              placeholder={t("teamNamePlaceholder")}
              disabled={isBusy}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{t("fieldRequired")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">{t("teamDescription")}</Label>
            <Input
              id="description"
              placeholder={t("teamDescriptionPlaceholder")}
              disabled={isBusy}
              {...register("description")}
            />
          </div>

          {/* Logo upload */}
          <div className="space-y-1.5">
            <Label>{t("teamLogo")}</Label>
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <div className="relative size-16 shrink-0">
                  <img
                    src={logoPreview}
                    alt="logo"
                    className="size-16 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(""); if (logoInputRef.current) logoInputRef.current.value = ""; }}
                    className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="size-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0 bg-muted/30">
                  <ImagePlus className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                  className="hidden"
                  onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {isUploadingLogo && <Loader2 className="size-3.5 animate-spin" />}
                  {locale === "cs" ? "Vybrat soubor" : "Choose file"}
                </Button>
                <p className="text-xs text-muted-foreground">PNG, JPG, WebP, SVG · max 2 MB</p>
              </div>
            </div>
          </div>

          {sports.length > 0 && (
            <div className="space-y-1.5">
              <Label>{t("sport")}</Label>
              <div className="flex items-center gap-2">
                {(() => {
                  const selected = sports.find((s) => s.id === sportId);
                  return selected?.icon ? (
                    <img src={selected.icon} alt={selected.name} className="size-8 object-cover rounded-md border shrink-0" />
                  ) : (
                    <div className="size-8 rounded-md border bg-muted shrink-0 flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">?</span>
                    </div>
                  );
                })()}
                <Select value={sportId} onValueChange={(val) => setSportId(val ?? "")} disabled={isBusy}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t("sportPlaceholder")}>
                      {sports.find((s) => s.id === sportId)?.name ?? t("sportPlaceholder")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("noSport")}</SelectItem>
                    {sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        <span className="flex items-center gap-2">
                          {sport.icon ? (
                            <img src={sport.icon} alt="" className="size-4 object-cover rounded-sm shrink-0" />
                          ) : (
                            <span className="size-4 shrink-0" />
                          )}
                          {sport.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isBusy}>
              {isBusy && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? t("saveTeam") : t("createButton")}
            </Button>
            <a
              href={backHref}
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
            >
              {t("backToTeams")}
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
