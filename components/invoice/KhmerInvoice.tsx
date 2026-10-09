"use client";

import React, { useState, useEffect } from "react";
import { Printer, X } from "lucide-react";
import { getSystemName } from "@/lib/systemName";

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

const DEFAULT_RATE = 4000;

function fmt(n: number) { return "$" + n.toFixed(2); }
function fmtKHR(n: number, rate: number) { return (Math.round(n * rate)).toLocaleString(); }

function buildPrintHTML(props: Omit<KhmerInvoiceProps, "onClose">, rate: number, sysName: string) {
  const { orderNumber, orderDate, customerName, warehouseName, items, subtotal, discount = 0, tax = 0, total } = props;

  const d = new Date(orderDate);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  const itemRows = items.map((item, i) => `<tr>
    <td style="text-align:center">${i + 1}</td>
    <td>${item.productName}<br/><span style="font-size:9px;color:#666;font-family:monospace">${item.productSku}</span></td>
    <td style="text-align:center">PCS</td>
    <td style="text-align:center">${item.quantity}</td>
    <td style="text-align:right">${fmt(item.unitPrice)}</td>
    <td style="text-align:right">${fmt(item.totalAmount)}</td>
    <td style="text-align:right">${fmtKHR(item.totalAmount, rate)}</td>
  </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>វិក្កយបត្រ ${orderNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&display=swap" rel="stylesheet"/>
  <style>
    @page { size: A5; margin: 6mm 8mm; }
    @media print { body { padding:0; } }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Battambang',sans-serif; font-size:10px; color:#000; background:#fff; padding:10px; }
    .store-name { text-align:center; font-size:15px; font-weight:bold; margin-bottom:6px; }
    .top-info { display:grid; grid-template-columns:1fr auto 1fr; gap:4px; align-items:start; margin-bottom:6px; }
    .top-left { font-size:9.5px; line-height:1.85; }
    .top-left span { display:inline-block; min-width:60px; }
    .top-center { text-align:center; padding:0 8px; }
    .top-center .kh { font-size:18px; font-weight:bold; }
    .top-center .en { font-size:12px; font-weight:bold; letter-spacing:2px; margin-top:2px; }
    .top-right { font-size:9.5px; line-height:1.85; text-align:right; }
    table { width:100%; border-collapse:collapse; }
    th, td { border:1px solid #000; padding:2px 4px; font-size:9.5px; }
    .th-kh { font-size:10px; font-weight:bold; }
    .th-en { font-size:8.5px; font-weight:normal; }
    .col-no { width:5%; }
    .col-name { width:30%; }
    .col-unit { width:8%; }
    .col-qty { width:9%; }
    .col-price { width:13%; }
    .col-amount { width:13%; }
    .col-khr { width:13%; }
    tbody tr { height:15px; }
    .total-label { text-align:right; font-weight:bold; padding-right:6px; }
    .note-cell { font-size:8.5px; line-height:1.5; vertical-align:top; padding:4px; }
    .sig-row { display:flex; justify-content:space-between; align-items:flex-end; margin-top:8px; font-size:9.5px; }
    .sig-block { line-height:2; }
    .dotline { display:inline-block; min-width:60px; border-bottom:1px dotted #000; }
  </style>
</head>
<body>
  <div class="store-name">( ${sysName} )</div>

  <div class="top-info">
    <div class="top-left">
      <span>ថ្ងៃទី</span> ${day}  ខែ ${month}  ឆ្នាំ ${year}<br/>
      <span>ឈ្មោះ</span> ${customerName}<br/>
      <span>ឃ្លាំង</span> ${warehouseName}<br/>
      <span>លេខ</span> ${orderNumber}<br/>
    </div>
    <div class="top-center">
      <div class="kh">វិក្កយបត្រ</div>
      <div class="en">INVOICE</div>
    </div>
    <div class="top-right">
      Nº ${orderNumber}<br/>
      Commune: ............<br/>
      District: ..............<br/>
      Province: ............<br/>
      Tel: ..................
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="col-no" style="text-align:center"><div class="th-kh">ល.រ</div><div class="th-en">No</div></th>
        <th class="col-name" style="text-align:center"><div class="th-kh">ឈ្មោះផលិតផល</div><div class="th-en">Name Of Products</div></th>
        <th class="col-unit" style="text-align:center"><div class="th-kh">ឯកតា</div><div class="th-en">Unit</div></th>
        <th class="col-qty" style="text-align:center"><div class="th-kh">ចំនួន</div><div class="th-en">Quantity</div></th>
        <th class="col-price" style="text-align:center"><div class="th-kh">តម្លៃរាយ</div><div class="th-en">Unit Price</div></th>
        <th class="col-amount" style="text-align:center"><div class="th-kh">តម្លៃសរុប</div><div class="th-en">Amount</div></th>
        <th class="col-khr" style="text-align:center"><div class="th-kh">រៀល</div></th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr>
        <td class="note-cell" colspan="3" rowspan="4">
          បញ្ជាក់: មុនចុះហត្ថលេខាសូមមានពិនិត្យ<br/>ទិន្នន័យត្រឹមត្រូវមុនតែចុះហត្ថលេខា។
        </td>
        <td class="total-label" colspan="2">សរុបរង &nbsp; SUB TOTAL</td>
        <td style="text-align:right;font-weight:bold">${fmt(subtotal)}</td>
        <td style="text-align:right">${fmtKHR(subtotal, rate)}</td>
      </tr>
      <tr>
        <td class="total-label" colspan="2">បញ្ចុះតម្លៃ &nbsp; DISCOUNT</td>
        <td style="text-align:right">${discount > 0 ? fmt(discount) : "—"}</td>
        <td style="text-align:right">${discount > 0 ? fmtKHR(discount, rate) : "—"}</td>
      </tr>
      <tr>
        <td class="total-label" colspan="2">ពន្ធ &nbsp; TAX</td>
        <td style="text-align:right">${tax > 0 ? fmt(tax) : "—"}</td>
        <td style="text-align:right">${tax > 0 ? fmtKHR(tax, rate) : "—"}</td>
      </tr>
      <tr>
        <td class="total-label" colspan="2" style="background:#f5f5f5">សរុបទូទៅ &nbsp; TOTAL</td>
        <td style="text-align:right;font-weight:bold;background:#f5f5f5">${fmt(total)}</td>
        <td style="text-align:right;background:#f5f5f5">${fmtKHR(total, rate)}</td>
      </tr>
    </tbody>
  </table>

  <div class="sig-row">
    <div class="sig-block">
      ថ្ងៃទី<span class="dotline"></span>ខែ<span class="dotline"></span>ឆ្នាំ20<span class="dotline"></span><br/>
      អ្នកទិញ (Buyer)<br/><br/>
      (Seller)
    </div>
    <div class="sig-block" style="text-align:right">
      Date: <span class="dotline"></span>/<span class="dotline"></span>/<span class="dotline"></span><br/>
      <br/><br/>
      អ្នកលក់
    </div>
  </div>
</body>
</html>`;
}

export function KhmerInvoice(props: KhmerInvoiceProps) {
  const { orderNumber, orderDate, customerName, warehouseName, items, subtotal, discount = 0, tax = 0, total, notes, onClose } = props;
  const [rate, setRate] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_RATE;
    return Number(localStorage.getItem("invoice_exchange_rate")) || DEFAULT_RATE;
  });
  const [sysName, setSysName] = useState("Smart Inventory");

  const handleRateChange = (val: number) => {
    setRate(val);
    localStorage.setItem("invoice_exchange_rate", String(val));
  };

  useEffect(() => {
    setSysName(getSystemName());
    const handler = () => setSysName(getSystemName());
    window.addEventListener("system_name_changed", handler);
    return () => window.removeEventListener("system_name_changed", handler);
  }, []);

  const handlePrint = () => {
    const html = buildPrintHTML({ orderNumber, orderDate, customerName, warehouseName, items, subtotal, discount, tax, total, notes }, rate, sysName);
    const win = window.open("", "_blank", "width=700,height=950");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
  };

  const d = new Date(orderDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Modal toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-[#6b8a4e]" />
            <span className="font-bold text-sm text-slate-900">វិក្កយបត្រ / Invoice</span>
            <span className="text-xs text-slate-400 font-mono">#{orderNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Exchange rate */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-semibold text-amber-700 whitespace-nowrap">$1 =</span>
              <input
                type="number"
                min="1"
                step="100"
                value={rate}
                onChange={(e) => handleRateChange(Number(e.target.value) || DEFAULT_RATE)}
                className="w-20 text-xs font-bold text-amber-800 bg-transparent outline-none text-right"
              />
              <span className="text-[10px] font-semibold text-amber-700">៛</span>
            </div>
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1e2e14] hover:bg-[#2d4020] text-white text-xs font-bold rounded-xl transition-all">
              <Printer className="h-3.5 w-3.5" /> បោះពុម្ព / Print
            </button>
            <button onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="overflow-y-auto p-5 flex-1" style={{ fontFamily: "'Battambang', sans-serif" }}>
          {/* Store name */}
          <div className="text-center text-base font-bold mb-3">( {sysName} )</div>

          {/* Top info */}
          <div className="grid grid-cols-3 gap-1 mb-3 text-[10px]">
            <div className="leading-6">
              <span className="inline-block w-16">ថ្ងៃទី</span>{d.getDate()} ខែ {d.getMonth()+1} ឆ្នាំ {d.getFullYear()}<br/>
              <span className="inline-block w-16">ឈ្មោះ</span>{customerName}<br/>
              <span className="inline-block w-16">ឃ្លាំង</span>{warehouseName}<br/>
              <span className="inline-block w-16">លេខ</span>{orderNumber}
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">វិក្កយបត្រ</div>
              <div className="text-sm font-bold tracking-widest">INVOICE</div>
            </div>
            <div className="text-right leading-6">
              Nº {orderNumber}<br/>
              Commune: ............<br/>
              District: ..............<br/>
              Province: ............<br/>
              Tel: ..................
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-[9.5px] border-collapse">
            <thead>
              <tr>
                {[
                  { kh: "ល.រ", en: "No", cls: "w-[5%] text-center" },
                  { kh: "ឈ្មោះផលិតផល", en: "Name Of Products", cls: "w-[30%] text-center" },
                  { kh: "ឯកតា", en: "Unit", cls: "w-[8%] text-center" },
                  { kh: "ចំនួន", en: "Quantity", cls: "w-[9%] text-center" },
                  { kh: "តម្លៃរាយ", en: "Unit Price", cls: "w-[13%] text-center" },
                  { kh: "តម្លៃសរុប", en: "Amount", cls: "w-[13%] text-center" },
                  { kh: "រៀល", en: "", cls: "w-[13%] text-center" },
                ].map((col, i) => (
                  <th key={i} className={`border border-black p-1 ${col.cls}`}>
                    <div className="font-bold">{col.kh}</div>
                    {col.en && <div className="font-normal text-[8px]">{col.en}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ height: 18 }}>
                  <td className="border border-black text-center px-1">{i + 1}</td>
                  <td className="border border-black px-1">
                    {item.productName} <span className="text-[8px] text-slate-400">({item.productSku})</span>
                  </td>
                  <td className="border border-black text-center px-1">PCS</td>
                  <td className="border border-black text-center px-1">{item.quantity}</td>
                  <td className="border border-black text-right px-1">{fmt(item.unitPrice)}</td>
                  <td className="border border-black text-right px-1">{fmt(item.totalAmount)}</td>
                  <td className="border border-black text-right px-1">{fmtKHR(item.totalAmount, rate)}</td>
                </tr>
              ))}
              {/* Summary rows */}
              <tr>
                <td className="border border-black text-[8.5px] leading-5 px-1 align-top" colSpan={3} rowSpan={4}>
                  បញ្ជាក់: មុនចុះហត្ថលេខាសូមមានពិនិត្យ<br/>ទិន្នន័យត្រឹមត្រូវមុនតែចុះហត្ថលេខា។
                </td>
                <td className="border border-black text-right font-bold px-2" colSpan={2}>សរុបរង &nbsp; SUB TOTAL</td>
                <td className="border border-black text-right font-bold px-1">{fmt(subtotal)}</td>
                <td className="border border-black text-right px-1">{fmtKHR(subtotal, rate)}</td>
              </tr>
              <tr>
                <td className="border border-black text-right font-bold px-2" colSpan={2}>បញ្ចុះតម្លៃ &nbsp; DISCOUNT</td>
                <td className="border border-black text-right px-1">{discount > 0 ? fmt(discount) : "—"}</td>
                <td className="border border-black text-right px-1">{discount > 0 ? fmtKHR(discount, rate) : "—"}</td>
              </tr>
              <tr>
                <td className="border border-black text-right font-bold px-2" colSpan={2}>ពន្ធ &nbsp; TAX</td>
                <td className="border border-black text-right px-1">{tax > 0 ? fmt(tax) : "—"}</td>
                <td className="border border-black text-right px-1">{tax > 0 ? fmtKHR(tax, rate) : "—"}</td>
              </tr>
              <tr>
                <td className="border border-black text-right font-bold px-2 bg-slate-50" colSpan={2}>សរុបទូទៅ &nbsp; TOTAL</td>
                <td className="border border-black text-right font-bold px-1 bg-slate-50">{fmt(total)}</td>
                <td className="border border-black text-right px-1 bg-slate-50">{fmtKHR(total, rate)}</td>
              </tr>
            </tbody>
          </table>

          {/* Signatures */}
          <div className="flex justify-between mt-3 text-[9.5px]">
            <div className="leading-6">
              ថ្ងៃទី<span className="inline-block w-12 border-b border-dotted border-black"></span>
              ខែ<span className="inline-block w-12 border-b border-dotted border-black"></span>
              ឆ្នាំ20<span className="inline-block w-12 border-b border-dotted border-black"></span><br/>
              អ្នកទិញ (Buyer)<br/><br/>
              (Seller)
            </div>
            <div className="text-right leading-6">
              Date:<span className="inline-block w-10 border-b border-dotted border-black"></span>/
              <span className="inline-block w-10 border-b border-dotted border-black"></span>/
              <span className="inline-block w-10 border-b border-dotted border-black"></span><br/>
              <br/><br/>
              អ្នកលក់
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
