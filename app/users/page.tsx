"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, UserCheck, Plus, Check, X, Shield, Users } from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { UserDTO, Role } from "@/types";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserDTO[]>(dataStore.getUsers());
  const [currentUser, setCurrentUser] = useState<UserDTO>(dataStore.getCurrentUser());

  useEffect(() => {
    const update = () => {
      setUsers(dataStore.getUsers());
      setCurrentUser(dataStore.getCurrentUser());
    };
    return dataStore.subscribe(update);
  }, []);

  const roles: Role[] = ["ADMIN", "WAREHOUSE_MANAGER", "SALES_MANAGER", "STAFF"];

  const permissionList = [
    { key: "view_dashboard",         labelKey: "perm_view_dashboard"    as const },
    { key: "manage_warehouses",      labelKey: "perm_manage_warehouses" as const },
    { key: "manage_products",        labelKey: "perm_manage_products"   as const },
    { key: "adjust_inventory",       labelKey: "perm_adjust_inventory"  as const },
    { key: "receive_purchase_orders",labelKey: "perm_receive_po"        as const },
    { key: "manage_sales_orders",    labelKey: "perm_manage_so"         as const },
    { key: "manage_stock_transfers", labelKey: "perm_manage_transfers"  as const },
    { key: "view_forecasting",       labelKey: "perm_view_forecasting"  as const },
    { key: "export_reports",         labelKey: "perm_export_reports"    as const },
    { key: "manage_users",           labelKey: "perm_manage_users"      as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_users_title")}
          </h1>
        </div>
      </div>

      {/* User Directory */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">{t("users_team_title")}</CardTitle>
          <CardDescription className="text-xs">
            {t("users_switch_hint")}
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold">
                <th className="py-3 px-4">{t("users_col_name")}</th>
                <th className="py-3 px-4">{t("label_email")}</th>
                <th className="py-3 px-4">{t("users_col_role")}</th>
                <th className="py-3 px-4">{t("users_col_warehouse")}</th>
                <th className="py-3 px-4">{t("users_col_status")}</th>
                <th className="py-3 px-4 text-right">{t("users_col_switch")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {users.map((u) => {
                const isCurrent = currentUser.id === u.id;
                return (
                  <tr key={u.id} className={isCurrent ? "bg-[#edf2ed]/40 dark:bg-[#1a2a10]/20" : "hover:bg-slate-50/50"}>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-[#6b8a4e] text-white flex items-center justify-center font-bold text-[10px]">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{u.name}</span>
                        {isCurrent && (
                          <span className="rounded bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-[10px] font-bold px-1.5 py-0.2">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#5a7840] dark:text-teal-400">
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{u.warehouseName || t("users_all_locations")}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => dataStore.setCurrentUser(u.id)}
                          className="h-7 text-xs"
                        >
                          {t("users_btn_switch")}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Granular Permission Matrix */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">{t("users_perm_matrix_title")}</CardTitle>
          <CardDescription className="text-xs">
            {t("users_perm_matrix_desc")}
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold">
                <th className="py-3 px-4">{t("users_perm_col")}</th>
                {roles.map((r) => (
                  <th key={r} className="py-3 px-4 text-center">
                    {r.replace("_", " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {permissionList.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {t(perm.labelKey)}
                  </td>
                  {roles.map((r) => {
                    const granted = (ROLE_PERMISSIONS[r] as any[]).includes(perm.key);
                    return (
                      <td key={r} className="py-3 px-4 text-center">
                        {granted ? (
                          <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                            <X className="h-3 w-3" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
