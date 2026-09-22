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

// Each mounted instance gets a unique container ID so the DOM element is
// unambiguous even if two scanners briefly co-exist during navigation.
let _instanceSeq = 0;

export function BarcodeCameraScanner({ onScanSuccess, onScanError, onFallback }: Props) {
  const [state, setState] = useState<State>("idle");
  const [imageError, setImageError] = useState<string | null>(null);

  const scannerRef = useRef<any>(null);
  const activeRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerIdRef = useRef(`bcs-${++_instanceSeq}`);

  // ── Stop & clear the html5-qrcode instance ────────────────────────────
  const clearScanner = useCallback(async () => {
    const s = scannerRef.current;
    if (!s) return;
    scannerRef.current = null;
    try { await s.stop(); } catch { /* already stopped */ }
    try { await s.clear(); } catch { /* nothing to clear */ }
  }, []);

  const stopAll = useCallback(async () => {
    activeRef.current = false;
    await clearScanner();
    setState("idle");
  }, [clearScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      const s = scannerRef.current;
      if (s) {
        try { s.stop(); } catch {}
        try { s.clear(); } catch {}
      }
    };
  }, []);

  // ── Start continuous camera scanning via html5-qrcode ─────────────────
  const startCamera = useCallback(async () => {
    if (state === "requesting" || state === "streaming") return;
    setState("requesting");
    activeRef.current = true;

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

      if (!activeRef.current) return; // unmounted while importing

      // formatsToSupport goes in the constructor config (not start() config)
      const scanner = new Html5Qrcode(containerIdRef.current, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.PDF_417,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: { ideal: "environment" } },
        {
          fps: 10,
          // Wide scan box — suits both 1-D barcodes and QR codes
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.7778, // 16:9
        },
        (decodedText) => {
          if (!activeRef.current) return;
          activeRef.current = false;
          clearScanner().then(() => {
            setState("idle");
            onScanSuccess(decodedText);
          });
        },
        (_err) => {
          // Per-frame decode failure — expected until a barcode is found, ignore.
        }
      );

      if (activeRef.current) setState("streaming");
    } catch (err: any) {
      activeRef.current = false;
      await clearScanner();
      const msg = `${err?.name ?? ""} ${err?.message ?? ""}`.toLowerCase();
      if (/notallowed|permission|denied/i.test(msg)) {
        setState("denied");
        onScanError?.(msg);
      } else {
        setState("no-camera");
        onScanError?.(msg);
      }
    }
  }, [state, onScanSuccess, onScanError, clearScanner]);

  // ── Scan from a photo file ────────────────────────────────────────────
  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await stopAll();
    setState("scanning-image");
    setImageError(null);

    try {
      // Native BarcodeDetector (Chrome/Edge) — fastest
      if ("BarcodeDetector" in window) {
        const img = await createImageBitmap(file);
        const det = new (window as any).BarcodeDetector({
          formats: ["qr_code","ean_13","ean_8","code_128","code_39","upc_a","upc_e","itf","data_matrix","pdf417"],
        });
        const results = await det.detect(img);
        if (results.length > 0) {
          setState("idle");
          onScanSuccess(results[0].rawValue);
          e.target.value = "";
          return;
        }
      }

      // Fallback: html5-qrcode scanFile (ZXing-based)
      const { Html5Qrcode } = await import("html5-qrcode");
      const tmpId = containerIdRef.current;
      const scanner = new Html5Qrcode(tmpId);
      try {
        const result = await scanner.scanFile(file, false);
        setState("idle");
        onScanSuccess(result);
      } finally {
        try { await scanner.clear(); } catch {}
      }
    } catch {
      setImageError("No barcode found in the photo. Try better lighting or a closer crop.");
      setState("image-error");
    }
    e.target.value = "";
  }, [onScanSuccess, stopAll]);

  // ── UI ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full max-w-md mx-auto bg-slate-900 rounded-2xl border border-slate-800 text-white shadow-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-teal-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Camera Scanner</span>
        </div>
        <span className={`h-2.5 w-2.5 rounded-full transition-colors ${state === "streaming" ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
      </div>

      {/* Viewport */}
      <div className="relative w-full bg-slate-950 overflow-hidden" style={{ minHeight: 280 }}>

        {/* html5-qrcode renders the <video> inside this div.
            Keep it in the DOM at all times so the library can access it. */}
        <div id={containerIdRef.current} className="w-full" />

        {/* Scan-line + corner frame overlay (on top of video while streaming) */}
        {state === "streaming" && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="relative" style={{ width: "80%", aspectRatio: "16/6" }}>
              <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-teal-400 rounded-tl-sm" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-teal-400 rounded-tr-sm" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-teal-400 rounded-bl-sm" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-teal-400 rounded-br-sm" />
              <div className="absolute inset-x-0 top-0 h-0.5 bg-teal-400/70 animate-[scanline_2s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* State overlays — cover the video area when not actively streaming */}
        {state !== "streaming" && (
          <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center">

            {/* idle */}
            {state === "idle" && (
              <div className="flex flex-col items-center gap-4 p-6 text-center w-full">
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
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors">
                    <ImagePlus className="h-4 w-4" /> Scan from Photo
                  </button>
                </div>
              </div>
            )}

            {/* requesting */}
            {state === "requesting" && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 text-teal-400 animate-spin" />
                <p className="text-xs text-slate-400">Opening camera…</p>
              </div>
            )}

            {/* denied */}
            {state === "denied" && (
              <div className="flex flex-col items-center gap-3 p-5 text-center">
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
                  <Button size="sm" variant="outline" onClick={startCamera}
                    className="gap-1.5 text-white border-slate-600 hover:bg-slate-800 bg-transparent text-xs">
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </Button>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#6b8a4e] text-white text-xs font-semibold">
                    <ImagePlus className="h-3.5 w-3.5" /> Use Photo
                  </button>
                </div>
              </div>
            )}

            {/* no-camera */}
            {state === "no-camera" && (
              <div className="flex flex-col items-center gap-3 p-5 text-center">
                <CameraOff className="h-9 w-9 text-slate-400" />
                <p className="text-sm font-bold text-slate-300">Camera Not Available</p>
                <p className="text-xs text-slate-400 max-w-[200px]">Make sure no other app is using the camera.</p>
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
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
                <p className="text-xs text-slate-400">Reading barcode from photo…</p>
              </div>
            )}

            {/* image error */}
            {state === "image-error" && (
              <div className="flex flex-col items-center gap-3 p-5 text-center">
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
