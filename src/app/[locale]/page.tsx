"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Trophy,
  Activity,
  Settings,
  Users,
  Smartphone,
  ChevronRight,
  Play,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Globe,
} from "lucide-react";

export default function HomePage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated" && !!session;

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("match");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Navigace */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-md py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-blue-700 p-2 rounded-xl group-hover:rotate-6 transition-transform">
              <Trophy className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              liga<span className="text-blue-700 font-light">kit</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#funkce" className="hover:text-blue-700 transition-colors">
              Funkce
            </a>
            <a href="#engine" className="hover:text-blue-700 transition-colors">
              Sportovní Engine
            </a>
            <a href={`/${locale}/docs`} className="hover:text-blue-700 transition-colors">
              Dokumentace
            </a>
            <div className="h-6 w-px bg-slate-200" />
            {status !== "loading" && (
              loggedIn ? (
                <a
                  href={`/${locale}/dashboard`}
                  className="bg-blue-700 text-white px-6 py-2.5 rounded-full hover:bg-blue-800 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </a>
              ) : (
                <>
                  <a
                    href={`/${locale}/login`}
                    className="text-slate-700 hover:text-blue-700 transition-colors"
                  >
                    Přihlásit
                  </a>
                  <a
                    href={`/${locale}/register`}
                    className="bg-blue-700 text-white px-6 py-2.5 rounded-full hover:bg-blue-800 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                  >
                    Vytvořit turnaj <ChevronRight size={16} />
                  </a>
                </>
              )
            )}
          </div>

          <button className="lg:hidden text-slate-900">
            <Activity size={24} />
          </button>
        </div>
      </nav>

      {/* Hero Sekce */}
      <header className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/50 -z-10 rounded-l-[100px] hidden lg:block" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
              Spravujte sport
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
              Organizujte sport <br />
              <span className="text-blue-700">v reálném čase.</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
              Ligakit je intuitivní platforma pro tvorbu turnajů a lig s live
              přenosy ve stylu Livesport. Od registrací až po finálový hvizd.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={`/${locale}/register`}
                className="bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-800 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3"
              >
                Založit turnaj <ChevronRight size={20} />
              </a>
              <a
                href={`/${locale}/competitions`}
                className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:border-blue-700 hover:text-blue-700 transition-all flex items-center justify-center gap-3"
              >
                Prohlédnout soutěže <Play size={18} fill="currentColor" />
              </a>
            </div>
          </div>

          {/* Live Center Card */}
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
            <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden relative z-10">
              <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                    Live
                  </div>
                  <span className="text-sm font-bold opacity-80">
                    Krajský přebor • 14. kolo
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>
              </div>

              <div className="p-10 flex flex-col items-center border-b border-slate-50">
                <div className="flex items-center gap-10 mb-8">
                  <div className="text-center w-24">
                    <div className="w-16 h-16 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                      <ShieldCheck className="text-blue-700" size={32} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-tight">
                      FK Slavoj
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl font-black tabular-nums tracking-tighter">
                      2 : 1
                    </div>
                    <div className="mt-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full inline-block">
                      72:45
                    </div>
                  </div>
                  <div className="text-center w-24">
                    <div className="w-16 h-16 mx-auto bg-orange-50 rounded-2xl flex items-center justify-center mb-3">
                      <Trophy className="text-orange-500" size={32} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-tight">
                      SK Jiskra
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-3">
                    <span className="text-slate-400 font-medium">
                      Držení míče
                    </span>
                    <div className="flex-1 mx-4 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-600 w-[58%]" />
                      <div className="h-full bg-orange-500 w-[42%]" />
                    </div>
                    <span className="text-slate-400 font-medium">
                      58% vs 42%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 flex gap-2">
                <button
                  onClick={() => setActiveTab("match")}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                    activeTab === "match"
                      ? "bg-white shadow-sm text-blue-700"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Zápas
                </button>
                <button
                  onClick={() => setActiveTab("table")}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                    activeTab === "table"
                      ? "bg-white shadow-sm text-blue-700"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Live Tabulka
                </button>
              </div>
            </div>

            {/* Overlay badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 z-20">
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Status
                </div>
                <div className="text-sm font-bold">Synchronizováno</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Funkce Grid */}
      <section id="funkce" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Kompletní ekosystém pro váš sport
            </h2>
            <p className="text-slate-500 text-lg">
              Vše, co potřebujete od prvního nápadu na turnaj až po vyhlášení
              vítězů a archivaci statistik.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[32px] bg-slate-50 hover:bg-blue-50/50 transition-colors group">
              <div className="w-14 h-14 bg-blue-700 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
                <LayoutDashboard size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Automatické tabulky</h3>
              <p className="text-slate-600 leading-relaxed">
                Zadejte výsledek a Ligakit okamžitě přepočítá body, skóre i
                vzájemné zápasy. Podporujeme pavouky, skupiny i dlouhodobé ligy.
              </p>
            </div>

            <div className="p-10 rounded-[32px] bg-slate-50 hover:bg-orange-50/50 transition-colors group">
              <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-orange-100 group-hover:scale-110 transition-transform">
                <Smartphone size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Mobilní "Scorer"</h3>
              <p className="text-slate-600 leading-relaxed">
                Rozhraní pro zapisovatele je navrženo pro práci v terénu. Góly,
                karty a tresty zapíšete jedním dotykem přímo u hřiště.
              </p>
            </div>

            <div className="p-10 rounded-[32px] bg-slate-50 hover:bg-blue-50/50 transition-colors group">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">
                <Globe size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Live Microsite</h3>
              <p className="text-slate-600 leading-relaxed">
                Každý turnaj dostane svou vlastní profesionální webovou stránku,
                kterou mohou fanoušci sledovat odkudkoliv na světě.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Engine Section */}
      <section id="engine" className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold tracking-tight">
              Sportovní engine, který se vám přizpůsobí
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Nehrajete podle standardních pravidel? Nevadí. Ligakit je
              stavebnice, kde si definujete hrací dobu, počet částí i bodový
              systém.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="bg-blue-100 text-blue-700 p-2 rounded-lg mt-1">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-bold">Flexibilní hrací doba</h4>
                  <p className="text-sm text-slate-500">
                    Poločasy, třetiny nebo sety. Nastavte si délku každé části
                    podle svého.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-orange-100 text-orange-600 p-2 rounded-lg mt-1">
                  <Users size={20} />
                </div>
                <div>
                  <h4 className="font-bold">Správa soupisek</h4>
                  <p className="text-sm text-slate-500">
                    Hráči, náhradníci, realizační týmy. Vše přehledně na jednom
                    místě s historií statistik.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <a href={`/${locale}/docs`} className="flex items-center gap-2 font-bold text-blue-700 hover:gap-4 transition-all">
                Dokumentace a návody <ChevronRight size={20} />
              </a>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[40px] shadow-2xl border border-slate-100 rotate-2">
            <div className="bg-slate-50 rounded-[32px] p-8 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">Konfigurace Enginu</h3>
                <Settings className="text-slate-300" />
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold italic">
                      F
                    </div>
                    <span className="font-bold">Fotbal (Default)</span>
                  </div>
                  <ChevronDown size={20} className="text-slate-300" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">
                      Poločasy
                    </label>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 font-bold text-center">
                      2
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">
                      Minuty
                    </label>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 font-bold text-center text-blue-700">
                      45
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">
                    Bodování (V/R/P)
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-4 bg-white rounded-2xl border border-slate-100 font-bold text-center">
                      3
                    </div>
                    <div className="flex-1 p-4 bg-white rounded-2xl border border-slate-100 font-bold text-center">
                      1
                    </div>
                    <div className="flex-1 p-4 bg-white rounded-2xl border border-slate-100 font-bold text-center">
                      0
                    </div>
                  </div>
                </div>
              </div>

              <a href={`/${locale}/competitions/new`} className="block w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors text-center">
                Založit soutěž
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Sekce */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-blue-700 rounded-[48px] p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-500 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl opacity-20" />

          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl font-black">
              Připraveni na výkop?
            </h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto">
              Založte svůj první turnaj během 5 minut. Bez poplatků za
              registraci, s neomezeným počtem diváků.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`/${locale}/register`}
                className="bg-white text-blue-700 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl"
              >
                Založit turnaj zdarma
              </a>
              <a
                href={`/${locale}/docs`}
                className="bg-blue-800/50 border border-blue-400/30 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-800 transition-all"
              >
                Dokumentace
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Patička */}
      <footer className="bg-white pt-20 pb-10 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 mb-16">
          <div className="col-span-1 space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-700 p-2 rounded-xl">
                <Trophy className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight">
                liga<span className="text-blue-700 font-light">kit</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Moderní platforma pro digitální transformaci sportovních událostí.
              Od amatérů pro profesionály.
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-6">Platforma</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li>
                <a href={`/${locale}/competitions`} className="hover:text-blue-700 transition-colors">
                  Soutěže
                </a>
              </li>
              <li>
                <a href={`/${locale}/competitions/new`} className="hover:text-blue-700 transition-colors">
                  Vytvořit soutěž
                </a>
              </li>
              <li>
                <a href={`/${locale}/teams`} className="hover:text-blue-700 transition-colors">
                  Týmy
                </a>
              </li>
              <li>
                <a href={`/${locale}/dashboard`} className="hover:text-blue-700 transition-colors">
                  Dashboard
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6">Dokumentace</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li>
                <a href={`/${locale}/docs/introduction`} className="hover:text-blue-700 transition-colors">
                  Úvod
                </a>
              </li>
              <li>
                <a href={`/${locale}/docs/quick-start`} className="hover:text-blue-700 transition-colors">
                  Rychlý start
                </a>
              </li>
              <li>
                <a href={`/${locale}/docs/faq`} className="hover:text-blue-700 transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href={`/${locale}/docs/account`} className="hover:text-blue-700 transition-colors">
                  Správa účtu
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} Ligakit. Všechna práva vyhrazena.</p>
          <div className="flex gap-8">
            <a href={`/${locale}/login`} className="hover:text-blue-700">Přihlásit</a>
            <a href={`/${locale}/register`} className="hover:text-blue-700">Registrovat</a>
            <a href={`/${locale}/terms`} className="hover:text-blue-700">Podmínky užití</a>
            <a href={`/${locale}/privacy`} className="hover:text-blue-700">Soukromí</a>
            <a href={`/${locale}/cookies`} className="hover:text-blue-700">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
