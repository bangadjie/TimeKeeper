/**
 * Seluruh suara peringatan diputar lewat `HTMLAudioElement`, bukan Web Audio,
 * karena hanya elemen media yang bisa diarahkan ke perangkat output tertentu
 * (`setSinkId`). Bunyi default dibuat sebagai WAV 16-bit di memori sehingga
 * tidak perlu aset file dan tetap bisa dirutekan ke headset.
 */
const SAMPLE_RATE = 22050;
const WAV_HEADER_BYTES = 44;

export interface PlaybackSettings {
  /** String kosong berarti perangkat output default sistem. */
  sinkId: string;
  /** 0–1. */
  volume: number;
  muted: boolean;
}

interface ChimeSpec {
  notes: number[];
  noteGap: number;
  noteDuration: number;
  repeats: number;
}

const FINISH_SPEC: ChimeSpec = {
  notes: [880, 1108.73, 1318.51],
  noteGap: 0.24,
  noteDuration: 0.2,
  repeats: 2,
};

/** Semakin sedikit sisa waktu, semakin tinggi dan cepat nadanya. */
function checkpointChimeSpec(seconds: number): ChimeSpec {
  if (seconds >= 180) {
    return { notes: [659.25, 880], noteGap: 0.26, noteDuration: 0.24, repeats: 1 };
  }
  if (seconds >= 60) {
    return { notes: [659.25, 880, 987.77], noteGap: 0.22, noteDuration: 0.2, repeats: 1 };
  }
  return { notes: [880, 1108.73, 1318.51], noteGap: 0.18, noteDuration: 0.17, repeats: 2 };
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

/** Float PCM mono → WAV Blob (little-endian, tanpa dependensi eksternal). */
function encodeWav(samples: Float32Array): Blob {
  const dataBytes = samples.length * 2;
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + dataBytes);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // ukuran blok fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); // byte per detik
  view.setUint16(32, 2, true); // blok align
  view.setUint16(34, 16, true); // bit per sampel
  writeAscii(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(
      WAV_HEADER_BYTES + index * 2,
      Math.round(clamped * 0x7fff),
      true,
    );
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function renderChime(spec: ChimeSpec): Blob {
  const cycle = spec.notes.length * spec.noteGap + 0.16;
  const totalSeconds = spec.repeats * cycle + 0.1;
  const samples = new Float32Array(Math.ceil(totalSeconds * SAMPLE_RATE));

  for (let round = 0; round < spec.repeats; round += 1) {
    spec.notes.forEach((frequency, index) => {
      const startAt = round * cycle + index * spec.noteGap;
      const first = Math.floor(startAt * SAMPLE_RATE);
      const length = Math.floor(spec.noteDuration * SAMPLE_RATE);

      for (let offset = 0; offset < length; offset += 1) {
        const position = first + offset;
        if (position >= samples.length) break;

        const t = offset / SAMPLE_RATE;
        const attack = Math.min(1, t / 0.012);
        const decay = Math.exp(-6 * (t / spec.noteDuration));
        samples[position] +=
          Math.sin(2 * Math.PI * frequency * t) * 0.32 * attack * decay;
      }
    });
  }

  return encodeWav(samples);
}

const chimeCache = new Map<number, Blob>();

/** WAV bawaan untuk ambang tertentu (0 = waktu habis), dibuat sekali per sesi. */
export function createDefaultChime(seconds: number): Blob {
  const cached = chimeCache.get(seconds);
  if (cached) return cached;

  const blob = renderChime(seconds === 0 ? FINISH_SPEC : checkpointChimeSpec(seconds));
  chimeCache.set(seconds, blob);
  return blob;
}

/** Hanya Chromium/Firefox modern yang menyediakan pemilihan perangkat output. */
export function supportsSinkId(): boolean {
  return (
    typeof HTMLMediaElement !== "undefined" &&
    "setSinkId" in HTMLMediaElement.prototype
  );
}

let unlockElement: HTMLAudioElement | null = null;

/**
 * Panggil di dalam gesture pengguna (klik Mulai). Memutar klip senyap menandai
 * halaman sudah berinteraksi sehingga `play()` berikutnya tidak diblokir
 * kebijakan autoplay, termasuk di iOS.
 */
export async function primeAudio(): Promise<void> {
  if (typeof Audio === "undefined") return;
  try {
    if (!unlockElement) unlockElement = new Audio(createSilentWavUrl());
    unlockElement.volume = 0;
    await unlockElement.play();
    unlockElement.pause();
    unlockElement.currentTime = 0;
  } catch {
    // Browser menolak; peringatan akan dicoba lagi saat ambang tercapai.
  }
}

let silentUrl: string | null = null;

function createSilentWavUrl(): string {
  if (!silentUrl) {
    silentUrl = URL.createObjectURL(encodeWav(new Float32Array(SAMPLE_RATE / 20)));
  }
  return silentUrl;
}

/**
 * Memutar satu klip dan mengarahkannya ke perangkat output pilihan. `false`
 * berarti pemutaran gagal (mis. autoplay diblokir atau sink tidak ada) — tidak
 * pernah melempar error agar timer tidak ikut gagal.
 */
export async function playAlertAudio(
  blob: Blob,
  { sinkId, volume, muted }: PlaybackSettings,
): Promise<boolean> {
  if (muted || volume <= 0 || typeof Audio === "undefined") return false;

  const url = URL.createObjectURL(blob);
  const element = new Audio(url);
  element.preload = "auto";
  element.volume = Math.max(0, Math.min(1, volume));

  const release = () => {
    element.removeEventListener("ended", release);
    element.removeEventListener("error", release);
    element.src = "";
    URL.revokeObjectURL(url);
  };
  element.addEventListener("ended", release);
  element.addEventListener("error", release);

  try {
    if (sinkId && supportsSinkId()) {
      // Perangkat bisa sudah dicabut; jatuh ke output default tanpa error.
      await element.setSinkId(sinkId).catch(() => undefined);
    }
    await element.play();
    return true;
  } catch {
    release();
    return false;
  }
}
