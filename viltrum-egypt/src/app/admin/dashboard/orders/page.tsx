/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element */
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types";
import {
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  Image as ImageIcon,
  Phone,
  MapPin,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  XCircle,
  DollarSign,
  User,
  ArrowRight,
  ExternalLink,
  ShoppingCart,
  Trash2,
  Printer,
  BarChart2,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500", icon: Clock },
  confirmed: { label: "Confirmed", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-500", icon: CheckCircle },
  shipped: { label: "Shipped", bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-500", icon: Truck },
  delivered: { label: "Delivered", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500", icon: PackageCheck },
  cancelled: { label: "Cancelled", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-500", icon: XCircle },
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

// ─── Pending Analysis ──────────────────────────────────────────────────────────
function PendingAnalysisPanel({ pendingOrders }: { pendingOrders: Order[] }) {
  // Aggregate: { "Product Title - Size": quantity }
  const map: Record<string, number> = {};
  pendingOrders.forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item) => {
      const key = `${item.title}|||${item.size}`;
      map[key] = (map[key] || 0) + item.quantity;
    });
  });

  const rows = Object.entries(map)
    .map(([key, qty]) => {
      const [title, size] = key.split("|||");
      return { title, size, qty };
    })
    .sort((a, b) => b.qty - a.qty);

  if (rows.length === 0) {
    return (
      <div className="bg-surface border border-border-light rounded-2xl p-8 text-center text-muted text-sm">
        No pending orders to analyze.
      </div>
    );
  }

  // Group by product title
  const byProduct: Record<string, { size: string; qty: number }[]> = {};
  rows.forEach(({ title, size, qty }) => {
    if (!byProduct[title]) byProduct[title] = [];
    byProduct[title].push({ size, qty });
  });

  const totalUnits = rows.reduce((s, r) => s + r.qty, 0);

  return (
    <div className="bg-surface border border-border-light rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em]">Production Demand</p>
          <h3 className="font-semibold text-foreground text-lg mt-0.5">Pending Orders Analysis</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Total Units</p>
          <p className="text-2xl font-bold text-foreground">{totalUnits}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {Object.entries(byProduct).map(([title, sizes]) => {
          const productTotal = sizes.reduce((s, r) => s + r.qty, 0);
          return (
            <div key={title} className="bg-background border border-border-light rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-primary/5 border-b border-border-light flex items-center justify-between">
                <p className="font-bold text-foreground text-sm">{title}</p>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {productTotal} units total
                </span>
              </div>
              <div className="p-4 flex flex-wrap gap-3">
                {sizes
                  .sort((a, b) => {
                    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"];
                    const ai = sizeOrder.indexOf(a.size.toUpperCase());
                    const bi = sizeOrder.indexOf(b.size.toUpperCase());
                    if (ai !== -1 && bi !== -1) return ai - bi;
                    return a.size.localeCompare(b.size);
                  })
                  .map(({ size, qty }) => (
                    <div
                      key={size}
                      className="flex flex-col items-center justify-center bg-surface border border-border-light rounded-xl px-4 py-3 min-w-[80px]"
                    >
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{size}</span>
                      <span className="text-2xl font-bold text-foreground leading-none mt-1">{qty}</span>
                      <span className="text-[9px] text-muted mt-1">units</span>
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

// ─── Print Sheet (hidden, only for @media print) ───────────────────────────────
// A4 ورق طابعة عادي — 2 عمود × 3 صفوف = 6 أوردرات في الصفحة
function PrintSheet({ pendingOrders }: { pendingOrders: Order[] }) {
  const PER_PAGE = 6;
  const pages: Order[][] = [];
  for (let i = 0; i < pendingOrders.length; i += PER_PAGE) {
    pages.push(pendingOrders.slice(i, i + PER_PAGE));
  }

  return (
    <div id="print-sheet" className="hidden print:block">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          body * { visibility: hidden !important; }
          #print-sheet, #print-sheet * { visibility: visible !important; }
          #print-sheet {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
          }
          .print-page {
            width: 200mm;
            height: 287mm;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: repeat(3, 1fr);
            gap: 3mm;
            page-break-after: always;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
          .p-card {
            border: 1.5px solid #222;
            border-radius: 3mm;
            padding: 5mm 6mm;
            display: flex;
            flex-direction: column;
            gap: 2.5mm;
            overflow: hidden;
            background: #fff;
          }
          .p-card-empty {
            border: 1px dashed #ddd;
            border-radius: 3mm;
            background: #fafafa;
          }
          .p-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #ccc;
            padding-bottom: 2mm;
          }
          .p-order-num { font-weight: 900; font-size: 13pt; color: #111; }
          .p-date { font-size: 7.5pt; color: #777; font-weight: 600; }
          .p-label { font-size: 6pt; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.06em; display: block; }
          .p-value-lg { font-weight: 800; font-size: 10.5pt; color: #111; margin-top: 0.5mm; }
          .p-value-md { font-weight: 700; font-size: 9pt; color: #111; margin-top: 0.5mm; }
          .p-value-sm { font-weight: 600; font-size: 8pt; color: #333; margin-top: 0.5mm; line-height: 1.3; }
          .p-divider { border: none; border-top: 1px dashed #ccc; margin: 1mm 0; }
          .p-items { flex: 1; display: flex; flex-direction: column; gap: 1.5mm; }
          .p-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f4f4f4;
            border-radius: 1.5mm;
            padding: 2mm 3mm;
          }
          .p-item-name { font-weight: 700; font-size: 8.5pt; color: #111; }
          .p-item-size { font-size: 7.5pt; color: #666; margin-left: 2mm; }
          .p-item-price { font-weight: 700; font-size: 8pt; color: #333; white-space: nowrap; }
          .p-total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 2px solid #111;
            padding-top: 2mm;
            margin-top: auto;
          }
          .p-total-label { font-size: 7pt; font-weight: 700; color: #666; text-transform: uppercase; }
          .p-total-val { font-weight: 900; font-size: 14pt; color: #111; }
        }
      `}</style>

      {pages.map((pageOrders, pi) => (
        <div key={pi} className="print-page">
          {pageOrders.map((order) => {
            const items = Array.isArray(order.items) ? order.items : [];
            return (
              <div key={order.id} className="p-card">
                <div className="p-header">
                  <span className="p-order-num">#{order.order_number}</span>
                  <span className="p-date">
                    {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                  </span>
                </div>

                <div>
                  <span className="p-label">Name</span>
                  <p className="p-value-lg">{order.customer_name}</p>
                </div>

                <div>
                  <span className="p-label">Phone</span>
                  <p className="p-value-md">{order.customer_phone}</p>
                </div>

                <div>
                  <span className="p-label">Address</span>
                  <p className="p-value-sm">{order.customer_address}</p>
                </div>

                <hr className="p-divider" />

                <div>
                  <span className="p-label">Order Details</span>
                  <div className="p-items" style={{ marginTop: "1.5mm" }}>
                    {items.map((item, i) => (
                      <div key={i} className="p-item">
                        <div>
                          <span className="p-item-name">{item.title}</span>
                          <span className="p-item-size">{item.size} × {item.quantity}</span>
                        </div>
                        <span className="p-item-price">{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-total-row">
                  <span className="p-total-label">Total incl. shipping</span>
                  <span className="p-total-val">{order.total.toLocaleString()} EGP</span>
                </div>
              </div>
            );
          })}

          {pageOrders.length < PER_PAGE &&
            Array.from({ length: PER_PAGE - pageOrders.length }).map((_, i) => (
              <div key={`e-${i}`} className="p-card-empty" />
            ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [screenshotModal, setScreenshotModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Ctrl+P → print pending orders
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
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    // Capture order data BEFORE state mutation to avoid stale closure read
    const orderToCancel = newStatus === "cancelled" ? orders.find(o => o.id === orderId) : null;

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (!error) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o))
        );

        // If the order was cancelled, restore the stock of all its items
        if (newStatus === "cancelled" && orderToCancel && Array.isArray(orderToCancel.items)) {
          try {
            for (const item of orderToCancel.items) {
              await supabase.rpc("increment_stock", {
                p_product_id: item.product_id,
                p_size: item.size,
                p_quantity: item.quantity,
              });
            }
          } catch (stockErr) {
            console.error("Failed to restore stock after cancellation:", stockErr);
          }
        }
      } else {
        console.error("Failed to update status:", error);
        alert(`Failed to update status: ${error.message}. \n\nIf you see a "violates check constraint" error, please run the SQL migration script 'add-cancelled-and-expenses.sql' in your Supabase SQL Editor.`);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("An unexpected error occurred while updating the status.");
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_phone.includes(searchQuery) ||
      String(o.order_number).includes(searchQuery);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const pendingCount = pendingOrders.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-border-light border-t-foreground rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.25em] text-muted uppercase font-bold">
            Ingesting Orders
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden Print Sheet — rendered for all pending orders */}
      <PrintSheet pendingOrders={pendingOrders} />

      <div className="space-y-12 animate-fade-in max-w-[1400px] mx-auto print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 pb-4">
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] block mb-2">Operations</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground border-l-4 border-primary pl-6 leading-none">
              Orders
            </h1>
            <p className="text-secondary text-sm font-medium mt-4 italic">Monitor and manage global customer transactions.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Pending Analysis Toggle */}
            <button
              onClick={() => setShowAnalysis((v) => !v)}
              className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition-all ${
                showAnalysis
                  ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                  : "bg-surface border-border-light text-foreground hover:border-secondary"
              }`}
            >
              <BarChart2 size={14} />
              Analysis
              {pendingCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${showAnalysis ? "bg-white/30 text-white" : "bg-amber-500 text-white"}`}>
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              disabled={pendingCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl bg-primary text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-black/10"
              title="Print pending orders (Ctrl+P)"
            >
              <Printer size={14} />
              Print Pending ({pendingCount})
            </button>

            <button
              onClick={fetchOrders}
              className="btn-outline flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Sync Data
            </button>
          </div>
        </div>

        {/* Pending Analysis Panel */}
        {showAnalysis && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <PendingAnalysisPanel pendingOrders={pendingOrders} />
          </div>
        )}

        {/* Stats Board */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { label: "Total Flow", value: orders.length, color: "text-foreground" },
             { label: "Critical (Pending)", value: pendingCount, color: "text-amber-500" },
             { label: "Total Volume", value: `${orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()} EGP`, color: "text-foreground" },
             { label: "Fulfillment", value: `${orders.length > 0 ? ((orders.filter(o => o.status === 'delivered').length / orders.length) * 100).toFixed(0) : 0}%`, color: "text-emerald-500" },
           ].map((s, i) => (
             <div key={i} className="bg-surface border border-border-light p-6 rounded-2xl">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">{s.label}</p>
                <p className={`text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
             </div>
           ))}
        </div>

        {/* Control Strip */}
        <div className="flex flex-col lg:flex-row gap-5 items-center">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search identity, phone or order code..."
              className="viltrum-input pl-11 !min-h-[2.75rem]"
            />
          </div>
          <div className="flex gap-2 p-1 bg-surface border border-border-light rounded-xl overflow-x-auto w-full lg:w-auto">
            {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === s
                    ? s === "cancelled" ? "bg-red-500 text-white shadow-md shadow-red-500/10" : "bg-primary text-white shadow-md shadow-primary/10"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {s} ({s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
              </button>
            ))}
          </div>
        </div>

        {/* Orders Grid/Table */}
        {filteredOrders.length === 0 ? (
          <div className="py-32 text-center bg-surface border border-border-light rounded-[2.5rem]">
             <ShoppingCart size={40} className="mx-auto text-muted opacity-20 mb-4" />
             <p className="text-sm font-bold text-muted tracking-widest uppercase italic">Transaction log is clean</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isExpanded = expandedOrder === order.id;
              const items = Array.isArray(order.items) ? order.items : [];

              return (
                <div 
                  key={order.id} 
                  className={`bg-surface border rounded-[1.5rem] transition-all duration-300 overflow-hidden ${
                    isExpanded ? 'border-primary shadow-xl ring-1 ring-primary/5' : 'border-border-light hover:border-secondary shadow-sm'
                  }`}
                >
                  {/* Visual Strip */}
                  <div 
                    className="px-6 py-5 flex items-center justify-between cursor-pointer group"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-6 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-background border border-border-light flex-shrink-0 flex items-center justify-center text-sm font-bold text-foreground shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                        {order.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground text-lg tracking-tight">
                            #{order.order_number}
                          </span>
                          <div className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${config.bg} ${config.text} ${config.border}`}>
                            {config.label}
                          </div>
                        </div>
                        <p className="text-xs font-bold text-muted mt-1 truncate uppercase tracking-widest">
                          {order.customer_name} · {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                         <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Grand Total</p>
                         <p className="text-lg font-bold text-foreground leading-none mt-1">{order.total.toLocaleString()} <span className="text-xs opacity-50">EGP</span></p>
                      </div>
                      <div className="p-2 rounded-xl bg-background border border-border-light text-muted group-hover:text-primary transition-all">
                         {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Content Reveal */}
                  {isExpanded && (
                    <div className="px-8 pb-8 pt-4 border-t border-border-light animate-in slide-in-from-top-2 duration-300 bg-background/30">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        
                        {/* Technical Info */}
                        <div className="lg:col-span-4 space-y-6">
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.25em]">Customer Coordinates</h4>
                              
                              <div className="p-4 bg-background border border-border-light rounded-2xl space-y-4">
                                 <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted"><Phone size={14} /></div>
                                    <div>
                                       <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Voice/Data</p>
                                        <a
                                          href={`https://wa.me/${order.customer_phone.replace(/\D/g, "").replace(/^0/, "20")}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-2 mt-0.5 group/wa"
                                        >
                                          <span className="text-sm font-bold text-foreground group-hover/wa:text-[#25D366] transition-colors">
                                            {order.customer_phone}
                                          </span>
                                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#25D366]/10 group-hover/wa:bg-[#25D366] transition-all">
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366] group-hover/wa:text-white transition-colors">
                                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                            </svg>
                                          </span>
                                        </a>
                                    </div>
                                 </div>
                                 <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted"><MapPin size={14} /></div>
                                    <div>
                                       <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Physical Location</p>
                                       <p className="text-sm font-bold text-foreground mt-0.5 leading-relaxed">{order.customer_address}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted"><DollarSign size={14} /></div>
                                    <div>
                                       <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Payment Protocol</p>
                                       <p className="text-sm font-bold text-foreground mt-0.5 uppercase">{order.payment_method?.replace('_', ' ')}</p>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {order.payment_screenshot_url && (
                             <button
                               onClick={() => setScreenshotModal(order.payment_screenshot_url)}
                               className="w-full p-4 bg-primary text-white rounded-2xl flex items-center justify-between group hover:opacity-90 transition-all font-bold text-xs uppercase tracking-widest"
                             >
                               <span>Verification Proof</span>
                               <ExternalLink size={14} />
                             </button>
                           )}
                        </div>

                        {/* Item Matrix */}
                        <div className="lg:col-span-8 space-y-6">
                          <div className="flex justify-between items-center">
                             <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.25em]">Unit Inventory ({items.length})</h4>
                             <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Order Hash: {order.id.split('-')[0]}</span>
                          </div>
                          
                          <div className="space-y-3">
                            {items.map((item, i) => (
                              <div
                                key={i}
                                className="flex justify-between items-center p-4 bg-surface border border-border-light rounded-2xl hover:border-secondary transition-all"
                              >
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center text-muted opacity-50"><PackageCheck size={18} /></div>
                                   <div>
                                     <p className="text-sm font-bold text-foreground leading-none">{item.title}</p>
                                     <p className="text-[10px] text-muted font-bold mt-1.5 uppercase tracking-widest">
                                       Size {item.size} · {item.quantity} Units
                                     </p>
                                   </div>
                                </div>
                                <span className="font-bold text-foreground">
                                  {(item.price * item.quantity).toLocaleString()} <span className="text-[10px] opacity-40 ml-1">EGP</span>
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Status Management */}
                          <div className="pt-8 border-t border-border-light">
                             <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.25em] mb-5">Command Control</h4>
                             <div className="flex flex-wrap items-center gap-3">
                               {/* Workflow Actions */}
                               {order.status === "pending" && (
                                 <button
                                   onClick={() => updateStatus(order.id, "confirmed")}
                                   className="h-12 px-6 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                                 >
                                   <CheckCircle size={16} />
                                   Confirm Mission
                                 </button>
                               )}
                               
                               {order.status === "confirmed" && (
                                 <button
                                   onClick={() => updateStatus(order.id, "shipped")}
                                   className="h-12 px-6 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                                 >
                                   <Truck size={16} />
                                   Commence Logistics
                                 </button>
                               )}

                               {order.status === "shipped" && (
                                 <button
                                   onClick={() => updateStatus(order.id, "delivered")}
                                   className="h-12 px-6 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                                 >
                                   <PackageCheck size={16} />
                                   Confirm Delivery
                                 </button>
                               )}

                               {order.status !== "cancelled" && order.status !== "delivered" && (
                                 <button
                                   onClick={() => {
                                     if (confirm("Executing protocol override. Confirm cancellation of this order?")) {
                                       updateStatus(order.id, "cancelled");
                                     }
                                   }}
                                   className="h-12 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                                 >
                                   <XCircle size={16} />
                                   Cancel Order
                                 </button>
                               )}

                               <div className="h-10 w-px bg-border-light mx-2"></div>

                               {/* Universal Toggles */}
                               <div className="flex gap-1.5 p-1 bg-background border border-border-light rounded-xl">
                                 {STATUSES.map((status) => {
                                   const sc = STATUS_CONFIG[status];
                                   return (
                                     <button
                                       key={status}
                                       onClick={() => updateStatus(order.id, status)}
                                       className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                         order.status === status
                                           ? "bg-surface text-foreground shadow-sm ring-1 ring-border-light"
                                           : "text-muted hover:text-foreground"
                                       }`}
                                     >
                                       {sc.label}
                                     </button>
                                   );
                                 })}
                               </div>

                               <button
                                 onClick={async () => {
                                   if (confirm("Executing high-level purge. Confirm deletion of order data?")) {
                                     const { error } = await supabase.from("orders").delete().eq("id", order.id);
                                     if (!error) setOrders(orders.filter(o => o.id !== order.id));
                                   }
                                 }}
                                 className="h-10 w-10 flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-auto"
                                 title="Purge Record"
                               >
                                 <Trash2 size={16} />
                               </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Proof Modal */}
        {screenshotModal && (
          <div
            className="fixed inset-0 z-[110] bg-primary/40 backdrop-blur-xl flex items-center justify-center p-4 lg:p-10 animate-fade-in"
            onClick={() => setScreenshotModal(null)}
          >
            <div
              className="bg-background max-w-2xl w-full max-h-full overflow-y-auto rounded-3xl border border-secondary shadow-2xl scale-100 animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-16 px-6 flex items-center justify-between border-b border-border-light sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Verification Protocol Image</h3>
                <button
                  onClick={() => setScreenshotModal(null)}
                  className="p-2 text-muted hover:text-foreground hover:bg-surface rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-8">
                <img src={screenshotModal} alt="Payment proof" className="w-full rounded-2xl shadow-lg border border-border-light" />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
