import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type CurrencyCode = "USD" | "KHR";

export function getActiveCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "USD";
  return (localStorage.getItem("smart_inventory_currency") as CurrencyCode) ?? "USD";
}

const USD_TO_KHR = 4000;

export function formatCurrency(amount: number | string | null | undefined, currency?: CurrencyCode): string {
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  const cur = currency ?? getActiveCurrency();
  if (cur === "KHR") {
    return new Intl.NumberFormat("km-KH", {
      style: "currency",
      currency: "KHR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(numeric * USD_TO_KHR));
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(numeric);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function generateSKU(prefix = "SKU", categoryName = ""): string {
  const catCode = categoryName ? categoryName.slice(0, 3).toUpperCase() : "GEN";
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${catCode}-${randomNum}`;
}

export function generateBarcode(): string {
  // Generate 12-digit UPC/EAN compliant string
  const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  return random12;
}

export function generateOrderNumber(prefix: "PO" | "SO" | "TRF" | "TXN"): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${rand}`;
}
