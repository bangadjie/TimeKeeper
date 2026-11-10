"use client";

import type { TimerController } from "@/hooks/useTimer";
import { MINUTE_MS } from "@/lib/time";

interface TimerControlsProps {
  timer: TimerController;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  compact?: boolean;
}

const baseButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amethyst/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

export function TimerControls({
  timer,
  isFullscreen,
  onToggleFullscreen,
  compact = false,
}: TimerControlsProps) {
  const primaryLabel = timer.isRunning
    ? "Jeda"
    : timer.status === "paused"
      ? "Lanjut"
      : timer.status === "finished"
        ? "Ulangi"
        : "Mulai";

  const size = compact
    ? "h-12 px-5 text-sm sm:h-14 sm:px-7 sm:text-base"
    : "h-14 px-6 text-base sm:h-16 sm:px-9 sm:text-lg";

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={timer.toggle}
          aria-label={primaryLabel}
          className={`${baseButton} ${size} bg-amethyst text-white shadow-lg shadow-amethyst/30 hover:bg-amethyst-deep ${
            timer.isFinished ? "animate-pulse-soft" : ""
          }`}
        >
          <span aria-hidden="true" className="text-[0.9em]">
            {timer.isRunning ? "❚❚" : "▶"}
          </span>
          {primaryLabel}
          <kbd
            aria-hidden="true"
            className="ml-1 hidden rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[0.65em] font-normal tracking-widest sm:inline"
          >
            SPASI
          </kbd>
        </button>

        <button
          type="button"
          onClick={timer.reset}
          aria-label="Reset timer"
          className={`${baseButton} ${size} border border-ink/10 bg-surface text-ink/75 hover:border-amethyst/40 hover:text-amethyst ${
            compact ? "" : "sm:px-7"
          }`}
        >
          <span aria-hidden="true" className="text-[0.9em]">
            ↺
          </span>
          Reset
        </button>

        <div
          className={`flex overflow-hidden rounded-2xl border border-ink/10 bg-surface ${
            compact ? "h-12 sm:h-14" : "h-14 sm:h-16"
          }`}
          role="group"
          aria-label="Tambah waktu"
        >
          <button
            type="button"
            onClick={() => timer.addTime(MINUTE_MS)}
            className="px-4 text-sm font-semibold text-amethyst transition-colors hover:bg-amethyst/10 sm:px-5 sm:text-base"
          >
            +1 Menit
          </button>
          <span aria-hidden="true" className="my-3 w-px bg-ink/10" />
          <button
            type="button"
            onClick={() => timer.addTime(5 * MINUTE_MS)}
            className="px-4 text-sm font-semibold text-amethyst transition-colors hover:bg-amethyst/10 sm:px-5 sm:text-base"
          >
            +5 Menit
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={
            isFullscreen ? "Keluar dari mode fullscreen" : "Masuk mode fullscreen"
          }
          className={`${baseButton} ${size} border border-ink/10 bg-surface text-ink/75 hover:border-amethyst/40 hover:text-amethyst`}
        >
          <span aria-hidden="true" className="text-[0.9em]">
            {isFullscreen ? "⤢" : "⛶"}
          </span>
          {isFullscreen ? "Keluar" : "Fullscreen"}
          <kbd
            aria-hidden="true"
            className="ml-1 hidden rounded-md bg-ink/5 px-1.5 py-0.5 font-mono text-[0.65em] font-normal tracking-widest sm:inline"
          >
            F
          </kbd>
        </button>
      </div>

      {!compact && (
        <p className="text-center text-xs text-ink/45 sm:text-sm">
          Shortcut: <kbd className="font-mono font-semibold">Spasi</kbd> play/pause
          · <kbd className="font-mono font-semibold">R</kbd> reset ·{" "}
          <kbd className="font-mono font-semibold">F</kbd> fullscreen
        </p>
      )}
    </div>
  );
}
