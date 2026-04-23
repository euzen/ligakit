import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Pencil } from "lucide-react";
import { TeamDeleteButton } from "@/components/team-delete-button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AdminSearchInput } from "@/components/admin-search-input";
import { AdminPagination } from "@/components/admin-pagination";
import { Suspense } from "react";

const PAGE_SIZE = 20;

export default async function AdminTeamsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { q = "", page: pageStr = "1" } = await searchParams;
  const session = await auth();

  if (!session) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMINISTRATOR") redirect(`/${locale}/dashboard`);

  const t = await getTranslations("admin");
  const tTeams = await getTranslations("teams");

  const page = Math.max(1, parseInt(pageStr) || 1);
  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { owner: { email: { contains: q } } },
          { owner: { name: { contains: q } } },
        ],
      }
    : {};

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        sport: { select: { id: true, name: true, icon: true } },
      },
    }),
    prisma.team.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: locale === "cs" ? "Administrace" : "Admin", href: `/${locale}/admin` },
            { label: t("teams") },
          ]} />

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("teams")}</h1>
            <p className="text-muted-foreground mt-1">{t("teamsDesc")}</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="size-5" />
                    {t("teams")}
                  </CardTitle>
                  <CardDescription>{t("totalTeams")}: {total}</CardDescription>
                </div>
                <Suspense>
                  <AdminSearchInput placeholder={locale === "cs" ? "Hledat název nebo vlastníka…" : "Search name or owner…"} />
                </Suspense>
              </div>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t("noTeams")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("teamName")}</TableHead>
                      <TableHead>{t("teamOwner")}</TableHead>
                      <TableHead>{locale === "cs" ? "Sport" : "Sport"}</TableHead>
                      <TableHead>{t("teamCreated")}</TableHead>
                      <TableHead className="text-right">
                        {locale === "cs" ? "Akce" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {team.logoUrl ? (
                              <img
                                src={team.logoUrl}
                                alt={team.name}
                                className="size-8 rounded object-cover border shrink-0"
                              />
                            ) : (
                              <div className="size-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                <Users className="size-4 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{team.name}</p>
                              {team.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {team.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {team.owner.name ?? team.owner.email}
                        </TableCell>
                        <TableCell>
                          {team.sport ? (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              {team.sport.icon && (
                                <img src={team.sport.icon} alt="" className="size-3.5 object-cover rounded-sm" />
                              )}
                              {team.sport.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(team.createdAt).toLocaleDateString(
                            locale === "cs" ? "cs-CZ" : "en-US",
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <a
                              href={`/${locale}/teams/${team.id}/roster`}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
                            >
                              <Users className="size-3.5" />
                              {locale === "cs" ? "Soupiska" : "Roster"}
                            </a>
                            <a
                              href={`/${locale}/teams/${team.id}`}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
                            >
                              <Pencil className="size-3.5" />
                              {tTeams("editTeam")}
                            </a>
                            <TeamDeleteButton
                              teamId={team.id}
                              locale={locale}
                              confirmText={t("deleteTeamConfirm")}
                              successText={t("teamDeleted")}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Suspense>
                <AdminPagination page={page} totalPages={totalPages} locale={locale} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
