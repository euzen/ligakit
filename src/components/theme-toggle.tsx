"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const { data: session, update: updateSession } = useSession();
  const [mounted, setMounted] = useState(false);
  const syncedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // On mount: if user has a DB theme preference, apply it to next-themes
  useEffect(() => {
    if (!mounted || syncedRef.current) return;
    const dbTheme = session?.user?.theme;
    if (dbTheme) {
      setTheme(dbTheme);
      syncedRef.current = true;
    }
  }, [mounted, session?.user?.theme, setTheme]);

  if (!mounted) return <div className="size-8" />;

  const isDark = resolvedTheme === "dark";

  const handleToggle = async () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);

    // Persist to DB and update JWT session (fire-and-forget)
    if (session) {
      fetch("/api/profile/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next }),
      }).then(() => updateSession({ theme: next })).catch(() => {});
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
