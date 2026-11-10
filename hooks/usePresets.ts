"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_DURATION_MS, SECOND_MS } from "@/lib/time";

const STORAGE_KEY = "chronostage.presets.v1";
const DEFAULT_PRESET_SECONDS = [5 * 60, 10 * 60, 15 * 60, 30 * 60];

function readStoredPresets(): number[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const valid = parsed.filter(
      (value): value is number =>
        typeof value === "number" &&
        Number.isInteger(value) &&
        value > 0 &&
        value * SECOND_MS <= MAX_DURATION_MS,
    );

    return Array.from(new Set(valid)).sort((a, b) => a - b);
  } catch {
    return null;
  }
}

function writeStoredPresets(presets: number[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Penyimpanan penuh atau diblokir: preset tetap berjalan untuk sesi ini.
  }
}

/**
 * Daftar preset disimpan di localStorage. Render pertama memakai nilai default
 * (sama dengan markup server), lalu nilai tersimpan dibaca di effect agar tidak
 * terjadi hydration mismatch.
 */
export function usePresets() {
  const [presets, setPresets] = useState<number[]>(DEFAULT_PRESET_SECONDS);
  const isFirstPersist = useRef(true);

  useEffect(() => {
    const stored = readStoredPresets();
    if (!stored) return;
    // Nilai tersimpan hanya diketahui setelah mount; ini memang sinkronisasi
    // dengan sistem eksternal (localStorage), bukan state turunan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPresets(stored);
  }, []);

  useEffect(() => {
    // Render pertama tidak menulis, supaya default tidak menimpa data tersimpan
    // sebelum effect pembacaan selesai.
    if (isFirstPersist.current) {
      isFirstPersist.current = false;
      return;
    }
    writeStoredPresets(presets);
  }, [presets]);

  const addPreset = useCallback((seconds: number) => {
    if (!Number.isInteger(seconds) || seconds <= 0) return;
    setPresets((prev) =>
      prev.includes(seconds)
        ? prev
        : [...prev, seconds].sort((a, b) => a - b),
    );
  }, []);

  const removePreset = useCallback((seconds: number) => {
    setPresets((prev) => prev.filter((value) => value !== seconds));
  }, []);

  return { presets, addPreset, removePreset };
}
