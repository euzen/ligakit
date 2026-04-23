export default async function CreateCompetitionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Vytvoření soutěže" : "Create a Competition"}</h1>

      <h2>{cs ? "Jak vytvořit soutěž" : "How to create a competition"}</h2>
      <ol>
        {cs ? (
          <>
            <li>Jdi do sekce <strong>Soutěže</strong> v navigaci.</li>
            <li>Klikni na <strong>Nová soutěž</strong>.</li>
            <li>Vyber typ soutěže (Liga, Turnaj, Pohár).</li>
            <li>Vyplň název, sport a volitelně popis, termíny a max. počet týmů.</li>
            <li>Nastav viditelnost — <strong>Veřejná</strong> soutěž je viditelná bez přihlášení.</li>
            <li>Ulož.</li>
          </>
        ) : (
          <>
            <li>Go to the <strong>Competitions</strong> section in the navigation.</li>
            <li>Click <strong>New Competition</strong>.</li>
            <li>Choose the competition type (League, Tournament, Cup).</li>
            <li>Fill in the name, sport, and optionally description, dates, and max team count.</li>
            <li>Set visibility — a <strong>Public</strong> competition is visible without login.</li>
            <li>Save.</li>
          </>
        )}
      </ol>

      <h2>{cs ? "Nastavení períod" : "Period Settings"}</h2>
      <p>{cs ? "Volitelně lze nastavit počet a délku herních periód (poločasů, čtvrtí...). Toto nastavení se používá při živém skóre." : "Optionally set the number and duration of playing periods (halves, quarters...). This setting is used for live scoring."}</p>

      <h2>{cs ? "Waitlist" : "Waitlist"}</h2>
      <p>{cs ? "Pokud nastavíš maximální počet týmů, po jeho dosažení se zapne čekací listina. Další týmy čekají na uvolnění místa." : "If you set a maximum number of teams, once reached, a waitlist is activated. Additional teams wait for a slot to open."}</p>
    </article>
  );
}
