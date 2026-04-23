import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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
import { User, Mail, Calendar, ShieldCheck } from "lucide-react";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("dashboard");
  const tRoles = await getTranslations("roles");

  const isAdmin = session.user.role === "ADMINISTRATOR";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("welcome", { name: session.user.name ?? session.user.email })}
            </h1>
            <p className="text-muted-foreground mt-1">{t("title")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="size-4" />
                  {t("accountInfo")}
                </CardTitle>
                <CardDescription>{t("yourAccount")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Separator />
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("email")}</p>
                    <p className="text-sm font-medium">{session.user.email}</p>
                  </div>
                </div>
                {session.user.name && (
                  <div className="flex items-center gap-3">
                    <User className="size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {locale === "cs" ? "Jméno" : "Name"}
                      </p>
                      <p className="text-sm font-medium">{session.user.name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("role")}</p>
                    <Badge
                      variant={isAdmin ? "default" : "secondary"}
                      className="mt-0.5"
                    >
                      {tRoles(session.user.role)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    {locale === "cs" ? "Administrace" : "Admin Panel"}
                  </CardTitle>
                  <CardDescription>
                    {locale === "cs"
                      ? "Přístup k administrátorskému rozhraní"
                      : "Access the admin interface"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-3" />
                  <a
                    href={`/${locale}/admin`}
                    className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    {locale === "cs" ? "Otevřít administraci" : "Open Admin Panel"}
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
