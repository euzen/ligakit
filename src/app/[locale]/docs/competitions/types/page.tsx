export default async function CompetitionTypesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Typy soutěží" : "Competition Types"}</h1>
      <p className="text-muted-foreground text-lg">
        {cs
          ? "LigaKit podporuje tři typy soutěží, každý se hodí pro jiný formát."
          : "LigaKit supports three competition types, each suited for a different format."}
      </p>

      <div className="not-prose grid grid-cols-1 gap-6 my-6">
        <div className="border rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold">LIGA</span>
            <h2 className="text-lg font-semibold m-0">{cs ? "Liga (round-robin)" : "League (round-robin)"}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {cs
              ? "Každý tým hraje s každým ostatním. Vhodné pro pravidelné soutěže s fixním počtem týmů."
              : "Every team plays against every other team. Ideal for regular competitions with a fixed number of teams."}
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
            {cs ? (
              <>
                <li>Jednoduchý systém: každý pár hraje 1×</li>
                <li>Dvojitý systém: každý pár hraje 2× (doma i venku)</li>
                <li>Výsledek: bodová tabulka s pořadím</li>
              </>
            ) : (
              <>
                <li>Single round: each pair plays once</li>
                <li>Double round: each pair plays twice (home & away)</li>
                <li>Result: point standings table</li>
              </>
            )}
          </ul>
        </div>

        <div className="border rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-semibold">TURNAJ</span>
            <h2 className="text-lg font-semibold m-0">{cs ? "Turnaj (vyřazovací)" : "Tournament (elimination)"}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {cs
              ? "Single elimination — prohra znamená konec. Vhodné pro jednorázové akce."
              : "Single elimination — one loss and you're out. Ideal for one-time events."}
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
            {cs ? (
              <>
                <li>Pavouk se generuje automaticky</li>
                <li>Párování: 1. vs. poslední, 2. vs. předposlední atd.</li>
                <li>Pokud počet týmů není mocnina 2, přidají se volná kola (bye)</li>
              </>
            ) : (
              <>
                <li>Bracket generated automatically</li>
                <li>Seeding: 1st vs. last, 2nd vs. second-to-last, etc.</li>
                <li>If team count isn't a power of 2, byes are added</li>
              </>
            )}
          </ul>
        </div>

        <div className="border rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold">POHÁR</span>
            <h2 className="text-lg font-semibold m-0">{cs ? "Pohár (skupiny + pavouk)" : "Cup (groups + bracket)"}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {cs
              ? "Kombinace skupinové fáze (round-robin) a vyřazovacího pavouka. Vhodné pro větší soutěže."
              : "Combination of group stage (round-robin) and knockout bracket. Ideal for larger competitions."}
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
            {cs ? (
              <>
                <li>Skupinová fáze: každý s každým ve skupině</li>
                <li>Postup do pavouka: volitelné pravidlo (vítězové, top 2, top 2 + nejlepší třetí...)</li>
                <li>Vyřazovací část: klasický pavouk</li>
              </>
            ) : (
              <>
                <li>Group stage: round-robin within each group</li>
                <li>Advancement to bracket: configurable rule (winners, top 2, top 2 + best 3rd...)</li>
                <li>Knockout stage: standard bracket</li>
              </>
            )}
          </ul>
          <div className="mt-3">
            <a href={`/${locale}/docs/competitions/cup`} className="text-sm text-primary hover:underline">
              {cs ? "Více o CUP soutěži →" : "Learn more about CUP →"}
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
