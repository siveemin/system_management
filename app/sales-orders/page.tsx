"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Plus, Search, CheckCircle2, AlertCircle, Download, Printer, Pencil, Loader2 } from "lucide-react";
import { KhmerInvoice } from "@/components/invoice/KhmerInvoice";
import { exportToExcel } from "@/lib/export";
import { useTranslation } from "@/lib/useTranslation";
import { SalesOrderDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Customer { id: string; name: string; }
interface Warehouse { id: string; name: string; }
interface Product { id: string; name: string; sku: string; sellingPrice: number; discountPercent?: number; totalAvailable?: number; }

function genOrderNumber() { return "SO-" + Date.now().toString().slice(-6); }

export default function SalesOrdersPage() {
  const { t } = useTranslation();
  const [salesOrders, setSalesOrders] = useState<SalesOrderDTO[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<SalesOrderDTO | null>(null);
  const [editOrder, setEditOrder] = useState<SalesOrderDTO | null>(null);
  const [editDiscountPct, setEditDiscountPct] = useState(0);
  const [editTaxPct, setEditTaxPct] = useState(0);

  // Create form state
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [orderDiscountPct, setOrderDiscountPct] = useState(0);
  const [orderTaxPct, setOrderTaxPct] = useState(0);
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([
    { productId: "", quantity: 1, unitPrice: 0 },
  ]);
  const [creating, setCreating] = useState(false);

  const showMsg = (text: string, type: "success" | "error") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/sales-orders");
      if (res.ok) setSalesOrders(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetch("/api/customers").then(r => r.ok ? r.json() : []).then((d: Customer[]) => {
      if (Array.isArray(d)) { setCustomers(d); if (d[0]) setCustomerId(d[0].id); }
    });
    fetch("/api/warehouses").then(r => r.ok ? r.json() : []).then((d: Warehouse[]) => {
      if (Array.isArray(d)) { setWarehouses(d); if (d[0]) setWarehouseId(d[0].id); }
    });
    fetch("/api/products").then(r => r.ok ? r.json() : []).then((d: Product[]) => {
      if (Array.isArray(d)) setProducts(d);
    });
  }, [fetchOrders]);

  // Create order
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = orderItems.filter(i => i.productId && i.quantity > 0);
    if (!customerId) { showMsg("Please select a customer", "error"); return; }
    if (!warehouseId) { showMsg("Please select a warehouse", "error"); return; }
    if (validItems.length === 0) { showMsg("Please add at least one product", "error"); return; }
    setCreating(true);
    try {
      const subtotal = validItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const discount = subtotal * (orderDiscountPct / 100);
      const tax = (subtotal - discount) * (orderTaxPct / 100);
      const totalAmount = subtotal - discount + tax;

      const res = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: genOrderNumber(),
          customerId,
          warehouseId,
          orderDate,
          status: "DRAFT",
          subtotal,
          discount,
          tax,
          totalAmount,
          notes: notes || null,
          items: validItems.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, totalAmount: i.quantity * i.unitPrice })),
        }),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setNotes(""); setOrderDiscountPct(0); setOrderTaxPct(0);
        setOrderItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
        await fetchOrders();
        showMsg("Order created successfully!", "success");
      } else {
        const d = await res.json();
        showMsg(d.error || "Failed to create order", "error");
      }
    } finally {
      setCreating(false);
    }
  };

  // Confirm order
  const handleConfirm = async (so: SalesOrderDTO) => {
    const res = await fetch(`/api/sales-orders/${so.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });
    if (res.ok) { await fetchOrders(); showMsg(`${so.orderNumber} confirmed.`, "success"); }
    else { const d = await res.json(); showMsg(d.error || "Failed to confirm", "error"); }
  };

  // Cancel order
  const handleCancel = async (so: SalesOrderDTO) => {
    const res = await fetch(`/api/sales-orders/${so.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) { await fetchOrders(); showMsg(`${so.orderNumber} cancelled.`, "success"); }
    else { const d = await res.json(); showMsg(d.error || "Failed to cancel", "error"); }
  };

  // Open edit discount/tax
  const openEdit = (so: SalesOrderDTO) => {
    setEditOrder(so);
    const discPct = so.subtotal > 0 ? (so.discount / so.subtotal) * 100 : 0;
    const afterDisc = so.subtotal - so.discount;
    const taxPct = afterDisc > 0 ? (so.tax / afterDisc) * 100 : 0;
    setEditDiscountPct(parseFloat(discPct.toFixed(2)));
    setEditTaxPct(parseFloat(taxPct.toFixed(2)));
  };

  // Save discount/tax edit
  const handleSaveEdit = async () => {
    if (!editOrder) return;
    const disc = editOrder.subtotal * (editDiscountPct / 100);
    const tax = (editOrder.subtotal - disc) * (editTaxPct / 100);
    const totalAmount = editOrder.subtotal - disc + tax;

    const res = await fetch(`/api/sales-orders/${editOrder.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discount: disc, tax, totalAmount }),
    });
    if (res.ok) {
      setEditOrder(null);
      await fetchOrders();
      showMsg(`${editOrder.orderNumber} updated.`, "success");
    } else {
      const d = await res.json();
      showMsg(d.error || "Failed to update", "error");
    }
  };

  const filtered = salesOrders.filter(so => {
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
          <p className="text-xs text-slate-500 mt-0.5">{salesOrders.length} orders total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              salesOrders.map(o => ({
                "Order #": o.orderNumber, Customer: o.customerName, Warehouse: o.warehouseName,
                "Order Date": new Date(o.orderDate).toLocaleDateString(), Status: o.status,
                Subtotal: o.subtotal, Discount: o.discount, Tax: o.tax, Total: o.totalAmount,
              })),
              "sales-orders-export", "Sales Orders"
            )}
            className="flex items-center gap-2 border border-[#6b8a4e] text-[#6b8a4e] hover:bg-[#6b8a4e]/10 text-xs font-bold px-4 py-2.5 rounded-2xl transition-all"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#6b8a4e] hover:bg-[#5a7840] text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all">
            <Plus className="h-4 w-4" /> {t("page_so_add")}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${actionMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
          {actionMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {actionMsg.text}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input type="text" placeholder={t("search_so")}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-[#18181B] placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#6b8a4e]/30"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="border border-slate-200/80 bg-white rounded-[28px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-semibold">
                <th className="py-4 px-6 font-medium">{t("col_so_number")}</th>
                <th className="py-4 px-6 font-medium">{t("label_customer")}</th>
                <th className="py-4 px-6 font-medium">{t("label_warehouse")}</th>
                <th className="py-4 px-6 font-medium">{t("col_order_date")}</th>
                <th className="py-4 px-6 font-medium">{t("label_status")}</th>
                <th className="py-4 px-6 font-medium text-center">Discount / Tax</th>
                <th className="py-4 px-6 font-medium text-right">{t("col_total_amount")}</th>
                <th className="py-4 px-6 font-medium text-right">{t("label_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Loading orders…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">No sales orders found.</td></tr>
              ) : filtered.map(so => (
                <tr key={so.id} onClick={() => setInvoiceOrder(so)} className="hover:bg-[#edf2ed]/60 transition-colors cursor-pointer">
                  <td className="py-4 px-6 font-mono font-bold text-[#18181B]">{so.orderNumber}</td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{so.customerName}</td>
                  <td className="py-4 px-6 text-slate-600">{so.warehouseName}</td>
                  <td className="py-4 px-6 text-slate-500">{formatDate(so.orderDate)}</td>
                  <td className="py-4 px-6"><StatusBadge status={so.status} /></td>
                  <td className="py-4 px-6 text-center" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(so)}
                      className="inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors group">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        Discount: <span className="font-bold">{so.subtotal > 0 ? ((so.discount / so.subtotal) * 100).toFixed(0) : 0}%</span>
                        <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[11px] font-semibold text-amber-700">
                        Tax: <span className="font-bold">{so.subtotal > 0 && (so.subtotal - so.discount) > 0 ? (so.tax / (so.subtotal - so.discount) * 100).toFixed(0) : 0}%</span>
                      </div>
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Printer className="h-3.5 w-3.5 text-[#6b8a4e]" />
                      <span className="font-extrabold text-[#18181B]">{formatCurrency(so.totalAmount)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {so.status === "DRAFT" && (
                        <button onClick={() => handleConfirm(so)}
                          className="px-3 py-1 bg-[#18181B] hover:bg-[#27272A] text-white text-[11px] font-bold rounded-xl transition-colors">
                          {t("btn_confirm")}
                        </button>
                      )}
                      {(so.status === "CONFIRMED" || so.status === "PROCESSING") && (
                        <button onClick={() => handleCancel(so)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-xl transition-colors">
                          {t("cancel_restore")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Discount & Tax modal */}
      <Modal isOpen={!!editOrder} onClose={() => setEditOrder(null)} title="Edit Discount & Tax" size="sm">
        {editOrder && (() => {
          const disc = editOrder.subtotal * (editDiscountPct / 100);
          const tax = (editOrder.subtotal - disc) * (editTaxPct / 100);
          const total = editOrder.subtotal - disc + tax;
          return (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">
                Order <span className="font-bold text-slate-800">{editOrder.orderNumber}</span> · Subtotal: <span className="font-bold">{formatCurrency(editOrder.subtotal)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">បញ្ចុះតម្លៃ / Discount (%)</label>
                  <div className="flex items-center gap-1.5">
                    <input type="number" min="0" max="100" step="0.1" value={editDiscountPct}
                      onChange={e => setEditDiscountPct(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-300 text-right" />
                    <span className="text-xs text-slate-400 shrink-0">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">ពន្ធ / Tax (%)</label>
                  <div className="flex items-center gap-1.5">
                    <input type="number" min="0" max="100" step="0.1" value={editTaxPct}
                      onChange={e => setEditTaxPct(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-300 text-right" />
                    <span className="text-xs text-slate-400 shrink-0">%</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>សរុបរង / Subtotal</span><span className="font-semibold text-slate-800">{formatCurrency(editOrder.subtotal)}</span>
                </div>
                {disc > 0 && <div className="flex justify-between text-rose-500">
                  <span>Discount ({editDiscountPct}%)</span><span className="font-semibold">−{formatCurrency(disc)}</span>
                </div>}
                {tax > 0 && <div className="flex justify-between text-slate-500">
                  <span>Tax ({editTaxPct}%)</span><span className="font-semibold">{formatCurrency(tax)}</span>
                </div>}
                <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold text-[#18181B]">
                  <span>Total</span><span>{formatCurrency(total)}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setEditOrder(null)}>Cancel</Button>
                <Button onClick={handleSaveEdit} className="bg-[#6b8a4e] hover:bg-[#5a7840] text-white">Save</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Invoice modal */}
      {invoiceOrder && (
        <KhmerInvoice
          orderNumber={invoiceOrder.orderNumber}
          orderDate={invoiceOrder.orderDate}
          customerName={invoiceOrder.customerName}
          warehouseName={invoiceOrder.warehouseName}
          items={(invoiceOrder.items ?? []).map(i => ({
            productName: i.productName,
            productSku: i.productSku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalAmount: i.totalAmount,
          }))}
          subtotal={invoiceOrder.subtotal}
          discount={invoiceOrder.discount}
          tax={invoiceOrder.tax}
          total={invoiceOrder.totalAmount}
          notes={invoiceOrder.notes ?? undefined}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {/* Create Order modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}
        title={t("so_modal_title")} description={t("so_modal_desc")} size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t("label_customer")} *</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-[#18181B] outline-none">
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t("label_warehouse")} *</label>
              <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-[#18181B] outline-none">
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">{t("col_order_date")}</label>
            <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
          </div>

          {/* Items */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#18181B]">{t("label_orders")}</span>
              <button type="button" onClick={() => setOrderItems([...orderItems, { productId: "", quantity: 1, unitPrice: 0 }])}
                className="text-[11px] font-bold text-[#6b8a4e] hover:underline">+ {t("btn_add")}</button>
            </div>
            {orderItems.map((item, idx) => {
              const selProd = products.find(p => p.id === item.productId);
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-6">
                    <select value={item.productId}
                      onChange={e => {
                        const u = [...orderItems]; u[idx].productId = e.target.value;
                        const p = products.find(p => p.id === e.target.value);
                        if (p) { const d = p.discountPercent ?? 0; u[idx].unitPrice = d > 0 ? +(p.sellingPrice * (1 - d / 100)).toFixed(2) : p.sellingPrice; }
                        setOrderItems(u);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-[#18181B] outline-none">
                      <option value="">{t("select_product")}</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.sellingPrice})</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder="Qty" min="1" value={item.quantity}
                      onChange={e => { const u = [...orderItems]; u[idx].quantity = Number(e.target.value); setOrderItems(u); }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-center text-[#18181B] outline-none" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder="Price $" step="0.01" value={item.unitPrice}
                      onChange={e => { const u = [...orderItems]; u[idx].unitPrice = Number(e.target.value); setOrderItems(u); }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-right text-[#18181B] outline-none" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Discount + Tax */}
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">បញ្ចុះតម្លៃ / Discount (%)</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" min="0" max="100" step="0.1" value={orderDiscountPct}
                    onChange={e => setOrderDiscountPct(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none text-right" />
                  <span className="text-xs text-slate-400 shrink-0">%</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ពន្ធ / Tax (%)</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" min="0" max="100" step="0.1" value={orderTaxPct}
                    onChange={e => setOrderTaxPct(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none text-right" />
                  <span className="text-xs text-slate-400 shrink-0">%</span>
                </div>
              </div>
            </div>
            {(() => {
              const sub = orderItems.filter(i => i.productId && i.quantity > 0).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
              const disc = sub * (orderDiscountPct / 100);
              const tax = (sub - disc) * (orderTaxPct / 100);
              const total = sub - disc + tax;
              return sub > 0 ? (
                <div className="bg-slate-50 rounded-xl p-3 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="font-semibold text-slate-800">{formatCurrency(sub)}</span></div>
                  {disc > 0 && <div className="flex justify-between text-rose-500"><span>Discount ({orderDiscountPct}%)</span><span>−{formatCurrency(disc)}</span></div>}
                  {tax > 0 && <div className="flex justify-between text-slate-500"><span>Tax ({orderTaxPct}%)</span><span>{formatCurrency(tax)}</span></div>}
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold text-[#18181B]"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
              ) : null;
            })()}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Notes</label>
            <Input placeholder="Optional notes…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>{t("btn_cancel")}</Button>
            <Button type="submit" disabled={creating} className="bg-[#6b8a4e] hover:bg-[#5a7840] text-white gap-2">
              {creating && <Loader2 className="h-3 w-3 animate-spin" />}
              {t("page_so_add")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
