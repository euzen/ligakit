"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Dumbbell, Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";

interface Props {
  locale: string;
  sportId: string;
  initialName: string;
  initialDescription: string;
  initialIcon: string;
  initialConfig: string;
}

export function EditSportForm({ locale, sportId, initialName, initialDescription, initialIcon, initialConfig }: Props) {
  const router = useRouter();
  const cs = locale === "cs";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: initialName,
    description: initialDescription,
    icon: initialIcon,
    config: initialConfig,
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError(cs ? "Název je povinný." : "Name is required.");
      return;
    }
    if (form.config) {
      try { JSON.parse(form.config); } catch {
        setError(cs ? "Konfigurace není validní JSON." : "Config is not valid JSON.");
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sports/${sportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description || null,
          icon: form.icon || null,
          config: form.config || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || (cs ? "Chyba při ukládání." : "Error saving."));
        return;
      }
      router.push(`/${locale}/admin/sports/${sportId}`);
      router.refresh();
    } catch {
      setError(cs ? "Síťová chyba." : "Network error.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors";
  const labelCls = "text-sm font-semibold text-slate-700";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a
          href={`/${locale}/admin/sports/${sportId}`}
          className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all"
        >
          <ArrowLeft className="size-5 text-slate-600" />
        </a>
        <div className="flex items-center gap-3">
          {form.icon
            ? <img src={form.icon} alt="" className="size-10 rounded-xl object-cover border border-slate-200" />
            : <div className="p-2.5 rounded-xl bg-blue-100"><Dumbbell className="size-5 text-blue-700" /></div>
          }
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {cs ? `Upravit: ${initialName}` : `Edit: ${initialName}`}
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-blue-700 px-6 py-5">
            <h2 className="font-bold text-white">{cs ? "Základní informace" : "Basic Information"}</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className={labelCls}>{cs ? "Název sportu" : "Sport name"} *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>{cs ? "Popis" : "Description"}</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors resize-none"
              />
            </div>

            <ImageUpload
              value={form.icon}
              onChange={(url) => set("icon", url)}
              uploadEndpoint="/api/sports/upload"
              label={cs ? "Ikona sportu" : "Sport icon"}
            />
          </div>
        </div>

        {/* Engine config */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-900">{cs ? "Konfigurace enginu" : "Engine Configuration"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {cs
                ? 'JSON – klíč "engine": "football" | "generic". Prázdné = generic.'
                : 'JSON – key "engine": "football" | "generic". Empty = generic.'}
            </p>
          </div>
          <div className="p-6">
            <textarea
              value={form.config}
              onChange={(e) => set("config", e.target.value)}
              rows={6}
              placeholder='{"engine": "football", "periods": 2, "periodDuration": 45}'
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 disabled:opacity-60 shadow-md shadow-blue-100 transition-all"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {cs ? "Uložit změny" : "Save changes"}
          </button>
          <a
            href={`/${locale}/admin/sports/${sportId}`}
            className="inline-flex items-center h-11 px-6 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 hover:border-blue-700 hover:text-blue-700 transition-all"
          >
            {cs ? "Zrušit" : "Cancel"}
          </a>
        </div>
      </form>
    </div>
  );
}
