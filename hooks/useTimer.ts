"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { primeAudio } from "@/lib/audio";
import { MINUTE_MS, clampDuration } from "@/lib/time";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

const TICK_INTERVAL_MS = 100;
export const DEFAULT_DURATION_MS = 10 * MINUTE_MS;

interface UseTimerOptions {
  initialDurationMs?: number;
  onFinish?: () => void;
}

/**
 * Sumber kebenaran hitung mundur adalah `endAt` (epoch ms). Setiap tick hanya
 * menghitung `endAt - Date.now()`, sehingga tab yang di-throttle browser tetap
 * akurat dan tidak mengalami drift.
 */
export interface TimerController {
  status: TimerStatus;
  durationMs: number;
  remainingMs: number;
  isRunning: boolean;
  /** Sisa waktu di bawah satu menit dan timer belum habis. */
  isCritical: boolean;
  isFinished: boolean;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  addTime: (deltaMs: number) => void;
  applyDuration: (nextDurationMs: number) => void;
}

export function useTimer({
  initialDurationMs = DEFAULT_DURATION_MS,
  onFinish,
}: UseTimerOptions = {}): TimerController {
  const [durationMs, setDurationMs] = useState(() =>
    clampDuration(initialDurationMs),
  );
  const [remainingMs, setRemainingMs] = useState(() =>
    clampDuration(initialDurationMs),
  );
  const [status, setStatus] = useState<TimerStatus>("idle");

  const endAtRef = useRef<number | null>(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (status !== "running") return;

    const tick = () => {
      const endAt = endAtRef.current;
      if (endAt === null) return;

      const next = Math.max(0, endAt - Date.now());
      setRemainingMs(next);

      if (next === 0) {
        endAtRef.current = null;
        setStatus("finished");
        onFinishRef.current?.();
      }
    };

    tick();
    const intervalId = window.setInterval(tick, TICK_INTERVAL_MS);
    // Browser menunda timer di tab latar; sinkronkan lagi saat tab kembali aktif.
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [status]);

  const start = useCallback(() => {
    // Wajib dipanggil dari gesture pengguna agar AudioContext tidak diblokir.
    void primeAudio();

    const base =
      status === "finished" || remainingMs <= 0 ? durationMs : remainingMs;
    if (base <= 0) return;

    endAtRef.current = Date.now() + base;
    setRemainingMs(base);
    setStatus("running");
  }, [durationMs, remainingMs, status]);

  const pause = useCallback(() => {
    const endAt = endAtRef.current;
    if (endAt === null) return;

    const next = Math.max(0, endAt - Date.now());
    endAtRef.current = null;
    setRemainingMs(next);

    if (next === 0) {
      setStatus("finished");
      onFinishRef.current?.();
      return;
    }
    setStatus("paused");
  }, []);

  const toggle = useCallback(() => {
    if (status === "running") {
      pause();
      return;
    }
    start();
  }, [pause, start, status]);

  const reset = useCallback(() => {
    endAtRef.current = null;
    setRemainingMs(durationMs);
    setStatus("idle");
  }, [durationMs]);

  /** Ganti durasi sekaligus menghentikan sesi berjalan. */
  const applyDuration = useCallback((nextDurationMs: number) => {
    const next = clampDuration(nextDurationMs);
    endAtRef.current = null;
    setDurationMs(next);
    setRemainingMs(next);
    setStatus("idle");
  }, []);

  const addTime = useCallback(
    (deltaMs: number) => {
      const delta = clampDuration(deltaMs);
      if (delta === 0) return;

      if (status === "running" && endAtRef.current !== null) {
        endAtRef.current += delta;
        setRemainingMs((prev) => prev + delta);
        setDurationMs((prev) => clampDuration(prev + delta));
        return;
      }

      if (status === "finished") {
        setDurationMs((prev) => clampDuration(prev + delta));
        setRemainingMs(delta);
        setStatus("idle");
        return;
      }

      setRemainingMs((prev) => prev + delta);
      setDurationMs((prev) => clampDuration(prev + delta));
    },
    [status],
  );

  return {
    status,
    durationMs,
    remainingMs,
    isRunning: status === "running",
    isCritical: remainingMs > 0 && remainingMs < MINUTE_MS,
    isFinished: status === "finished",
    start,
    pause,
    toggle,
    reset,
    addTime,
    applyDuration,
  };
}
