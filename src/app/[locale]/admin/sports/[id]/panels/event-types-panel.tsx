"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Check, X, GripVertical } from "lucide-react";

interface EventType {
  id: string;
  name: string;
  labelCs: string;
  labelEn: string;
  value: number | null;
  affectsScore: boolean;
  color: string | null;
  icon: string | null;
  sortOrder: number;
}

interface Props {
  sportId: string;
  initialEventTypes: EventType[];
  cs: boolean;
}

const EMPTY_FORM = { name: "", labelCs: "", labelEn: "", value: "", affectsScore: true, color: "#3b82f6", icon: "", sortOrder: 0 };

export function EventTypesPanel({ sportId, initialEventTypes, cs }: Props) {
  const [items, setItems] = useState<EventType[]>(initialEventTypes);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<typeof EMPTY_FORM>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const setF = (k: keyof typeof EMPTY_FORM, v: string | boolean | number) =>
    setForm((f) => ({ ...f, [k]: v }));
  const setEF = (k: keyof typeof EMPTY_FORM, v: string | boolean | number) =>
    setEditForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.labelCs.trim() || !form.labelEn.trim()) {
      setError(cs ? "Technický název, CS a EN popisek jsou povinné." : "Technical name, CS and EN label are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sports/${sportId}/event-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim().toUpperCase().replace(/\s+/g, "_"),
          labelCs: form.labelCs.trim(),
          labelEn: form.labelEn.trim(),
          value: form.value === "" ? null : Number(form.value),
          affectsScore: form.affectsScore,
          color: form.color || null,
          icon: form.icon.trim() || null,
          sortOrder: Number(form.sortOrder),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      setItems((prev) => [...prev, data].sort((a, b) => a.sortOrder - b.sortOrder));
      setForm({ ...EMPTY_FORM, sortOrder: items.length });
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (et: EventType) => {
    setEditingId(et.id);
    setEditForm({ name: et.name, labelCs: et.labelCs, labelEn: et.labelEn, value: et.value?.toString() ?? "", affectsScore: et.affectsScore, color: et.color ?? "#3b82f6", icon: et.icon ?? "", sortOrder: et.sortOrder });
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/sports/${sportId}/event-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          name: (editForm.name as string).toUpperCase().replace(/\s+/g, "_"),
          value: editForm.value === "" ? null : editForm.value,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      setItems((prev) => prev.map((e) => e.id === id ? data : e).sort((a, b) => a.sortOrder - b.sortOrder));
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/sports/${sportId}/event-types/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
        <div>
          <h2 className="font-bold text-slate-900">{cs ? "Typy událostí" : "Event Types"}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{cs ? "Co se může stát během zápasu" : "What can happen during a match"}</p>
        </div>
        <button
          onClick={() => { setAdding(true); setForm({ ...EMPTY_FORM, sortOrder: items.length }); }}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition-colors"
        >
          <Plus className="size-3.5" />
          {cs ? "Přidat" : "Add"}
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2">{error}</div>
      )}

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="mx-6 mt-4 mb-2 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{cs ? "Nový typ události" : "New event type"}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">{cs ? "Technický název" : "Technical name"} *</label>
              <input className={inputCls} placeholder="GOAL" value={form.name} onChange={(e) => setF("name", e.target.value)} />
              <p className="text-[10px] text-slate-400 mt-0.5">{cs ? "Velká písmena, bez mezer" : "Uppercase, no spaces"}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Popisek CS *</label>
              <input className={inputCls} placeholder="Gól" value={form.labelCs} onChange={(e) => setF("labelCs", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Label EN *</label>
              <input className={inputCls} placeholder="Goal" value={form.labelEn} onChange={(e) => setF("labelEn", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">{cs ? "Hodnota (body)" : "Value (points)"}</label>
              <input type="number" className={inputCls} placeholder="1" value={form.value} onChange={(e) => setF("value", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">{cs ? "Barva" : "Color"}</label>
              <div className="flex gap-2 mt-0.5">
                <input type="color" className="h-8 w-10 rounded cursor-pointer border border-slate-200" value={form.color} onChange={(e) => setF("color", e.target.value)} />
                <input className={inputCls} value={form.color} onChange={(e) => setF("color", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">{cs ? "Pořadí" : "Sort order"}</label>
              <input type="number" className={inputCls} value={form.sortOrder} onChange={(e) => setF("sortOrder", Number(e.target.value))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="aff-score" checked={form.affectsScore} onChange={(e) => setF("affectsScore", e.target.checked)} className="rounded" />
            <label htmlFor="aff-score" className="text-sm text-slate-700">{cs ? "Ovlivňuje skóre" : "Affects score"}</label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-60 transition-colors">
              {saving && <Loader2 className="size-3 animate-spin" />}
              {cs ? "Uložit" : "Save"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="h-8 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
              {cs ? "Zrušit" : "Cancel"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="divide-y divide-slate-50">
        {items.length === 0 && !adding && (
          <p className="text-center text-sm text-slate-400 py-10">{cs ? "Zatím žádné události" : "No event types yet"}</p>
        )}
        {items.map((et) => (
          <div key={et.id} className="px-6 py-3">
            {editingId === et.id ? (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">{cs ? "Technický název" : "Technical name"}</label>
                    <input className={inputCls} value={editForm.name as string} onChange={(e) => setEF("name", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Popisek CS</label>
                    <input className={inputCls} value={editForm.labelCs as string} onChange={(e) => setEF("labelCs", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Label EN</label>
                    <input className={inputCls} value={editForm.labelEn as string} onChange={(e) => setEF("labelEn", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">{cs ? "Hodnota" : "Value"}</label>
                    <input type="number" className={inputCls} value={editForm.value as string} onChange={(e) => setEF("value", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">{cs ? "Barva" : "Color"}</label>
                    <div className="flex gap-2 mt-0.5">
                      <input type="color" className="h-8 w-10 rounded cursor-pointer border border-slate-200" value={editForm.color as string} onChange={(e) => setEF("color", e.target.value)} />
                      <input className={inputCls} value={editForm.color as string} onChange={(e) => setEF("color", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">{cs ? "Pořadí" : "Sort order"}</label>
                    <input type="number" className={inputCls} value={editForm.sortOrder as number} onChange={(e) => setEF("sortOrder", Number(e.target.value))} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`aff-${et.id}`} checked={editForm.affectsScore as boolean} onChange={(e) => setEF("affectsScore", e.target.checked)} className="rounded" />
                  <label htmlFor={`aff-${et.id}`} className="text-sm text-slate-700">{cs ? "Ovlivňuje skóre" : "Affects score"}</label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSaveEdit(et.id)} disabled={saving} className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-60 transition-colors">
                    {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                    {cs ? "Uložit" : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} className="h-8 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <GripVertical className="size-4 text-slate-200 shrink-0" />
                <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: et.color ?? "#94a3b8" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{cs ? et.labelCs : et.labelEn}</p>
                  <p className="text-xs text-slate-400">
                    {et.name}
                    {et.value != null && <span className="ml-1.5 text-blue-600 font-medium">+{et.value}</span>}
                    {et.affectsScore
                      ? <span className="ml-1.5 text-green-600">{cs ? "· skóre" : "· score"}</span>
                      : <span className="ml-1.5 text-slate-300">{cs ? "· bez vlivu" : "· no effect"}</span>
                    }
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(et)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(et.id)}
                    disabled={deletingId === et.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === et.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
