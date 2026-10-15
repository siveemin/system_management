"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, ShoppingBag, Boxes, Users, BarChart3, FileText,
  Truck, ScanBarcode, Settings, Shield, TrendingUp, AlertTriangle,
  ShoppingCart, Tag, LogOut, ArrowLeftRight,
} from "lucide-react";
import { getSystemName, getSystemSubtitle } from "@/lib/systemName";
import { useTranslation } from "@/lib/useTranslation";

const NAV_GROUPS = [
  {
    label: "INVENTORY",
    items: [
      { key: "nav_dashboard",           href: "/",               icon: LayoutGrid   },
      { key: "nav_products",            href: "/products",       icon: ShoppingBag  },
      { key: "nav_categories",          href: "/categories",     icon: Tag          },
      { key: "page_inventory_title",    href: "/inventory",      icon: Boxes        },
      { key: "nav_low_stock",           href: "/low-stock",      icon: AlertTriangle},
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { key: "nav_scanner",             href: "/scanner",         icon: ScanBarcode  },
      { key: "page_po_title",           href: "/purchase-orders", icon: FileText     },
      { key: "page_so_title",           href: "/sales-orders",    icon: ShoppingCart },
      { key: "page_st_title",           href: "/stock-transfers", icon: ArrowLeftRight},
    ],
  },
  {
    label: "PEOPLE",
    items: [
      { key: "page_customers_title",    href: "/customers",      icon: Users   },
      { key: "page_suppliers_title",    href: "/suppliers",      icon: Truck   },
      { key: "page_users_title",        href: "/users",          icon: Shield  },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { key: "page_reports_title",      href: "/reports",        icon: BarChart3  },
      { key: "page_forecasting_title",  href: "/forecasting",    icon: TrendingUp },
      { key: "page_audit_title",        href: "/audit-logs",     icon: FileText   },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [sysName, setSysName] = useState("Smart Inventory");
  const [sysSub, setSysSub] = useState("Warehouse Management");

  useEffect(() => {
    setSysName(getSystemName());
    setSysSub(getSystemSubtitle());
    const handler = () => {
      setSysName(getSystemName());
      setSysSub(getSystemSubtitle());
    };
    window.addEventListener("system_name_changed", handler);
    return () => window.removeEventListener("system_name_changed", handler);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] flex flex-col z-30 bg-white border-r border-[#E6DDD2] overflow-y-auto">
      {/* Logo / system name */}
      <div className="flex items-center gap-3 px-5 py-5 shrink-0 border-b border-[#F0EAE0]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4D7A32] text-white font-black text-base shadow-sm shrink-0">
          {sysName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col leading-none min-w-0">
          <span className="text-sm font-bold text-[#1A150E] truncate">{sysName}</span>
          <span className="text-[11px] text-[#9A9288] font-medium truncate">{sysSub}</span>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-bold tracking-widest text-[#B0A89E] uppercase select-none">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      active
                        ? "bg-[#EBF5E4] text-[#2E6619]"
                        : "text-[#6B6560] hover:bg-[#F7F3EE] hover:text-[#1A150E]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#4D7A32]" : ""}`} />
                    <span className="truncate">{t(item.key as any)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: settings + logout */}
      <div className="shrink-0 border-t border-[#F0EAE0] px-3 py-4 space-y-0.5">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
            isActive("/settings")
              ? "bg-[#EBF5E4] text-[#2E6619]"
              : "text-[#6B6560] hover:bg-[#F7F3EE] hover:text-[#1A150E]"
          }`}
        >
          <Settings className={`h-4 w-4 shrink-0 ${isActive("/settings") ? "text-[#4D7A32]" : ""}`} />
          <span>{t("nav_settings" as any)}</span>
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#6B6560] hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
