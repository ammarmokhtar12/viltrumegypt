/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  Truck,
  Loader2,
  PackageCheck,
  Edit,
  Plus,
  Trash2,
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

// ─── Edit Order Modal ────────────────────────────────────────────────────────
function EditOrderModal({ order, onClose, onSave }: { order: any; onClose: () => void; onSave: (updated: any) => void }) {
  const [address, setAddress] = useState(order.customer_address || "");
  const [items, setItems] = useState<any[]>(Array.isArray(order.items) ? [...order.items] : []);
  const [saving, setSaving] = useState(false);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems([...items, { title: "New Item", size: "M", quantity: 1, price: 0 }]);
  };

  const handleSave = async () => {
    setSaving(true);
    const oldItemTotal = (order.items || []).reduce((sum: number, item: any) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    const newTotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    const shippingAndFees = Number(order.total || 0) - oldItemTotal;
    const finalTotal = newTotal + shippingAndFees;

    const { error } = await supabase.from("orders").update({
      customer_address: address,
      items: items,
      total: finalTotal,
      updated_at: new Date().toISOString()
    }).eq("id", order.id);

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      onSave({ ...order, customer_address: address, items, total: finalTotal });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Order #{order.order_number}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Address</label>
            <input 
              value={address} 
              onChange={e => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Items</label>
              <button onClick={addItem} className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300">
                <Plus size={14} /> Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50">
                  <input 
                    value={item.title || ""} 
                    onChange={e => handleItemChange(i, "title", e.target.value)}
                    placeholder="Product Name"
                    className="flex-1 min-w-[120px] px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none"
                  />
                  <input 
                    value={item.size || ""} 
                    onChange={e => handleItemChange(i, "size", e.target.value)}
                    placeholder="Size"
                    className="w-20 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none"
                  />
                  <input 
                    type="number"
                    value={item.quantity || 1} 
                    onChange={e => handleItemChange(i, "quantity", parseInt(e.target.value) || 1)}
                    placeholder="Qty"
                    className="w-16 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none"
                  />
                  <input 
                    type="number"
                    value={item.price || 0} 
                    onChange={e => handleItemChange(i, "price", parseFloat(e.target.value) || 0)}
                    placeholder="Price"
                    className="w-24 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none"
                  />
                  <button onClick={() => removeItem(i)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-zinc-500">No items.</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
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
  const [dateFilter, setDateFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [displayCount, setDisplayCount] = useState(100);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showConfirmedAnalysis, setShowConfirmedAnalysis] = useState(false);
  const [printMode, setPrintMode] = useState<"pending" | "confirmed">("pending");
  const [shippingIds, setShippingIds] = useState<Set<string>>(new Set());
  const [selectedForShip, setSelectedForShip] = useState<Set<string>>(new Set());
  const [safwaLoading, setSafwaLoading] = useState<Set<string>>(new Set());
  const [editingOrder, setEditingOrder] = useState<any>(null);

  const toggleSelectForShip = (id: string) => {
    setSelectedForShip((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const shipToPanther = async (orderIds: string[]) => {
    setShippingIds(new Set(orderIds));
    try {
      const res = await fetch("/api/panther", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ship", orderIds }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOrders();
        alert(`تم شحن ${orderIds.length} أوردر بنجاح لـ Panther Express`);
      } else {
        alert("حصل مشكلة: " + (data.error || "Unknown error"));
      }
    } catch {
      alert("فشل الاتصال بـ Panther Express");
    }
    setShippingIds(new Set());
  };

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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, customer_address, payment_method, payment_collected, status, total, items, created_at, referral_source, tracking_number, shipping_company")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("Orders fetch error:", error);
      alert("Error loading orders: " + error.message);
    }
    setOrders(data || []);
    setLoading(false);
  }, []);

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

  const openWhatsAppFeedback = (order: any) => {
    const msg = `السلام عليكم ${order.customer_name} 👋

أوردرك رقم *#${order.order_number}* من *VILTRUM* وصلك ✅

رأيك يهمنا جداً 💬

🤔 *إيه رأيك في المنتج؟ الخامة عجبتك؟*

📝 *إيه اللي ممكن نحسنه عشان تجربتك تكون أحسن؟*

🔥 *تحب لما ينزل عروض جديدة نبلغك بيها قبل الإعلان؟*

ردك يفرق معانا كتير 🖤
شكراً إنك اخترت VILTRUM ✨`;

    const phone = (order.customer_phone || "").replace(/\D/g, "").replace(/^0/, "20");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const togglePaymentCollected = async (orderId: string, current: boolean) => {
    await supabase.from("orders").update({ payment_collected: !current }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, payment_collected: !current } : o));
  };

  const toggleAddedToPanther = async (orderId: string, current: boolean) => {
    const newCompany = current ? null : "Panther Express";
    const updates: Record<string, unknown> = { shipping_company: newCompany };
    if (current) updates.tracking_number = null;
    await supabase.from("orders").update(updates).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, shipping_company: newCompany, ...(current ? { tracking_number: null } : {}) } : o));
  };

  const addToSafwa = async (orderId: string) => {
    setSafwaLoading((prev) => new Set(prev).add(orderId));
    try {
      const res = await fetch("/api/safwa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", orderIds: [orderId] }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, shipping_company: "ALSAFWA" } : o));
      } else {
        alert("خطأ: " + (data.error || "Unknown"));
      }
    } catch {
      alert("فشل الاتصال");
    }
    setSafwaLoading((prev) => { const s = new Set(prev); s.delete(orderId); return s; });
  };

  const removeFromSafwa = async (orderId: string) => {
    setSafwaLoading((prev) => new Set(prev).add(orderId));
    try {
      const res = await fetch("/api/safwa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", orderIds: [orderId] }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, shipping_company: null, tracking_number: null } : o));
      } else {
        alert("خطأ: " + (data.error || "Unknown"));
      }
    } catch {
      alert("فشل الاتصال");
    }
    setSafwaLoading((prev) => { const s = new Set(prev); s.delete(orderId); return s; });
  };

  const saveWaybill = async (orderId: string, waybill: string) => {
    await supabase.from("orders").update({ tracking_number: waybill }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, tracking_number: waybill } : o));
  };

  const getEstimatedDelivery = (address: string) => {
    const cairoGiza = ["القاهرة", "الجيزة", "مدينة نصر", "المعادي", "حلوان", "6 أكتوبر", "الرحاب", "التجمع", "العبور", "الشروق", "شبرا", "عين شمس", "المقطم", "الهرم", "فيصل", "الدقي", "المهندسين", "الزمالك", "وسط البلد", "مصر الجديدة"];
    const isCairoGiza = cairoGiza.some((c) => address?.includes(c));
    const daysToAdd = isCairoGiza ? 1 : 3;

    const today = new Date();
    let deliveryStart = new Date(today);
    deliveryStart.setDate(deliveryStart.getDate() + daysToAdd);
    if (deliveryStart.getDay() === 5) deliveryStart.setDate(deliveryStart.getDate() + 1);

    let deliveryEnd = new Date(deliveryStart);
    deliveryEnd.setDate(deliveryEnd.getDate() + 1);
    if (deliveryEnd.getDay() === 5) deliveryEnd.setDate(deliveryEnd.getDate() + 1);

    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    return `${days[deliveryStart.getDay()]} أو ${days[deliveryEnd.getDay()]}`;
  };

  const openShippingConfirmation = (order: any) => {
    const estimatedDay = getEstimatedDelivery(order.customer_address);
    const waybill = order.tracking_number || "";

    const msg = `السلام عليكم ${order.customer_name} 👋

أوردرك رقم *#${order.order_number}* من *VILTRUM* تم شحنه 🚚✅

${waybill ? `📦 *رقم البوليصة:* ${waybill}\n` : ""}📍 *العنوان:* ${order.customer_address}

⏰ *المتوقع يوصلك:* ${estimatedDay} إن شاء الله

هيتواصل معاك مندوب الشحن قبل التسليم 📞

لو عندك أي استفسار تواصل معانا في أي وقت 🖤
شكراً إنك اخترت VILTRUM 🔥`;

    const phone = (order.customer_phone || "").replace(/\D/g, "").replace(/^0/, "20");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const pendingCount = pendingOrders.length;
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const confirmedCount = confirmedOrders.length;

  const filtered = useMemo(() => orders.filter((o) => {
    const matchSearch = search === "" ||
      String(o.order_number).includes(search) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone?.includes(search) ||
      o.customer_address?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchPayment = paymentFilter === "all" ||
      (paymentFilter === "collected" && o.payment_collected) ||
      (paymentFilter === "not_collected" && !o.payment_collected);

    let matchDate = true;
    if (dateFilter !== "all") {
      const orderDate = new Date(o.created_at);
      const now = new Date();
      if (dateFilter === "today") {
        matchDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === "7days") {
        const d = new Date(); d.setDate(d.getDate() - 7);
        matchDate = orderDate >= d;
      } else if (dateFilter === "30days") {
        const d = new Date(); d.setDate(d.getDate() - 30);
        matchDate = orderDate >= d;
      } else if (dateFilter === "custom") {
        if (dateFrom) matchDate = orderDate >= new Date(dateFrom);
        if (dateTo && matchDate) {
          const to = new Date(dateTo); to.setHours(23, 59, 59);
          matchDate = orderDate <= to;
        }
      }
    }

    return matchSearch && matchStatus && matchPayment && matchDate;
  }), [orders, search, statusFilter, paymentFilter, dateFilter, dateFrom, dateTo]);

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

            {/* Ship Selected to Panther */}
            <button
              onClick={() => { shipToPanther(Array.from(selectedForShip)); setSelectedForShip(new Set()); }}
              disabled={selectedForShip.size === 0 || shippingIds.size > 0}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-600/20"
            >
              {shippingIds.size > 0 ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
              Ship Selected ({selectedForShip.size})
            </button>

            <button onClick={fetchOrders} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white transition-all uppercase tracking-wider">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Analysis Panels */}
        {showAnalysis && <AnalysisPanel ordersList={filtered.filter((o) => o.status === "pending")} label="Pending" accentColor="text-amber-400" />}
        {showConfirmedAnalysis && <AnalysisPanel ordersList={filtered.filter((o) => o.status === "confirmed")} label="Confirmed" accentColor="text-blue-400" />}

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
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 uppercase tracking-wider focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateFilter === "custom" && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-600"
            />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-600"
            />
          </div>
        )}

        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{filtered.length} orders found</p>

        {/* Orders List */}
        <div className="space-y-3">
          {filtered.slice(0, displayCount).map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedOrder === order.id;
            const items = order.items || [];

            return (
              <div key={order.id} className={`bg-zinc-900/60 border rounded-2xl overflow-hidden ${selectedForShip.has(order.id) ? "border-purple-500/40" : "border-zinc-800/60"}`}>
                <div
                  className="flex items-center gap-4 p-4 sm:p-5 cursor-pointer hover:bg-zinc-800/20 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  {!order.shipping_company && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelectForShip(order.id); }}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedForShip.has(order.id)
                          ? "bg-purple-600 border-purple-600"
                          : "border-zinc-600 hover:border-purple-400"
                      }`}
                    >
                      {selectedForShip.has(order.id) && <Check size={12} className="text-white" />}
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-base font-black text-white">#{order.order_number}</span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      {order.shipping_company && (
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider border ${
                          order.shipping_company === "ALSAFWA"
                            ? "text-teal-400 bg-teal-500/10 border-teal-500/20"
                            : "text-purple-400 bg-purple-500/10 border-purple-500/20"
                        }`}>
                          {order.shipping_company === "ALSAFWA" ? "الصفوة ✓" : "راح موقع بانثر"}
                        </span>
                      )}
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
                      {order.tracking_number && (
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <Truck size={14} className="text-zinc-600" />
                          <span className="font-mono text-purple-400">{order.tracking_number}</span>
                          {order.shipping_company && <span className="text-zinc-600">({order.shipping_company})</span>}
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
                      <button
                        onClick={() => setEditingOrder(order)}
                        className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 text-blue-400 border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20"
                      >
                        <Edit size={12} /> Edit
                      </button>

                      <div className="w-px bg-zinc-800 mx-1" />

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

                      {order.status === "delivered" && (
                        <button
                          onClick={() => openWhatsAppFeedback(order)}
                          className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 text-amber-400 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20"
                        >
                          <MessageCircle size={12} /> Feedback
                        </button>
                      )}

                      {!order.shipping_company && (
                        <button
                          onClick={() => shipToPanther([order.id])}
                          disabled={shippingIds.has(order.id)}
                          className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 text-purple-400 border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-50"
                        >
                          {shippingIds.has(order.id) ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
                          Ship to Panther
                        </button>
                      )}

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

                      <button
                        onClick={() => toggleAddedToPanther(order.id, !!order.shipping_company)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                          order.shipping_company
                            ? "text-purple-400 bg-purple-500/10 border-purple-500/20"
                            : "text-zinc-600 border-zinc-800 hover:text-purple-400 hover:border-purple-500/30"
                        }`}
                      >
                        {order.shipping_company ? <Check size={12} /> : <Truck size={12} />}
                        {order.shipping_company ? "Added to Panther" : "Mark as Added to Panther"}
                      </button>

                      <button
                        onClick={() => openShippingConfirmation(order)}
                        disabled={order.status !== "shipped" && !order.shipping_company}
                        className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 text-cyan-400 border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Truck size={12} /> تأكيد الشحن
                      </button>

                      <div className="w-px bg-zinc-800 mx-1" />

                      {/* Add to Safwa */}
                      <button
                        onClick={() => order.shipping_company === "ALSAFWA" ? removeFromSafwa(order.id) : addToSafwa(order.id)}
                        disabled={safwaLoading.has(order.id) || (!!order.shipping_company && order.shipping_company !== "ALSAFWA")}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                          order.shipping_company === "ALSAFWA"
                            ? "text-teal-400 bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/20"
                            : "text-zinc-600 border-zinc-800 hover:text-teal-400 hover:border-teal-500/30"
                        }`}
                      >
                        {safwaLoading.has(order.id) ? <Loader2 size={12} className="animate-spin" /> : order.shipping_company === "ALSAFWA" ? <Check size={12} /> : <PackageCheck size={12} />}
                        {order.shipping_company === "ALSAFWA" ? "Added to Safwa ✓" : "Add to Safwa"}
                      </button>
                    </div>

                    {/* Waybill Input */}
                    {order.shipping_company && (
                      <div className="flex items-center gap-3 pt-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Waybill:</span>
                        <input
                          type="text"
                          defaultValue={order.tracking_number || ""}
                          placeholder="رقم البوليصة"
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val !== (order.tracking_number || "")) saveWaybill(order.id, val);
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                          className="flex-1 max-w-xs px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                        />
                        {order.tracking_number && (
                          <span className="text-[9px] text-purple-400 font-bold">✓ محفوظ</span>
                        )}
                      </div>
                    )}
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

          {filtered.length > displayCount && (
            <button
              onClick={() => setDisplayCount((c) => c + 100)}
              className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm font-bold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
            >
              Load More ({filtered.length - displayCount} remaining)
            </button>
          )}
        </div>
      </div>

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={(updated) => {
            setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
            setEditingOrder(null);
          }}
        />
      )}
    </>
  );
}
