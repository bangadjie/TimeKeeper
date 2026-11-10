export const SECOND_MS = 1000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;

/** Batas atas durasi yang masuk akal: 99 jam 59 menit 59 detik. */
export const MAX_DURATION_MS = 99 * HOUR_MS + 59 * MINUTE_MS + 59 * SECOND_MS;

export function clampDuration(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return Math.min(Math.max(Math.round(ms), 0), MAX_DURATION_MS);
}

export interface TimeParts {
  hours: number;
  minutes: number;
  seconds: number;
}

export function splitDuration(ms: number): TimeParts {
  const totalSeconds = Math.max(0, Math.ceil(ms / SECOND_MS));
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Angka utama memakai MM:SS, dan baru menampilkan jam bila durasi total
 * memang menyentuh satu jam. Keputusan berdasarkan total (bukan sisa waktu)
 * supaya lebar teks tidak berubah saat hitungan melewati batas jam.
 */
export function formatCountdown(remainingMs: number, totalMs: number): string {
  const { hours, minutes, seconds } = splitDuration(remainingMs);

  if (totalMs >= HOUR_MS) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }
  return [minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function formatDurationLabel(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours} jam ${minutes} mnt` : `${hours} jam`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes} mnt ${seconds} dtk` : `${minutes} mnt`;
  }
  return `${seconds} dtk`;
}

export function partsToMs({ hours, minutes, seconds }: TimeParts): number {
  return clampDuration(
    hours * HOUR_MS + minutes * MINUTE_MS + seconds * SECOND_MS,
  );
}
