"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_CHECKPOINTS,
  createCheckpointId,
  createDefaultCheckpoints,
  isValidCheckpointSeconds,
  persistCheckpoints,
  readStoredCheckpoints,
  sortCheckpoints,
  type AlertCheckpoint,
} from "@/lib/alerts";

/**
 * Daftar checkpoint peringatan disimpan di localStorage. Render pertama memakai
 * default (sama dengan markup server); nilai tersimpan dibaca di effect agar
 * tidak terjadi hydration mismatch. File suara kustom tidak di sini — Blob-nya
 * ada di IndexedDB dan diambil lewat `lib/audioStorage`.
 */
export function useAlertCheckpoints() {
  const [checkpoints, setCheckpoints] = useState<AlertCheckpoint[]>(
    createDefaultCheckpoints,
  );
  const isFirstPersist = useRef(true);

  useEffect(() => {
    const stored = readStoredCheckpoints();
    if (!stored) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckpoints(stored);
  }, []);

  useEffect(() => {
    if (isFirstPersist.current) {
      isFirstPersist.current = false;
      return;
    }
    persistCheckpoints(checkpoints);
  }, [checkpoints]);

  const toggleCheckpoint = useCallback((id: string) => {
    setCheckpoints((prev) =>
      prev.map((checkpoint) =>
        checkpoint.id === id
          ? { ...checkpoint, enabled: !checkpoint.enabled }
          : checkpoint,
      ),
    );
  }, []);

  /**
   * Menambah ambang baru. Mengembalikan alasan penolakan supaya form bisa
   * menampilkan pesan yang tepat; nilai valid selalu di luar batas 0 detik.
   */
  const addCheckpoint = useCallback(
    (seconds: number): "added" | "invalid" | "duplicate" | "full" => {
      if (!isValidCheckpointSeconds(seconds)) return "invalid";
      if (checkpoints.some((checkpoint) => checkpoint.seconds === seconds)) {
        return "duplicate";
      }
      if (
        checkpoints.filter((checkpoint) => checkpoint.seconds > 0).length >=
        MAX_CHECKPOINTS - 1
      ) {
        return "full";
      }

      setCheckpoints((prev) =>
        prev.some((checkpoint) => checkpoint.seconds === seconds)
          ? prev
          : sortCheckpoints([
              ...prev,
              { id: createCheckpointId(), seconds, enabled: true },
            ]),
      );
      return "added";
    },
    [checkpoints],
  );

  const removeCheckpoint = useCallback((id: string) => {
    // Baris "Waktu habis" (0 detik) adalah alarm bawaan dan tidak bisa dihapus.
    setCheckpoints((prev) =>
      prev.filter((checkpoint) => checkpoint.id !== id || checkpoint.seconds === 0),
    );
  }, []);

  return { checkpoints, toggleCheckpoint, addCheckpoint, removeCheckpoint };
}
