import Link from "next/link";
import { Trophy } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Zásady ochrany soukromí</h1>
          <p className="text-slate-500 text-sm">Platné od 1. 1. 2025</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">1. Správce osobních údajů</h2>
          <p className="text-slate-600 leading-relaxed">
            Správcem osobních údajů je provozovatel platformy Ligakit. Osobní údaje zpracováváme v souladu s nařízením GDPR a zákonem č. 110/2019 Sb.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">2. Jaké údaje shromažďujeme</h2>
          <ul className="list-disc list-inside text-slate-600 space-y-2 leading-relaxed">
            <li>Registrační údaje: e-mailová adresa a jméno</li>
            <li>Údaje o soutěžích, týmech a hráčích, které do Služby vložíte</li>
            <li>Technické údaje: IP adresa, typ prohlížeče, časy přístupů (logy)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">3. Účel zpracování</h2>
          <p className="text-slate-600 leading-relaxed">
            Osobní údaje zpracováváme za účelem poskytování Služby, komunikace s uživateli a zajištění bezpečnosti platformy. Údaje neprodáváme třetím stranám.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">4. Uchovávání dat</h2>
          <p className="text-slate-600 leading-relaxed">
            Údaje uchováváme po dobu trvání vašeho účtu a dále po dobu stanovenou platnými právními předpisy. Po zrušení účtu jsou data do 30 dnů smazána.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">5. Vaše práva</h2>
          <p className="text-slate-600 leading-relaxed">
            Máte právo na přístup ke svým údajům, jejich opravu, výmaz a přenositelnost. Také máte právo vznést námitku proti zpracování. Žádost uplatněte prostřednictvím sekce Dokumentace.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">6. Cookies</h2>
          <p className="text-slate-600 leading-relaxed">
            Informace o cookies naleznete v samostatných <Link href="../cookies" className="text-blue-700 hover:underline">Zásadách cookies</Link>.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-8 px-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Ligakit. Všechna práva vyhrazena.</p>
      </footer>
    </div>
  );
}
