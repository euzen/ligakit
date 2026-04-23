export default async function ResultsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Zadávání výsledků" : "Entering Results"}</h1>

      <h2>{cs ? "Kdo může zadat výsledek?" : "Who can enter a result?"}</h2>
      <ul>
        {cs ? (
          <>
            <li><strong>Organizátor soutěže</strong> — vlastník nebo administrátor</li>
            <li><strong>Rozhodčí</strong> — uživatel se sdíleným tokenem (bez nutnosti účtu)</li>
          </>
        ) : (
          <>
            <li><strong>Competition organizer</strong> — owner or administrator</li>
            <li><strong>Referee</strong> — user with a shared token (no account required)</li>
          </>
        )}
      </ul>

      <h2>{cs ? "Jak zadat výsledek?" : "How to enter a result?"}</h2>
      <ol>
        {cs ? (
          <>
            <li>Otevři detail zápasu.</li>
            <li>Klikni na <strong>Zadat výsledek</strong>.</li>
            <li>Zadej skóre domácích a hostů.</li>
            <li>Volitelně přidej události (góly, žluté karty...).</li>
            <li>Ulož — tabulka se aktualizuje automaticky.</li>
          </>
        ) : (
          <>
            <li>Open the match detail.</li>
            <li>Click <strong>Enter Result</strong>.</li>
            <li>Enter the home and away score.</li>
            <li>Optionally add events (goals, yellow cards...).</li>
            <li>Save — standings update automatically.</li>
          </>
        )}
      </ol>

      <h2>{cs ? "Sdílení odkazu pro rozhodčího" : "Sharing the Referee Link"}</h2>
      <p>{cs ? "V detailu zápasu klikni na Sdílet odkaz pro rozhodčího. Zkopíruj odkaz a pošli jej rozhodčímu — nepotřebuje účet v LigaKit." : "In the match detail, click Share Referee Link. Copy the link and send it to the referee — they don't need a LigaKit account."}</p>
    </article>
  );
}
