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
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Dumbbell, Trophy, Users, ArrowRight, Plus, AlertCircle } from "lucide-react";
import { SportsDocs } from "@/components/sports-docs";


export default async function AdminSportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMINISTRATOR") redirect(`/${locale}/dashboard`);

  const t = await getTranslations("sports");
  const cs = locale === "cs";

  const sports = await prisma.sport.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { teams: true, competitions: true } }
    }
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: cs ? "Administrace" : "Admin", href: `/${locale}/admin` },
            { label: cs ? "Správa sportů" : "Sports Management" },
          ]} />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Dumbbell className="size-7" />
                {cs ? "Správa sportů" : "Sports Management"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {cs 
                  ? "Konfigurace sportů, událostí a výchozích pravidel" 
                  : "Configure sports, events and default rules"}
              </p>
            </div>
            <a href={`/${locale}/admin/sports/new`} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="size-4" />
              {cs ? "Přidat sport" : "Add sport"}
            </a>
          </div>

          <SportsDocs locale={locale} />

          {/* Sports Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sports.map((sport) => (
              <a
                key={sport.id}
                href={`/${locale}/admin/sports/${sport.id}`}
                className="group block"
              >
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {sport.icon ? (
                            <img src={sport.icon} alt={sport.name} className="size-6 object-cover rounded" />
                          ) : (
                            <Dumbbell className="size-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                            {sport.name}
                            {!sport.isActive && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                                <AlertCircle className="size-2.5" />
                                {cs ? "Neaktivní" : "Inactive"}
                              </span>
                            )}
                          </CardTitle>
                        </div>
                      </div>
                      <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="size-4" />
                        {sport._count.competitions}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="size-4" />
                        {sport._count.teams}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>

          {sports.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Dumbbell className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {cs ? "Zatím nemáte žádné sporty" : "No sports yet"}
                </p>
                <a href={`/${locale}/admin/sports/new`} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Plus className="size-4" />
                  {cs ? "Vytvořit první sport" : "Create first sport"}
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
