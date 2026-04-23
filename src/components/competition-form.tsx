"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Lock, Globe } from "lucide-react";

interface Sport { id: string; name: string; icon: string | null }

interface CompetitionFormProps {
  locale: string;
  sports: Sport[];
  competitionId?: string;
  initialValues?: {
    name: string;
    description?: string | null;
    type: string;
    status: string;
    isPublic?: boolean;
    sportId?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    periodCount?: number | null;
    periodDuration?: number | null;
    maxTeams?: number | null;
    allowWaitlist?: boolean;
  };
  backHref: string;
}

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["LEAGUE", "CUP", "TOURNAMENT"]),
  status: z.enum(["DRAFT", "ACTIVE", "FINISHED"]),
  isPublic: z.boolean(),
  sportId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  periodCount: z.string().optional(),
  periodDuration: z.string().optional(),
  maxTeams: z.string().optional(),
  allowWaitlist: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function toDateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function CompetitionForm({
  locale,
  sports,
  competitionId,
  initialValues,
  backHref,
}: CompetitionFormProps) {
  const t = useTranslations("competitions");
  const router = useRouter();
  const isEdit = !!competitionId;
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      type: (initialValues?.type as FormValues["type"]) ?? "LEAGUE",
      status: (initialValues?.status as FormValues["status"]) ?? "DRAFT",
      isPublic: initialValues?.isPublic ?? true,
      sportId: initialValues?.sportId ?? "",
      startDate: toDateInput(initialValues?.startDate),
      endDate: toDateInput(initialValues?.endDate),
      periodCount: initialValues?.periodCount ? String(initialValues.periodCount) : "",
      periodDuration: initialValues?.periodDuration ? String(initialValues.periodDuration) : "",
      maxTeams: initialValues?.maxTeams ? String(initialValues.maxTeams) : "",
      allowWaitlist: initialValues?.allowWaitlist ?? false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    const url = isEdit ? `/api/competitions/${competitionId}` : "/api/competitions";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        description: values.description,
        type: values.type,
        status: values.status,
        isPublic: values.isPublic,
        sportId: values.sportId || null,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        periodCount: values.periodCount ? Number(values.periodCount) : null,
        periodDuration: values.periodDuration ? Number(values.periodDuration) : null,
        maxTeams: values.maxTeams ? Number(values.maxTeams) : null,
        allowWaitlist: values.allowWaitlist,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setServerError(d.error === "NAME_REQUIRED" ? t("fieldRequired") : (d.error ?? "Error"));
      return;
    }

    const data = await res.json();
    toast.success(isEdit ? t("competitionUpdated") : t("competitionCreated"));
    router.push(`/${locale}/competitions/${data.id}`);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <a href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </a>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{isEdit ? t("editTitle") : t("createTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("name")} *</Label>
              <Input id="name" placeholder={t("namePlaceholder")} {...register("name")} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive">{t("fieldRequired")}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="desc">{t("description")}</Label>
              <Textarea id="desc" placeholder={t("descriptionPlaceholder")} rows={3} {...register("description")} />
            </div>

            {/* Visibility */}
            <div className="space-y-1.5">
              <Label>{locale === "cs" ? "Viditelnost" : "Visibility"}</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setValue("isPublic", true)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    watch("isPublic")
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <Globe className="size-4" />
                  {locale === "cs" ? "Veřejný" : "Public"}
                </button>
                <button
                  type="button"
                  onClick={() => setValue("isPublic", false)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    !watch("isPublic")
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <Lock className="size-4" />
                  {locale === "cs" ? "Soukromý" : "Private"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {watch("isPublic")
                  ? (locale === "cs" ? "Veřejný turnaj — správci týmů si přihlašují sami" : "Public — team owners register themselves")
                  : (locale === "cs" ? "Soukromý — vidíte jen vy, týmy zadáváte sami" : "Private — only you see it, you add teams manually")
                }
              </p>
            </div>

            {/* Type + Status */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("type")} *</Label>
                <Select value={watch("type")} onValueChange={(v) => setValue("type", v as FormValues["type"])}>
                  <SelectTrigger>
                    <SelectValue>{t(`type${watch("type")}`)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(["LEAGUE", "CUP", "TOURNAMENT"] as const).map((v) => (
                      <SelectItem key={v} value={v}>{t(`type${v}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("status")}</Label>
                <Select value={watch("status")} onValueChange={(v) => setValue("status", v as FormValues["status"])}>
                  <SelectTrigger>
                    <SelectValue>{t(`status${watch("status")}`)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(["DRAFT", "ACTIVE", "FINISHED"] as const).map((v) => (
                      <SelectItem key={v} value={v}>{t(`status${v}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sport */}
            <div className="space-y-1.5">
              <Label>{t("sport")}</Label>
              <Select value={watch("sportId") ?? ""} onValueChange={(v) => setValue("sportId", v || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("sportPlaceholder")}>
                    {sports.find((s) => s.id === watch("sportId"))?.name ?? t("sportPlaceholder")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("noSport")}</SelectItem>
                  {sports.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">{t("startDate")}</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">{t("endDate")}</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
              </div>
            </div>

            {/* Team capacity */}
            <div className="space-y-1.5">
              <Label>{locale === "cs" ? "Kapacita týmů" : "Team capacity"}</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="maxTeams" className="text-xs text-muted-foreground">
                    {locale === "cs" ? "Max. počet týmů" : "Max teams"}
                  </Label>
                  <Input
                    id="maxTeams"
                    type="number"
                    min={1}
                    placeholder={locale === "cs" ? "neomezeno" : "unlimited"}
                    {...register("maxTeams")}
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end">
                  <div className="flex items-center gap-2 pb-1">
                    <input
                      type="checkbox"
                      id="allowWaitlist"
                      className="size-4 rounded border-gray-300"
                      {...register("allowWaitlist")}
                    />
                    <Label htmlFor="allowWaitlist" className="text-sm cursor-pointer">
                      {locale === "cs" ? "Povolit náhradníky" : "Allow waitlist"}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {locale === "cs"
                      ? "Týmy nad limit se zařadí jako náhradníci"
                      : "Teams over the limit join as waitlisted"}
                  </p>
                </div>
              </div>
            </div>

            {/* Period settings */}
            <div className="space-y-1.5">
              <Label>{locale === "cs" ? "Nastavení částí zápasu" : "Match period settings"}</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="periodCount" className="text-xs text-muted-foreground">
                    {locale === "cs" ? "Počet částí" : "Number of periods"}
                  </Label>
                  <Input
                    id="periodCount"
                    type="number"
                    min={1}
                    max={4}
                    placeholder={locale === "cs" ? "např. 2" : "e.g. 2"}
                    {...register("periodCount")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="periodDuration" className="text-xs text-muted-foreground">
                    {locale === "cs" ? "Délka části (minuty)" : "Period duration (minutes)"}
                  </Label>
                  <Input
                    id="periodDuration"
                    type="number"
                    min={1}
                    max={90}
                    placeholder={locale === "cs" ? "např. 45" : "e.g. 45"}
                    {...register("periodDuration")}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {locale === "cs"
                  ? "Prázdné = standardní nastavení (2 × 45 min). Toto ovlivní časomíru na ovládacím panelu."
                  : "Empty = default (2 × 45 min). This affects the timer on the control panel."}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {t("saveCompetition")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
