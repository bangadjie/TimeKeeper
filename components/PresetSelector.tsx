"use client";

import { formatDurationLabel } from "@/lib/time";

interface PresetSelectorProps {
  presets: number[];
  activeDurationMs: number;
  onSelect: (seconds: number) => void;
  onRemove: (seconds: number) => void;
}

export function PresetSelector({
  presets,
  activeDurationMs,
  onSelect,
  onRemove,
}: PresetSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
          Preset Cepat
        </h2>
        <span className="text-xs text-ink/35">{presets.length} preset</span>
      </div>

      {presets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink/15 px-4 py-5 text-center text-sm text-ink/45">
          Belum ada preset. Simpan durasi kustom di bawah untuk menambahkannya.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2.5">
          {presets.map((seconds) => {
            const isActive = seconds * 1000 === activeDurationMs;
            return (
              <li
                key={seconds}
                className={`group flex min-w-[7.5rem] flex-1 items-center overflow-hidden rounded-xl border transition sm:flex-none ${
                  isActive
                    ? "border-amethyst bg-amethyst/10"
                    : "border-ink/10 bg-surface hover:border-amethyst/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(seconds)}
                  aria-pressed={isActive}
                  className={`flex-1 px-3 py-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? "text-amethyst"
                      : "text-ink/75 hover:text-amethyst"
                  }`}
                >
                  {formatDurationLabel(seconds)}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(seconds)}
                  aria-label={`Hapus preset ${formatDurationLabel(seconds)}`}
                  title="Hapus preset"
                  className="mr-1.5 grid size-7 shrink-0 place-items-center rounded-lg text-ink/25 transition hover:bg-blossom/10 hover:text-blossom focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blossom/40"
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    ×
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
