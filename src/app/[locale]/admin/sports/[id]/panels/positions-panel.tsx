"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Check, X } from "lucide-react";

interface Position {
  id: string;
  name: string;
  labelCs: string;
  labelEn: string;
}

interface FormState {
  name: string;
  labelCs: string;
  labelEn: string;
}

const EMPTY: FormState = { name: "", labelCs: "", labelEn: "" };

interface Props {
  sportId: string;
  initialPositions: Position[];
  cs: boolean;
}

export function PositionsPanel({ sportId, initialPositions, cs }: Props) {
  const [items, setItems] = useState<Position[]>(initialPositions);
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const setNF = (k: keyof FormState, v: string) => setNewForm((f) => ({ ...f, [k]: v }));
  const setEF = (k: keyof FormState, v: string) => setEditForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    if (!newForm.name.trim() || !newForm.labelCs.trim() || !newForm.labelEn.trim()) {
      setError(cs ? "Všechna pole jsou povinná." : "All fields are required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sports/${sportId}/positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      setItems((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewForm(EMPTY);
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editForm.name.trim()) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sports/${sportId}/positions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      setItems((prev) => prev.map((p) => p.id === id ? data : p).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/sports/${sportId}/positions/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors";

  const FormFields = ({ form, setF }: { form: FormState; setF: (k: keyof FormState, v: string) => void }) => (
    <div className="grid grid-cols-3 gap-2 flex-1">
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{cs ? "Technický název" : "Technical name"} *</label>
        <input
          autoFocus
          className={inputCls}
          placeholder="GK"
          value={form.name}
          onChange={(e) => setF("name", e.target.value)}
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Popisek CS *</label>
        <input
          className={inputCls}
          placeholder="Brankář"
          value={form.labelCs}
          onChange={(e) => setF("labelCs", e.target.value)}
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Label EN *</label>
        <input
          className={inputCls}
          placeholder="Goalkeeper"
          value={form.labelEn}
          onChange={(e) => setF("labelEn", e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
        <div>
          <h2 className="font-bold text-slate-900">{cs ? "Pozice hráčů" : "Player Positions"}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{cs ? "Role hráčů v týmu (brankář, obránce…)" : "Player roles in a team (goalkeeper, defender…)"}</p>
        </div>
        <button
          onClick={() => { setAdding(true); setNewForm(EMPTY); }}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition-colors"
        >
          <Plus className="size-3.5" />
          {cs ? "Přidat" : "Add"}
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2">{error}</div>
      )}

      <div className="p-6 space-y-2">
        {/* Column headers */}
        {items.length > 0 && (
          <div className="grid grid-cols-3 gap-2 px-3 mb-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{cs ? "Název" : "Name"}</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">CS</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">EN</p>
          </div>
        )}

        {adding && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-3 space-y-2">
            <FormFields form={newForm} setF={setNF} />
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={saving} className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                {cs ? "Uložit" : "Save"}
              </button>
              <button onClick={() => setAdding(false)} className="h-7 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="size-3" />
              </button>
            </div>
          </div>
        )}

        {items.length === 0 && !adding && (
          <p className="text-center text-sm text-slate-400 py-6">{cs ? "Zatím žádné pozice" : "No positions yet"}</p>
        )}

        {items.map((pos) => (
          <div key={pos.id} className="rounded-xl border border-slate-100 px-3 py-2">
            {editingId === pos.id ? (
              <div className="space-y-2">
                <FormFields form={editForm} setF={setEF} />
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(pos.id)} disabled={saving} className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-60 transition-colors">
                    {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                    {cs ? "Uložit" : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} className="h-7 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-3 gap-2 flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{pos.name}</p>
                  <p className="text-sm text-slate-600 truncate">{pos.labelCs || <span className="text-slate-300 italic text-xs">{cs ? "nevyplněno" : "empty"}</span>}</p>
                  <p className="text-sm text-slate-600 truncate">{pos.labelEn || <span className="text-slate-300 italic text-xs">{cs ? "nevyplněno" : "empty"}</span>}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingId(pos.id); setEditForm({ name: pos.name, labelCs: pos.labelCs, labelEn: pos.labelEn }); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(pos.id)}
                    disabled={deletingId === pos.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === pos.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
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
