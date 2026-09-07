/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Filter,
  ChevronDown,
  Check,
  X,
  DollarSign,
  Package,
  Truck,
  Clock,
  RotateCcw,
  Phone,
  MapPin,
  RefreshCw,
  MessageCircle,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  confirmed: { label: "Confirmed", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  shipped: { label: "Shipped", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  delivered: { label: "Delivered", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  cancelled: { label: "Cancelled", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20" },
  returned: { label: "Returned", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
};

const STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const togglePaymentCollected = async (orderId: string, current: boolean) => {
    await supabase.from("orders").update({ payment_collected: !current }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, payment_collected: !current } : o));
  };

  const filtered = orders.filter((o) => {
    const matchSearch = search === "" ||
      String(o.order_number).includes(search) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone?.includes(search);
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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-1">Order Management</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Orders</h1>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            placeholder="Search by order #, name, phone..."
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
              {/* Order Header */}
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

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-zinc-800/50 p-4 sm:p-5 space-y-5">
                  {/* Customer Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Phone size={14} className="text-zinc-600" /> {order.customer_phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <MapPin size={14} className="text-zinc-600" /> {order.customer_address}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <DollarSign size={14} className="text-zinc-600" /> {order.payment_method === "vodafone_cash" ? "Cash on Delivery" : "InstaPay"}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Items</p>
                    {items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-zinc-800/30 rounded-lg">
                        <span className="text-xs text-zinc-300">{item.title} · Size {item.size} × {item.quantity}</span>
                        <span className="text-xs font-bold text-zinc-400">{fmt(item.price * item.quantity)} EGP</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {/* Status buttons */}
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

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/${(order.customer_phone || "").replace(/\D/g, "").replace(/^0/, "20")}?text=${encodeURIComponent(`مرحبا ${order.customer_name} 👋\nأوردر رقم #${order.order_number} من VILTRUM\nالإجمالي: ${order.total} EGP\n\nهل تحب تأكد الأوردر؟ ✅\nولا محتاج تعدل حاجة؟ ✏️`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 text-green-500 border-green-500/20 bg-green-500/10 hover:bg-green-500/20"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </a>

                    {/* Payment toggle */}
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
  );
}
