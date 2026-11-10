/**
 * Satu AudioContext dipakai ulang untuk seluruh sesi. Context dibuat dan
 * di-resume dari gesture pengguna (klik Start) agar tidak diblokir kebijakan
 * autoplay browser.
 */
let audioContext: AudioContext | null = null;

function resolveAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  if (typeof window.AudioContext === "function") return window.AudioContext;
  if ("webkitAudioContext" in window) {
    const legacy = window.webkitAudioContext;
    // Safari lama hanya menyediakan konstruktor berprefiks ini.
    if (typeof legacy === "function") return legacy as typeof AudioContext;
  }
  return null;
}

function getAudioContext(): AudioContext | null {
  if (!audioContext) {
    const Ctor = resolveAudioContextCtor();
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  return audioContext;
}

/** Panggil di dalam event handler (klik Start) untuk membuka kunci audio. */
export async function primeAudio(): Promise<void> {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      // Browser menolak resume; alarm akan dicoba lagi saat waktu habis.
    }
  }
}

function scheduleBeep(
  context: AudioContext,
  startAt: number,
  frequency: number,
  duration: number,
  volume: number,
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.05);
}

/** Tiga nada naik, diulang dua kali, sebagai penanda waktu habis. */
export async function playFinishAlarm(): Promise<void> {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  const now = context.currentTime + 0.05;
  const notes = [880, 1108.73, 1318.51];
  const gap = 0.24;

  for (let round = 0; round < 2; round += 1) {
    notes.forEach((frequency, index) => {
      scheduleBeep(
        context,
        now + round * (notes.length * gap + 0.18) + index * gap,
        frequency,
        0.2,
        0.18,
      );
    });
  }
}
