/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Package, Truck, CheckCircle, XCircle, Clock, MapPin, Calendar, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";

// ─── Delivery estimation helpers ──────────────────────────────────────────────
const CAIRO_GIZA = ["القاهرة", "الجيزة", "cairo", "giza", "6 أكتوبر", "6 october", "الشيخ زايد"];
const ALEX = ["الإسكندرية", "اسكندريه", "alexandria", "alex"];

function getDeliveryDays(gov: string): { min: number; max: number } {
  const l = (gov || "").toLowerCase();
  if (CAIRO_GIZA.some((g) => l.includes(g.toLowerCase()))) return { min: 1, max: 2 };
  if (ALEX.some((g) => l.includes(g.toLowerCase()))) return { min: 2, max: 3 };
  return { min: 3, max: 5 };
}

function addBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 5) added++;
  }
  return d;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
}

// ─── Status map ───────────────────────────────────────────────────────────────
const STATUSES: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending:   { label: "في المخزن — بيتجهز",    icon: Package,     color: "text-amber-400",   bg: "bg-amber-500/10" },
  confirmed: { label: "تم التأكيد",             icon: CheckCircle, color: "text-blue-400",    bg: "bg-blue-500/10" },
  shipped:   { label: "في الطريق إليك 🚚",      icon: Truck,       color: "text-purple-400",  bg: "bg-purple-500/10" },
  delivered: { label: "تم التسليم ✓",           icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  cancelled: { label: "ملغي",                   icon: XCircle,     color: "text-zinc-400",    bg: "bg-zinc-500/10" },
  returned:  { label: "مرتجع",                  icon: RotateCcw,   color: "text-red-400",     bg: "bg-red-500/10" },
};

const STEPS = ["pending", "confirmed", "shipped", "delivered"];

export default function TrackingPage() {
  const [orderNum, setOrderNum] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async () => {
    const num = orderNum.trim().replace("#", "");
    const ph = phone.trim();
    if (!num || !ph) {
      setError("لازم تدخل رقم الأوردر ورقم التليفون");
      return;
    }
    setLoading(true);
    setError("");
    setOrder(null);

    const { data, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", num)
      .eq("customer_phone", ph)
      .single();

    if (data) {
      setOrder(data);
    } else {
      console.error("Tracking lookup failed:", fetchErr);
      setError("مش لاقيين الأوردر ده — تأكد من رقم الأوردر ورقم التليفون");
    }
    setLoading(false);
  };

  // ─── Delivery estimate ──────────────────────────────────────────────────
  const estimate = (() => {
    if (!order || order.status !== "shipped") return null;
    const gov = order.customer_governorate || order.customer_address || "";
    const ship = order.shipped_at ? new Date(order.shipped_at) : null;
    if (!ship) return null;
    const { min, max } = getDeliveryDays(gov);
    return { from: addBusinessDays(ship, min), to: addBusinessDays(ship, max) };
  })();

  const info = order ? STATUSES[order.status] || STATUSES.pending : null;
  const Icon = info?.icon || Package;
  const step = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-lg mx-auto px-5 py-16">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors mb-12">
          <ArrowLeft size={12} /> Back to Store
        </Link>

        {/* Header */}
        <h1 className="text-2xl font-bold mb-1">Track Your Order</h1>
        <p className="text-xs text-zinc-500 mb-8">ادخل رقم الأوردر ورقم التليفون اللي اتسجل بيه</p>

        {/* ── Search Form ── */}
        {!order && (
          <div className="space-y-3 mb-6">
            <input
              type="text"
              value={orderNum}
              onChange={(e) => setOrderNum(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              placeholder="رقم الأوردر (مثال: 1042)"
              className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              placeholder="رقم التليفون (مثال: 01012345678)"
              className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <button
              onClick={handleTrack}
              disabled={loading}
              className="w-full py-3.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-40"
            >
              {loading ? "جاري البحث..." : "تتبع الأوردر"}
            </button>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-sm text-red-400 text-center py-4">{error}</p>}

        {/* ── Result ── */}
        {order && info && (
          <div className="space-y-4 animate-fade-in">

            {/* Status */}
            <div className={`rounded-2xl border border-white/5 ${info.bg} p-6 flex items-center gap-4`}>
              <div className={`w-12 h-12 rounded-xl ${info.bg} flex items-center justify-center`}>
                <Icon size={22} className={info.color} />
              </div>
              <div>
                <p className={`text-lg font-bold ${info.color}`}>{info.label}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Order #{order.order_number}</p>
              </div>
            </div>

            {/* Delivery Estimate */}
            {estimate && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 flex items-start gap-3">
                <Calendar size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-purple-400 mb-0.5">متوقع يوصلك</p>
                  <p className="text-sm font-bold text-white">{fmtDate(estimate.from)} — {fmtDate(estimate.to)}</p>
                  <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                    <MapPin size={9} />
                    {order.customer_governorate || "العنوان المسجل"} · الجمعة إجازة
                  </p>
                </div>
              </div>
            )}

            {/* Progress */}
            {order.status !== "cancelled" && order.status !== "returned" && (
              <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  {STEPS.map((s, i) => {
                    const st = STATUSES[s];
                    const StIcon = st.icon;
                    const active = i <= step;
                    return (
                      <div key={s} className="flex flex-col items-center gap-1.5 flex-1 relative">
                        {i > 0 && (
                          <div className={`absolute top-4 -left-1/2 right-1/2 h-0.5 ${i <= step ? "bg-emerald-500/40" : "bg-zinc-800"}`} />
                        )}
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border ${active ? `${st.bg} border-white/10` : "bg-zinc-900 border-zinc-800"}`}>
                          <StIcon size={14} className={active ? st.color : "text-zinc-700"} />
                        </div>
                        <span className={`text-[8px] font-bold uppercase tracking-wider ${active ? "text-zinc-300" : "text-zinc-700"}`}>
                          {s === "pending" ? "مخزن" : s === "confirmed" ? "مؤكد" : s === "shipped" ? "شُحن" : "وصل"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 space-y-2.5 text-sm">
              <Row label="الاسم" value={order.customer_name} />
              {order.tracking_number && <Row label="رقم البوليصة" value={order.tracking_number} accent />}
              {order.shipping_company && <Row label="شركة الشحن" value={order.shipping_company} />}
              <Row label="الإجمالي" value={`${Number(order.total).toLocaleString()} EGP`} bold />

              {/* Items */}
              <div className="border-t border-zinc-800 pt-3 mt-3 space-y-2">
                {(order.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-zinc-400">{item.title} ({item.size}) ×{item.quantity}</span>
                    <span className="text-zinc-300 font-bold">{(item.price * item.quantity).toLocaleString()} EGP</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setOrder(null)}
                className="flex-1 py-3 text-xs font-bold border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                بحث تاني
              </button>
              <a
                href="https://wa.me/201132507383"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 text-xs font-bold border border-zinc-800 rounded-xl text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors text-center"
              >
                تواصل واتساب
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`${bold ? "font-bold" : ""} ${accent ? "text-purple-400 font-mono" : "text-zinc-200"}`}>{value}</span>
    </div>
  );
}
