export default async function CupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  const presets = [
    {
      key: "WINNERS_ONLY",
      name: cs ? "Pouze vítězové" : "Winners only",
      desc: cs ? "Z každé skupiny postupuje jen vítěz. Nejjednodušší varianta." : "Only the group winner advances. The simplest option.",
      example: cs ? "4 skupiny → 4 týmy v semifinále" : "4 groups → 4 teams in semi-finals",
    },
    {
      key: "TOP2_CROSS",
      name: cs ? "Top 2 — křížení" : "Top 2 — crossed",
      desc: cs ? "První dva ze skupiny, křížené párování: vítěz A vs. 2. B, vítěz B vs. 2. A." : "Top 2 from each group, crossed: winner A vs. 2nd B, winner B vs. 2nd A.",
      example: cs ? "2 skupiny → 4 týmy v semifinále" : "2 groups → 4 teams in semi-finals",
    },
    {
      key: "TOP2_STRAIGHT",
      name: cs ? "Top 2 — rovné" : "Top 2 — straight",
      desc: cs ? "První dva ze skupiny, přímé párování: vítěz A vs. 2. A, vítěz B vs. 2. B. Jen pro 2 skupiny." : "Top 2, direct pairing: winner A vs. 2nd A, winner B vs. 2nd B. Only for 2 groups.",
      example: cs ? "2 skupiny → 4 týmy v semifinále" : "2 groups → 4 teams in semi-finals",
    },
    {
      key: "TOP2_BEST_3RD",
      name: cs ? "Top 2 + nejlepší třetí" : "Top 2 + best 3rd",
      desc: cs ? "První dva ze skupiny + nejlepší třetí místa. Pro 4 skupiny → 16 týmů do osmifinále." : "Top 2 from each group + best 3rd-place teams. For 4 groups → 16 teams in round of 16.",
      example: cs ? "4 skupiny → 16 týmů v osmifinále" : "4 groups → 16 teams in round of 16",
    },
    {
      key: "TOP3_ALL",
      name: cs ? "První tři" : "Top 3",
      desc: cs ? "Z každé skupiny postupují první tři týmy." : "Top 3 teams from each group advance.",
      example: cs ? "4 skupiny → 12 týmů v play-off" : "4 groups → 12 teams in play-off",
    },
  ];

  return (
    <article className="docs-prose">
      <h1>{cs ? "CUP — skupiny a pavouk" : "CUP — Groups & Bracket"}</h1>
      <p className="text-muted-foreground text-lg">
        {cs
          ? "Pohárový formát kombinuje skupinovou fázi s vyřazovacím pavouk."
          : "The cup format combines a group stage with a knockout bracket."}
      </p>

      <h2>{cs ? "Jak CUP funguje?" : "How does CUP work?"}</h2>
      <ol>
        {cs ? (
          <>
            <li><strong>Skupinová fáze</strong> — Týmy se rozdělí do skupin a hrají každý s každým (round-robin).</li>
            <li><strong>Postup</strong> — Nejlepší týmy ze skupin postupují do vyřazovací části podle zvoleného pravidla.</li>
            <li><strong>Pavouk</strong> — Vyřazovací část s párováním postupujících týmů. Zápasy se vyplní po skončení skupin.</li>
          </>
        ) : (
          <>
            <li><strong>Group Stage</strong> — Teams are divided into groups and play round-robin.</li>
            <li><strong>Advancement</strong> — The best teams from each group advance to the knockout stage based on the chosen rule.</li>
            <li><strong>Bracket</strong> — Knockout stage with advancing teams. Matches are filled in after the group stage ends.</li>
          </>
        )}
      </ol>

      <h2>{cs ? "Pravidla postupu" : "Advancement Rules"}</h2>
      <div className="not-prose space-y-3 my-4">
        {presets.map((p) => (
          <div key={p.key} className="border rounded-lg p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm">{p.name}</h3>
              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">{p.key}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{p.desc}</p>
            <p className="text-xs text-muted-foreground">📌 {p.example}</p>
          </div>
        ))}
      </div>

      <h2>{cs ? "Zobrazení pavouka" : "Bracket View"}</h2>
      <p>
        {cs
          ? "Po rozlosování se v detailu soutěže zobrazí záložka Pavouk. V ní jsou vidět zápasy vyřazovací části — skupinové zápasy se tam nezobrazují."
          : "After the draw, the competition detail shows a Bracket tab. It displays knockout stage matches only — group stage matches are not shown."}
      </p>
      <p>
        {cs
          ? "Dokud není odehrána skupinová fáze, zápasy pavouka zobrazují placeholdery (např. 1. A, 2. B). Po zadání výsledků skupin se místa v pavouku doplní automaticky."
          : "Until the group stage is completed, bracket matches show placeholders (e.g. 1st A, 2nd B). After entering group results, the bracket positions fill in automatically."}
      </p>
    </article>
  );
}
