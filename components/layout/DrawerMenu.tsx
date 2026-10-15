"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, ShoppingBag, Boxes, Users, BarChart3, FileText,
  Truck, ScanBarcode, Settings, Shield, TrendingUp, AlertTriangle,
  ShoppingCart, ChevronDown, ChevronRight, Tag, LogOut, ArrowLeftRight,
} from "lucide-react";
import { drawerState } from "@/lib/drawerState";
import { useSwipeGesture } from "@/lib/useSwipeGesture";
import { useTranslation } from "@/lib/useTranslation";
import { getSystemName, getSystemSubtitle } from "@/lib/systemName";

export function DrawerMenu() {
  const [isOpen, setIsOpen]     = useState(false);
  const [expanded, setExpanded] = useState<string>("Inventory");
  const [sysName, setSysName]   = useState("Smart Inventory");
  const [sysSub, setSysSub]     = useState("Warehouse Management");
  const pathname                = usePathname();
  const { t, lang }             = useTranslation();

  useEffect(() => {
    setSysName(getSystemName());
    setSysSub(getSystemSubtitle());
    const handler = () => { setSysName(getSystemName()); setSysSub(getSystemSubtitle()); };
    window.addEventListener("system_name_changed", handler);
    return () => window.removeEventListener("system_name_changed", handler);
  }, []);

  useEffect(() => {
    return drawerState.subscribe(() => setIsOpen(drawerState.isOpen()));
  }, []);

  const close = () => drawerState.close();

  // Swipe left on drawer to close
  useSwipeGesture({ onSwipeLeft: close, threshold: 50 });

  const SECTIONS = [
    {
      label: t("nav_section_inventory"),
      items: [
        { label: t("nav_dashboard"),         href: "/",               icon: LayoutGrid   },
        { label: t("nav_products"),          href: "/products",       icon: ShoppingBag  },
        { label: t("nav_categories"),        href: "/categories",     icon: Tag          },
        { label: t("page_inventory_title"),  href: "/inventory",      icon: Boxes        },
        { label: t("nav_low_stock"),         href: "/low-stock",      icon: AlertTriangle},
      ],
    },
    {
      label: t("nav_section_orders"),
      items: [
        { label: t("page_po_title"),  href: "/purchase-orders", icon: FileText      },
        { label: t("page_so_title"),  href: "/sales-orders",    icon: ShoppingCart  },
        { label: t("page_st_title"),  href: "/stock-transfers", icon: ArrowLeftRight},
      ],
    },
    {
      label: t("nav_section_people"),
      items: [
        { label: t("page_customers_title"), href: "/customers", icon: Users   },
        { label: t("page_suppliers_title"), href: "/suppliers", icon: Truck   },
        { label: t("page_users_title"),     href: "/users",     icon: Shield  },
      ],
    },
  ];

  const BOTTOM_ITEMS = [
    { label: t("page_reports_title"),     href: "/reports",     icon: BarChart3   },
    { label: t("page_forecasting_title"), href: "/forecasting", icon: TrendingUp  },
    { label: t("nav_scanner"),            href: "/scanner",     icon: ScanBarcode },
    { label: t("nav_settings"),           href: "/settings",    icon: Settings    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
        onClick={close}
      />

      {/* Drawer panel */}
      <aside className="fixed top-0 left-0 z-50 h-full w-[280px] bg-[#0E1A08] shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-5 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4D7A32] text-white font-black text-lg shadow-sm shrink-0">
            {sysName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">{sysName}</div>
            <div className="text-[11px] text-[#8BA882] truncate">{sysSub}</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {/* Collapsible sections */}
          {SECTIONS.map((section) => {
            const isExpanded = expanded === section.label;
            const hasActive = section.items.some((i) =>
              i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)
            );
            return (
              <div key={section.label}>
                <button
                  onClick={() => setExpanded(isExpanded ? "" : section.label)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${
                    hasActive
                      ? "text-[#8BA882]"
                      : "text-[#4D6040] hover:text-[#8BA882]"
                  }`}
                >
                  <span>{section.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-1 space-y-0.5 pl-1">
                    {section.items.map((item) => {
                      const isActive =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={close}
                          className={`ripple flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                            isActive
                              ? "bg-[#4D7A32] text-white"
                              : "text-[#8BA882] hover:bg-white/[0.08] hover:text-[#C8D8BC]"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Divider */}
          <div className="border-t border-white/10 my-2" />

          {/* Bottom items */}
          {BOTTOM_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`ripple flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                  isActive
                    ? "bg-[#4D7A32] text-white"
                    : "text-[#8BA882] hover:bg-white/[0.08] hover:text-[#C8D8BC]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1 shrink-0">
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all active:scale-[0.97]"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
          <p className="text-[10px] text-[#4D6040] text-center pt-1">
            {sysName} © {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  );
}
