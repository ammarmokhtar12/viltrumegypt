/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RotateCcw, PlusCircle, Check, X, Search, RefreshCw, AlertTriangle } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [orderNumber, setOrderNumber] = useState("");
  const [reason, setReason] = useState("defective");
  const [reasonDetails, setReasonDetails] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState("vodafone_cash");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data, error } = await supabase.from("returns").select("*").order("created_at", { ascending: false });
      if (error) {
        if (error.code === "PGRST205" || error.message?.includes("does not exist")) setDbError(true);
        else console.error(error);
      } else {
        setReturns(data || []);
      }
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setSubmitting(true);

    try {
      // Find order
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
        // Update order status to returned
        await supabase.from("orders").update({ status: "returned" }).eq("id", order.id);
        setReturns((prev) => [data[0], ...prev]);
        setShowForm(false);
        setOrderNumber("");
        setReasonDetails("");
        setRefundAmount("");
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

  const totalRefunded = returns.filter((r) => r.refund_completed).reduce((s: number, r: any) => s + Number(r.refund_amount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-1">Return Management</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Returns</h1>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400">
            <span className="font-bold text-red-400">{returns.length}</span> returns · <span className="font-bold text-emerald-400">{totalRefunded.toLocaleString()} EGP</span> refunded
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all">
            <PlusCircle size={14} /> New Return
          </button>
        </div>
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
      <div className="space-y-3">
        {returns.map((ret) => {
          const sCfg = STATUS_MAP[ret.status] || STATUS_MAP.pending;
          return (
            <div key={ret.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RotateCcw size={16} className="text-red-400" />
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
                <span className="text-sm font-bold text-red-400">{Number(ret.refund_amount || 0).toLocaleString()} EGP</span>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                <span>Reason: <span className="text-zinc-300 font-medium">{REASON_MAP[ret.reason] || ret.reason}</span></span>
                {ret.reason_details && <span>Details: <span className="text-zinc-300">{ret.reason_details}</span></span>}
                <span>Method: <span className="text-zinc-300">{ret.refund_method || "N/A"}</span></span>
                <span>{new Date(ret.created_at).toLocaleDateString("en-GB")}</span>
              </div>

              {/* Status actions */}
              <div className="flex flex-wrap gap-2">
                {(["pending", "approved", "rejected", "refunded", "exchanged"] as const).map((s) => {
                  const cfg = STATUS_MAP[s];
                  const isCurrent = ret.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => !isCurrent && updateReturnStatus(ret.id, s)}
                      disabled={isCurrent}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${
                        isCurrent ? cfg.color : "text-zinc-600 border-zinc-800 hover:text-zinc-300 hover:border-zinc-600"
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {returns.length === 0 && (
          <div className="text-center py-20">
            <RotateCcw size={40} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-sm font-bold text-zinc-600">No returns yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
