"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PackagePlus, Search, Edit2, Package, CheckCircle2, AlertCircle, Camera, X, Barcode,
} from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { ProductDTO, CategoryDTO, SupplierDTO, WarehouseDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, generateSKU, generateBarcode } from "@/lib/utils";
import { PrintLabelModal } from "@/components/barcode/PrintLabelModal";
import { BarcodeCameraScanner } from "@/components/scanner/BarcodeCameraScanner";

const EMPTY_FORM = {
  name: "", sku: "", barcode: "", description: "", uom: "PCS",
  costPrice: 0, sellingPrice: 0, minStockLevel: 10, maxStockLevel: 500,
  categoryId: "", supplierId: "", status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  imageUrl: "",
};

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductDTO[]>(dataStore.getProducts());
  const [categories, setCategories] = useState<CategoryDTO[]>(dataStore.getCategories());
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>(dataStore.getSuppliers());
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>(dataStore.getWarehouses());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductDTO | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [initStock, setInitStock] = useState<Record<string, number>>({});
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [printProduct, setPrintProduct] = useState<ProductDTO | null>(null);
  const [scanBarcodeMode, setScanBarcodeMode] = useState(false);

  useEffect(() => {
    const update = () => {
      setProducts(dataStore.getProducts());
      setCategories(dataStore.getCategories());
      setSuppliers(dataStore.getSuppliers());
      setWarehouses(dataStore.getWarehouses());
    };
    return dataStore.subscribe(update);
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode ?? "").includes(search);
    const matchCat = categoryFilter === "all" || p.categoryId === categoryFilter;
    return matchSearch && matchCat;
  });

  const openCreate = () => {
    const cat = categories[0];
    setForm({
      ...EMPTY_FORM,
      sku: generateSKU("SKU", cat?.name ?? ""),
      barcode: generateBarcode(),
      categoryId: cat?.id ?? "",
      supplierId: suppliers[0]?.id ?? "",
    });
    setInitStock({});
    setScanBarcodeMode(false);
    setIsCreateOpen(true);
  };

  const openEdit = (p: ProductDTO) => {
    setForm({
      name: p.name, sku: p.sku, barcode: p.barcode ?? "", description: p.description ?? "",
      uom: p.uom, costPrice: p.costPrice, sellingPrice: p.sellingPrice,
      minStockLevel: p.minStockLevel, maxStockLevel: p.maxStockLevel ?? 500,
      categoryId: p.categoryId ?? "", supplierId: p.supplierId ?? "", status: p.status,
      imageUrl: p.imageUrl ?? "",
    });
    setScanBarcodeMode(false);
    setEditProduct(p);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku) return;
    const cat = categories.find((c) => c.id === form.categoryId);
    const sup = suppliers.find((s) => s.id === form.supplierId);
    dataStore.createProduct({
      ...form,
      categoryName: cat?.name ?? null,
      supplierName: sup?.name ?? null,
      imageUrl: form.imageUrl || null,
      qrCode: null,
      initialStockPerWarehouse: initStock,
    });
    setIsCreateOpen(false);
    showMsg(t("page_products_created"), "success");
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    const cat = categories.find((c) => c.id === form.categoryId);
    const sup = suppliers.find((s) => s.id === form.supplierId);
    dataStore.updateProduct(editProduct.id, {
      ...form,
      categoryName: cat?.name ?? null,
      supplierName: sup?.name ?? null,
      imageUrl: form.imageUrl || null,
    });
    setEditProduct(null);
    showMsg(t("page_products_updated"), "success");
  };

  const showMsg = (text: string, type: "success" | "error") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const field = (key: keyof typeof form, label: string, type = "text", step?: string) => (
    <div>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{label}</label>
      <Input
        type={type}
        step={step}
        value={form[key] as string | number}
        onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
      />
    </div>
  );

  const productForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">

      {/* Image Upload */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative h-20 w-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:border-[#6b8a4e] hover:bg-[#edf2ed] transition-colors overflow-hidden shrink-0"
        >
          {form.imageUrl ? (
            <img src={form.imageUrl} alt="preview" className="h-full w-full object-cover rounded-2xl" />
          ) : (
            <Camera className="h-6 w-6 text-slate-400" />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Product Photo</span>
          <span className="text-[11px] text-slate-400">JPG, PNG or WEBP · Max 2MB</span>
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-semibold text-[#6b8a4e] hover:underline">
              {form.imageUrl ? "Change photo" : "Upload photo"}
            </button>
            {form.imageUrl && (
              <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                className="text-[11px] font-semibold text-rose-500 hover:underline flex items-center gap-0.5">
                <X className="h-3 w-3" /> Remove
              </button>
            )}
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {field("name", `${t("label_name")} *`)}
        {field("sku", `${t("label_sku")} *`)}
        {/* Barcode field with inline camera scan */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("label_barcode")}</label>
            <button type="button"
              onClick={() => setScanBarcodeMode((v) => !v)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                scanBarcodeMode ? "bg-[#6b8a4e] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}>
              <Camera className="h-3 w-3" /> {scanBarcodeMode ? "Scanning…" : "Scan"}
            </button>
          </div>
          {scanBarcodeMode ? (
            <div className="rounded-xl overflow-hidden col-span-2">
              <BarcodeCameraScanner
                onScanSuccess={(code) => {
                  setForm((f) => ({ ...f, barcode: code }));
                  setScanBarcodeMode(false);
                }}
                onFallback={() => setScanBarcodeMode(false)}
              />
            </div>
          ) : (
            <Input
              value={form.barcode}
              onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
              className="font-mono text-xs"
            />
          )}
        </div>
        {field("uom", t("label_unit"))}
        {field("costPrice", t("label_cost_price"), "number", "0.01")}
        {field("sellingPrice", t("label_sell_price"), "number", "0.01")}
        {field("minStockLevel", t("label_min_stock"), "number")}
        {field("maxStockLevel", `Max ${t("label_stock")}`, "number")}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("label_category")}</label>
          <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("label_supplier")}</label>
          <select value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
            <option value="">— None —</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("label_status")}</label>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "ACTIVE" | "INACTIVE" }))}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
            <option value="ACTIVE">{t("status_active")}</option>
            <option value="INACTIVE">{t("status_inactive")}</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("label_description")}</label>
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 resize-none" />
      </div>
      {submitLabel === t("page_products_create_btn") && warehouses.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">{t("page_products_init_stock")}</label>
          <div className="grid grid-cols-2 gap-2">
            {warehouses.map((w) => (
              <div key={w.id} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 w-32 truncate">{w.name}</span>
                <Input type="number" value={initStock[w.id] ?? 0}
                  onChange={(e) => setInitStock((s) => ({ ...s, [w.id]: parseInt(e.target.value) || 0 }))}
                  className="w-20" />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" className="bg-[#6b8a4e] hover:bg-[#5a7840] text-white text-xs font-semibold">{submitLabel}</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_products_title")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {products.length} {t("page_products_sub")} · {products.filter((p) => p.status === "ACTIVE").length} {t("page_products_active")}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-[#6b8a4e] hover:bg-[#5a7840] text-white font-semibold">
          <PackagePlus className="h-4 w-4" /> {t("page_products_add")}
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
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("page_products_search")} className="pl-8" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
          <option value="all">{t("page_products_all_cats")}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_products_col_product")}</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_products_col_sku")}</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_products_col_category")}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_products_col_price")}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_products_col_stock")}</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">{t("page_products_col_status")}</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">{t("page_products_none")}</td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="h-9 w-9 rounded-xl object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-xl bg-[#6b8a4e]/10 border border-slate-200 flex items-center justify-center text-[#6b8a4e] text-xs font-black shrink-0">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                        {p.supplierName && <div className="text-slate-400 text-[10px] mt-0.5">{p.supplierName}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">{p.sku}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{p.categoryName ?? "—"}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(p.sellingPrice, "USD")}</div>
                    <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">{formatCurrency(p.sellingPrice, "KHR")}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`font-bold ${p.totalStock <= p.minStockLevel ? "text-red-600" : "text-emerald-600"}`}>
                      {p.totalStock}
                    </span>
                    <span className="text-slate-400 ml-1">{p.uom}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setPrintProduct(p)}
                        title="Print Barcode Label"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors">
                        <Barcode className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#6b8a4e] hover:bg-[#edf2ed] dark:hover:bg-[#1a2a10] transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t("page_products_create_title")}
        description={t("page_products_create_sub")} size="lg">
        {productForm({ onSubmit: handleCreate, submitLabel: t("page_products_create_btn") })}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title={t("page_products_edit_title")}
        description={editProduct?.sku} size="lg">
        {productForm({ onSubmit: handleEdit, submitLabel: t("page_products_save_btn") })}
      </Modal>

      {/* Barcode / Print Label Modal */}
      <PrintLabelModal
        product={printProduct}
        isOpen={!!printProduct}
        onClose={() => setPrintProduct(null)}
      />
    </div>
  );
}
