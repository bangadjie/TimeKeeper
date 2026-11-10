"use client";

import { useState, type FormEvent } from "react";
import { SECOND_MS } from "@/lib/time";

interface DurationInputProps {
  onApply: (durationMs: number) => void;
  onSavePreset: (seconds: number) => void;
}

interface Fields {
  hours: string;
  minutes: string;
  seconds: string;
}

const EMPTY: Fields = { hours: "", minutes: "", seconds: "" };

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function sanitize(raw: string, max: number): string {
  const digits = raw.replace(/\D/g, "").slice(0, 2);
  if (!digits) return "";
  return String(Math.min(Number.parseInt(digits, 10), max));
}

export function DurationInput({ onApply, onSavePreset }: DurationInputProps) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const totalSeconds =
    toNumber(fields.hours) * 3600 +
    toNumber(fields.minutes) * 60 +
    toNumber(fields.seconds);

  const update = (key: keyof Fields, max: number) => {
    return (raw: string) => {
      setFields((prev) => ({ ...prev, [key]: sanitize(raw, max) }));
      setError(null);
    };
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (totalSeconds <= 0) {
      setError("Isi durasi minimal 1 detik.");
      return;
    }
    onApply(totalSeconds * SECOND_MS);
  };

  const fieldClass =
    "tabular-figures w-full rounded-xl border border-ink/10 bg-surface px-3 py-3 text-center font-mono text-2xl font-semibold text-ink outline-none transition focus:border-amethyst focus:ring-4 focus:ring-amethyst/20";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            { key: "hours", label: "Jam", max: 99, placeholder: "00" },
            { key: "minutes", label: "Menit", max: 59, placeholder: "10" },
            { key: "seconds", label: "Detik", max: 59, placeholder: "00" },
          ] as const
        ).map(({ key, label, max, placeholder }) => (
          <label key={key} className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">
              {label}
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label={`Durasi ${label.toLowerCase()}`}
              placeholder={placeholder}
              value={fields[key]}
              onChange={(event) => update(key, max)(event.target.value)}
              className={fieldClass}
            />
          </label>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-blossom">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          className="h-12 flex-1 rounded-xl bg-amethyst px-4 text-sm font-semibold text-white transition hover:bg-amethyst-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amethyst/30 active:scale-[0.99]"
        >
          Terapkan Durasi
        </button>
        <button
          type="button"
          disabled={totalSeconds <= 0}
          onClick={() => {
            if (totalSeconds <= 0) return;
            onSavePreset(totalSeconds);
            setFields(EMPTY);
            setError(null);
          }}
          className="h-12 flex-1 rounded-xl border border-amethyst/25 px-4 text-sm font-semibold text-amethyst transition hover:bg-amethyst/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amethyst/20 disabled:pointer-events-none disabled:opacity-40"
        >
          Simpan sebagai Preset
        </button>
      </div>

      <p className="text-xs text-ink/40">
        Preset tersimpan otomatis di browser ini. Durasi maksimum 99 jam.
      </p>
    </form>
  );
}
