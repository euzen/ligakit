import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import { Users, Dumbbell, Hash, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

export default async function PublicTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, id } = await params;
  const { page: pageStr = "1" } = await searchParams;
  const t = await getTranslations("teams");

  const page = Math.max(1, parseInt(pageStr) || 1);

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      sport: { select: { name: true, icon: true } },
      owner: { select: { name: true, email: true } },
      _count: { select: { players: true } },
    },
  });

  if (!team) notFound();

  const totalPlayers = team._count.players;
  const totalPages = Math.max(1, Math.ceil(totalPlayers / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const players = await prisma.player.findMany({
    where: { teamId: id },
    orderBy: [{ number: "asc" }, { name: "asc" }],
    include: { position: { select: { name: true } } },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start gap-6">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="size-20 rounded-2xl object-cover border shrink-0 shadow-sm"
              />
            ) : (
              <div className="size-20 rounded-2xl border bg-muted flex items-center justify-center shrink-0">
                <Users className="size-9 text-muted-foreground" />
              </div>
            )}
            <div className="space-y-2 min-w-0">
              <h1 className="text-3xl font-bold tracking-tight truncate">{team.name}</h1>
              {team.description && (
                <p className="text-muted-foreground">{team.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {team.sport && (
                  <Badge variant="secondary" className="flex items-center gap-1.5">
                    {team.sport.icon ? (
                      <img src={team.sport.icon} alt="" className="size-3.5 object-cover rounded-sm" />
                    ) : (
                      <Dumbbell className="size-3.5" />
                    )}
                    {team.sport.name}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {locale === "cs" ? "Manažer:" : "Manager:"}{" "}
                  <span className="font-medium text-foreground">
                    {team.owner.name ?? team.owner.email}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                {t("roster")} ({totalPlayers})
              </CardTitle>
              {totalPages > 1 && (
                <span className="text-sm text-muted-foreground">
                  {locale === "cs" ? `Strana ${currentPage} z ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {totalPlayers === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t("noPlayers")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">
                      <Hash className="size-3.5" />
                    </TableHead>
                    <TableHead>{t("playerName")}</TableHead>
                    <TableHead>{t("position")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-mono text-muted-foreground">
                        {player.number ?? "—"}
                      </TableCell>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>
                        {player.position ? (
                          <Badge variant="outline">{player.position.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {currentPage > 1 ? (
                  <a
                    href={`?page=${currentPage - 1}`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-sm hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                    {locale === "cs" ? "Předchozí" : "Previous"}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-sm opacity-40 cursor-not-allowed">
                    <ChevronLeft className="size-4" />
                    {locale === "cs" ? "Předchozí" : "Previous"}
                  </span>
                )}
                <span className="text-sm text-muted-foreground px-2">
                  {currentPage} / {totalPages}
                </span>
                {currentPage < totalPages ? (
                  <a
                    href={`?page=${currentPage + 1}`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-sm hover:bg-muted transition-colors"
                  >
                    {locale === "cs" ? "Další" : "Next"}
                    <ChevronRight className="size-4" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-sm opacity-40 cursor-not-allowed">
                    {locale === "cs" ? "Další" : "Next"}
                    <ChevronRight className="size-4" />
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {locale === "cs" ? "Sdílitelný odkaz na veřejný profil týmu" : "Shareable link to team public profile"}
          {" · "}
          <a href={`/${locale}`} className="text-primary hover:underline">LigaKit</a>
        </p>
      </main>
    </div>
  );
}
