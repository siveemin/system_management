"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";

interface RecentActivityTablesProps {
  products: any[];
  recentOrders: any[];
  transactions: any[];
}

const AVATAR_COLORS = [
  { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
  { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200"   },
  { bg: "bg-emerald-100",text: "text-emerald-700",border: "border-emerald-200"},
  { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200"  },
  { bg: "bg-rose-100",   text: "text-rose-700",   border: "border-rose-200"   },
  { bg: "bg-cyan-100",   text: "text-cyan-700",   border: "border-cyan-200"   },
];

function getProductColor(name: string) {
  const idx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function RecentActivityTables({ products, recentOrders, transactions }: RecentActivityTablesProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "transactions">("products");

  return (
    <div className="border border-slate-200/80 bg-white rounded-[28px] shadow-premium overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3 flex-wrap gap-y-2">
          <h3 className="text-base font-bold text-[#18181B]">{t("table_product_sales")}</h3>
          <div className="flex items-center gap-1 bg-[#F4F5F8] p-1 rounded-full text-xs font-semibold border border-slate-200/60">
            {([
              ["products",     t("table_top_items")],
              ["orders",       t("table_recent_orders")],
              ["transactions", t("table_ledger_feed")],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  activeTab === tab ? "bg-[#18181B] text-white shadow-xs font-bold" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Link href="/products" className="text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="overflow-x-auto px-6 pb-6">
        {activeTab === "products" && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-normal">{t("table_col_item")}</th>
                <th className="pb-3 font-normal text-center">{t("label_stock")}</th>
                <th className="pb-3 font-normal text-right">{t("label_cost")}</th>
                <th className="pb-3 font-normal text-center">{t("label_margin")}</th>
                <th className="pb-3 font-normal text-right">{t("label_price")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">No products found</td></tr>
              ) : products.map((item) => {
                const margin = item.sellingPrice > 0
                  ? Math.round(((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100)
                  : 0;
                const color = getProductColor(item.name);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black border ${color.bg} ${color.text} ${color.border} shrink-0`}>
                            {getInitials(item.name)}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-[#18181B] block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`font-bold ${item.totalAvailable <= item.minStockLevel ? "text-amber-600" : "text-slate-800"}`}>
                        {item.totalAvailable}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400 text-right line-through font-medium">{formatCurrency(item.costPrice)}</td>
                    <td className="py-3.5 text-center">
                      <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">{margin}%</span>
                    </td>
                    <td className="py-3.5 font-bold text-[#18181B] text-right">{formatCurrency(item.sellingPrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === "orders" && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-normal">{t("table_col_order_num")}</th>
                <th className="pb-3 font-normal">{t("table_col_cust_supplier")}</th>
                <th className="pb-3 font-normal">Type</th>
                <th className="pb-3 font-normal">{t("table_col_amount")}</th>
                <th className="pb-3 font-normal text-right">{t("label_status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">No orders yet</td></tr>
              ) : recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-mono font-bold text-[#18181B]">{o.orderNumber}</td>
                  <td className="py-3 font-semibold text-slate-800">{o.partyName}</td>
                  <td className="py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      o.type === "SALES" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {o.type}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-[#18181B]">{formatCurrency(o.totalAmount)}</td>
                  <td className="py-3 text-right"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "transactions" && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-normal">{t("table_col_txn_num")}</th>
                <th className="pb-3 font-normal">{t("table_col_item")}</th>
                <th className="pb-3 font-normal">{t("label_type")}</th>
                <th className="pb-3 font-normal">{t("table_col_change")}</th>
                <th className="pb-3 font-normal text-right">{t("label_date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">No transactions yet</td></tr>
              ) : transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-mono font-bold text-[#18181B]">{txn.transactionNumber}</td>
                  <td className="py-3 font-semibold text-slate-800">{txn.productName}</td>
                  <td className="py-3 font-mono uppercase text-[10px] font-bold text-slate-600">{txn.type.replace(/_/g, " ")}</td>
                  <td className="py-3 font-bold">
                    <span className={txn.quantityChange > 0 ? "text-emerald-600" : "text-red-500"}>
                      {txn.quantityChange > 0 ? `+${txn.quantityChange}` : txn.quantityChange}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-right">{formatDateTime(txn.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
