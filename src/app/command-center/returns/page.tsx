/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { exportReturnsToExcel } from "@/lib/exportReturnsExcel";
import {
  RotateCcw,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  Download,
  Calendar,
  StickyNote,
  Edit3,
  Save,
  User,
  Phone,
} from "lucide-react";

const REASON_MAP: Record<string, string> = {
  defective: "عيب تصنيع (Defective)",
  wrong_size: "مقاس غلط (Wrong Size)",
  wrong_item: "منتج غلط (Wrong Item)",
  not_as_described: "مش زي الوصف (Not as Described)",
  changed_mind: "غير رأيه (Changed Mind)",
  other: "سبب تاني (Other)",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  approved: { label: "Approved", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  rejected: { label: "Rejected", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  refunded: { label: "Refunded", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  exchanged: { label: "Exchanged", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [exportMonth, setExportMonth] = useState(""); // "" = all, "2026-10" = specific month
  const [exporting, setExporting] = useState(false);

  // Form
  const [orderNumber, setOrderNumber] = useState("");
  const [reason, setReason] = useState("defective");
  const [reasonDetails, setReasonDetails] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState("vodafone_cash");
  const [submitting, setSubmitting] = useState(false);

  // Inline Note Editing
  const [editingOrderNumber, setEditingOrderNumber] = useState<number | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data: returnsData, error: returnsErr } = await supabase
        .from("returns")
        .select("*")
        .order("created_at", { ascending: false });

      if (returnsErr) {
        if (returnsErr.code === "PGRST205" || returnsErr.message?.includes("does not exist")) {
          setDbError(true);
        } else {
          console.error(returnsErr);
        }
      } else {
        const rets = returnsData || [];
        setReturns(rets);

        // Fetch all matching orders
        const orderNums = [...new Set(rets.map((r: any) => r.order_number).filter(Boolean))];
        if (orderNums.length > 0) {
          const { data: ordersData } = await supabase
            .from("orders")
            .select("id, order_number, customer_name, customer_phone, customer_governorate, customer_address, notes, total, status")
            .in("order_number", orderNums);
          setAllOrders(ordersData || []);
        } else {
          setAllOrders([]);
        }
      }
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  };

  const ordersMap = useMemo(() => {
    const map = new Map<number, any>();
    allOrders.forEach((o) => {
      if (o.order_number) map.set(o.order_number, o);
    });
    return map;
  }, [allOrders]);

  // Get unique months from returns for filter dropdown
  const availableMonths = useMemo(() => {
    const months = new Map<string, string>();
    returns.forEach((r) => {
      if (r.created_at) {
        const d = new Date(r.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
        months.set(key, label);
      }
    });
    return Array.from(months.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [returns]);

  // Filter returns by selected month
  const filteredReturns = useMemo(() => {
    if (!exportMonth) return returns;
    return returns.filter((r) => {
      if (!r.created_at) return false;
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === exportMonth;
    });
  }, [returns, exportMonth]);

  const handleExportExcel = async () => {
    const toExport = filteredReturns;
    if (toExport.length === 0) {
      alert("لا توجد مرتجعات في الفترة المحددة");
      return;
    }
    setExporting(true);
    try {
      const orderNumbers = [...new Set(toExport.map((r) => r.order_number).filter(Boolean))];
      const { data: fullOrders } = await supabase
        .from("orders")
        .select("*")
        .in("order_number", orderNumbers);

      const monthLabel = exportMonth
        ? availableMonths.find(([k]) => k === exportMonth)?.[1] || exportMonth
        : "All";

      exportReturnsToExcel(toExport, fullOrders || allOrders, monthLabel);
    } catch (err) {
      console.error(err);
      alert("حصل خطأ أثناء التصدير");
    } finally {
      setExporting(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setSubmitting(true);

    try {
      const { data: order } = await supabase
        .from("orders")
        .select("id, order_number, total")
        .eq("order_number", parseInt(orderNumber))
        .single();

      if (!order) {
        alert("Order not found with this number.");
        setSubmitting(false);
        return;
      }

      const { data, error } = await supabase.from("returns").insert({
        order_id: order.id,
        order_number: order.order_number,
        reason,
        reason_details: reasonDetails.trim() || null,
        refund_amount: parseFloat(refundAmount) || order.total,
        refund_method: refundMethod,
        status: "pending",
      }).select();

      if (error) {
        alert(`Error: ${error.message}`);
      } else if (data) {
        await supabase.from("orders").update({ status: "returned" }).eq("id", order.id);
        setReturns((prev) => [data[0], ...prev]);
        setShowForm(false);
        setOrderNumber("");
        setReasonDetails("");
        setRefundAmount("");
        fetchReturns();
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateReturnStatus = async (id: string, status: string) => {
    await supabase.from("returns").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (status === "refunded") {
      await supabase.from("returns").update({ refund_completed: true }).eq("id", id);
    }
    setReturns((prev) => prev.map((r) => r.id === id ? { ...r, status, refund_completed: status === "refunded" } : r));
  };

  // Quick Inline Save Note
  const handleSaveInlineNote = async (orderNum: number) => {
    setSavingNote(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ notes: editingNoteValue.trim() || null, updated_at: new Date().toISOString() })
        .eq("order_number", orderNum);

      if (error) throw error;

      // Update local state
      setAllOrders((prev) =>
        prev.map((o) => (o.order_number === orderNum ? { ...o, notes: editingNoteValue.trim() || null } : o))
      );
      setEditingOrderNumber(null);
    } catch (err: any) {
      alert(`فشل حفظ الملاحظة: ${err.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <AlertTriangle size={40} className="mx-auto text-amber-400" />
        <h2 className="text-xl font-bold text-white">Returns Table Not Found</h2>
        <p className="text-xs text-zinc-500">Run the <code className="text-red-400">command-center-migration.sql</code> in Supabase SQL Editor.</p>
        <button onClick={fetchReturns} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all">
          <RefreshCw size={14} className="inline mr-2" />Retry
        </button>
      </div>
    );
  }

  const totalRefunded = filteredReturns.filter((r) => r.refund_completed).reduce((s: number, r: any) => s + Number(r.refund_amount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-1">Return Management</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Returns</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400">
            <span className="font-bold text-red-400">{filteredReturns.length}</span> returns · <span className="font-bold text-emerald-400">{totalRefunded.toLocaleString()} EGP</span> refunded
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all">
            <PlusCircle size={14} /> New Return
          </button>
        </div>
      </div>

      {/* Month Filter & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-zinc-500" />
          <select
            value={exportMonth}
            onChange={(e) => setExportMonth(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 font-bold focus:outline-none focus:border-red-500/50 min-w-[180px]"
          >
            <option value="">كل الشهور (All Months)</option>
            {availableMonths.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={exporting || filteredReturns.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/20"
        >
          <Download size={14} />
          {exporting ? "جاري التصدير..." : `تصدير Excel (${filteredReturns.length} مرتجع)`}
        </button>
      </div>

      {/* New Return Form */}
      {showForm && (
        <form onSubmit={handleCreateReturn} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Create Return Request</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Order Number *</label>
              <input type="number" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. 1001" className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Reason *</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none">
                {Object.entries(REASON_MAP).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Refund Amount (EGP)</label>
              <input type="number" step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="Leave empty for full refund" className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Refund Method</label>
              <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none">
                <option value="vodafone_cash">Vodafone Cash</option>
                <option value="instapay">InstaPay</option>
                <option value="store_credit">Store Credit</option>
                <option value="exchange">Exchange</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Details</label>
            <input type="text" value={reasonDetails} onChange={(e) => setReasonDetails(e.target.value)} placeholder="Additional details..." className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
              {submitting ? "Processing..." : "Submit Return"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Returns List */}
      <div className="space-y-4">
        {filteredReturns.map((ret) => {
          const sCfg = STATUS_MAP[ret.status] || STATUS_MAP.pending;
          const order = ordersMap.get(ret.order_number) || {};
          const isEditingNote = editingOrderNumber === ret.order_number;

          return (
            <div key={ret.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4 hover:border-zinc-700/60 transition-all">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <RotateCcw size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white">Order #{ret.order_number}</span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${sCfg.color}`}>
                        {sCfg.label}
                      </span>
                      {ret.refund_completed && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          Refund Complete
                        </span>
                      )}
                    </div>
                    {order.customer_name && (
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span className="flex items-center gap-1 text-zinc-300">
                          <User size={12} className="text-zinc-500" /> {order.customer_name}
                        </span>
                        {order.customer_phone && (
                          <span className="flex items-center gap-1 text-zinc-400 font-mono">
                            <Phone size={12} className="text-zinc-500" /> {order.customer_phone}
                          </span>
                        )}
                        {order.customer_governorate && (
                          <span className="text-zinc-500">({order.customer_governorate})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-sm font-bold text-red-400 block">{Number(ret.refund_amount || 0).toLocaleString()} EGP</span>
                  <span className="text-[11px] text-zinc-500">{new Date(ret.created_at).toLocaleDateString("en-GB")}</span>
                </div>
              </div>

              {/* Reason & Refund Info */}
              <div className="flex flex-wrap gap-4 text-xs text-zinc-500 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40">
                <span>السبب: <span className="text-zinc-300 font-medium">{REASON_MAP[ret.reason] || ret.reason}</span></span>
                {ret.reason_details && <span>التفاصيل: <span className="text-zinc-300">{ret.reason_details}</span></span>}
                <span>طريقة الاسترداد: <span className="text-zinc-300">{ret.refund_method || "N/A"}</span></span>
                {order.shipping_company && <span>الشحن: <span className="text-zinc-300">{order.shipping_company}</span></span>}
                {order.tracking_number && <span>التتبع: <span className="text-zinc-300 font-mono">{order.tracking_number}</span></span>}
              </div>

              {/* Admin Notes Section */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                    <StickyNote size={14} />
                    <span>ملاحظات الأدمن (Admin Notes)</span>
                  </div>
                  {!isEditingNote && (
                    <button
                      onClick={() => {
                        setEditingOrderNumber(ret.order_number);
                        setEditingNoteValue(order.notes || "");
                      }}
                      className="flex items-center gap-1 text-[11px] text-amber-400/80 hover:text-amber-300 hover:underline"
                    >
                      <Edit3 size={12} />
                      {order.notes ? "تعديل النوت" : "+ إضافة نوت"}
                    </button>
                  )}
                </div>

                {isEditingNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingNoteValue}
                      onChange={(e) => setEditingNoteValue(e.target.value)}
                      placeholder="اكتب ملاحظاتك عن هذا الأوردر أو العميل..."
                      rows={3}
                      className="w-full p-2.5 bg-zinc-900 border border-amber-500/30 rounded-lg text-xs text-amber-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveInlineNote(ret.order_number)}
                        disabled={savingNote}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold text-xs rounded-lg transition-all"
                      >
                        <Save size={12} />
                        {savingNote ? "جاري الحفظ..." : "حفظ النوت"}
                      </button>
                      <button
                        onClick={() => setEditingOrderNumber(null)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-all"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {order.notes ? (
                      <p className="text-xs text-amber-200/90 whitespace-pre-wrap leading-relaxed font-sans">
                        {order.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500 italic">لا توجد ملاحظات مسجلة بعد لهذا الأوردر.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/50">
                <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">تغيير الحالة:</span>
                <div className="flex flex-wrap gap-2">
                  {(["pending", "approved", "rejected", "refunded", "exchanged"] as const).map((s) => {
                    const cfg = STATUS_MAP[s];
                    const isCurrent = ret.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => !isCurrent && updateReturnStatus(ret.id, s)}
                        disabled={isCurrent}
                        className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${
                          isCurrent ? cfg.color : "text-zinc-600 border-zinc-800 hover:text-zinc-300 hover:border-zinc-600"
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {filteredReturns.length === 0 && (
          <div className="text-center py-20">
            <RotateCcw size={40} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-sm font-bold text-zinc-600">No returns yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
