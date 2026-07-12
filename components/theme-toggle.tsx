"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = mounted ? resolvedTheme : undefined;

  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-sidebar-accent/70 p-1">
      <button
        type="button"
        data-press
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-medium transition-colors",
          current === "light"
            ? "bg-card text-ink shadow-sm"
            : "text-ink-muted hover:text-ink",
        )}
      >
        <Sun className="size-3.5" />
        Claro
      </button>
      <button
        type="button"
        data-press
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-medium transition-colors",
          current === "dark"
            ? "bg-card text-ink shadow-sm"
            : "text-ink-muted hover:text-ink",
        )}
      >
        <Moon className="size-3.5" />
        Oscuro
      </button>
    </div>
  );
}

/** Icon-only variant for the collapsed sidebar. */
export function ThemeToggleCompact() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      data-press
      aria-label="Cambiar tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex size-8 items-center justify-center rounded-lg text-ink-muted hover:bg-sidebar-accent hover:text-ink transition-colors"
    >
      {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
