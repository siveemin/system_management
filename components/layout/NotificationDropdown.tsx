"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import dataStore from "@/lib/store";
import { NotificationDTO } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    setNotifications(dataStore.getNotifications());
    return dataStore.subscribe(() => {
      setNotifications(dataStore.getNotifications());
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    dataStore.markAllNotificationsAsRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#5a7040] hover:bg-[#d4e8d4] dark:text-[#8aaa6e] dark:hover:bg-[#1a2a10] transition-colors"
        title={t("notif_title")}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c85a7e] text-white text-[9px] font-bold ring-2 ring-[#edf2ed]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[24px] bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#18181B]">
                {t("notif_title")}
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#6b8a4e]/15 px-2 py-0.5 text-[10px] font-bold text-[#6b8a4e]">
                  {unreadCount} {t("notif_new")}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#6b8a4e] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" /> {t("notif_mark_read")}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                {t("notif_empty")}
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    dataStore.markNotificationAsRead(n.id);
                    setIsOpen(false);
                  }}
                  className={`p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer ${
                    !n.read ? "bg-[#6b8a4e]/5" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-[#18181B] truncate">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
