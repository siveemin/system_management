"use client";

import React, { useState, useEffect } from "react";
import { Truck, Plus, Search, Edit2, CheckCircle2, AlertCircle } from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { SupplierDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const EMPTY_FORM = {
  name: "", contactPerson: "", email: "", phone: "", address: "",
  city: "", country: "", notes: "", status: "ACTIVE" as "ACTIVE" | "INACTIVE",
};

export default function SuppliersPage() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>(dataStore.getSuppliers());
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<SupplierDTO | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    return dataStore.subscribe(() => setSuppliers(dataStore.getSuppliers()));
  }, []);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactPerson ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.city ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setIsCreateOpen(true);
  };

  const openEdit = (s: SupplierDTO) => {
    setForm({
      name: s.name, contactPerson: s.contactPerson ?? "", email: s.email ?? "",
      phone: s.phone ?? "", address: s.address ?? "", city: s.city ?? "",
      country: s.country ?? "", notes: s.notes ?? "", status: s.status,
    });
    setEditSupplier(s);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    dataStore.createSupplier(form);
    setIsCreateOpen(false);
    showMsg(t("page_suppliers_created"), "success");
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSupplier) return;
    const idx = dataStore.getSuppliers().findIndex((s) => s.id === editSupplier.id);
    if (idx === -1) return;
    // update via store notification pattern — patch via createSupplier replacement approach:
    const updated = { ...editSupplier, ...form };
    const all = dataStore.getSuppliers();
    all.splice(idx, 1, updated);
    dataStore["suppliers"] = all;
    dataStore["notify"]();
    setEditSupplier(null);
    showMsg(t("page_suppliers_updated"), "success");
  };

  const showMsg = (text: string, type: "success" | "error") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{label}</label>
      <Input type={type} value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
    </div>
  );

  const SupplierForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {field("name", `${t("label_supplier")} *`)}
        {field("contactPerson", t("label_contact"))}
        {field("email", t("label_email"), "email")}
        {field("phone", t("label_phone"))}
        {field("city", t("label_city"))}
        {field("country", t("label_country"))}
      </div>
      {field("address", t("label_address"))}
      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("label_status")}</label>
        <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "ACTIVE" | "INACTIVE" }))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
          <option value="ACTIVE">{t("status_active")}</option>
          <option value="INACTIVE">{t("status_inactive")}</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("label_notes")}</label>
        <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs resize-none" />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" className="bg-[#6b8a4e] hover:bg-[#5a7840] text-white text-xs font-semibold">{submitLabel}</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Truck className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_suppliers_title")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {suppliers.length} {t("page_suppliers_title").toLowerCase()} · {suppliers.filter((s) => s.status === "ACTIVE").length} {t("status_active").toLowerCase()}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-[#6b8a4e] hover:bg-[#5a7840] text-white font-semibold">
          <Plus className="h-4 w-4" /> {t("page_suppliers_add")}
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("page_suppliers_search")} className="pl-8" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <th className="text-left py-3 px-4 font-semibold text-slate-500">{t("page_suppliers_col_supplier")}</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500">{t("page_suppliers_col_contact")}</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500">{t("page_suppliers_col_location")}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500">{t("page_suppliers_col_purchased")}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500">{t("page_suppliers_col_orders")}</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-500">{t("page_suppliers_col_status")}</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500">{t("page_suppliers_col_since")}</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">{t("page_suppliers_none")}</td></tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</div>
                    {s.email && <div className="text-slate-400 text-[10px]">{s.email}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    <div>{s.contactPerson ?? "—"}</div>
                    {s.phone && <div className="text-slate-400 text-[10px]">{s.phone}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {[s.city, s.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(s.totalPurchased ?? 0)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300">{s.purchaseOrdersCount ?? 0}</td>
                  <td className="py-3.5 px-4 text-center"><StatusBadge status={s.status} /></td>
                  <td className="py-3.5 px-4 text-slate-400">{formatDate(s.createdAt)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button onClick={() => openEdit(s)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#6b8a4e] hover:bg-[#edf2ed] dark:hover:bg-[#1a2a10] transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t("page_suppliers_create_title")} size="md">
        <SupplierForm onSubmit={handleCreate} submitLabel={t("page_suppliers_create_btn")} />
      </Modal>

      <Modal isOpen={!!editSupplier} onClose={() => setEditSupplier(null)} title={t("page_suppliers_edit_title")}
        description={editSupplier?.name} size="md">
        <SupplierForm onSubmit={handleEdit} submitLabel={t("btn_save")} />
      </Modal>
    </div>
  );
}
