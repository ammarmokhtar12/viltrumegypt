/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_DISPLAY: Record<string, { label: string; labelAr: string; icon: any; color: string; bg: string }> = {
  pending: { label: "Pending", labelAr: "في الانتظار", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  confirmed: { label: "Confirmed", labelAr: "تم التأكيد", icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/10" },
  shipped: { label: "Shipped", labelAr: "تم الشحن", icon: Truck, color: "text-purple-400", bg: "bg-purple-500/10" },
  delivered: { label: "Delivered", labelAr: "تم التسليم", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  cancelled: { label: "Cancelled", labelAr: "ملغي", icon: XCircle, color: "text-zinc-400", bg: "bg-zinc-500/10" },
  returned: { label: "Returned", labelAr: "مرتجع", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

export default function TrackingPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);

    const num = query.trim().replace("#", "");

    const { data } = await supabase
      .from("orders")
      .select("order_number, customer_name, status, items, total, tracking_number, shipping_company, created_at, updated_at")
      .or(`order_number.eq.${num},customer_phone.eq.${num},tracking_number.eq.${num}`)
      .single();

    if (data) {
      setOrder(data);
    } else {
      setError("مش لاقيين الأوردر ده. تأكد من رقم الأوردر أو رقم التليفون.");
    }
    setLoading(false);
  };

  const statusInfo = order ? STATUS_DISPLAY[order.status] || STATUS_DISPLAY.pending : null;
  const StatusIcon = statusInfo?.icon || Package;

  const steps = ["pending", "confirmed", "shipped", "delivered"];
  const currentStep = order ? steps.indexOf(order.status) : -1;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      <div className="max-w-2xl mx-auto px-5 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">تتبع الشحنة</h1>
          <p className="text-sm text-zinc-500">ادخل رقم الأوردر أو رقم التليفون أو رقم البوليصة</p>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-10">
          <div className="flex-1 relative">
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              placeholder="رقم الأوردر / رقم التليفون / رقم البوليصة"
              className="w-full pr-11 pl-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#c41e3a]/50"
            />
          </div>
          <button
            onClick={handleTrack}
            disabled={loading}
            className="px-8 py-4 bg-[#c41e3a] hover:bg-[#d42a46] text-white rounded-2xl text-sm font-bold transition-colors"
          >
            {loading ? "..." : "تتبع"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="text-center py-8 text-zinc-500 text-sm">{error}</div>
        )}

        {/* Order Result */}
        {order && statusInfo && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`p-8 rounded-2xl border ${statusInfo.bg} border-white/5 text-center`}>
              <StatusIcon size={48} className={`${statusInfo.color} mx-auto mb-4`} />
              <p className="text-2xl font-extrabold mb-1">{statusInfo.labelAr}</p>
              <p className="text-xs text-zinc-500">{statusInfo.label}</p>
            </div>

            {/* Progress Steps */}
            {order.status !== "cancelled" && order.status !== "returned" && (
              <div className="flex items-center justify-between px-4">
                {steps.map((step, i) => {
                  const stepInfo = STATUS_DISPLAY[step];
                  const isActive = i <= currentStep;
                  const StepIcon = stepInfo.icon;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? stepInfo.bg : "bg-zinc-900"} border ${isActive ? "border-white/10" : "border-zinc-800"}`}>
                        <StepIcon size={18} className={isActive ? stepInfo.color : "text-zinc-700"} />
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "text-zinc-300" : "text-zinc-700"}`}>
                        {stepInfo.labelAr}
                      </span>
                      {i < steps.length - 1 && (
                        <div className={`absolute h-0.5 w-12 ${isActive && i < currentStep ? "bg-emerald-500/30" : "bg-zinc-800"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Order Details */}
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">رقم الأوردر</span>
                <span className="text-sm font-bold font-mono">#{order.order_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">الاسم</span>
                <span className="text-sm">{order.customer_name}</span>
              </div>
              {order.tracking_number && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">رقم البوليصة</span>
                  <span className="text-sm font-mono text-purple-400">{order.tracking_number}</span>
                </div>
              )}
              {order.shipping_company && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">شركة الشحن</span>
                  <span className="text-sm">{order.shipping_company}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">الإجمالي</span>
                <span className="text-sm font-bold">{Number(order.total).toLocaleString()} EGP</span>
              </div>

              {/* Items */}
              <div className="border-t border-zinc-800 pt-4">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mb-3">المنتجات</p>
                {(order.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1.5">
                    <span className="text-zinc-400">{item.title} ({item.size}) x{item.quantity}</span>
                    <span className="text-zinc-300 font-bold">{Number(item.price).toLocaleString()} EGP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
