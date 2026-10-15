"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { CameraOff, ImagePlus, ShieldOff, Loader2, RefreshCw } from "lucide-react";

interface Props {
  onScanSuccess: (code: string, format?: string) => void;
  onScanError?: (msg: string) => void;
  onFallback?: () => void;
}

type ScanState = "booting" | "streaming" | "denied" | "no-camera" | "scanning-image" | "image-error";

const ALL_BD_FORMATS = [
  "aztec","codabar","code_39","code_93","code_128","data_matrix",
  "ean_8","ean_13","itf","maxicode","pdf417","qr_code",
  "rss_14","rss_expanded","upc_a","upc_e","upc_ean_extension","unknown",
] as const;

const H5Q_ALL_FORMATS = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];

export function BarcodeCameraScanner({ onScanSuccess, onScanError, onFallback }: Props) {
  const [state, setState] = useState<ScanState>("booting");
  const [imageError, setImageError] = useState<string | null>(null);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const rafRef      = useRef<number>(0);
  const activeRef   = useRef(false);
  const detRef      = useRef<any>(null);
  const controlsRef = useRef<any>(null); // ZXing controls
  const fileRef     = useRef<HTMLInputElement>(null);

  const stopAll = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) { videoRef.current.srcObject = null; }
    if (controlsRef.current) {
      try { controlsRef.current.stop(); } catch {}
      controlsRef.current = null;
    }
    setState("booting");
  }, []);

  useEffect(() => () => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (controlsRef.current) { try { controlsRef.current.stop(); } catch {} }
  }, []);

  // BarcodeDetector RAF loop — Chrome / Android
  const scanLoop = useCallback(() => {
    if (!activeRef.current) return;
    const v = videoRef.current, det = detRef.current;
    if (!v || !det || v.readyState < 2 || !v.videoWidth) {
      rafRef.current = requestAnimationFrame(scanLoop); return;
    }
    det.detect(v)
      .then((results: any[]) => {
        if (!activeRef.current) return;
        if (results[0]) { stopAll(); onScanSuccess(results[0].rawValue, results[0].format ?? "unknown"); }
        else rafRef.current = requestAnimationFrame(scanLoop);
      })
      .catch(() => { if (activeRef.current) rafRef.current = requestAnimationFrame(scanLoop); });
  }, [onScanSuccess, stopAll]);

  const startCamera = useCallback(async () => {
    setState("booting");
    activeRef.current = true;

    if ("BarcodeDetector" in window) {
      // ── Chrome / Android: native BarcodeDetector ──────────────────────
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (e1: any) {
        if (/notallowed|denied/i.test(String(e1))) { activeRef.current = false; setState("denied"); return; }
        try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }
        catch (e2: any) { activeRef.current = false; setState(/notallowed|denied/i.test(String(e2)) ? "denied" : "no-camera"); return; }
      }
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await new Promise<void>(res => { const t = setTimeout(res, 5000); v.onloadedmetadata = () => { clearTimeout(t); res(); }; });
      v.play().catch(() => {});
      setState("streaming");
      let fmts: string[] = [...ALL_BD_FORMATS];
      try {
        const sup: string[] = await (window as any).BarcodeDetector.getSupportedFormats();
        if (sup.length) fmts = ALL_BD_FORMATS.filter(f => sup.includes(f));
      } catch {}
      detRef.current = new (window as any).BarcodeDetector({ formats: fmts });
      rafRef.current = requestAnimationFrame(scanLoop);

    } else {
      // ── iOS / Firefox: ZXing BrowserMultiFormatReader ─────────────────
      // Most reliable cross-browser fallback — scans all formats continuously
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } },
          videoRef.current!,
          (result: any, err: any) => {
            if (!activeRef.current) return;
            if (result) {
              activeRef.current = false;
              const fmt = result.getBarcodeFormat?.()?.toString() ?? "unknown";
              stopAll();
              onScanSuccess(result.getText(), fmt);
            }
          }
        );
        controlsRef.current = controls;
        setState("streaming");
      } catch (e: any) {
        activeRef.current = false;
        setState(/notallowed|denied|permission/i.test(String(e)) ? "denied" : "no-camera");
        onScanError?.(String(e));
      }
    }
  }, [scanLoop, onScanError, stopAll, onScanSuccess]);

  // Auto-start on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startCamera(); }, []);

  // Scan from photo file
  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopAll();
    setState("scanning-image");
    setImageError(null);

    try {
      if ("BarcodeDetector" in window) {
        const img = await createImageBitmap(file);
        let fmts: string[] = [...ALL_BD_FORMATS];
        try {
          const sup: string[] = await (window as any).BarcodeDetector.getSupportedFormats();
          if (sup.length) fmts = ALL_BD_FORMATS.filter(f => sup.includes(f));
        } catch {}
        const det = new (window as any).BarcodeDetector({ formats: fmts });
        const results = await det.detect(img);
        if (results[0]) {
          setState("booting"); onScanSuccess(results[0].rawValue, results[0].format);
          e.target.value = ""; return;
        }
      }
      // Fallback: html5-qrcode file scan
      const { Html5Qrcode } = await import("html5-qrcode");
      let el = document.getElementById("__bcs_tmp__");
      if (!el) {
        el = document.createElement("div");
        el.id = "__bcs_tmp__";
        el.style.cssText = "position:fixed;opacity:0;pointer-events:none;top:-9999px;width:1px;height:1px;overflow:hidden";
        document.body.appendChild(el);
      }
      const s = new Html5Qrcode("__bcs_tmp__", { formatsToSupport: H5Q_ALL_FORMATS, verbose: false } as any);
      try {
        const res = (s as any).scanFileV2
          ? await (s as any).scanFileV2(file, false)
          : await s.scanFile(file, false).then((t: string) => ({ decodedText: t }));
        setState("booting");
        onScanSuccess(typeof res === "string" ? res : res.decodedText, res?.result?.format?.formatName);
      } finally { try { s.clear(); } catch {} }
    } catch {
      setImageError("No code found. Try a clearer photo in good lighting.");
      setState("image-error");
    }
    e.target.value = "";
  }, [onScanSuccess, stopAll]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "4/3" }}>

      {/* Video element — used by both BarcodeDetector and ZXing paths */}
      <video ref={videoRef} muted playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          state === "streaming" ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Streaming overlay */}
      {state === "streaming" && (
        <>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.45) 100%)"
          }} />

          {/* Finder frame */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-[78%] aspect-[3/2]">
              <span className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-[#6b8a4e] rounded-tl-md" />
              <span className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-[#6b8a4e] rounded-tr-md" />
              <span className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-[#6b8a4e] rounded-bl-md" />
              <span className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-[#6b8a4e] rounded-br-md" />
              <div className="absolute inset-x-0 h-px bg-[#6b8a4e] opacity-90 animate-[scanline_2s_ease-in-out_infinite]" />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between">
            <p className="text-white/70 text-[11px] font-medium tracking-wide">Point at barcode or QR code</p>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full border border-white/25 active:bg-white/25 transition-colors">
              <ImagePlus className="h-3.5 w-3.5" /> Photo
            </button>
          </div>
        </>
      )}

      {/* Booting */}
      {state === "booting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-[#6b8a4e] animate-spin" />
          </div>
          <p className="text-white/40 text-xs">Starting camera…</p>
        </div>
      )}

      {/* Denied */}
      {state === "denied" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-slate-900 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldOff className="h-7 w-7 text-rose-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Camera Access Blocked</p>
            <p className="text-white/40 text-xs mt-1.5 leading-relaxed">Allow camera in browser settings, then tap Retry.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={startCamera} className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-white text-xs font-semibold px-4 py-2 rounded-full">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 bg-[#6b8a4e] text-white text-xs font-semibold px-4 py-2 rounded-full">
              <ImagePlus className="h-3.5 w-3.5" /> Use Photo
            </button>
          </div>
        </div>
      )}

      {/* No camera */}
      {state === "no-camera" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-slate-900 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <CameraOff className="h-7 w-7 text-white/30" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Camera Unavailable</p>
            <p className="text-white/40 text-xs mt-1.5 leading-relaxed">Close other apps using the camera, then tap Retry.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={startCamera} className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-white text-xs font-semibold px-4 py-2 rounded-full">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
            {onFallback && (
              <button onClick={onFallback} className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-white text-xs font-semibold px-4 py-2 rounded-full">
                Manual Entry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scanning photo */}
      {state === "scanning-image" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
          <Loader2 className="h-8 w-8 text-[#6b8a4e] animate-spin" />
          <p className="text-white/50 text-xs">Reading photo…</p>
        </div>
      )}

      {/* Photo error */}
      {state === "image-error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-slate-900 p-6 text-center">
          <p className="text-white font-semibold text-sm">No Code Found</p>
          <p className="text-white/40 text-xs leading-relaxed">{imageError}</p>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 bg-[#6b8a4e] text-white text-xs font-semibold px-4 py-2 rounded-full">
              <ImagePlus className="h-3.5 w-3.5" /> Try Again
            </button>
            <button onClick={startCamera} className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-white text-xs font-semibold px-4 py-2 rounded-full">
              Use Camera
            </button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
    </div>
  );
}
