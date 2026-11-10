"use client";

import { useEffect, useRef } from "react";

export interface ShortcutHandlers {
  onToggle: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
}

const TEXT_ENTRY_TAGS: Record<string, true> = {
  INPUT: true,
  TEXTAREA: true,
  SELECT: true,
};

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || TEXT_ENTRY_TAGS[target.tagName] === true;
}

/**
 * Spasi = play/pause, R = reset, F = fullscreen. Listener dimatikan saat
 * fokus berada di input/textarea agar mengetik tidak memicu timer.
 */
export function useKeyboardShortcuts({
  onToggle,
  onReset,
  onToggleFullscreen,
}: ShortcutHandlers) {
  const handlersRef = useRef({ onToggle, onReset, onToggleFullscreen });

  useEffect(() => {
    handlersRef.current = { onToggle, onReset, onToggleFullscreen };
  }, [onReset, onToggle, onToggleFullscreen]);

  useEffect(() => {
    // Timer berdetak 10x/detik; listener dipasang sekali dan membaca handler
    // terbaru lewat ref agar tidak dipasang ulang setiap render.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTextEntryTarget(event.target)) return;

      switch (event.code) {
        case "Space":
          event.preventDefault();
          handlersRef.current.onToggle();
          break;
        case "KeyR":
          event.preventDefault();
          handlersRef.current.onReset();
          break;
        case "KeyF":
          event.preventDefault();
          handlersRef.current.onToggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
