"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Search, Sun, Moon, X } from "lucide-react";
import { drawerState } from "@/lib/drawerState";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { NotificationDropdown } from "./NotificationDropdown";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { getSystemName, getSystemSubtitle } from "@/lib/systemName";

export function AppTopbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [sysName, setSysName] = useState("Smart Inventory");
  const [sysSub, setSysSub] = useState("Warehouse Management");
  const { lang } = useTranslation();

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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const toggleLang = () => {
    dataStore.setLanguage(dataStore.getLanguage() === "en" ? "km" : "en");
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 bg-[#F7F3EE] shadow-sm">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => drawerState.toggle()}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4D7A32] hover:bg-[#E6DDD2] transition-colors"
            aria-label="Menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4D7A32] text-white font-black text-base shadow-sm">
              {sysName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-[#1A150E]">{sysName}</span>
              <span className="text-[11px] text-[#4D7A32] font-medium">{sysSub}</span>
            </div>
          </Link>
        </div>

        {/* Center: search pill (sm+) */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white border border-[#E6DDD2] text-[#7A7268] hover:border-[#4D7A32] hover:text-[#4D7A32] transition-all shadow-sm text-xs font-medium"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span>Search products…</span>
          <kbd className="ml-1 px-1.5 py-0.5 rounded bg-[#F0EBE3] border border-[#E6DDD2] text-[10px] font-bold text-[#7A7268] hidden md:block">⌘K</kbd>
        </button>

        {/* Right: icons */}
        <div className="flex items-center gap-1">
          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex sm:hidden h-9 w-9 items-center justify-center rounded-xl text-[#4D7A32] hover:bg-[#E6DDD2] transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            onClick={toggleDark}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4D7A32] hover:bg-[#E6DDD2] dark:text-[#8BA882] dark:hover:bg-[#1C2A12] transition-colors"
          >
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleLang}
            className="h-9 px-3 rounded-xl text-xs font-bold border-2 border-[#4D7A32] text-[#4D7A32] bg-white hover:bg-[#4D7A32] hover:text-white dark:bg-transparent dark:text-[#8BA882] dark:border-[#8BA882] dark:hover:bg-[#8BA882] dark:hover:text-white transition-colors flex items-center gap-1"
            title={lang === "en" ? "Switch to ខ្មែរ" : "Switch to English"}
          >
            {lang === "en" ? (
              <><span>ខ្មែរ</span><span className="text-[10px] opacity-60">KH</span></>
            ) : (
              <><span>English</span><span className="text-[10px] opacity-60">EN</span></>
            )}
          </button>

          <NotificationDropdown />
        </div>
      </header>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
