"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, ClipboardList, Users, Settings, ScanBarcode } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const NAV = [
    { label: t("nav_dashboard"),        href: "/",               icon: Store        },
    { label: t("page_po_title"),        href: "/purchase-orders", icon: ClipboardList },
    { label: t("page_customers_title"), href: "/customers",       icon: Users        },
    { label: t("nav_scanner"),          href: "/scanner",         icon: ScanBarcode  },
    { label: t("nav_settings"),         href: "/settings",        icon: Settings     },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#6b8a4e] flex items-center justify-around px-2" style={{ height: 64, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {NAV.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all select-none active:scale-95 ${
              isActive ? "text-white" : "text-[#b8d4a0] hover:text-white"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-white/20" : ""}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
