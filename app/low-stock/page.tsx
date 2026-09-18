"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  PackageX,
  CheckCircle2,
  Eye,
  ShoppingBag,
  SlidersHorizontal,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { LowStockAlertDTO } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export default function LowStockPage() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<LowStockAlertDTO[]>(dataStore.getAlerts());
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  useEffect(() => {
    const update = () => {
      setAlerts(dataStore.getAlerts());
    };
    return dataStore.subscribe(update);
  }, []);

  const handleResolveAlert = (alertId: string) => {
    dataStore.resolveAlert(alertId);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === "ALL") return true;
    return a.status === filterStatus;
  });

  const criticalCount = alerts.filter((a) => a.currentQuantity === 0 && a.status !== "RESOLVED").length;
  const warningCount = alerts.filter((a) => a.currentQuantity > 0 && a.status !== "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            {t("page_low_stock_title")}
          </h1>
        </div>
      </div>

      {/* Overview Metric Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                Out of Stock (Zero Units)
              </span>
              <div className="text-2xl font-bold text-rose-800 dark:text-rose-200 mt-1">
                {criticalCount} SKUs
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                Immediate stockout interruption
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
              <PackageX className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Below Minimum Safety
              </span>
              <div className="text-2xl font-bold text-amber-800 dark:text-amber-200 mt-1">
                {warningCount} SKUs
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                Approaching depletion threshold
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Resolved Alerts
              </span>
              <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mt-1">
                {alerts.filter((a) => a.status === "RESOLVED").length} Items
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Restocked and replenished
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterStatus === "ALL"
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          All Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setFilterStatus("NEW")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterStatus === "NEW"
              ? "bg-amber-600 text-white"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Active Open ({alerts.filter((a) => a.status === "NEW").length})
        </button>
        <button
          onClick={() => setFilterStatus("RESOLVED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterStatus === "RESOLVED"
              ? "bg-emerald-600 text-white"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Resolved ({alerts.filter((a) => a.status === "RESOLVED").length})
        </button>
      </div>

      {/* Alerts Table */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Current Qty</th>
                <th className="py-3 px-4">Safety Minimum</th>
                <th className="py-3 px-4">Shortage Deficit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Restock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No low stock alerts in this view. Inventory levels are healthy!
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const isOut = alert.currentQuantity === 0;
                  return (
                    <tr
                      key={alert.id}
                      className={
                        alert.status === "RESOLVED"
                          ? "opacity-60 hover:bg-slate-50/30"
                          : isOut
                          ? "bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/40"
                          : "hover:bg-amber-50/20 dark:hover:bg-amber-950/10"
                      }
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {alert.productName}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <div>{alert.productSku}</div>
                        {alert.barcode && (
                          <div className="text-[10px] text-slate-400">{alert.barcode}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {alert.warehouseName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            isOut
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {alert.currentQuantity} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {alert.minStockLevel} units
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-600">
                        -{alert.shortageQuantity} units
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={alert.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/purchase-orders?action=new&productId=${alert.productId}`}>
                            <Button
                              size="sm"
                              className="h-7 text-[11px] gap-1 bg-[#6b8a4e] hover:bg-[#5a7840] text-white font-semibold"
                            >
                              <ShoppingBag className="h-3 w-3" /> {t("page_low_stock_reorder")}
                            </Button>
                          </Link>
                          {alert.status !== "RESOLVED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveAlert(alert.id)}
                              className="h-7 text-[11px] text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
