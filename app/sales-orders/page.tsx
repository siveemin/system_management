"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart, Plus, Search, Eye, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { exportToExcel } from "@/lib/export";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { SalesOrderDTO, ProductDTO, CustomerDTO, WarehouseDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SalesOrdersPage() {
  const { t } = useTranslation();
  const [salesOrders, setSalesOrders] = useState<SalesOrderDTO[]>(dataStore.getSalesOrders());
  const [products, setProducts] = useState<ProductDTO[]>(dataStore.getProducts());
  const [customers, setCustomers] = useState<CustomerDTO[]>(dataStore.getCustomers());
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>(dataStore.getWarehouses());
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState<{text: string, type: "success"|"error"}|null>(null);

  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [orderDiscountPct, setOrderDiscountPct] = useState(0);
  const [orderItems, setOrderItems] = useState<{productId: string, quantity: number, unitPrice: number}[]>([
    { productId: "", quantity: 1, unitPrice: 0 }
  ]);

  useEffect(() => {
    const update = () => {
      setSalesOrders(dataStore.getSalesOrders());
      setProducts(dataStore.getProducts());
      setCustomers(dataStore.getCustomers());
      setWarehouses(dataStore.getWarehouses());
    };
    return dataStore.subscribe(update);
  }, []);

  useEffect(() => {
    if (customers.length > 0 && !customerId) setCustomerId(customers[0].id);
    if (warehouses.length > 0 && !warehouseId) setWarehouseId(warehouses[0].id);
  }, [customers, warehouses, customerId, warehouseId]);

  const handleCreateSO = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = orderItems.filter((i) => i.productId && i.quantity > 0);
    if (!customerId || !warehouseId || validItems.length === 0) return;
    const subtotal = validItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discount = subtotal * (orderDiscountPct / 100);
    dataStore.createSalesOrder({ customerId, warehouseId, notes, discount, items: validItems });
    setIsCreateModalOpen(false);
    setNotes("");
    setOrderDiscountPct(0);
    setOrderItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleConfirm = (so: SalesOrderDTO) => {
    const res = dataStore.confirmSalesOrder(so.id);
    if (res.success) {
      setActionMsg({ text: `${so.orderNumber} ${t("status_confirmed").toLowerCase()}.`, type: "success" });
    } else {
      setActionMsg({ text: res.error || t("msg_failed"), type: "error" });
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleCancel = (so: SalesOrderDTO) => {
    const res = dataStore.cancelSalesOrder(so.id);
    if (res.success) {
      setActionMsg({ text: `${so.orderNumber} ${t("status_cancelled").toLowerCase()}.`, type: "success" });
    } else {
      setActionMsg({ text: res.error || t("msg_failed"), type: "error" });
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const filtered = salesOrders.filter((so) => {
    const q = searchTerm.toLowerCase();
    return so.orderNumber.toLowerCase().includes(q) || so.customerName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B] flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_so_title")}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage sales orders with stock validation, auto deduction, and cancellation reversal.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              salesOrders.map((o) => ({
                "Order #": o.orderNumber,
                Customer: o.customerName,
                Warehouse: o.warehouseName,
                "Order Date": new Date(o.orderDate).toLocaleDateString(),
                Status: o.status,
                Subtotal: o.subtotal,
                Discount: o.discount,
                Tax: o.tax,
                Total: o.totalAmount,
              })),
              "sales-orders-export",
              "Sales Orders"
            )}
            className="flex items-center gap-2 border border-[#6b8a4e] text-[#6b8a4e] hover:bg-[#6b8a4e]/10 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer select-none active:scale-[0.98]"
          >
            <Download className="h-4 w-4" /> Export Excel
          </button>
          <button onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#6b8a4e] hover:bg-[#E63B13] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer select-none active:scale-[0.98]">
            <Plus className="h-4 w-4" /> {t("page_so_add")}
          </button>
        </div>
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
        <input type="text" placeholder={t("search_so")}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-[#18181B] placeholder:text-slate-400 outline-none shadow-xs focus:ring-2 focus:ring-[#FF481F]"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="border border-slate-200/80 bg-white rounded-[28px] shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-semibold">
                <th className="py-4 px-6 font-medium">{t("col_so_number")}</th>
                <th className="py-4 px-6 font-medium">{t("label_customer")}</th>
                <th className="py-4 px-6 font-medium">{t("label_warehouse")}</th>
                <th className="py-4 px-6 font-medium">{t("col_order_date")}</th>
                <th className="py-4 px-6 font-medium">{t("label_status")}</th>
                <th className="py-4 px-6 font-medium text-right">{t("col_total_amount")}</th>
                <th className="py-4 px-6 font-medium text-right">{t("label_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">No sales orders found.</td></tr>
              ) : (
                filtered.map((so) => (
                  <tr key={so.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#18181B]">{so.orderNumber}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{so.customerName}</td>
                    <td className="py-4 px-6 text-slate-600">{so.warehouseName}</td>
                    <td className="py-4 px-6 text-slate-500">{formatDate(so.orderDate)}</td>
                    <td className="py-4 px-6"><StatusBadge status={so.status} /></td>
                    <td className="py-4 px-6 text-right font-extrabold text-[#18181B]">{formatCurrency(so.totalAmount)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {so.status === "DRAFT" && (
                          <button onClick={() => handleConfirm(so)}
                            className="px-3 py-1 bg-[#18181B] hover:bg-[#27272A] text-white text-[11px] font-bold rounded-xl cursor-pointer transition-colors">
                            {t("btn_confirm")}
                          </button>
                        )}
                        {(so.status === "CONFIRMED" || so.status === "PROCESSING") && (
                          <button onClick={() => handleCancel(so)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-xl cursor-pointer transition-colors">
                            {t("cancel_restore")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}
        title={t("so_modal_title")} description={t("so_modal_desc")} size="lg">
        <form onSubmit={handleCreateSO} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t("label_customer")} *</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-[#18181B] outline-none">
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            {orderItems.map((item, idx) => {
              const selProd = products.find((p) => p.id === item.productId);
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-6">
                    <select value={item.productId}
                      onChange={(e) => {
                        const u = [...orderItems]; u[idx].productId = e.target.value;
                        const p = products.find((p) => p.id === e.target.value);
                        if (p) {
                          const disc = p.discountPercent ?? 0;
                          u[idx].unitPrice = disc > 0 ? +(p.sellingPrice * (1 - disc / 100)).toFixed(2) : p.sellingPrice;
                        }
                        setOrderItems(u);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-[#18181B] outline-none">
                      <option value="">{t("select_product")}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{(p.discountPercent ?? 0) > 0 ? ` 🏷️ ${p.discountPercent}% OFF` : ""} (Avail: {p.totalAvailable})
                        </option>
                      ))}
                    </select>
                    {selProd && (selProd.discountPercent ?? 0) > 0 && (
                      <div className="text-[10px] text-rose-500 font-semibold mt-0.5">
                        {selProd.discountPercent}% off · was {formatCurrency(selProd.sellingPrice, "USD")}
                      </div>
                    )}
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder="Qty" min="1" value={item.quantity}
                      onChange={(e)=>{const u=[...orderItems];u[idx].quantity=Number(e.target.value);setOrderItems(u);}}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-center text-[#18181B] outline-none" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder="Price $" step="0.01" value={item.unitPrice}
                      onChange={(e)=>{const u=[...orderItems];u[idx].unitPrice=Number(e.target.value);setOrderItems(u);}}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-right text-[#18181B] outline-none" />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Order discount + running total */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700 shrink-0">{t("label_order_discount")} (0–100)</label>
              <input type="number" min="0" max="100" step="0.1" value={orderDiscountPct}
                onChange={(e) => setOrderDiscountPct(parseFloat(e.target.value) || 0)}
                className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-[#18181B] outline-none text-right" />
              <span className="text-xs text-slate-400">%</span>
            </div>
            {(() => {
              const sub = orderItems.filter(i => i.productId && i.quantity > 0).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
              const disc = sub * (orderDiscountPct / 100);
              const tax = (sub - disc) * 0.07;
              const total = sub - disc + tax;
              return sub > 0 ? (
                <div className="text-[11px] text-slate-500 space-y-0.5 text-right">
                  <div>Subtotal: <span className="font-semibold text-slate-800">{formatCurrency(sub, "USD")}</span></div>
                  {disc > 0 && <div className="text-rose-500">Discount ({orderDiscountPct}%): −{formatCurrency(disc, "USD")}</div>}
                  <div>Tax (7%): {formatCurrency(tax, "USD")}</div>
                  <div className="text-sm font-bold text-[#18181B]">Total: {formatCurrency(total, "USD")}</div>
                </div>
              ) : null;
            })()}
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>{t("btn_cancel")}</Button>
            <Button type="submit" className="bg-[#6b8a4e] hover:bg-[#E63B13] text-white">{t("page_so_add")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
