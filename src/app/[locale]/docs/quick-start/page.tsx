export default async function QuickStartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  const steps = cs
    ? [
        { n: 1, title: "Zaregistruj se", desc: "Vytvoř si účet na stránce Registrace. Stačí email a heslo." },
        { n: 2, title: "Vytvoř tým", desc: "Jdi do sekce Týmy → Nový tým. Zadej název, vyber sport a přidej logo." },
        { n: 3, title: "Přidej hráče", desc: "V detailu týmu přidej hráče — jméno, číslo dresu a pozici." },
        { n: 4, title: "Vytvoř soutěž", desc: "Jdi do sekce Soutěže → Nová soutěž. Vyber typ (Liga, Turnaj, Pohár)." },
        { n: 5, title: "Přidej týmy do soutěže", desc: "V detailu soutěže přidej týmy — vlastní i týmy ostatních uživatelů." },
        { n: 6, title: "Rozlosuj", desc: "Klikni na tlačítko Losovat. Systém automaticky vygeneruje všechny zápasy." },
        { n: 7, title: "Zadávej výsledky", desc: "Po odehrání zápasu zadej výsledek. Tabulka se aktualizuje automaticky." },
      ]
    : [
        { n: 1, title: "Register", desc: "Create an account on the Register page. All you need is an email and password." },
        { n: 2, title: "Create a Team", desc: "Go to Teams → New Team. Enter a name, choose a sport, and add a logo." },
        { n: 3, title: "Add Players", desc: "In the team detail, add players — name, jersey number, and position." },
        { n: 4, title: "Create a Competition", desc: "Go to Competitions → New Competition. Choose a type (League, Tournament, Cup)." },
        { n: 5, title: "Add Teams to Competition", desc: "In the competition detail, add teams — your own or from other users." },
        { n: 6, title: "Draw", desc: "Click the Draw button. The system will automatically generate all matches." },
        { n: 7, title: "Enter Results", desc: "After each match, enter the result. The standings update automatically." },
      ];

  return (
    <article className="docs-prose">
      <h1>{cs ? "Rychlý start" : "Quick Start"}</h1>
      <p className="text-muted-foreground text-lg">
        {cs
          ? "Od nuly k první soutěži za pár minut."
          : "From zero to your first competition in just a few minutes."}
      </p>

      <div className="not-prose space-y-4 my-6">
        {steps.map((step) => (
          <div key={step.n} className="flex gap-4 items-start p-4 border rounded-lg">
            <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
              {step.n}
            </div>
            <div>
              <h3 className="font-semibold text-base mb-0.5">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>{cs ? "Tipy pro začátek" : "Tips for beginners"}</h2>
      <ul>
        {cs ? (
          <>
            <li>Soutěž může obsahovat <strong>hostující týmy</strong> — týmy bez účtu v systému (stačí zadat název).</li>
            <li>Výsledky mohou zadávat i <strong>rozhodčí</strong> — sdílíš jim odkaz na zápas.</li>
            <li>Pro větší soutěže doporučujeme <strong>CUP formát</strong> — skupiny + vyřazovací část.</li>
          </>
        ) : (
          <>
            <li>A competition can include <strong>guest teams</strong> — teams without a system account (just enter a name).</li>
            <li>Results can also be entered by <strong>referees</strong> — share them a match link.</li>
            <li>For larger competitions, we recommend the <strong>CUP format</strong> — groups + knockout stage.</li>
          </>
        )}
      </ul>
    </article>
  );
}
