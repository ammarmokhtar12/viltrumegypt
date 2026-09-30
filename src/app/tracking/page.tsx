/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search, Package, Truck, CheckCircle, XCircle, Clock,
  MapPin, Calendar, ArrowLeft, RotateCcw
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// ─── Governorate delivery windows (business days from ship date) ──────────────
const CAIRO_GIZA = ["القاهرة", "الجيزة", "cairo", "giza", "6 أكتوبر", "6 october", "الشيخ زايد"];
const ALEX = ["الإسكندرية", "اسكندريه", "alexandria", "alex"];

function getBusinessDaysRange(gov: string): { min: number; max: number } {
  const lower = (gov || "").toLowerCase().trim();
  if (CAIRO_GIZA.some((g) => lower.includes(g.toLowerCase()))) return { min: 1, max: 2 };
  if (ALEX.some((g) => lower.includes(g.toLowerCase()))) return { min: 2, max: 3 };
  return { min: 3, max: 5 };
}

/** Add N business days to a date, skipping Fridays (day 5). */
function addBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 5) added++; // skip Friday
  }
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string; labelAr: string; desc: string;
  icon: any; color: string; bg: string; border: string;
}> = {
  pending: {
    label: "Pending",
    labelAr: "في المخزن",
    desc: "أوردرك وصلنا وبيتجهز — هنبدأ تجهيزه قريباً.",
    icon: Package, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
  },
  confirmed: {
    label: "Confirmed",
    labelAr: "تم التأكيد",
    desc: "تم تأكيد أوردرك وجاري التجهيز قبل الشحن.",
    icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue/20",
  },
  shipped: {
    label: "Shipped",
    labelAr: "في الطريق إليك",
    desc: "أوردرك اتشحن وماشي ناحيتك!",
    icon: Truck, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20",
  },
  delivered: {
    label: "Delivered",
    labelAr: "تم التسليم ✓",
    desc: "أوردرك وصل! نتمنى تعجبك المنتجات.",
    icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20",
  },
  cancelled: {
    label: "Cancelled",
    labelAr: "ملغي",
    desc: "تم إلغاء هذا الأوردر.",
    icon: XCircle, color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-700",
  },
  returned: {
    label: "Returned",
    labelAr: "مرتجع",
    desc: "تم إرجاع هذا الأوردر.",
    icon: RotateCcw, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20",
  },
};

const STEPS = ["pending", "confirmed", "shipped", "delivered"];

export default function TrackingPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  const handleTrack = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);

    const num = query.trim().replace("#", "");

    const { data } = await supabase
      .from("orders")
      .select("order_number, customer_name, customer_address, customer_governorate, status, items, total, tracking_number, shipping_company, created_at, updated_at, shipped_at")
      .or(`order_number.eq.${num},customer_phone.eq.${num},tracking_number.eq.${num}`)
      .single();

    if (data) {
      setOrder(data);
    } else {
      setError("مش لاقيين الأوردر ده. تأكد من رقم الأوردر أو رقم التليفون.");
    }
    setLoading(false);
  };

  // ─── Delivery estimation ──────────────────────────────────────────────────
  const deliveryEstimate = (() => {
    if (!order || order.status !== "shipped") return null;
    const gov = order.customer_governorate || order.customer_address || "";
    const shipDate = order.shipped_at ? new Date(order.shipped_at) : new Date(order.updated_at);
    const { min, max } = getBusinessDaysRange(gov);
    const earliest = addBusinessDays(shipDate, min);
    const latest = addBusinessDays(shipDate, max);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = latest < today;
    return { earliest, latest, isPast, gov };
  })();

  const statusInfo = order ? (STATUS_CONFIG[order.status] || STATUS_CONFIG.pending) : null;
  const StatusIcon = statusInfo?.icon || Package;
  const currentStep = order ? STEPS.indexOf(order.status) : -1;
  const isCancelledOrReturned = order?.status === "cancelled" || order?.status === "returned";

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <div className="min-h-screen bg-background text-foreground pt-32 sm:pt-44 pb-24">
        <div className="max-w-2xl mx-auto px-5">

          {/* Back */}
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors mb-10">
            <ArrowLeft size={14} />
            Back to Store
          </Link>

          {/* Header */}
          <div className="mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted mb-2">Viltrum Egypt</p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Track Your Order</h1>
            <p className="text-sm text-muted mt-2">ادخل رقم الأوردر أو رقم التليفون أو رقم البوليصة</p>
          </div>

          {/* Search */}
          <div className="flex gap-3 mb-10">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                placeholder="e.g. 1042 or 01xxxxxxxxx"
                className="w-full pl-11 pr-4 py-4 bg-surface border border-border-light rounded-2xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <button
              onClick={handleTrack}
              disabled={loading}
              className="px-8 py-4 bg-accent hover:opacity-90 text-white rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "..." : "Track"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="text-center py-8 text-muted text-sm bg-surface border border-border-light rounded-2xl">
              {error}
            </div>
          )}

          {/* Result */}
          {order && statusInfo && (
            <div className="space-y-5">

              {/* ── Status Hero Card ── */}
              <div className={`relative overflow-hidden rounded-3xl border ${statusInfo.border} ${statusInfo.bg} p-8`}>
                {/* background glow */}
                <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none ${statusInfo.color}`} style={{ background: "currentColor" }} />
                <div className="relative flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-2xl ${statusInfo.bg} border ${statusInfo.border} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon size={28} className={statusInfo.color} />
                  </div>
                  <div>
                    <p className={`text-2xl font-extrabold ${statusInfo.color}`}>{statusInfo.labelAr}</p>
                    <p className="text-sm text-muted mt-0.5">{statusInfo.desc}</p>
                  </div>
                </div>
              </div>

              {/* ── Delivery Estimate (shipped only) ── */}
              {deliveryEstimate && (
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400 mb-1">Estimated Delivery</p>
                    {deliveryEstimate.isPast ? (
                      <p className="text-sm font-bold text-foreground">المفروض وصلك — تواصل معنا لو محصلش</p>
                    ) : (
                      <>
                        <p className="text-base font-extrabold text-foreground">
                          {formatDate(deliveryEstimate.earliest)}
                          {" — "}
                          {formatDate(deliveryEstimate.latest)}
                        </p>
                        <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
                          <MapPin size={11} />
                          {deliveryEstimate.gov || "العنوان المسجل"}
                          <span className="text-muted/40 mx-1">·</span>
                          الجمعة إجازة — مش بيتوصل فيها
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Progress Steps ── */}
              {!isCancelledOrReturned && (
                <div className="bg-surface border border-border-light rounded-2xl p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted mb-6">Order Progress</p>
                  <div className="relative flex items-start">
                    {/* connector line */}
                    <div className="absolute top-5 left-5 right-5 h-0.5 bg-border-light" style={{ left: "calc(10% + 20px)", right: "calc(10% + 20px)" }} />
                    <div
                      className="absolute top-5 h-0.5 bg-gradient-to-r from-amber-400 via-blue-400 to-purple-400 transition-all duration-700"
                      style={{
                        left: "calc(10% + 20px)",
                        width: currentStep <= 0 ? "0%" : currentStep === 1 ? "33%" : currentStep === 2 ? "66%" : "100%",
                        right: "calc(10% + 20px)",
                      }}
                    />
                    {STEPS.map((step, i) => {
                      const info = STATUS_CONFIG[step];
                      const StepIcon = info.icon;
                      const isActive = i <= currentStep;
                      const isCurrent = i === currentStep;
                      return (
                        <div key={step} className="flex-1 flex flex-col items-center gap-2 relative z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                            isCurrent
                              ? `${info.bg} ${info.border} ring-4 ring-offset-2 ring-offset-surface ${info.color.replace("text-", "ring-")}`
                              : isActive
                              ? `${info.bg} ${info.border}`
                              : "bg-surface border-border-light"
                          }`}>
                            <StepIcon size={16} className={isActive ? info.color : "text-muted/30"} />
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider text-center leading-tight ${isActive ? "text-foreground" : "text-muted/40"}`}>
                            {info.labelAr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Order Details ── */}
              <div className="bg-surface border border-border-light rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border-light">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Order Details</p>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted">رقم الأوردر</span>
                    <span className="text-sm font-bold font-mono text-foreground">#{order.order_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted">الاسم</span>
                    <span className="text-sm font-medium text-foreground">{order.customer_name}</span>
                  </div>
                  {(order.customer_governorate || order.customer_address) && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted">العنوان</span>
                      <span className="text-sm text-foreground text-right max-w-[60%]">{order.customer_governorate || order.customer_address}</span>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted">رقم البوليصة</span>
                      <span className="text-sm font-mono text-purple-400 font-bold">{order.tracking_number}</span>
                    </div>
                  )}
                  {order.shipping_company && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted">شركة الشحن</span>
                      <span className="text-sm text-foreground">{order.shipping_company}</span>
                    </div>
                  )}
                  {order.shipped_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted">تاريخ الشحن</span>
                      <span className="text-sm text-foreground">
                        {new Date(order.shipped_at).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-border-light">
                    <span className="text-xs text-muted">الإجمالي</span>
                    <span className="text-base font-bold text-foreground">{Number(order.total).toLocaleString()} EGP</span>
                  </div>
                </div>

                {/* Items */}
                {order.items?.length > 0 && (
                  <div className="border-t border-border-light px-6 py-5 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted mb-4">المنتجات</p>
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted">Size: {item.size} · Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-bold text-foreground">{Number(item.price * item.quantity).toLocaleString()} EGP</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── WhatsApp CTA ── */}
              <a
                href="https://wa.me/201132507383"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-border-light bg-surface text-sm font-bold text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-500 transition-all duration-300"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                تواصل معنا على واتساب لو عندك سؤال
              </a>

            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
