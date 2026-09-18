"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Boxes, Users, UserCheck, Search, X, ChevronRight,
  CheckCircle2, XCircle, Package, TrendingDown,
  ArrowRight, Plus, Trash2, AlertTriangle,
} from "lucide-react";
import { ProductDTO, CustomerDTO, UserDTO, Role } from "@/types";
import { formatCurrency } from "@/lib/utils";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { t as tStatic } from "@/lib/i18n";

// ── Shared bottom-sheet modal ─────────────────────────────────────────────────
function CheckModal({
  open, onClose, title, icon, count,
  search, onSearch, onAdd, children,
}: {
  open: boolean; onClose: () => void;
  title: string; icon: React.ReactNode; count: number;
  search: string; onSearch: (v: string) => void;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative mt-auto w-full max-h-[90vh] bg-white rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#edf2ed]">{icon}</div>
            <div>
              <h2 className="text-base font-bold text-[#1e2e14]">{title}</h2>
              <p className="text-[11px] text-slate-500">{count} {t("check_records")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#6b8a4e] text-white text-xs font-bold hover:bg-[#5a7840] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> {t("btn_add")}
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-800"
              style={{ fontSize: 16 }}
            />
            {search && (
              <button onClick={() => onSearch("")}>
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm delete dialog ─────────────────────────────────────────────────────
function ConfirmDelete({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-full bg-rose-50">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{t("check_remove_confirm")}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">{name}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            {t("btn_cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700"
          >
            {t("btn_delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small inline form wrapper ─────────────────────────────────────────────────
function AddForm({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="mx-4 mt-3 mb-1 rounded-2xl border border-[#6b8a4e]/30 bg-[#f7fbf7] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[#1e2e14] uppercase tracking-wide">{title}</p>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
          <X className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#6b8a4e] focus:ring-1 focus:ring-[#6b8a4e]/30";

// ── Stock status badge ────────────────────────────────────────────────────────
function StockBadge({ qty, min }: { qty: number; min: number }) {
  if (qty === 0)
    return <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full"><XCircle className="h-3 w-3" /> {tStatic("status_out_of_stock")}</span>;
  if (qty <= min)
    return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><TrendingDown className="h-3 w-3" /> {tStatic("status_low_stock")}</span>;
  return <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle2 className="h-3 w-3" /> {tStatic("status_stock_ok")}</span>;
}

function StatusDot({ active }: { active: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${active ? "bg-emerald-500" : "bg-slate-300"}`} />;
}

// ── STOCK CHECK ───────────────────────────────────────────────────────────────
function StockCheckModal({ products, open, onClose }: { products: ProductDTO[]; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProductDTO | null>(null);

  // Add form state
  const categories = dataStore.getCategories();
  const suppliers  = dataStore.getSuppliers();
  const [form, setForm] = useState({ name: "", sku: "", costPrice: "", sellingPrice: "", categoryId: "", supplierId: "", uom: "pcs", minStockLevel: "5" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    let list = products;
    if (filter === "low") list = list.filter((p) => p.totalStock > 0 && p.totalStock <= p.minStockLevel);
    if (filter === "out") list = list.filter((p) => p.totalStock === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    return list;
  }, [products, search, filter]);

  const lowCount = products.filter((p) => p.totalStock > 0 && p.totalStock <= p.minStockLevel).length;
  const outCount = products.filter((p) => p.totalStock === 0).length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim()) { setError("Name and SKU are required."); return; }
    setSaving(true);
    setError("");
    try {
      dataStore.createProduct({
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        uom: form.uom || "pcs",
        costPrice: parseFloat(form.costPrice) || 0,
        sellingPrice: parseFloat(form.sellingPrice) || 0,
        minStockLevel: parseInt(form.minStockLevel) || 5,
        maxStockLevel: null,
        status: "ACTIVE",
        categoryId: form.categoryId || null,
        categoryName: categories.find((c) => c.id === form.categoryId)?.name ?? null,
        supplierId: form.supplierId || null,
        supplierName: suppliers.find((s) => s.id === form.supplierId)?.name ?? null,
        barcode: null, qrCode: null, description: null, imageUrl: null,
      });
      setForm({ name: "", sku: "", costPrice: "", sellingPrice: "", categoryId: "", supplierId: "", uom: "pcs", minStockLevel: "5" });
      setShowAdd(false);
    } catch { setError("Failed to save. Check SKU is unique."); }
    setSaving(false);
  };

  return (
    <>
      <CheckModal
        open={open} onClose={onClose}
        title={t("check_stock")} icon={<Boxes className="h-5 w-5 text-[#6b8a4e]" />}
        count={products.length} search={search} onSearch={setSearch}
        onAdd={() => setShowAdd((v) => !v)}
      >
        {/* Add form */}
        {showAdd && (
          <AddForm title={t("check_new_product")} onClose={() => { setShowAdd(false); setError(""); }}>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label={`${t("label_name")} *`}>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" className={inputCls} />
                </Field>
                <Field label={`${t("label_sku")} *`}>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. ITM-001" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Field label={t("label_cost_price")}>
                  <input type="number" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label={t("label_sell_price")}>
                  <input type="number" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label={t("label_unit")}>
                  <input value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} placeholder="pcs" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t("label_category")}>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
                    <option value="">None</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label={t("label_min_stock")}>
                  <input type="number" min="0" value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })} className={inputCls} />
                </Field>
              </div>
              {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
              <button type="submit" disabled={saving} className="w-full h-9 rounded-xl bg-[#6b8a4e] text-white text-sm font-bold hover:bg-[#5a7840] disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : t("check_add_product")}
              </button>
            </form>
          </AddForm>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 px-4 py-3 border-b border-slate-100">
          {(["all", "low", "out"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${filter === f ? "bg-[#6b8a4e] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {f === "all" ? `All (${products.length})` : f === "low" ? `${t("status_low_stock")} (${lowCount})` : `${t("status_out_of_stock")} (${outCount})`}
            </button>
          ))}
        </div>

        <ul className="divide-y divide-slate-100 px-4">
          {filtered.length === 0 && <li className="py-10 text-center text-slate-400 text-sm">{t("check_no_products")}</li>}
          {filtered.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#edf2ed] flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-[#6b8a4e]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                <p className="text-[11px] text-slate-400">{p.sku} · {p.categoryName || "General"}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold text-[#1e2e14]">{p.totalStock} <span className="text-[10px] font-normal text-slate-400">{p.uom}</span></span>
                <StockBadge qty={p.totalStock} min={p.minStockLevel} />
              </div>
              <button onClick={() => setPendingDelete(p)} className="ml-1 p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="px-4 pb-6 pt-2">
          <Link href="/products" onClick={onClose}>
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#edf2ed] text-[#6b8a4e] text-sm font-bold hover:bg-[#d4ddd4] transition-colors">
              {t("btn_open_page")} {t("page_products_title")} <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </CheckModal>

      {pendingDelete && (
        <ConfirmDelete
          name={pendingDelete.name}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => { dataStore.deleteProduct(pendingDelete.id); setPendingDelete(null); }}
        />
      )}
    </>
  );
}

// ── CUSTOMER CHECK ────────────────────────────────────────────────────────────
function CustomerCheckModal({ customers, open, onClose }: { customers: CustomerDTO[]; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CustomerDTO | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", country: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const activeCount = customers.filter((c) => c.status === "ACTIVE").length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      dataStore.createCustomer({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        status: "ACTIVE",
        contactPerson: null, address: null, notes: null,
      });
      setForm({ name: "", email: "", phone: "", city: "", country: "" });
      setShowAdd(false);
    } catch { setError("Failed to save."); }
    setSaving(false);
  };

  return (
    <>
      <CheckModal
        open={open} onClose={onClose}
        title={t("check_customers")} icon={<Users className="h-5 w-5 text-[#6b8a4e]" />}
        count={customers.length} search={search} onSearch={setSearch}
        onAdd={() => setShowAdd((v) => !v)}
      >
        {showAdd && (
          <AddForm title={t("check_new_customer")} onClose={() => { setShowAdd(false); setError(""); }}>
            <form onSubmit={handleAdd} className="space-y-3">
              <Field label={`${t("label_name")} *`}>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t("label_email")}>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@..." className={inputCls} />
                </Field>
                <Field label={t("label_phone")}>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555…" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t("label_city")}>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className={inputCls} />
                </Field>
                <Field label={t("label_country")}>
                  <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" className={inputCls} />
                </Field>
              </div>
              {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
              <button type="submit" disabled={saving} className="w-full h-9 rounded-xl bg-[#6b8a4e] text-white text-sm font-bold hover:bg-[#5a7840] disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : t("check_add_customer")}
              </button>
            </form>
          </AddForm>
        )}

        {/* Summary */}
        <div className="flex gap-3 px-4 py-3 border-b border-slate-100">
          <div className="flex-1 bg-emerald-50 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold text-emerald-700">{activeCount}</p>
            <p className="text-[10px] text-emerald-600 font-semibold">{t("chip_active")}</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold text-slate-600">{customers.length - activeCount}</p>
            <p className="text-[10px] text-slate-500 font-semibold">{t("chip_inactive")}</p>
          </div>
          <div className="flex-1 bg-[#edf2ed] rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-[#6b8a4e]">
              {formatCurrency(customers.reduce((s, c) => s + (c.totalSpent ?? 0), 0))}
            </p>
            <p className="text-[10px] text-[#6b8a4e] font-semibold">{t("label_total_sales")}</p>
          </div>
        </div>

        <ul className="divide-y divide-slate-100 px-4">
          {filtered.length === 0 && <li className="py-10 text-center text-slate-400 text-sm">{t("check_no_customers")}</li>}
          {filtered.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-3.5">
              <div className="w-9 h-9 rounded-full bg-[#edf2ed] flex items-center justify-center shrink-0 text-sm font-bold text-[#6b8a4e]">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <StatusDot active={c.status === "ACTIVE"} />
                  <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{c.email || c.phone || c.city || t("label_no_contact")}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[#1e2e14]">{formatCurrency(c.totalSpent ?? 0)}</p>
                <p className="text-[10px] text-slate-400">{c.salesOrdersCount ?? 0} {t("label_orders").toLowerCase()}</p>
              </div>
              <button onClick={() => setPendingDelete(c)} className="ml-1 p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="px-4 pb-6 pt-2">
          <Link href="/customers" onClick={onClose}>
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#edf2ed] text-[#6b8a4e] text-sm font-bold hover:bg-[#d4ddd4] transition-colors">
              {t("btn_open_page")} {t("page_customers_title")} <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </CheckModal>

      {pendingDelete && (
        <ConfirmDelete
          name={pendingDelete.name}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => { dataStore.deleteCustomer(pendingDelete.id); setPendingDelete(null); }}
        />
      )}
    </>
  );
}

// ── EMPLOYEE CHECK ────────────────────────────────────────────────────────────
const ROLE_KEY_MAP: Record<string, "role_admin" | "role_warehouse_manager" | "role_sales_manager" | "role_staff"> = {
  ADMIN: "role_admin",
  WAREHOUSE_MANAGER: "role_warehouse_manager",
  SALES_MANAGER: "role_sales_manager",
  STAFF: "role_staff",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-rose-50 text-rose-700",
  WAREHOUSE_MANAGER: "bg-blue-50 text-blue-700",
  SALES_MANAGER: "bg-purple-50 text-purple-700",
  STAFF: "bg-slate-100 text-slate-600",
};

function EmployeeCheckModal({ users, open, onClose }: { users: UserDTO[]; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<UserDTO | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "STAFF" as Role, phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.warehouseName?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const roleGroups = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required."); return; }
    setSaving(true);
    setError("");
    try {
      dataStore.createUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        phone: form.phone.trim() || null,
        status: "ACTIVE",
        avatar: null,
        warehouseId: null,
        warehouseName: null,
      });
      setForm({ name: "", email: "", role: "STAFF", phone: "" });
      setShowAdd(false);
    } catch { setError("Failed to save."); }
    setSaving(false);
  };

  return (
    <>
      <CheckModal
        open={open} onClose={onClose}
        title={t("check_employees")} icon={<UserCheck className="h-5 w-5 text-[#6b8a4e]" />}
        count={users.length} search={search} onSearch={setSearch}
        onAdd={() => setShowAdd((v) => !v)}
      >
        {showAdd && (
          <AddForm title={t("check_new_employee")} onClose={() => { setShowAdd(false); setError(""); }}>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label={`${t("label_name")} *`}>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className={inputCls} />
                </Field>
                <Field label={`${t("label_email")} *`}>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@..." className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t("label_role")}>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className={inputCls}>
                    <option value="STAFF">{t("role_staff")}</option>
                    <option value="WAREHOUSE_MANAGER">{t("role_warehouse_manager")}</option>
                    <option value="SALES_MANAGER">{t("role_sales_manager")}</option>
                    <option value="ADMIN">{t("role_admin")}</option>
                  </select>
                </Field>
                <Field label={t("label_phone")}>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555…" className={inputCls} />
                </Field>
              </div>
              {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
              <button type="submit" disabled={saving} className="w-full h-9 rounded-xl bg-[#6b8a4e] text-white text-sm font-bold hover:bg-[#5a7840] disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : t("check_add_employee")}
              </button>
            </form>
          </AddForm>
        )}

        {/* Role chips */}
        <div className="flex gap-2 px-4 py-3 border-b border-slate-100 overflow-x-auto">
          {Object.entries(roleGroups).map(([role, count]) => (
            <div key={role} className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold ${ROLE_COLORS[role] ?? "bg-slate-100 text-slate-600"}`}>
              {ROLE_KEY_MAP[role] ? t(ROLE_KEY_MAP[role]) : role} ({count})
            </div>
          ))}
          <div className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
            {t("chip_active")}: {activeCount}
          </div>
        </div>

        <ul className="divide-y divide-slate-100 px-4">
          {filtered.length === 0 && <li className="py-10 text-center text-slate-400 text-sm">{t("check_no_employees")}</li>}
          {filtered.map((u) => (
            <li key={u.id} className="flex items-center gap-3 py-3.5">
              <div className="w-9 h-9 rounded-full bg-[#1e2e14] flex items-center justify-center shrink-0 text-sm font-bold text-white">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <StatusDot active={u.status === "ACTIVE"} />
                  <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {u.email}{u.warehouseName ? ` · ${u.warehouseName}` : ""}
                </p>
              </div>
              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                {ROLE_KEY_MAP[u.role] ? t(ROLE_KEY_MAP[u.role]) : u.role}
              </span>
              <button onClick={() => setPendingDelete(u)} className="ml-1 p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="px-4 pb-6 pt-2">
          <Link href="/users" onClick={onClose}>
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#edf2ed] text-[#6b8a4e] text-sm font-bold hover:bg-[#d4ddd4] transition-colors">
              {t("btn_open_page")} {t("page_users_title")} <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </CheckModal>

      {pendingDelete && (
        <ConfirmDelete
          name={pendingDelete.name}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => { dataStore.deleteUser(pendingDelete.id); setPendingDelete(null); }}
        />
      )}
    </>
  );
}

// ── Main exported panel ───────────────────────────────────────────────────────
export function QuickCheckPanel({
  products, customers, users,
}: {
  products: ProductDTO[];
  customers: CustomerDTO[];
  users: UserDTO[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<"stock" | "customers" | "employees" | null>(null);

  const lowStock  = products.filter((p) => p.totalStock > 0 && p.totalStock <= p.minStockLevel).length;
  const outOfStock = products.filter((p) => p.totalStock === 0).length;
  const activeCustomers = customers.filter((c) => c.status === "ACTIVE").length;
  const activeUsers = users.filter((u) => u.status === "ACTIVE").length;

  const cards = [
    {
      id: "stock" as const,
      label: t("check_stock"),
      icon: <Boxes className="h-6 w-6 text-[#6b8a4e]" />,
      main: `${products.length} ${t("page_products_title").toLowerCase()}`,
      sub: outOfStock > 0 ? `${outOfStock} ${t("status_out_of_stock")} · ${lowStock} ${t("status_low_stock")}` : lowStock > 0 ? `${lowStock} ${t("status_low_stock")}` : t("check_all_ok"),
      alert: outOfStock > 0 || lowStock > 0,
    },
    {
      id: "customers" as const,
      label: t("check_customers"),
      icon: <Users className="h-6 w-6 text-[#6b8a4e]" />,
      main: `${customers.length} ${t("page_customers_title").toLowerCase()}`,
      sub: `${activeCustomers} ${t("status_active").toLowerCase()}`,
      alert: false,
    },
    {
      id: "employees" as const,
      label: t("check_employees"),
      icon: <UserCheck className="h-6 w-6 text-[#6b8a4e]" />,
      main: `${users.length} ${t("role_staff").toLowerCase()}`,
      sub: `${activeUsers} ${t("status_active").toLowerCase()}`,
      alert: false,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setOpen(card.id)}
            className="ripple relative flex flex-col items-center gap-2 bg-white rounded-2xl p-3.5 border border-[#d4ddd4] shadow-sm active:scale-[0.96] transition-all text-center hover:border-[#6b8a4e]/40 hover:shadow-md"
          >
            {card.alert && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white" />
            )}
            <div className="p-2.5 rounded-xl bg-[#edf2ed]">{card.icon}</div>
            <div>
              <p className="text-xs font-bold text-[#1e2e14] leading-tight">{card.label}</p>
              <p className="text-[11px] font-semibold text-[#6b8a4e] mt-0.5">{card.main}</p>
              <p className={`text-[10px] mt-0.5 ${card.alert ? "text-amber-600 font-bold" : "text-slate-400"}`}>{card.sub}</p>
            </div>
            <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
          </button>
        ))}
      </div>

      <StockCheckModal   products={products}   open={open === "stock"}      onClose={() => setOpen(null)} />
      <CustomerCheckModal customers={customers} open={open === "customers"}  onClose={() => setOpen(null)} />
      <EmployeeCheckModal users={users}         open={open === "employees"}  onClose={() => setOpen(null)} />
    </>
  );
}
