"use client";

import { useCallback, useSyncExternalStore } from "react";
import { applyTheme, persistTheme, type Theme } from "@/lib/theme";

/**
 * Sumber kebenaran tema adalah `data-theme` pada <html>, yang sudah dipasang
 * skrip inline sebelum hidrasi. Hook ini membaca DOM, bukan state terpisah,
 * sehingga markup server dan klien tidak pernah berbeda soal tema aktif.
 */
function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark"
    ? "dark"
    : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next: Theme = getSnapshot() === "dark" ? "light" : "dark";
    applyTheme(next);
    persistTheme(next);
  }, []);

  return { isDark: theme === "dark", toggle };
}
