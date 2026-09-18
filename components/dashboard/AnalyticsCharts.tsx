"use client";

import React, { useState } from "react";
import { SlidersHorizontal, ArrowUpRight, ArrowDownRight, Upload, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";

export function AnalyticsCharts() {
  const { t } = useTranslation();
  const [categoryTimeRange, setCategoryTimeRange] = useState<"all" | "weekly" | "monthly">("monthly");
  const [countryTimeRange, setCountryTimeRange] = useState<"all" | "weekly" | "monthly">("all");

  const monthlyOrders = [
    { monthKey: "month_jan" as const, solid: 45, striped: 35 },
    { monthKey: "month_feb" as const, solid: 55, striped: 25 },
    { monthKey: "month_mar" as const, solid: 65, striped: 30 },
    { monthKey: "month_apr" as const, solid: 40, striped: 35 },
    { monthKey: "month_may" as const, solid: 50, striped: 40 },
    { monthKey: "month_jun" as const, solid: 25, striped: 75, active: true },
    { monthKey: "month_jul" as const, solid: 60, striped: 40 },
    { monthKey: "month_aug" as const, solid: 45, striped: 20 },
    { monthKey: "month_sep" as const, solid: 35, striped: 30 },
    { monthKey: "month_oct" as const, solid: 65, striped: 30 },
    { monthKey: "month_nov" as const, solid: 55, striped: 35 },
    { monthKey: "month_dec" as const, solid: 30, striped: 35 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Main Large Chart: Total Orders Dual-Pattern Bar Visualizer (Pure White Background) */}
      <div className="border border-slate-200/80 bg-white p-6 rounded-[28px] shadow-premium">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-base font-bold text-[#18181B]">
            {t("chart_total_orders")}
          </h3>

          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-800 bg-white" /> {t("kpi_income")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#18181B]" /> {t("kpi_profit")}
              </span>
            </div>

            {/* Filter icon button */}
            <button className="text-slate-400 hover:text-slate-900 p-1 cursor-pointer transition-colors">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Dual-Pattern Bar Chart Area */}
        <div className="relative h-64 w-full flex items-end justify-between gap-2 pt-10 px-2 pb-2">
          {monthlyOrders.map((bar) => {
            if (bar.active) {
              return (
                <div key={bar.monthKey} className="relative flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Floating Dark Tooltip Box */}
                  <div className="absolute -top-10 z-20 whitespace-nowrap rounded-xl bg-[#18181B] text-white p-2 text-[10px] shadow-xl flex flex-col gap-0.5">
                    <span className="font-bold text-white">Jun, 09</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" /> {t("chart_sold")} 30
                      </span>
                      <span className="flex items-center gap-1 text-[#6b8a4e] font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#6b8a4e]" /> {t("chart_return")} 15
                      </span>
                    </div>
                  </div>

                  {/* Active Dual Colored Box */}
                  <div className="w-full max-w-[54px] rounded-xl overflow-hidden border-2 border-[#18181B] shadow-sm flex flex-col h-[75%]">
                    {/* Top White Area */}
                    <div className="bg-white text-[#18181B] font-extrabold text-[11px] flex items-center justify-center flex-1 border-b border-slate-200">
                      75%
                    </div>
                    {/* Bottom Orange Area */}
                    <div className="bg-[#6b8a4e] text-white font-extrabold text-[11px] flex items-center justify-center h-[35%]">
                      25%
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-[#6b8a4e] mt-2">{t(bar.monthKey)}</span>
                </div>
              );
            }

            return (
              <div key={bar.monthKey} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                {/* Regular Dual Bar: Hatched Top + Solid Black Bottom */}
                <div className="w-full max-w-[28px] flex flex-col items-center justify-end h-full">
                  {/* Top Hatched Segment */}
                  <div
                    style={{ height: `${bar.striped}%` }}
                    className="w-full rounded-t-md bg-stripe-pattern group-hover:opacity-100 transition-opacity"
                  />
                  {/* Bottom Solid Black Segment */}
                  <div
                    style={{ height: `${bar.solid}%` }}
                    className="w-full bg-[#18181B] group-hover:bg-[#6b8a4e] transition-colors"
                  />
                </div>
                <span className="text-[11px] text-slate-500 font-semibold mt-2 group-hover:text-slate-900 transition-colors">
                  {t(bar.monthKey)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SidebarWidgets() {
  const { t } = useTranslation();
  const [categoryTab, setCategoryTab] = useState<"all" | "weekly" | "monthly">("monthly");
  const [countryTab, setCountryTab] = useState<"all" | "weekly" | "monthly">("all");

  const countryData = [
    { country: "USA", pct: "25%", h: "100%" },
    { country: "Japan", pct: "22%", h: "88%" },
    { country: "UK", pct: "20%", h: "80%" },
    { country: "Korea", pct: "18%", h: "72%" },
    { country: "Spain", pct: "15%", h: "60%" },
  ];

  return (
    <div className="space-y-5">
      {/* Widget 1: Top Categories Segmented Donut Chart (Pure White Background) */}
      <div className="border border-slate-200/80 bg-white p-6 rounded-[28px] shadow-premium">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#18181B]">{t("chart_top_categories")}</h3>
          <button className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {/* Custom Segmented Pie/Rose Visualizer */}
        <div className="relative flex items-center justify-center my-4">
          <div className="relative h-44 w-44">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90 overflow-visible">
              <defs>
                <pattern id="pieHatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#FF481F" strokeWidth="2.5" />
                </pattern>
              </defs>

              {/* Slice 1: 35% Solid Dark */}
              <circle
                cx="100"
                cy="100"
                r="65"
                fill="none"
                stroke="#18181B"
                strokeWidth="38"
                strokeDasharray="143 266"
                strokeDashoffset="0"
              />

              {/* Slice 2: 20% Vibrant Orange */}
              <circle
                cx="100"
                cy="100"
                r="65"
                fill="none"
                stroke="#FF481F"
                strokeWidth="38"
                strokeDasharray="82 327"
                strokeDashoffset="-148"
              />

              {/* Slice 3: 10% Light Gray */}
              <circle
                cx="100"
                cy="100"
                r="65"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="38"
                strokeDasharray="41 368"
                strokeDashoffset="-234"
              />

              {/* Slice 4: 23% Hatched Pattern */}
              <circle
                cx="100"
                cy="100"
                r="65"
                fill="none"
                stroke="url(#pieHatch)"
                strokeWidth="38"
                strokeDasharray="94 315"
                strokeDashoffset="-279"
              />

              {/* Slice 5: 12% Soft White/Gray */}
              <circle
                cx="100"
                cy="100"
                r="65"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="38"
                strokeDasharray="49 360"
                strokeDashoffset="-377"
              />
            </svg>

            {/* In-Slice Floating Percentage Badges */}
            <span className="absolute top-6 left-16 text-[10px] font-extrabold text-white z-10">35%</span>
            <span className="absolute top-12 right-6 text-[10px] font-extrabold text-white z-10">20%</span>
            <span className="absolute bottom-16 right-6 text-[10px] font-extrabold text-slate-700 z-10">10%</span>
            <span className="absolute bottom-6 left-16 text-[10px] font-extrabold text-[#6b8a4e] z-10">23%</span>
            <span className="absolute top-14 left-4 text-[10px] font-extrabold text-slate-700 z-10">12%</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-slate-700 mt-2">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#6b8a4e]" /> {t("chart_cat_tshirts")}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#18181B]" /> {t("chart_cat_hoodies")}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-300 ring-1 ring-slate-400" /> {t("chart_cat_jeans")}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-400" /> {t("chart_cat_jackets")}
          </span>
        </div>

        {/* Time Filter Pill Selector */}
        <div className="flex items-center justify-center gap-1 bg-[#F4F5F8] p-1 rounded-full mt-4 border border-slate-200/60">
          <button
            onClick={() => setCategoryTab("all")}
            className={`flex-1 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
              categoryTab === "all"
                ? "bg-[#6b8a4e] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("chart_all_time")}
          </button>
          <button
            onClick={() => setCategoryTab("weekly")}
            className={`flex-1 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
              categoryTab === "weekly"
                ? "bg-[#6b8a4e] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("chart_weekly")}
          </button>
          <button
            onClick={() => setCategoryTab("monthly")}
            className={`flex-1 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
              categoryTab === "monthly"
                ? "bg-[#6b8a4e] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("chart_monthly")}
          </button>
        </div>
      </div>

      {/* Widget 2: Sales by Country / Distribution Bar Chart (Pure White Background) */}
      <div className="border border-slate-200/80 bg-white p-6 rounded-[28px] shadow-premium">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#18181B]">{t("chart_sales_country")}</h3>
          <button className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {/* Vertical Solid Black Columns */}
        <div className="h-36 flex items-end justify-between gap-3 px-2 pt-6">
          {countryData.map((c) => (
            <div key={c.country} className="flex-1 flex flex-col items-center h-full justify-end group">
              <span className="text-[10px] font-bold text-[#18181B] mb-1">
                {c.pct}
              </span>
              <div
                style={{ height: c.h }}
                className="w-full max-w-[14px] bg-[#18181B] rounded-t-md group-hover:bg-[#6b8a4e] transition-colors"
              />
              <span className="text-[10px] font-semibold text-slate-500 mt-2">
                {c.country}
              </span>
            </div>
          ))}
        </div>

        {/* Time Filter Pill Selector */}
        <div className="flex items-center justify-center gap-1 bg-[#F4F5F8] p-1 rounded-full mt-5 border border-slate-200/60">
          <button
            onClick={() => setCountryTab("all")}
            className={`flex-1 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
              countryTab === "all"
                ? "bg-[#6b8a4e] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All time
          </button>
          <button
            onClick={() => setCountryTab("weekly")}
            className={`flex-1 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
              countryTab === "weekly"
                ? "bg-[#6b8a4e] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setCountryTab("monthly")}
            className={`flex-1 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
              countryTab === "monthly"
                ? "bg-[#6b8a4e] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Widget 3: Full Width Dark Action Button */}
      <button
        onClick={() => {
          window.location.href = "/reports";
        }}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#18181B] text-white text-xs font-bold hover:bg-[#27272A] transition-all shadow-md cursor-pointer select-none active:scale-[0.98]"
      >
        <Upload className="h-4 w-4" />
        {t("chart_export_stats")}
      </button>
    </div>
  );
}
