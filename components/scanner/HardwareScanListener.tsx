"use client";

import { useEffect, useRef } from "react";

interface HardwareScanListenerProps {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxDelayMs?: number;
}

export function HardwareScanListener({
  onScan,
  minChars = 4,
  maxDelayMs = 50,
}: HardwareScanListenerProps) {
  const bufferRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inputs while actively typing in regular input/textarea fields unless specific target
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      const elapsed = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (e.key === "Enter") {
        if (bufferRef.current.length >= minChars) {
          onScan(bufferRef.current);
          bufferRef.current = "";
        }
        return;
      }

      // If typed character comes after too long a delay, reset buffer (manual human typing)
      if (elapsed > maxDelayMs && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onScan, minChars, maxDelayMs]);

  return null;
}
