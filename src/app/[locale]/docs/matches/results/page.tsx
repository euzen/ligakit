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
            <li>Klikni na <strong>Ovládání zápasu</strong>.</li>
            <li>Zaznamenávej události (góly, karty...) — skóre se přepočítá automaticky.</li>
            <li>Po skončení zápasu klikni na <strong>Ukončit zápas</strong>.</li>
            <li>Tabulka soutěže se aktualizuje automaticky.</li>
          </>
        ) : (
          <>
            <li>Open the match detail.</li>
            <li>Click <strong>Match Control</strong>.</li>
            <li>Record events (goals, cards…) — the score recalculates automatically.</li>
            <li>After the match ends, click <strong>End Match</strong>.</li>
            <li>The competition standings update automatically.</li>
          </>
        )}
      </ol>

      <h2>{cs ? "Přímé zadání skóre" : "Direct score entry"}</h2>
      <p>
        {cs
          ? "Pokud nechceš zapisovat jednotlivé události, můžeš přejít přímo do ovládacího panelu, ukončit zápas a skóre zadat ručně přes editaci výsledku na stránce detailu zápasu."
          : "If you don't want to record individual events, you can go directly to the control panel, end the match, and manually edit the result on the match detail page."}
      </p>

      <h2>{cs ? "Sdílení odkazu pro rozhodčího" : "Sharing the Referee Link"}</h2>
      <p>
        {cs
          ? "V ovládacím panelu zápasu klikni na <strong>Sdílet odkaz pro rozhodčího</strong>. Rozhodčí přes tento odkaz vidí tlačítka pro zapisování událostí a nepotřebuje účet v LigaKit."
          : "In the match control panel, click <strong>Share Referee Link</strong>. The referee can record events via this link and doesn't need a LigaKit account."}
      </p>
    </article>
  );
}
