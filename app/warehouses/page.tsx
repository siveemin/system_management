"use client";

import React, { useState, useEffect } from "react";
import { Warehouse, Plus, Search, MapPin, Phone, Mail, Eye } from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { WarehouseDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default function WarehousesPage() {
  const { t } = useTranslation();
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>(dataStore.getWarehouses());
  const [products, setProducts] = useState(dataStore.getProducts());
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseDTO | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [managerName, setManagerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const update = () => {
      setWarehouses(dataStore.getWarehouses());
      setProducts(dataStore.getProducts());
    };
    return dataStore.subscribe(update);
  }, []);

  const handleCreateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    dataStore.createWarehouse({ name, code: code.toUpperCase(), address, managerName, phone, email, status: "ACTIVE" });
    setIsAddModalOpen(false);
    setName(""); setCode(""); setAddress(""); setManagerName(""); setPhone(""); setEmail("");
  };

  const filtered = warehouses.filter((w) => {
    const q = searchTerm.toLowerCase();
    return w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q) || (w.address && w.address.toLowerCase().includes(q));
  });

  const getWarehouseValue = (warehouseId: string) => {
    return products.reduce((total, p) => {
      const inv = p.inventories?.find((i) => i.warehouseId === warehouseId);
      return total + (inv?.quantity || 0) * p.costPrice;
    }, 0);
  };

  const getWarehouseStock = (warehouseId: string) => {
    return products.reduce((total, p) => {
      const inv = p.inventories?.find((i) => i.warehouseId === warehouseId);
      return total + (inv?.quantity || 0);
    }, 0);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B] flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_warehouses_title")}
          </h1>
        </div>
        <button onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#6b8a4e] hover:bg-[#E63B13] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer select-none active:scale-[0.98]">
          <Plus className="h-4 w-4" /> {t("page_warehouses_add")}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input type="text" placeholder={t("wh_search")}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-[#18181B] placeholder:text-slate-400 outline-none shadow-xs focus:ring-2 focus:ring-[#FF481F]"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((w) => {
          const totalStock = getWarehouseStock(w.id);
          const totalValue = getWarehouseValue(w.id);
          return (
            <div key={w.id} className="border border-slate-200/80 bg-white rounded-[28px] shadow-premium p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-[#6b8a4e]/10 text-[#6b8a4e] font-mono font-extrabold text-[11px] px-2.5 py-1 rounded-full">
                      {w.code}
                    </span>
                    <StatusBadge status={w.status} />
                  </div>
                  <h3 className="font-bold text-[#18181B] text-base leading-tight">{w.name}</h3>
                </div>
                <button onClick={() => setSelectedWarehouse(w)}
                  className="p-1.5 text-slate-400 hover:text-[#6b8a4e] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                  <Eye className="h-4 w-4" />
                </button>
              </div>

              {w.address && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-[#6b8a4e] shrink-0" />
                  <span>{w.address}</span>
                </div>
              )}
              {w.managerName && (
                <div className="text-xs text-slate-600 font-semibold">{t("wh_manager")}: {w.managerName}</div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <div className="bg-slate-50 rounded-2xl p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">{t("wh_total_stock")}</div>
                  <div className="text-lg font-extrabold text-[#18181B] mt-0.5">{totalStock.toLocaleString()} {t("wh_units")}</div>
                </div>
                <div className="bg-[#6b8a4e]/5 rounded-2xl p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">{t("wh_holding_value")}</div>
                  <div className="text-lg font-extrabold text-[#6b8a4e] mt-0.5">{formatCurrency(totalValue)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}
        title={t("wh_modal_title")} description={t("wh_modal_desc")} size="md">
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t("wh_facility_name")} *</label>
              <Input required placeholder="e.g. North Hub" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t("wh_code_label")} *</label>
              <Input required placeholder="WH-NORTH-01" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">{t("wh_physical_address")}</label>
            <Input placeholder="200 Industrial Ave, Houston, TX" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t("wh_facility_manager")}</label>
              <Input placeholder="e.g. Marcus Webb" value={managerName} onChange={(e) => setManagerName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t("wh_contact_phone")}</label>
              <Input placeholder="+1 (555) 291-8800" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>{t("btn_cancel")}</Button>
            <Button type="submit" className="bg-[#6b8a4e] hover:bg-[#E63B13] text-white">{t("wh_create_btn")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
