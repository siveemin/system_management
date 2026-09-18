"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Mail,
  Bell,
  Warehouse,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import dataStore from "@/lib/store";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserDTO, WarehouseDTO } from "@/types";

export function Topbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserDTO>(dataStore.getCurrentUser());
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string>(dataStore.getCurrentWarehouseId());
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>(dataStore.getWarehouses());
  const [users, setUsers] = useState<UserDTO[]>(dataStore.getUsers());
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    const update = () => {
      setCurrentUser(dataStore.getCurrentUser());
      setCurrentWarehouseId(dataStore.getCurrentWarehouseId());
      setWarehouses(dataStore.getWarehouses());
      setUsers(dataStore.getUsers());
    };
    return dataStore.subscribe(update);
  }, []);

  const activeWarehouse = warehouses.find((w) => w.id === currentWarehouseId) || warehouses[0];

  return (
    <>
      <header className="flex h-16 w-full items-center justify-between px-6 pt-3 pb-2 select-none">
        {/* Left: Brand Identity Matching Reference Screen */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#6b8a4e] text-white font-black text-xl shadow-sm transition-transform group-hover:scale-105">
            R
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-[#18181B] leading-tight">
              Retail
            </span>
            <span className="text-sm font-medium tracking-tight text-slate-500 leading-tight">
              Inventory
            </span>
          </div>
        </Link>

        {/* Right: Modern Pill Toolbar (Crisp White Backgrounds) */}
        <div className="flex items-center gap-2.5">
          {/* Warehouse Facility Pill */}
          <div className="hidden md:flex items-center gap-2 bg-white rounded-full px-4 py-1.5 border border-slate-200/80 shadow-pill text-xs font-semibold text-[#18181B]">
            <Warehouse className="h-3.5 w-3.5 text-[#6b8a4e]" />
            <select
              value={currentWarehouseId}
              onChange={(e) => dataStore.setCurrentWarehouseId(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-xs font-bold text-[#18181B]"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Currency Dropdown Pill (Matches 🇺🇸 USD ▾) */}
          <div className="flex items-center gap-1.5 bg-white rounded-full px-3.5 py-1.5 border border-slate-200/80 shadow-pill text-xs font-semibold text-[#18181B]">
            <span className="text-sm">🇺🇸</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-xs font-bold text-[#18181B]"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          {/* Search Circular Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200/80 text-slate-600 shadow-pill hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            title="Search (Cmd+K)"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notification / Message Circular Button with Dark Counter Badge */}
          <NotificationDropdown />

          {/* User Role Switcher Pill */}
          <div className="hidden lg:flex items-center gap-2 bg-white rounded-full px-3.5 py-1.5 border border-slate-200/80 shadow-pill text-xs">
            <Shield className="h-3.5 w-3.5 text-[#6b8a4e]" />
            <select
              value={currentUser.id}
              onChange={(e) => dataStore.setCurrentUser(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#18181B] outline-none cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* User Profile Avatar with Crisp Round Border */}
          <div className="flex items-center cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
              alt={currentUser.name}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
