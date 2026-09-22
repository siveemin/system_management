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
} from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { ProductDTO, WarehouseDTO } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { BarcodeCameraScanner } from "@/components/scanner/BarcodeCameraScanner";
import { HardwareScanListener } from "@/components/scanner/HardwareScanListener";

export default function ScannerPage() {
  const { t } = useTranslation();
  const [manualCode, setManualCode] = useState("");
  const [scannedProduct, setScannedProduct] = useState<ProductDTO | null>(null);
  const [scanTime, setScanTime] = useState<Date | null>(null);
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

  useEffect(() => {
    const update = () => {
      setProducts(dataStore.getProducts());
      setWarehouses(dataStore.getWarehouses());
      setCurrentWarehouseId(dataStore.getCurrentWarehouseId());
      if (scannedProduct) {
        const refreshed = dataStore.getProductById(scannedProduct.id);
        if (refreshed) setScannedProduct(refreshed);
      }
    };
    return dataStore.subscribe(update);
  }, [scannedProduct]);

  const handleLookup = (code: string) => {
    if (!code) return;
    const prod = dataStore.getProductByBarcodeOrSKU(code);
    if (prod) {
      setScannedProduct(prod);
      setScanTime(new Date());
      setSearchFeedback(null);
      setActionMessage({ text: `Matched: ${prod.name}`, type: "success" });
    } else {
      setScannedProduct(null);
      setScanTime(null);
      setSearchFeedback(`No product registered with Barcode or SKU "${code}"`);
      setActionMessage({ text: `Unrecognized Barcode "${code}"`, type: "error" });
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

        {/* Operating Warehouse Indicator */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-full px-4 py-1.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold">{t("scanner_active_wh")}:</span>
          <span className="text-xs font-bold text-[#6b8a4e]">
            {activeWarehouse?.name}
          </span>
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
                  onScanSuccess={(text) => handleLookup(text)}
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

                {/* Sample Test Barcodes Buttons for Instant Demo */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                    {t("scanner_demo_picks")}:
                  </span>
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
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                    {scannedProduct.sku}
                  </span>
                  <StatusBadge status={scannedProduct.status} />
                </div>
                <h3 className="text-xl font-bold mt-2">{scannedProduct.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {t("label_barcode")}: <strong className="text-white">{scannedProduct.barcode || "—"}</strong> &bull; {t("label_category")}:{" "}
                  <strong className="text-white">{scannedProduct.categoryName || "—"}</strong>
                </p>
                {scanTime && (
                  <div className="flex items-center gap-1.5 mt-3 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 w-fit">
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
    </div>
  );
}
