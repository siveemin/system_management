"use client";

import React, { useState } from "react";
import { SlidersHorizontal, ArrowUpRight, Upload } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";

interface MonthlyPoint {
  month: string;
  sales: number;
  purchases: number;
  revenue: number;
}

interface CategoryPoint {
  name: string;
  count: number;
  pct: number;
}

export function AnalyticsCharts({ monthlyData }: { monthlyData: MonthlyPoint[] }) {
  const { t } = useTranslation();

  const maxVal = Math.max(...monthlyData.map((d) => d.sales + d.purchases), 1);
  const currentMonth = monthlyData[monthlyData.length - 1];

  return (
    <div className="border border-slate-200/80 bg-white p-6 rounded-[28px] shadow-premium">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-[#18181B]">{t("chart_total_orders")}</h3>
          {currentMonth && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              {currentMonth.month}: {currentMonth.sales} sales · {currentMonth.purchases} purchases · {formatCurrency(currentMonth.revenue)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#18181B]" /> Sales
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-[#6b8a4e] bg-white" /> Purchase
            </span>
          </div>
          <button className="text-slate-400 hover:text-slate-900 p-1 cursor-pointer transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative h-56 w-full flex items-end justify-between gap-1.5 px-2 pb-2">
        {monthlyData.map((bar, i) => {
          const isActive = i === monthlyData.length - 1;
          const salesH = maxVal > 0 ? Math.round((bar.sales / maxVal) * 100) : 0;
          const purchaseH = maxVal > 0 ? Math.round((bar.purchases / maxVal) * 100) : 0;
          const totalH = Math.max(salesH + purchaseH, bar.sales + bar.purchases > 0 ? 4 : 0);

          return (
            <div key={bar.month} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
              {isActive && (bar.sales > 0 || bar.purchases > 0) && (
                <div className="absolute -top-2 z-20 whitespace-nowrap rounded-xl bg-[#18181B] text-white p-2 text-[10px] shadow-xl flex flex-col gap-0.5 pointer-events-none">
                  <span className="font-bold">{bar.month}</span>
                  <span className="text-slate-200">Sales: {bar.sales} · Purchase: {bar.purchases}</span>
                </div>
              )}
              <div className="w-full flex flex-col items-center justify-end h-[90%]">
                {(bar.sales > 0 || bar.purchases > 0) ? (
                  <div
                    className={`w-full max-w-[32px] rounded-t-md overflow-hidden flex flex-col transition-all ${isActive ? "ring-2 ring-[#6b8a4e]" : ""}`}
                    style={{ height: `${Math.max(totalH, 4)}%` }}
                  >
                    {bar.purchases > 0 && (
                      <div
                        className="w-full bg-[#6b8a4e]/40 border-b border-white/30"
                        style={{ height: purchaseH > 0 && totalH > 0 ? `${Math.round((purchaseH / totalH) * 100)}%` : "30%" }}
                      />
                    )}
                    <div className={`w-full flex-1 ${isActive ? "bg-[#18181B]" : "bg-[#18181B] group-hover:bg-[#6b8a4e]"} transition-colors`} />
                  </div>
                ) : (
                  <div className="w-full max-w-[32px] h-1 bg-slate-100 rounded-full" />
                )}
              </div>
              <span className={`text-[9px] font-semibold mt-1.5 transition-colors ${isActive ? "text-[#6b8a4e] font-bold" : "text-slate-400 group-hover:text-slate-700"}`}>
                {bar.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CATEGORY_COLORS = ["#18181B", "#6b8a4e", "#3b82f6", "#f59e0b", "#ef4444"];

export function SidebarWidgets({ categoryData }: { categoryData: CategoryPoint[] }) {
  const { t } = useTranslation();
  const [categoryTab, setCategoryTab] = useState<"all" | "weekly" | "monthly">("all");
  const [countryTab, setCountryTab] = useState<"all" | "weekly" | "monthly">("all");

  const totalCount = categoryData.reduce((s, c) => s + c.count, 0);

  // Build donut segments
  let offset = 0;
  const circumference = 2 * Math.PI * 65;
  const segments = categoryData.map((cat, i) => {
    const dashArray = totalCount > 0 ? (cat.pct / 100) * circumference : 0;
    const dashOffset = -offset;
    offset += dashArray + 2;
    return { ...cat, dashArray, dashOffset, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] };
  });

  return (
    <div className="space-y-5">
      {/* Widget 1: Top Categories */}
      <div className="border border-slate-200/80 bg-white p-6 rounded-[28px] shadow-premium">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#18181B]">{t("chart_top_categories")}</h3>
          <button className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {totalCount > 0 ? (
          <>
            <div className="relative flex items-center justify-center my-2">
              <div className="relative h-44 w-44">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {segments.map((seg, i) => (
                    <circle
                      key={i}
                      cx="100" cy="100" r="65"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="36"
                      strokeDasharray={`${seg.dashArray} ${circumference}`}
                      strokeDashoffset={seg.dashOffset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-[#18181B]">{totalCount}</span>
                  <span className="text-[10px] text-slate-400">products</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-slate-700 mt-2">
              {segments.map((seg, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: seg.color }} />
                  {seg.name} ({seg.pct}%)
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-slate-400 text-xs py-8">No categories yet</div>
        )}

        <div className="flex items-center justify-center gap-1 bg-[#F4F5F8] p-1 rounded-full mt-4 border border-slate-200/60">
          {(["all", "weekly", "monthly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCategoryTab(tab)}
              className={`flex-1 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                categoryTab === tab ? "bg-[#6b8a4e] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "all" ? t("chart_all_time") : tab === "weekly" ? t("chart_weekly") : t("chart_monthly")}
            </button>
          ))}
        </div>
      </div>

      {/* Widget 2: Inventory Status */}
      <div className="border border-slate-200/80 bg-white p-6 rounded-[28px] shadow-premium">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#18181B]">Inventory Status</h3>
          <button className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {categoryData.length > 0 ? categoryData.map((cat, i) => (
            <div key={cat.name} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 truncate">{cat.name}</span>
                  <span className="font-bold text-[#18181B] ml-2">{cat.count}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.pct}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center text-slate-400 text-xs py-4">No data</div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1 bg-[#F4F5F8] p-1 rounded-full mt-5 border border-slate-200/60">
          {(["all", "weekly", "monthly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCountryTab(tab)}
              className={`flex-1 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                countryTab === tab ? "bg-[#6b8a4e] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "all" ? "All time" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => { window.location.href = "/reports"; }}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#18181B] text-white text-xs font-bold hover:bg-[#27272A] transition-all shadow-md cursor-pointer select-none active:scale-[0.98]"
      >
        <Upload className="h-4 w-4" />
        {t("chart_export_stats")}
      </button>
    </div>
  );
}
