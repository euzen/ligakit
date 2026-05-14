import Link from "next/link";
import { Trophy } from "lucide-react";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-700 p-2 rounded-xl">
              <Trophy className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              liga<span className="text-blue-700 font-light">kit</span>
            </span>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Zásady cookies</h1>
          <p className="text-slate-500 text-sm">Platné od 1. 1. 2025</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Co jsou cookies</h2>
          <p className="text-slate-600 leading-relaxed">
            Cookies jsou malé textové soubory ukládané do vašeho prohlížeče při návštěvě webových stránek. Pomáhají zajistit správné fungování Služby a zlepšovat uživatelský zážitek.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Jaké cookies používáme</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Název</th>
                  <th className="text-left px-4 py-3 font-semibold">Typ</th>
                  <th className="text-left px-4 py-3 font-semibold">Účel</th>
                  <th className="text-left px-4 py-3 font-semibold">Expirace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">next-auth.session-token</td>
                  <td className="px-4 py-3">Nezbytné</td>
                  <td className="px-4 py-3">Autentizace uživatele</td>
                  <td className="px-4 py-3">Relace / 30 dní</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">next-auth.csrf-token</td>
                  <td className="px-4 py-3">Nezbytné</td>
                  <td className="px-4 py-3">Ochrana před CSRF útoky</td>
                  <td className="px-4 py-3">Relace</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Nezbytné cookies</h2>
          <p className="text-slate-600 leading-relaxed">
            Tyto cookies jsou nezbytné pro fungování Služby a nelze je vypnout. Jsou nastaveny pouze v reakci na vaše akce (přihlášení, nastavení). Neukládají žádné osobní identifikátory.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Analytické a marketingové cookies</h2>
          <p className="text-slate-600 leading-relaxed">
            V současnosti Ligakit nepoužívá žádné analytické ani marketingové cookies třetích stran.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Správa cookies</h2>
          <p className="text-slate-600 leading-relaxed">
            Cookies můžete spravovat nebo zakázat v nastavení vašeho prohlížeče. Upozorňujeme, že zakázání nezbytných cookies může způsobit nefunkčnost Služby (zejména přihlašování).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Více informací</h2>
          <p className="text-slate-600 leading-relaxed">
            Více o zpracování osobních údajů naleznete v <Link href="../privacy" className="text-blue-700 hover:underline">Zásadách ochrany soukromí</Link>.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-8 px-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Ligakit. Všechna práva vyhrazena.</p>
      </footer>
    </div>
  );
}
