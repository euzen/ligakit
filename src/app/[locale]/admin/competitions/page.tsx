import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AdminSearchInput } from "@/components/admin-search-input";
import { AdminPagination } from "@/components/admin-pagination";
import { AdminDeleteCompetition } from "@/components/admin-delete-competition";
import { Trophy, Plus, Users, CalendarDays } from "lucide-react";
import { Suspense } from "react";

const PAGE_SIZE = 20;
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  FINISHED: "outline",
};

export default async function AdminCompetitionsPage({
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

  const t = await getTranslations("competitions");

  const page = Math.max(1, parseInt(pageStr) || 1);
  const where = q
    ? { OR: [{ name: { contains: q } }, { description: { contains: q } }] }
    : {};

  const [competitions, total] = await Promise.all([
    prisma.competition.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        sport: { select: { name: true } },
        organizer: { select: { name: true, email: true } },
        _count: { select: { teams: true, matches: true } },
      },
    }),
    prisma.competition.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: locale === "cs" ? "Administrace" : "Admin", href: `/${locale}/admin` },
            { label: t("title") },
          ]} />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="size-5" />
                    {t("title")}
                  </CardTitle>
                  <CardDescription>{locale === "cs" ? "Celkem soutěží" : "Total competitions"}: {total}</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Suspense>
                    <AdminSearchInput placeholder={locale === "cs" ? "Hledat soutěž…" : "Search competition…"} />
                  </Suspense>
                  <a
                    href={`/${locale}/competitions/new`}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="size-4" />
                    {t("create")}
                  </a>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {competitions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t("noCompetitions")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("type")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("sport")}</TableHead>
                      <TableHead>{t("organizer")}</TableHead>
                      <TableHead className="text-center">
                        <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{t("teamsCount")}</span>
                      </TableHead>
                      <TableHead className="text-center">
                        <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{t("matchesCount")}</span>
                      </TableHead>
                      <TableHead className="text-right">{locale === "cs" ? "Akce" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          <a
                            href={`/${locale}/competitions/${c.id}`}
                            className="hover:text-primary hover:underline transition-colors"
                          >
                            {c.name}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{t(`type${c.type}`)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[c.status]} className="text-xs">
                            {t(`status${c.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {c.sport?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.organizer.name ?? c.organizer.email}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{c._count.teams}</TableCell>
                        <TableCell className="text-center tabular-nums">{c._count.matches}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`/${locale}/competitions/${c.id}/edit`}
                              className="inline-flex items-center justify-center h-7 px-2 rounded text-xs border hover:bg-muted transition-colors"
                            >
                              {locale === "cs" ? "Upravit" : "Edit"}
                            </a>
                            <AdminDeleteCompetition competitionId={c.id} locale={locale} />
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
