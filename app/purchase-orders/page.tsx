"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, Plus, Search, Eye, CheckCircle2, AlertCircle, Package } from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { PurchaseOrderDTO, ProductDTO, SupplierDTO, WarehouseDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDTO[]>(dataStore.getPurchaseOrders());
  const [products, setProducts] = useState<ProductDTO[]>(dataStore.getProducts());
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>(dataStore.getSuppliers());
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>(dataStore.getWarehouses());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderDTO | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivePO, setReceivePO] = useState<PurchaseOrderDTO | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
  const [receiveMsg, setReceiveMsg] = useState<{text: string, type: "success"|"error"}|null>(null);

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<{productId: string, quantity: number, unitPrice: number}[]>([
    { productId: "", quantity: 1, unitPrice: 0 }
  ]);

  useEffect(() => {
    const update = () => {
      setPurchaseOrders(dataStore.getPurchaseOrders());
      setProducts(dataStore.getProducts());
      setSuppliers(dataStore.getSuppliers());
      setWarehouses(dataStore.getWarehouses());
    };
    return dataStore.subscribe(update);
  }, []);

  useEffect(() => {
    if (suppliers.length > 0 && !supplierId) setSupplierId(suppliers[0].id);
    if (warehouses.length > 0 && !warehouseId) setWarehouseId(warehouses[0].id);
  }, [suppliers, warehouses, supplierId, warehouseId]);

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = orderItems.filter((i) => i.productId && i.quantity > 0 && i.unitPrice >= 0);
    if (!supplierId || !warehouseId || validItems.length === 0) return;
    dataStore.createPurchaseOrder({ supplierId, warehouseId, orderDate, notes, items: validItems });
    setIsCreateModalOpen(false);
    setNotes("");
    setOrderItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivePO) return;
    const items = Object.entries(receiveQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ purchaseOrderItemId: itemId, receivedQuantity: qty }));
    if (items.length === 0) { setReceiveMsg({ text: t("msg_enter_qty"), type: "error" }); return; }
    const res = dataStore.receivePurchaseOrderItems(receivePO.id, items);
    if (res.success) {
      setReceiveMsg({ text: t("msg_stock_received"), type: "success" });
      setTimeout(() => { setIsReceiveModalOpen(false); setReceiveMsg(null); setReceiveQuantities({}); }, 1500);
    } else {
      setReceiveMsg({ text: res.error || t("msg_failed"), type: "error" });
    }
  };

  const filtered = purchaseOrders.filter((po) => {
    const q = searchTerm.toLowerCase();
    return po.orderNumber.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q);
  });

  const statusColor: Record<string, string> = {
    DRAFT: "text-slate-500", SUBMITTED: "text-slate-700", APPROVED: "text-amber-700",
    PARTIALLY_RECEIVED: "text-amber-700", RECEIVED: "text-emerald-700", CANCELLED: "text-rose-600",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B] flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_po_title")}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{t("po_page_sub")}</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-[#6b8a4e] hover:bg-[#E63B13] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer select-none active:scale-[0.98]">
          <Plus className="h-4 w-4" /> {t("page_po_add")}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input type="text" placeholder={t("search_po")}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-[#18181B] placeholder:text-slate-400 outline-none shadow-xs focus:ring-2 focus:ring-[#FF481F]"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="border border-slate-200/80 bg-white rounded-[28px] shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-semibold">
                <th className="py-4 px-6 font-medium">{t("col_po_number")}</th>
                <th className="py-4 px-6 font-medium">{t("col_supplier")}</th>
                <th className="py-4 px-6 font-medium">{t("col_dest_warehouse")}</th>
                <th className="py-4 px-6 font-medium">{t("col_order_date")}</th>
                <th className="py-4 px-6 font-medium">{t("label_status")}</th>
                <th className="py-4 px-6 font-medium text-right">{t("col_total_amount")}</th>
                <th className="py-4 px-6 font-medium text-right">{t("label_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">No purchase orders found.</td></tr>
              ) : (
                filtered.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#18181B]">{po.orderNumber}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{po.supplierName}</td>
                    <td className="py-4 px-6 text-slate-600">{po.warehouseName}</td>
                    <td className="py-4 px-6 text-slate-500">{formatDate(po.orderDate)}</td>
                    <td className="py-4 px-6"><StatusBadge status={po.status} /></td>
                    <td className="py-4 px-6 text-right font-extrabold text-[#18181B]">{formatCurrency(po.totalAmount)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(po.status === "APPROVED" || po.status === "PARTIALLY_RECEIVED") && (
                          <button onClick={() => { setReceivePO(po); setReceiveQuantities({}); setIsReceiveModalOpen(true); }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl cursor-pointer transition-colors">
                            Receive Stock
                          </button>
                        )}
                        {po.status === "DRAFT" && (
                          <button onClick={() => dataStore.submitPurchaseOrder(po.id)}
                            className="px-3 py-1 bg-[#18181B] hover:bg-[#27272A] text-white text-[11px] font-bold rounded-xl cursor-pointer transition-colors">
                            Submit
                          </button>
                        )}
                        {po.status === "SUBMITTED" && (
                          <button onClick={() => dataStore.approvePurchaseOrder(po.id)}
                            className="px-3 py-1 bg-[#18181B] hover:bg-[#27272A] text-white text-[11px] font-bold rounded-xl cursor-pointer transition-colors">
                            Approve
                          </button>
                        )}
                        <button onClick={() => setSelectedPO(po)}
                          className="p-1.5 text-slate-400 hover:text-[#6b8a4e] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}
        title={t("po_modal_title")} description={t("po_modal_desc")} size="lg">
        <form onSubmit={handleCreatePO} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t("label_supplier")} *</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-[#18181B] outline-none">
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t("label_warehouse")} *</label>
              <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-[#18181B] outline-none">
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">{t("col_order_date")}</label>
            <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </div>
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#18181B]">{t("label_orders")}</span>
              <button type="button"
                onClick={() => setOrderItems([...orderItems, { productId: "", quantity: 1, unitPrice: 0 }])}
                className="text-[11px] font-bold text-[#6b8a4e] hover:underline cursor-pointer">
                + {t("btn_add")}
              </button>
            </div>
            {orderItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                <div className="col-span-6">
                  <select value={item.productId}
                    onChange={(e) => { const updated = [...orderItems]; updated[idx].productId = e.target.value;
                      const p = products.find((p) => p.id === e.target.value);
                      if (p) updated[idx].unitPrice = p.costPrice;
                      setOrderItems(updated); }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-[#18181B] outline-none">
                    <option value="">{t("select_product")}</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <input type="number" placeholder="Qty" min="1" value={item.quantity}
                    onChange={(e) => { const u=[...orderItems]; u[idx].quantity=Number(e.target.value); setOrderItems(u); }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-[#18181B] text-center outline-none" />
                </div>
                <div className="col-span-3">
                  <input type="number" placeholder="Unit $" step="0.01" value={item.unitPrice}
                    onChange={(e) => { const u=[...orderItems]; u[idx].unitPrice=Number(e.target.value); setOrderItems(u); }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-[#18181B] text-right outline-none" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">{t("label_notes")}</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-white p-3 text-xs text-[#18181B] outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>{t("btn_cancel")}</Button>
            <Button type="submit" className="bg-[#6b8a4e] hover:bg-[#E63B13] text-white">{t("page_po_add")}</Button>
          </div>
        </form>
      </Modal>

      {/* Receive Stock Modal */}
      {receivePO && (
        <Modal isOpen={isReceiveModalOpen} onClose={() => { setIsReceiveModalOpen(false); setReceiveMsg(null); setReceiveQuantities({}); }}
          title={`Receive Stock: ${receivePO.orderNumber}`}
          description={`Receiving from ${receivePO.supplierName} into ${receivePO.warehouseName}`} size="md">
          <form onSubmit={handleReceive} className="space-y-4">
            {receiveMsg && (
              <div className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                receiveMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
              }`}>
                {receiveMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {receiveMsg.text}
              </div>
            )}
            {receivePO.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-xs text-[#18181B]">{item.productName}</div>
                  <div className="text-[10px] text-slate-500">Ordered: {item.quantity} | Received: {item.receivedQuantity}</div>
                </div>
                <input type="number" min="0" max={item.quantity - item.receivedQuantity}
                  placeholder="0"
                  value={receiveQuantities[item.id] || ""}
                  onChange={(e) => setReceiveQuantities({ ...receiveQuantities, [item.id]: Number(e.target.value) })}
                  className="w-20 h-8 rounded-xl border border-slate-300 bg-white text-right px-2 text-xs font-bold text-[#6b8a4e] outline-none" />
              </div>
            ))}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => { setIsReceiveModalOpen(false); setReceiveMsg(null); }}>{t("btn_cancel")}</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">{t("btn_confirm")}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
