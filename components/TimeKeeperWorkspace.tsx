"use client";

import { useCallback, useRef } from "react";
import { AlertCheckpointsPanel } from "@/components/AlertCheckpointsPanel";
import { AudioOutputPanel } from "@/components/AudioOutputPanel";
import { CountdownDisplay } from "@/components/CountdownDisplay";
import { DurationInput } from "@/components/DurationInput";
import { PresetSelector } from "@/components/PresetSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TimerControls } from "@/components/TimerControls";
import { useAlertCheckpoints } from "@/hooks/useAlertCheckpoints";
import { useAlertPlayback } from "@/hooks/useAlertPlayback";
import { useAudioOutput } from "@/hooks/useAudioOutput";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePresets } from "@/hooks/usePresets";
import { useThresholdAlerts } from "@/hooks/useThresholdAlerts";
import { useTimer } from "@/hooks/useTimer";
import type { AlertCheckpoint } from "@/lib/alerts";
import { SECOND_MS } from "@/lib/time";

export function TimeKeeperWorkspace() {
  const stageRef = useRef<HTMLElement>(null);

  const timer = useTimer();
  const presets = usePresets();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(stageRef);

  const audioOutput = useAudioOutput();
  const alerts = useAlertCheckpoints();
  const { playCheckpoint, invalidateCachedSound } = useAlertPlayback({
    sinkId: audioOutput.sinkId,
    volume: audioOutput.volume,
    muted: audioOutput.muted,
  });

  // Satu pemilik untuk seluruh suara peringatan, termasuk alarm waktu habis
  // (checkpoint 0 detik) yang bisa diarahkan ke headset seperti checkpoint lain.
  const handleAlert = useCallback(
    (checkpoint: AlertCheckpoint) => {
      void playCheckpoint(checkpoint);
    },
    [playCheckpoint],
  );

  useThresholdAlerts({
    checkpoints: alerts.checkpoints,
    remainingMs: timer.remainingMs,
    status: timer.status,
    onAlert: handleAlert,
  });

  useKeyboardShortcuts({
    onToggle: timer.toggle,
    onReset: timer.reset,
    onToggleFullscreen: toggleFullscreen,
  });

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-6 pb-4 sm:px-6 sm:pt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ink/40">
          Time Keeper
        </p>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 pb-10 sm:px-6">
        <section
          ref={stageRef}
          aria-label="Panggung hitung mundur"
          className={
            isFullscreen
              ? "relative flex min-h-screen w-full flex-col items-center justify-center gap-10 bg-stage px-6 py-10"
              : "flex flex-col items-center gap-8 rounded-3xl border border-ink/5 bg-surface px-4 py-10 shadow-[0_24px_60px_-40px_rgba(45,52,54,0.45)] sm:px-8 sm:py-14"
          }
        >
          <CountdownDisplay
            remainingMs={timer.remainingMs}
            durationMs={timer.durationMs}
            status={timer.status}
            isCritical={timer.isCritical}
            isFinished={timer.isFinished}
            isFullscreen={isFullscreen}
          />

          <TimerControls
            timer={timer}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            compact={isFullscreen}
          />

          {isFullscreen && (
            <p className="absolute bottom-6 font-mono text-xs tracking-[0.2em] text-white/30">
              SPASI JEDA · R RESET · F KELUAR
            </p>
          )}
        </section>

        {!isFullscreen && (
          <>
            <section
              aria-label="Pengaturan timer"
              className="grid gap-5 lg:grid-cols-[1.25fr_1fr]"
            >
              <div className="rounded-3xl border border-ink/5 bg-surface p-5 shadow-[0_18px_40px_-38px_rgba(45,52,54,0.5)] sm:p-6">
                <PresetSelector
                  presets={presets.presets}
                  activeDurationMs={timer.durationMs}
                  onSelect={(seconds) => timer.applyDuration(seconds * SECOND_MS)}
                  onRemove={presets.removePreset}
                />
              </div>

              <div className="rounded-3xl border border-ink/5 bg-surface p-5 shadow-[0_18px_40px_-38px_rgba(45,52,54,0.5)] sm:p-6">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                  Durasi Kustom
                </h2>
                <DurationInput
                  onApply={timer.applyDuration}
                  onSavePreset={presets.addPreset}
                />
              </div>
            </section>

            <section
              aria-label="Pengaturan peringatan dan audio"
              className="grid gap-5 lg:grid-cols-[1.6fr_1fr]"
            >
              <div className="rounded-3xl border border-ink/5 bg-surface p-5 shadow-[0_18px_40px_-38px_rgba(45,52,54,0.5)] sm:p-6">
                <AlertCheckpointsPanel
                  checkpoints={alerts.checkpoints}
                  onToggle={alerts.toggleCheckpoint}
                  onRemove={alerts.removeCheckpoint}
                  onAdd={alerts.addCheckpoint}
                  playCheckpoint={playCheckpoint}
                  invalidateCachedSound={invalidateCachedSound}
                />
              </div>

              <div className="rounded-3xl border border-ink/5 bg-surface p-5 shadow-[0_18px_40px_-38px_rgba(45,52,54,0.5)] sm:p-6">
                <AudioOutputPanel
                  supported={audioOutput.supported}
                  devices={audioOutput.devices}
                  sinkId={audioOutput.sinkId}
                  volume={audioOutput.volume}
                  muted={audioOutput.muted}
                  isRequesting={audioOutput.isRequesting}
                  permissionError={audioOutput.permissionError}
                  onSinkChange={audioOutput.setSinkId}
                  onVolumeChange={audioOutput.setVolume}
                  onToggleMuted={audioOutput.toggleMuted}
                  onRequestDevices={() => void audioOutput.requestDeviceAccess()}
                  onRefreshDevices={() => void audioOutput.refreshDevices()}
                />
              </div>
            </section>
          </>
        )}

        {!isFullscreen && (
          <p className="text-center text-xs text-ink/40">
            Peringatan berbunyi sekali per ambang pada tiap sesi; menambah waktu
            atau reset akan mengaktifkannya kembali.
          </p>
        )}
      </main>
    </div>
  );
}
