import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Plus, Pencil, Calendar, Share2, History } from "lucide-react";
import { TeamDeleteButton } from "@/components/team-delete-button";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("teams");

  const teams = await prisma.team.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { sport: { select: { id: true, name: true, icon: true } } },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
              <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
            </div>
            <a
              href={`/${locale}/teams/new`}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors self-start sm:self-auto"
            >
              <Plus className="size-4" />
              {t("createTeam")}
            </a>
          </div>

          {teams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="p-4 rounded-full bg-muted">
                  <Users className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{t("noTeams")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("noTeamsDesc")}</p>
                </div>
                <a
                  href={`/${locale}/teams/new`}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  <Plus className="size-4" />
                  {t("createTeam")}
                </a>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <Card key={team.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          className="size-10 rounded-lg object-cover border shrink-0"
                        />
                      ) : (
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="size-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{team.name}</CardTitle>
                        {team.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col justify-end gap-3">
                    <Separator />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {new Date(team.createdAt).toLocaleDateString(
                          locale === "cs" ? "cs-CZ" : "en-US",
                        )}
                      </div>
                      {team.sport && (
                        <Badge variant="outline" className="text-xs shrink-0 flex items-center gap-1">
                          {team.sport.icon && (
                            <img src={team.sport.icon} alt="" className="size-3.5 object-cover rounded-sm" />
                          )}
                          {team.sport.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`/${locale}/teams/${team.id}`}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <Pencil className="size-3.5" />
                        {t("editTeam")}
                      </a>
                      <a
                        href={`/${locale}/teams/${team.id}/roster`}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <Users className="size-3.5" />
                        {locale === "cs" ? "Soupiska" : "Roster"}
                      </a>
                      <a
                        href={`/${locale}/teams/${team.id}/matches`}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <History className="size-3.5" />
                        {locale === "cs" ? "Archiv zápasů" : "Match archive"}
                      </a>
                      <a
                        href={`/${locale}/teams/${team.id}/public`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <Share2 className="size-3.5" />
                        {locale === "cs" ? "Veřejný profil" : "Public Profile"}
                      </a>
                      <TeamDeleteButton
                        teamId={team.id}
                        locale={locale}
                        confirmText={t("deleteConfirm")}
                        successText={t("teamDeleted")}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
