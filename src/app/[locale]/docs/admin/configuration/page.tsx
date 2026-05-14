export default async function AdminConfigurationDocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Konfigurace systému" : "System Configuration"}</h1>
      <p className="lead text-muted-foreground text-lg">
        {cs
          ? "Přehled konfiguračních možností administrátorského panelu."
          : "Overview of configuration options in the admin panel."}
      </p>

      <h2>{cs ? "Sporty" : "Sports"}</h2>
      <p>
        {cs
          ? "V sekci Sporty definujete jednotlivé sporty a jejich pravidla. Každý sport má konfigurační JSON, který určuje engine (football, generic), počet částí, délku hry a bodovací systém."
          : "In the Sports section you define individual sports and their rules. Each sport has a configuration JSON specifying the engine (football, generic), number of periods, game duration and scoring system."}
      </p>

      <h2>{cs ? "Typy událostí" : "Event Types"}</h2>
      <p>
        {cs
          ? "Každý sport má vlastní sadu typů událostí (gól, karta, střídání…). Pro každý typ nastavíte: název, ikonu, zda ovlivňuje skóre a hodnotu bodu."
          : "Each sport has its own set of event types (goal, card, substitution…). For each type you configure: name, icon, whether it affects the score and the point value."}
      </p>

      <h2>{cs ? "Uživatelé a role" : "Users and Roles"}</h2>
      <p>
        {cs
          ? "Administrátor může v panelu /admin/users přiřazovat role (USER, ADMINISTRATOR), deaktivovat účty nebo zobrazit historii akcí v sekci Audit."
          : "An administrator can assign roles (USER, ADMINISTRATOR), deactivate accounts or view action history in the Audit section at /admin/users."}
      </p>

      <h2>{cs ? "Audit log" : "Audit Log"}</h2>
      <p>
        {cs
          ? "Sekce /admin/audit zaznamenává klíčové akce v systému – vytvoření soutěže, změnu výsledku, správu uživatelů. Záznamy jsou seřazeny od nejnovějšího."
          : "The /admin/audit section records key system actions – competition creation, result changes, user management. Records are sorted newest first."}
      </p>
    </article>
  );
}
