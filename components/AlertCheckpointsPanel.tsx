"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { AlertCheckpoint } from "@/lib/alerts";
import { checkpointLabel, MAX_CHECKPOINTS } from "@/lib/alerts";
import { deleteAlertSound, listAlertSounds, saveAlertSound } from "@/lib/audioStorage";

const ACCEPTED_AUDIO = ".mp3,.wav,.ogg,.m4a,audio/*";
const ACCEPTED_MIME = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
];

interface AlertCheckpointsPanelProps {
  checkpoints: AlertCheckpoint[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (seconds: number) => "added" | "invalid" | "duplicate" | "full";
  playCheckpoint: (checkpoint: AlertCheckpoint) => Promise<boolean>;
  invalidateCachedSound: (id: string) => void;
}

const ADD_ERROR: Record<"invalid" | "duplicate" | "full", string> = {
  invalid: "Isi ambang minimal 1 detik.",
  duplicate: "Ambang itu sudah ada di daftar.",
  full: `Maksimal ${MAX_CHECKPOINTS - 1} checkpoint aktif.`,
};

function isAcceptedAudio(file: File): boolean {
  if (ACCEPTED_MIME.includes(file.type)) return true;
  return /\.(mp3|wav|ogg|m4a)$/i.test(file.name);
}

export function AlertCheckpointsPanel({
  checkpoints,
  onToggle,
  onRemove,
  onAdd,
  playCheckpoint,
  invalidateCachedSound,
}: AlertCheckpointsPanelProps) {
  const [soundNames, setSoundNames] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const refreshSoundNames = useCallback(async () => {
    try {
      const stored = await listAlertSounds();
      setSoundNames(
        Object.fromEntries(stored.map((entry) => [entry.id, entry.name])),
      );
    } catch {
      setSoundNames({});
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshSoundNames();
  }, [refreshSoundNames]);

  const handleUpload = async (checkpoint: AlertCheckpoint, file: File) => {
    if (!isAcceptedAudio(file)) {
      setMessage("Format tidak didukung. Pilih MP3, WAV, OGG, atau M4A.");
      return;
    }

    setBusyId(checkpoint.id);
    setMessage(null);
    try {
      await saveAlertSound(checkpoint.id, file);
      invalidateCachedSound(checkpoint.id);
      await refreshSoundNames();
      setMessage(`Suara ${checkpointLabel(checkpoint.seconds)} diganti dengan ${file.name}.`);
    } catch {
      setMessage("Gagal menyimpan file audio. Coba file yang lebih kecil.");
    } finally {
      setBusyId(null);
    }
  };

  const handleResetSound = async (checkpoint: AlertCheckpoint) => {
    setBusyId(checkpoint.id);
    setMessage(null);
    try {
      await deleteAlertSound(checkpoint.id);
      invalidateCachedSound(checkpoint.id);
      await refreshSoundNames();
      setMessage(`Suara ${checkpointLabel(checkpoint.seconds)} kembali ke bawaan.`);
    } catch {
      setMessage("Gagal menghapus file audio tersimpan.");
    } finally {
      setBusyId(null);
    }
  };

  const handleTest = async (checkpoint: AlertCheckpoint) => {
    setMessage(null);
    const played = await playCheckpoint(checkpoint);
    if (!played) {
      setMessage(
        "Suara tidak diputar: audio mungkin di-mute atau volume 0. Periksa panel Pengaturan Audio Output.",
      );
    }
  };

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const total = Number(minutes || "0") * 60 + Number(seconds || "0");
    const result = onAdd(total);
    if (result === "added") {
      setMinutes("");
      setSeconds("");
      setAddError(null);
      return;
    }
    setAddError(ADD_ERROR[result]);
  };

  const inputClass =
    "tabular-figures w-16 rounded-xl border border-ink/10 bg-surface px-3 py-2 text-center font-mono text-base font-semibold text-ink outline-none transition focus:border-amethyst focus:ring-4 focus:ring-amethyst/20";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
          Peringatan Waktu
        </h2>
        <span className="text-xs text-ink/35">
          {checkpoints.filter((checkpoint) => checkpoint.enabled).length} aktif
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-ink/5">
        {checkpoints.map((checkpoint) => {
          const soundName = soundNames[checkpoint.id];
          const isBusy = busyId === checkpoint.id;
          const isFinishRow = checkpoint.seconds === 0;

          return (
            <li
              key={checkpoint.id}
              className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={checkpoint.enabled}
                  aria-label={`Aktifkan peringatan ${checkpointLabel(checkpoint.seconds)}`}
                  onClick={() => onToggle(checkpoint.id)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amethyst/25 ${
                    checkpoint.enabled ? "bg-amethyst" : "bg-ink/15"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
                      checkpoint.enabled ? "left-[1.375rem]" : "left-0.5"
                    }`}
                  />
                </button>

                <div className="flex min-w-0 flex-col">
                  <span
                    className={`text-sm font-semibold ${
                      checkpoint.enabled ? "text-ink" : "text-ink/40"
                    }`}
                  >
                    {checkpointLabel(checkpoint.seconds)}
                  </span>
                  <span className="truncate text-xs text-ink/40">
                    {soundName
                      ? `Suara kustom: ${soundName}`
                      : isFinishRow
                        ? "Alarm bawaan saat waktu habis"
                        : "Suara bawaan (chime)"}
                  </span>
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                {/* Label pendek di layar sempit agar tombol tidak pecah dua baris. */}
                <button
                  type="button"
                  onClick={() => fileInputs.current[checkpoint.id]?.click()}
                  disabled={isBusy}
                  className="flex-1 rounded-xl border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink/70 transition sm:flex-none hover:border-amethyst/40 hover:text-amethyst focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amethyst/20 disabled:pointer-events-none disabled:opacity-40"
                >
                  {isBusy ? (
                    "Menyimpan…"
                  ) : (
                    <>
                      <span className="sm:hidden">{soundName ? "Ganti" : "Unggah"}</span>
                      <span className="hidden sm:inline">
                        {soundName ? "Ganti File" : "Unggah Audio"}
                      </span>
                    </>
                  )}
                </button>
                <input
                  ref={(element) => {
                    fileInputs.current[checkpoint.id] = element;
                  }}
                  type="file"
                  accept={ACCEPTED_AUDIO}
                  aria-label={`Unggah suara untuk ${checkpointLabel(checkpoint.seconds)}`}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void handleUpload(checkpoint, file);
                  }}
                />

                <button
                  type="button"
                  onClick={() => void handleTest(checkpoint)}
                  className="flex-1 rounded-xl bg-amethyst/10 px-3 py-1.5 text-xs font-semibold text-amethyst transition sm:flex-none hover:bg-amethyst/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amethyst/20"
                >
                  <span className="sm:hidden">Test</span>
                  <span className="hidden sm:inline">Test Sound</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleResetSound(checkpoint)}
                  disabled={!soundName || isBusy}
                  className="flex-1 rounded-xl border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink/60 transition sm:flex-none hover:border-amethyst/40 hover:text-amethyst focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amethyst/20 disabled:pointer-events-none disabled:opacity-30"
                >
                  <span className="sm:hidden">Reset</span>
                  <span className="hidden sm:inline">Reset ke Default</span>
                </button>

                {!isFinishRow && (
                  <button
                    type="button"
                    onClick={() => onRemove(checkpoint.id)}
                    aria-label={`Hapus checkpoint ${checkpointLabel(checkpoint.seconds)}`}
                    title="Hapus checkpoint"
                    className="grid size-8 place-items-center rounded-xl text-ink/25 transition hover:bg-blossom/10 hover:text-blossom focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blossom/40"
                  >
                    <span aria-hidden="true" className="text-base leading-none">
                      ×
                    </span>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-ink/15 px-3 py-3"
      >
        <label className="flex flex-col gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Menit
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            aria-label="Menit checkpoint baru"
            value={minutes}
            onChange={(event) => {
              setMinutes(event.target.value.replace(/\D/g, "").slice(0, 2));
              setAddError(null);
            }}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Detik
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="30"
            aria-label="Detik checkpoint baru"
            value={seconds}
            onChange={(event) => {
              setSeconds(event.target.value.replace(/\D/g, "").slice(0, 2));
              setAddError(null);
            }}
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded-xl bg-amethyst px-4 text-xs font-semibold text-white transition hover:bg-amethyst-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amethyst/30 active:scale-[0.98]"
        >
          Tambah Checkpoint
        </button>
        <span className="text-xs text-ink/35">
          Daftar tersimpan di localStorage; file suara di IndexedDB.
        </span>
      </form>

      {addError && (
        <p role="alert" className="text-sm font-medium text-blossom">
          {addError}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-ink/60">
          {message}
        </p>
      )}
    </div>
  );
}
