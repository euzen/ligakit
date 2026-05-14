export default async function AdminSportsDocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Správa sportů" : "Sports Management"}</h1>

      <p className="lead">
        {cs
          ? "Administrátor může v sekci Administrace → Sporty vytvářet sporty, definovat typy událostí, pozice hráčů a konfiguraci enginu."
          : "In Admin → Sports, the administrator can create sports, define event types, player positions, and engine configuration."}
      </p>

      <h2>{cs ? "Vytvoření nového sportu" : "Creating a New Sport"}</h2>
      <ol>
        {cs ? (
          <>
            <li>Přejděte do <strong>Administrace → Sporty</strong>.</li>
            <li>Klikněte na <strong>Přidat sport</strong>.</li>
            <li>Vyplňte název a volitelně popis a ikonu (emoji).</li>
            <li>Uložte — sport je ihned dostupný při vytváření soutěží.</li>
          </>
        ) : (
          <>
            <li>Go to <strong>Admin → Sports</strong>.</li>
            <li>Click <strong>Add Sport</strong>.</li>
            <li>Fill in the name and optionally a description and icon (emoji).</li>
            <li>Save — the sport is immediately available when creating competitions.</li>
          </>
        )}
      </ol>

      <h2>{cs ? "Konfigurace enginu" : "Engine Configuration"}</h2>
      <p>
        {cs
          ? "V detailu sportu (záložka Konfigurace) zadáte JSON objekt, který řídí výpočet skóre a pravidla soutěže. Dostupné jsou dva enginy:"
          : "In the sport detail (Configuration tab) you enter a JSON object that controls score calculation and competition rules. Two engines are available:"}
      </p>
      <ul>
        <li><code>football</code> — {cs ? "fotbalový engine — góly a vlastní góly jsou napevno definované" : "football engine — goals and own goals are hardcoded"}</li>
        <li><code>generic</code> — {cs ? "univerzální engine — skóre se počítá z hodnot EventType záznamů" : "generic engine — score is calculated from EventType record values"}</li>
      </ul>
      <p>
        {cs
          ? "Prázdná konfigurace = automaticky se použije generic engine."
          : "Empty configuration = the generic engine is used automatically."}
      </p>

      <h3>{cs ? "Podporované klíče konfigurace" : "Supported configuration keys"}</h3>

      <table>
        <thead>
          <tr>
            <th>{cs ? "Klíč" : "Key"}</th>
            <th>{cs ? "Hodnoty" : "Values"}</th>
            <th>{cs ? "Popis" : "Description"}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>engine</code></td>
            <td><code>football | generic</code></td>
            <td>{cs ? "Výpočetní engine" : "Scoring engine"}</td>
          </tr>
          <tr>
            <td><code>periods</code></td>
            <td><code>2, 3, 4…</code></td>
            <td>{cs ? "Počet poločasů / třetin" : "Number of periods"}</td>
          </tr>
          <tr>
            <td><code>periodDuration</code></td>
            <td><code>45, 20, 10…</code></td>
            <td>{cs ? "Délka periody v minutách" : "Period duration in minutes"}</td>
          </tr>
          <tr>
            <td><code>overtimeAllowed</code></td>
            <td><code>true | false</code></td>
            <td>{cs ? "Povolit prodloužení" : "Allow overtime"}</td>
          </tr>
          <tr>
            <td><code>tiebreak</code></td>
            <td><code>none | extra_time | penalties | shootout</code></td>
            <td>{cs ? "Způsob rozhodnutí remízy" : "Tiebreak method"}</td>
          </tr>
          <tr>
            <td><code>winPoints</code></td>
            <td><code>3</code></td>
            <td>{cs ? "Body za výhru (tabulka)" : "Points for a win (standings)"}</td>
          </tr>
          <tr>
            <td><code>drawPoints</code></td>
            <td><code>1</code></td>
            <td>{cs ? "Body za remízu" : "Points for a draw"}</td>
          </tr>
          <tr>
            <td><code>lossPoints</code></td>
            <td><code>0</code></td>
            <td>{cs ? "Body za prohru" : "Points for a loss"}</td>
          </tr>
        </tbody>
      </table>

      <h3>{cs ? "Příklad — fotbal" : "Example — football"}</h3>
      <pre><code>{`{
  "engine": "football",
  "periods": 2,
  "periodDuration": 45,
  "winPoints": 3,
  "drawPoints": 1,
  "lossPoints": 0
}`}</code></pre>

      <h2>{cs ? "Typy událostí" : "Event Types"}</h2>
      <p>
        {cs
          ? "Události jsou akce zapisované během zápasu. Každý sport má vlastní sadu typů událostí. Konfigurujete je v záložce Události na stránce sportu."
          : "Events are actions recorded during a match. Each sport has its own set of event types, configured in the Events tab on the sport page."}
      </p>

      <h3>{cs ? "Atributy typu události" : "Event type attributes"}</h3>

      <table>
        <thead>
          <tr>
            <th>{cs ? "Atribut" : "Attribute"}</th>
            <th>{cs ? "Popis" : "Description"}</th>
            <th>{cs ? "Povinný" : "Required"}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>name</code></td>
            <td>{cs ? "Technický identifikátor (VELKA_PISMENA)" : "Technical identifier (UPPER_CASE)"}</td>
            <td>{cs ? "Ano" : "Yes"}</td>
          </tr>
          <tr>
            <td><code>labelCs</code></td>
            <td>{cs ? "Český popisek zobrazený v UI" : "Czech label shown in UI"}</td>
            <td>{cs ? "Ano" : "Yes"}</td>
          </tr>
          <tr>
            <td><code>labelEn</code></td>
            <td>{cs ? "Anglický popisek" : "English label"}</td>
            <td>{cs ? "Doporučeno" : "Recommended"}</td>
          </tr>
          <tr>
            <td><code>affectsScore</code></td>
            <td>{cs ? "Zda událost mění skóre zápasu (výchozí: true)" : "Whether the event changes the match score (default: true)"}</td>
            <td>{cs ? "Výchozí: true" : "Default: true"}</td>
          </tr>
          <tr>
            <td><code>value</code></td>
            <td>{cs ? "Bodová hodnota — pro generic engine (např. 2 pro koš z pole)" : "Point value — for the generic engine (e.g. 2 for a field goal)"}</td>
            <td>{cs ? "Volitelné" : "Optional"}</td>
          </tr>
          <tr>
            <td><code>color</code></td>
            <td>{cs ? "Hex barva pro zvýraznění v UI" : "Hex color for UI highlighting"}</td>
            <td>{cs ? "Ne" : "No"}</td>
          </tr>
          <tr>
            <td><code>icon</code></td>
            <td>{cs ? "Emoji nebo Lucide název ikony" : "Emoji or Lucide icon name"}</td>
            <td>{cs ? "Ne" : "No"}</td>
          </tr>
          <tr>
            <td><code>sortOrder</code></td>
            <td>{cs ? "Pořadí zobrazení v seznamu" : "Display order in the list"}</td>
            <td>{cs ? "Výchozí: 0" : "Default: 0"}</td>
          </tr>
        </tbody>
      </table>

      <h3>{cs ? "Příklad — fotbalové události" : "Example — football events"}</h3>
      <ul>
        <li><code>GOAL</code> — {cs ? "Gól (affectsScore: true, value: 1)" : "Goal (affectsScore: true, value: 1)"}</li>
        <li><code>OWN_GOAL</code> — {cs ? "Vlastní gól (+1 soupeři)" : "Own goal (+1 to opponent)"}</li>
        <li><code>YELLOW_CARD</code> — {cs ? "Žlutá karta (affectsScore: false)" : "Yellow card (affectsScore: false)"}</li>
        <li><code>RED_CARD</code> — {cs ? "Červená karta (affectsScore: false)" : "Red card (affectsScore: false)"}</li>
        <li><code>SUBSTITUTION</code> — {cs ? "Střídání (affectsScore: false)" : "Substitution (affectsScore: false)"}</li>
      </ul>

      <h2>{cs ? "Pozice hráčů" : "Player Positions"}</h2>
      <p>
        {cs
          ? "Pozice definují role hráčů v týmu a jsou vázány na sport. Každá pozice má název a překlady (labelCs, labelEn). Hráč může mít přiřazenou jednu pozici."
          : "Positions define player roles and are tied to a sport. Each position has a name and translations (labelCs, labelEn). A player can have one position assigned."}
      </p>
    </article>
  );
}
