import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompetitionForm } from "@/components/competition-form";
import { Trophy } from "lucide-react";

export default async function NewCompetitionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("competitions");
  const sports = await prisma.sport.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, icon: true } });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: locale === "cs" ? "Přehled" : "Dashboard", href: `/${locale}/dashboard` },
            { label: t("title"), href: `/${locale}/competitions` },
            { label: t("createTitle") },
          ]} />

          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Trophy className="size-7" />
            {t("createTitle")}
          </h1>

          <CompetitionForm
            locale={locale}
            sports={sports}
            backHref={`/${locale}/competitions`}
          />
        </div>
      </main>
    </div>
  );
}
