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
            <li>Klikni na <strong>Zahájit zápas</strong> — časomíra se spustí automaticky od tohoto okamžiku.</li>
            <li>Zaznamenávej události (gól, karta, střídání) tlačítky v ovládacím panelu.</li>
            <li>Scoreboard se aktualizuje v reálném čase pro všechny diváky.</li>
          </>
        ) : (
          <>
            <li>Open the match detail.</li>
            <li>Click <strong>Match Control</strong>.</li>
            <li>Click <strong>Start Match</strong> — the timer starts automatically from that moment.</li>
            <li>Record events (goal, card, substitution) using the buttons in the control panel.</li>
            <li>The scoreboard updates in real time for all viewers.</li>
          </>
        )}
      </ol>

      <h2>{cs ? "Časomíra" : "Timer"}</h2>
      <p>
        {cs
          ? "Časomíra počítá minuty a sekundy od spuštění zápasu (startedAt). Zobrazuje se na scoreboard i v ovládacím panelu ve formátu MM:SS. Při přechodu do dalšího poločasu se automaticky přepne."
          : "The timer counts minutes and seconds from match start (startedAt). It is shown on the scoreboard and in the control panel in MM:SS format. It switches automatically when the next period begins."}
      </p>

      <h2>{cs ? "Scoreboard" : "Scoreboard"}</h2>
      <p>
        {cs
          ? "Scoreboard je speciální tmavá stránka optimalizovaná pro zobrazení na televizi nebo monitoru. Obsahuje skóre, časomíru, poločas a seznam událostí. Otevřeš ji z detailu zápasu. URL sdílíš s diváky nebo promítacím zařízením."
          : "The scoreboard is a special dark page optimized for display on a TV or monitor. It shows the score, timer, period, and event list. Open it from the match detail. Share the URL with viewers or a display device."}
      </p>

      <h2>{cs ? "Odkaz pro rozhodčího" : "Referee Link"}</h2>
      <p>
        {cs
          ? "Z ovládacího panelu lze sdílet odkaz pro rozhodčího. Rozhodčí přes tento odkaz vidí stejné tlačítka pro zapisování událostí — bez nutnosti účtu v LigaKit."
          : "From the control panel you can share a referee link. Using this link, the referee sees the same event recording buttons — no LigaKit account required."}
      </p>

      <h2>{cs ? "Události zápasu" : "Match Events"}</h2>
      <p>
        {cs
          ? "Dostupné typy událostí závisí na sportu a jeho konfiguraci. Příklady pro fotbal: gól, vlastní gól, žlutá karta, červená karta, střídání. Každá událost je uložena s časovou značkou (minuta zápasu)."
          : "Available event types depend on the sport and its configuration. Football examples: goal, own goal, yellow card, red card, substitution. Each event is saved with a timestamp (match minute)."}
      </p>
    </article>
  );
}
