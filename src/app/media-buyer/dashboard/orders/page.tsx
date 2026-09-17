/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  ChevronDown,
  DollarSign,
  Package,
  Phone,
  MapPin,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Calendar,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  confirmed: { label: "Confirmed", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  shipped: { label: "Shipped", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  delivered: { label: "Delivered", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  cancelled: { label: "Cancelled", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20" },
  returned: { label: "Returned", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
};

const MB_START_DATE = "2024-09-12T00:00:00";

export default function MediaBuyerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(100);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, customer_address, payment_method, payment_collected, status, total, items, created_at, referral_source, tracking_number, shipping_company")
      .gte("created_at", MB_START_DATE)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("Error loading orders:", error.message);
    }
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = useMemo(() => {
    let result = orders;

    if (dateFilter !== "all") {
      const now = new Date();
      let cutoff: Date;
      if (dateFilter === "today") {
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === "7d") {
        cutoff = new Date(now.getTime() - 7 * 86400000);
      } else if (dateFilter === "30d") {
        cutoff = new Date(now.getTime() - 30 * 86400000);
      } else if (dateFilter === "custom" && dateFrom) {
        cutoff = new Date(dateFrom);
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          result = result.filter((o) => {
            const d = new Date(o.created_at);
            return d >= cutoff && d <= end;
          });
          if (statusFilter !== "all") result = result.filter((o) => o.status === statusFilter);
          if (search) {
            const s = search.toLowerCase();
            result = result.filter((o) =>
              (o.order_number?.toString() || "").includes(s) ||
              (o.customer_name || "").toLowerCase().includes(s) ||
              (o.customer_phone || "").includes(s)
            );
          }
          return result;
        }
      } else {
        cutoff = new Date(0);
      }
      result = result.filter((o) => new Date(o.created_at) >= cutoff!);
    }

    if (statusFilter !== "all") result = result.filter((o) => o.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((o) =>
        (o.order_number?.toString() || "").includes(s) ||
        (o.customer_name || "").toLowerCase().includes(s) ||
        (o.customer_phone || "").includes(s)
      );
    }
    return result;
  }, [orders, statusFilter, dateFilter, dateFrom, dateTo, search]);

  const stats = useMemo(() => {
    const valid = filtered.filter((o) => o.status !== "cancelled" && o.status !== "returned");
    const revenue = valid.reduce((s, o) => s + Number(o.total || 0), 0);
    const statusCounts: Record<string, number> = {};
    filtered.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    return { total: filtered.length, revenue, validCount: valid.length, statusCounts };
  }, [filtered]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-1">Order Management</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Orders</h1>
        </div>
        <button onClick={() => { fetchOrders(); setDisplayCount(100); }} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-400 border border-zinc-800 rounded-xl hover:text-white hover:border-zinc-600 transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <ShoppingCart size={12} className="text-zinc-600" />
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Orders</p>
          </div>
          <p className="text-xl font-black text-white">{stats.total}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={12} className="text-zinc-600" />
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Revenue</p>
          </div>
          <p className="text-xl font-black text-emerald-400">{stats.revenue.toLocaleString()} EGP</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Package size={12} className="text-zinc-600" />
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Delivered</p>
          </div>
          <p className="text-xl font-black text-emerald-400">{stats.statusCounts["delivered"] || 0}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign size={12} className="text-zinc-600" />
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Pending</p>
          </div>
          <p className="text-xl font-black text-amber-400">{stats.statusCounts["pending"] || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            placeholder="Search by order #, name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
        >
          <option value="all">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
        {dateFilter === "custom" && (
          <div className="flex gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-600">{filtered.length} orders found</p>

      {/* Orders List */}
      <div className="space-y-2">
        {filtered.slice(0, displayCount).map((order) => {
          const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
          const expanded = expandedOrder === order.id;
          return (
            <div key={order.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                onClick={() => setExpandedOrder(expanded ? null : order.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-sm font-bold text-white">#{order.order_number}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color} ${sc.border} border`}>
                    {sc.label}
                  </span>
                  {order.payment_collected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Paid</span>
                  )}
                  {!order.payment_collected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Unpaid</span>
                  )}
                  <span className="text-xs text-zinc-500 truncate hidden sm:block">{order.customer_name}</span>
                  {order.referral_source && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase hidden sm:block">
                      {order.referral_source}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-white">{Number(order.total || 0).toLocaleString()} EGP</span>
                  <ChevronDown size={16} className={`text-zinc-600 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </div>
              </div>

              {expanded && (
                <div className="border-t border-zinc-800/50 p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Phone size={12} /> {order.customer_phone}
                      </div>
                      <div className="flex items-start gap-2 text-zinc-400">
                        <MapPin size={12} className="mt-0.5 shrink-0" /> {order.customer_address}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <DollarSign size={12} /> {order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar size={12} /> {new Date(order.created_at).toLocaleDateString("en-GB")} — {new Date(order.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {order.referral_source && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-blue-400 uppercase">Source: {order.referral_source}</span>
                        </div>
                      )}
                      {order.tracking_number && (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Package size={12} /> Waybill: <span className="text-white font-mono">{order.tracking_number}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Items</p>
                      <div className="space-y-1">
                        {(order.items || []).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-zinc-300">{item.title} — Size {item.size} x {item.quantity || 1}</span>
                            <span className="text-zinc-400">{((item.price || 0) * (item.quantity || 1)).toLocaleString()} EGP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length > displayCount && (
        <button
          onClick={() => setDisplayCount((c) => c + 100)}
          className="w-full py-3 text-sm font-bold text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 transition-all"
        >
          Load More ({filtered.length - displayCount} remaining)
        </button>
      )}
    </div>
  );
}
