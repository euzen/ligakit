import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { TeamForm } from "@/components/team-form";
import { ArrowLeft } from "lucide-react";

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const [team, sports] = await Promise.all([
    prisma.team.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, email: true } } },
    }),
    prisma.sport.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!team) notFound();

  const isAdmin = session.user.role === "ADMINISTRATOR";
  const isOwner = team.ownerId === session.user.id;

  if (!isAdmin && !isOwner) redirect(`/${locale}/teams`);

  const t = await getTranslations("teams");
  const backHref = isAdmin ? `/${locale}/admin/teams` : `/${locale}/teams`;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <a
              href={backHref}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              {t("backToTeams")}
            </a>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("editTitle")}</h1>
            {isAdmin && !isOwner && (
              <p className="text-sm text-muted-foreground mt-1">
                {t("owner")}: {team.owner.name ?? team.owner.email}
              </p>
            )}
          </div>

          <TeamForm
            locale={locale}
            teamId={team.id}
            initialValues={{
              name: team.name,
              description: team.description,
              logoUrl: team.logoUrl,
              sportId: team.sportId,
            }}
            sports={sports}
            backHref={backHref}
            isAdmin={isAdmin && !isOwner}
          />
        </div>
      </main>
    </div>
  );
}
