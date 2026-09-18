"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeCanvasProps {
  value: string;
  format?: "CODE128" | "EAN13" | "UPC" | "EAN8" | "CODE39";
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export function BarcodeCanvas({
  value,
  format = "CODE128",
  width = 2,
  height = 50,
  displayValue = true,
  fontSize = 14,
  className,
}: BarcodeCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize,
          margin: 4,
          background: "transparent",
          lineColor: "#0f172a",
        });
      } catch (err) {
        // Fallback to generic CODE128 if format failed
        try {
          JsBarcode(svgRef.current, value, {
            format: "CODE128",
            width,
            height,
            displayValue,
            fontSize,
            margin: 4,
            background: "transparent",
            lineColor: "#0f172a",
          });
        } catch (e) {
          console.error("Barcode rendering error", e);
        }
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center bg-white p-2 rounded-lg border border-slate-200 ${className || ""}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
}
