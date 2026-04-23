export default async function TeamsCreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Vytvoření týmu" : "Create a Team"}</h1>

      <h2>{cs ? "Jak vytvořit tým" : "How to create a team"}</h2>
      <ol>
        {cs ? (
          <>
            <li>Jdi do sekce <strong>Týmy</strong> v navigaci.</li>
            <li>Klikni na <strong>Nový tým</strong>.</li>
            <li>Vyplň název týmu a vyber sport.</li>
            <li>Volitelně přidej popis a logo.</li>
            <li>Ulož — tým je připraven.</li>
          </>
        ) : (
          <>
            <li>Go to the <strong>Teams</strong> section in the navigation.</li>
            <li>Click <strong>New Team</strong>.</li>
            <li>Fill in the team name and choose a sport.</li>
            <li>Optionally add a description and logo.</li>
            <li>Save — the team is ready.</li>
          </>
        )}
      </ol>

      <h2>{cs ? "Logo týmu" : "Team Logo"}</h2>
      <p>{cs ? "Logo se zobrazuje v přehledu týmů a soutěží. Podporované formáty: JPG, PNG, WebP. Doporučená velikost: čtvercová, min. 200×200 px." : "The logo appears in team and competition overviews. Supported formats: JPG, PNG, WebP. Recommended size: square, min. 200×200 px."}</p>

      <h2>{cs ? "Správa týmu" : "Team Management"}</h2>
      <p>{cs ? "Tým může spravovat jeho vlastník a administrátor aplikace. Ostatní uživatelé mohou tým pouze zobrazit (pokud je veřejný)." : "A team can be managed by its owner and the application administrator. Other users can only view the team (if public)."}</p>
    </article>
  );
}
