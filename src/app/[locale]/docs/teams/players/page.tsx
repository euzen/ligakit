export default async function PlayersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Správa hráčů" : "Managing Players"}</h1>

      <h2>{cs ? "Přidání hráče" : "Adding a Player"}</h2>
      <ol>
        {cs ? (
          <>
            <li>Otevři detail týmu.</li>
            <li>Jdi na záložku <strong>Soupiska</strong>.</li>
            <li>Klikni <strong>Přidat hráče</strong>.</li>
            <li>Vyplň jméno, číslo dresu a pozici.</li>
          </>
        ) : (
          <>
            <li>Open the team detail.</li>
            <li>Go to the <strong>Roster</strong> tab.</li>
            <li>Click <strong>Add Player</strong>.</li>
            <li>Fill in the name, jersey number, and position.</li>
          </>
        )}
      </ol>

      <h2>{cs ? "Čísla dresů" : "Jersey Numbers"}</h2>
      <p>{cs ? "Každý hráč v týmu může mít přiřazené číslo dresu. Čísla se zobrazují v soupisku a statistikách." : "Each player in a team can have a jersey number assigned. Numbers appear in the roster and statistics."}</p>

      <h2>{cs ? "Pozice" : "Positions"}</h2>
      <p>{cs ? "Pozice jsou definované pro každý sport zvlášť administrátorem (např. Brankář, Obránce, Záložník, Útočník pro fotbal). Hráč může mít přiřazenou jednu pozici." : "Positions are defined per sport by the administrator (e.g. Goalkeeper, Defender, Midfielder, Forward for football). A player can have one position assigned."}</p>

      <h2>{cs ? "Hostující hráči" : "Guest Players"}</h2>
      <p>{cs ? "U hostujících týmů v soutěži lze přidávat hráče přes speciální odkaz bez nutnosti účtu v systému. Organizátor soutěže sdílí odkaz kapitánovi hostujícího týmu." : "For guest teams in a competition, players can be added via a special link without a system account. The competition organizer shares the link with the guest team captain."}</p>
    </article>
  );
}
