"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, RefreshCw, ImagePlus, ShieldOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onScanSuccess: (code: string) => void;
  onScanError?: (msg: string) => void;
  onFallback?: () => void;
}

type State = "idle" | "requesting" | "streaming" | "denied" | "no-camera" | "scanning-image" | "image-error";

const FORMATS = [
  "qr_code", "ean_13", "ean_8", "code_128", "code_39",
  "upc_a", "upc_e", "itf", "data_matrix", "pdf417",
] as const;

export function BarcodeCameraScanner({ onScanSuccess, onScanError, onFallback }: Props) {
  const [state, setState] = useState<State>("idle");
  const [imageError, setImageError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);   // true while streaming
  const fileInputRef = useRef<HTMLInputElement>(null);
  const h5tmpRef = useRef<HTMLDivElement | null>(null);

  // Create a hidden div for html5-qrcode (outside React's DOM)
  useEffect(() => {
    const div = document.createElement("div");
    div.id = "__scanner_tmp__";
    div.style.cssText = "position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";
    document.body.appendChild(div);
    h5tmpRef.current = div;
    return () => {
      try { document.body.removeChild(div); } catch {}
    };
  }, []);

  const busyRef = useRef(false);

  const stopAll = useCallback(() => {
    activeRef.current = false;
    busyRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  }, []);

  // ── BarcodeDetector RAF loop (Chrome / Edge) ──────────────────────────
  const detectorRef = useRef<any>(null);
  const scanLoop = useCallback(() => {
    if (!activeRef.current) return;
    const video = videoRef.current;
    const det = detectorRef.current;
    if (!video || !det || video.readyState < 2 || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    det.detect(video)
      .then((results: any[]) => {
        if (!activeRef.current) return;
        if (results.length > 0) {
          stopAll();
          onScanSuccess(results[0].rawValue);
        } else {
          rafRef.current = requestAnimationFrame(scanLoop);
        }
      })
      .catch(() => {
        if (activeRef.current) rafRef.current = requestAnimationFrame(scanLoop);
      });
  }, [onScanSuccess, stopAll]);

  // ── Canvas frame scan loop (Safari / Firefox fallback) ───────────────
  const canvasScanLoop = useCallback(async () => {
    if (!activeRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) {
      timerRef.current = setTimeout(canvasScanLoop, 300);
      return;
    }
    if (busyRef.current) {
      timerRef.current = setTimeout(canvasScanLoop, 300);
      return;
    }
    busyRef.current = true;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob || !activeRef.current) {
        busyRef.current = false;
        if (activeRef.current) timerRef.current = setTimeout(canvasScanLoop, 400);
        return;
      }
      try {
        const file = new File([blob], "frame.jpg", { type: "image/jpeg" });
        const { Html5Qrcode } = await import("html5-qrcode");
        const tmpId = "__scanner_tmp__";
        const scanner = new Html5Qrcode(tmpId);
        const result = await scanner.scanFile(file, false);
        try { scanner.clear(); } catch {}
        if (activeRef.current) {
          stopAll();
          onScanSuccess(result);
        }
      } catch {
        busyRef.current = false;
        if (activeRef.current) timerRef.current = setTimeout(canvasScanLoop, 400);
      }
    }, "image/jpeg", 0.85);
  }, [onScanSuccess, stopAll]);

  // ── Start camera ─────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setState("requesting");
    activeRef.current = false;

    let stream: MediaStream | null = null;
    try {
      // Prefer rear/environment camera; no strict resolution to avoid OverconstrainedError
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch (firstErr: any) {
      const msg1 = `${firstErr?.name ?? ""} ${firstErr?.message ?? ""}`.toLowerCase();
      if (/notallowed|permission|denied/i.test(msg1)) {
        setState("denied");
        onScanError?.(msg1);
        return;
      }
      // Camera exists but constraints rejected — retry with no constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (err: any) {
        const combined = `${err?.name ?? ""} ${err?.message ?? ""}`.toLowerCase();
        if (/notallowed|permission|denied/i.test(combined)) setState("denied");
        else setState("no-camera");
        onScanError?.(combined);
        return;
      }
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    video.srcObject = stream;

    // Wait for metadata (use addEventListener to avoid clobbering any existing handler)
    await new Promise<void>((resolve) => {
      const onMeta = () => {
        video.removeEventListener("loadedmetadata", onMeta);
        clearTimeout(fallbackTimer);
        resolve();
      };
      const fallbackTimer = setTimeout(() => {
        video.removeEventListener("loadedmetadata", onMeta);
        resolve();
      }, 5000);
      video.addEventListener("loadedmetadata", onMeta);
    });

    try { await video.play(); } catch { /* muted autoplay; ignore play() rejections */ }

    activeRef.current = true;
    setState("streaming");

    if ("BarcodeDetector" in window) {
      detectorRef.current = new (window as any).BarcodeDetector({ formats: [...FORMATS] });
      rafRef.current = requestAnimationFrame(scanLoop);
    } else {
      busyRef.current = false;
      timerRef.current = setTimeout(canvasScanLoop, 500);
    }
  }, [scanLoop, canvasScanLoop, onScanError]);

  // ── Scan from photo file ─────────────────────────────────────────────
  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopAll();
    setState("scanning-image");
    setImageError(null);

    try {
      // Try BarcodeDetector first
      if ("BarcodeDetector" in window) {
        const img = await createImageBitmap(file);
        const det = new (window as any).BarcodeDetector({ formats: [...FORMATS] });
        const results = await det.detect(img);
        if (results.length > 0) {
          setState("idle");
          onScanSuccess(results[0].rawValue);
          e.target.value = "";
          return;
        }
      }
      // Fallback: html5-qrcode scanFile
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("__scanner_tmp__");
      const result = await scanner.scanFile(file, false);
      try { scanner.clear(); } catch {}
      setState("idle");
      onScanSuccess(result);
    } catch {
      setImageError("No barcode found. Try a clearer photo in good light.");
      setState("image-error");
    }
    e.target.value = "";
  }, [onScanSuccess, stopAll]);

  // ── UI ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full max-w-md mx-auto bg-slate-900 rounded-2xl border border-slate-800 text-white shadow-xl overflow-hidden">
      {/* Hidden canvas for frame decoding */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-teal-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Camera Scanner</span>
        </div>
        <span className={`h-2.5 w-2.5 rounded-full transition-colors ${state === "streaming" ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
      </div>

      {/* Viewport */}
      <div className="relative w-full aspect-square bg-slate-950 overflow-hidden">
        {/* Video element — always in DOM, shown only when streaming */}
        <video
          ref={videoRef}
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${state === "streaming" ? "opacity-100" : "opacity-0"}`}
        />

        {/* idle / requesting */}
        {(state === "idle" || state === "requesting") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center">
            {state === "requesting" ? (
              <>
                <Loader2 className="h-10 w-10 text-teal-400 animate-spin" />
                <p className="text-xs text-slate-400">Opening camera…</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-slate-800 p-5">
                  <Camera className="h-10 w-10 text-slate-500 stroke-1" />
                </div>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  Point your camera at a barcode or QR code to scan.
                </p>
                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                  <Button size="sm" onClick={startCamera} className="gap-2 bg-[#6b8a4e] hover:bg-[#5a7840] text-white w-full">
                    <Camera className="h-4 w-4" /> Start Camera
                  </Button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 w-full h-8 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
                  >
                    <ImagePlus className="h-4 w-4" /> Scan from Photo
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* permission denied */}
        {state === "denied" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 p-5 text-center">
            <ShieldOff className="h-9 w-9 text-rose-400" />
            <p className="text-sm font-bold text-rose-300">Camera Permission Denied</p>
            <div className="text-left space-y-2 max-w-[260px]">
              <p className="text-[11px] text-amber-300 font-semibold">Fix in browser:</p>
              <ol className="space-y-1">
                {[
                  "Click the 🔒 lock icon in the address bar",
                  'Set Camera → "Allow"',
                  'Click "Retry" below',
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              <p className="text-[11px] text-amber-300 font-semibold mt-2">Fix in macOS:</p>
              <p className="text-[11px] text-slate-400">
                System Settings → Privacy & Security → Camera → enable your browser
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center mt-1">
              <Button size="sm" variant="outline" onClick={startCamera}
                className="gap-1.5 text-white border-slate-600 hover:bg-slate-800 bg-transparent text-xs">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#6b8a4e] hover:bg-[#5a7840] text-white text-xs font-semibold"
              >
                <ImagePlus className="h-3.5 w-3.5" /> Use Photo Instead
              </button>
            </div>
          </div>
        )}

        {/* no camera */}
        {state === "no-camera" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 p-5 text-center">
            <CameraOff className="h-9 w-9 text-slate-400" />
            <p className="text-sm font-bold text-slate-300">No Camera Found</p>
            <p className="text-xs text-slate-400 max-w-[200px]">
              Make sure a camera is connected and not in use by another app.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={startCamera}
                className="gap-1.5 text-white border-slate-600 hover:bg-slate-800 bg-transparent text-xs">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
              {onFallback && (
                <button type="button" onClick={onFallback}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold">
                  Manual Entry
                </button>
              )}
            </div>
          </div>
        )}

        {/* scanning image */}
        {state === "scanning-image" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
            <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
            <p className="text-xs text-slate-400">Reading barcode from photo…</p>
          </div>
        )}

        {/* image error */}
        {state === "image-error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 p-5 text-center">
            <p className="text-sm font-bold text-rose-300">No Barcode Found</p>
            <p className="text-xs text-slate-400 max-w-[200px]">{imageError}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#6b8a4e] hover:bg-[#5a7840] text-white text-xs font-semibold">
                <ImagePlus className="h-3.5 w-3.5" /> Try Again
              </button>
              <button type="button" onClick={() => setState("idle")}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold">
                Back
              </button>
            </div>
          </div>
        )}

        {/* live scan overlay */}
        {state === "streaming" && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-[60%] aspect-square">
              <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-teal-400 rounded-tl-sm" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-teal-400 rounded-tr-sm" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-teal-400 rounded-bl-sm" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-teal-400 rounded-br-sm" />
              <div className="absolute inset-x-0 top-0 h-0.5 bg-teal-400/70 animate-[scanline_2s_ease-in-out_infinite]" />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
        {state === "streaming" ? (
          <>
            <p className="text-[11px] text-slate-400">Hold the barcode steady in the frame</p>
            <Button size="sm" variant="destructive" onClick={stopAll} className="h-7 text-xs gap-1.5">
              <CameraOff className="h-3.5 w-3.5" /> Stop
            </Button>
          </>
        ) : (
          <p className="text-[11px] text-slate-500 w-full text-center">
            UPC · EAN · Code 128 · QR Code · Data Matrix
          </p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
