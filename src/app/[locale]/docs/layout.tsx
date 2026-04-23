import { Navbar } from "@/components/navbar";
import { DocsNav } from "@/components/docs-nav";
import { BookOpen } from "lucide-react";

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar locale={locale} />

      {/* Docs header bar */}
      <div className="border-b bg-muted/40">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <BookOpen className="size-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">{cs ? "Dokumentace" : "Documentation"}</span>
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-60 shrink-0">
          <div className="sticky top-24">
            <DocsNav locale={locale} />
          </div>
        </aside>

        {/* Divider */}
        <div className="hidden md:block w-px bg-border shrink-0" />

        {/* Content */}
        <main className="flex-1 min-w-0 max-w-3xl">
          {children}
        </main>
      </div>
    </div>
  );
}
