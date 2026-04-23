import { getTranslations } from "next-intl/server";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dumbbell, Tag } from "lucide-react";
import { SportManager } from "@/components/sport-manager";
import { PositionManager } from "@/components/position-manager";
import { Breadcrumbs } from "@/components/breadcrumbs";

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

  const sports = await prisma.sport.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { teams: true } },
      positions: {
        orderBy: { name: "asc" },
        include: { _count: { select: { players: true } } },
      },
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: locale === "cs" ? "Administrace" : "Admin", href: `/${locale}/admin` },
            { label: locale === "cs" ? "Číselník sportů" : "Sports Registry" },
          ]} />

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Dumbbell className="size-7" />
                {t("title")}
              </h1>
              <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {t("totalSports")}: {sports.length}
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: sport management */}
            <Card>
              <CardHeader>
                <CardTitle>{t("addSport")}</CardTitle>
                <CardDescription>{t("subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <SportManager locale={locale} sports={sports} />
              </CardContent>
            </Card>

            {/* Right: positions per sport */}
            <div className="space-y-4">
              {sports.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    {locale === "cs" ? "Nejdříve přidejte sport." : "Add a sport first."}
                  </CardContent>
                </Card>
              ) : (
                sports.map((sport) => (
                  <Card key={sport.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {sport.icon ? (
                          <img src={sport.icon} alt={sport.name} className="size-5 object-cover rounded-sm" />
                        ) : (
                          <Dumbbell className="size-4 text-muted-foreground" />
                        )}
                        {sport.name}
                        <Badge variant="outline" className="ml-auto text-xs">
                          <Tag className="size-3 mr-1" />
                          {sport.positions.length} {t("positions")}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{t("positionsTitle")}</CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4">
                      <PositionManager
                        sportId={sport.id}
                        locale={locale}
                        initialPositions={sport.positions}
                      />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
