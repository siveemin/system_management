"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PackagePlus,
  ShoppingBag,
  ShoppingCart,
  ArrowLeftRight,
  ScanBarcode,
  Boxes,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useTranslation } from "@/lib/useTranslation";

export function QuickActionsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const actions = [
    { titleKey: "qa_product" as const, descKey: "qa_product_desc" as const, icon: PackagePlus, href: "/products?action=new" },
    { titleKey: "qa_po" as const, descKey: "qa_po_desc" as const, icon: ShoppingBag, href: "/purchase-orders?action=new" },
    { titleKey: "qa_so" as const, descKey: "qa_so_desc" as const, icon: ShoppingCart, href: "/sales-orders?action=new" },
    { titleKey: "qa_transfer" as const, descKey: "qa_transfer_desc" as const, icon: ArrowLeftRight, href: "/stock-transfers?action=new" },
    { titleKey: "qa_scanner" as const, descKey: "qa_scanner_desc" as const, icon: ScanBarcode, href: "/scanner" },
    { titleKey: "qa_adjust" as const, descKey: "qa_adjust_desc" as const, icon: Boxes, href: "/inventory?action=adjust" },
  ];

  const handleSelect = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-[#6b8a4e] hover:bg-[#5a7840] text-white shadow-sm font-semibold cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        {t("quick_action_btn")}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("quick_action_title")}
        description={t("quick_action_desc")}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.titleKey}
                onClick={() => handleSelect(act.href)}
                className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-teal-500/50 hover:bg-[#edf2ed]/30 dark:hover:bg-[#1a2a10]/20 text-left transition-all duration-150 group cursor-pointer"
              >
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950 text-[#6b8a4e] dark:text-teal-400 group-hover:bg-[#6b8a4e] group-hover:text-white transition-colors shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#6b8a4e] dark:group-hover:text-teal-400 transition-colors">
                    {t(act.titleKey)}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {t(act.descKey)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
