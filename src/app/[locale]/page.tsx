import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import {
  Users,
  Trophy,
  Dumbbell,
  Shield,
  ArrowRight,
  Check,
  ChevronRight,
  UserPlus,
  ListChecks,
} from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (session) redirect(`/${locale}/dashboard`);

  const t = await getTranslations("landing");
  const tCommon = await getTranslations("common");

  const features = [
    { icon: Users,    title: t("feature1Title"), desc: t("feature1Desc"), gradient: "from-blue-500/20 to-blue-500/5",   iconBg: "bg-blue-500/10 text-blue-500" },
    { icon: Trophy,   title: t("feature2Title"), desc: t("feature2Desc"), gradient: "from-amber-500/20 to-amber-500/5", iconBg: "bg-amber-500/10 text-amber-500" },
    { icon: Dumbbell, title: t("feature3Title"), desc: t("feature3Desc"), gradient: "from-green-500/20 to-green-500/5", iconBg: "bg-green-500/10 text-green-500" },
    { icon: Shield,   title: t("feature4Title"), desc: t("feature4Desc"), gradient: "from-violet-500/20 to-violet-500/5", iconBg: "bg-violet-500/10 text-violet-500" },
  ];

  const steps = [
    { icon: UserPlus,   num: "1", label: t("step1"), desc: t("step1Desc") },
    { icon: Users,      num: "2", label: t("step2"), desc: t("step2Desc") },
    { icon: ListChecks, num: "3", label: t("step3"), desc: t("step3Desc") },
  ];

  const perks = locale === "cs"
    ? ["Bezplatná registrace", "Žádná kreditní karta", "Okamžitý přístup"]
    : ["Free to sign up", "No credit card", "Instant access"];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar locale={locale} />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden py-28 sm:py-36 px-4">
        {/* mesh gradient */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full bg-primary/8 blur-[120px] dark:bg-primary/12" />
          <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] rounded-full bg-blue-500/8 blur-[100px] dark:bg-blue-500/10" />
          <div className="absolute bottom-0 -left-32 w-[350px] h-[350px] rounded-full bg-violet-500/8 blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-10">
          {/* badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {tCommon("appName")}
          </span>

          {/* headline */}
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[1.05]">
            {(() => {
              const words = t("heroTitle").split(" ");
              const rest = words.slice(0, -1).join(" ");
              const last = words[words.length - 1];
              return (
                <>
                  {rest}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-primary">{last}</span>
                    <span
                      aria-hidden
                      className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/15 rounded-full -z-10"
                    />
                  </span>
                </>
              );
            })()}
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("heroSubtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={`/${locale}/register`}
              className="group inline-flex items-center gap-2 h-12 px-7 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              {t("heroCta")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href={`/${locale}/login`}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-2xl border border-border bg-background/80 backdrop-blur text-foreground font-medium text-sm hover:bg-muted transition-colors"
            >
              {t("heroLogin")}
              <ChevronRight className="size-4 text-muted-foreground" />
            </a>
          </div>

          {/* perks row */}
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-green-500 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <p className="text-xs font-bold tracking-widest uppercase text-primary">{t("featuresTitle")}</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{t("featuresSubtitle")}</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc, gradient, iconBg }) => (
              <div
                key={title}
                className={`relative rounded-3xl border border-border bg-gradient-to-b ${gradient} p-6 space-y-4 hover:-translate-y-1 transition-transform duration-200`}
              >
                <div className={`inline-flex items-center justify-center size-12 rounded-2xl ${iconBg}`}>
                  <Icon className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-24 px-4 bg-muted/40 border-y border-border">
        <div className="max-w-4xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-primary">{t("stepsTitle")}</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{t("stepsSubtitle")}</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map(({ icon: Icon, num, label, desc }, i) => (
              <div key={num} className="relative flex flex-col gap-5 rounded-3xl border border-border bg-background p-7">
                {/* connector line */}
                {i < steps.length - 1 && (
                  <span aria-hidden className="hidden sm:block absolute top-10 -right-3 w-6 h-px bg-border z-10" />
                )}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-2xl bg-primary text-primary-foreground font-black text-sm">
                    {num}
                  </div>
                  <Icon className="size-5 text-muted-foreground" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-bold text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden py-28 px-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-primary/5 dark:bg-primary/8" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
        </div>
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight">{t("ctaTitle")}</h2>
          <p className="text-lg text-muted-foreground">{t("ctaSubtitle")}</p>
          <a
            href={`/${locale}/register`}
            className="group inline-flex items-center gap-2 h-13 px-9 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5"
          >
            {t("ctaButton")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-foreground">{tCommon("appName")}</span>
            <span className="text-border">·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href={`/${locale}/login`} className="hover:text-foreground transition-colors">
              {locale === "cs" ? "Přihlásit se" : "Sign in"}
            </a>
            <a
              href={`/${locale}/register`}
              className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
            >
              {locale === "cs" ? "Registrovat se" : "Sign up"}
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
