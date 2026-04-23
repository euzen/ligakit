export default async function SportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Sporty a pozice" : "Sports & Positions"}</h1>

      <h2>{cs ? "Správa sportů" : "Managing Sports"}</h2>
      <p>{cs ? "Sporty spravuje administrátor aplikace v sekci Administrace → Sporty. Každý sport má název, ikonu a seznam pozic hráčů." : "Sports are managed by the application administrator in Admin → Sports. Each sport has a name, icon, and list of player positions."}</p>

      <h2>{cs ? "Přidání nového sportu" : "Adding a New Sport"}</h2>
      <p>{cs ? "Kontaktuj administrátora aplikace. Ten může přidat libovolný sport s vlastními pozicemi (Brankář, Útočník, atd.)." : "Contact the application administrator. They can add any sport with custom positions (Goalkeeper, Forward, etc.)."}</p>

      <h2>{cs ? "Pozice v týmu" : "Positions in a Team"}</h2>
      <p>{cs ? "Pozice jsou vázány na sport. Po výběru sportu při vytváření týmu jsou dostupné pouze pozice pro daný sport." : "Positions are tied to a sport. After selecting a sport when creating a team, only positions for that sport are available."}</p>
    </article>
  );
}
