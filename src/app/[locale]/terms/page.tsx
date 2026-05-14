import Link from "next/link";
import { Trophy } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-700 p-1.5 rounded-lg">
              <Trophy className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              liga<span className="text-blue-700 font-light">kit</span>
            </span>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Podmínky užití</h1>
          <p className="text-slate-500 text-sm">Platné od 1. 1. 2025</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">1. Úvodní ustanovení</h2>
          <p className="text-slate-600 leading-relaxed">
            Tyto podmínky užití upravují přístup a používání platformy Ligakit (dále jen „Služba"). Používáním Služby vyjadřujete souhlas s těmito podmínkami. Pokud s podmínkami nesouhlasíte, Službu nepoužívejte.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">2. Registrace a účet</h2>
          <p className="text-slate-600 leading-relaxed">
            Pro přístup k některým funkcím Služby je nutná registrace. Jste zodpovědní za zachování důvěrnosti přihlašovacích údajů a za veškerou činnost provedenou pod vaším účtem.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">3. Používání Služby</h2>
          <p className="text-slate-600 leading-relaxed">
            Zavazujete se Službu používat v souladu s platnými právními předpisy a těmito podmínkami. Zejména se zavazujete nevkládat obsah, který je nezákonný, urážlivý nebo porušuje práva třetích osob.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">4. Duševní vlastnictví</h2>
          <p className="text-slate-600 leading-relaxed">
            Veškerý obsah platformy Ligakit, včetně loga, designu a zdrojového kódu, je chráněn autorskými právy. Data, která vložíte do Služby (soutěže, hráči, výsledky), zůstávají vaším vlastnictvím.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">5. Omezení odpovědnosti</h2>
          <p className="text-slate-600 leading-relaxed">
            Služba je poskytována „jak stojí". Nenese odpovědnost za přerušení provozu, ztrátu dat ani škody vzniklé v důsledku používání Služby.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">6. Změny podmínek</h2>
          <p className="text-slate-600 leading-relaxed">
            Vyhrazujeme si právo tyto podmínky kdykoli změnit. O podstatných změnách budete informováni e-mailem nebo prostřednictvím Služby.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">7. Kontakt</h2>
          <p className="text-slate-600 leading-relaxed">
            Máte-li dotazy k těmto podmínkám, kontaktujte nás prostřednictvím sekce Dokumentace.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-8 px-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Ligakit. Všechna práva vyhrazena.</p>
      </footer>
    </div>
  );
}
