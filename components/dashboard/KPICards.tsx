"use client";

import React from "react";
import { SlidersHorizontal, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";

interface KPICardsProps {
  kpis: {
    totalInventoryValue: number;
    totalProducts: number;
    totalWarehouses: number;
    totalCustomers: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    pendingPurchaseOrders: number;
    pendingSalesOrders: number;
    pendingStockTransfers: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    ordersThisMonth: number;
    ordersLastMonth: number;
    customersThisMonth: number;
    customersLastMonth: number;
  };
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function KPICards({ kpis }: KPICardsProps) {
  const { t } = useTranslation();

  const orderChange = pctChange(kpis.ordersThisMonth, kpis.ordersLastMonth);
  const customerChange = pctChange(kpis.customersThisMonth, kpis.customersLastMonth);
  const revenueChange = pctChange(kpis.revenueThisMonth, kpis.revenueLastMonth);

  const pendingTotal = kpis.pendingSalesOrders + kpis.pendingPurchaseOrders + kpis.pendingStockTransfers;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Card 1: Total Orders (Dark) */}
      <div className="relative overflow-hidden rounded-[26px] bg-[#18181B] text-white p-6 shadow-premium flex flex-col justify-between min-h-[220px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">{t("kpi_total_orders")}</span>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {pendingTotal} pending
          </span>
        </div>

        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">{kpis.ordersThisMonth}</h2>
            <span className={`text-xs font-bold flex items-center ${orderChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {orderChange >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {Math.abs(orderChange)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{kpis.ordersLastMonth} {t("kpi_last_month")}</p>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Sales: {kpis.pendingSalesOrders}</span>
            <span>Purchase: {kpis.pendingPurchaseOrders}</span>
            <span>Transfer: {kpis.pendingStockTransfers}</span>
          </div>
          <div className="flex gap-1 h-2">
            {pendingTotal > 0 ? (
              <>
                <div
                  className="bg-emerald-500 rounded-full"
                  style={{ width: `${(kpis.pendingSalesOrders / pendingTotal) * 100}%` }}
                />
                <div
                  className="bg-blue-400 rounded-full"
                  style={{ width: `${(kpis.pendingPurchaseOrders / pendingTotal) * 100}%` }}
                />
                <div
                  className="bg-amber-400 rounded-full"
                  style={{ width: `${(kpis.pendingStockTransfers / pendingTotal) * 100}%` }}
                />
              </>
            ) : (
              <div className="bg-slate-700 rounded-full w-full" />
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800 rounded-xl p-2">
            <div className="text-sm font-black text-white">{kpis.totalProducts}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Products</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-2">
            <div className="text-sm font-black text-white">{kpis.totalWarehouses}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Warehouses</div>
          </div>
          <div className={`rounded-xl p-2 ${kpis.lowStockProducts > 0 ? "bg-amber-500/20" : "bg-slate-800"}`}>
            <div className={`text-sm font-black ${kpis.lowStockProducts > 0 ? "text-amber-400" : "text-white"}`}>
              {kpis.lowStockProducts}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">Low Stock</div>
          </div>
        </div>
      </div>

      {/* Card 2: Customers (Green) */}
      <div className="relative overflow-hidden rounded-[26px] bg-[#6b8a4e] text-white p-6 shadow-premium flex flex-col justify-between min-h-[220px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">{t("kpi_total_customers")}</span>
          <span className="text-[10px] font-bold text-white/70 bg-black/20 px-2 py-0.5 rounded-full">
            +{kpis.customersThisMonth} this month
          </span>
        </div>

        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black tracking-tight text-white">{kpis.totalCustomers.toLocaleString()}</h2>
            <span className={`text-xs font-bold flex items-center bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-xs ${customerChange >= 0 ? "text-white" : "text-red-200"}`}>
              {customerChange >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {customerChange >= 0 ? "+" : ""}{customerChange}%
            </span>
          </div>
          <p className="text-[11px] text-white/80 font-medium mt-0.5">{kpis.customersLastMonth} new {t("kpi_last_month")}</p>
        </div>

        <div className="mt-4 pt-4">
          <div className="flex h-10 w-full rounded-xl overflow-hidden shadow-sm border border-black/10">
            <div
              className="bg-white text-[#18181B] font-extrabold text-xs flex items-center justify-center transition-all"
              style={{ width: kpis.totalCustomers > 0 ? `${Math.max(15, Math.round((kpis.customersThisMonth / kpis.totalCustomers) * 100))}%` : "20%" }}
            >
              {kpis.totalCustomers > 0 ? Math.round((kpis.customersThisMonth / kpis.totalCustomers) * 100) : 0}%
            </div>
            <div className="bg-[#18181B] text-white font-extrabold text-xs flex items-center justify-center flex-1 transition-all">
              {kpis.totalCustomers > 0 ? 100 - Math.round((kpis.customersThisMonth / kpis.totalCustomers) * 100) : 100}%
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-white font-bold mt-2.5">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-white ring-1 ring-black/10" /> New
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#18181B]" /> Returning
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Revenue (Light) */}
      <div className="relative overflow-hidden rounded-[26px] bg-[#EBECEF] text-[#18181B] p-6 shadow-premium flex flex-col justify-between min-h-[220px] border border-slate-200/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">{t("kpi_total_revenue")}</span>
          <TrendingUp className="h-4 w-4 text-slate-400" />
        </div>

        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#18181B]">
              {formatCurrency(kpis.revenueThisMonth)}
            </h2>
            <span className={`text-xs font-bold flex items-center px-2 py-0.5 rounded-full ${
              revenueChange >= 0 ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100"
            }`}>
              {revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {revenueChange >= 0 ? "+" : ""}{revenueChange}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {formatCurrency(kpis.revenueLastMonth)} {t("kpi_last_month")}
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>Inventory Value</span>
            <span className="font-bold text-[#18181B]">{formatCurrency(kpis.totalInventoryValue)}</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>Out of Stock</span>
            <span className={`font-bold ${kpis.outOfStockProducts > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {kpis.outOfStockProducts} items
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#18181B] rounded-full transition-all"
              style={{
                width: kpis.revenueLastMonth > 0
                  ? `${Math.min(100, Math.round((kpis.revenueThisMonth / Math.max(kpis.revenueThisMonth, kpis.revenueLastMonth)) * 100))}%`
                  : kpis.revenueThisMonth > 0 ? "100%" : "0%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
