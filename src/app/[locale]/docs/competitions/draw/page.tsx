export default async function DrawPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Losování zápasů" : "Draw / Schedule Generation"}</h1>
      <p className="text-muted-foreground text-lg">
        {cs
          ? "Systém automaticky vygeneruje všechny zápasy podle zvoleného formátu."
          : "The system automatically generates all matches based on the chosen format."}
      </p>

      <h2>{cs ? "Jak spustit losování?" : "How to run the draw?"}</h2>
      <ol>
        {cs ? (
          <>
            <li>Otevři detail soutěže.</li>
            <li>Ujisti se, že jsou přidány alespoň 2 týmy.</li>
            <li>Klikni na tlačítko <strong>Losovat</strong>.</li>
            <li>Nastav parametry (dvojité zápasy, počet skupin u CUP...).</li>
            <li>Potvrď — zápasy se vygenerují automaticky.</li>
          </>
        ) : (
          <>
            <li>Open the competition detail.</li>
            <li>Make sure at least 2 teams are added.</li>
            <li>Click the <strong>Draw</strong> button.</li>
            <li>Configure parameters (double legs, number of groups for CUP...).</li>
            <li>Confirm — matches will be generated automatically.</li>
          </>
        )}
      </ol>

      <h2>{cs ? "Přelosování" : "Re-draw"}</h2>
      <p>
        {cs
          ? "Pokud potřebuješ losování opakovat (např. po změně týmů), zaškrtni volbu Smazat stávající zápasy před losováním. Pozor — smažou se i zadané výsledky."
          : "If you need to re-draw (e.g. after changing teams), check Delete existing matches before draw. Warning — entered results will also be deleted."}
      </p>

      <h2>{cs ? "Parametry losování podle typu" : "Draw parameters by type"}</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-semibold">{cs ? "Parametr" : "Parameter"}</th>
              <th className="text-center px-3 py-2">LIGA</th>
              <th className="text-center px-3 py-2">TURNAJ</th>
              <th className="text-center px-3 py-2">POHÁR</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="px-3 py-2 text-muted-foreground">{cs ? "Dvojité zápasy" : "Double legs"}</td>
              <td className="px-3 py-2 text-center">✅</td>
              <td className="px-3 py-2 text-center">—</td>
              <td className="px-3 py-2 text-center">{cs ? "ve skupinách" : "in groups"}</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-muted-foreground">{cs ? "Počet skupin" : "Number of groups"}</td>
              <td className="px-3 py-2 text-center">—</td>
              <td className="px-3 py-2 text-center">—</td>
              <td className="px-3 py-2 text-center">✅</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-muted-foreground">{cs ? "Pravidlo postupu" : "Advancement rule"}</td>
              <td className="px-3 py-2 text-center">—</td>
              <td className="px-3 py-2 text-center">—</td>
              <td className="px-3 py-2 text-center">✅</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
}
