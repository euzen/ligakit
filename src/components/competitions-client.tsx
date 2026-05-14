"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Trophy, Users, CalendarDays, Plus, Lock, Globe,
  Search, LayoutGrid, List, MoreHorizontal, Pencil, ArrowUpDown,
} from "lucide-react";

interface Competition {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  isPublic: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  sport: { name: string; icon: string | null } | null;
  organizer: { id: string; name: string | null; email: string };
  teamCount: number;
  matchCount: number;
  playedCount: number;
  hasLive: boolean;
  isOwn: boolean;
}

interface Sport {
  name: string;
  icon: string | null;
}

interface Labels {
  title: string;
  subtitle: string;
  create: string;
  noCompetitions: string;
  noCompetitionsDesc: string;
  teamsCount: string;
  matchesCount: string;
  statusDRAFT: string;
  statusACTIVE: string;
  statusFINISHED: string;
  typeLEAGUE: string;
  typeCUP: string;
  typeTOURNAMENT: string;
}

interface Props {
  competitions: Competition[];
  sports: Sport[];
  locale: string;
  isAdmin: boolean;
  userId: string | null;
  labels: Labels;
}

const STATUS_ACCENT: Record<string, string> = {
  ACTIVE: "border-l-green-500",
  DRAFT: "border-l-yellow-400",
  FINISHED: "border-l-muted-foreground/30",
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  FINISHED: "bg-muted text-muted-foreground",
};

type SortKey = "createdAt" | "name" | "startDate";

export function CompetitionsClient({ competitions, sports, locale, isAdmin, labels }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterSport, setFilterSport] = useState<string>("ALL");
  const [filterOwn, setFilterOwn] = useState<"ALL" | "MINE">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const cs = locale === "cs";
  const fmt = (d: string) => new Date(d).toLocaleDateString(cs ? "cs-CZ" : "en-US", { day: "numeric", month: "short", year: "numeric" });

  const typeLabel: Record<string, string> = {
    LEAGUE: labels.typeLEAGUE,
    CUP: labels.typeCUP,
    TOURNAMENT: labels.typeTOURNAMENT,
  };
  const statusLabel: Record<string, string> = {
    DRAFT: labels.statusDRAFT,
    ACTIVE: labels.statusACTIVE,
    FINISHED: labels.statusFINISHED,
  };

  const filtered = useMemo(() => {
    let list = competitions.filter((c) => {
      if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
      if (filterType !== "ALL" && c.type !== filterType) return false;
      if (filterSport !== "ALL" && c.sport?.name !== filterSport) return false;
      if (filterOwn === "MINE" && !c.isOwn) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      let va: string, vb: string;
      if (sortKey === "name") { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (sortKey === "startDate") { va = a.startDate ?? a.createdAt; vb = b.startDate ?? b.createdAt; }
      else { va = a.createdAt; vb = b.createdAt; }
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [competitions, search, filterStatus, filterType, filterSport, filterOwn, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Trophy className="size-7" />
            {labels.title}
          </h1>
          <p className="text-muted-foreground mt-1">{labels.subtitle}</p>
        </div>
        <a
          href={`/${locale}/competitions/new`}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          {labels.create}
        </a>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={cs ? "Hledat soutěž…" : "Search competition…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        {/* Mine / All toggle */}
        <div className="flex rounded-lg border overflow-hidden text-sm">
          <button
            onClick={() => setFilterOwn("ALL")}
            className={`px-3 h-9 transition-colors ${filterOwn === "ALL" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {cs ? "Vše" : "All"}
          </button>
          <button
            onClick={() => setFilterOwn("MINE")}
            className={`px-3 h-9 transition-colors ${filterOwn === "MINE" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {cs ? "Moje" : "Mine"}
          </button>
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">{cs ? "Všechny stavy" : "All statuses"}</option>
          <option value="ACTIVE">{labels.statusACTIVE}</option>
          <option value="DRAFT">{labels.statusDRAFT}</option>
          <option value="FINISHED">{labels.statusFINISHED}</option>
        </select>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-9 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">{cs ? "Všechny typy" : "All types"}</option>
          <option value="LEAGUE">{labels.typeLEAGUE}</option>
          <option value="CUP">{labels.typeCUP}</option>
          <option value="TOURNAMENT">{labels.typeTOURNAMENT}</option>
        </select>

        {/* Sport filter */}
        {sports.length > 0 && (
          <select
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
            className="h-9 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">{cs ? "Všechny sporty" : "All sports"}</option>
            {sports.map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        )}

        {/* Sort */}
        <div className="flex rounded-lg border overflow-hidden text-sm">
          {([["createdAt", cs ? "Datum" : "Date"], ["name", cs ? "Název" : "Name"], ["startDate", cs ? "Začátek" : "Start"]] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`px-2.5 h-9 flex items-center gap-1 transition-colors ${sortKey === key ? "bg-muted font-medium" : "hover:bg-muted/50"}`}
            >
              {label}
              {sortKey === key && <ArrowUpDown className="size-3 opacity-60" />}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border overflow-hidden ml-auto">
          <button
            onClick={() => setView("grid")}
            className={`p-2 h-9 w-9 flex items-center justify-center transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 h-9 w-9 flex items-center justify-center transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {/* Results count */}
      {filtered.length !== competitions.length && (
        <p className="text-sm text-muted-foreground">
          {cs ? `Zobrazeno ${filtered.length} z ${competitions.length}` : `Showing ${filtered.length} of ${competitions.length}`}
        </p>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
          <Trophy className="size-12 opacity-20" />
          <p className="font-medium">{search || filterStatus !== "ALL" || filterType !== "ALL" ? (cs ? "Žádné výsledky" : "No results") : labels.noCompetitions}</p>
          <p className="text-sm">{search || filterStatus !== "ALL" || filterType !== "ALL" ? (cs ? "Zkuste upravit filtry" : "Try adjusting filters") : labels.noCompetitionsDesc}</p>
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="relative group">
              <a href={`/${locale}/competitions/${c.id}`} className="block h-full">
                <Card className={`h-full transition-all hover:shadow-md border-l-4 ${STATUS_ACCENT[c.status] ?? "border-l-transparent"}`}>
                  <CardContent className="pt-5 space-y-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {c.sport?.icon ? (
                          <img src={c.sport.icon} alt={c.sport.name} className="size-8 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                            <Trophy className="size-4 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h2 className="font-semibold truncate group-hover:text-primary transition-colors leading-tight">
                            {c.name}
                          </h2>
                          {isAdmin && (
                            <p className="text-xs text-muted-foreground truncate">{c.organizer.name ?? c.organizer.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {c.hasLive && (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                            <span className="size-2 rounded-full bg-red-500 animate-pulse inline-block" />
                            LIVE
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status] ?? ""}`}>
                          {statusLabel[c.status]}
                        </span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-xs">{typeLabel[c.type]}</Badge>
                      <Badge variant="outline" className="text-xs gap-1">
                        {c.isPublic
                          ? <><Globe className="size-3" />{cs ? "Veřejný" : "Public"}</>
                          : <><Lock className="size-3" />{cs ? "Soukromý" : "Private"}</>}
                      </Badge>
                      {c.sport && !c.sport.icon && (
                        <Badge variant="outline" className="text-xs">{c.sport.name}</Badge>
                      )}
                    </div>

                    {/* Description */}
                    {c.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" />
                        {c.teamCount} {labels.teamsCount.toLowerCase()}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {c.playedCount}/{c.matchCount} {labels.matchesCount.toLowerCase()}
                      </span>
                      {(c.startDate || c.endDate) && (
                        <span className="ml-auto">
                          {c.startDate ? fmt(c.startDate) : "?"}{c.endDate ? ` – ${fmt(c.endDate)}` : ""}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </a>

              {/* Context menu */}
              {c.isOwn || isAdmin ? (
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={(e) => { e.preventDefault(); setOpenMenu(openMenu === c.id ? null : c.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-muted transition-all"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                  {openMenu === c.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-7 z-20 bg-popover border rounded-lg shadow-lg py-1 min-w-36 text-sm">
                        <a
                          href={`/${locale}/competitions/${c.id}/edit`}
                          className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted transition-colors"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Pencil className="size-3.5" />
                          {cs ? "Upravit" : "Edit"}
                        </a>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && filtered.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">{cs ? "Název" : "Name"}</th>
                <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">{cs ? "Typ" : "Type"}</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">{cs ? "Sport" : "Sport"}</th>
                <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">{cs ? "Organizátor" : "Organizer"}</th>
                <th className="text-center px-4 py-2.5 font-medium hidden sm:table-cell">{labels.teamsCount}</th>
                <th className="text-center px-4 py-2.5 font-medium hidden md:table-cell">{labels.matchesCount}</th>
                <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">{cs ? "Datum" : "Date"}</th>
                <th className="text-left px-4 py-2.5 font-medium">{cs ? "Stav" : "Status"}</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3">
                    <a href={`/${locale}/competitions/${c.id}`} className="flex items-center gap-2 font-medium hover:text-primary transition-colors">
                      {c.sport?.icon
                        ? <img src={c.sport.icon} alt="" className="size-5 rounded object-cover shrink-0" />
                        : <Trophy className="size-4 text-muted-foreground shrink-0" />}
                      <span className="truncate max-w-40">{c.name}</span>
                      {c.hasLive && <span className="size-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{typeLabel[c.type]}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.sport?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell truncate max-w-32">{c.organizer.name ?? c.organizer.email}</td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">{c.teamCount}</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">{c.playedCount}/{c.matchCount}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                    {c.startDate ? fmt(c.startDate) : "—"}
                    {c.endDate ? ` – ${fmt(c.endDate)}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status] ?? ""}`}>
                      {statusLabel[c.status]}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    {(c.isOwn || isAdmin) && (
                      <a
                        href={`/${locale}/competitions/${c.id}/edit`}
                        className="p-1.5 rounded hover:bg-muted transition-all inline-flex text-muted-foreground hover:text-foreground"
                        title={cs ? "Upravit" : "Edit"}
                      >
                        <Pencil className="size-3.5" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
