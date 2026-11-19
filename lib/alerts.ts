import { MAX_DURATION_MS, SECOND_MS, formatDurationLabel } from "@/lib/time";

/**
 * Satu checkpoint = satu ambang sisa waktu. `seconds: 0` adalah alarm waktu
 * habis (alarm bawaan) yang bisa ikut diarahkan ke output audio pilihan.
 * `id` dipakai sebagai kunci IndexedDB untuk suara kustom, jadi menghapus lalu
 * menambah ulang ambang yang sama tidak memakai file lama.
 */
export interface AlertCheckpoint {
  id: string;
  seconds: number;
  enabled: boolean;
}

export const FINISH_CHECKPOINT_ID = "checkpoint-waktu-habis";
export const CHECKPOINTS_STORAGE_KEY = "chronostage.alerts.v1";

/** Sisa kuota tampilan: 11 checkpoint berjalan + 1 baris waktu habis. */
export const MAX_CHECKPOINTS = 12;

const DEFAULT_CHECKPOINT_SECONDS = [5 * 60, 3 * 60, 60, 30];

export function createDefaultCheckpoints(): AlertCheckpoint[] {
  return [
    { id: FINISH_CHECKPOINT_ID, seconds: 0, enabled: true },
    ...DEFAULT_CHECKPOINT_SECONDS.map((seconds) => ({
      id: `checkpoint-${seconds}`,
      seconds,
      enabled: true,
    })),
  ];
}

export function checkpointLabel(seconds: number): string {
  return seconds === 0 ? "Waktu habis" : formatDurationLabel(seconds);
}

/** Urut menurun: 5 mnt → 30 dtk → waktu habis, sesuai arah hitung mundur. */
export function sortCheckpoints(list: AlertCheckpoint[]): AlertCheckpoint[] {
  return [...list].sort((a, b) => b.seconds - a.seconds);
}

export function isValidCheckpointSeconds(seconds: number): boolean {
  return (
    Number.isInteger(seconds) &&
    seconds > 0 &&
    seconds * SECOND_MS <= MAX_DURATION_MS
  );
}

export function createCheckpointId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `checkpoint-${crypto.randomUUID()}`;
  }
  return `checkpoint-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/**
 * Null bila belum pernah disimpan atau isinya rusak. Baris waktu habis selalu
 * dipulihkan karena alarm 0 detik tidak boleh hilang dari daftar.
 */
export function readStoredCheckpoints(): AlertCheckpoint[] | null {
  try {
    const raw = window.localStorage.getItem(CHECKPOINTS_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const seenSeconds = new Set<number>();
    const seenIds = new Set<string>();
    const active: AlertCheckpoint[] = [];
    let finish: AlertCheckpoint | null = null;

    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;

      const { id, seconds, enabled } = entry as Record<string, unknown>;
      if (typeof id !== "string" || seenIds.has(id)) continue;
      if (typeof seconds !== "number" || !Number.isInteger(seconds)) continue;
      if (seconds < 0 || seconds * SECOND_MS > MAX_DURATION_MS) continue;
      if (seenSeconds.has(seconds)) continue;

      seenSeconds.add(seconds);
      seenIds.add(id);

      const checkpoint: AlertCheckpoint = { id, seconds, enabled: enabled !== false };
      if (seconds === 0) {
        finish = checkpoint;
        continue;
      }
      active.push(checkpoint);
    }

    if (active.length === 0 && finish === null) return null;

    const sorted = sortCheckpoints(active).slice(0, MAX_CHECKPOINTS - 1);
    return [
      ...sorted,
      finish ?? { id: FINISH_CHECKPOINT_ID, seconds: 0, enabled: true },
    ];
  } catch {
    return null;
  }
}

export function persistCheckpoints(list: AlertCheckpoint[]): void {
  try {
    window.localStorage.setItem(CHECKPOINTS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Penyimpanan diblokir atau penuh: checkpoint tetap berlaku sesi ini.
  }
}
