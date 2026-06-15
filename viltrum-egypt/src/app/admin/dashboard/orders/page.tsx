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

// ─── Confirmed Analysis ────────────────────────────────────────────────────────
function ConfirmedAnalysisPanel({ confirmedOrders }: { confirmedOrders: Order[] }) {
  const map: Record<string, number> = {};
  confirmedOrders.forEach((order) => {
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
        No confirmed orders to analyze.
      </div>
    );
  }

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
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em]">Ready to Ship</p>
          <h3 className="font-semibold text-foreground text-lg mt-0.5">Confirmed Orders Analysis</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Total Units</p>
          <p className="text-2xl font-bold text-blue-500">{totalUnits}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {Object.entries(byProduct).map(([title, sizes]) => {
          const productTotal = sizes.reduce((s, r) => s + r.qty, 0);
          return (
            <div key={title} className="bg-background border border-border-light rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-blue-500/5 border-b border-border-light flex items-center justify-between">
                <p className="font-bold text-foreground text-sm">{title}</p>
                <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
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
                      className="flex flex-col items-center justify-center bg-surface border border-blue-500/20 rounded-xl px-4 py-3 min-w-[80px]"
                    >
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{size}</span>
                      <span className="text-2xl font-bold text-blue-500 leading-none mt-1">{qty}</span>
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

// ─── Shared Print Styles ───────────────────────────────────────────────────────
const PRINT_STYLES = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 5mm;
    }
    html, body {
      height: auto !important;
      overflow: visible !important;
      visibility: hidden !important;
    }
    .print-sheet-active {
      visibility: visible !important;
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 200mm !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .print-sheet-active * {
      visibility: visible !important;
    }
    .print-page {
      width: 200mm !important;
      height: 277mm !important;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: repeat(3, 1fr);
      gap: 3mm;
      page-break-after: always;
      page-break-inside: avoid;
      break-inside: avoid;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
    }
    .print-page:last-child {
      page-break-after: auto;
    }
    .p-card {
      border: 1.5px solid #222;
      border-radius: 3mm;
      padding: 2.5mm 3.5mm;
      display: flex;
      flex-direction: column;
      gap: 1mm;
      background: #fff;
      box-sizing: border-box;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
      height: auto;
    }
    .p-card-confirmed {
      border-color: #3b82f6;
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
      padding-bottom: 1mm;
    }
    .p-status-badge {
      font-size: 6pt;
      font-weight: 800;
      padding: 0.3mm 1.5mm;
      border-radius: 1mm;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .p-status-confirmed { background: #dbeafe; color: #1d4ed8; }
    .p-order-num { font-weight: 900; font-size: 10pt; color: #111; }
    .p-date { font-size: 7pt; color: #777; font-weight: 600; }
    .p-label { font-size: 5.5pt; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.06em; display: block; }
    .p-value-lg { font-weight: 800; font-size: 8.5pt; color: #111; margin-top: 0.2mm; line-height: 1.1; }
    .p-value-md { font-weight: 700; font-size: 8pt; color: #111; margin-top: 0.2mm; }
    .p-value-sm { 
      font-weight: 600; 
      font-size: 7pt; 
      color: #333; 
      margin-top: 0.2mm; 
      line-height: 1.15;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .p-divider { border: none; border-top: 1px dashed #ccc; margin: 0.3mm 0; }
    .p-items { 
      display: flex; 
      flex-direction: column; 
      gap: 0.8mm; 
      overflow: hidden; 
    }
    .p-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f4f4f4;
      border-radius: 1mm;
      padding: 0.8mm 1.5mm;
    }
    .p-item-name { font-weight: 700; font-size: 7pt; color: #111; }
    .p-item-size { font-size: 6.5pt; color: #666; margin-left: 1.5mm; }
    .p-item-price { font-weight: 700; font-size: 7pt; color: #333; white-space: nowrap; }
    .p-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1.5px solid #111;
      padding-top: 1mm;
      margin-top: 1.5mm;
    }
    .p-total-label { font-size: 6.5pt; font-weight: 700; color: #666; text-transform: uppercase; }
    .p-total-val { font-weight: 900; font-size: 11pt; color: #111; }

    /* Print Analysis Page Styles */
    .print-analysis-page {
      width: 200mm !important;
      min-height: 277mm !important;
      background: #fff;
      border: 2px solid #111;
      border-radius: 4mm;
      padding: 8mm 10mm;
      box-sizing: border-box;
      page-break-before: always;
      display: flex;
      flex-direction: column;
      gap: 5mm;
      font-family: Arial, sans-serif;
    }
    .print-analysis-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #111;
      padding-bottom: 3mm;
    }
    .print-analysis-title {
      font-size: 18pt;
      font-weight: 900;
      color: #111;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .print-analysis-meta {
      text-align: right;
      font-size: 9pt;
      color: #555;
      font-weight: 600;
      line-height: 1.4;
    }
    .print-analysis-grid {
      display: flex;
      flex-direction: column;
      gap: 4mm;
    }
    .print-analysis-item {
      border: 1px solid #222;
      border-radius: 2mm;
      background: #fff;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .print-analysis-item-header {
      background: #f0f0f0;
      padding: 2.5mm 4mm;
      font-size: 10pt;
      font-weight: 800;
      color: #111;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #222;
    }
    .print-analysis-sizes-row {
      display: flex;
      flex-wrap: wrap;
      gap: 3mm;
      padding: 3mm 4mm;
    }
    .print-analysis-size-tag {
      border: 1px solid #aaa;
      border-radius: 1.5mm;
      padding: 2mm 3.5mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 14mm;
      background: #fafafa;
    }
    .print-analysis-size-label {
      font-size: 7pt;
      font-weight: 700;
      color: #666;
      text-transform: uppercase;
    }
    .print-analysis-size-qty {
      font-size: 13pt;
      font-weight: 900;
      color: #111;
      margin-top: 0.5mm;
    }
  }
`;

// ─── Shared Order Card for Print ───────────────────────────────────────────────
function PrintOrderCard({ order, cardClass = "" }: { order: Order; cardClass?: string }) {
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
        <div>
          <span className="p-label">Name</span>
          <p className="p-value-lg" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.customer_name}</p>
        </div>
        <div>
          <span className="p-label">Phone</span>
          <p className="p-value-md" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.customer_phone}</p>
        </div>
      </div>

      <div>
        <span className="p-label">Address</span>
        <p className="p-value-sm" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{order.customer_address}</p>
      </div>

      <hr className="p-divider" />

      <div>
        <span className="p-label">Order Details</span>
        <div className="p-items" style={{ marginTop: "0.5mm", display: "flex", flexDirection: "column", gap: "0.8mm" }}>
          {items.map((item, i) => (
            <div key={i} className="p-item">
              <div style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>
                <span className="p-item-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                <span className="p-item-size" style={{ flexShrink: 0 }}>{item.size} × {item.quantity}</span>
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
}

// ─── Print Sheet (hidden, only for @media print) ───────────────────────────────
// A4 ورق طابعة عادي — 2 عمود × 3 صفوف = 6 أوردرات في الصفحة
function PrintSheet({ pendingOrders, printMode }: { pendingOrders: Order[]; printMode: "pending" | "confirmed" }) {
  const PER_PAGE = 6;
  const pages: Order[][] = [];
  for (let i = 0; i < pendingOrders.length; i += PER_PAGE) {
    pages.push(pendingOrders.slice(i, i + PER_PAGE));
  }

  const sheetId = printMode === "pending" ? "print-sheet-pending" : "print-sheet-confirmed";
  const cardClass = printMode === "confirmed" ? "p-card-confirmed" : "";

  // Calculate aggregation for the print-friendly list at the end
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

  const byProduct: Record<string, { size: string; qty: number }[]> = {};
  rows.forEach(({ title, size, qty }) => {
    if (!byProduct[title]) byProduct[title] = [];
    byProduct[title].push({ size, qty });
  });

  const totalUnits = rows.reduce((s, r) => s + r.qty, 0);

  return (
    <div id={sheetId} className="hidden print:block print-sheet-active">
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

      {/* Analysis page at the end of print document */}
      {rows.length > 0 && (
        <div className="print-analysis-page">
          <div className="print-analysis-header">
            <div>
              <h1 className="print-analysis-title">
                {printMode === "pending" ? "Production List (Pending)" : "Picking List (Confirmed)"}
              </h1>
              <p style={{ fontSize: "8.5pt", color: "#666", marginTop: "1mm", fontWeight: 700 }}>
                Viltrum Egypt Operations Protocol
              </p>
            </div>
            <div className="print-analysis-meta">
              <p>Date: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              <p>Total Orders: {pendingOrders.length}</p>
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
                    {sizes
                      .sort((a, b) => {
                        const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"];
                        const ai = sizeOrder.indexOf(a.size.toUpperCase());
                        const bi = sizeOrder.indexOf(b.size.toUpperCase());
                        if (ai !== -1 && bi !== -1) return ai - bi;
                        return a.size.localeCompare(b.size);
                      })
                      .map(({ size, qty }) => (
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

// ─── WhatsApp Order Message Helper ────────────────────────────────────────────
function buildWhatsAppMessage(order: Order): string {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemLines = items
    .map((item) => `  • ${item.title} (${item.size}) × ${item.quantity} — ${(item.price * item.quantity).toLocaleString()} EGP`)
    .join("\n");
  const dateStr = new Date(order.created_at).toLocaleDateString("ar-EG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return [
    `✅ تم تأكيد طلبك #${order.order_number}`,
    ``,
    `👤 الاسم: ${order.customer_name}`,
    `📅 التاريخ: ${dateStr}`,
    ``,
    `🛍️ تفاصيل الطلب:`,
    itemLines,
    ``,
    `💰 الإجمالي شامل الشحن: ${order.total.toLocaleString()} EGP`,
    `📍 العنوان: ${order.customer_address}`,
    ``,
    `شكراً لتسوقك مع Viltrum Egypt 🖤`,
  ].join("\n");
}

function sendWhatsApp(order: Order) {
  const phone = order.customer_phone.replace(/\D/g, "").replace(/^0/, "20");
  const message = encodeURIComponent(buildWhatsAppMessage(order));
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
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
  const [showConfirmedAnalysis, setShowConfirmedAnalysis] = useState(false);
  const [printMode, setPrintMode] = useState<"pending" | "confirmed">("pending");

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
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const confirmedCount = confirmedOrders.length;

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
      {/* Hidden Print Sheets — one for pending, one for confirmed */}
      {printMode === "pending" && <PrintSheet pendingOrders={pendingOrders} printMode="pending" />}
      {printMode === "confirmed" && <PrintSheet pendingOrders={confirmedOrders} printMode="confirmed" />}

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
          <div className="flex flex-wrap items-center gap-3">
            {/* Pending Analysis Toggle */}
            <button
              onClick={() => { setShowAnalysis((v) => !v); setShowConfirmedAnalysis(false); }}
              className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition-all ${showAnalysis
                  ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                  : "bg-surface border-border-light text-foreground hover:border-secondary"
                }`}
            >
              <BarChart2 size={14} />
              Pending Analysis
              {pendingCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${showAnalysis ? "bg-white/30 text-white" : "bg-amber-500 text-white"}`}>
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Confirmed Analysis Toggle */}
            <button
              onClick={() => { setShowConfirmedAnalysis((v) => !v); setShowAnalysis(false); }}
              className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition-all ${showConfirmedAnalysis
                  ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20"
                  : "bg-surface border-border-light text-foreground hover:border-secondary"
                }`}
            >
              <BarChart2 size={14} />
              Confirmed Analysis
              {confirmedCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${showConfirmedAnalysis ? "bg-white/30 text-white" : "bg-blue-500 text-white"}`}>
                  {confirmedCount}
                </span>
              )}
            </button>

            {/* Print Pending Button */}
            <button
              onClick={() => { setPrintMode("pending"); setTimeout(() => window.print(), 50); }}
              disabled={pendingCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl bg-amber-500 text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
              title="Print pending orders (Ctrl+P)"
            >
              <Printer size={14} />
              Print Pending ({pendingCount})
            </button>

            {/* Print Confirmed Button */}
            <button
              onClick={() => { setPrintMode("confirmed"); setTimeout(() => window.print(), 50); }}
              disabled={confirmedCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl bg-blue-500 text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
              title="Print confirmed orders"
            >
              <Printer size={14} />
              Print Confirmed ({confirmedCount})
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

        {/* Confirmed Analysis Panel */}
        {showConfirmedAnalysis && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <ConfirmedAnalysisPanel confirmedOrders={confirmedOrders} />
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
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${statusFilter === s
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
                  className={`bg-surface border rounded-[1.5rem] transition-all duration-300 overflow-hidden ${isExpanded ? 'border-primary shadow-xl ring-1 ring-primary/5' : 'border-border-light hover:border-secondary shadow-sm'
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
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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
                                  onClick={async () => {
                                    await updateStatus(order.id, "confirmed");
                                    sendWhatsApp(order);
                                  }}
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
                                      className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${order.status === status
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
