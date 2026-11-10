"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

/**
 * Fullscreen diterapkan pada elemen panggung, bukan seluruh dokumen, supaya
 * panel pengaturan otomatis tidak terlihat saat presentasi.
 */
export function useFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => {
      setIsFullscreen(
        targetRef.current !== null &&
          document.fullscreenElement === targetRef.current,
      );
    };

    document.addEventListener("fullscreenchange", sync);
    sync();
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [targetRef]);

  const enter = useCallback(async () => {
    const element = targetRef.current;
    if (!element || document.fullscreenElement) return;
    try {
      await element.requestFullscreen({ navigationUI: "hide" });
    } catch {
      // Ditolak browser (mis. iframe tanpa izin): tetap bisa dipakai normal.
    }
  }, [targetRef]);

  const exit = useCallback(async () => {
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen();
    } catch {
      // Tidak ada yang bisa dilakukan; state disinkronkan lewat event.
    }
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void exit();
      return;
    }
    void enter();
  }, [enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}
