"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Plus,
} from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { KPICards } from "@/components/dashboard/KPICards";
import { AnalyticsCharts, SidebarWidgets } from "@/components/dashboard/AnalyticsCharts";
import { RecentActivityTables } from "@/components/dashboard/RecentActivityTables";
import { QuickActionsModal } from "@/components/dashboard/QuickActionsModal";
import { QuickCheckPanel } from "@/components/dashboard/QuickCheckPanel";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState({
    kpis: dataStore.getDashboardKPIs(),
    products: dataStore.getProducts(),
    customers: dataStore.getCustomers(),
    users: dataStore.getUsers(),
    purchaseOrders: dataStore.getPurchaseOrders(),
    salesOrders: dataStore.getSalesOrders(),
    stockTransfers: dataStore.getStockTransfers(),
    transactions: dataStore.getTransactions(),
    alerts: dataStore.getAlerts().filter((a) => a.status === "NEW"),
    currentUser: dataStore.getCurrentUser(),
    warehouses: dataStore.getWarehouses(),
    currentWarehouseId: dataStore.getCurrentWarehouseId(),
  });

  useEffect(() => {
    const update = () => {
      setData({
        kpis: dataStore.getDashboardKPIs(),
        products: dataStore.getProducts(),
        customers: dataStore.getCustomers(),
        users: dataStore.getUsers(),
        purchaseOrders: dataStore.getPurchaseOrders(),
        salesOrders: dataStore.getSalesOrders(),
        stockTransfers: dataStore.getStockTransfers(),
        transactions: dataStore.getTransactions(),
        alerts: dataStore.getAlerts().filter((a) => a.status === "NEW"),
        currentUser: dataStore.getCurrentUser(),
        warehouses: dataStore.getWarehouses(),
        currentWarehouseId: dataStore.getCurrentWarehouseId(),
      });
    };
    return dataStore.subscribe(update);
  }, []);

  return (
    <div className="space-y-5 pb-12">
      {/* Critical Alert Ribbon if stock deficit exists */}
      {data.alerts.length > 0 && (
        <div className="rounded-[22px] border border-amber-300 bg-amber-50/90 p-3.5 px-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
            <span className="text-xs font-bold text-amber-950">
              {data.alerts.length} {t("nav_low_stock")}
            </span>
          </div>
          <Link href="/low-stock">
            <button className="text-xs font-extrabold text-[#6b8a4e] hover:underline flex items-center gap-1 cursor-pointer">
              {t("page_low_stock_title")} <ArrowRight className="h-3 w-3" />
            </button>
          </Link>
        </div>
      )}

      {/* 1. Top KPI 3-Card Row (Exact Reference Design Colors & Contrast) */}
      <KPICards kpis={data.kpis} />

      {/* Quick Check — Stock / Customers / Employees */}
      <QuickCheckPanel
        products={data.products}
        customers={data.customers}
        users={data.users}
      />

      {/* 2. Main Two-Column Dashboard Layout (8 cols left / 4 cols right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 cols): Main Chart + Product Sales Table */}
        <div className="lg:col-span-8 space-y-5">
          {/* Main Dual-Pattern Bar Chart */}
          <AnalyticsCharts />

          {/* Product Sales / Active Inventory Table */}
          <RecentActivityTables
            products={data.products}
            purchaseOrders={data.purchaseOrders}
            salesOrders={data.salesOrders}
            stockTransfers={data.stockTransfers}
            transactions={data.transactions}
          />
        </div>

        {/* Right Column (4 cols): Top Categories + Sales by Country + Export Button */}
        <div className="lg:col-span-4">
          <SidebarWidgets />
        </div>
      </div>
    </div>
  );
}
