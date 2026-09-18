"use client";

import React, { useState, useEffect } from "react";
import { ArrowRightLeft, Plus, Search, CheckCircle2, AlertCircle } from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { StockTransferDTO, ProductDTO, WarehouseDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function StockTransfersPage() {
  const { t } = useTranslation();
  const [transfers, setTransfers] = useState<StockTransferDTO[]>(dataStore.getStockTransfers());
  const [products, setProducts] = useState<ProductDTO[]>(dataStore.getProducts());
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>(dataStore.getWarehouses());
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState<{text: string, type: "success"|"error"}|null>(null);

  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const update = () => {
      setTransfers(dataStore.getStockTransfers());
      setProducts(dataStore.getProducts());
      setWarehouses(dataStore.getWarehouses());
    };
    return dataStore.subscribe(update);
  }, []);

  useEffect(() => {
    if (warehouses.length >= 2) {
      setFromWarehouseId(warehouses[0].id);
      setToWarehouseId(warehouses[1].id);
    }
    if (products.length > 0) setProductId(products[0].id);
  }, [warehouses, products]);

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromWarehouseId || !toWarehouseId || !productId || quantity <= 0) {
      setActionMsg({ text: t("msg_all_fields"), type: "error" });
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      setActionMsg({ text: t("msg_diff_warehouses"), type: "error" });
      return;
    }
    const res = dataStore.createStockTransfer({ fromWarehouseId, toWarehouseId, productId, quantity, notes });
    if (res.success) {
      setIsCreateModalOpen(false);
      setNotes("");
      setQuantity(1);
      setActionMsg({ text: t("msg_transfer_done"), type: "success" });
      setTimeout(() => setActionMsg(null), 3000);
    } else {
      setActionMsg({ text: res.error || t("msg_failed"), type: "error" });
    }
  };

  const filtered = transfers.filter((t) => {
    const q = searchTerm.toLowerCase();
    return t.transferNumber.toLowerCase().includes(q) || t.productName.toLowerCase().includes(q) ||
      t.fromWarehouseName.toLowerCase().includes(q) || t.toWarehouseName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B] flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_st_title")}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Move inventory between warehouses with atomic paired IN/OUT transactions.</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-[#6b8a4e] hover:bg-[#E63B13] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer select-none active:scale-[0.98]">
          <Plus className="h-4 w-4" /> {t("page_st_add")}
        </button>
      </div>

      {actionMsg && (
        <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
          actionMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
        }`}>
          {actionMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {actionMsg.text}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input type="text" placeholder={t("search_st")}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-[#18181B] placeholder:text-slate-400 outline-none shadow-xs focus:ring-2 focus:ring-[#FF481F]"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="border border-slate-200/80 bg-white rounded-[28px] shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-semibold">
                <th className="py-4 px-6 font-medium">{t("col_transfer_num")}</th>
                <th className="py-4 px-6 font-medium">{t("col_product_sku")}</th>
                <th className="py-4 px-6 font-medium">{t("col_from_warehouse")}</th>
                <th className="py-4 px-6 font-medium">{t("col_to_warehouse")}</th>
                <th className="py-4 px-6 font-medium">{t("label_quantity")}</th>
                <th className="py-4 px-6 font-medium">{t("label_status")}</th>
                <th className="py-4 px-6 font-medium">{t("label_notes")}</th>
                <th className="py-4 px-6 font-medium text-right">{t("label_date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">{t("no_st_records")}</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#18181B]">{t.transferNumber}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#18181B]">{t.productName}</div>
                      <div className="font-mono text-[10px] font-bold text-[#6b8a4e]">{t.productSku}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                        {t.fromWarehouseName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                        {t.toWarehouseName}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-[#18181B]">{t.quantity} units</td>
                    <td className="py-4 px-6"><StatusBadge status={t.status} /></td>
                    <td className="py-4 px-6 text-slate-500 max-w-[160px] line-clamp-1">{t.notes || "-"}</td>
                    <td className="py-4 px-6 text-slate-400 text-[10px] whitespace-nowrap text-right">{formatDateTime(t.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}
        title={t("st_modal_title")} description={t("st_modal_desc")} size="md">
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          {actionMsg && actionMsg.type === "error" && (
            <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {actionMsg.text}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Product to Transfer *</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-[#18181B] outline-none">
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Available: {p.totalAvailable}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">From Warehouse *</label>
              <select value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-[#18181B] outline-none">
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">To Warehouse *</label>
              <select value={toWarehouseId} onChange={(e) => setToWarehouseId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-[#18181B] outline-none">
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity to Transfer *</label>
            <Input type="number" min="1" required value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">{t("page_inventory_reason")}</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Seasonal rebalancing, demand shift to western region"
              className="w-full rounded-2xl border border-slate-200/80 bg-white p-3 text-xs text-[#18181B] outline-none focus:ring-2 focus:ring-[#FF481F]" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>{t("btn_cancel")}</Button>
            <Button type="submit" className="bg-[#6b8a4e] hover:bg-[#E63B13] text-white">{t("page_st_add")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
