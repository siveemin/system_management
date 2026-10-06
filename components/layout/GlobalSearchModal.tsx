"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Warehouse, Truck, Users, X, ArrowRight, ScanBarcode, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({ products: [], customers: [], suppliers: [], warehouses: [] });
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const debouncedQuery = useDebounce(query, 220);

  useEffect(() => {
    if (!isOpen) { setQuery(""); setResults({ products: [], customers: [], suppliers: [], warehouses: [] }); }
    else setTimeout(() => inputRef.current?.focus(), 60);
  }, [isOpen]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults({ products: [], customers: [], suppliers: [], warehouses: [] });
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.ok ? r.json() : { products: [], customers: [], suppliers: [], warehouses: [] })
      .then(data => { setResults(data); setActiveIdx(0); })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const allItems = [
    ...results.products.map((p: any) => ({ type: "product", data: p, path: `/products?search=${encodeURIComponent(p.sku)}` })),
    ...results.customers.map((c: any) => ({ type: "customer", data: c, path: `/customers` })),
    ...results.suppliers.map((s: any) => ({ type: "supplier", data: s, path: `/suppliers` })),
    ...results.warehouses.map((w: any) => ({ type: "warehouse", data: w, path: `/warehouses` })),
  ];

  const navigateTo = (path: string) => {
    onClose();
    setQuery("");
    router.push(path);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allItems.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && allItems[activeIdx]) navigateTo(allItems[activeIdx].path);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, allItems, activeIdx]);

  if (!isOpen) return null;

  const hasResults = allItems.length > 0;
  const isEmpty = debouncedQuery.length >= 2 && !loading && !hasResults;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#1a2410] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-[#2d4020] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-[#2d4020]">
          {loading
            ? <Loader2 className="h-5 w-5 text-[#6b8a4e] shrink-0 animate-spin" />
            : <Search className="h-5 w-5 text-[#6b8a4e] shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            placeholder={t("search_placeholder") || "Search products, customers, suppliers…"}
            className="flex-1 bg-transparent text-[15px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
          />
          {query ? (
            <button onClick={() => setQuery("")} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-400 border border-slate-200 dark:border-slate-700">
              esc
            </kbd>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain py-2">
          {!query && (
            <div className="px-5 py-8 text-center">
              <ScanBarcode className="h-10 w-10 mx-auto mb-3 text-slate-200 dark:text-slate-700 stroke-1" />
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                Type to search products, customers, suppliers…
              </p>
              <p className="text-[11px] text-slate-300 dark:text-slate-600 mt-1">Press ↑↓ to navigate · Enter to open</p>
            </div>
          )}

          {isEmpty && (
            <div className="px-5 py-10 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-slate-200 dark:text-slate-700 stroke-1" />
              <p className="text-sm font-medium text-slate-400">{t("search_no_results") || "No results"} for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">{t("search_try_sku") || "Try SKU, barcode, or partial name"}</p>
            </div>
          )}

          {/* Products */}
          {results.products?.length > 0 && (
            <Section label={t("search_cat_products") || "Products"}>
              {results.products.map((p: any, i: number) => {
                const idx = allItems.findIndex(x => x.type === "product" && x.data.id === p.id);
                return (
                  <ResultRow key={p.id} active={idx === activeIdx}
                    icon={<Package className="h-4 w-4 text-[#6b8a4e]" />}
                    iconBg="bg-[#6b8a4e]/10"
                    title={p.name}
                    meta={[p.sku, p.barcode && `• ${p.barcode}`, `• ${p.totalStock} ${p.uom}`].filter(Boolean).join(" ")}
                    badge={p.categoryName}
                    onClick={() => navigateTo(`/products?search=${encodeURIComponent(p.sku)}`)}
                    onMouseEnter={() => setActiveIdx(idx)}
                  />
                );
              })}
            </Section>
          )}

          {/* Customers */}
          {results.customers?.length > 0 && (
            <Section label="Customers">
              {results.customers.map((c: any) => {
                const idx = allItems.findIndex(x => x.type === "customer" && x.data.id === c.id);
                return (
                  <ResultRow key={c.id} active={idx === activeIdx}
                    icon={<Users className="h-4 w-4 text-indigo-500" />}
                    iconBg="bg-indigo-50 dark:bg-indigo-950"
                    title={c.name}
                    meta={c.email || ""}
                    onClick={() => navigateTo("/customers")}
                    onMouseEnter={() => setActiveIdx(idx)}
                  />
                );
              })}
            </Section>
          )}

          {/* Suppliers */}
          {results.suppliers?.length > 0 && (
            <Section label={t("page_suppliers_title") || "Suppliers"}>
              {results.suppliers.map((s: any) => {
                const idx = allItems.findIndex(x => x.type === "supplier" && x.data.id === s.id);
                return (
                  <ResultRow key={s.id} active={idx === activeIdx}
                    icon={<Truck className="h-4 w-4 text-amber-500" />}
                    iconBg="bg-amber-50 dark:bg-amber-950"
                    title={s.name}
                    meta={s.contactPerson || ""}
                    onClick={() => navigateTo("/suppliers")}
                    onMouseEnter={() => setActiveIdx(idx)}
                  />
                );
              })}
            </Section>
          )}

          {/* Warehouses */}
          {results.warehouses?.length > 0 && (
            <Section label={t("page_warehouses_title") || "Warehouses"}>
              {results.warehouses.map((w: any) => {
                const idx = allItems.findIndex(x => x.type === "warehouse" && x.data.id === w.id);
                return (
                  <ResultRow key={w.id} active={idx === activeIdx}
                    icon={<Warehouse className="h-4 w-4 text-emerald-500" />}
                    iconBg="bg-emerald-50 dark:bg-emerald-950"
                    title={`${w.name} (${w.code})`}
                    meta={w.address || ""}
                    onClick={() => navigateTo("/warehouses")}
                    onMouseEnter={() => setActiveIdx(idx)}
                  />
                );
              })}
            </Section>
          )}
        </div>

        {/* Footer hint */}
        {hasResults && (
          <div className="px-5 py-2.5 border-t border-slate-100 dark:border-[#2d4020] flex items-center gap-4">
            <span className="text-[10px] text-slate-400 flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">↵</kbd> open</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">↑↓</kbd> navigate</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">esc</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-2 py-1">
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</div>
      {children}
    </div>
  );
}

function ResultRow({ active, icon, iconBg, title, meta, badge, onClick, onMouseEnter }: {
  active: boolean; icon: React.ReactNode; iconBg: string;
  title: string; meta: string; badge?: string | null;
  onClick: () => void; onMouseEnter: () => void;
}) {
  return (
    <button onClick={onClick} onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
        active ? "bg-[#6b8a4e]/10 dark:bg-[#6b8a4e]/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
      }`}>
      <div className={`${iconBg} p-2 rounded-xl shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold truncate ${active ? "text-[#3d5a2a] dark:text-[#8aaa6e]" : "text-slate-900 dark:text-slate-100"}`}>
          {title}
        </div>
        {meta && <div className="text-[11px] text-slate-400 truncate mt-0.5">{meta}</div>}
      </div>
      {badge && (
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {badge}
        </span>
      )}
      <ArrowRight className={`h-3.5 w-3.5 shrink-0 transition-opacity ${active ? "opacity-100 text-[#6b8a4e]" : "opacity-0"}`} />
    </button>
  );
}
