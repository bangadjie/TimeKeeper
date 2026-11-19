"use client";

import type { AudioOutputDevice } from "@/hooks/useAudioOutput";

interface AudioOutputPanelProps {
  supported: boolean | null;
  devices: AudioOutputDevice[];
  sinkId: string;
  volume: number;
  muted: boolean;
  isRequesting: boolean;
  permissionError: string | null;
  onSinkChange: (sinkId: string) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMuted: () => void;
  onRequestDevices: () => void;
  onRefreshDevices: () => void;
}

export function AudioOutputPanel({
  supported,
  devices,
  sinkId,
  volume,
  muted,
  isRequesting,
  permissionError,
  onSinkChange,
  onVolumeChange,
  onToggleMuted,
  onRequestDevices,
  onRefreshDevices,
}: AudioOutputPanelProps) {
  const hasDevices = devices.length > 0;
  const selectedMissing =
    sinkId !== "" && !devices.some((device) => device.deviceId === sinkId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
          Pengaturan Audio Output
        </h2>
        <span
          className={`text-xs font-semibold ${
            muted ? "text-blossom" : "text-ink/35"
          }`}
        >
          {muted ? "Mute" : `${Math.round(volume * 100)}%`}
        </span>
      </div>

      {supported === false && (
        <p className="rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-xs leading-relaxed text-ink/55">
          Browser ini belum mendukung pemilihan perangkat output
          (<code className="font-mono">setSinkId</code>). Peringatan tetap
          berbunyi lewat output default perangkat — pakai volume dan mute di
          bawah.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="audio-output-device"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45"
          >
            Perangkat
          </label>
          <button
            type="button"
            onClick={onRequestDevices}
            disabled={isRequesting || supported === false}
            className="rounded-xl border border-amethyst/25 px-3 py-1.5 text-xs font-semibold text-amethyst transition hover:bg-amethyst/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amethyst/20 disabled:pointer-events-none disabled:opacity-40"
          >
            {isRequesting ? "Meminta izin…" : "Deteksi Perangkat Audio"}
          </button>
        </div>

        <select
          id="audio-output-device"
          value={sinkId}
          disabled={supported === false}
          onChange={(event) => onSinkChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-ink/10 bg-surface px-3 text-sm font-medium text-ink outline-none transition focus:border-amethyst focus:ring-4 focus:ring-amethyst/20 disabled:opacity-50"
        >
          <option value="">Output default perangkat</option>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
          {selectedMissing && (
            <option value={sinkId}>Perangkat tersimpan (tidak terdeteksi)</option>
          )}
        </select>

        <div className="flex flex-wrap items-center gap-3 text-xs text-ink/45">
          <span>
            {hasDevices
              ? `${devices.length} perangkat output terdeteksi`
              : "Belum ada perangkat terdeteksi"}
          </span>
          <button
            type="button"
            onClick={onRefreshDevices}
            className="font-semibold text-amethyst transition hover:text-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst/30"
          >
            Muat ulang daftar
          </button>
        </div>

        <p className="text-xs leading-relaxed text-ink/40">
          Nama headset USB/Bluetooth baru muncul setelah izin mikrofon diberikan.
          Mikrofon langsung dilepas setelah daftar terbaca, dan suara peringatan
          hanya dikirim ke perangkat yang dipilih.
        </p>
      </div>

      {permissionError && (
        <p role="alert" className="text-sm font-medium text-blossom">
          {permissionError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="audio-output-volume"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45"
        >
          Volume
        </label>
        <div className="flex items-center gap-3">
          <input
            id="audio-output-volume"
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(volume * 100)}
            onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-ink/10 accent-amethyst"
          />
          <span className="tabular-figures w-12 text-right font-mono text-sm font-semibold text-ink/70">
            {Math.round(volume * 100)}%
          </span>
          <button
            type="button"
            onClick={onToggleMuted}
            aria-pressed={muted}
            aria-label={muted ? "Aktifkan suara peringatan" : "Bisukan suara peringatan"}
            className={`grid size-9 shrink-0 place-items-center rounded-xl border text-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amethyst/20 ${
              muted
                ? "border-blossom/30 bg-blossom/10 text-blossom"
                : "border-ink/10 text-ink/60 hover:border-amethyst/40 hover:text-amethyst"
            }`}
          >
            <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
