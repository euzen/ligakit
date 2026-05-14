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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex h-16 items-center justify-between">
          <a href={`/${locale}`} className="flex items-center gap-2 group">
            <div className="bg-blue-700 p-1.5 rounded-xl group-hover:rotate-6 transition-transform">
              <svg className="size-5 text-white fill-white" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              liga<span className="text-blue-700 font-light">kit</span>
            </span>
          </a>
          <a href={`/${locale}/register`} className="text-sm font-semibold text-slate-500 hover:text-blue-700 transition-colors">
            {t("noAccount")}{" "}
            <span className="text-blue-700">{t("registerLink")}</span>
          </a>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-blue-700 px-8 py-8">
              <h1 className="text-2xl font-extrabold text-white">{t("login")}</h1>
              <p className="text-blue-200 text-sm mt-1">{t("loginDesc")}</p>
            </div>
            <div className="p-8">
              <LoginForm locale={locale} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
