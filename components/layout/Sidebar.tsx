"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, ShoppingBag, Users, BarChart3, FileText,
  Truck, ScanBarcode, Settings, Shield, Boxes,
  TrendingUp, AlertTriangle, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";

export function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const alerts = dataStore.getAlerts().filter((a) => a.status === "NEW");
  const { t } = useTranslation();

  const mainNav = [
    { key: "nav_dashboard", href: "/", icon: LayoutGrid },
    { key: "nav_products", href: "/products", icon: ShoppingBag },
    { key: "nav_categories", href: "/categories", icon: Tag },
    { key: "nav_inventory", href: "/inventory", icon: Boxes },
    { key: "nav_customers", href: "/customers", icon: Users },
    { key: "nav_analytics", href: "/reports", icon: BarChart3 },
    { key: "nav_orders", href: "/purchase-orders", icon: FileText },
    { key: "nav_warehouses", href: "/stock-transfers", icon: Truck },
    { key: "nav_scanner", href: "/scanner", icon: ScanBarcode },
    { key: "nav_low_stock", href: "/low-stock", icon: AlertTriangle, badge: alerts.length > 0 ? alerts.length : undefined },
    { key: "nav_forecasting", href: "/forecasting", icon: TrendingUp },
  ] as const;

  const bottomNav = [
    { key: "nav_users", href: "/users", icon: Shield },
    { key: "nav_settings", href: "/settings", icon: Settings },
  ] as const;

  const NavItem = ({ item, isBottom = false }: { item: { key: string; href: string; icon: React.ElementType; badge?: number }; isBottom?: boolean }) => {
    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    const Icon = item.icon;
    const label = t(item.key as any);

    return (
      <div className="relative flex items-center justify-center">
        <Link
          href={item.href}
          onMouseEnter={() => setHoveredItem(item.key)}
          onMouseLeave={() => setHoveredItem(null)}
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200",
            isActive
              ? "bg-[#18181B] text-white shadow-md dark:bg-white dark:text-[#18181B]"
              : isBottom
              ? "text-slate-400 hover:text-slate-800 hover:bg-white dark:hover:bg-slate-800 shadow-2xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-800 shadow-2xs"
          )}
        >
          <Icon className="h-5 w-5 stroke-2" />
          {"badge" in item && item.badge !== undefined && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#6b8a4e] text-[9px] font-bold text-white shadow-xs ring-2 ring-[#F1F3F7] dark:ring-slate-900">
              {item.badge}
            </span>
          )}
        </Link>
        {hoveredItem === item.key && (
          <div className="absolute left-14 z-50 whitespace-nowrap rounded-xl bg-[#18181B] px-3 py-1.5 text-xs font-semibold text-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {label}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#18181B]" />
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-18 flex flex-col items-center justify-between py-6 px-3 bg-transparent select-none shrink-0 z-30">
      <div className="flex flex-col items-center gap-3 w-full">
        {mainNav.map((item) => <NavItem key={item.key} item={item} />)}
      </div>
      <div className="flex flex-col items-center gap-3 w-full pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
        {bottomNav.map((item) => <NavItem key={item.key} item={item} isBottom />)}
      </div>
    </aside>
  );
}
