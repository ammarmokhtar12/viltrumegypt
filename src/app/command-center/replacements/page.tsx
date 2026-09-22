/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  RefreshCw,
  PlusCircle,
  X,
  AlertTriangle,
  ArrowLeftRight,
  Search,
  ChevronDown,
  Package,
  Phone,
  MapPin,
  Truck,
  Check,
  Loader2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: "Pending",   color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"  },
  confirmed: { label: "Confirmed", color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20"   },
  shipped:   { label: "Shipped",   color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/20" },
  delivered: { label: "Delivered", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20"},
  cancelled: { label: "Cancelled", color: "text-zinc-400",    bg: "bg-zinc-500/10",    border: "border-zinc-500/20"   },
};

const STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

const EXCHANGE_TYPE_CONFIG = {
  same_type:      { label: "نفس النوع",    sublabel: "Same Type",      fee: 90,  color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30"   },
  different_type: { label: "نوع مختلف",    sublabel: "Different Type", fee: 150, color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-EG") + " EGP";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExchangeItem {
  title: string;
  size: string;
  quantity: number;
  price: number;
}

interface Replacement {
  id: string;
  replacement_number: number;
  original_order_id: string | null;
  original_order_number: number | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  returned_items: ExchangeItem[];
  new_items: ExchangeItem[];
  exchange_type: "same_type" | "different_type";
  shipping_fees: number;
  price_difference: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Empty item factory ───────────────────────────────────────────────────────

const emptyItem = (): ExchangeItem => ({ title: "", size: "", quantity: 1, price: 0 });

// ─── ItemsEditor Component ────────────────────────────────────────────────────

function ItemsEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: ExchangeItem[];
  onChange: (items: ExchangeItem[]) => void;
}) {
  const update = (idx: number, field: keyof ExchangeItem, val: string | number) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: field === "price" || field === "quantity" ? Number(val) : val };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={() => onChange([...items, emptyItem()])}
          className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
        >
          <PlusCircle size={11} /> إضافة صنف
        </button>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
          <input
            className="col-span-4 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-red-500/50 placeholder-zinc-600"
            placeholder="اسم المنتج"
            value={item.title}
            onChange={(e) => update(idx, "title", e.target.value)}
          />
          <input
            className="col-span-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-red-500/50 placeholder-zinc-600 text-center"
            placeholder="Size"
            value={item.size}
            onChange={(e) => update(idx, "size", e.target.value.toUpperCase())}
          />
          <input
            type="number"
            className="col-span-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-red-500/50 text-center"
            placeholder="Qty"
            min={1}
            value={item.quantity}
            onChange={(e) => update(idx, "quantity", e.target.value)}
          />
          <input
            type="number"
            className="col-span-3 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-red-500/50 placeholder-zinc-600"
            placeholder="سعر (EGP)"
            value={item.price || ""}
            onChange={(e) => update(idx, "price", e.target.value)}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            className="col-span-1 flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-[11px] text-zinc-600 italic text-center py-2">لا توجد أصناف — اضغط "إضافة صنف"</p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReplacementsPage() {
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ─── Form State ─────────────────────────────────────────────────────────────
  const [orderNumber, setOrderNumber]     = useState("");
  const [foundOrder, setFoundOrder]       = useState<any>(null);
  const [lookingUp, setLookingUp]         = useState(false);
  const [customerName, setCustomerName]   = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [returnedItems, setReturnedItems] = useState<ExchangeItem[]>([emptyItem()]);
  const [newItems, setNewItems]           = useState<ExchangeItem[]>([emptyItem()]);
  const [exchangeType, setExchangeType]   = useState<"same_type" | "different_type">("same_type");
  const [notes, setNotes]                 = useState("");
  const [submitting, setSubmitting]       = useState(false);

  // ─── Derived Pricing ─────────────────────────────────────────────────────────
  const shippingFees    = EXCHANGE_TYPE_CONFIG[exchangeType].fee;
  const returnedTotal   = returnedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const newTotal        = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const priceDifference = newTotal - returnedTotal;
  const grandTotal      = priceDifference + shippingFees;

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  useEffect(() => { fetchReplacements(); }, []);

  const fetchReplacements = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data, error } = await supabase
        .from("replacements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        if (error.code === "PGRST205" || error.message?.includes("does not exist")) setDbError(true);
        else console.error(error);
      } else {
        setReplacements(data || []);
      }
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  };

  // ─── Lookup Order ────────────────────────────────────────────────────────────
  const handleLookupOrder = async () => {
    if (!orderNumber.trim()) return;
    setLookingUp(true);
    setFoundOrder(null);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, customer_address, items, total")
      .eq("order_number", parseInt(orderNumber))
      .single();
    if (data) {
      setFoundOrder(data);
      setCustomerName(data.customer_name);
      setCustomerPhone(data.customer_phone);
      setCustomerAddress(data.customer_address);
      // Pre-fill returned items from order
      const orderItems: ExchangeItem[] = (data.items || []).map((i: any) => ({
        title: i.title || "",
        size: i.size || "",
        quantity: i.quantity || 1,
        price: i.price || 0,
      }));
      if (orderItems.length > 0) setReturnedItems(orderItems);
    } else {
      alert("❌ الأوردر مش موجود.");
    }
    setLookingUp(false);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;
    setSubmitting(true);

    try {
      const payload = {
        original_order_id: foundOrder?.id || null,
        original_order_number: foundOrder?.order_number || null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim(),
        returned_items: returnedItems.filter((i) => i.title.trim()),
        new_items: newItems.filter((i) => i.title.trim()),
        exchange_type: exchangeType,
        shipping_fees: shippingFees,
        price_difference: priceDifference,
        total: grandTotal,
        status: "pending",
        notes: notes.trim() || null,
      };

      const { data, error } = await supabase.from("replacements").insert(payload).select();
      if (error) {
        alert(`Error: ${error.message}`);
      } else if (data) {
        setReplacements((prev) => [data[0], ...prev]);
        resetForm();
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setOrderNumber(""); setFoundOrder(null);
    setCustomerName(""); setCustomerPhone(""); setCustomerAddress("");
    setReturnedItems([emptyItem()]); setNewItems([emptyItem()]);
    setExchangeType("same_type"); setNotes("");
  };

  // ─── Update Status ────────────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: string) => {
    await supabase.from("replacements").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setReplacements((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  // ─── Filtered ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = replacements;
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.customer_name.toLowerCase().includes(q) ||
          r.customer_phone.includes(q) ||
          String(r.replacement_number).includes(q) ||
          String(r.original_order_number || "").includes(q)
      );
    }
    return list;
  }, [replacements, filterStatus, search]);

  // ─── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     replacements.length,
    pending:   replacements.filter((r) => r.status === "pending").length,
    shipped:   replacements.filter((r) => r.status === "shipped").length,
    delivered: replacements.filter((r) => r.status === "delivered").length,
    revenue:   replacements.filter((r) => r.status === "delivered").reduce((s, r) => s + Number(r.total), 0),
  }), [replacements]);

  // ─── Loading & Error ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-5">
        <AlertTriangle size={40} className="mx-auto text-amber-400" />
        <h2 className="text-xl font-bold text-white">Replacements Table Not Found</h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          شغّل ملف{" "}
          <code className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md font-mono">
            replacements-schema.sql
          </code>{" "}
          في Supabase SQL Editor.
        </p>
        <button
          onClick={fetchReplacements}
          className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-all hover:border-zinc-500"
        >
          <RefreshCw size={13} className="inline mr-2" />
          Retry
        </button>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-1">Exchange Management</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Replacements</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchReplacements}
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-colors"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => { setShowForm(!showForm); resetForm(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-500/20"
          >
            <PlusCircle size={14} /> استبدال جديد
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total",     value: stats.total,     color: "text-white"        },
          { label: "Pending",   value: stats.pending,   color: "text-amber-400"    },
          { label: "Shipped",   value: stats.shipped,   color: "text-purple-400"   },
          { label: "Delivered", value: stats.delivered, color: "text-emerald-400"  },
          { label: "Revenue",   value: fmt(stats.revenue), color: "text-red-400", wide: true },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl px-4 py-3">
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">{s.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">إنشاء استبدال جديد</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-zinc-600 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Lookup Order */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              رقم الأوردر الأصلي (اختياري)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. 1001"
                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-red-500/50"
              />
              <button
                type="button"
                onClick={handleLookupOrder}
                disabled={lookingUp || !orderNumber}
                className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {lookingUp ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                بحث
              </button>
            </div>
            {foundOrder && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <Check size={13} className="text-emerald-400" />
                <span className="text-xs text-emerald-400 font-bold">
                  تم إيجاد أوردر #{foundOrder.order_number} — {foundOrder.customer_name}
                </span>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">اسم العميل *</label>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                placeholder="اسم العميل"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">رقم الموبايل *</label>
              <input
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                placeholder="01xxxxxxxxx"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">العنوان</label>
              <input
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                placeholder="العنوان"
              />
            </div>
          </div>

          {/* Exchange Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">نوع الاستبدال — رسوم الشحن</label>
            <div className="grid grid-cols-2 gap-3">
              {(["same_type", "different_type"] as const).map((type) => {
                const cfg = EXCHANGE_TYPE_CONFIG[type];
                const active = exchangeType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setExchangeType(type)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      active
                        ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                        : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold">{cfg.label}</span>
                      {active && <Check size={14} />}
                    </div>
                    <p className="text-[10px] font-medium opacity-70">{cfg.sublabel}</p>
                    <p className={`text-xl font-black mt-1 ${active ? cfg.color : "text-zinc-400"}`}>
                      {cfg.fee} EGP
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">shipping fee</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-800/40 rounded-xl p-4 space-y-3">
              <ItemsEditor
                label="📦 المنتجات المرتجعة (اللي بترجعهالك)"
                items={returnedItems}
                onChange={setReturnedItems}
              />
            </div>
            <div className="bg-zinc-800/40 rounded-xl p-4 space-y-3">
              <ItemsEditor
                label="✨ المنتجات الجديدة (اللي بتبعتها)"
                items={newItems}
                onChange={setNewItems}
              />
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">المرتجع</p>
              <p className="text-base font-bold text-zinc-300 mt-0.5">{fmt(returnedTotal)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">الجديد</p>
              <p className="text-base font-bold text-zinc-300 mt-0.5">{fmt(newTotal)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">رسوم شحن</p>
              <p className={`text-base font-bold mt-0.5 ${EXCHANGE_TYPE_CONFIG[exchangeType].color}`}>
                {fmt(shippingFees)}
              </p>
            </div>
            <div className="sm:border-l border-zinc-700/50 sm:pl-4">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">الإجمالي على العميل</p>
              <p className="text-lg font-black text-white mt-0.5">{fmt(grandTotal)}</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">ملاحظات</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 resize-none"
              placeholder="أي ملاحظات إضافية..."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <ArrowLeftRight size={13} />}
              {submitting ? "جارٍ الحفظ..." : "حفظ الاستبدال"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم العميل أو رقم الموبايل أو رقم الاستبدال..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-zinc-600 placeholder-zinc-600"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", ...STATUS_FLOW].map((s) => {
            const cfg = s === "all" ? null : STATUS_CONFIG[s];
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all capitalize ${
                  active
                    ? cfg
                      ? `${cfg.color} ${cfg.bg} ${cfg.border}`
                      : "text-white bg-zinc-700 border-zinc-600"
                    : "text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {s === "all" ? "All" : cfg?.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-24">
            <ArrowLeftRight size={44} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-sm font-bold text-zinc-600">لا توجد استبدالات</p>
            <p className="text-xs text-zinc-700 mt-1">ابدأ بإنشاء استبدال جديد</p>
          </div>
        )}

        {filtered.map((r) => {
          const sCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
          const eCfg = EXCHANGE_TYPE_CONFIG[r.exchange_type] || EXCHANGE_TYPE_CONFIG.same_type;
          const isExpanded = expandedId === r.id;

          return (
            <div
              key={r.id}
              className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden transition-all"
            >
              {/* Row header */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                    <ArrowLeftRight size={15} className="text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-white">#{r.replacement_number}</span>
                      {r.original_order_number && (
                        <span className="text-[9px] font-bold text-zinc-500">← Order #{r.original_order_number}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${sCfg.color} ${sCfg.bg} ${sCfg.border}`}>
                        {sCfg.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${eCfg.color} ${eCfg.bg} ${eCfg.border}`}>
                        {eCfg.label} · {r.shipping_fees} EGP شحن
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{r.customer_name} — {r.customer_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-wider">الإجمالي</p>
                    <p className="text-sm font-black text-white">{fmt(Number(r.total))}</p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-zinc-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-zinc-800/50 px-5 pb-5 pt-4 space-y-5">
                  {/* Customer */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Phone size={12} className="text-zinc-600" />
                      <a href={`tel:${r.customer_phone}`} className="hover:text-white transition-colors">{r.customer_phone}</a>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <MapPin size={12} className="text-zinc-600" />
                      <span>{r.customer_address || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Truck size={12} className="text-zinc-600" />
                      <span>{new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Returned */}
                    <div className="bg-zinc-800/40 rounded-xl p-4">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-3">📦 مرتجع من العميل</p>
                      {(r.returned_items || []).length === 0 ? (
                        <p className="text-xs text-zinc-600 italic">—</p>
                      ) : (
                        <div className="space-y-2">
                          {r.returned_items.map((item: ExchangeItem, i: number) => (
                            <div key={i} className="flex justify-between items-center">
                              <div>
                                <span className="text-xs font-semibold text-white">{item.title}</span>
                                <span className="ml-2 text-[10px] font-bold text-zinc-500 bg-zinc-700 px-1.5 py-0.5 rounded">{item.size}</span>
                                <span className="ml-1 text-[10px] text-zinc-600">×{item.quantity}</span>
                              </div>
                              <span className="text-xs font-bold text-zinc-400">{fmt(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* New */}
                    <div className="bg-zinc-800/40 rounded-xl p-4">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-3">✨ منتجات جديدة للعميل</p>
                      {(r.new_items || []).length === 0 ? (
                        <p className="text-xs text-zinc-600 italic">—</p>
                      ) : (
                        <div className="space-y-2">
                          {r.new_items.map((item: ExchangeItem, i: number) => (
                            <div key={i} className="flex justify-between items-center">
                              <div>
                                <span className="text-xs font-semibold text-white">{item.title}</span>
                                <span className="ml-2 text-[10px] font-bold text-zinc-500 bg-zinc-700 px-1.5 py-0.5 rounded">{item.size}</span>
                                <span className="ml-1 text-[10px] text-zinc-600">×{item.quantity}</span>
                              </div>
                              <span className="text-xs font-bold text-zinc-400">{fmt(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing breakdown */}
                  <div className="grid grid-cols-4 gap-3 bg-zinc-800/30 rounded-xl p-4 text-center">
                    <div>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-wider">مرتجع</p>
                      <p className="text-sm font-bold text-zinc-300 mt-0.5">{fmt(Number(r.returned_items?.reduce((s: number, i: ExchangeItem) => s + i.price * i.quantity, 0) || 0))}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-wider">جديد</p>
                      <p className="text-sm font-bold text-zinc-300 mt-0.5">{fmt(Number(r.new_items?.reduce((s: number, i: ExchangeItem) => s + i.price * i.quantity, 0) || 0))}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-wider">شحن</p>
                      <p className={`text-sm font-bold mt-0.5 ${eCfg.color}`}>{fmt(Number(r.shipping_fees))}</p>
                    </div>
                    <div className="border-l border-zinc-700">
                      <p className="text-[9px] text-zinc-600 uppercase tracking-wider">الإجمالي</p>
                      <p className="text-sm font-black text-white mt-0.5">{fmt(Number(r.total))}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {r.notes && (
                    <div className="px-4 py-2.5 bg-zinc-800/40 rounded-xl">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">ملاحظات</p>
                      <p className="text-xs text-zinc-300">{r.notes}</p>
                    </div>
                  )}

                  {/* WhatsApp */}
                  <div className="flex gap-2 flex-wrap">
                    <a
                      href={`https://wa.me/2${r.customer_phone}?text=${encodeURIComponent(
                        `مرحباً ${r.customer_name}،\nتم تسجيل طلب الاستبدال #${r.replacement_number} بنجاح ✅\nرسوم الشحن: ${r.shipping_fees} EGP\nسيتم التواصل معك قريباً.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                    >
                      <Phone size={12} /> WhatsApp
                    </a>
                  </div>

                  {/* Status Actions */}
                  <div>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-2">تغيير الحالة</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_FLOW.map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        const isCurrent = r.status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => !isCurrent && updateStatus(r.id, s)}
                            disabled={isCurrent}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                              isCurrent
                                ? `${cfg.color} ${cfg.bg} ${cfg.border} cursor-default`
                                : "text-zinc-600 border-zinc-800 hover:text-zinc-300 hover:border-zinc-600"
                            }`}
                          >
                            {isCurrent && <Check size={10} strokeWidth={3} />}
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
