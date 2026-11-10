export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "chronostage.theme.v1";

const THEME_COLOR: Record<Theme, string> = {
  light: "#f5f6fa",
  dark: "#1b1f21",
};

/**
 * Tema diterapkan sebagai `data-theme` pada <html>: satu-satunya sumber
 * kebenaran, sehingga CSS, React, dan skrip pra-hidrasi tidak bisa berbeda.
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;

  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (meta) meta.content = THEME_COLOR[theme];
}

/** Null bila belum pernah dipilih atau localStorage diblokir. */
export function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

export function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Tema tetap berlaku untuk sesi ini walau penyimpanan diblokir.
  }
}

/**
 * Skrip sinkron di <head>: memasang tema sebelum lukisan pertama agar halaman
 * bertema gelap tidak berkedip terang. Tanpa pilihan tersimpan, preferensi
 * sistem yang dipakai.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");var t=s==="dark"||s==="light"?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=t==="dark"?"${THEME_COLOR.dark}":"${THEME_COLOR.light}"}catch(e){}})()`;
