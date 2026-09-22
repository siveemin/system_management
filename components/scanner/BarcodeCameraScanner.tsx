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
  const activeRef = useRef(false);
  const busyRef = useRef(false);
  const detectorRef = useRef<any>(null);
  const h5qRef = useRef<any>(null);       // reused html5-qrcode instance for canvas fallback
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-load html5-qrcode so the dynamic import is instant on first scan
  useEffect(() => {
    import("html5-qrcode").catch(() => {});
  }, []);

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
    // Clean up reusable html5-qrcode instance
    if (h5qRef.current) {
      try { h5qRef.current.clear(); } catch {}
      h5qRef.current = null;
    }
    setState("idle");
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (h5qRef.current) { try { h5qRef.current.clear(); } catch {} }
  }, []);

  // ── BarcodeDetector RAF loop (Chrome / Edge / Android Chrome) ─────────
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
  // Reuses a single Html5Qrcode instance across frames — avoids per-frame
  // instantiation overhead that caused the previous version to miss barcodes.
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
        // Create / reuse a single Html5Qrcode instance
        if (!h5qRef.current) {
          const { Html5Qrcode } = await import("html5-qrcode");
          // Use a zero-size hidden div — html5-qrcode needs a DOM element
          let el = document.getElementById("__bcs_h5q_tmp__");
          if (!el) {
            el = document.createElement("div");
            el.id = "__bcs_h5q_tmp__";
            el.style.cssText = "position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;top:-9999px";
            document.body.appendChild(el);
          }
          h5qRef.current = new Html5Qrcode("__bcs_h5q_tmp__");
        }
        // PNG preserves sharp barcode edges better than JPEG
        const file = new File([blob], "frame.png", { type: "image/png" });
        const result = await h5qRef.current.scanFile(file, false);
        if (activeRef.current) {
          stopAll();
          onScanSuccess(result);
        }
      } catch {
        // frame not decoded — try next frame
        busyRef.current = false;
        if (activeRef.current) timerRef.current = setTimeout(canvasScanLoop, 350);
      }
    }, "image/png");
  }, [onScanSuccess, stopAll]);

  // ── Start camera (getUserMedia called directly to keep user-gesture context) ──
  const startCamera = useCallback(async () => {
    setState("requesting");
    activeRef.current = false;

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch (firstErr: any) {
      const msg1 = `${firstErr?.name ?? ""} ${firstErr?.message ?? ""}`.toLowerCase();
      if (/notallowed|permission|denied/i.test(msg1)) {
        setState("denied"); onScanError?.(msg1); return;
      }
      // Constraints rejected — retry without constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (err: any) {
        const msg2 = `${err?.name ?? ""} ${err?.message ?? ""}`.toLowerCase();
        setState(/notallowed|permission|denied/i.test(msg2) ? "denied" : "no-camera");
        onScanError?.(msg2); return;
      }
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) { stream.getTracks().forEach((t) => t.stop()); return; }

    video.srcObject = stream;
    await new Promise<void>((resolve) => {
      const onMeta = () => { video.removeEventListener("loadedmetadata", onMeta); clearTimeout(fb); resolve(); };
      const fb = setTimeout(() => { video.removeEventListener("loadedmetadata", onMeta); resolve(); }, 5000);
      video.addEventListener("loadedmetadata", onMeta);
    });
    try { await video.play(); } catch { /* autoplay; ignore */ }

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

  // ── Scan from photo file ──────────────────────────────────────────────
  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopAll();
    setState("scanning-image");
    setImageError(null);

    try {
      if ("BarcodeDetector" in window) {
        const img = await createImageBitmap(file);
        const det = new (window as any).BarcodeDetector({ formats: [...FORMATS] });
        const results = await det.detect(img);
        if (results.length > 0) { setState("idle"); onScanSuccess(results[0].rawValue); e.target.value = ""; return; }
      }
      const { Html5Qrcode } = await import("html5-qrcode");
      let el = document.getElementById("__bcs_h5q_tmp__");
      if (!el) {
        el = document.createElement("div");
        el.id = "__bcs_h5q_tmp__";
        el.style.cssText = "position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;top:-9999px";
        document.body.appendChild(el);
      }
      const scanner = new Html5Qrcode("__bcs_h5q_tmp__");
      try {
        const result = await scanner.scanFile(file, false);
        setState("idle"); onScanSuccess(result);
      } finally { try { scanner.clear(); } catch {} }
    } catch {
      setImageError("No barcode found. Try a clearer photo in good light.");
      setState("image-error");
    }
    e.target.value = "";
  }, [onScanSuccess, stopAll]);

  // ── UI ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full max-w-md mx-auto bg-slate-900 rounded-2xl border border-slate-800 text-white shadow-xl overflow-hidden">
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
        <video ref={videoRef} muted playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${state === "streaming" ? "opacity-100" : "opacity-0"}`}
        />

        {(state === "idle" || state === "requesting") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center">
            {state === "requesting" ? (
              <><Loader2 className="h-10 w-10 text-teal-400 animate-spin" /><p className="text-xs text-slate-400">Opening camera…</p></>
            ) : (
              <>
                <div className="rounded-full bg-slate-800 p-5"><Camera className="h-10 w-10 text-slate-500 stroke-1" /></div>
                <p className="text-xs text-slate-400 max-w-[200px]">Point your camera at a barcode or QR code to scan.</p>
                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                  <Button size="sm" onClick={startCamera} className="gap-2 bg-[#6b8a4e] hover:bg-[#5a7840] text-white w-full">
                    <Camera className="h-4 w-4" /> Start Camera
                  </Button>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors">
                    <ImagePlus className="h-4 w-4" /> Scan from Photo
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {state === "denied" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 p-5 text-center">
            <ShieldOff className="h-9 w-9 text-rose-400" />
            <p className="text-sm font-bold text-rose-300">Camera Permission Denied</p>
            <div className="text-left space-y-1 max-w-[240px]">
              {["Click the 🔒 lock icon in the address bar", 'Set Camera → "Allow"', 'Tap "Retry"'].map((s, i) => (
                <p key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                  {s}
                </p>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              <Button size="sm" variant="outline" onClick={startCamera} className="gap-1.5 text-white border-slate-600 hover:bg-slate-800 bg-transparent text-xs">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#6b8a4e] text-white text-xs font-semibold">
                <ImagePlus className="h-3.5 w-3.5" /> Use Photo
              </button>
            </div>
          </div>
        )}

        {state === "no-camera" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 p-5 text-center">
            <CameraOff className="h-9 w-9 text-slate-400" />
            <p className="text-sm font-bold text-slate-300">No Camera Found</p>
            <p className="text-xs text-slate-400 max-w-[200px]">Make sure no other app is using the camera.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={startCamera} className="gap-1.5 text-white border-slate-600 hover:bg-slate-800 bg-transparent text-xs">
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

        {state === "scanning-image" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
            <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
            <p className="text-xs text-slate-400">Reading barcode from photo…</p>
          </div>
        )}

        {state === "image-error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 p-5 text-center">
            <p className="text-sm font-bold text-rose-300">No Barcode Found</p>
            <p className="text-xs text-slate-400 max-w-[200px]">{imageError}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#6b8a4e] text-white text-xs font-semibold">
                <ImagePlus className="h-3.5 w-3.5" /> Try Again
              </button>
              <button type="button" onClick={() => setState("idle")}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold">
                Back
              </button>
            </div>
          </div>
        )}

        {state === "streaming" && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-[65%] aspect-[3/1]">
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

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
    </div>
  );
}
