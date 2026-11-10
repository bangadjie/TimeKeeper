"use client";

import { useTheme } from "@/hooks/useTheme";

/**
 * Label dan ikon ditukar lewat varian `dark:` (bukan state React) supaya tidak
 * ada kedipan teks saat hidrasi; state hanya mengisi atribut aksesibilitas.
 */
export function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title="Ganti tema"
      className="inline-flex h-9 items-center gap-2 rounded-full border border-ink/10 bg-surface px-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink/60 transition hover:border-amethyst/40 hover:text-amethyst focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amethyst/25"
    >
      <span aria-hidden="true" className="text-sm leading-none dark:hidden">
        ☾
      </span>
      <span aria-hidden="true" className="hidden text-sm leading-none dark:inline">
        ☀
      </span>
      <span className="dark:hidden">Gelap</span>
      <span className="hidden dark:inline">Terang</span>
    </button>
  );
}
