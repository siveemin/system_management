"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ScanBarcode, Camera, Keyboard, Package, Boxes, Plus, Minus,
  ArrowLeftRight, ShoppingCart, CheckCircle2, AlertTriangle,
  Search, Clock, PackagePlus, Trash2, Receipt, X, Printer,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, generateSKU, generateBarcode } from "@/lib/utils";
import { BarcodeCameraScanner } from "@/components/scanner/BarcodeCameraScanner";
import { HardwareScanListener } from "@/components/scanner/HardwareScanListener";
import { KhmerInvoice } from "@/components/invoice/KhmerInvoice";

const EMPTY_NEW = { name: "", barcode: "", sku: "", uom: "PCS", costPrice: 0, sellingPrice: 0, categoryId: "", supplierId: "" };

interface CartItem { product: any; quantity: number; unitPrice: number; }

function genOrderNumber() {
  return "SO-" + Date.now().toString().slice(-6);
}

export default function ScannerPage() {
  const { t } = useTranslation();
  const [manualCode, setManualCode] = useState("");
  const [scannedProduct, setScannedProduct] = useState<any | null>(null);
  const [scanTime, setScanTime] = useState<Date | null>(null);
  const [scannedFormat, setScannedFormat] = useState<string | null>(null);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<"camera" | "hardware">("camera");
  const lastScanRef = useRef<{ code: string; time: number } | null>(null);

  const [pageMode, setPageMode] = useState<"lookup" | "pos">("lookup");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutCustomerId, setCheckoutCustomerId] = useState("");
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string>("");

  const [actionModal, setActionModal] = useState<"stock_in" | "stock_out" | "transfer" | null>(null);
  const [actionQty, setActionQty] = useState(1);
  const [actionNotes, setActionNotes] = useState("");
  const [destWarehouseId, setDestWarehouseId] = useState("");
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [actionSaving, setActionSaving] = useState(false);

  const [quickCreate, setQuickCreate] = useState<{ barcode: string; name: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ ...EMPTY_NEW });
  const [addScanMode, setAddScanMode] = useState(false);

  const load = useCallback(async () => {
    const [p, w, c, s, cust] = await Promise.all([
      fetch("/api/products").then(r => r.ok ? r.json() : []),
      fetch("/api/warehouses").then(r => r.ok ? r.json() : []),
      fetch("/api/categories").then(r => r.ok ? r.json() : []),
      fetch("/api/suppliers").then(r => r.ok ? r.json() : []),
      fetch("/api/customers").then(r => r.ok ? r.json() : []),
    ]);
    setProducts(Array.isArray(p) ? p : []);
    if (Array.isArray(w) && w.length > 0) {
      setWarehouses(w);
      setCurrentWarehouseId((prev) => prev || w[0].id);
    }
    setCategories(Array.isArray(c) ? c : []);
    setSuppliers(Array.isArray(s) ? s : []);
    setCustomers(Array.isArray(cust) ? cust : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const refreshProduct = useCallback(async (id: string) => {
    const res = await fetch(`/api/products/${id}`);
    if (res.ok) {
      const p = await res.json();
      setScannedProduct(p);
      setProducts(prev => prev.map(x => x.id === id ? p : x));
    }
  }, []);

  const handleLookup = (code: string, format?: string) => {
    if (!code) return;
    const rawDisplay = code.replace(/[\x00-\x1f\x7f]/g, "").trim();
    if (!rawDisplay) return;
    const now = Date.now();
    if (lastScanRef.current?.code === rawDisplay && now - lastScanRef.current.time < 2000) return;
    lastScanRef.current = { code: rawDisplay, time: now };

    const prod = products.find(p => p.barcode === rawDisplay || p.sku === rawDisplay);
    const fmtLabel = format && format !== "unknown" ? ` · ${format.replace(/_/g, " ").toUpperCase()}` : "";

    if (prod) {
      if (pageMode === "pos") {
        setCart(prev => {
          const idx = prev.findIndex(i => i.product.id === prod.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
            return next;
          }
          return [...prev, { product: prod, quantity: 1, unitPrice: prod.sellingPrice }];
        });
        setActionMessage({ text: `✓ Added: ${prod.name}${fmtLabel}`, type: "success" });
        return;
      }
      setScannedProduct(prod);
      setScanTime(new Date());
      setScannedFormat(format ?? null);
      setSearchFeedback(null);
      setQuickCreate(null);
      setActionMessage({ text: `✓ ${prod.name} · ${rawDisplay}${fmtLabel}`, type: "success" });
    } else {
      setScannedProduct(null);
      setScanTime(null);
      setScannedFormat(format ?? null);
      setSearchFeedback(rawDisplay);
      setQuickCreate({ barcode: rawDisplay, name: "" });
      setActionMessage({ text: `Not found: "${rawDisplay}"${fmtLabel} — register it below`, type: "error" });
    }
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCreate?.name.trim()) return;
    const cat = categories[0];
    const sup = suppliers[0];
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: quickCreate.name.trim(),
        sku: generateSKU("SKU", cat?.name ?? ""),
        barcode: quickCreate.barcode,
        uom: "PCS",
        costPrice: 0,
        sellingPrice: 0,
        minStockLevel: 10,
        maxStockLevel: 500,
        categoryId: cat?.id ?? null,
        supplierId: sup?.id ?? null,
        status: "ACTIVE",
      }),
    });
    if (res.ok) {
      const newProduct = await res.json();
      await load();
      setQuickCreate(null);
      setScannedProduct(newProduct);
      setScanTime(new Date());
      setActionMessage({ text: `Created & matched: ${newProduct.name}`, type: "success" });
    }
  };

  const openAddModal = (prefillBarcode = "") => {
    const cat = categories[0];
    const sup = suppliers[0];
    setAddForm({
      ...EMPTY_NEW,
      barcode: prefillBarcode,
      sku: generateSKU("SKU", cat?.name ?? ""),
      categoryId: cat?.id ?? "",
      supplierId: sup?.id ?? "",
    });
    setAddScanMode(false);
    setAddOpen(true);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    const cat = categories.find((c) => c.id === addForm.categoryId);
    const sup = suppliers.find((s) => s.id === addForm.supplierId);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: addForm.name.trim(),
        sku: addForm.sku || generateSKU("SKU", cat?.name ?? ""),
        barcode: addForm.barcode || generateBarcode(),
        uom: addForm.uom,
        costPrice: addForm.costPrice,
        sellingPrice: addForm.sellingPrice,
        minStockLevel: 10,
        maxStockLevel: 500,
        categoryId: addForm.categoryId || null,
        supplierId: addForm.supplierId || null,
        status: "ACTIVE",
      }),
    });
    if (res.ok) {
      const newProduct = await res.json();
      await load();
      setAddOpen(false);
      setQuickCreate(null);
      setScannedProduct(newProduct);
      setScanTime(new Date());
      setActionMessage({ text: `Product "${newProduct.name}" added & matched`, type: "success" });
    }
  };

  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    const subtotal = cartTotal;
    const body = {
      orderNumber: genOrderNumber(),
      customerId: checkoutCustomerId || null,
      warehouseId: currentWarehouseId,
      orderDate: new Date().toISOString(),
      status: "CONFIRMED",
      subtotal,
      discount: 0,
      tax: 0,
      totalAmount: subtotal,
      notes: checkoutNotes || "Walk-in sale via scanner",
      items: cart.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalAmount: i.unitPrice * i.quantity,
      })),
    };
    try {
      const res = await fetch("/api/sales-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        const order = await res.json();
        const selectedCustomer = customers.find(c => c.id === checkoutCustomerId);
        setInvoiceData({
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          customerName: selectedCustomer?.name ?? "អតិថិជនទូទៅ (Walk-in)",
          warehouseName: warehouses.find(w => w.id === currentWarehouseId)?.name ?? "Warehouse",
          items: cart.map(i => ({
            productName: i.product.name,
            productSku: i.product.sku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalAmount: i.unitPrice * i.quantity,
          })),
          subtotal: cartTotal, discount: 0, tax: 0, total: cartTotal, notes: checkoutNotes,
        });
        setCheckoutDone(order.orderNumber);
        setCart([]);
        setCheckoutOpen(false);
        setCheckoutNotes("");
        setCheckoutCustomerId("");
        await load();
      } else {
        setActionMessage({ text: "Failed to create order. Try again.", type: "error" });
      }
    } catch {
      setActionMessage({ text: "Network error. Try again.", type: "error" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleQuickStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedProduct || actionQty <= 0) return;
    setActionSaving(true);
    const res = await fetch("/api/inventory/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: scannedProduct.id, warehouseId: currentWarehouseId, quantityChange: actionQty, type: "STOCK_IN", notes: actionNotes || t("scanner_note_in") }),
    });
    setActionSaving(false);
    if (res.ok) {
      setActionMessage({ text: `+${actionQty} ${t("scanner_add_title").toLowerCase()}`, type: "success" });
      setActionModal(null);
      setActionQty(1);
      setActionNotes("");
      await refreshProduct(scannedProduct.id);
    } else {
      setActionMessage({ text: "Failed to adjust stock", type: "error" });
    }
  };

  const handleQuickStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedProduct || actionQty <= 0) return;
    setActionSaving(true);
    const res = await fetch("/api/inventory/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: scannedProduct.id, warehouseId: currentWarehouseId, quantityChange: -actionQty, type: "STOCK_OUT", notes: actionNotes || t("scanner_note_out") }),
    });
    setActionSaving(false);
    if (res.ok) {
      setActionMessage({ text: `-${actionQty} ${t("scanner_deduct_title").toLowerCase()}`, type: "success" });
      setActionModal(null);
      setActionQty(1);
      setActionNotes("");
      await refreshProduct(scannedProduct.id);
    } else {
      setActionMessage({ text: "Failed to adjust stock", type: "error" });
    }
  };

  const handleQuickTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedProduct || !destWarehouseId || actionQty <= 0) return;
    setActionSaving(true);
    const transferNumber = "TRF-" + Date.now().toString().slice(-6);
    const res = await fetch("/api/stock-transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transferNumber,
        sourceWarehouseId: currentWarehouseId,
        destinationWarehouseId: destWarehouseId,
        notes: actionNotes || t("scanner_note_transfer"),
        items: [{ productId: scannedProduct.id, requestedQuantity: actionQty }],
      }),
    });
    setActionSaving(false);
    if (res.ok) {
      setActionMessage({ text: `Transfer ${transferNumber} created (${actionQty} units)`, type: "success" });
      setActionModal(null);
      setActionQty(1);
      setActionNotes("");
    } else {
      setActionMessage({ text: t("msg_transfer_failed"), type: "error" });
    }
  };

  const activeWarehouse = warehouses.find((w) => w.id === currentWarehouseId) || warehouses[0];
  const currentInv = scannedProduct?.inventories?.find((i: any) => i.warehouseId === currentWarehouseId);

  return (
    <div className="space-y-5">
      <HardwareScanListener onScan={(code) => handleLookup(code)} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ScanBarcode className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_scanner_title")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("page_scanner_sub")}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-full bg-slate-100 p-1 text-xs font-bold border border-slate-200">
            <button onClick={() => setPageMode("lookup")}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${pageMode === "lookup" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-800"}`}>
              <Search className="h-3.5 w-3.5" /> Lookup
            </button>
            <button onClick={() => setPageMode("pos")}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${pageMode === "pos" ? "bg-[#6b8a4e] shadow text-white" : "text-slate-500 hover:text-slate-800"}`}>
              <ShoppingCart className="h-3.5 w-3.5" /> Quick Sale
              {cart.length > 0 && <span className="bg-white text-[#6b8a4e] rounded-full text-[10px] font-black w-4 h-4 flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>

          <button onClick={() => openAddModal()}
            className="flex items-center gap-2 bg-[#6b8a4e] hover:bg-[#5a7840] text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-sm transition-all active:scale-[0.98]">
            <PackagePlus className="h-4 w-4" /> Add New Product
          </button>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-full px-4 py-1.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold">{t("scanner_active_wh")}:</span>
            {warehouses.length > 1 ? (
              <select value={currentWarehouseId} onChange={(e) => setCurrentWarehouseId(e.target.value)}
                className="text-xs font-bold text-[#6b8a4e] bg-transparent border-none outline-none cursor-pointer">
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            ) : (
              <span className="text-xs font-bold text-[#6b8a4e]">{activeWarehouse?.name}</span>
            )}
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
          actionMessage.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
            : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
        }`}>
          {actionMessage.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800/80 rounded-[26px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[#6b8a4e]" />
                  {t("scanner_input_lens")}
                </CardTitle>
                <div className="flex rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-semibold">
                  <button onClick={() => setScanMode("camera")}
                    className={`px-3 py-1 rounded-full transition-all ${scanMode === "camera" ? "bg-[#6b8a4e] text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}>
                    {t("page_scanner_camera_tab")}
                  </button>
                  <button onClick={() => setScanMode("hardware")}
                    className={`px-3 py-1 rounded-full transition-all ${scanMode === "hardware" ? "bg-[#6b8a4e] text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}>
                    {t("page_scanner_laser_tab")}
                  </button>
                </div>
              </div>
              <CardDescription className="text-xs">
                {scanMode === "camera" ? t("page_scanner_camera_desc") : t("page_scanner_laser_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanMode === "camera" ? (
                <BarcodeCameraScanner
                  onScanSuccess={(text, fmt) => handleLookup(text, fmt)}
                  onFallback={() => setScanMode("hardware")}
                />
              ) : (
                <div className="p-8 rounded-2xl bg-[#1e2e14] text-center text-white space-y-3 border border-slate-800">
                  <Keyboard className="h-10 w-10 mx-auto text-[#6b8a4e] animate-pulse stroke-1" />
                  <h4 className="text-sm font-bold">{t("scanner_laser_title")}</h4>
                  <p className="text-xs text-slate-400">{t("scanner_laser_sub")}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  {t("page_scanner_manual")}:
                </label>
                <div className="flex gap-2">
                  <Input placeholder={t("scanner_enter_barcode")} value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleLookup(manualCode); }}
                    className="rounded-xl" />
                  <Button onClick={() => handleLookup(manualCode)}
                    className="bg-[#1e2e14] hover:bg-[#2d4020] text-white px-4 rounded-xl">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {searchFeedback && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-[11px]">
                    <span className="text-rose-500 font-bold shrink-0">Scanned:</span>
                    <span className="font-mono text-rose-700 dark:text-rose-300 break-all">{searchFeedback}</span>
                  </div>
                )}

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t("scanner_demo_picks")}:</span>
                    <span className="text-[10px] text-slate-400 font-mono">{products.length} products loaded</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {products.slice(0, 12).map((p) => (
                      <button key={p.id}
                        onClick={() => { setManualCode(p.barcode || p.sku); handleLookup(p.barcode || p.sku); }}
                        className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 hover:bg-[#6b8a4e]/15 hover:text-[#6b8a4e] border border-slate-200/80 dark:border-slate-700 transition-colors">
                        {p.barcode || p.sku} ({p.name.slice(0, 12)}{p.name.length > 12 ? "…" : ""})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {pageMode === "pos" && (
            <Card className="border-slate-200/80 rounded-[26px] overflow-hidden">
              <div className="bg-[#1e2e14] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-[#6b8a4e]" />
                  <div>
                    <div className="text-sm font-bold">Quick Sale Cart</div>
                    <div className="text-[11px] text-slate-400">{cart.length} item{cart.length !== 1 ? "s" : ""} · {activeWarehouse?.name}</div>
                  </div>
                </div>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </button>
                )}
              </div>
              <CardContent className="p-0">
                {cart.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 stroke-1 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-500">Cart is empty</p>
                    <p className="text-xs mt-1">Scan a barcode to add items</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-slate-100">
                      {cart.map((item, idx) => (
                        <div key={item.product.id} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="h-10 w-10 rounded-xl bg-[#6b8a4e]/10 flex items-center justify-center text-[#6b8a4e] font-black text-xs shrink-0">
                            {item.product.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 text-xs truncate">{item.product.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.product.sku}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => setCart(prev => prev.map((c, i) => i === idx ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c))}
                              className="h-6 w-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                            <button onClick={() => setCart(prev => prev.map((c, i) => i === idx ? { ...c, quantity: c.quantity + 1 } : c))}
                              className="h-6 w-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="text-right shrink-0 w-20">
                            <div className="text-xs font-bold text-slate-900">{formatCurrency(item.unitPrice * item.quantity)}</div>
                            <div className="text-[10px] text-slate-400">{formatCurrency(item.unitPrice)} each</div>
                          </div>
                          <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                            className="h-7 w-7 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-colors shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-500">Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                        <span className="text-lg font-black text-slate-900">{formatCurrency(cartTotal)}</span>
                      </div>
                      <button onClick={() => setCheckoutOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#6b8a4e] hover:bg-[#5a7840] text-white text-sm font-bold transition-all active:scale-[0.98] shadow">
                        <Receipt className="h-4 w-4" /> Checkout — {formatCurrency(cartTotal)}
                      </button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {checkoutDone && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-800">Order Created!</div>
                  <div className="text-xs text-emerald-600">Order number: <strong>{checkoutDone}</strong></div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {invoiceData && (
                  <button onClick={() => setInvoiceData(invoiceData)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e2e14] text-white text-xs font-bold rounded-xl hover:bg-[#2d4020] transition-colors">
                    <Printer className="h-3.5 w-3.5" /> វិក្កយបត្រ
                  </button>
                )}
                <button onClick={() => { setCheckoutDone(null); setInvoiceData(null); }} className="text-emerald-400 hover:text-emerald-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {pageMode === "lookup" && (scannedProduct ? (
            <Card className="border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-premium rounded-[26px]">
              <div className="bg-[#1e2e14] text-white p-6">
                <div className="flex items-start gap-4">
                  {scannedProduct.imageUrl ? (
                    <img src={scannedProduct.imageUrl} alt={scannedProduct.name}
                      className="h-20 w-20 rounded-2xl object-cover border-2 border-white/20 shrink-0" />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-2xl font-black text-white/50 shrink-0">
                      {scannedProduct.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 truncate">
                        {scannedProduct.sku}
                      </span>
                      <StatusBadge status={scannedProduct.status} />
                    </div>
                    <h3 className="text-xl font-bold mt-2 leading-tight">{scannedProduct.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center flex-wrap gap-x-1.5 gap-y-1">
                      {t("label_barcode")}: <strong className="text-white">{scannedProduct.barcode || "—"}</strong>
                      {scannedFormat && scannedFormat !== "unknown" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-teal-500/20 border border-teal-400/30 text-teal-300 text-[9px] font-bold uppercase tracking-wide">
                          {scannedFormat.replace(/_/g, " ")}
                        </span>
                      )}
                      &bull; {t("label_category")}: <strong className="text-white">{scannedProduct.categoryName || "—"}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    {(scannedProduct.discountPercent ?? 0) > 0 ? (
                      <>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-black bg-rose-500 text-white rounded px-1.5 py-0.5 uppercase">{scannedProduct.discountPercent}% OFF</span>
                            <span className="text-[10px] text-slate-400 line-through">{formatCurrency(scannedProduct.sellingPrice, "USD")}</span>
                          </div>
                          <span className="text-2xl font-extrabold text-rose-300 leading-none">
                            {formatCurrency(scannedProduct.sellingPrice * (1 - (scannedProduct.discountPercent ?? 0) / 100), "USD")}
                          </span>
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">តម្លៃ (KHR)</span>
                          <span className="text-lg font-bold text-amber-300 leading-none">
                            {formatCurrency(scannedProduct.sellingPrice * (1 - (scannedProduct.discountPercent ?? 0) / 100), "KHR")}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Sell Price</span>
                          <span className="text-2xl font-extrabold text-white leading-none">
                            {formatCurrency(scannedProduct.sellingPrice, "USD")}
                          </span>
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">តម្លៃ (KHR)</span>
                          <span className="text-lg font-bold text-amber-300 leading-none">
                            {formatCurrency(scannedProduct.sellingPrice, "KHR")}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  {scanTime && (
                    <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 shrink-0">
                      <Clock className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-emerald-300">
                        {scanTime.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="text-white/30 text-[11px]">·</span>
                      <span className="text-[13px] font-bold text-white tracking-wide font-mono">
                        {scanTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{t("scanner_in_wh")} {activeWarehouse?.code}</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{currentInv?.quantity || 0} {scannedProduct.uom}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{t("scanner_available")}</span>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{currentInv?.availableQuantity || 0} {scannedProduct.uom}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{t("scanner_total_hubs")}</span>
                    <div className="text-lg font-bold text-[#6b8a4e]">{scannedProduct.totalStock} {scannedProduct.uom}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t("scanner_stock_across")}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {scannedProduct.inventories?.map((inv: any) => (
                      <div key={inv.id} className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">{inv.warehouseName}</span>
                        <span className="font-bold text-[#6b8a4e]">{inv.quantity} {t("wh_units")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{t("scanner_immediate_actions")}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button onClick={() => setActionModal("stock_in")}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl">
                      <Plus className="h-4 w-4" /> {t("scanner_add_stock")}
                    </Button>
                    <Button onClick={() => setActionModal("stock_out")}
                      className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl">
                      <Minus className="h-4 w-4" /> {t("scanner_deduct_stock")}
                    </Button>
                    <Button onClick={() => {
                        const other = warehouses.find((w) => w.id !== currentWarehouseId);
                        if (other) setDestWarehouseId(other.id);
                        setActionModal("transfer");
                      }}
                      className="gap-2 bg-[#1e2e14] hover:bg-[#2d4020] text-white font-semibold text-xs rounded-xl">
                      <ArrowLeftRight className="h-4 w-4" /> {t("scanner_transfer_btn")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : quickCreate ? (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 rounded-[26px] overflow-hidden">
              <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-3">
                <PackagePlus className="h-5 w-5 shrink-0" />
                <div>
                  <div className="text-sm font-bold">New Barcode Detected</div>
                  <div className="text-[11px] font-mono opacity-80">{quickCreate.barcode}</div>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  This barcode is not registered. Enter a product name to add it instantly.
                </p>
                <form onSubmit={handleQuickCreate} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Product Name *</label>
                    <Input placeholder="e.g. Rice 25kg, Motor Oil 1L…" value={quickCreate.name}
                      onChange={(e) => setQuickCreate({ ...quickCreate, name: e.target.value })}
                      autoFocus className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Barcode</label>
                    <Input value={quickCreate.barcode}
                      onChange={(e) => setQuickCreate({ ...quickCreate, barcode: e.target.value })}
                      className="rounded-xl font-mono text-xs" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" disabled={!quickCreate.name.trim()}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2">
                      <PackagePlus className="h-4 w-4" /> Add Product
                    </Button>
                    <Button type="button" variant="outline"
                      onClick={() => { openAddModal(quickCreate.barcode); setQuickCreate(null); }}
                      className="rounded-xl text-xs">
                      Full Form
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setQuickCreate(null)} className="rounded-xl">Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 rounded-[26px]">
              <ScanBarcode className="h-16 w-16 mx-auto mb-3 text-slate-300 dark:text-slate-700 stroke-1" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">{t("scanner_awaiting")}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">{t("scanner_awaiting_sub")}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Stock In Modal */}
      <Modal isOpen={actionModal === "stock_in"} onClose={() => setActionModal(null)}
        title={`${t("scanner_add_title")}: ${scannedProduct?.name}`}
        description={`${t("scanner_receiving_into")} ${activeWarehouse?.name}`} size="md">
        <form onSubmit={handleQuickStockIn} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("scanner_qty_add")} *</label>
            <Input type="number" min="1" required value={actionQty} onChange={(e) => setActionQty(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("label_notes")}</label>
            <Input placeholder={t("scanner_scanned_note")} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>{t("btn_cancel")}</Button>
            <Button type="submit" disabled={actionSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {actionSaving ? "Saving…" : t("scanner_confirm_in")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Out Modal */}
      <Modal isOpen={actionModal === "stock_out"} onClose={() => setActionModal(null)}
        title={`${t("scanner_deduct_title")}: ${scannedProduct?.name}`}
        description={`${t("scanner_removing_from")} ${activeWarehouse?.name}`} size="md">
        <form onSubmit={handleQuickStockOut} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("scanner_qty_deduct")} *</label>
            <Input type="number" min="1" max={currentInv?.availableQuantity || 9999} required
              value={actionQty} onChange={(e) => setActionQty(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("label_notes")}</label>
            <Input placeholder={t("scanner_dispatch_note")} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>{t("btn_cancel")}</Button>
            <Button type="submit" disabled={actionSaving} className="bg-rose-600 hover:bg-rose-700 text-white">
              {actionSaving ? "Saving…" : t("scanner_confirm_out")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={actionModal === "transfer"} onClose={() => setActionModal(null)}
        title={`${t("scanner_transfer_title")}: ${scannedProduct?.name}`}
        description={`${t("scanner_originating_from")} ${activeWarehouse?.name}`} size="md">
        <form onSubmit={handleQuickTransfer} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("scanner_dest_wh")} *</label>
            <select value={destWarehouseId} onChange={(e) => setDestWarehouseId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
              {warehouses.filter((w) => w.id !== currentWarehouseId).map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("scanner_qty_dispatch")} *</label>
            <Input type="number" min="1" max={currentInv?.availableQuantity || 9999} required
              value={actionQty} onChange={(e) => setActionQty(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("label_notes")}</label>
            <Input placeholder={t("scanner_transfer_note")} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>{t("btn_cancel")}</Button>
            <Button type="submit" disabled={actionSaving} className="bg-[#1e2e14] hover:bg-[#2d4020] text-white">
              {actionSaving ? "Saving…" : t("scanner_dispatch_now")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add New Product Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)}
        title="Add New Product" description="Register a new product. Scan or type the barcode." size="lg">
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Barcode</label>
              <button type="button" onClick={() => setAddScanMode((v) => !v)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  addScanMode ? "bg-[#6b8a4e] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}>
                <Camera className="h-3 w-3" /> {addScanMode ? "Scanning…" : "Scan Barcode"}
              </button>
            </div>
            {addScanMode ? (
              <div className="rounded-xl overflow-hidden">
                <BarcodeCameraScanner
                  onScanSuccess={(code) => { setAddForm((f) => ({ ...f, barcode: code })); setAddScanMode(false); }}
                  onFallback={() => setAddScanMode(false)} />
              </div>
            ) : (
              <Input placeholder="Scan or type barcode…" value={addForm.barcode}
                onChange={(e) => setAddForm((f) => ({ ...f, barcode: e.target.value }))}
                className="font-mono text-xs" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Product Name *</label>
              <Input placeholder="e.g. Rice 25kg" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">SKU</label>
              <Input placeholder="Auto-generated" value={addForm.sku} onChange={(e) => setAddForm((f) => ({ ...f, sku: e.target.value }))} className="font-mono text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">UOM</label>
              <Input placeholder="PCS" value={addForm.uom} onChange={(e) => setAddForm((f) => ({ ...f, uom: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Cost Price</label>
              <Input type="number" step="0.01" min="0" value={addForm.costPrice} onChange={(e) => setAddForm((f) => ({ ...f, costPrice: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Selling Price</label>
              <Input type="number" step="0.01" min="0" value={addForm.sellingPrice} onChange={(e) => setAddForm((f) => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
              <select value={addForm.categoryId} onChange={(e) => setAddForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Supplier</label>
              <select value={addForm.supplierId} onChange={(e) => setAddForm((f) => ({ ...f, supplierId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
                <option value="">— None —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!addForm.name.trim()} className="bg-[#6b8a4e] hover:bg-[#5a7840] text-white gap-2">
              <PackagePlus className="h-4 w-4" /> Add Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Checkout Modal */}
      <Modal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Checkout" description="Confirm the sale and create a sales order." size="md">
        <form onSubmit={handleCheckout} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Customer <span className="text-slate-400 font-normal">(optional)</span></label>
            <select value={checkoutCustomerId} onChange={(e) => setCheckoutCustomerId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800">
              <option value="">— Walk-in customer —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center px-4 py-2.5 text-xs">
                <span className="font-semibold text-slate-800">{item.product.name} <span className="text-slate-400">× {item.quantity}</span></span>
                <span className="font-bold text-slate-900">{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 bg-white">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-lg font-black text-[#6b8a4e]">{formatCurrency(cartTotal)}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Notes</label>
            <Input placeholder="Optional notes…" value={checkoutNotes} onChange={(e) => setCheckoutNotes(e.target.value)} className="rounded-xl" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={checkoutLoading || cart.length === 0} className="bg-[#6b8a4e] hover:bg-[#5a7840] text-white gap-2">
              <Receipt className="h-4 w-4" />
              {checkoutLoading ? "Creating…" : `Confirm Sale · ${formatCurrency(cartTotal)}`}
            </Button>
          </div>
        </form>
      </Modal>

      {invoiceData && (
        <KhmerInvoice
          orderNumber={invoiceData.orderNumber}
          orderDate={invoiceData.orderDate}
          customerName={invoiceData.customerName}
          warehouseName={invoiceData.warehouseName}
          items={invoiceData.items}
          subtotal={invoiceData.subtotal}
          discount={invoiceData.discount}
          tax={invoiceData.tax}
          total={invoiceData.total}
          notes={invoiceData.notes}
          onClose={() => setInvoiceData(null)}
        />
      )}
    </div>
  );
}
