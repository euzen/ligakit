"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useParams } from "next/navigation";

interface FaqItem {
  q: string;
  a: string;
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <button
            className="w-full text-left px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors font-medium text-sm"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{item.q}</span>
            <ChevronDown
              className={`size-4 text-muted-foreground shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <div className="px-4 py-3 text-sm text-muted-foreground border-t bg-muted/20">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FaqPage() {
  const params = useParams();
  const cs = params.locale === "cs";

  const sections = cs
    ? [
        {
          title: "Obecné",
          items: [
            { q: "Co je LigaKit?", a: "LigaKit je webová aplikace pro správu sportovních soutěží, týmů a hráčů. Umožňuje organizovat ligy, turnaje a poháry s automatickým losováním a živým skóre." },
            { q: "Je LigaKit zdarma?", a: "Ano, LigaKit je zdarma. Registrace nevyžaduje kreditní kartu." },
            { q: "Jaké sporty LigaKit podporuje?", a: "LigaKit podporuje libovolný sport — fotbal, basketbal, volejbal a další. Administrátor aplikace může přidávat nové sporty s vlastními pozicemi hráčů." },
            { q: "Je LigaKit dostupný v češtině?", a: "Ano, LigaKit je plně dostupný v češtině i angličtině. Jazyk lze přepnout v navigaci." },
          ],
        },
        {
          title: "Účet",
          items: [
            { q: "Jak se zaregistruji?", a: "Klikni na Registrovat se v horní navigaci a vyplň email a heslo. Registrace je okamžitá." },
            { q: "Zapomněl jsem heslo — co mám dělat?", a: "V současnosti není k dispozici reset hesla přes email. Kontaktuj administrátora aplikace." },
            { q: "Jak změním svůj profilový obrázek?", a: "Jdi do Můj profil (ikona v pravém horním rohu) a klikni na avatar. Podporované formáty: JPG, PNG, WebP do 5 MB." },
          ],
        },
        {
          title: "Týmy",
          items: [
            { q: "Jak vytvořím tým?", a: "Jdi do sekce Týmy → Nový tým. Zadej název, vyber sport, přidej popis a logo." },
            { q: "Může tým hrát ve více soutěžích?", a: "Ano, jeden tým může být přidán do libovolného počtu soutěží." },
            { q: "Co jsou hostující týmy?", a: "Hostující týmy jsou týmy bez účtu v systému. Stačí zadat jejich název při přidávání do soutěže. Nelze jim spravovat hráče." },
          ],
        },
        {
          title: "Soutěže",
          items: [
            { q: "Jaký typ soutěže mám zvolit?", a: "Liga (round-robin) pro pravidelné soutěže, Turnaj pro jednorázové akce s vyřazovacím pavouk, Pohár pro kombinaci skupin a pavouku." },
            { q: "Mohu soutěž zveřejnit?", a: "Ano — při vytváření nebo editaci soutěže zaškrtni Veřejná. Veřejné soutěže jsou viditelné i bez přihlášení." },
            { q: "Jak přidám týmy do soutěže?", a: "V detailu soutěže jdi na záložku Týmy a klikni Přidat tým. Můžeš přidat vlastní týmy nebo hostující (bez účtu)." },
            { q: "Co se stane po rozlosování?", a: "Systém vygeneruje všechny zápasy podle formátu soutěže. Pro ligu je to kompletní plán kol, pro turnaj pavouk, pro pohár skupinové zápasy + kostra pavouku." },
          ],
        },
        {
          title: "Zápasy",
          items: [
            { q: "Kdo může zadat výsledek zápasu?", a: "Organizátor soutěže (vlastník nebo admin) a rozhodčí se sdíleným tokenem." },
            { q: "Jak sdílím odkaz pro rozhodčího?", a: "V detailu zápasu klikni na Sdílet odkaz pro rozhodčího. Rozhodčí nepotřebuje účet v systému." },
            { q: "Co je živé skóre?", a: "Scoreboard zobrazuje aktuální stav zápasu v reálném čase. Odkaz lze promítat na televizi nebo monitor." },
          ],
        },
      ]
    : [
        {
          title: "General",
          items: [
            { q: "What is LigaKit?", a: "LigaKit is a web application for managing sports competitions, teams, and players. It lets you organize leagues, tournaments, and cups with automatic draws and live scoring." },
            { q: "Is LigaKit free?", a: "Yes, LigaKit is free. No credit card required for registration." },
            { q: "Which sports does LigaKit support?", a: "LigaKit supports any sport — football, basketball, volleyball and more. The app administrator can add new sports with custom player positions." },
            { q: "Is LigaKit available in English?", a: "Yes, LigaKit is fully available in both Czech and English. Switch the language in the navigation." },
          ],
        },
        {
          title: "Account",
          items: [
            { q: "How do I register?", a: "Click Register in the top navigation and fill in your email and password. Registration is instant." },
            { q: "I forgot my password — what should I do?", a: "Password reset via email is not currently available. Contact the application administrator." },
            { q: "How do I change my profile picture?", a: "Go to My Profile (icon in the top right) and click on the avatar. Supported formats: JPG, PNG, WebP up to 5 MB." },
          ],
        },
        {
          title: "Teams",
          items: [
            { q: "How do I create a team?", a: "Go to Teams → New Team. Enter a name, choose a sport, add a description and logo." },
            { q: "Can a team play in multiple competitions?", a: "Yes, a single team can be added to any number of competitions." },
            { q: "What are guest teams?", a: "Guest teams are teams without a system account. Just enter their name when adding them to a competition. Player management is not available for guest teams." },
          ],
        },
        {
          title: "Competitions",
          items: [
            { q: "Which competition type should I choose?", a: "League (round-robin) for regular competitions, Tournament for one-time events with an elimination bracket, Cup for a combination of groups and bracket." },
            { q: "Can I make a competition public?", a: "Yes — when creating or editing a competition, check Public. Public competitions are visible without login." },
            { q: "How do I add teams to a competition?", a: "In the competition detail, go to the Teams tab and click Add Team. You can add your own teams or guest teams (no account needed)." },
            { q: "What happens after the draw?", a: "The system generates all matches based on the competition format. For a league it's a full round schedule, for a tournament a bracket, for a cup group matches + bracket skeleton." },
          ],
        },
        {
          title: "Matches",
          items: [
            { q: "Who can enter match results?", a: "The competition organizer (owner or admin) and referees with a shared token." },
            { q: "How do I share a referee link?", a: "In the match detail, click Share Referee Link. The referee doesn't need a system account." },
            { q: "What is live score?", a: "The scoreboard shows the current match state in real time. The link can be displayed on a TV or monitor." },
          ],
        },
      ];

  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold mb-2">FAQ</h1>
      <p className="text-muted-foreground text-lg mb-8">
        {cs ? "Nejčastěji kladené otázky." : "Frequently asked questions."}
      </p>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide">{section.title}</h2>
            <FaqAccordion items={section.items} />
          </div>
        ))}
      </div>
    </article>
  );
}
