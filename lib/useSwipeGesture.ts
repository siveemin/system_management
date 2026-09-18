"use client";
import { useEffect, useRef } from "react";

interface Options {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  edgeOnly?: boolean;
  edgeWidth?: number;
}

export function useSwipeGesture(opts: Options) {
  const startX  = useRef(0);
  const startY  = useRef(0);
  const fromEdge = useRef(false);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      startX.current  = e.touches[0].clientX;
      startY.current  = e.touches[0].clientY;
      fromEdge.current = opts.edgeOnly
        ? startX.current < (opts.edgeWidth ?? 32)
        : true;
    };

    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      const min = opts.threshold ?? 60;

      // Only fire if horizontal movement dominates and exceeds threshold
      if (Math.abs(dx) < min || Math.abs(dy) > Math.abs(dx) * 0.8) return;
      if (!fromEdge.current && dx > 0) return; // right-swipe only from edge

      if (dx > 0) opts.onSwipeRight?.();
      else opts.onSwipeLeft?.();
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend",   onEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend",   onEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
