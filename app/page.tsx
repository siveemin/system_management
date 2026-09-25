"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { KPICards } from "@/components/dashboard/KPICards";
import { AnalyticsCharts, SidebarWidgets } from "@/components/dashboard/AnalyticsCharts";
import { RecentActivityTables } from "@/components/dashboard/RecentActivityTables";

interface DashboardData {
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
  monthlyData: { month: string; sales: number; purchases: number; revenue: number }[];
  categoryData: { name: string; count: number; pct: number }[];
  transactions: any[];
  products: any[];
  recentOrders: any[];
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 pb-12 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-[220px] rounded-[26px] bg-slate-200" />)}
        </div>
        <div className="h-72 rounded-[28px] bg-slate-200" />
        <div className="h-64 rounded-[28px] bg-slate-200" />
      </div>
    );
  }

  if (!data) return null;

  const lowStockCount = data.kpis.lowStockProducts + data.kpis.outOfStockProducts;

  return (
    <div className="space-y-5 pb-12">
      {lowStockCount > 0 && (
        <div className="rounded-[22px] border border-amber-300 bg-amber-50/90 p-3.5 px-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
            <span className="text-xs font-bold text-amber-950">
              {lowStockCount} {t("nav_low_stock")}
            </span>
          </div>
          <Link href="/low-stock">
            <button className="text-xs font-extrabold text-[#6b8a4e] hover:underline flex items-center gap-1 cursor-pointer">
              {t("page_low_stock_title")} <ArrowRight className="h-3 w-3" />
            </button>
          </Link>
        </div>
      )}

      <KPICards kpis={data.kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-5">
          <AnalyticsCharts monthlyData={data.monthlyData} />
          <RecentActivityTables
            products={data.products}
            recentOrders={data.recentOrders}
            transactions={data.transactions}
          />
        </div>
        <div className="lg:col-span-4">
          <SidebarWidgets categoryData={data.categoryData} />
        </div>
      </div>
    </div>
  );
}
