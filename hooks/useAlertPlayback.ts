"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AlertCheckpoint } from "@/lib/alerts";
import { createDefaultChime, playAlertAudio, type PlaybackSettings } from "@/lib/audio";
import { loadAlertSound } from "@/lib/audioStorage";

/**
 * Satu tempat pemutaran suara peringatan, dipakai bersama oleh mesin ambang dan
 * tombol Test Sound. Blob di-cache per checkpoint agar IndexedDB tidak dibaca
 * ulang setiap kali; Blob kustom diambil sekali lalu dipakai terus.
 */
export function useAlertPlayback(settings: PlaybackSettings) {
  const settingsRef = useRef(settings);
  const blobCache = useRef(new Map<string, Blob>());

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const playCheckpoint = useCallback(
    async (checkpoint: AlertCheckpoint): Promise<boolean> => {
      let blob = blobCache.current.get(checkpoint.id);

      if (!blob) {
        const stored = await loadAlertSound(checkpoint.id).catch(() => null);
        blob = stored ?? createDefaultChime(checkpoint.seconds);
        blobCache.current.set(checkpoint.id, blob);
      }

      return playAlertAudio(blob, settingsRef.current);
    },
    [],
  );

  /** Dipanggil setelah unggah/hapus file agar blob lama tidak dipakai lagi. */
  const invalidateCachedSound = useCallback((id: string) => {
    blobCache.current.delete(id);
  }, []);

  return { playCheckpoint, invalidateCachedSound };
}
