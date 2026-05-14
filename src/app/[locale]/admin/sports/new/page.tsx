import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NewSportForm } from "./form";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewSportPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await auth();

  if (!session) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMINISTRATOR") redirect(`/${locale}/dashboard`);

  const cs = locale === "cs";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar locale={locale} />
      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Breadcrumbs items={[
          { label: cs ? "Administrace" : "Admin", href: `/${locale}/admin` },
          { label: cs ? "Správa sportů" : "Sports Management", href: `/${locale}/admin/sports` },
          { label: cs ? "Nový sport" : "New Sport" },
        ]} />
        <NewSportForm locale={locale} />
      </main>
    </div>
  );
}
