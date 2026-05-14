"use client";

import { useState } from "react";
import { Loader2, Save, Info } from "lucide-react";

interface Props {
  sportId: string;
  initialConfig: string;
  cs: boolean;
}

const PRESETS: { icon: string; labelCs: string; labelEn: string; config: object }[] = [
  {
    icon: "⚽",
    labelCs: "Fotbal",
    labelEn: "Football",
    config: { engine: "football", periods: 2, periodDuration: 45, winPoints: 3, drawPoints: 1, lossPoints: 0, overtimeAllowed: false },
  },
  {
    icon: "🏒",
    labelCs: "Hokej",
    labelEn: "Ice Hockey",
    config: { engine: "generic", periods: 3, periodDuration: 20, winPoints: 3, drawPoints: 2, lossPoints: 1, overtimeAllowed: true, tiebreak: "extra_time" },
  },
  {
    icon: "🏀",
    labelCs: "Basketbal",
    labelEn: "Basketball",
    config: { engine: "generic", periods: 4, periodDuration: 10, winPoints: 2, drawPoints: 0, lossPoints: 1, overtimeAllowed: true },
  },
  {
    icon: "🏐",
    labelCs: "Volejbal",
    labelEn: "Volleyball",
    config: { engine: "generic", periods: 5, periodDuration: 0, winPoints: 3, drawPoints: 2, lossPoints: 1, overtimeAllowed: false },
  },
  {
    icon: "🏃",
    labelCs: "Futsal",
    labelEn: "Futsal",
    config: { engine: "football", periods: 2, periodDuration: 20, winPoints: 3, drawPoints: 1, lossPoints: 0, overtimeAllowed: false },
  },
  {
    icon: "🏉",
    labelCs: "Ragby",
    labelEn: "Rugby",
    config: { engine: "generic", periods: 2, periodDuration: 40, winPoints: 4, drawPoints: 2, lossPoints: 0, overtimeAllowed: false },
  },
  {
    icon: "🎯",
    labelCs: "Obecný",
    labelEn: "Generic",
    config: { engine: "generic", periods: 2, periodDuration: 0, winPoints: 3, drawPoints: 1, lossPoints: 0, overtimeAllowed: false },
  },
];

export function ConfigPanel({ sportId, initialConfig, cs }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (config.trim()) {
      try { JSON.parse(config); } catch {
        setError(cs ? "Neplatný JSON." : "Invalid JSON.");
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sports/${sportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: config.trim() || null }),
      });
      if (!res.ok) { setError("Error saving"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const injectPreset = (preset: object) => {
    setConfig(JSON.stringify(preset, null, 2));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50">
        <h2 className="font-bold text-slate-900">{cs ? "Konfigurace enginu" : "Engine Configuration"}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{cs ? "JSON objekt – řídí výpočet skóre a pravidla soutěže" : "JSON object – controls score calculation and competition rules"}</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Quick engine selector */}
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">{cs ? "Rychlé přednastavení:" : "Quick preset:"}</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.labelEn}
                type="button"
                onClick={() => injectPreset(p.config)}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:border-blue-700 hover:text-blue-700 transition-all"
              >
                <span>{p.icon}</span>
                {cs ? p.labelCs : p.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Config table */}
        <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden text-xs">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-3 py-2 text-left font-semibold text-slate-600">{cs ? "Klíč" : "Key"}</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">{cs ? "Hodnoty" : "Values"}</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">{cs ? "Popis" : "Description"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ["engine",           "football | generic",       cs ? "Výpočetní engine"            : "Scoring engine"],
                ["periods",          "2, 3, 4…",               cs ? "Počet poločasů/třetin"        : "Number of periods"],
                ["periodDuration",   "45, 20, 10…",            cs ? "Délka periody v minutách"     : "Period duration in minutes"],
                ["overtimeAllowed",  "true | false",           cs ? "Povolit prodloužení"          : "Allow overtime"],
                ["tiebreak",         "penalties | extra_time", cs ? "Způsob rozhodnutí remízy"     : "Tiebreak method"],
                ["winPoints",        "3",                      cs ? "Body za výhru (tabulka)"      : "Points for a win (standings)"],
                ["drawPoints",       "1",                      cs ? "Body za remízu"               : "Points for a draw"],
                ["lossPoints",       "0",                      cs ? "Body za prohru"               : "Points for a loss"],
              ].map(([key, vals, desc]) => (
                <tr key={key} className="hover:bg-white transition-colors">
                  <td className="px-3 py-2 font-mono font-bold text-blue-700">{key}</td>
                  <td className="px-3 py-2 text-slate-500 font-mono">{vals}</td>
                  <td className="px-3 py-2 text-slate-500">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">{cs ? "Prázdná konfigurace = použije se generic engine automaticky." : "Empty config = generic engine is used automatically."}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2">{error}</div>
        )}

        <textarea
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          rows={8}
          placeholder='{"engine": "football", "periods": 2, "periodDuration": 45}'
          className="w-full rounded-xl border border-slate-200 bg-slate-900 text-green-400 font-mono text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 resize-none"
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 disabled:opacity-60 shadow-md shadow-blue-100 transition-all"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saved ? (cs ? "Uloženo ✓" : "Saved ✓") : (cs ? "Uložit konfiguraci" : "Save configuration")}
        </button>
      </div>
    </div>
  );
}
