"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, Loader2 } from "lucide-react";

interface Props {
  locale: string;
  sportId: string;
  sportName: string;
}

export function NewEventTypeForm({ locale, sportId, sportName }: Props) {
  const router = useRouter();
  const cs = locale === "cs";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    labelCs: "",
    labelEn: "",
    value: "",
    affectsScore: true,
    color: "#22c55e",
    icon: "",
    sortOrder: "0",
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.labelCs) {
      setError(cs ? "Vyplňte povinná pole." : "Fill in required fields.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sports/${sportId}/event-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.toUpperCase().replace(/\s+/g, "_"),
          labelCs: form.labelCs,
          labelEn: form.labelEn || form.labelCs,
          value: form.value ? parseInt(form.value) : null,
          affectsScore: form.affectsScore,
          color: form.color,
          icon: form.icon || null,
          sortOrder: parseInt(form.sortOrder) || 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || (cs ? "Chyba při vytváření." : "Error creating event type."));
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <a href={`/${locale}/admin/sports/${sportId}`} className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all">
          <ArrowLeft className="size-5 text-slate-600" />
        </a>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100">
            <Zap className="size-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {cs ? `Nová událost` : `New Event Type`}
            </h1>
            <p className="text-sm text-slate-500">{sportName}</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-blue-700 px-6 py-5">
          <h2 className="font-bold text-white">{cs ? "Definice typu události" : "Event Type Definition"}</h2>
          <p className="text-blue-200 text-sm mt-0.5">
            {cs ? "Vytvořte nový typ události pro tento sport" : "Create a new event type for this sport"}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>
                {cs ? "Technický název" : "Technical name"} *
              </label>
              <input
                type="text"
                placeholder="GOAL, POINT_2, ACE..."
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls}
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                {cs ? "Velká písmena, podtržítka (automaticky)" : "Uppercase, underscores (auto)"}
              </p>
            </div>
            <div>
              <label className={labelCls}>
                {cs ? "Bodová hodnota" : "Point value"}
              </label>
              <input
                type="number"
                placeholder="1, 2, 3..."
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>
                {cs ? "Popisek (CS)" : "Label (CS)"} *
              </label>
              <input
                type="text"
                placeholder={cs ? "Gól, Bod, Eso..." : "Goal, Point, Ace..."}
                value={form.labelCs}
                onChange={(e) => set("labelCs", e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>
                {cs ? "Popisek (EN)" : "Label (EN)"}
              </label>
              <input
                type="text"
                placeholder="Goal, Point, Ace..."
                value={form.labelEn}
                onChange={(e) => set("labelEn", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>{cs ? "Ikona" : "Icon"}</label>
              <input
                type="text"
                placeholder="Target, Zap, Trophy..."
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
                className={inputCls}
              />
              <p className="text-xs text-slate-400 mt-1">
                {cs ? "Název Lucide ikony" : "Lucide icon name"}
              </p>
            </div>
            <div>
              <label className={labelCls}>{cs ? "Barva" : "Color"}</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                className="mt-1 w-full h-11 rounded-xl border border-slate-200 bg-white px-2 py-1 cursor-pointer"
              />
            </div>
            <div>
              <label className={labelCls}>{cs ? "Pořadí" : "Sort order"}</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={form.affectsScore}
              onChange={(e) => set("affectsScore", e.target.checked)}
              className="size-4 rounded border-slate-300 accent-blue-700"
            />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
              {cs ? "Ovlivňuje skóre zápasu" : "Affects match score"}
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 disabled:opacity-60 shadow-md shadow-blue-100 transition-all"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {cs ? "Vytvořit událost" : "Create event type"}
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
    </div>
  );
}
