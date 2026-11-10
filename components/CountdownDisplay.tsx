"use client";

import type { TimerStatus } from "@/hooks/useTimer";
import { formatCountdown } from "@/lib/time";

interface CountdownDisplayProps {
  remainingMs: number;
  durationMs: number;
  status: TimerStatus;
  isCritical: boolean;
  isFinished: boolean;
  isFullscreen: boolean;
}

const STATUS_LABEL: Record<TimerStatus, string> = {
  idle: "Siap dimulai",
  running: "Berjalan",
  paused: "Dijeda",
  finished: "Waktu habis",
};

export function CountdownDisplay({
  remainingMs,
  durationMs,
  status,
  isCritical,
  isFinished,
  isFullscreen,
}: CountdownDisplayProps) {
  const display = formatCountdown(remainingMs, durationMs);
  const isAlert = isCritical || isFinished;

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] sm:text-sm ${
          isFinished
            ? "bg-blossom/15 text-blossom"
            : isCritical
              ? "bg-blossom/15 text-blossom"
              : isFullscreen
                ? "bg-white/10 text-white/60"
                : status === "running"
                  ? "bg-amethyst/10 text-amethyst"
                  : "bg-ink/5 text-ink/55"
        } ${isCritical && !isFinished ? "animate-pulse-soft" : ""}`}
      >
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${
            isFinished
              ? "bg-blossom"
              : isCritical
                ? "bg-blossom"
                : status === "running"
                  ? "bg-amethyst"
                  : "bg-ink/30"
          }`}
        />
        {STATUS_LABEL[status]}
      </span>

      <p
        role="timer"
        aria-live={isFinished ? "assertive" : "off"}
        aria-label={`Sisa waktu ${display}`}
        className={`tabular-figures select-none font-mono font-semibold leading-none tracking-tight transition-colors duration-500 ${
          isAlert ? "text-blossom" : isFullscreen ? "text-white" : "text-ink"
        } ${
          isFullscreen
            ? "text-[clamp(4rem,30vw,24rem)]"
            : "text-[clamp(3.5rem,24vw,12rem)]"
        }`}
      >
        {display}
      </p>

      <p
        className={`text-center text-sm tracking-wide sm:text-base ${
          isFullscreen ? "text-white/50" : "text-ink/50"
        }`}
      >
        {isFinished
          ? "Waktu untuk sesi ini sudah selesai."
          : isCritical
            ? "Sisa waktu kurang dari satu menit."
            : "Tekan Spasi untuk mulai atau jeda."}
      </p>
    </div>
  );
}
