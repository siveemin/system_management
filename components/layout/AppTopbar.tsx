"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Search, Sun, Moon, X } from "lucide-react";
import { drawerState } from "@/lib/drawerState";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { NotificationDropdown } from "./NotificationDropdown";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";

export function AppTopbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { lang } = useTranslation();

  useEffect(() => {
    return drawerState.subscribe(() => setIsOpen(drawerState.isOpen()));
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
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 bg-[#edf2ed] border-b border-[#d4ddd4]">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => drawerState.toggle()}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#3d5a2a] hover:bg-[#d4e8d4] transition-colors"
            aria-label="Menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6b8a4e] text-white font-black text-base shadow-sm">
              S
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-[#1e2e14]">Smart</span>
              <span className="text-[11px] text-[#6b8a4e] font-medium">Inventory</span>
            </div>
          </Link>
        </div>

        {/* Right: icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#5a7040] hover:bg-[#d4e8d4] transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            onClick={toggleDark}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#5a7040] hover:bg-[#d4e8d4] dark:text-[#8aaa6e] dark:hover:bg-[#1a2a10] transition-colors"
          >
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleLang}
            className="h-9 px-3 rounded-xl text-xs font-bold border-2 border-[#6b8a4e] text-[#6b8a4e] bg-white hover:bg-[#6b8a4e] hover:text-white dark:bg-transparent dark:text-[#8aaa6e] dark:border-[#8aaa6e] dark:hover:bg-[#8aaa6e] dark:hover:text-white transition-colors flex items-center gap-1"
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
