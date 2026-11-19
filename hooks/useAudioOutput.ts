"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { supportsSinkId } from "@/lib/audio";

const STORAGE_KEY = "chronostage.audioOutput.v1";

export interface AudioOutputDevice {
  deviceId: string;
  label: string;
}

interface StoredAudioOutput {
  sinkId: string;
  volume: number;
  muted: boolean;
}

const DEFAULTS: StoredAudioOutput = { sinkId: "", volume: 0.8, muted: false };

/**
 * Dukungan `setSinkId` adalah kapabilitas statis browser, bukan state React.
 * Snapshot server `null` (belum diketahui) agar tidak ada teks yang salah saat
 * hidrasi; React langsung memakai snapshot klien setelah hidrasi selesai.
 */
function subscribeCapability(): () => void {
  return () => undefined;
}

function readStoredAudioOutput(): StoredAudioOutput | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const { sinkId, volume, muted } = parsed as Record<string, unknown>;
    return {
      sinkId: typeof sinkId === "string" ? sinkId : "",
      volume:
        typeof volume === "number" && Number.isFinite(volume)
          ? Math.min(1, Math.max(0, volume))
          : DEFAULTS.volume,
      muted: muted === true,
    };
  } catch {
    return null;
  }
}

function writeStoredAudioOutput(value: StoredAudioOutput): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Penyimpanan diblokir: pilihan tetap berlaku untuk sesi ini.
  }
}

/**
 * Preferensi output suara (perangkat, volume, mute) disimpan di localStorage.
 * `enumerateDevices()` dan `getUserMedia()` hanya dipanggil dari effect/event,
 * sehingga tidak ada akses API browser saat render server.
 */
export function useAudioOutput() {
  const [sinkId, setSinkIdState] = useState(DEFAULTS.sinkId);
  const [volume, setVolumeState] = useState(DEFAULTS.volume);
  const [muted, setMutedState] = useState(DEFAULTS.muted);
  const [devices, setDevices] = useState<AudioOutputDevice[]>([]);
  const supported = useSyncExternalStore<boolean | null>(
    subscribeCapability,
    supportsSinkId,
    () => null,
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const isFirstPersist = useRef(true);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const outputs = all
        .filter((device) => device.kind === "audiooutput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          // Label kosong sampai izin mikrofon diberikan; tetap bisa dipilih.
          label: device.label || `Perangkat audio ${index + 1}`,
        }));
      setDevices(outputs);
    } catch {
      setDevices([]);
    }
  }, []);

  useEffect(() => {
    // Daftar perangkat hanya diketahui setelah mount; ini sinkronisasi dengan
    // mediaDevices (sistem eksternal), bukan state turunan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshDevices();

    const media = navigator.mediaDevices;
    if (!media?.addEventListener) return;
    const onChange = () => {
      void refreshDevices();
    };
    media.addEventListener("devicechange", onChange);
    return () => media.removeEventListener("devicechange", onChange);
  }, [refreshDevices]);

  useEffect(() => {
    const stored = readStoredAudioOutput();
    if (!stored) return;
    // Nilai tersimpan baru terbaca setelah mount (localStorage = sistem
    // eksternal); membaca di render akan memicu hydration mismatch.
    /* eslint-disable react-hooks/set-state-in-effect */
    setSinkIdState(stored.sinkId);
    setVolumeState(stored.volume);
    setMutedState(stored.muted);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (isFirstPersist.current) {
      isFirstPersist.current = false;
      return;
    }
    writeStoredAudioOutput({ sinkId, volume, muted });
  }, [muted, sinkId, volume]);

  /** Izin mikrofon sementara: nama perangkat output hanya terlihat setelahnya. */
  const requestDeviceAccess = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError("Browser ini tidak menyediakan akses perangkat audio.");
      return;
    }
    setIsRequesting(true);
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Mikrofon langsung dilepas: hanya label perangkat yang dibutuhkan.
      stream.getTracks().forEach((track) => track.stop());
      await refreshDevices();
    } catch {
      setPermissionError(
        "Izin mikrofon ditolak. Izinkan akses mikrofon di pengaturan situs lalu coba lagi.",
      );
    } finally {
      setIsRequesting(false);
    }
  }, [refreshDevices]);

  return {
    sinkId,
    setSinkId: setSinkIdState,
    volume,
    setVolume: setVolumeState,
    muted,
    setMuted: setMutedState,
    toggleMuted: () => setMutedState((prev) => !prev),
    devices,
    supported,
    isRequesting,
    permissionError,
    requestDeviceAccess,
    refreshDevices,
  };
}
