"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Package, DollarSign,
  ShoppingBag, ShoppingCart, AlertTriangle, Boxes,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#0d9488", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981", "#f97316", "#3b82f6"];

export default function ReportsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState(() => dataStore.getProducts());
  const [salesOrders, setSalesOrders] = useState(() => dataStore.getSalesOrders());
  const [purchaseOrders, setPurchaseOrders] = useState(() => dataStore.getPurchaseOrders());
  const [transactions, setTransactions] = useState(() => dataStore.getTransactions());
  const [categories, setCategories] = useState(() => dataStore.getCategories());
  const [suppliers, setSuppliers] = useState(() => dataStore.getSuppliers());
  const [customers, setCustomers] = useState(() => dataStore.getCustomers());
  const [kpis, setKpis] = useState(() => dataStore.getDashboardKPIs());

  useEffect(() => {
    return dataStore.subscribe(() => {
      setProducts(dataStore.getProducts());
      setSalesOrders(dataStore.getSalesOrders());
      setPurchaseOrders(dataStore.getPurchaseOrders());
      setTransactions(dataStore.getTransactions());
      setCategories(dataStore.getCategories());
      setSuppliers(dataStore.getSuppliers());
      setCustomers(dataStore.getCustomers());
      setKpis(dataStore.getDashboardKPIs());
    });
  }, []);

  // --- Derived data ---
  const totalSalesRevenue = salesOrders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((s, o) => s + o.totalAmount, 0);

  const totalPurchaseCost = purchaseOrders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((s, o) => s + o.totalAmount, 0);

  const topProductsByValue = [...products]
    .sort((a, b) => b.totalStock * b.costPrice - a.totalStock * a.costPrice)
    .slice(0, 8)
    .map((p) => ({ name: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name, value: p.totalStock * p.costPrice }));

  const stockByCategory = categories.map((cat) => {
    const catProducts = products.filter((p) => p.categoryId === cat.id);
    return { name: cat.name, value: catProducts.reduce((s, p) => s + p.totalStock * p.costPrice, 0), count: catProducts.length };
  }).filter((c) => c.value > 0);

  const txnByType = Object.entries(
    transactions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({
    name: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    count,
  })).sort((a, b) => b.count - a.count);

  const topCustomers = [...customers]
    .sort((a, b) => (b.totalSpent ?? 0) - (a.totalSpent ?? 0))
    .slice(0, 5);

  const topSuppliers = [...suppliers]
    .sort((a, b) => (b.totalPurchased ?? 0) - (a.totalPurchased ?? 0))
    .slice(0, 5);

  const lowStockProducts = products
    .filter((p) => p.totalStock <= p.minStockLevel)
    .sort((a, b) => a.totalStock - b.totalStock)
    .slice(0, 8);

  const kpiCards = [
    { labelKey: "rpt_inventory_value"    as const, value: formatCurrency(kpis.totalInventoryValue), icon: DollarSign,   color: "text-[#6b8a4e]",   bg: "bg-[#edf2ed] dark:bg-[#1a2a10]"       },
    { labelKey: "rpt_sales_revenue"      as const, value: formatCurrency(totalSalesRevenue),        icon: TrendingUp,   color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950"     },
    { labelKey: "rpt_buying_cost"        as const, value: formatCurrency(totalPurchaseCost),        icon: ShoppingBag,  color: "text-indigo-600",  bg: "bg-indigo-50 dark:bg-indigo-950"       },
    { labelKey: "rpt_total_products"     as const, value: kpis.totalProducts,                       icon: Package,      color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950"           },
    { labelKey: "rpt_low_stock_items"    as const, value: kpis.lowStockProducts,                    icon: AlertTriangle,color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950"         },
    { labelKey: "rpt_out_of_stock"       as const, value: kpis.outOfStockProducts,                  icon: TrendingDown, color: "text-red-600",     bg: "bg-red-50 dark:bg-red-950"             },
    { labelKey: "rpt_sales_orders_count" as const, value: salesOrders.length,                       icon: ShoppingCart, color: "text-purple-600",  bg: "bg-purple-50 dark:bg-purple-950"       },
    { labelKey: "rpt_stock_movements"    as const, value: transactions.length,                      icon: Boxes,        color: "text-orange-600",  bg: "bg-orange-50 dark:bg-orange-950"       },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-[#6b8a4e]" />
          {t("page_reports_title")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t("page_reports_sub")}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <div key={k.labelKey} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${k.bg}`}>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{k.value}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t(k.labelKey)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Stock Value */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">{t("page_reports_top_products")}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProductsByValue} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} width={80} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Value by Category */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">{t("page_reports_by_category")}</h2>
          {stockByCategory.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stockByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {stockByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Transaction Types */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">{t("page_reports_movements")}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={txnByType} margin={{ left: 0, right: 8 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {txnByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
            {t("page_reports_low_stock")}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-[10px] font-semibold">
              {lowStockProducts.length}
            </span>
          </h2>
          {lowStockProducts.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">All products are well-stocked.</div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                    <div className="text-[10px] text-slate-400">{p.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold ${p.totalStock === 0 ? "text-red-600" : "text-amber-600"}`}>
                      {p.totalStock} {p.uom}
                    </div>
                    <div className="text-[10px] text-slate-400">min {p.minStockLevel}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">{t("page_reports_top_customers")}</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left pb-2 font-semibold text-slate-500">Customer</th>
                <th className="text-right pb-2 font-semibold text-slate-500">Orders</th>
                <th className="text-right pb-2 font-semibold text-slate-500">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, i) => (
                <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-[#1a2a10] text-[#5a7840] dark:text-teal-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-slate-500">{c.salesOrdersCount ?? 0}</td>
                  <td className="py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">{formatCurrency(c.totalSpent ?? 0)}</td>
                </tr>
              ))}
              {topCustomers.length === 0 && (
                <tr><td colSpan={3} className="py-8 text-center text-slate-400">No customer data.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top Suppliers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">{t("page_reports_top_suppliers")}</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left pb-2 font-semibold text-slate-500">Supplier</th>
                <th className="text-right pb-2 font-semibold text-slate-500">Orders</th>
                <th className="text-right pb-2 font-semibold text-slate-500">Total Bought</th>
              </tr>
            </thead>
            <tbody>
              {topSuppliers.map((s, i) => (
                <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-slate-500">{s.purchaseOrdersCount ?? 0}</td>
                  <td className="py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">{formatCurrency(s.totalPurchased ?? 0)}</td>
                </tr>
              ))}
              {topSuppliers.length === 0 && (
                <tr><td colSpan={3} className="py-8 text-center text-slate-400">No supplier data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
