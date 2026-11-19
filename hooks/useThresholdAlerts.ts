"use client";

import { useEffect, useRef } from "react";
import type { TimerStatus } from "@/hooks/useTimer";
import type { AlertCheckpoint } from "@/lib/alerts";

interface UseThresholdAlertsOptions {
  checkpoints: AlertCheckpoint[];
  remainingMs: number;
  status: TimerStatus;
  onAlert: (checkpoint: AlertCheckpoint) => void;
}

/**
 * Mesin ambang peringatan.
 *
 * - Anti double-trigger: id checkpoint yang sudah berbunyi dicatat sampai
 *   di-*arm* ulang, jadi satu ambang hanya berbunyi sekali per penurunan.
 * - Sesi lebih pendek dari ambang: bunyi hanya dipicu saat sisa waktu benar-benar
 *   *melewati* ambang dari atas (prev > ambang ≥ sekarang), sehingga memulai di
 *   2 menit tidak membunyikan ambang 5 dan 3 menit.
 * - Reset / +waktu: saat sisa waktu naik lagi di atas sebuah ambang, ambang itu
 *   di-arm ulang dan akan berbunyi lagi pada penurunan berikutnya.
 */
export function useThresholdAlerts({
  checkpoints,
  remainingMs,
  status,
  onAlert,
}: UseThresholdAlertsOptions) {
  const previousRef = useRef(remainingMs);
  const firedRef = useRef(new Set<string>());
  const onAlertRef = useRef(onAlert);

  useEffect(() => {
    onAlertRef.current = onAlert;
  }, [onAlert]);

  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = remainingMs;
    if (previous === remainingMs) return;

    for (const checkpoint of checkpoints) {
      if (remainingMs > checkpoint.seconds * 1000) {
        firedRef.current.delete(checkpoint.id);
      }
    }

    // Hanya penurunan yang bisa memicu; status "finished" tetap boleh memicu
    // ambang 0 detik karena nilai sisa sudah nol pada tick yang sama.
    if (remainingMs >= previous) return;
    if (status !== "running" && remainingMs > 0) return;

    for (const checkpoint of checkpoints) {
      if (!checkpoint.enabled || firedRef.current.has(checkpoint.id)) continue;

      const thresholdMs = checkpoint.seconds * 1000;
      if (previous > thresholdMs && remainingMs <= thresholdMs) {
        firedRef.current.add(checkpoint.id);
        onAlertRef.current(checkpoint);
      }
    }
  }, [checkpoints, remainingMs, status]);
}
