/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  ChevronDown,
  Check,
  X,
  DollarSign,
  Package,
  Phone,
  MapPin,
  RefreshCw,
  MessageCircle,
  BarChart2,
  Printer,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  confirmed: { label: "Confirmed", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  shipped: { label: "Shipped", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  delivered: { label: "Delivered", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  cancelled: { label: "Cancelled", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20" },
  returned: { label: "Returned", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
};

const STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered", "returned"];

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"];

function sortBySizeOrder(a: { size: string }, b: { size: string }) {
  const ai = SIZE_ORDER.indexOf(a.size.toUpperCase());
  const bi = SIZE_ORDER.indexOf(b.size.toUpperCase());
  if (ai !== -1 && bi !== -1) return ai - bi;
  return a.size.localeCompare(b.size);
}

function aggregateItems(ordersList: any[]) {
  const map: Record<string, number> = {};
  ordersList.forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item: any) => {
      const key = `${item.title}|||${item.size}`;
      map[key] = (map[key] || 0) + (item.quantity || 1);
    });
  });
  const rows = Object.entries(map)
    .map(([key, qty]) => {
      const [title, size] = key.split("|||");
      return { title, size, qty };
    })
    .sort((a, b) => b.qty - a.qty);

  const byProduct: Record<string, { size: string; qty: number }[]> = {};
  rows.forEach(({ title, size, qty }) => {
    if (!byProduct[title]) byProduct[title] = [];
    byProduct[title].push({ size, qty });
  });

  const totalUnits = rows.reduce((s, r) => s + r.qty, 0);
  return { rows, byProduct, totalUnits };
}

// ─── Analysis Panel ──────────────────────────────────────────────────────────
function AnalysisPanel({ ordersList, label, accentColor }: { ordersList: any[]; label: string; accentColor: string }) {
  const { byProduct, totalUnits } = aggregateItems(ordersList);

  if (Object.keys(byProduct).length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-8 text-center text-zinc-500 text-sm">
        No {label.toLowerCase()} orders to analyze.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Production Demand</p>
          <h3 className="font-semibold text-white text-lg mt-0.5">{label} Orders Analysis</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Units</p>
          <p className={`text-2xl font-bold ${accentColor}`}>{totalUnits}</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {Object.entries(byProduct).map(([title, sizes]) => {
          const productTotal = sizes.reduce((s, r) => s + r.qty, 0);
          return (
            <div key={title} className="bg-zinc-800/30 border border-zinc-800/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
                <p className="font-bold text-white text-sm">{title}</p>
                <span className={`text-xs font-bold ${accentColor} bg-zinc-800 px-3 py-1 rounded-full`}>
                  {productTotal} units
                </span>
              </div>
              <div className="p-4 flex flex-wrap gap-3">
                {sizes.sort(sortBySizeOrder).map(({ size, qty }) => (
                  <div key={size} className="flex flex-col items-center justify-center bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 min-w-[70px]">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{size}</span>
                    <span className={`text-2xl font-bold ${accentColor} leading-none mt-1`}>{qty}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Print Styles ────────────────────────────────────────────────────────────
const PRINT_STYLES = `
  @media print {
    @page { size: A4 portrait; margin: 5mm; }
    html, body { height: auto !important; overflow: visible !important; visibility: hidden !important; }
    .print-sheet-active { visibility: visible !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 200mm !important; margin: 0 !important; padding: 0 !important; }
    .print-sheet-active * { visibility: visible !important; }
    .print-page { width: 200mm !important; height: 277mm !important; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(3, 1fr); gap: 3mm; page-break-after: always; page-break-inside: avoid; break-inside: avoid; box-sizing: border-box; font-family: Arial, sans-serif; }
    .print-page:last-child { page-break-after: auto; }
    .p-card { border: 1.5px solid #222; border-radius: 3mm; padding: 2.5mm 3.5mm; display: flex; flex-direction: column; gap: 1mm; background: #fff; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid; overflow: hidden; }
    .p-card-confirmed { border-color: #3b82f6; }
    .p-card-empty { border: 1px dashed #ddd; border-radius: 3mm; background: #fafafa; }
    .p-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 1mm; }
    .p-status-badge { font-size: 6pt; font-weight: 800; padding: 0.3mm 1.5mm; border-radius: 1mm; text-transform: uppercase; letter-spacing: 0.04em; }
    .p-status-confirmed { background: #dbeafe; color: #1d4ed8; }
    .p-order-num { font-weight: 900; font-size: 10pt; color: #111; }
    .p-date { font-size: 7pt; color: #777; font-weight: 600; }
    .p-label { font-size: 5.5pt; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.06em; display: block; }
    .p-value-lg { font-weight: 800; font-size: 8.5pt; color: #111; margin-top: 0.2mm; line-height: 1.1; }
    .p-value-md { font-weight: 700; font-size: 8pt; color: #111; margin-top: 0.2mm; }
    .p-value-sm { font-weight: 600; font-size: 7pt; color: #333; margin-top: 0.2mm; line-height: 1.15; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .p-divider { border: none; border-top: 1px dashed #ccc; margin: 0.3mm 0; }
    .p-items { display: flex; flex-direction: column; gap: 0.8mm; overflow: hidden; }
    .p-item { display: flex; justify-content: space-between; align-items: center; background: #f4f4f4; border-radius: 1mm; padding: 0.8mm 1.5mm; }
    .p-item-name { font-weight: 700; font-size: 7pt; color: #111; }
    .p-item-size { font-size: 6.5pt; color: #666; margin-left: 1.5mm; }
    .p-item-price { font-weight: 700; font-size: 7pt; color: #333; white-space: nowrap; }
    .p-total-row { display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid #111; padding-top: 1mm; margin-top: 1.5mm; }
    .p-total-label { font-size: 6.5pt; font-weight: 700; color: #666; text-transform: uppercase; }
    .p-total-val { font-weight: 900; font-size: 11pt; color: #111; }
    .print-analysis-page { width: 200mm !important; min-height: 277mm !important; background: #fff; border: 2px solid #111; border-radius: 4mm; padding: 8mm 10mm; box-sizing: border-box; page-break-before: always; display: flex; flex-direction: column; gap: 5mm; font-family: Arial, sans-serif; }
    .print-analysis-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 3mm; }
    .print-analysis-title { font-size: 18pt; font-weight: 900; color: #111; text-transform: uppercase; letter-spacing: 0.05em; }
    .print-analysis-meta { text-align: right; font-size: 9pt; color: #555; font-weight: 600; line-height: 1.4; }
    .print-analysis-grid { display: flex; flex-direction: column; gap: 4mm; }
    .print-analysis-item { border: 1px solid #222; border-radius: 2mm; background: #fff; overflow: hidden; page-break-inside: avoid; break-inside: avoid; }
    .print-analysis-item-header { background: #f0f0f0; padding: 2.5mm 4mm; font-size: 10pt; font-weight: 800; color: #111; display: flex; justify-content: space-between; border-bottom: 1px solid #222; }
    .print-analysis-sizes-row { display: flex; flex-wrap: wrap; gap: 3mm; padding: 3mm 4mm; }
    .print-analysis-size-tag { border: 1px solid #aaa; border-radius: 1.5mm; padding: 2mm 3.5mm; display: flex; flex-direction: column; align-items: center; min-width: 14mm; background: #fafafa; }
    .print-analysis-size-label { font-size: 7pt; font-weight: 700; color: #666; text-transform: uppercase; }
    .print-analysis-size-qty { font-size: 13pt; font-weight: 900; color: #111; margin-top: 0.5mm; }
  }
`;

// ─── Print Order Card ────────────────────────────────────────────────────────
function PrintOrderCard({ order, cardClass = "" }: { order: any; cardClass?: string }) {
  const items = Array.isArray(order.items) ? order.items : [];
  return (
    <div className={`p-card ${cardClass}`}>
      <div className="p-header">
        <span className="p-order-num">#{order.order_number}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "2mm" }}>
          {cardClass.includes("confirmed") && (
            <span className="p-status-badge p-status-confirmed">Confirmed</span>
          )}
          <span className="p-date">
            {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
          </span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "3mm" }}>
        <div><span className="p-label">Name</span><p className="p-value-lg" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.customer_name}</p></div>
        <div><span className="p-label">Phone</span><p className="p-value-md" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.customer_phone}</p></div>
      </div>
      <div><span className="p-label">Address</span><p className="p-value-sm">{order.customer_address}</p></div>
      <hr className="p-divider" />
      <div>
        <span className="p-label">Order Details</span>
        <div className="p-items" style={{ marginTop: "0.5mm" }}>
          {items.map((item: any, i: number) => (
            <div key={i} className="p-item">
              <div style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>
                <span className="p-item-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                <span className="p-item-size" style={{ flexShrink: 0 }}>{item.size} x {item.quantity}</span>
              </div>
              <span className="p-item-price">{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-total-row">
        <span className="p-total-label">Total incl. shipping</span>
        <span className="p-total-val">{Number(order.total).toLocaleString()} EGP</span>
      </div>
    </div>
  );
}

// ─── Print Sheet ─────────────────────────────────────────────────────────────
function PrintSheet({ ordersList, printMode }: { ordersList: any[]; printMode: "pending" | "confirmed" }) {
  const PER_PAGE = 6;
  const pages: any[][] = [];
  for (let i = 0; i < ordersList.length; i += PER_PAGE) {
    pages.push(ordersList.slice(i, i + PER_PAGE));
  }
  const cardClass = printMode === "confirmed" ? "p-card-confirmed" : "";
  const { rows, byProduct, totalUnits } = aggregateItems(ordersList);

  return (
    <div className="hidden print:block print-sheet-active">
      <style>{PRINT_STYLES}</style>
      {pages.map((pageOrders, pi) => (
        <div key={pi} className="print-page">
          {pageOrders.map((order) => (
            <PrintOrderCard key={order.id} order={order} cardClass={cardClass} />
          ))}
          {pageOrders.length < PER_PAGE &&
            Array.from({ length: PER_PAGE - pageOrders.length }).map((_, i) => (
              <div key={`e-${i}`} className="p-card-empty" />
            ))}
        </div>
      ))}

      {rows.length > 0 && (
        <div className="print-analysis-page">
          <div className="print-analysis-header">
            <div>
              <h1 className="print-analysis-title">
                {printMode === "pending" ? "Production List (Pending)" : "Picking List (Confirmed)"}
              </h1>
              <p style={{ fontSize: "8.5pt", color: "#666", marginTop: "1mm", fontWeight: 700 }}>Viltrum Egypt Operations</p>
            </div>
            <div className="print-analysis-meta">
              <p>Date: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
              <p>Total Orders: {ordersList.length}</p>
              <p>Total Units: {totalUnits}</p>
            </div>
          </div>
          <div className="print-analysis-grid">
            {Object.entries(byProduct).map(([title, sizes]) => {
              const productTotal = sizes.reduce((s, r) => s + r.qty, 0);
              return (
                <div key={title} className="print-analysis-item">
                  <div className="print-analysis-item-header">
                    <span>{title}</span>
                    <span style={{ fontWeight: 900 }}>{productTotal} Units</span>
                  </div>
                  <div className="print-analysis-sizes-row">
                    {sizes.sort(sortBySizeOrder).map(({ size, qty }) => (
                      <div key={size} className="print-analysis-size-tag">
                        <span className="print-analysis-size-label">{size}</span>
                        <span className="print-analysis-size-qty">{qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showConfirmedAnalysis, setShowConfirmedAnalysis] = useState(false);
  const [printMode, setPrintMode] = useState<"pending" | "confirmed">("pending");

  useEffect(() => {
    fetchOrders();
  }, []);

  // Ctrl+P → print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, customer_email, customer_address, payment_method, payment_collected, status, total, items, created_at, referral_source")
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));

    if (newStatus === "confirmed") {
      const order = orders.find((o) => o.id === orderId);
      if (order) openWhatsAppConfirmation(order);
    }
  };

  const openWhatsAppConfirmation = (order: any) => {
    const items = (order.items || []) as any[];
    const itemLines = items.map((item: any, i: number) =>
      `${i + 1}. ${item.title}${item.bundle_label ? ` (${item.bundle_label})` : ""} — Size: ${item.size} × ${item.quantity} = ${(item.price * item.quantity).toLocaleString()} EGP`
    ).join("\n");

    const paymentMethod = order.payment_method === "vodafone_cash" ? "كاش عند الاستلام" : "InstaPay";

    const msg = `السلام عليكم ${order.customer_name} 👋

تم تأكيد أوردرك من *VILTRUM* ✅

🧾 *أوردر رقم #${order.order_number}*

📦 *المنتجات:*
${itemLines}

💰 *الإجمالي:* ${Number(order.total).toLocaleString()} EGP
💳 *طريقة الدفع:* ${paymentMethod}
📍 *العنوان:* ${order.customer_address}

هيتم التواصل معاك قبل الشحن 🚚
شكراً إنك اخترت VILTRUM 🔥`;

    const phone = (order.customer_phone || "").replace(/\D/g, "").replace(/^0/, "20");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const togglePaymentCollected = async (orderId: string, current: boolean) => {
    await supabase.from("orders").update({ payment_collected: !current }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, payment_collected: !current } : o));
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const pendingCount = pendingOrders.length;
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const confirmedCount = confirmedOrders.length;

  const filtered = orders.filter((o) => {
    const matchSearch = search === "" ||
      String(o.order_number).includes(search) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone?.includes(search) ||
      o.customer_address?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchPayment = paymentFilter === "all" ||
      (paymentFilter === "collected" && o.payment_collected) ||
      (paymentFilter === "not_collected" && !o.payment_collected);
    return matchSearch && matchStatus && matchPayment;
  });

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase font-bold">Loading Orders</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden Print Sheets */}
      {printMode === "pending" && <PrintSheet ordersList={pendingOrders} printMode="pending" />}
      {printMode === "confirmed" && <PrintSheet ordersList={confirmedOrders} printMode="confirmed" />}

      <div className="space-y-6 pb-12 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-1">Order Management</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">Orders</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Pending Analysis */}
            <button
              onClick={() => { setShowAnalysis((v) => !v); setShowConfirmedAnalysis(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all ${
                showAnalysis
                  ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                  : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-white"
              }`}
            >
              <BarChart2 size={13} />
              Pending
              {pendingCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${showAnalysis ? "bg-white/30 text-white" : "bg-amber-500 text-white"}`}>
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Confirmed Analysis */}
            <button
              onClick={() => { setShowConfirmedAnalysis((v) => !v); setShowAnalysis(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all ${
                showConfirmedAnalysis
                  ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20"
                  : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-white"
              }`}
            >
              <BarChart2 size={13} />
              Confirmed
              {confirmedCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${showConfirmedAnalysis ? "bg-white/30 text-white" : "bg-blue-500 text-white"}`}>
                  {confirmedCount}
                </span>
              )}
            </button>

            {/* Print Pending */}
            <button
              onClick={() => { setPrintMode("pending"); setTimeout(() => window.print(), 50); }}
              disabled={pendingCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-amber-500 text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
              title="Print pending orders (Ctrl+P)"
            >
              <Printer size={13} />
              Print ({pendingCount})
            </button>

            {/* Print Confirmed */}
            <button
              onClick={() => { setPrintMode("confirmed"); setTimeout(() => window.print(), 50); }}
              disabled={confirmedCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-blue-500 text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
              title="Print confirmed orders"
            >
              <Printer size={13} />
              Print ({confirmedCount})
            </button>

            <button onClick={fetchOrders} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white transition-all uppercase tracking-wider">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Analysis Panels */}
        {showAnalysis && <AnalysisPanel ordersList={pendingOrders} label="Pending" accentColor="text-amber-400" />}
        {showConfirmedAnalysis && <AnalysisPanel ordersList={confirmedOrders} label="Confirmed" accentColor="text-blue-400" />}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              placeholder="Search by order #, name, phone, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 uppercase tracking-wider focus:outline-none"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 uppercase tracking-wider focus:outline-none"
          >
            <option value="all">All Payments</option>
            <option value="collected">Collected</option>
            <option value="not_collected">Not Collected</option>
          </select>
        </div>

        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{filtered.length} orders found</p>

        {/* Orders List */}
        <div className="space-y-3">
          {filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedOrder === order.id;
            const items = order.items || [];

            return (
              <div key={order.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 sm:p-5 cursor-pointer hover:bg-zinc-800/20 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-base font-black text-white">#{order.order_number}</span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      {order.payment_collected ? (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">Paid</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20">Unpaid</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{order.customer_name} · {order.customer_phone}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-white">{fmt(order.total)} EGP</p>
                    <p className="text-[10px] text-zinc-600">{new Date(order.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  <ChevronDown size={16} className={`text-zinc-600 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-800/50 p-4 sm:p-5 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Phone size={14} className="text-zinc-600" /> {order.customer_phone}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <MapPin size={14} className="text-zinc-600" /> {order.customer_address}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <DollarSign size={14} className="text-zinc-600" /> {order.payment_method === "vodafone_cash" ? "Cash on Delivery" : "InstaPay"}
                      </div>
                      {order.customer_email && (
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span className="text-zinc-600 text-[10px]">@</span> {order.customer_email}
                        </div>
                      )}
                      {order.referral_source && (
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span className="text-[10px] font-bold text-zinc-600 uppercase">Source:</span>
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                            {order.referral_source}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Items</p>
                      {items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 bg-zinc-800/30 rounded-lg">
                          <span className="text-xs text-zinc-300">{item.title} · Size {item.size} × {item.quantity}</span>
                          <span className="text-xs font-bold text-zinc-400">{fmt(item.price * item.quantity)} EGP</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {STATUS_FLOW.map((s) => {
                        const sCfg = STATUS_CONFIG[s];
                        const isCurrent = order.status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => !isCurrent && updateOrderStatus(order.id, s)}
                            disabled={isCurrent}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                              isCurrent
                                ? `${sCfg.color} ${sCfg.bg} ${sCfg.border}`
                                : "text-zinc-600 border-zinc-800 hover:text-zinc-300 hover:border-zinc-600"
                            }`}
                          >
                            {sCfg.label}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => updateOrderStatus(order.id, "cancelled")}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          order.status === "cancelled"
                            ? "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"
                            : "text-zinc-600 border-zinc-800 hover:text-red-400 hover:border-red-500/30"
                        }`}
                      >
                        Cancel
                      </button>

                      <div className="w-px bg-zinc-800 mx-1" />

                      <button
                        onClick={() => openWhatsAppConfirmation(order)}
                        className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 text-green-500 border-green-500/20 bg-green-500/10 hover:bg-green-500/20"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </button>

                      <button
                        onClick={() => togglePaymentCollected(order.id, !!order.payment_collected)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                          order.payment_collected
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-zinc-600 border-zinc-800 hover:text-emerald-400 hover:border-emerald-500/30"
                        }`}
                      >
                        {order.payment_collected ? <Check size={12} /> : <DollarSign size={12} />}
                        {order.payment_collected ? "Payment Collected" : "Mark as Paid"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Package size={40} className="mx-auto text-zinc-800 mb-4" />
              <p className="text-sm font-bold text-zinc-600">No orders found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
