"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Warehouse, ShoppingBag, ShoppingCart, Truck, Users, X, ArrowRight } from "lucide-react";
import dataStore from "@/lib/store";
import { Modal } from "@/components/ui/modal";
import { useTranslation } from "@/lib/useTranslation";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const results = dataStore.globalSearch(query);
  const hasResults =
    results.products.length > 0 ||
    results.orders.length > 0 ||
    results.warehouses.length > 0 ||
    results.suppliers.length > 0 ||
    results.customers.length > 0;

  const navigateTo = (path: string) => {
    onClose();
    setQuery("");
    router.push(path);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("search_title")}
      description={t("search_desc")}
      size="lg"
    >
      <div className="space-y-4">
        {/* Search Bar Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-3 pl-11 pr-10 text-sm placeholder:text-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6b8a4e]/20 text-slate-900 dark:text-slate-100"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
          {query && !hasResults && (
            <div className="py-12 text-center text-slate-500">
              <Package className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
              <p className="text-sm font-medium">{t("search_no_results")} &quot;{query}&quot;</p>
              <p className="text-xs text-slate-400 mt-1">{t("search_try_sku")}</p>
            </div>
          )}

          {/* Products */}
          {results.products.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t("search_cat_products")}
              </div>
              <div className="space-y-1">
                {results.products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigateTo(`/products?search=${encodeURIComponent(p.sku)}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-teal-50 dark:bg-teal-950 text-[#6b8a4e] dark:text-teal-400">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#6b8a4e]">
                          {p.name}
                        </div>
                        <div className="text-xs text-slate-500 flex gap-2">
                          <span>SKU: {p.sku}</span>
                          {p.barcode && <span>• Barcode: {p.barcode}</span>}
                          <span>• Stock: {p.totalStock} {p.uom}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {results.orders.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t("search_cat_orders")}
              </div>
              <div className="space-y-1">
                {results.orders.map((o: any) => (
                  <button
                    key={o.id}
                    onClick={() =>
                      navigateTo(
                        o.orderNumber.startsWith("PO")
                          ? `/purchase-orders?search=${encodeURIComponent(o.orderNumber)}`
                          : `/sales-orders?search=${encodeURIComponent(o.orderNumber)}`
                      )
                    }
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {o.orderNumber.startsWith("PO") ? (
                          <ShoppingBag className="h-4 w-4" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600">
                          {o.orderNumber}
                        </div>
                        <div className="text-xs text-slate-500">
                          {o.supplierName ? `Supplier: ${o.supplierName}` : `Customer: ${o.customerName}`} • Status: {o.status}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warehouses */}
          {results.warehouses.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t("page_warehouses_title")}
              </div>
              <div className="space-y-1">
                {results.warehouses.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => navigateTo(`/warehouses`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        <Warehouse className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {w.name} ({w.code})
                        </div>
                        <div className="text-xs text-slate-500">{w.city}, {w.country}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
