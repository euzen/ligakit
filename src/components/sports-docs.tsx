"use client";

import { useState } from "react";
import {
  BookOpen, ChevronDown, ChevronUp, Dumbbell, Zap, Settings2,
  Trophy, CheckCircle2, Code2, Lightbulb,
} from "lucide-react";

interface Props {
  locale: string;
}

// --- typed content blocks ---
type TextBlock    = { type: "text";     value: string };
type TipBlock     = { type: "tip";      value: string };
type CodeBlock    = { type: "code";     value: string };
type ListBlock    = { type: "list";     items: string[] };
type StepsBlock   = { type: "steps";    items: string[] };
type TableBlock   = { type: "table";    rows: [string, string][] };
type ExampleBlock = { type: "examples"; items: { name: string; config: string; events: string[] }[] };
type ContentBlock = TextBlock | TipBlock | CodeBlock | ListBlock | StepsBlock | TableBlock | ExampleBlock;

interface Section {
  icon: string;
  color: string;
  title: string;
  content: ContentBlock[];
}

interface DocContent {
  title: string;
  subtitle: string;
  toggle_open: string;
  toggle_close: string;
  sections: Section[];
}

const ENGINE_CONFIG_CODE = `// Generic engine - scores based on EventType records from DB:
{"engine": "generic"}

// Football - hardcoded logic (GOAL, OWN_GOAL):
{"engine": "football"}

// Extended configuration:
{
  "engine": "generic",
  "periods": 4,
  "periodDuration": 10,
  "overtimeAllowed": true
}`;

const CS: DocContent = {
  title: "Pruvodce spravou sportu",
  subtitle: "Vse, co potrebujete vedet pro nastaveni noveho sportu",
  toggle_open: "Zobrazit pruvodce",
  toggle_close: "Skryt pruvodce",
  sections: [
    {
      icon: "dumbbell", color: "blue",
      title: "1. Vytvoreni sportu",
      content: [
        { type: "text",  value: "Kliknete na tlacitko Pridat sport a vyplnte:" },
        { type: "list",  items: ["Nazev - libovolny (Fotbal, Basketbal, Florbal...)", "Popis - kratky text zobrazeny v prehledu", "Ikona - nahrajte obrazek (PNG, JPG, SVG, max 2 MB)"] },
        { type: "tip",   value: "Nazev musi byt unikatni v celem systemu." },
      ],
    },
    {
      icon: "zap", color: "orange",
      title: "2. Typy udalosti (EventTypes)",
      content: [
        { type: "text", value: "Typy udalosti definuji, co se muze stat behem zapasu. Kazdy typ ma:" },
        { type: "table", rows: [
          ["Technicky nazev",  "Velka pismena s podtrzitky: GOAL, POINT_2, ACE"],
          ["Popisek CS / EN",  "Co uvidi uzivatel v rozhodcim UI"],
          ["Bodova hodnota",   "Cislo prictene ke skore (napr. 1 pro gol, 3 pro trojku)"],
          ["Ovlivnuje skore",  "Zaskrtnute = pricte se k vysledku; nezaskrtnute = jen zaznam (karta, stridani)"],
          ["Barva",            "Barva tlacitka v rozhodcim UI"],
          ["Poradi",           "Cim nizsi cislo, tim vyse v seznamu"],
        ]},
        { type: "tip", value: "Udalosti bez bodove hodnoty (karty, fauly) nastavte s hodnotou prazdnou a Ovlivnuje skore vypnute." },
      ],
    },
    {
      icon: "settings", color: "slate",
      title: "3. Konfigurace enginu",
      content: [
        { type: "text", value: "V editaci sportu je pole Konfigurace enginu - JSON objekt s klicem engine:" },
        { type: "code", value: ENGINE_CONFIG_CODE },
        { type: "tip",  value: "Pokud necháte konfiguraci prázdnou, pouzije se generic engine automaticky." },
      ],
    },
    {
      icon: "trophy", color: "green",
      title: "4. Priklady sportu",
      content: [
        { type: "text", value: "Rychly prehled doporuceneho nastaveni:" },
        { type: "examples", items: [
          { name: "Fotbal",         config: '{"engine":"football"}',                              events: ["GOAL (hodnota 1, ovlivnuje skore)", "OWN_GOAL (hodnota 1, pricte souper)", "YELLOW_CARD (bez hodnoty)", "RED_CARD (bez hodnoty)"] },
          { name: "Basketbal",      config: '{"engine":"generic","periods":4,"periodDuration":10}', events: ["POINT_1 (hodnota 1)", "POINT_2 (hodnota 2)", "POINT_3 (hodnota 3)", "FOUL (bez hodnoty)"] },
          { name: "Volejbal",       config: '{"engine":"generic","periods":5}',                   events: ["POINT (hodnota 1)", "ACE (hodnota 1)", "BLOCK (bez hodnoty)"] },
          { name: "Florbal / Hokej",config: '{"engine":"football","periods":3,"periodDuration":20}', events: ["GOAL (hodnota 1)", "PENALTY_2MIN (bez hodnoty)", "PENALTY_5MIN (bez hodnoty)"] },
        ]},
      ],
    },
    {
      icon: "check", color: "green",
      title: "5. Doporuceny postup",
      content: [
        { type: "steps", items: [
          "Vytvorte sport (nazev + ikona)",
          "Prejdete na detail sportu - zalozka Udalosti",
          "Pridejte vsechny potrebne typy udalosti",
          "V editaci nastavte konfiguraci enginu (nebo nechte prazdnou)",
          "Vytvorte soutez a prirajte ji tento sport - vse ostatni je automaticke",
        ]},
      ],
    },
  ],
};

const EN: DocContent = {
  title: "Sports Management Guide",
  subtitle: "Everything you need to know to set up a new sport",
  toggle_open: "Show guide",
  toggle_close: "Hide guide",
  sections: [
    {
      icon: "dumbbell", color: "blue",
      title: "1. Create a Sport",
      content: [
        { type: "text", value: "Click Add sport and fill in:" },
        { type: "list", items: ["Name - any name (Football, Basketball, Floorball...)", "Description - short text shown in the overview", "Icon - upload an image (PNG, JPG, SVG, max 2 MB)"] },
        { type: "tip",  value: "The name must be unique across the entire system." },
      ],
    },
    {
      icon: "zap", color: "orange",
      title: "2. Event Types",
      content: [
        { type: "text", value: "Event types define what can happen during a match. Each type has:" },
        { type: "table", rows: [
          ["Technical name", "Uppercase with underscores: GOAL, POINT_2, ACE"],
          ["Label CS / EN",  "What the user sees in the referee UI"],
          ["Point value",    "Number added to the score (e.g. 1 for a goal, 3 for a three-pointer)"],
          ["Affects score",  "Checked = adds to result; unchecked = record only (card, substitution)"],
          ["Color",          "Button color in the referee UI"],
          ["Sort order",     "Lower number = higher in the list"],
        ]},
        { type: "tip", value: "Events without a point value (cards, fouls) should have an empty value and Affects score unchecked." },
      ],
    },
    {
      icon: "settings", color: "slate",
      title: "3. Engine Configuration",
      content: [
        { type: "text", value: "In the sport edit page there is an Engine Configuration field - a JSON object with the engine key:" },
        { type: "code", value: ENGINE_CONFIG_CODE },
        { type: "tip",  value: "If you leave the configuration empty, the generic engine is used automatically." },
      ],
    },
    {
      icon: "trophy", color: "green",
      title: "4. Sport Examples",
      content: [
        { type: "text", value: "Quick overview of recommended settings:" },
        { type: "examples", items: [
          { name: "Football",          config: '{"engine":"football"}',                              events: ["GOAL (value 1, affects score)", "OWN_GOAL (value 1, adds to opponent)", "YELLOW_CARD (no value)", "RED_CARD (no value)"] },
          { name: "Basketball",        config: '{"engine":"generic","periods":4,"periodDuration":10}', events: ["POINT_1 (value 1)", "POINT_2 (value 2)", "POINT_3 (value 3)", "FOUL (no value)"] },
          { name: "Volleyball",        config: '{"engine":"generic","periods":5}',                   events: ["POINT (value 1, affects score)", "ACE (value 1)", "BLOCK (no value)"] },
          { name: "Floorball / Hockey",config: '{"engine":"football","periods":3,"periodDuration":20}', events: ["GOAL (value 1)", "PENALTY_2MIN (no value)", "PENALTY_5MIN (no value)"] },
        ]},
      ],
    },
    {
      icon: "check", color: "green",
      title: "5. Recommended Steps",
      content: [
        { type: "steps", items: [
          "Create the sport (name + icon)",
          "Go to the sport detail - Events tab",
          "Add all required event types",
          "In edit, set the engine config (or leave empty)",
          "Create a competition and assign this sport - everything else is automatic",
        ]},
      ],
    },
  ],
};

const ICON_MAP: Record<string, React.ReactNode> = {
  dumbbell: <Dumbbell className="size-4" />,
  zap:      <Zap className="size-4" />,
  settings: <Settings2 className="size-4" />,
  trophy:   <Trophy className="size-4" />,
  check:    <CheckCircle2 className="size-4" />,
};

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue:   { bg: "bg-blue-100",   text: "text-blue-700" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
  slate:  { bg: "bg-slate-100",  text: "text-slate-600" },
  green:  { bg: "bg-green-100",  text: "text-green-700" },
};

export function SportsDocs({ locale }: Props) {
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
  const t = locale === "cs" ? CS : EN;

  const toggleSection = (i: number) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const renderBlock = (block: ContentBlock, j: number) => {
    switch (block.type) {
      case "text":
        return <p key={j} className="text-sm text-slate-600">{block.value}</p>;

      case "tip":
        return (
          <div key={j} className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <Lightbulb className="size-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{block.value}</p>
          </div>
        );

      case "code":
        return (
          <div key={j}>
            <div className="flex items-center gap-2 bg-slate-800 text-slate-400 text-xs px-4 py-2 rounded-t-xl">
              <Code2 className="size-3.5" />
              <span>JSON</span>
            </div>
            <pre className="bg-slate-900 text-green-400 text-xs px-4 py-4 rounded-b-xl overflow-x-auto leading-relaxed whitespace-pre">{block.value}</pre>
          </div>
        );

      case "list":
        return (
          <ul key={j} className="space-y-1">
            {block.items.map((item, k) => (
              <li key={k} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1.5 size-1.5 rounded-full bg-blue-700 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        );

      case "steps":
        return (
          <ol key={j} className="space-y-2">
            {block.items.map((item, k) => (
              <li key={k} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="size-5 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {k + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        );

      case "table":
        return (
          <div key={j} className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <tbody>
                {block.rows.map(([label, desc], k) => (
                  <tr key={k} className={k % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                    <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap w-36">{label}</td>
                    <td className="px-4 py-2.5 text-slate-500">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "examples":
        return (
          <div key={j} className="grid sm:grid-cols-2 gap-3">
            {block.items.map((ex, k) => (
              <div key={k} className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900">{ex.name}</span>
                  <code className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500 truncate max-w-[160px]">{ex.config}</code>
                </div>
                <ul className="px-4 py-3 space-y-1">
                  {ex.events.map((ev, m) => (
                    <li key={m} className="text-xs text-slate-500 flex items-start gap-1.5">
                      <Zap className="size-3 text-orange-400 shrink-0 mt-0.5" />
                      {ev}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
            <BookOpen className="size-4 text-blue-700" />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 text-sm">{t.title}</p>
            <p className="text-xs text-slate-400">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 shrink-0">
          {open ? t.toggle_close : t.toggle_open}
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {t.sections.map((section, i) => {
            const colors = COLOR_MAP[section.color] ?? COLOR_MAP.slate;
            const isOpen = openSections.has(i);
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => toggleSection(i)}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>
                      {ICON_MAP[section.icon]}
                    </div>
                    <span className="text-sm font-bold text-slate-800">{section.title}</span>
                  </div>
                  {isOpen
                    ? <ChevronUp className="size-4 text-slate-400" />
                    : <ChevronDown className="size-4 text-slate-400" />
                  }
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 space-y-4">
                    {section.content.map((block, j) => renderBlock(block, j))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
