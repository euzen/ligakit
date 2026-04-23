import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProfileForm } from "@/components/profile-form";
import { AvatarUpload } from "@/components/avatar-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Mail } from "lucide-react";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("profile");
  const tRoles = await getTranslations("roles");

  const [user, teamCount, playerCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true, password: true, image: true },
    }),
    prisma.team.count({ where: { ownerId: session.user.id } }),
    prisma.player.count({ where: { team: { ownerId: session.user.id } } }),
  ]);
  if (!user) redirect(`/${locale}/login`);

  const hasPassword = !!user.password;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: locale === "cs" ? "Přehled" : "Dashboard", href: `/${locale}/dashboard` },
            { label: t("title") },
          ]} />

          {/* Header */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
              <p className="text-muted-foreground mt-0.5">{t("subtitle")}</p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <AvatarUpload
                currentImage={user.image}
                name={user.name}
                email={user.email}
                locale={locale}
              />
            </CardContent>
          </Card>

          {/* Info card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-4 shrink-0" />
                  <span className="font-medium text-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4 shrink-0" />
                  {t("memberSince")} {new Date(user.createdAt).toLocaleDateString(locale === "cs" ? "cs-CZ" : "en-US")}
                </div>
                <Badge variant={user.role === "ADMINISTRATOR" ? "default" : "secondary"} className="w-fit">
                  {tRoles(user.role)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Activity stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <svg className="size-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{teamCount}</p>
                    <p className="text-xs text-muted-foreground">{locale === "cs" ? "Týmy" : "Teams"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-green-500/10">
                    <svg className="size-5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{playerCount}</p>
                    <p className="text-xs text-muted-foreground">{locale === "cs" ? "Hráči celkem" : "Total players"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <ProfileForm
            locale={locale}
            initialName={user.name ?? ""}
            email={user.email ?? ""}
            hasPassword={hasPassword}
          />
        </div>
      </main>
    </div>
  );
}
