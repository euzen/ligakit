import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NewEventTypeForm } from "./form";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function NewEventTypePage({ params }: PageProps) {
  const { locale, id } = await params;
  const session = await auth();

  if (!session) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMINISTRATOR") redirect(`/${locale}/dashboard`);

  const cs = locale === "cs";

  const sport = await prisma.sport.findUnique({ where: { id } });
  if (!sport) redirect(`/${locale}/admin/sports`);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar locale={locale} />
      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Breadcrumbs items={[
          { label: cs ? "Administrace" : "Admin", href: `/${locale}/admin` },
          { label: cs ? "Správa sportů" : "Sports Management", href: `/${locale}/admin/sports` },
          { label: sport.name, href: `/${locale}/admin/sports/${id}` },
          { label: cs ? "Nová událost" : "New Event" },
        ]} />
        <NewEventTypeForm locale={locale} sportId={id} sportName={sport.name} />
      </main>
    </div>
  );
}
