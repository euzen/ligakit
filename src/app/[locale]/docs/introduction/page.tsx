export default async function IntroductionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Úvod do LigaKit" : "Introduction to LigaKit"}</h1>
      <p className="lead text-muted-foreground text-lg">
        {cs
          ? "LigaKit je moderní aplikace pro správu sportovních soutěží, týmů a hráčů."
          : "LigaKit is a modern application for managing sports competitions, teams, and players."}
      </p>

      <h2>{cs ? "Co LigaKit umí?" : "What can LigaKit do?"}</h2>
      <ul>
        {cs ? (
          <>
            <li><strong>Správa týmů</strong> — Vytvárejte týmy, přidávejte hráče, nastavujte dresy a pozice.</li>
            <li><strong>Soutěže</strong> — Organizujte ligy, turnaje a poháry s automatickým losováním.</li>
            <li><strong>Živé skóre</strong> — Sledujte zápasy v reálném čase přes scoreboard nebo mobilní zařízení.</li>
            <li><strong>Statistiky</strong> — Přehled tabulek, výsledků a statistik hráčů.</li>
            <li><strong>Více sportů</strong> — Fotbal, basketbal a další sporty s vlastními pozicemi.</li>
          </>
        ) : (
          <>
            <li><strong>Team Management</strong> — Create teams, add players, set jersey numbers and positions.</li>
            <li><strong>Competitions</strong> — Organize leagues, tournaments, and cups with automatic draw.</li>
            <li><strong>Live Score</strong> — Follow matches in real time via scoreboard or mobile device.</li>
            <li><strong>Statistics</strong> — Overview of standings, results, and player stats.</li>
            <li><strong>Multiple Sports</strong> — Football, basketball and more with custom positions.</li>
          </>
        )}
      </ul>

      <h2>{cs ? "Role uživatelů" : "User Roles"}</h2>
      <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-1">{cs ? "Běžný uživatel" : "Regular User"}</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {cs ? (
              <>
                <li>Vytváří a spravuje vlastní týmy</li>
                <li>Zakládá soutěže</li>
                <li>Zadává výsledky svých zápasů</li>
              </>
            ) : (
              <>
                <li>Create and manage their own teams</li>
                <li>Create competitions</li>
                <li>Enter results for their matches</li>
              </>
            )}
          </ul>
        </div>
        <div className="border rounded-lg p-4 border-primary/30 bg-primary/5">
          <h3 className="font-semibold mb-1">{cs ? "Administrátor" : "Administrator"}</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {cs ? (
              <>
                <li>Vše co běžný uživatel</li>
                <li>Správa všech uživatelů</li>
                <li>Správa sportů a pozic</li>
                <li>Přístup ke všem soutěžím</li>
              </>
            ) : (
              <>
                <li>Everything a regular user can do</li>
                <li>Manage all users</li>
                <li>Manage sports and positions</li>
                <li>Access to all competitions</li>
              </>
            )}
          </ul>
        </div>
      </div>

      <h2>{cs ? "Jak začít?" : "How to get started?"}</h2>
      <p>
        {cs
          ? "Nejrychlejší cesta je projít si Rychlý start — ten tě provede od registrace až po první rozlosovanou soutěž."
          : "The fastest path is to go through the Quick Start — it will guide you from registration to your first drawn competition."}
      </p>
      <div className="not-prose">
        <a
          href={`/${locale}/docs/quick-start`}
          className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {cs ? "Rychlý start →" : "Quick Start →"}
        </a>
      </div>
    </article>
  );
}
