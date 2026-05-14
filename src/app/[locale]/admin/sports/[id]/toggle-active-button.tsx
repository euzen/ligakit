"use client";

import { useState } from "react";
import { Power } from "lucide-react";

interface Props {
  sportId: string;
  initialIsActive: boolean;
  cs: boolean;
}

export function ToggleActiveButton({ sportId, initialIsActive, cs }: Props) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sports/${sportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) setIsActive((v) => !v);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-bold shadow-sm transition-all shrink-0 ${
        isActive
          ? "border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:text-red-600"
          : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
      } disabled:opacity-50`}
    >
      <Power className="size-4" />
      {isActive
        ? cs ? "Deaktivovat" : "Deactivate"
        : cs ? "Aktivovat" : "Activate"}
    </button>
  );
}
