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
          ? "Kompletní průvodce konfigurací sportů v LigaKit. Každý sport má vlastní pravidla, události a strukturu zápasů."
          : "Complete guide to configuring sports in LigaKit. Each sport has its own rules, events, and match structure."}
      </p>

      <h2>{cs ? "Typy zápasů (MatchType)" : "Match Types"}</h2>
      <p>
        {cs
          ? "LigaKit podporuje 4 základní typy zápasů. Výběr typu určuje, jak se bude zapisovat skóre a jaké UI se zobrazí při živém zapisování."
          : "LigaKit supports 4 basic match types. The type selection determines how scoring is recorded and which UI is displayed during live scoring."}
      </p>

      <table>
        <thead>
          <tr>
            <th>{cs ? "Typ" : "Type"}</th>
            <th>{cs ? "Popis" : "Description"}</th>
            <th>{cs ? "Příklady sportů" : "Example Sports"}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>STANDARD</code></td>
            <td>{cs ? "Góly/body v časových úsecích (poločasy, třetiny)" : "Goals/points in time periods (halves, thirds)"}</td>
            <td>{cs ? "Fotbal, hokej, ragby" : "Football, hockey, rugby"}</td>
          </tr>
          <tr>
            <td><code>SETS</code></td>
            <td>{cs ? "Sety a gemy - hra na vítězné sady" : "Sets and games - play to winning sets"}</td>
            <td>{cs ? "Tenis, volejbal, badminton, stolní tenis" : "Tennis, volleyball, badminton, table tennis"}</td>
          </tr>
          <tr>
            <td><code>DURATION</code></td>
            <td>{cs ? "Časové periody s body (čtvrtiny, třetiny)" : "Time periods with points (quarters, thirds)"}</td>
            <td>{cs ? "Basketbal, házená, lední hokej" : "Basketball, handball, ice hockey"}</td>
          </tr>
          <tr>
            <td><code>POINTS</code></td>
            <td>{cs ? "Kumulativní body - startovní skóre se snižuje" : "Cumulative points - starting score decreases"}</td>
            <td>{cs ? "Šipky, kulečník, šprtec" : "Darts, billiards"}</td>
          </tr>
        </tbody>
      </table>

      <h2>{cs ? "Vytvoření nového sportu" : "Creating a New Sport"}</h2>
      <ol>
        {cs ? (
          <>
            <li>Přejděte do <strong>Administrace → Správa sportů</strong></li>
            <li>Klikněte na <strong>Přidat sport</strong></li>
            <li>Vyplňte základní údaje: název, slug, popis</li>
            <li>Vyberte <strong>Typ zápasu</strong> podle výše uvedené tabulky</li>
            <li>Nastavte výchozí konfiguraci (počet poločasů/setů, délka, atd.)</li>
            <li>Uložte a pokračujte definicí typů událostí</li>
          </>
        ) : (
          <>
            <li>Go to <strong>Admin → Sports Management</strong></li>
            <li>Click <strong>Add Sport</strong></li>
            <li>Fill in basic info: name, slug, description</li>
            <li>Select <strong>Match Type</strong> from the table above</li>
            <li>Set default configuration (number of halves/sets, duration, etc.)</li>
            <li>Save and continue with event type definitions</li>
          </>
        )}
      </ol>

      <h2>{cs ? "Typy událostí (Event Types)" : "Event Types"}</h2>
      <p>
        {cs
          ? "Události jsou akce, které se zapisují během zápasu a ovlivňují skóre nebo statistiky. Každý sport má své vlastní sady událostí."
          : "Events are actions recorded during a match that affect the score or statistics. Each sport has its own set of events."}
      </p>

      <h3>{cs ? "Příklady podle sportů" : "Examples by Sport"}</h3>

      <h4>{cs ? "Fotbal (STANDARD)" : "Football (STANDARD)"}</h4>
      <ul>
        <li><code>GOAL</code> - Gól (ovlivňuje skóre: +1)</li>
        <li><code>OWN_GOAL</code> - Vlastní gól (ovlivňuje skóre: +1 soupeři)</li>
        <li><code>YELLOW_CARD</code> - Žlutá karta (neovlivňuje skóre)</li>
        <li><code>RED_CARD</code> - Červená karta (neovlivňuje skóre)</li>
        <li><code>SUBSTITUTION</code> - Střídání (neovlivňuje skóre)</li>
      </ul>

      <h4>{cs ? "Basketbal (DURATION)" : "Basketball (DURATION)"}</h4>
      <ul>
        <li><code>POINT_1</code> - Trestný hod (ovlivňuje skóre: +1)</li>
        <li><code>POINT_2</code> - Koš z pole (ovlivňuje skóre: +2)</li>
        <li><code>POINT_3</code> - Trojka (ovlivňuje skóre: +3)</li>
        <li><code>FOUL</code> - Faul (neovlivňuje skóre)</li>
        <li><code>TIMEOUT</code> - Oddechový čas (neovlivňuje skóre)</li>
      </ul>

      <h4>{cs ? "Tenis (SETS)" : "Tennis (SETS)"}</h4>
      <ul>
        <li><code>WIN_GAME</code> - Výhra gemu (postupuje v setu)</li>
        <li><code>WIN_SET</code> - Výhra setu (postupuje v zápase)</li>
        <li><code>ACE</code> - Eso (statistika, neovlivňuje skóre přímo)</li>
        <li><code>DOUBLE_FAULT</code> - Dvojchyba (statistika)</li>
      </ul>

      <h2>{cs ? "Výchozí konfigurace (defaultConfig)" : "Default Configuration"}</h2>
      <p>
        {cs
          ? "Výchozí konfigurace je JSON objekt, který definuje základní pravidla pro nové soutěže tohoto sportu."
          : "Default configuration is a JSON object that defines basic rules for new competitions of this sport."}
      </p>

      <h3>{cs ? "Příklady konfigurace" : "Configuration Examples"}</h3>

      <h4>Fotbal (STANDARD)</h4>
      <pre><code>{`{
  "halves": 2,
  "duration": 45,
  "extraTime": true,
  "penalties": true,
  "overtimeHalves": 2,
  "overtimeDuration": 15
}`}</code></pre>

      <h4>Tenis (SETS) - Best of 3</h4>
      <pre><code>{`{
  "bestOfSets": 3,
  "gamesPerSet": 6,
  "tiebreakPoints": 7,
  "finalSetTiebreak": true
}`}</code></pre>

      <h4>Basketbal (DURATION)</h4>
      <pre><code>{`{
  "periods": 4,
  "periodDuration": 10,
  "overtimePeriods": 1,
  "overtimeDuration": 5
}`}</code></pre>

      <h4>Šipky (POINTS) - 501</h4>
      <pre><code>{`{
  "startingScore": 501,
  "legsToWin": 3,
  "setsToWin": 1,
  "doubleOut": true
}`}</code></pre>

      <h2>{cs ? "Atributy typu události" : "Event Type Attributes"}</h2>
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
            <td>{cs ? "Technický identifikátor (velká písmena, podtržítka)" : "Technical identifier (uppercase, underscores)"}</td>
            <td>{cs ? "Ano" : "Yes"}</td>
          </tr>
          <tr>
            <td><code>labelCs</code></td>
            <td>{cs ? "Český popisek zobrazený v UI" : "Czech label displayed in UI"}</td>
            <td>{cs ? "Ano" : "Yes"}</td>
          </tr>
          <tr>
            <td><code>labelEn</code></td>
            <td>{cs ? "Anglický popisek" : "English label"}</td>
            <td>{cs ? "Doporučeno" : "Recommended"}</td>
          </tr>
          <tr>
            <td><code>icon</code></td>
            <td>{cs ? "Název Lucide ikony (nepovinné)" : "Lucide icon name (optional)"}</td>
            <td>{cs ? "Ne" : "No"}</td>
          </tr>
          <tr>
            <td><code>color</code></td>
            <td>{cs ? "Hex barva pro UI zvýraznění" : "Hex color for UI highlighting"}</td>
            <td>{cs ? "Ne" : "No"}</td>
          </tr>
          <tr>
            <td><code>value</code></td>
            <td>{cs ? "Bodová hodnota (pro DURATION/POINTS)" : "Point value (for DURATION/POINTS)"}</td>
            <td>{cs ? "Volitelné" : "Optional"}</td>
          </tr>
          <tr>
            <td><code>affectsScore</code></td>
            <td>{cs ? "Zda událost mění skóre zápasu" : "Whether event changes match score"}</td>
            <td>{cs ? "Výchozí: true" : "Default: true"}</td>
          </tr>
          <tr>
            <td><code>sortOrder</code></td>
            <td>{cs ? "Pořadí zobrazení v seznamu" : "Display order in list"}</td>
            <td>{cs ? "Výchozí: 0" : "Default: 0"}</td>
          </tr>
        </tbody>
      </table>

      <h2>{cs ? "Pozice hráčů" : "Player Positions"}</h2>
      <p>
        {cs
          ? "Pozice definují role hráčů uvnitř týmu. Jsou volitelné a slouží pro statistiky a organizaci soupisky."
          : "Positions define player roles within a team. They are optional and used for statistics and roster organization."}
      </p>

      <h3>{cs ? "Příklady pozic" : "Position Examples"}</h3>
      <ul>
        <li><strong>Fotbal:</strong> Brankář, Obránce, Záložník, Útočník</li>
        <li><strong>Basketbal:</strong> Rozohrávač, Křídlo, Center</li>
        <li><strong>Volejbal:</strong> Nahrávač, Směčař, Blokař, Libero</li>
      </ul>

      <h2>{cs ? "Best Practices" : "Best Practices"}</h2>
      <ul>
        {cs ? (
          <>
            <li>Vždy definujte <strong>slug</strong> jako URL-friendly verzi názvu (např. <code>ice-hockey</code> místo <code>ledni-hokej</code>)</li>
            <li>Pro každý sport definujte alespoň 3-5 základních událostí pro živé zapisování</li>
            <li>Nastavte smysluplné <strong>výchozí konfigurace</strong> - usnadní to vytváření soutěží</li>
            <li>Používejte konzistentní <strong>barvy</strong> pro události (např. zelená pro góly, žlutá pro karty)</li>
            <li>Deaktivujte nepoužívané sporty místo jejich mazání (zachováte historii)</li>
            <li>Testujte nové sporty v testovací soutěži před produkčním nasazením</li>
          </>
        ) : (
          <>
            <li>Always define <strong>slug</strong> as a URL-friendly version of the name (e.g., <code>ice-hockey</code> instead of <code>ledni-hokej</code>)</li>
            <li>Define at least 3-5 basic events for each sport for live scoring</li>
            <li>Set meaningful <strong>default configurations</strong> - it simplifies competition creation</li>
            <li>Use consistent <strong>colors</strong> for events (e.g., green for goals, yellow for cards)</li>
            <li>Deactivate unused sports instead of deleting them (preserves history)</li>
            <li>Test new sports in a test competition before production deployment</li>
          </>
        )}
      </ul>

      <h2>{cs ? "Řešení problémů" : "Troubleshooting"}</h2>

      <h3>{cs ? "Sport se nezobrazuje při vytváření soutěže" : "Sport doesn't appear when creating competition"}</h3>
      <p>
        {cs
          ? "Zkontrolujte, že sport má nastaveno <code>isActive: true</code>. Neaktivní sporty se nezobrazují v dropdown menu."
          : "Check that the sport has <code>isActive: true</code>. Inactive sports don't appear in dropdown menus."}
      </p>

      <h3>{cs ? "Události se nezapisují správně" : "Events don't record correctly"}</h3>
      <p>
        {cs
          ? "Ujistěte se, že typ události má správně nastaveno <code>affectsScore</code>. Pokud je false, událost se zaznamená, ale nezmění skóre."
          : "Ensure the event type has <code>affectsScore</code> set correctly. If false, the event is recorded but doesn't change the score."}
      </p>

      <h3>{cs ? "Nesprávný výpočet skóre" : "Incorrect score calculation"}</h3>
      <p>
        {cs
          ? "Zkontrolujte, že máte správně nastavený <strong>MatchType</strong>. Každý typ používá jiný algoritmus pro výpočet skóre."
          : "Check that you have the correct <strong>MatchType</strong> set. Each type uses a different algorithm for score calculation."}
      </p>

      <div className="not-prose mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <span className="text-primary">💡</span>
          {cs ? "Potřebujete pomoc?" : "Need Help?"}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          {cs
            ? "Pro detailní technickou dokumentaci API se podívejte do souborů v adresáři:"
            : "For detailed technical API documentation, see files in directory:"}
        </p>
        <code className="text-xs bg-muted px-2 py-1 rounded">src/app/api/admin/sports/</code>
      </div>
    </article>
  );
}
