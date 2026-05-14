import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Dumbbell, Zap, Users, Trophy, ArrowLeft, Edit } from "lucide-react";
import { EventTypesPanel } from "./panels/event-types-panel";
import { PositionsPanel } from "./panels/positions-panel";
import { ConfigPanel } from "./panels/config-panel";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function SportDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const session = await auth();

  if (!session) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMINISTRATOR") redirect(`/${locale}/dashboard`);

  const cs = locale === "cs";

  const sport = await prisma.sport.findUnique({
    where: { id },
    include: {
      eventTypes: { orderBy: { sortOrder: "asc" } },
      positions:  { orderBy: { name: "asc" } },
      _count:     { select: { competitions: true, teams: true } },
    },
  });

  if (!sport) redirect(`/${locale}/admin/sports`);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar locale={locale} />
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Breadcrumbs items={[
          { label: cs ? "Administrace" : "Admin", href: `/${locale}/admin` },
          { label: cs ? "Správa sportů" : "Sports Management", href: `/${locale}/admin/sports` },
          { label: sport.name },
        ]} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <a href={`/${locale}/admin/sports`} className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all">
              <ArrowLeft className="size-5 text-slate-600" />
            </a>
            <div className="flex items-center gap-3">
              {sport.icon
                ? <img src={sport.icon} alt={sport.name} className="size-14 rounded-2xl object-cover border border-slate-200 shadow-sm" />
                : <div className="p-3.5 rounded-2xl bg-blue-100"><Dumbbell className="size-7 text-blue-700" /></div>
              }
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">{sport.name}</h1>
                {sport.description && <p className="text-sm text-slate-500 mt-0.5">{sport.description}</p>}
              </div>
            </div>
          </div>
          <a
            href={`/${locale}/admin/sports/${id}/edit`}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-blue-700 hover:text-blue-700 shadow-sm transition-all shrink-0"
          >
            <Edit className="size-4" />
            {cs ? "Upravit" : "Edit"}
          </a>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: <Trophy className="size-5 text-blue-700" />, label: cs ? "Soutěže" : "Competitions", value: sport._count.competitions },
            { icon: <Users className="size-5 text-blue-700" />,  label: cs ? "Týmy" : "Teams",           value: sport._count.teams },
            { icon: <Zap className="size-5 text-orange-500" />,  label: cs ? "Události" : "Event Types",  value: sport.eventTypes.length },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-blue-50">{s.icon}</div>
              <div>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Panels – always visible, stacked */}
        <EventTypesPanel
          sportId={id}
          initialEventTypes={sport.eventTypes}
          cs={cs}
        />

        <PositionsPanel
          sportId={id}
          initialPositions={sport.positions}
          cs={cs}
        />

        <ConfigPanel
          sportId={id}
          initialConfig={sport.config ?? ""}
          cs={cs}
        />
      </main>
    </div>
  );
}
