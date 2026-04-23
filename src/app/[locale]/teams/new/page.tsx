import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { TeamForm } from "@/components/team-form";
import { ArrowLeft } from "lucide-react";

export default async function NewTeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("teams");
  const sports = await prisma.sport.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <a
              href={`/${locale}/teams`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              {t("backToTeams")}
            </a>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("createTeam")}</h1>
          <TeamForm locale={locale} backHref={`/${locale}/teams`} sports={sports} />
        </div>
      </main>
    </div>
  );
}
