"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { BarcodeCanvas } from "./BarcodeCanvas";
import { QRCodeCanvas } from "./QRCodeCanvas";
import { ProductDTO } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Printer, Copy } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

interface PrintLabelModalProps {
  product: ProductDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintLabelModal({ product, isOpen, onClose }: PrintLabelModalProps) {
  const { t } = useTranslation();
  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("print_title")}
      description={t("print_desc")}
      size="md"
    >
      <div className="space-y-6">
        {/* Printable Card Area */}
        <div
          id="printable-barcode-label"
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white text-slate-900 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm"
        >
          <div className="w-full text-left border-b border-slate-200 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Smart Inventory Hub
            </span>
            <h3 className="text-base font-bold text-slate-900 line-clamp-1">
              {product.name}
            </h3>
            <div className="flex justify-between items-center text-xs text-slate-600 mt-1">
              <span>SKU: <strong className="text-slate-900">{product.sku}</strong></span>
              <span>{t("print_category")}: <strong>{product.categoryName || "General"}</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around w-full gap-4 pt-2">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500 mb-1">
                {t("print_linear")}
              </span>
              <BarcodeCanvas
                value={product.barcode || product.sku}
                width={1.8}
                height={48}
                fontSize={13}
              />
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500 mb-1">
                {t("print_qr")}
              </span>
              <QRCodeCanvas
                value={product.qrCode || `PROD:${product.sku}:${product.barcode || ""}`}
                size={84}
              />
            </div>
          </div>

          <div className="w-full flex justify-between items-center text-xs border-t border-slate-200 pt-2 font-medium">
            <span>UOM: {product.uom.toUpperCase()}</span>
            <span className="text-sm font-bold text-teal-700">
              Price: {formatCurrency(product.sellingPrice)}
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            {t("btn_cancel")}
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            {t("print_btn")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
