"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes, Search, SlidersHorizontal, ArrowUp, ArrowDown, RefreshCw, CheckCircle2, AlertCircle,
} from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { InventoryTransactionDTO, ProductDTO, WarehouseDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import { TranslationKey } from "@/lib/i18n";

export default function InventoryPage() {
  const { t } = useTranslation();

  const TYPE_LABELS: Record<string, { labelKey: TranslationKey; color: string }> = {
    STOCK_IN:            { labelKey: "inv_type_stock_in",         color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
    STOCK_OUT:           { labelKey: "inv_type_stock_out",        color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
    PURCHASE_RECEIVE:    { labelKey: "inv_type_purchase_receive", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    SALE:                { labelKey: "inv_type_sale",             color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
    TRANSFER_OUT:        { labelKey: "inv_type_transfer_out",     color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
    TRANSFER_IN:         { labelKey: "inv_type_transfer_in",      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
    ADJUSTMENT_INCREASE: { labelKey: "inv_type_adj_increase",     color: "bg-teal-100 text-[#5a7840] dark:bg-[#1a2a10] dark:text-teal-300" },
    ADJUSTMENT_DECREASE: { labelKey: "inv_type_adj_decrease",     color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
    RETURN:              { labelKey: "inv_type_return",           color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  };
  const [transactions, setTransactions] = useState<InventoryTransactionDTO[]>(dataStore.getTransactions());
  const [products, setProducts] = useState<ProductDTO[]>(dataStore.getProducts());
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>(dataStore.getWarehouses());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustWarehouseId, setAdjustWarehouseId] = useState("");
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState<"ADJUSTMENT_INCREASE" | "ADJUSTMENT_DECREASE">("ADJUSTMENT_INCREASE");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const update = () => {
      setTransactions(dataStore.getTransactions());
      setProducts(dataStore.getProducts());
      setWarehouses(dataStore.getWarehouses());
    };
    return dataStore.subscribe(update);
  }, []);

  useEffect(() => {
    if (products.length && !adjustProductId) setAdjustProductId(products[0].id);
    if (warehouses.length && !adjustWarehouseId) setAdjustWarehouseId(warehouses[0].id);
  }, [products, warehouses, adjustProductId, adjustWarehouseId]);

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.productName.toLowerCase().includes(search.toLowerCase()) ||
      t.productSku.toLowerCase().includes(search.toLowerCase()) ||
      t.transactionNumber.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const matchWh = warehouseFilter === "all" || t.warehouseId === warehouseFilter;
    return matchSearch && matchType && matchWh;
  });

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId || !adjustWarehouseId || adjustQty <= 0) return;
    const change = adjustType === "ADJUSTMENT_INCREASE" ? adjustQty : -adjustQty;
    const result = dataStore.adjustStock({
      productId: adjustProductId,
      warehouseId: adjustWarehouseId,
      quantityChange: change,
      type: adjustType,
      referenceType: "MANUAL_ADJUSTMENT",
      notes: adjustNotes,
    });
    if (result.success) {
      setIsAdjustOpen(false);
      setAdjustQty(0);
      setAdjustNotes("");
      showMsg(t("page_inventory_done"), "success");
    } else {
      showMsg(result.error ?? t("inv_adjust_failed"), "error");
    }
  };

  const showMsg = (text: string, type: "success" | "error") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Boxes className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_inventory_title")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {transactions.length} {t("page_inventory_sub")}
          </p>
        </div>
        <Button onClick={() => setIsAdjustOpen(true)} className="gap-2 bg-[#6b8a4e] hover:bg-[#5a7840] text-white font-semibold">
          <SlidersHorizontal className="h-4 w-4" /> {t("page_inventory_adjust_btn")}
        </Button>
      </div>

      {actionMsg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          actionMsg.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
            : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
        }`}>
          {actionMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {actionMsg.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("page_inventory_search")} className="pl-8" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
          <option value="all">{t("page_inventory_all_types")}</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{t(v.labelKey)}</option>)}
        </select>
        <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
          <option value="all">{t("page_inventory_all_wh")}</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_inventory_col_txn")}</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_inventory_col_product")}</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_inventory_col_warehouse")}</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_inventory_col_type")}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_inventory_col_before")}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_inventory_col_change")}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_inventory_col_after")}</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_inventory_col_date")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">{t("page_inventory_none")}</td>
                </tr>
              )}
              {filtered.map((txn) => {
                const meta = TYPE_LABELS[txn.type];
                const isPositive = txn.quantityChange > 0;
                return (
                  <tr key={txn.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{txn.transactionNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{txn.productName}</div>
                      <div className="text-slate-400 text-[10px]">{txn.productSku}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{txn.warehouseName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta?.color ?? "bg-slate-100 text-slate-600"}`}>
                        {meta ? t(meta.labelKey) : txn.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">{txn.quantityBefore}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold flex items-center justify-end gap-0.5 ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                        {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {Math.abs(txn.quantityChange)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{txn.quantityAfter}</td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{formatDateTime(txn.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      <Modal isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} title={t("page_inventory_adjust_title")}
        description={t("page_inventory_adjust_sub")} size="md">
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("page_inventory_col_product")}</label>
            <select value={adjustProductId} onChange={(e) => setAdjustProductId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("label_warehouse")}</label>
            <select value={adjustWarehouseId} onChange={(e) => setAdjustWarehouseId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("page_inventory_adjust_type")}</label>
              <select value={adjustType} onChange={(e) => setAdjustType(e.target.value as typeof adjustType)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
                <option value="ADJUSTMENT_INCREASE">{t("page_inventory_increase")}</option>
                <option value="ADJUSTMENT_DECREASE">{t("page_inventory_decrease")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("label_quantity")}</label>
              <Input type="number" min={1} value={adjustQty} onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("page_inventory_reason")}</label>
            <textarea value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" onClick={() => setIsAdjustOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold">
              {t("btn_cancel")}
            </Button>
            <Button type="submit" className="gap-1.5 bg-[#6b8a4e] hover:bg-[#5a7840] text-white text-xs font-semibold">
              <RefreshCw className="h-3.5 w-3.5" /> {t("page_inventory_apply")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
