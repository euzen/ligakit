export default async function AdminDocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Dokumentace pro administrátory" : "Administrator Documentation"}</h1>
      <p className="lead text-muted-foreground text-lg">
        {cs
          ? "Návod pro správu sportů, soutěží a systémové konfigurace."
          : "Guide for managing sports, competitions and system configuration."}
      </p>

      <h2>{cs ? "Obsah" : "Contents"}</h2>
      <ul>
        <li>
          <a href={`/${locale}/docs/admin/sports`}>
            {cs ? "Správa sportů" : "Sports Management"}
          </a>
        </li>
        <li>
          <a href={`/${locale}/docs/admin/configuration`}>
            {cs ? "Konfigurace systému" : "System Configuration"}
          </a>
        </li>
      </ul>

      <h2>{cs ? "Přehled administrace" : "Administration Overview"}</h2>
      <p>
        {cs
          ? "Administrátorský panel umožňuje komplexní správu aplikace LigaKit. Klíčové funkce zahrnují:"
          : "The admin panel allows comprehensive management of the LigaKit application. Key features include:"}
      </p>
      <ul>
        {cs ? (
          <>
            <li><strong>Správa sportů</strong> – definice sportů, typů událostí, pozic hráčů</li>
            <li><strong>Správa uživatelů</strong> – role, oprávnění, blokování</li>
            <li><strong>Systémová nastavení</strong> – globální konfigurace, údržba</li>
          </>
        ) : (
          <>
            <li><strong>Sports Management</strong> – define sports, event types, player positions</li>
            <li><strong>User Management</strong> – roles, permissions, blocking</li>
            <li><strong>System Settings</strong> – global configuration, maintenance</li>
          </>
        )}
      </ul>
    </article>
  );
}
