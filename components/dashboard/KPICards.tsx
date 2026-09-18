"use client";

import React from "react";
import { SlidersHorizontal, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";

interface KPICardsProps {
  kpis: {
    totalInventoryValue: number;
    totalProducts: number;
    totalWarehouses: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    pendingPurchaseOrders: number;
    pendingSalesOrders: number;
    pendingStockTransfers: number;
  };
}

export function KPICards({ kpis }: KPICardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Dark Onyx Card - Total Orders */}
      <div className="relative overflow-hidden rounded-[26px] bg-[#18181B] text-white p-6 shadow-premium flex flex-col justify-between min-h-[220px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">{t("kpi_total_orders")}</span>
          <button className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">$14.085</h2>
            <span className="text-xs font-bold text-[#6b8a4e] flex items-center">
              <ArrowDownRight className="h-3 w-3 mr-0.5" /> 10%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">$15.650 {t("kpi_last_month")}</p>
        </div>

        <div className="relative mt-4 pt-2">
          <div className="absolute right-12 top-0 -translate-y-1/2 rounded-full bg-white text-[#18181B] px-2.5 py-0.5 text-[10px] font-bold shadow-md flex items-center gap-1 z-10">
            $1210.6
          </div>
          <div className="w-full h-14 relative flex items-end">
            <svg viewBox="0 0 240 50" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="180" y1="10" x2="180" y2="48" stroke="#ffffff" strokeOpacity="0.4" strokeDasharray="2 2" />
              <path d="M 0 45 Q 30 42 60 25 T 120 32 T 180 10 T 240 38 L 240 50 L 0 50 Z" fill="url(#waveGrad)" />
              <path d="M 0 45 Q 30 42 60 25 T 120 32 T 180 10 T 240 38" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="180" cy="10" r="3.5" fill="#ffffff" />
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
            <span>1Feb</span><span>8Feb</span><span>16Feb</span><span>25Feb</span><span>30Feb</span>
          </div>
        </div>
      </div>

      {/* 2. Green Card - Total Customers */}
      <div className="relative overflow-hidden rounded-[26px] bg-[#6b8a4e] text-white p-6 shadow-premium flex flex-col justify-between min-h-[220px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">{t("kpi_total_customers")}</span>
          <button className="text-white hover:text-white/80 transition-colors cursor-pointer">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black tracking-tight text-white">1.222</h2>
            <span className="text-xs font-bold text-white flex items-center bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +79%
            </span>
          </div>
          <p className="text-[11px] text-white/90 font-medium mt-0.5">683 {t("kpi_last_month")}</p>
        </div>

        <div className="mt-4 pt-4">
          <div className="flex h-10 w-full rounded-xl overflow-hidden shadow-sm border border-black/10">
            <div className="bg-white text-[#18181B] font-extrabold text-xs flex items-center justify-center w-[25%] transition-all">23%</div>
            <div className="bg-[#18181B] text-white font-extrabold text-xs flex items-center justify-center flex-1 transition-all">77%</div>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-white font-bold mt-2.5">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-white ring-1 ring-black/10" /> {t("kpi_men")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#18181B]" /> {t("kpi_women")}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Light Card - Total Revenue */}
      <div className="relative overflow-hidden rounded-[26px] bg-[#EBECEF] text-[#18181B] p-6 shadow-premium flex flex-col justify-between min-h-[220px] border border-slate-200/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">{t("kpi_total_revenue")}</span>
          <button className="text-slate-400 hover:text-slate-800 transition-colors cursor-pointer">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#18181B]">$89 649</h2>
            <span className="text-xs font-bold text-emerald-700 flex items-center bg-emerald-100 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +21%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">$73 925 {t("kpi_last_month")}</p>
        </div>

        <div className="relative mt-4 pt-2">
          <div className="absolute right-18 top-0 -translate-y-1/2 rounded-full bg-[#18181B] text-white px-2.5 py-0.5 text-[10px] font-bold shadow-md flex items-center gap-1 z-10">
            $1210.6
          </div>
          <div className="flex items-end justify-between h-14 w-full gap-2 px-1">
            {(["day_mon","day_tue","day_wed","day_thu","day_fri","day_sat","day_sun"] as const).map((key, i) => (
              <div key={key} className="flex-1 flex flex-col items-center h-full justify-end">
                <div style={{ height: ["40%","60%","55%","95%","70%","45%","50%"][i] }} className={`w-full rounded-md transition-all ${i === 3 ? "bg-[#18181B] shadow-sm" : "bg-slate-300"}`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold mt-1">
            {(["day_mon","day_tue","day_wed","day_thu","day_fri","day_sat","day_sun"] as const).map((key) => (
              <span key={key}>{t(key)}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
