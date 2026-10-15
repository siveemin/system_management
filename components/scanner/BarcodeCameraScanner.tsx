"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, RefreshCw, ImagePlus, ShieldOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onScanSuccess: (code: string, format?: string) => void;
  onScanError?: (msg: string) => void;
  onFallback?: () => void;
}

type State = "idle" | "requesting" | "streaming" | "denied" | "no-camera" | "scanning-image" | "image-error";

const ALL_FORMATS = [
  "aztec", "codabar", "code_39", "code_93", "code_128",
  "data_matrix", "ean_8", "ean_13", "itf", "maxicode",
  "pdf417", "qr_code", "rss_14", "rss_expanded",
  "upc_a", "upc_e", "upc_ean_extension", "unknown",
] as const;

const H5Q_ALL_FORMATS = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];

export function BarcodeCameraScanner({ onScanSuccess, onScanError, onFallback }: Props) {
  const [state, setState] = useState<State>("idle");
  const [imageError, setImageError] = useState<string | null>(null);
  const [lastFormat, setLastFormat] = useState<string | null>(null);
  const [usingH5q, setUsingH5q] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);
  const detectorRef = useRef<any>(null);
  const h5qRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unique container ID per instance to avoid conflicts when multiple scanners exist on page
  const containerIdRef = useRef(`bcs-h5q-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    import("html5-qrcode").catch(() => {});
  }, []);

  const stopAll = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    if (h5qRef.current) {
      const scanner = h5qRef.current;
      h5qRef.current = null;
      Promise.resolve(scanner.stop()).catch(() => {}).then(() => {
        try { scanner.clear(); } catch {}
      });
    }

    setUsingH5q(false);
    setState("idle");
  }, []);

  useEffect(() => () => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (h5qRef.current) {
      const s = h5qRef.current;
      h5qRef.current = null;
      Promise.resolve(s.stop()).catch(() => {}).then(() => { try { s.clear(); } catch {} });
    }
  }, []);

  // BarcodeDetector RAF loop — Chrome / Android Chrome
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
          onScanSuccess(results[0].rawValue, results[0].format ?? "unknown");
        } else {
          rafRef.current = requestAnimationFrame(scanLoop);
        }
      })
      .catch(() => {
        if (activeRef.current) rafRef.current = requestAnimationFrame(scanLoop);
      });
  }, [onScanSuccess, stopAll]);

  const startCamera = useCallback(async () => {
    setState("requesting");
    setLastFormat(null);
    activeRef.current = true;

    if ("BarcodeDetector" in window) {
      // Chrome / Android Chrome: native BarcodeDetector + getUserMedia
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (err: any) {
        const msg = `${err?.name ?? ""} ${err?.message ?? ""}`.toLowerCase();
        if (/notallowed|permission|denied/i.test(msg)) {
          activeRef.current = false;
          setState("denied"); onScanError?.(msg); return;
        }
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (err2: any) {
          const msg2 = `${err2?.name ?? ""} ${err2?.message ?? ""}`.toLowerCase();
          activeRef.current = false;
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
      try { await video.play(); } catch {}

      setState("streaming");

      let supportedFormats: string[] = [...ALL_FORMATS];
      try {
        const bf: string[] = await (window as any).BarcodeDetector.getSupportedFormats();
        supportedFormats = ALL_FORMATS.filter((f) => bf.includes(f));
        if (supportedFormats.length === 0) supportedFormats = [...ALL_FORMATS];
      } catch {}
      detectorRef.current = new (window as any).BarcodeDetector({ formats: supportedFormats });
      rafRef.current = requestAnimationFrame(scanLoop);

    } else {
      // iOS Safari / Firefox: use Html5Qrcode native camera scanning
      setUsingH5q(true);
      await new Promise<void>((r) => setTimeout(r, 80)); // let the container div mount

      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode(containerIdRef.current, {
          formatsToSupport: H5Q_ALL_FORMATS,
          verbose: false,
        } as any);
        h5qRef.current = scanner;

        const cid = containerIdRef.current;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 15 }, // no qrbox — scan the full video frame
          (decodedText: string, result: any) => {
            if (!activeRef.current) return;
            const fmt: string = result?.result?.format?.formatName ?? "unknown";
            activeRef.current = false;
            stopAll();
            onScanSuccess(decodedText, fmt);
          },
          () => {} // per-frame decode error — ignore
        );

        // Fix h5q-generated DOM: hide its dashboard, make video fill container
        const dash = document.getElementById(`${cid}__dashboard`);
        if (dash) dash.style.display = "none";
        const scanRegion = document.getElementById(`${cid}__scan_region`);
        if (scanRegion) {
          scanRegion.style.width = "100%";
          scanRegion.style.height = "100%";
          scanRegion.style.paddingBottom = "0";
        }
        const vid = document.querySelector(`#${cid} video`) as HTMLVideoElement | null;
        if (vid) {
          vid.style.width = "100%";
          vid.style.height = "100%";
          vid.style.objectFit = "cover";
          vid.style.position = "absolute";
          vid.style.inset = "0";
        }

        setState("streaming");
      } catch (err: any) {
        const msg = `${err?.name ?? ""} ${err?.message ?? ""}`.toLowerCase();
        activeRef.current = false;
        setUsingH5q(false);
        setState(/notallowed|permission|denied/i.test(msg) ? "denied" : "no-camera");
        onScanError?.(msg);
      }
    }
  }, [scanLoop, onScanError, stopAll, onScanSuccess]);

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
        let supportedFormats: string[] = [...ALL_FORMATS];
        try {
          const bf: string[] = await (window as any).BarcodeDetector.getSupportedFormats();
          supportedFormats = ALL_FORMATS.filter((f) => bf.includes(f));
        } catch {}
        const det = new (window as any).BarcodeDetector({ formats: supportedFormats });
        const results = await det.detect(img);
        if (results.length > 0) {
          setState("idle");
          onScanSuccess(results[0].rawValue, results[0].format ?? "unknown");
          e.target.value = "";
          return;
        }
      }
      const { Html5Qrcode } = await import("html5-qrcode");
      let el = document.getElementById("__bcs_h5q_tmp__");
      if (!el) {
        el = document.createElement("div");
        el.id = "__bcs_h5q_tmp__";
        el.style.cssText = "position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;top:-9999px";
        document.body.appendChild(el);
      }
      const scanner = new Html5Qrcode("__bcs_h5q_tmp__", {
        formatsToSupport: H5Q_ALL_FORMATS,
        verbose: false,
      } as any);
      try {
        const res = (scanner as any).scanFileV2
          ? await (scanner as any).scanFileV2(file, false)
          : await scanner.scanFile(file, false).then((t: string) => ({ decodedText: t }));
        const text = typeof res === "string" ? res : res.decodedText;
        const fmt: string = res?.result?.format?.formatName ?? "unknown";
        setState("idle");
        onScanSuccess(text, fmt);
      } finally { try { scanner.clear(); } catch {} }
    } catch {
      setImageError("No barcode found. Try a clearer photo in good light.");
      setState("image-error");
    }
    e.target.value = "";
  }, [onScanSuccess, stopAll]);

  const fmtLabel = (f: string) =>
    f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
      <div className="relative w-full aspect-square bg-slate-950 overflow-hidden">
        {/* BarcodeDetector path — Chrome / Android */}
        <video ref={videoRef} muted playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            state === "streaming" && !usingH5q ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />

        {/* html5-qrcode container — iOS Safari / Firefox */}
        <div
          id={containerIdRef.current}
          className="absolute inset-0 w-full h-full overflow-hidden bg-black"
          style={{ display: usingH5q ? "block" : "none" }}
        />

        {/* Idle / Requesting overlay */}
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
                <p className="text-xs text-slate-400 max-w-[200px]">Point your camera at any barcode or QR code to scan.</p>
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

        {/* Scan frame overlay — shown while streaming */}
        {state === "streaming" && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-3">
            <div className="relative w-[80%] aspect-[2/1]">
              <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-teal-400 rounded-tl-sm" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-teal-400 rounded-tr-sm" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-teal-400 rounded-bl-sm" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-teal-400 rounded-br-sm" />
              <div className="absolute inset-x-0 top-0 h-0.5 bg-teal-400/70 animate-[scanline_2s_ease-in-out_infinite]" />
            </div>
            {lastFormat && (
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] font-semibold tracking-wider uppercase">
                {fmtLabel(lastFormat)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
        {state === "streaming" ? (
          <>
            <p className="text-[11px] text-slate-400">Hold any barcode or QR code steady</p>
            <Button size="sm" variant="destructive" onClick={stopAll} className="h-7 text-xs gap-1.5">
              <CameraOff className="h-3.5 w-3.5" /> Stop
            </Button>
          </>
        ) : (
          <p className="text-[11px] text-slate-500 w-full text-center">
            EAN · UPC · Code 128/39/93 · QR · Aztec · PDF417 · Data Matrix · Codabar · ITF · and more
          </p>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
    </div>
  );
}
