export default async function CompetitionTeamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Přidání týmů do soutěže" : "Adding Teams to a Competition"}</h1>

      <h2>{cs ? "Vlastní týmy" : "Your Own Teams"}</h2>
      <p>{cs ? "V detailu soutěže → záložka Týmy → Přidat tým. Vybereš ze svých týmů nebo týmů ostatních uživatelů v systému." : "In the competition detail → Teams tab → Add Team. Choose from your teams or other users' teams in the system."}</p>

      <h2>{cs ? "Hostující týmy" : "Guest Teams"}</h2>
      <p>{cs ? "Hostující tým je tým bez účtu v systému. Zadáš pouze název. Tým nemá hráče spravované v systému (lze přidat přes speciální odkaz)." : "A guest team is a team without a system account. Just enter a name. The team has no players managed in the system (can be added via a special link)."}</p>

      <h2>{cs ? "Waitlist" : "Waitlist"}</h2>
      <p>{cs ? "Pokud je soutěž plná (nastaven max. počet týmů), nové týmy se zařadí na čekací listinu. Organizátor může tým přesunout z čekací listiny na aktivní místo." : "If the competition is full (max team count set), new teams are placed on the waitlist. The organizer can move a team from the waitlist to an active spot."}</p>

      <h2>{cs ? "Odebrání týmu" : "Removing a Team"}</h2>
      <p>{cs ? "Tým lze odebrat ze soutěže před rozlosováním. Po rozlosování odebrání nedoporučujeme — zápasy s tímto týmem zůstanou v systému." : "A team can be removed from a competition before the draw. After the draw, removal is not recommended — matches involving this team will remain in the system."}</p>
    </article>
  );
}
