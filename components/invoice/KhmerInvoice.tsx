"use client";

import React, { useRef } from "react";
import { Printer, X } from "lucide-react";

interface InvoiceItem {
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface KhmerInvoiceProps {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  warehouseName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  notes?: string;
  onClose: () => void;
}

function fmt(amount: number) {
  return "$" + amount.toFixed(2);
}

function fmtKHR(amount: number) {
  return (amount * 4100).toLocaleString() + " ៛";
}

export function KhmerInvoice({
  orderNumber, orderDate, customerName, warehouseName,
  items, subtotal, discount = 0, tax = 0, total, notes, onClose,
}: KhmerInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>វិក្កយបត្រ ${orderNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Battambang','Inter',sans-serif; font-size:11px; color:#111; background:#fff; padding:20px; }
    .invoice-wrap { max-width:100%; margin:0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
    .brand { font-size:20px; font-weight:700; color:#1e2e14; }
    .brand-sub { font-size:11px; color:#666; margin-top:2px; }
    .invoice-title { text-align:right; }
    .invoice-title h1 { font-size:22px; font-weight:700; color:#1e2e14; }
    .invoice-title p { font-size:11px; color:#666; margin-top:2px; }
    .divider { border:none; border-top:2px solid #1e2e14; margin:16px 0; }
    .divider-light { border:none; border-top:1px solid #e5e7eb; margin:12px 0; }
    .meta { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
    .meta-block label { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:.05em; display:block; margin-bottom:3px; }
    .meta-block span { font-size:13px; font-weight:600; }
    table { width:100%; border-collapse:collapse; margin-bottom:16px; }
    thead tr { background:#1e2e14; color:#fff; }
    thead th { padding:8px 10px; text-align:left; font-size:12px; font-weight:600; }
    thead th:last-child, thead th:nth-child(3), thead th:nth-child(2) { text-align:right; }
    tbody tr { border-bottom:1px solid #f3f4f6; }
    tbody tr:nth-child(even) { background:#f9fafb; }
    tbody td { padding:8px 10px; font-size:12px; }
    tbody td:nth-child(2), tbody td:nth-child(3), tbody td:last-child { text-align:right; }
    .totals { display:flex; flex-direction:column; align-items:flex-end; gap:6px; margin-top:8px; }
    .total-row { display:flex; gap:24px; justify-content:flex-end; font-size:12px; }
    .total-row span:first-child { color:#666; min-width:100px; text-align:right; }
    .total-row span:last-child { font-weight:600; min-width:80px; text-align:right; }
    .grand-total { font-size:16px; font-weight:700; border-top:2px solid #1e2e14; padding-top:8px; margin-top:4px; }
    .grand-total span:first-child { color:#1e2e14; }
    .grand-total span:last-child { color:#1e2e14; }
    .khr { font-size:11px; color:#888; }
    .footer { margin-top:32px; text-align:center; color:#888; font-size:11px; border-top:1px solid #e5e7eb; padding-top:16px; }
    .footer strong { color:#1e2e14; font-size:13px; display:block; margin-bottom:4px; }
    .sku { font-size:10px; color:#aaa; font-family:monospace; }
    @page { size: A5; margin: 12mm 14mm; }
    @media print { body { padding:0; } }
  </style>
</head>
<body>
<div class="invoice-wrap">
  ${content}
</div>
</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  const dateStr = new Date(orderDate).toLocaleDateString("km-KH", {
    year: "numeric", month: "long", day: "numeric",
  });
  const dateStrEn = new Date(orderDate).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-[#6b8a4e]" />
            <span className="font-bold text-slate-900">វិក្កយបត្រ / Invoice</span>
            <span className="text-xs text-slate-400 font-mono">#{orderNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e2e14] hover:bg-[#2d4020] text-white text-xs font-bold rounded-xl transition-all"
            >
              <Printer className="h-3.5 w-3.5" /> បោះពុម្ព / Print
            </button>
            <button onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Invoice content — this is what gets printed */}
        <div ref={printRef} className="px-8 py-6 font-[Battambang,Inter,sans-serif]" style={{ fontFamily: "'Battambang','Inter',sans-serif" }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-xl font-bold text-[#1e2e14]">Smart Inventory</div>
              <div className="text-xs text-slate-500 mt-0.5">{warehouseName}</div>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-[#1e2e14]">វិក្កយបត្រ</h1>
              <p className="text-xs text-slate-500 mt-0.5">INVOICE</p>
            </div>
          </div>

          <hr className="border-[#1e2e14] border-t-2 mb-4" />

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">អតិថិជន / Customer</div>
              <div className="font-semibold text-slate-900">{customerName}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">លេខបញ្ជា / Order No.</div>
              <div className="font-semibold text-slate-900 font-mono">{orderNumber}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">ឃ្លាំង / Warehouse</div>
              <div className="font-semibold text-slate-900">{warehouseName}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">កាលបរិច្ឆេទ / Date</div>
              <div className="font-semibold text-slate-900">{dateStr}</div>
              <div className="text-[11px] text-slate-400">{dateStrEn}</div>
            </div>
          </div>

          {/* Items table */}
          <table className="w-full text-xs mb-4 border-collapse">
            <thead>
              <tr className="bg-[#1e2e14] text-white">
                <th className="text-left py-2.5 px-3 rounded-tl-lg font-semibold">ទំនិញ / Item</th>
                <th className="text-right py-2.5 px-3 font-semibold">បរិមាណ / Qty</th>
                <th className="text-right py-2.5 px-3 font-semibold">តម្លៃ / Unit Price</th>
                <th className="text-right py-2.5 px-3 rounded-tr-lg font-semibold">សរុប / Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="py-2.5 px-3 border-b border-slate-100">
                    <div className="font-semibold text-slate-900">{item.productName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.productSku}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 border-b border-slate-100">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700 border-b border-slate-100">{fmt(item.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 border-b border-slate-100">{fmt(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex flex-col items-end gap-1.5 mb-6">
            <div className="flex justify-between w-56 text-xs text-slate-600">
              <span>សរុបរង / Subtotal</span>
              <span className="font-semibold">{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between w-56 text-xs text-slate-600">
                <span>បញ្ចុះតម្លៃ / Discount</span>
                <span className="font-semibold text-rose-600">-{fmt(discount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between w-56 text-xs text-slate-600">
                <span>VAT / Tax</span>
                <span className="font-semibold">{fmt(tax)}</span>
              </div>
            )}
            <div className="flex justify-between w-56 border-t-2 border-[#1e2e14] pt-2 mt-1">
              <span className="text-sm font-bold text-[#1e2e14]">សរុបទាំងអស់ / Total</span>
              <div className="text-right">
                <div className="text-base font-black text-[#1e2e14]">{fmt(total)}</div>
                <div className="text-[10px] text-slate-400">{fmtKHR(total)}</div>
              </div>
            </div>
          </div>

          {notes && (
            <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
              <span className="font-semibold">កំណត់ចំណាំ / Notes: </span>{notes}
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-sm font-bold text-[#1e2e14]">អរគុណសម្រាប់ការទិញទំនិញ!</p>
            <p className="text-xs text-slate-400 mt-1">Thank you for your purchase!</p>
            <p className="text-[10px] text-slate-300 mt-2 font-mono">Smart Inventory Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
}
