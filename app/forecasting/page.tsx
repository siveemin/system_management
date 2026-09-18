"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  Calendar,
  Sparkles,
  AlertCircle,
  ShoppingBag,
  RefreshCw,
  Clock,
  ArrowRight,
} from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { ForecastDTO, ProductDTO } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function ForecastingPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductDTO[]>(dataStore.getProducts());
  const [forecasts, setForecasts] = useState<ForecastDTO[]>(dataStore.getForecasts());
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const [currentForecast, setCurrentForecast] = useState<ForecastDTO | null>(null);

  useEffect(() => {
    const update = () => {
      const prods = dataStore.getProducts();
      setProducts(prods);
      const fcs = dataStore.getForecasts();
      setForecasts(fcs);
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id);
      }
    };
    return dataStore.subscribe(update);
  }, [selectedProductId]);

  useEffect(() => {
    if (selectedProductId) {
      let fc = dataStore.getForecasts().find((f) => f.productId === selectedProductId);
      if (!fc) {
        fc = dataStore.calculateForecast(selectedProductId);
      }
      setCurrentForecast(fc || null);
    }
  }, [selectedProductId, forecasts]);

  const handleRecalculate = () => {
    if (selectedProductId) {
      const fresh = dataStore.calculateForecast(selectedProductId);
      if (fresh) setCurrentForecast(fresh);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Combined trend data for Recharts
  const chartData = [
    ...(currentForecast?.historicalSalesTrend.map((h) => ({
      period: h.date,
      historical: h.quantity,
      forecast: null,
    })) || []),
    ...(currentForecast?.projectedSalesTrend.map((p) => ({
      period: p.date,
      historical: null,
      forecast: p.quantity,
    })) || []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_forecasting_title")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            className="gap-2 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#6b8a4e]" /> Recompute Model
          </Button>
        </div>
      </div>

      {/* Product Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Analyze Catalog Product:
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) &mdash; Stock: {p.totalStock} {p.uom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentForecast && (
        <div className="space-y-6">
          {/* Key Forecast Predictive Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-5">
                <span className="text-xs font-semibold text-slate-500">Average Daily Velocity</span>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {currentForecast.dailyAvgSales} units/day
                </div>
                <p className="text-[11px] text-[#6b8a4e] mt-1">Moving 7-day consumption</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-5">
                <span className="text-xs font-semibold text-slate-500">Predicted 7-Day Demand</span>
                <div className="text-2xl font-bold text-[#6b8a4e] mt-1">
                  {currentForecast.predictedDemand7d} units
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  30-Day: <strong>{currentForecast.predictedDemand30d} units</strong>
                </p>
              </CardContent>
            </Card>

            <Card className={`border-slate-200 dark:border-slate-800 ${
              currentForecast.estimatedDaysRemaining < 14
                ? "border-rose-300 dark:border-rose-900 bg-rose-50/20"
                : ""
            }`}>
              <CardContent className="p-5">
                <span className="text-xs font-semibold text-slate-500">Estimated Days Remaining</span>
                <div className={`text-2xl font-bold mt-1 ${
                  currentForecast.estimatedDaysRemaining < 14 ? "text-rose-600" : "text-emerald-600"
                }`}>
                  {currentForecast.estimatedDaysRemaining} Days
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Before total stock depletion
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-[#edf2ed]/40 dark:bg-[#1a2a10]/20">
              <CardContent className="p-5">
                <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                  Recommended Reorder Qty
                </span>
                <div className="text-2xl font-bold text-[#5a7840] dark:text-teal-300 mt-1">
                  {currentForecast.recommendedReorderQty} units
                </div>
                <Link
                  href={`/purchase-orders?action=new&productId=${currentForecast.productId}`}
                  className="text-[11px] font-bold text-[#6b8a4e] dark:text-teal-400 hover:underline inline-flex items-center gap-1 mt-1"
                >
                  Create Replenishment PO <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Forecast & Trend Chart */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#6b8a4e]" />
                    Historical Sales vs. 7-Day Projected Trajectory
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Linear trendline projections based on recent fulfillment transaction intervals
                  </CardDescription>
                </div>
                <span className="text-[10px] text-slate-400 italic">
                  Calculated: {formatDateTime(currentForecast.calculatedAt)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        color: "#fff",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                    <Line
                      type="monotone"
                      dataKey="historical"
                      name={t("forecast_historical") as any}
                      stroke="#0f766e"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#0f766e" }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name={t("forecast_projected") as any}
                      stroke="#f59e0b"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: "#f59e0b" }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Forecast Summary Note */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-[#6b8a4e] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Machine-Assisted Reordering Analysis
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Current stock is <strong>{currentForecast.currentStock} units</strong>. With a daily burn rate of{" "}
                <strong>{currentForecast.dailyAvgSales} units</strong>, inventory is estimated to sustain operations for{" "}
                <strong>{currentForecast.estimatedDaysRemaining} days</strong>. An order of{" "}
                <strong>{currentForecast.recommendedReorderQty} units</strong> is recommended to maintain the minimum threshold of{" "}
                <strong>{selectedProduct?.minStockLevel || 10} units</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
