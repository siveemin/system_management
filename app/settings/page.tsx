"use client";

import React, { useState, useEffect } from "react";
import {
  User, Save, CheckCircle2, Bell, Barcode, Database,
  DollarSign, Languages, Shield, ChevronRight, Warehouse,
  Package, LogOut, Moon, Sun, Globe,
} from "lucide-react";
import { CurrencyCode } from "@/lib/utils";
import { Language } from "@/lib/i18n";
import { useTranslation } from "@/lib/useTranslation";
import dataStore from "@/lib/store";
import { useRouter } from "next/navigation";

// ── Toggle Switch ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? "bg-[#6b8a4e]" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[22px] border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-[#6b8a4e]/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-[#6b8a4e]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#18181B]">{title}</h3>
          {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

// ── Setting Row ────────────────────────────────────────────────────────────
function SettingRow({
  label,
  description,
  children,
  last,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 px-5 py-4 ${!last ? "" : ""}`}>
      <div className="min-w-0">
        <span className="text-sm font-semibold text-[#18181B] block">{label}</span>
        {description && <span className="text-[11px] text-slate-400 mt-0.5 block">{description}</span>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ── Styled Select ──────────────────────────────────────────────────────────
function StyledSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-[#18181B] focus:outline-none focus:border-[#6b8a4e] transition-colors min-w-[140px]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── Pill Selector ──────────────────────────────────────────────────────────
function PillSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            value === o.value
              ? "bg-[#6b8a4e] border-[#6b8a4e] text-white shadow-sm"
              : "border-slate-200 text-slate-600 hover:border-[#6b8a4e] hover:text-[#6b8a4e] bg-white"
          }`}
        >
          {o.icon && <span className="text-sm">{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [currentUser, setCurrentUser] = useState(dataStore.getCurrentUser());
  const [warehouses, setWarehouses] = useState(dataStore.getWarehouses());
  const [defaultWarehouseId, setDefaultWarehouseId] = useState("wh-1");
  const [valuationMethod, setValuationMethod] = useState("FIFO");
  const [skuPrefix, setSkuPrefix] = useState("SKU");
  const [barcodeFormat, setBarcodeFormat] = useState("EAN13");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoReorder, setAutoReorder] = useState(true);
  const [lowStockPush, setLowStockPush] = useState(true);
  const [orderNotify, setOrderNotify] = useState(false);
  const [currency, setCurrencyState] = useState<CurrencyCode>(dataStore.getCurrency());
  const [language, setLanguageState] = useState<Language>(dataStore.getLanguage());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("general");

  useEffect(() => {
    setCurrentUser(dataStore.getCurrentUser());
    setWarehouses(dataStore.getWarehouses());
  }, []);

  const handleCurrencyChange = (cur: CurrencyCode) => {
    setCurrencyState(cur);
    dataStore.setCurrency(cur);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguageState(lang);
    dataStore.setLanguage(lang);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const SECTIONS = [
    { id: "general",       icon: Globe,     label: "General" },
    { id: "inventory",     icon: Package,   label: "Inventory" },
    { id: "barcode",       icon: Barcode,   label: "Barcode & SKU" },
    { id: "notifications", icon: Bell,      label: "Notifications" },
    { id: "security",      icon: Shield,    label: "Security" },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* ── Profile Hero Card ── */}
      <div className="relative overflow-hidden rounded-[26px] bg-[#18181B] p-6 shadow-premium">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-[#6b8a4e]" />
          <div className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-[#6b8a4e]" />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#6b8a4e] flex items-center justify-center text-white text-lg font-black shrink-0">
            {currentUser?.name?.slice(0, 2).toUpperCase() ?? "AD"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-white truncate">{currentUser?.name ?? "Admin User"}</h2>
            <p className="text-[11px] text-slate-400 truncate">{currentUser?.email ?? "admin@smartinventory.io"}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold bg-[#6b8a4e]/30 text-[#a5c87e] px-2.5 py-0.5 rounded-full">
                {currentUser?.role ?? "ADMIN"}
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Success Toast ── */}
      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          Settings saved successfully
        </div>
      )}

      {/* ── Horizontal Nav Pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeSection === s.id
                ? "bg-[#18181B] text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-500 hover:text-[#18181B] hover:border-slate-300"
            }`}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* ── General ── */}
        {activeSection === "general" && (
          <>
            <SectionCard icon={DollarSign} title="Currency" description="Choose your display currency for all monetary values">
              <SettingRow label="Display Currency" description="Applied across all prices, orders, and reports">
                <PillSelector<CurrencyCode>
                  value={currency}
                  onChange={handleCurrencyChange}
                  options={[
                    { value: "USD", label: "USD", icon: "$" },
                    { value: "KHR", label: "KHR", icon: "៛" },
                  ]}
                />
              </SettingRow>
            </SectionCard>

            <SectionCard icon={Languages} title={t("page_settings_language_title")} description={t("page_settings_language_sub")}>
              <SettingRow label="Interface Language" description="Changes all labels and UI text">
                <PillSelector<Language>
                  value={language}
                  onChange={handleLanguageChange}
                  options={[
                    { value: "en", label: "English", icon: "🇺🇸" },
                    { value: "km", label: "ខ្មែរ",   icon: "🇰🇭" },
                  ]}
                />
              </SettingRow>
            </SectionCard>

            <SectionCard icon={Warehouse} title="Default Warehouse" description="Pre-selected warehouse for new orders and transfers">
              <SettingRow label="Default Location" description="Used when creating new purchase/sales orders">
                <StyledSelect
                  value={defaultWarehouseId}
                  onChange={setDefaultWarehouseId}
                  options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
                />
              </SettingRow>
            </SectionCard>
          </>
        )}

        {/* ── Inventory ── */}
        {activeSection === "inventory" && (
          <SectionCard icon={Database} title={t("settings_valuation_title")} description={t("settings_valuation_sub")}>
            <SettingRow label={t("settings_valuation_label")} description="Determines how inventory cost is calculated">
              <StyledSelect
                value={valuationMethod}
                onChange={setValuationMethod}
                options={[
                  { value: "FIFO", label: "FIFO – First In, First Out" },
                  { value: "WAC",  label: "Average Cost (WAC)" },
                  { value: "SPECIFIC", label: "Specific Lot / Batch" },
                ]}
              />
            </SettingRow>
            <SettingRow label={t("settings_reorder_label")} description={t("settings_reorder_sub")}>
              <Toggle checked={autoReorder} onChange={setAutoReorder} />
            </SettingRow>
          </SectionCard>
        )}

        {/* ── Barcode & SKU ── */}
        {activeSection === "barcode" && (
          <SectionCard icon={Barcode} title={t("settings_barcode_title")} description={t("settings_barcode_sub")}>
            <SettingRow label={t("settings_sku_prefix")} description="Prepended to auto-generated SKU numbers">
              <input
                value={skuPrefix}
                onChange={(e) => setSkuPrefix(e.target.value.toUpperCase())}
                placeholder="e.g. SKU"
                maxLength={6}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-[#18181B] focus:outline-none focus:border-[#6b8a4e] w-24 text-center uppercase transition-colors"
              />
            </SettingRow>
            <SettingRow label={t("settings_barcode_format")} description="Default format for generated barcodes">
              <StyledSelect
                value={barcodeFormat}
                onChange={setBarcodeFormat}
                options={[
                  { value: "EAN13",   label: "EAN-13 / GTIN-13" },
                  { value: "CODE128", label: "Code 128" },
                  { value: "UPC",     label: "UPC-A" },
                ]}
              />
            </SettingRow>
          </SectionCard>
        )}

        {/* ── Notifications ── */}
        {activeSection === "notifications" && (
          <SectionCard icon={Bell} title={t("settings_alerts_title")} description="Control which events trigger alerts">
            <SettingRow label={t("settings_low_stock_alert")} description={t("settings_low_stock_sub")}>
              <Toggle checked={emailAlerts} onChange={setEmailAlerts} />
            </SettingRow>
            <SettingRow label="Low Stock Push Notification" description="Mobile push when stock falls below minimum">
              <Toggle checked={lowStockPush} onChange={setLowStockPush} />
            </SettingRow>
            <SettingRow label="Order Status Updates" description="Notify when orders change status">
              <Toggle checked={orderNotify} onChange={setOrderNotify} />
            </SettingRow>
            <SettingRow label={t("settings_reorder_label")} description={t("settings_reorder_sub")}>
              <Toggle checked={autoReorder} onChange={setAutoReorder} />
            </SettingRow>
          </SectionCard>
        )}

        {/* ── Security ── */}
        {activeSection === "security" && (
          <>
            <SectionCard icon={Shield} title="Account Security" description="Manage your login and access settings">
              <SettingRow label="Email Address" description="Used for login and notifications">
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                  {currentUser?.email ?? "admin@smartinventory.io"}
                </span>
              </SettingRow>
              <SettingRow label="Role & Permissions" description="Your current access level">
                <span className="text-xs font-bold bg-[#6b8a4e]/10 text-[#6b8a4e] px-3 py-1.5 rounded-lg">
                  {currentUser?.role ?? "ADMIN"}
                </span>
              </SettingRow>
              <SettingRow label="Change Password" description="Update your login password">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-bold text-[#6b8a4e] hover:text-[#5a7040] transition-colors"
                >
                  Update <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </SettingRow>
            </SectionCard>

            <div className="bg-white rounded-[22px] border border-red-100 overflow-hidden">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center">
                    <LogOut className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="text-left">
                    <span className="block">Sign Out</span>
                    <span className="text-[11px] font-normal text-red-400">End your current session</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-red-400" />
              </button>
            </div>
          </>
        )}

        {/* ── Save Button ── */}
        {activeSection !== "security" && (
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold transition-all shadow-sm active:scale-[0.97]"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
