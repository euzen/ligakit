import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <a
              href={`/${locale}`}
              className="font-bold text-lg text-primary hover:opacity-80 transition-opacity"
            >
              {tCommon("appName")}
            </a>
            <a
              href={`/${locale}/register`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("noAccount")}{" "}
              <span className="text-primary font-medium">
                {t("registerLink")}
              </span>
            </a>
          </div>
        </div>
      </nav>
      <main className="flex flex-1 items-center justify-center p-6">
        <LoginForm locale={locale} />
      </main>
    </div>
  );
}
