"use client";

import React, { useState, useEffect } from "react";
import { Tag, Plus, Edit2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import dataStore from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";
import { CategoryDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

const EMPTY_FORM = { name: "", description: "" };

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<CategoryDTO[]>(() => dataStore.getCategories());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryDTO | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    return dataStore.subscribe(() => setCategories(dataStore.getCategories()));
  }, []);

  const showMsg = (text: string, type: "success" | "error") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setIsCreateOpen(true);
  };

  const openEdit = (cat: CategoryDTO) => {
    setForm({ name: cat.name, description: cat.description ?? "" });
    setEditCategory(cat);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    dataStore.createCategory({ name: form.name.trim(), description: form.description.trim() || null });
    setIsCreateOpen(false);
    showMsg(t("page_categories_created"), "success");
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory || !form.name.trim()) return;
    dataStore.updateCategory(editCategory.id, { name: form.name.trim(), description: form.description.trim() || null });
    setEditCategory(null);
    showMsg(t("page_categories_updated"), "success");
  };

  const handleDelete = (cat: CategoryDTO) => {
    if (!window.confirm(`Delete "${cat.name}"?`)) return;
    dataStore.deleteCategory(cat.id);
    showMsg(t("page_categories_deleted"), "success");
  };

  const catForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          {t("label_name")} *
        </label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Electronics, Clothing…"
          required
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          {t("label_description")}
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          placeholder="Optional description…"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 resize-none outline-none focus:ring-2 focus:ring-[#6b8a4e]/30"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" className="bg-[#6b8a4e] hover:bg-[#5a7840] text-white text-xs font-semibold">
          {submitLabel}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Tag className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_categories_title")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {categories.length} {t("page_categories_sub")}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-[#6b8a4e] hover:bg-[#5a7840] text-white font-semibold">
          <Plus className="h-4 w-4" /> {t("page_categories_add")}
        </Button>
      </div>

      {/* Action feedback */}
      {actionMsg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          actionMsg.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
            : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
        }`}>
          {actionMsg.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {actionMsg.text}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">
                {t("page_categories_col_name")}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">
                {t("page_categories_col_description")}
              </th>
              <th className="text-center py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">
                {t("page_categories_col_products")}
              </th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  {t("page_categories_none")}
                </td>
              </tr>
            )}
            {categories.map((cat) => (
              <tr key={cat.id}
                className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#6b8a4e]/10 flex items-center justify-center text-[#6b8a4e] font-black text-xs shrink-0">
                      {cat.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{cat.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cat.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                  {cat.description || "—"}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{cat.productCount ?? 0}</span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#6b8a4e] hover:bg-[#edf2ed] dark:hover:bg-[#1a2a10] transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={t("page_categories_create_title")}
        size="md"
      >
        {catForm({ onSubmit: handleCreate, submitLabel: t("page_categories_create_btn") })}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editCategory}
        onClose={() => setEditCategory(null)}
        title={t("page_categories_edit_title")}
        description={editCategory?.slug}
        size="md"
      >
        {catForm({ onSubmit: handleEdit, submitLabel: t("page_categories_save_btn") })}
      </Modal>
    </div>
  );
}
