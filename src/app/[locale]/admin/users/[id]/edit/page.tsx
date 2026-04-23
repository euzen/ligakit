import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProfileForm } from "@/components/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Calendar, Mail } from "lucide-react";

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();

  if (!session) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMINISTRATOR") redirect(`/${locale}/dashboard`);

  const tRoles = await getTranslations("roles");
  const tProfile = await getTranslations("profile");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, password: true },
  });
  if (!user) redirect(`/${locale}/admin/users`);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: locale === "cs" ? "Administrace" : "Admin", href: `/${locale}/admin` },
            { label: locale === "cs" ? "Uživatelé" : "Users", href: `/${locale}/admin/users` },
            { label: user.name ?? user.email ?? id },
          ]} />

          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary">
              <UserCircle className="size-9" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {locale === "cs" ? "Upravit uživatele" : "Edit User"}
              </h1>
              <p className="text-muted-foreground mt-0.5">
                {locale === "cs" ? "Správa účtu jako administrátor" : "Managing account as administrator"}
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-4 shrink-0" />
                  <span className="font-medium text-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4 shrink-0" />
                  {tProfile("memberSince")} {new Date(user.createdAt).toLocaleDateString(locale === "cs" ? "cs-CZ" : "en-US")}
                </div>
                <Badge variant={user.role === "ADMINISTRATOR" ? "default" : "secondary"} className="w-fit">
                  {tRoles(user.role)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <ProfileForm
            locale={locale}
            initialName={user.name ?? ""}
            email={user.email ?? ""}
            hasPassword={!!user.password}
            adminMode={{ targetUserId: id }}
          />
        </div>
      </main>
    </div>
  );
}
