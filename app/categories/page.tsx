"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
}

const EMPTY_FORM = { name: "", description: "" };

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showMsg = (text: string, type: "success" | "error") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setIsCreateOpen(true);
  };

  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, description: cat.description ?? "" });
    setEditCategory(cat);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: slugify(form.name.trim()),
          description: form.description.trim() || null,
        }),
      });
      if (res.ok) {
        setIsCreateOpen(false);
        await fetchCategories();
        showMsg(t("page_categories_created"), "success");
      } else {
        const data = await res.json();
        showMsg(data.error || "Failed to create", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory || !form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/categories/${editCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: slugify(form.name.trim()),
          description: form.description.trim() || null,
        }),
      });
      if (res.ok) {
        setEditCategory(null);
        await fetchCategories();
        showMsg(t("page_categories_updated"), "success");
      } else {
        const data = await res.json();
        showMsg(data.error || "Failed to update", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Delete "${cat.name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchCategories();
        showMsg(t("page_categories_deleted"), "success");
      } else {
        const data = await res.json();
        showMsg(data.error || "Failed to delete", "error");
      }
    } catch {
      showMsg("Failed to delete", "error");
    }
  };

  const catForm = ({ onSubmit }: { onSubmit: (e: React.FormEvent) => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          {t("label_name")} *
        </label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Electronics, Clothing…"
          required
          autoFocus
        />
        {form.name && (
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            slug: {slugify(form.name)}
          </p>
        )}
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          {t("label_description")}
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          placeholder="Optional description…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 resize-none outline-none focus:ring-2 focus:ring-[#6b8a4e]/30"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={saving} className="bg-[#6b8a4e] hover:bg-[#5a7840] text-white text-xs font-semibold gap-2">
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          {editCategory ? t("page_categories_save_btn") : t("page_categories_create_btn")}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Tag className="h-6 w-6 text-[#6b8a4e]" />
            {t("page_categories_title")}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {categories.length} {t("page_categories_sub")}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-[#6b8a4e] hover:bg-[#5a7840] text-white font-semibold">
          <Plus className="h-4 w-4" /> {t("page_categories_add")}
        </Button>
      </div>

      {actionMsg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          actionMsg.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {actionMsg.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {actionMsg.text}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="text-left py-3 px-4 font-semibold text-slate-500">{t("page_categories_col_name")}</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500">{t("page_categories_col_description")}</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-500">{t("page_categories_col_products")}</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    {t("page_categories_none")}
                  </td>
                </tr>
              ) : categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => openEdit(cat)}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#6b8a4e]/10 flex items-center justify-center text-[#6b8a4e] font-black text-xs shrink-0">
                        {cat.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{cat.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cat.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                    {cat.description || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-slate-900">{cat.productCount ?? 0}</span>
                  </td>
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(cat); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#6b8a4e] bg-[#edf2ed] hover:bg-[#d4e6c3] transition-colors"
                      >
                        <Edit2 className="h-3 w-3" /> {t("btn_edit")}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(cat); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> {t("btn_delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t("page_categories_create_title")} size="md">
        {catForm({ onSubmit: handleCreate })}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editCategory} onClose={() => setEditCategory(null)} title={t("page_categories_edit_title")} description={editCategory?.slug} size="md">
        {catForm({ onSubmit: handleEdit })}
      </Modal>
    </div>
  );
}
