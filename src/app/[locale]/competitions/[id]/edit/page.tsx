import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompetitionForm } from "@/components/competition-form";
import { ConfirmDeleteCompetition } from "@/components/confirm-delete-competition";
import { Trophy } from "lucide-react";

export default async function EditCompetitionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("competitions");

  const competition = await prisma.competition.findUnique({
    where: { id },
    select: {
      id: true, name: true, description: true, type: true, status: true,
      isPublic: true, sportId: true, startDate: true, endDate: true, organizerId: true,
      periodCount: true, periodDuration: true, maxTeams: true, allowWaitlist: true,
    },
  });
  if (!competition) notFound();

  const isAdmin = session.user.role === "ADMINISTRATOR";
  const isOrganizer = competition.organizerId === session.user.id;
  if (!isAdmin && !isOrganizer) redirect(`/${locale}/competitions`);

  const sports = await prisma.sport.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, icon: true } });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: locale === "cs" ? "Přehled" : "Dashboard", href: `/${locale}/dashboard` },
            { label: t("title"), href: `/${locale}/competitions` },
            { label: competition.name, href: `/${locale}/competitions/${id}` },
            { label: locale === "cs" ? "Upravit" : "Edit" },
          ]} />

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Trophy className="size-7" />
              {t("editTitle")}
            </h1>
            <ConfirmDeleteCompetition competitionId={id} locale={locale} />
          </div>

          <CompetitionForm
            locale={locale}
            sports={sports}
            competitionId={id}
            initialValues={competition}
            backHref={`/${locale}/competitions/${id}`}
          />
        </div>
      </main>
    </div>
  );
}
