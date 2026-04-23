export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cs = locale === "cs";

  return (
    <article className="docs-prose">
      <h1>{cs ? "Účet a profil" : "Account & Profile"}</h1>

      <h2>{cs ? "Registrace" : "Registration"}</h2>
      <p>{cs ? "Pro vytvoření účtu klikni na Registrovat se v navigaci. Zadej email, jméno a heslo (min. 8 znaků)." : "To create an account, click Register in the navigation. Enter your email, name, and password (min. 8 characters)."}</p>

      <h2>{cs ? "Přihlášení" : "Sign In"}</h2>
      <p>{cs ? "Po registraci se přihlásíš emailem a heslem. Session se udržuje pomocí JWT tokenu." : "After registration, sign in with your email and password. Session is maintained using a JWT token."}</p>

      <h2>{cs ? "Profil" : "Profile"}</h2>
      <ul>
        {cs ? (
          <>
            <li><strong>Jméno</strong> — zobrazuje se v navigaci a u soutěží.</li>
            <li><strong>Avatar</strong> — profilový obrázek (JPG, PNG, WebP, max. 5 MB).</li>
            <li><strong>Téma</strong> — světlý nebo tmavý režim. Nastavení se ukládá do profilu.</li>
          </>
        ) : (
          <>
            <li><strong>Name</strong> — displayed in the navigation and on competitions.</li>
            <li><strong>Avatar</strong> — profile picture (JPG, PNG, WebP, max. 5 MB).</li>
            <li><strong>Theme</strong> — light or dark mode. Setting is saved to your profile.</li>
          </>
        )}
      </ul>

      <h2>{cs ? "Zapomenuté heslo" : "Forgotten Password"}</h2>
      <p>{cs ? "Reset hesla přes email není v současné verzi k dispozici. Kontaktuj administrátora aplikace." : "Email-based password reset is not available in the current version. Contact your application administrator."}</p>
    </article>
  );
}
