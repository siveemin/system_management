"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2, Bell, Barcode, Database, DollarSign, Languages } from "lucide-react";
import { CurrencyCode } from "@/lib/utils";
import { Language } from "@/lib/i18n";
import { useTranslation } from "@/lib/useTranslation";
import dataStore from "@/lib/store";
import { WarehouseDTO } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>(dataStore.getWarehouses());
  const [defaultWarehouseId, setDefaultWarehouseId] = useState("wh-1");
  const [valuationMethod, setValuationMethod] = useState("FIFO");
  const [skuPrefix, setSkuPrefix] = useState("SKU");
  const [barcodeFormat, setBarcodeFormat] = useState("EAN13");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoReorderSuggestions, setAutoReorderSuggestions] = useState(true);
  const [currency, setCurrencyState] = useState<CurrencyCode>(dataStore.getCurrency());
  const [language, setLanguageState] = useState<Language>(dataStore.getLanguage());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="h-6 w-6 text-[#6b8a4e]" />
            {t("nav_settings")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("page_settings_title")}
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{t("page_settings_saved")}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Inventory Costing & Valuation */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Database className="h-4 w-4 text-[#6b8a4e]" />
              {t("settings_valuation_title")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("settings_valuation_sub")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t("settings_valuation_label")}
                </label>
                <select
                  value={valuationMethod}
                  onChange={(e) => setValuationMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="FIFO">FIFO (First In, First Out)</option>
                  <option value="WAC">Average Cost</option>
                  <option value="SPECIFIC">By Batch / Lot</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t("settings_def_wh")}
                </label>
                <select
                  value={defaultWarehouseId}
                  onChange={(e) => setDefaultWarehouseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Barcode & SKU */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Barcode className="h-4 w-4 text-[#6b8a4e]" />
              {t("settings_barcode_title")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("settings_barcode_sub")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t("settings_sku_prefix")}
                </label>
                <Input
                  value={skuPrefix}
                  onChange={(e) => setSkuPrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. SKU"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t("settings_barcode_format")}
                </label>
                <select
                  value={barcodeFormat}
                  onChange={(e) => setBarcodeFormat(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="EAN13">EAN-13 / GTIN-13</option>
                  <option value="CODE128">Code 128</option>
                  <option value="UPC">UPC-A</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Automation */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#6b8a4e]" />
              {t("settings_alerts_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  {t("settings_low_stock_alert")}
                </span>
                <span className="text-xs text-slate-500">
                  {t("settings_low_stock_sub")}
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-[#6b8a4e] focus:ring-[#6b8a4e]"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  {t("settings_reorder_label")}
                </span>
                <span className="text-xs text-slate-500">
                  {t("settings_reorder_sub")}
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoReorderSuggestions}
                onChange={(e) => setAutoReorderSuggestions(e.target.checked)}
                className="h-4 w-4 rounded text-[#6b8a4e] focus:ring-[#6b8a4e]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Currency */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#6b8a4e]" />
              {t("settings_currency_title")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("settings_currency_sub")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(["USD", "KHR"] as CurrencyCode[]).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => handleCurrencyChange(cur)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-xs font-bold transition-all ${
                    currency === cur
                      ? "bg-[#6b8a4e] border-[#6b8a4e] text-white shadow-sm"
                      : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#8aaa6e] hover:text-[#6b8a4e]"
                  }`}
                >
                  <span className="text-base">{cur === "USD" ? "$" : "៛"}</span>
                  <span>{cur === "USD" ? t("settings_currency_usd") : t("settings_currency_khr")}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              {currency === "KHR" ? t("settings_currency_khr_desc") : t("settings_currency_usd_desc")}
            </p>
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Languages className="h-4 w-4 text-[#6b8a4e]" />
              {t("page_settings_language_title")}
            </CardTitle>
            <CardDescription className="text-xs">{t("page_settings_language_sub")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {([
                { code: "en" as Language, native: "English" },
                { code: "km" as Language, native: "ខ្មែរ" },
              ]).map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-xs font-bold transition-all ${
                    language === lang.code
                      ? "bg-[#6b8a4e] border-[#6b8a4e] text-white shadow-sm"
                      : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#8aaa6e] hover:text-[#6b8a4e]"
                  }`}
                >
                  <span className="text-base">{lang.code === "en" ? "🇺🇸" : "🇰🇭"}</span>
                  <span>{lang.native}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" className="gap-2 bg-[#6b8a4e] hover:bg-[#5a7840] text-white font-semibold">
            <Save className="h-4 w-4" /> {t("page_settings_save_btn")}
          </Button>
        </div>
      </form>
    </div>
  );
}
