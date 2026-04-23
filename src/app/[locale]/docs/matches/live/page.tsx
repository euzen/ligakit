export default async function LivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Živé skóre" : "Live Score"}</h1>

      <h2>{cs ? "Co je živé skóre?" : "What is Live Score?"}</h2>
      <p>{cs ? "Živé skóre umožňuje sledovat průběh zápasu v reálném čase. Scoreboard se automaticky aktualizuje bez nutnosti obnovení stránky." : "Live score allows you to follow a match in real time. The scoreboard updates automatically without refreshing the page."}</p>

      <h2>{cs ? "Jak spustit živé skóre?" : "How to start live scoring?"}</h2>
      <ol>
        {cs ? (
          <>
            <li>Otevři detail zápasu.</li>
            <li>Klikni na <strong>Ovládání zápasu</strong>.</li>
            <li>Spusť odpočítávání nebo zadávej události ručně.</li>
            <li>Scoreboard se aktualizuje v reálném čase pro všechny diváky.</li>
          </>
        ) : (
          <>
            <li>Open the match detail.</li>
            <li>Click <strong>Match Control</strong>.</li>
            <li>Start the countdown or enter events manually.</li>
            <li>The scoreboard updates in real time for all viewers.</li>
          </>
        )}
      </ol>

      <h2>{cs ? "Scoreboard" : "Scoreboard"}</h2>
      <p>{cs ? "Scoreboard je speciální stránka optimalizovaná pro zobrazení na televizi nebo monitoru. Lze ji otevřít z detailu zápasu. URL scoreboard sdílíš s diváky nebo promítacím zařízením." : "The scoreboard is a special page optimized for display on a TV or monitor. It can be opened from the match detail. Share the scoreboard URL with viewers or a display device."}</p>

      <h2>{cs ? "Události zápasu" : "Match Events"}</h2>
      <p>{cs ? "Události zahrnují: gól, vlastní gól, žlutá karta, červená karta, střídání. Každá událost je časově označena." : "Events include: goal, own goal, yellow card, red card, substitution. Each event is time-stamped."}</p>
    </article>
  );
}
