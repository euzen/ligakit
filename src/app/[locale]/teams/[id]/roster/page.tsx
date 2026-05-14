import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { RosterManager } from "@/components/roster-manager";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default async function RosterPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: teamId } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      sport: {
        include: {
          positions: { orderBy: { name: "asc" } },
        },
      },
      players: {
        orderBy: [{ number: "asc" }, { name: "asc" }],
        include: { position: { select: { id: true, name: true, labelCs: true, labelEn: true } } },
      },
    },
  });

  if (!team) notFound();

  const isAdmin = session.user.role === "ADMINISTRATOR";
  const isOwner = team.ownerId === session.user.id;
  if (!isAdmin && !isOwner) redirect(`/${locale}/teams`);

  const t = await getTranslations("roster");
  const backHref = isAdmin && !isOwner ? `/${locale}/admin/teams` : `/${locale}/teams`;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: isAdmin && !isOwner ? (locale === "cs" ? "Admin" : "Admin") : (locale === "cs" ? "Moje týmy" : "My Teams"), href: backHref },
            { label: team.name, href: `/${locale}/teams/${teamId}` },
            { label: t("title") },
          ]} />

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Users className="size-7" />
                {t("title")}
              </h1>
              <p className="text-muted-foreground mt-1">
                {team.name}
                {team.sport && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    {team.sport.icon && (
                      <img src={team.sport.icon} alt="" className="size-4 object-cover rounded-sm" />
                    )}
                    {team.sport.name}
                  </span>
                )}
              </p>
            </div>
            <Badge variant="secondary">
              {team.players.length} {t("subtitle")}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <RosterManager
                teamId={teamId}
                locale={locale}
                initialPlayers={team.players}
                positions={team.sport?.positions ?? []}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
