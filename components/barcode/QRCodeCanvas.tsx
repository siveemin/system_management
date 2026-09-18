"use client";

import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeCanvasProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeCanvas({ value, size = 120, className }: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 1,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) console.error("QR Code generation error:", error);
        }
      );
    }
  }, [value, size]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center bg-white p-2 rounded-lg border border-slate-200 ${className || ""}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}
