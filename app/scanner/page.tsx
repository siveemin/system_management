"use client";

import React, { useState, useEffect } from "react";
import {
  ScanBarcode,
  Camera,
  Keyboard,
  Package,
  Boxes,
  Plus,
  Minus,
  ArrowLeftRight,
  ShoppingBag,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  Clock,
  PackagePlus,
} from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { ProductDTO, WarehouseDTO, CategoryDTO, SupplierDTO } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, generateSKU, generateBarcode } from "@/lib/utils";
import { BarcodeCameraScanner } from "@/components/scanner/BarcodeCameraScanner";
import { HardwareScanListener } from "@/components/scanner/HardwareScanListener";
const EMPTY_NEW = { name: "", barcode: "", sku: "", uom: "PCS", costPrice: 0, sellingPrice: 0, categoryId: "", supplierId: "" };

export default function ScannerPage() {
  const { t } = useTranslation();
  const [manualCode, setManualCode] = useState("");
  const [scannedProduct, setScannedProduct] = useState<ProductDTO | null>(null);
  const [scanTime, setScanTime] = useState<Date | null>(null);
  const [scannedFormat, setScannedFormat] = useState<string | null>(null);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<"camera" | "hardware">("camera");

  const [products, setProducts] = useState<ProductDTO[]>(() => dataStore.getProducts());
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>(() => dataStore.getWarehouses());
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string>(() => dataStore.getCurrentWarehouseId());

  // Quick Action Modal states
  const [actionModal, setActionModal] = useState<"stock_in" | "stock_out" | "transfer" | null>(null);
  const [actionQty, setActionQty] = useState(1);
  const [actionNotes, setActionNotes] = useState("");
  const [destWarehouseId, setDestWarehouseId] = useState("");
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Quick-create new product from unknown barcode
  const [quickCreate, setQuickCreate] = useState<{ barcode: string; name: string } | null>(null);

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCreate?.name.trim()) return;
    const cat = categories[0];
    const sup = suppliers[0];
    const newProduct = dataStore.createProduct({
      name: quickCreate.name.trim(),
      sku: generateSKU("SKU", cat?.name ?? ""),
      barcode: quickCreate.barcode,
      description: "",
      uom: "PCS",
      costPrice: 0,
      sellingPrice: 0,
      minStockLevel: 10,
      maxStockLevel: 500,
      categoryId: cat?.id ?? "",
      categoryName: cat?.name ?? null,
      supplierId: sup?.id ?? "",
      supplierName: sup?.name ?? null,
      status: "ACTIVE",
      imageUrl: null,
      qrCode: null,
    });
    setQuickCreate(null);
    setScannedProduct(newProduct);
    setScanTime(new Date());
    setActionMessage({ text: `Created & matched: ${newProduct.name}`, type: "success" });
  };

  // Full add-product modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ ...EMPTY_NEW });
  const [addScanMode, setAddScanMode] = useState(false);
  const [categories, setCategories] = useState<CategoryDTO[]>(() => dataStore.getCategories());
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>(() => dataStore.getSuppliers());

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

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    const cat = categories.find((c) => c.id === addForm.categoryId);
    const sup = suppliers.find((s) => s.id === addForm.supplierId);
    const newProduct = dataStore.createProduct({
      name: addForm.name.trim(),
      sku: addForm.sku || generateSKU("SKU", cat?.name ?? ""),
      barcode: addForm.barcode || generateBarcode(),
      description: "",
      uom: addForm.uom,
      costPrice: addForm.costPrice,
      sellingPrice: addForm.sellingPrice,
      minStockLevel: 10,
      maxStockLevel: 500,
      categoryId: addForm.categoryId,
      categoryName: cat?.name ?? null,
      supplierId: addForm.supplierId,
      supplierName: sup?.name ?? null,
      status: "ACTIVE",
      imageUrl: null,
      qrCode: null,
    });
    setAddOpen(false);
    setQuickCreate(null);
    setScannedProduct(newProduct);
    setScanTime(new Date());
    setActionMessage({ text: `Product "${newProduct.name}" added & matched`, type: "success" });
  };

  useEffect(() => {
    const update = () => {
      setProducts(dataStore.getProducts());
      setWarehouses(dataStore.getWarehouses());
      setCurrentWarehouseId(dataStore.getCurrentWarehouseId());
      setCategories(dataStore.getCategories());
      setSuppliers(dataStore.getSuppliers());
      if (scannedProduct) {
        const refreshed = dataStore.getProductById(scannedProduct.id);
        if (refreshed) setScannedProduct(refreshed);
      }
    };
    return dataStore.subscribe(update);
  }, [scannedProduct]);

  const handleLookup = (code: string, format?: string) => {
    if (!code) return;
    const rawDisplay = code.replace(/[\x00-\x1f\x7f]/g, "").trim();
    if (!rawDisplay) return;
    const prod = dataStore.getProductByBarcodeOrSKU(rawDisplay);
    const fmtLabel = format && format !== "unknown" ? ` · ${format.replace(/_/g, " ").toUpperCase()}` : "";
    if (prod) {
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

  const handleQuickStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedProduct || actionQty <= 0) return;

    const res = dataStore.adjustStock({
      productId: scannedProduct.id,
      warehouseId: currentWarehouseId,
      quantityChange: actionQty,
      type: "STOCK_IN",
      notes: actionNotes || t("scanner_note_in"),
    });

    if (res.success) {
      setActionMessage({ text: `+${actionQty} ${t("scanner_add_title").toLowerCase()}`, type: "success" });
      setActionModal(null);
      setActionQty(1);
      setActionNotes("");
    } else {
      setActionMessage({ text: res.error || t("msg_failed"), type: "error" });
    }
  };

  const handleQuickStockOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedProduct || actionQty <= 0) return;

    const res = dataStore.adjustStock({
      productId: scannedProduct.id,
      warehouseId: currentWarehouseId,
      quantityChange: -actionQty,
      type: "STOCK_OUT",
      notes: actionNotes || t("scanner_note_out"),
    });

    if (res.success) {
      setActionMessage({ text: `-${actionQty} ${t("scanner_deduct_title").toLowerCase()}`, type: "success" });
      setActionModal(null);
      setActionQty(1);
      setActionNotes("");
    } else {
      setActionMessage({ text: res.error || t("msg_failed"), type: "error" });
    }
  };

  const handleQuickTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedProduct || !destWarehouseId || actionQty <= 0) return;

    const trf = dataStore.createStockTransfer({
      sourceWarehouseId: currentWarehouseId,
      destinationWarehouseId: destWarehouseId,
      notes: actionNotes || t("scanner_note_transfer"),
      items: [{ productId: scannedProduct.id, requestedQuantity: actionQty }],
    });

    // Auto dispatch transfer if stock exists
    dataStore.approveStockTransfer(trf.id);
    const dispatchRes = dataStore.dispatchStockTransfer(trf.id);

    if (dispatchRes.success) {
      setActionMessage({
        text: `Transfer ${trf.transferNumber} dispatched (${actionQty} units in transit)`,
        type: "success",
      });
      setActionModal(null);
      setActionQty(1);
      setActionNotes("");
    } else {
      setActionMessage({ text: dispatchRes.error || t("msg_transfer_failed"), type: "error" });
    }
  };

  const activeWarehouse = warehouses.find((w) => w.id === currentWarehouseId) || warehouses[0];
  const currentInv = scannedProduct?.inventories?.find((i) => i.warehouseId === currentWarehouseId);

  return (
    <div className="space-y-5">
      {/* Hardware Scanner Background Listener */}
      <HardwareScanListener onScan={(code) => handleLookup(code)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ScanBarcode className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_scanner_title")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("page_scanner_sub")}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add New Product Button */}
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-2 bg-[#6b8a4e] hover:bg-[#5a7840] text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-sm transition-all active:scale-[0.98]"
          >
            <PackagePlus className="h-4 w-4" /> Add New Product
          </button>
          {/* Operating Warehouse Indicator */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-full px-4 py-1.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold">{t("scanner_active_wh")}:</span>
            <span className="text-xs font-bold text-[#6b8a4e]">
              {activeWarehouse?.name}
            </span>
          </div>
        </div>
      </div>

      {/* Action Notification Feedback */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Scanner & Manual Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Scanner Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800/80 rounded-[26px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[#6b8a4e]" />
                  {t("scanner_input_lens")}
                </CardTitle>
                <div className="flex rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-semibold">
                  <button
                    onClick={() => setScanMode("camera")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      scanMode === "camera"
                        ? "bg-[#6b8a4e] text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t("page_scanner_camera_tab")}
                  </button>
                  <button
                    onClick={() => setScanMode("hardware")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      scanMode === "hardware"
                        ? "bg-[#6b8a4e] text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t("page_scanner_laser_tab")}
                  </button>
                </div>
              </div>
              <CardDescription className="text-xs">
                {scanMode === "camera"
                  ? t("page_scanner_camera_desc")
                  : t("page_scanner_laser_desc")}
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
                  <p className="text-xs text-slate-400">
                    {t("scanner_laser_sub")}
                  </p>
                </div>
              )}

              {/* Manual Entry Fallback */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  {t("page_scanner_manual")}:
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("scanner_enter_barcode")}
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLookup(manualCode);
                    }}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={() => handleLookup(manualCode)}
                    className="bg-[#1e2e14] hover:bg-[#2d4020] text-white px-4 rounded-xl"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {/* Last scanned raw value debug strip */}
                {searchFeedback && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-[11px]">
                    <span className="text-rose-500 font-bold shrink-0">Scanned:</span>
                    <span className="font-mono text-rose-700 dark:text-rose-300 break-all">{searchFeedback}</span>
                  </div>
                )}

                {/* Sample Test Barcodes Buttons for Instant Demo */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {t("scanner_demo_picks")}:
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {products.length} products loaded
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setManualCode(p.barcode || p.sku);
                          handleLookup(p.barcode || p.sku);
                        }}
                        className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 hover:bg-[#6b8a4e]/15 hover:text-[#6b8a4e] border border-slate-200/80 dark:border-slate-700 transition-colors"
                      >
                        {p.barcode || p.sku} ({p.name.slice(0, 12)}...)
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Matched Product & Quick Action Center (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {scannedProduct ? (
            <Card className="border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-premium rounded-[26px]">
              <div className="bg-[#1e2e14] text-white p-6">
                <div className="flex items-start gap-4">
                  {/* Product image */}
                  {scannedProduct.imageUrl ? (
                    <img
                      src={scannedProduct.imageUrl}
                      alt={scannedProduct.name}
                      className="h-20 w-20 rounded-2xl object-cover border-2 border-white/20 shrink-0"
                    />
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
                      &bull; {t("label_category")}:{" "}
                      <strong className="text-white">{scannedProduct.categoryName || "—"}</strong>
                    </p>
                  </div>
                </div>

                {/* Price row */}
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
                {/* Quantities in Active Warehouse */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {t("scanner_in_wh")} {activeWarehouse?.code}
                    </span>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {currentInv?.quantity || 0} {scannedProduct.uom}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{t("scanner_available")}</span>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {currentInv?.availableQuantity || 0} {scannedProduct.uom}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{t("scanner_total_hubs")}</span>
                    <div className="text-lg font-bold text-[#6b8a4e]">
                      {scannedProduct.totalStock} {scannedProduct.uom}
                    </div>
                  </div>
                </div>

                {/* Stock across All Warehouses Breakdown */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {t("scanner_stock_across")}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {scannedProduct.inventories?.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 flex justify-between items-center text-xs"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                          {inv.warehouseName}
                        </span>
                        <span className="font-bold text-[#6b8a4e]">{inv.quantity} {t("wh_units")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Post-Scan Quick Actions Grid */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    {t("scanner_immediate_actions")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      onClick={() => setActionModal("stock_in")}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl"
                    >
                      <Plus className="h-4 w-4" /> {t("scanner_add_stock")}
                    </Button>

                    <Button
                      onClick={() => setActionModal("stock_out")}
                      className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl"
                    >
                      <Minus className="h-4 w-4" /> {t("scanner_deduct_stock")}
                    </Button>

                    <Button
                      onClick={() => {
                        const other = warehouses.find((w) => w.id !== currentWarehouseId);
                        if (other) setDestWarehouseId(other.id);
                        setActionModal("transfer");
                      }}
                      className="gap-2 bg-[#1e2e14] hover:bg-[#2d4020] text-white font-semibold text-xs rounded-xl"
                    >
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
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Product Name *
                    </label>
                    <Input
                      placeholder="e.g. Rice 25kg, Motor Oil 1L…"
                      value={quickCreate.name}
                      onChange={(e) => setQuickCreate({ ...quickCreate, name: e.target.value })}
                      autoFocus
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Barcode
                    </label>
                    <Input
                      value={quickCreate.barcode}
                      onChange={(e) => setQuickCreate({ ...quickCreate, barcode: e.target.value })}
                      className="rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit"
                      disabled={!quickCreate.name.trim()}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2">
                      <PackagePlus className="h-4 w-4" /> Add Product
                    </Button>
                    <Button type="button" variant="outline"
                      onClick={() => { openAddModal(quickCreate.barcode); setQuickCreate(null); }}
                      className="rounded-xl text-xs">
                      Full Form
                    </Button>
                    <Button type="button" variant="outline"
                      onClick={() => setQuickCreate(null)}
                      className="rounded-xl">
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 rounded-[26px]">
              <ScanBarcode className="h-16 w-16 mx-auto mb-3 text-slate-300 dark:text-slate-700 stroke-1" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {t("scanner_awaiting")}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {t("scanner_awaiting_sub")}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Stock In Modal */}
      <Modal
        isOpen={actionModal === "stock_in"}
        onClose={() => setActionModal(null)}
        title={`${t("scanner_add_title")}: ${scannedProduct?.name}`}
        description={`${t("scanner_receiving_into")} ${activeWarehouse?.name}`}
        size="md"
      >
        <form onSubmit={handleQuickStockIn} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t("scanner_qty_add")} *
            </label>
            <Input
              type="number"
              min="1"
              required
              value={actionQty}
              onChange={(e) => setActionQty(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t("label_notes")}
            </label>
            <Input
              placeholder={t("scanner_scanned_note")}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>
              {t("btn_cancel")}
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {t("scanner_confirm_in")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Out Modal */}
      <Modal
        isOpen={actionModal === "stock_out"}
        onClose={() => setActionModal(null)}
        title={`${t("scanner_deduct_title")}: ${scannedProduct?.name}`}
        description={`${t("scanner_removing_from")} ${activeWarehouse?.name}`}
        size="md"
      >
        <form onSubmit={handleQuickStockOut} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t("scanner_qty_deduct")} *
            </label>
            <Input
              type="number"
              min="1"
              max={currentInv?.availableQuantity || 9999}
              required
              value={actionQty}
              onChange={(e) => setActionQty(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t("label_notes")}
            </label>
            <Input
              placeholder={t("scanner_dispatch_note")}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>
              {t("btn_cancel")}
            </Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
              {t("scanner_confirm_out")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={actionModal === "transfer"}
        onClose={() => setActionModal(null)}
        title={`${t("scanner_transfer_title")}: ${scannedProduct?.name}`}
        description={`${t("scanner_originating_from")} ${activeWarehouse?.name}`}
        size="md"
      >
        <form onSubmit={handleQuickTransfer} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t("scanner_dest_wh")} *
            </label>
            <select
              value={destWarehouseId}
              onChange={(e) => setDestWarehouseId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
            >
              {warehouses
                .filter((w) => w.id !== currentWarehouseId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t("scanner_qty_dispatch")} *
            </label>
            <Input
              type="number"
              min="1"
              max={currentInv?.availableQuantity || 9999}
              required
              value={actionQty}
              onChange={(e) => setActionQty(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t("label_notes")}
            </label>
            <Input
              placeholder={t("scanner_transfer_note")}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>
              {t("btn_cancel")}
            </Button>
            <Button type="submit" className="bg-[#1e2e14] hover:bg-[#2d4020] text-white">
              {t("scanner_dispatch_now")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add New Product Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)}
        title="Add New Product" description="Register a new product. Scan or type the barcode." size="lg">
        <form onSubmit={handleAddProduct} className="space-y-4">

          {/* Barcode field with inline scan toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Barcode</label>
              <button type="button"
                onClick={() => setAddScanMode((v) => !v)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  addScanMode ? "bg-[#6b8a4e] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}>
                <Camera className="h-3 w-3" /> {addScanMode ? "Scanning…" : "Scan Barcode"}
              </button>
            </div>
            {addScanMode ? (
              <div className="rounded-xl overflow-hidden">
                <BarcodeCameraScanner
                  onScanSuccess={(code) => {
                    setAddForm((f) => ({ ...f, barcode: code }));
                    setAddScanMode(false);
                  }}
                  onFallback={() => setAddScanMode(false)}
                />
              </div>
            ) : (
              <Input
                placeholder="Scan or type barcode…"
                value={addForm.barcode}
                onChange={(e) => setAddForm((f) => ({ ...f, barcode: e.target.value }))}
                className="font-mono text-xs"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Product Name *</label>
              <Input placeholder="e.g. Rice 25kg" value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">SKU</label>
              <Input placeholder="Auto-generated" value={addForm.sku}
                onChange={(e) => setAddForm((f) => ({ ...f, sku: e.target.value }))} className="font-mono text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">UOM</label>
              <Input placeholder="PCS" value={addForm.uom}
                onChange={(e) => setAddForm((f) => ({ ...f, uom: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Cost Price</label>
              <Input type="number" step="0.01" min="0" value={addForm.costPrice}
                onChange={(e) => setAddForm((f) => ({ ...f, costPrice: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Selling Price</label>
              <Input type="number" step="0.01" min="0" value={addForm.sellingPrice}
                onChange={(e) => setAddForm((f) => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
              <select value={addForm.categoryId}
                onChange={(e) => setAddForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Supplier</label>
              <select value={addForm.supplierId}
                onChange={(e) => setAddForm((f) => ({ ...f, supplierId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
                <option value="">— None —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!addForm.name.trim()}
              className="bg-[#6b8a4e] hover:bg-[#5a7840] text-white gap-2">
              <PackagePlus className="h-4 w-4" /> Add Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
