"use client";

import { useEffect, useState } from "react";

export function AdminAuditBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/audit/count")
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => {});
  }, []);

  if (!count) return null;

  return (
    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}
