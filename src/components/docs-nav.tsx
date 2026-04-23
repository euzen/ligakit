"use client";

import { usePathname } from "next/navigation";
import { BookOpen, Users, Trophy, Zap, HelpCircle, ChevronRight } from "lucide-react";

interface DocsNavProps {
  locale: string;
}

const getNav = (locale: string, cs: boolean) => [
  {
    label: cs ? "Začínáme" : "Getting Started",
    icon: Zap,
    items: [
      { slug: "introduction", label: cs ? "Úvod" : "Introduction" },
      { slug: "quick-start", label: cs ? "Rychlý start" : "Quick Start" },
      { slug: "account", label: cs ? "Účet a profil" : "Account & Profile" },
    ],
  },
  {
    label: cs ? "Týmy" : "Teams",
    icon: Users,
    items: [
      { slug: "teams/create", label: cs ? "Vytvoření týmu" : "Create a Team" },
      { slug: "teams/players", label: cs ? "Správa hráčů" : "Managing Players" },
      { slug: "teams/sports", label: cs ? "Sporty a pozice" : "Sports & Positions" },
    ],
  },
  {
    label: cs ? "Soutěže" : "Competitions",
    icon: Trophy,
    items: [
      { slug: "competitions/types", label: cs ? "Typy soutěží" : "Competition Types" },
      { slug: "competitions/create", label: cs ? "Vytvoření soutěže" : "Create Competition" },
      { slug: "competitions/teams", label: cs ? "Přidání týmů" : "Adding Teams" },
      { slug: "competitions/draw", label: cs ? "Losování" : "Draw / Schedule" },
      { slug: "competitions/cup", label: cs ? "CUP — skupiny a pavouk" : "CUP — Groups & Bracket" },
    ],
  },
  {
    label: cs ? "Zápasy" : "Matches",
    icon: BookOpen,
    items: [
      { slug: "matches/results", label: cs ? "Zadávání výsledků" : "Entering Results" },
      { slug: "matches/live", label: cs ? "Živé skóre" : "Live Score" },
    ],
  },
  {
    label: "FAQ",
    icon: HelpCircle,
    items: [
      { slug: "faq", label: "FAQ" },
    ],
  },
];

export function DocsNav({ locale }: DocsNavProps) {
  const cs = locale === "cs";
  const pathname = usePathname();
  const nav = getNav(locale, cs);

  return (
    <nav className="space-y-1">
      {nav.map((section) => (
        <div key={section.label} className="pb-4">
          {/* Section header */}
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <div className="p-1 rounded-md bg-muted">
              <section.icon className="size-3 text-muted-foreground" />
            </div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {section.label}
            </span>
          </div>

          {/* Items */}
          <ul className="space-y-0.5 pl-1">
            {section.items.map((item) => {
              const href = `/${locale}/docs/${item.slug}`;
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={item.slug}>
                  <a
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {isActive && <ChevronRight className="size-3 shrink-0 opacity-70" />}
                    {!isActive && <span className="size-3 shrink-0" />}
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
