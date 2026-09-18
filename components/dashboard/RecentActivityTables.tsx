"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";
import {
  ProductDTO, PurchaseOrderDTO, SalesOrderDTO,
  StockTransferDTO, InventoryTransactionDTO,
} from "@/types";

interface RecentActivityTablesProps {
  products?: ProductDTO[];
  purchaseOrders: PurchaseOrderDTO[];
  salesOrders: SalesOrderDTO[];
  stockTransfers: StockTransferDTO[];
  transactions: InventoryTransactionDTO[];
}

export function RecentActivityTables({
  products = [], purchaseOrders, salesOrders, stockTransfers, transactions,
}: RecentActivityTablesProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "transactions">("products");

  const salesItems = [
    { name: "Jacquemus Largo",          sku: "SKU-APP-1029", img: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=100&auto=format&fit=crop&q=80", stock: 118, oldPrice: 114.0,  sale: "5%",  newPrice: 108.3,  itemsSold: 294 },
    { name: "Aries x Umbro Centenary",  sku: "SKU-APP-2044", img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=100&auto=format&fit=crop&q=80", stock: 328, oldPrice: 140.9,  sale: "8%",  newPrice: 129.6,  itemsSold: 294 },
    { name: "There Was One",             sku: "SKU-APP-3091", img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=100&auto=format&fit=crop&q=80", stock: 118, oldPrice: 311.0,  sale: "15%", newPrice: 264.35, itemsSold: 69  },
    { name: "Sleeved cardigan",          sku: "SKU-APP-4102", img: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=100&auto=format&fit=crop&q=80", stock: 26,  oldPrice: 55.0,   sale: "5%",  newPrice: 52.25,  itemsSold: 32  },
  ];

  return (
    <div className="border border-slate-200/80 bg-white rounded-[28px] shadow-premium overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-[#18181B]">{t("table_product_sales")}</h3>
          <div className="flex items-center gap-1 bg-[#F4F5F8] p-1 rounded-full text-xs font-semibold border border-slate-200/60">
            {([
              ["products",     t("table_top_items")],
              ["orders",       t("table_recent_orders")],
              ["transactions", t("table_ledger_feed")],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  activeTab === tab ? "bg-[#18181B] text-white shadow-xs font-bold" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Link href="/products" className="text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="overflow-x-auto px-6 pb-6">
        {activeTab === "products" && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-normal">{t("table_col_item")}</th>
                <th className="pb-3 font-normal text-center">{t("label_stock")}</th>
                <th className="pb-3 font-normal text-right">{t("table_col_old_price")}</th>
                <th className="pb-3 font-normal text-center">{t("table_col_sale")}</th>
                <th className="pb-3 font-normal text-right">{t("table_col_new_price")}</th>
                <th className="pb-3 font-normal text-right">{t("table_col_items_sold")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesItems.map((item) => (
                <tr key={item.name} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={item.img} alt={item.name} className="h-10 w-10 rounded-xl object-cover border border-slate-200 bg-slate-50" />
                      <div>
                        <span className="font-bold text-[#18181B] block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 font-bold text-slate-800 text-center">{item.stock}</td>
                  <td className="py-3.5 text-slate-400 text-right line-through font-medium">{formatCurrency(item.oldPrice)}</td>
                  <td className="py-3.5 text-center">
                    <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">{item.sale}</span>
                  </td>
                  <td className="py-3.5 font-bold text-[#18181B] text-right">{formatCurrency(item.newPrice)}</td>
                  <td className="py-3.5 font-bold text-slate-800 text-right">{item.itemsSold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "orders" && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-normal">{t("table_col_order_num")}</th>
                <th className="pb-3 font-normal">{t("table_col_cust_supplier")}</th>
                <th className="pb-3 font-normal">{t("label_warehouse")}</th>
                <th className="pb-3 font-normal">{t("table_col_amount")}</th>
                <th className="pb-3 font-normal text-right">{t("label_status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...salesOrders.slice(0, 3), ...purchaseOrders.slice(0, 2)].map((o: any) => (
                <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-mono font-bold text-[#18181B]">{o.orderNumber}</td>
                  <td className="py-3 font-semibold text-slate-800">{o.customerName || o.supplierName}</td>
                  <td className="py-3 text-slate-500">{o.warehouseName}</td>
                  <td className="py-3 font-bold text-[#18181B]">{formatCurrency(o.totalAmount)}</td>
                  <td className="py-3 text-right"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "transactions" && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-normal">{t("table_col_txn_num")}</th>
                <th className="pb-3 font-normal">{t("table_col_item")}</th>
                <th className="pb-3 font-normal">{t("label_type")}</th>
                <th className="pb-3 font-normal">{t("table_col_change")}</th>
                <th className="pb-3 font-normal text-right">{t("label_date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-mono font-bold text-[#18181B]">{txn.transactionNumber}</td>
                  <td className="py-3 font-semibold text-slate-800">{txn.productName}</td>
                  <td className="py-3 font-mono uppercase text-[10px] font-bold text-slate-600">{txn.type.replace("_", " ")}</td>
                  <td className="py-3 font-bold">
                    <span className={txn.quantityChange > 0 ? "text-emerald-600" : "text-[#6b8a4e]"}>
                      {txn.quantityChange > 0 ? `+${txn.quantityChange}` : txn.quantityChange}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-right">{formatDateTime(txn.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
