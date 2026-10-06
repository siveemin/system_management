"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Warehouse, Truck, Users, X, Loader2 } from "lucide-react";
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

const TYPE_ICON: Record<string, React.ReactNode> = {
  product:   <Package  className="h-3.5 w-3.5" />,
  customer:  <Users    className="h-3.5 w-3.5" />,
  supplier:  <Truck    className="h-3.5 w-3.5" />,
  warehouse: <Warehouse className="h-3.5 w-3.5" />,
};

const TYPE_LABEL: Record<string, string> = {
  product: "Product", customer: "Customer", supplier: "Supplier", warehouse: "Warehouse",
};

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery]   = useState("");
  const [results, setResults] = useState<any>({ products: [], customers: [], suppliers: [], warehouses: [] });
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (!isOpen) { setQuery(""); setResults({ products: [], customers: [], suppliers: [], warehouses: [] }); }
    else setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults({ products: [], customers: [], suppliers: [], warehouses: [] }); return; }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.ok ? r.json() : { products: [], customers: [], suppliers: [], warehouses: [] })
      .then(data => { setResults(data); setActiveIdx(0); })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const allItems = [
    ...results.products.map((p: any)   => ({ type: "product",   data: p, label: p.name,              sub: `${p.sku}${p.barcode ? ` · ${p.barcode}` : ""} · ${p.totalStock} ${p.uom}`, tag: p.categoryName, path: `/products?search=${encodeURIComponent(p.sku)}` })),
    ...results.customers.map((c: any)  => ({ type: "customer",  data: c, label: c.name,              sub: c.email ?? "",            tag: null, path: `/customers` })),
    ...results.suppliers.map((s: any)  => ({ type: "supplier",  data: s, label: s.name,              sub: s.contactPerson ?? "",    tag: null, path: `/suppliers` })),
    ...results.warehouses.map((w: any) => ({ type: "warehouse", data: w, label: `${w.name} (${w.code})`, sub: w.address ?? "",      tag: null, path: `/warehouses` })),
  ];

  const navigateTo = (path: string) => { onClose(); setQuery(""); router.push(path); };

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape")    { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allItems.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && allItems[activeIdx]) navigateTo(allItems[activeIdx].path);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, allItems, activeIdx]);

  if (!isOpen) return null;

  const isEmpty = debouncedQuery.length >= 2 && !loading && allItems.length === 0;

  // Group items by type for section headers
  const sections: { type: string; items: typeof allItems }[] = [];
  for (const item of allItems) {
    const last = sections[sections.length - 1];
    if (last?.type === item.type) last.items.push(item);
    else sections.push({ type: item.type, items: [item] });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[6px]" />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#161f0f] rounded-2xl shadow-2xl border border-black/8 dark:border-white/8 overflow-hidden"
        style={{ animation: "searchIn 120ms cubic-bezier(0.16,1,0.3,1)" }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes searchIn{from{opacity:0;transform:scale(.97) translateY(-6px)}to{opacity:1;transform:none}}`}</style>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          {loading
            ? <Loader2 className="h-4 w-4 text-[#6b8a4e] shrink-0 animate-spin" />
            : <Search  className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            placeholder="Search products, customers, suppliers…"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none"
          />
          {query
            ? <button onClick={() => setQuery("")} className="p-1 rounded text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"><X className="h-3.5 w-3.5" /></button>
            : <kbd className="hidden sm:block text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 font-mono">esc</kbd>
          }
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-white/6" />

        {/* Body */}
        <div className="overflow-y-auto max-h-[54vh] overscroll-contain">
          {/* Empty state */}
          {!query && (
            <p className="py-10 text-center text-[13px] text-slate-400 dark:text-slate-600">
              Type to search…
            </p>
          )}
          {isEmpty && (
            <p className="py-10 text-center text-[13px] text-slate-400 dark:text-slate-600">
              No results for <span className="font-medium text-slate-600 dark:text-slate-400">&ldquo;{query}&rdquo;</span>
            </p>
          )}

          {/* Results */}
          {sections.map(section => (
            <div key={section.type}>
              {/* Section label */}
              <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                {TYPE_LABEL[section.type]}
              </div>

              {section.items.map(item => {
                const globalIdx = allItems.indexOf(item);
                const active = globalIdx === activeIdx;
                return (
                  <button
                    key={item.data.id}
                    onClick={() => navigateTo(item.path)}
                    onMouseEnter={() => setActiveIdx(globalIdx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      active
                        ? "bg-[#6b8a4e]/8 dark:bg-[#6b8a4e]/15"
                        : "hover:bg-slate-50 dark:hover:bg-white/4"
                    }`}
                  >
                    <span className={`shrink-0 ${active ? "text-[#6b8a4e]" : "text-slate-400 dark:text-slate-600"}`}>
                      {TYPE_ICON[item.type]}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{item.label}</span>
                      {item.sub && <span className="block text-[11px] text-slate-400 dark:text-slate-600 truncate mt-0.5">{item.sub}</span>}
                    </span>
                    {item.tag && (
                      <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-white/6 px-2 py-0.5 rounded-full">
                        {item.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Bottom padding */}
          {allItems.length > 0 && <div className="h-2" />}
        </div>
      </div>
    </div>
  );
}
