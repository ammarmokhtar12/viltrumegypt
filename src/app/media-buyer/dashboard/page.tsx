/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  MapPin,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Ban,
  RotateCcw,
  DollarSign,
  Percent,
} from "lucide-react";

const MB_START_DATE = "2026-09-12T00:00:00";

function SimpleBar({ label, value, max, color, suffix }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-zinc-400 truncate">{label}</span>
        <span className="text-zinc-300 font-bold">{value.toLocaleString()}{suffix}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

export default function MediaBuyerDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [adSpend, setAdSpend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [oRes, aRes] = await Promise.all([
      supabase.from("orders").select("total, status, items, city, customer_address, customer_name, customer_phone, referral_source, payment_collected, created_at").gte("created_at", MB_START_DATE).order("created_at", { ascending: true }),
      supabase.from("ad_spend").select("*").gte("date", "2026-09-12").order("date", { ascending: true }),
    ]);
    setOrders(oRes.data || []);
    setAdSpend(aRes.data || []);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const all = orders;
    const valid = all.filter((o: any) => o.status !== "cancelled" && o.status !== "returned");

    // Status counts
    const statusCounts = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0, returned: 0 };
    all.forEach((o: any) => { if (o.status in statusCounts) statusCounts[o.status as keyof typeof statusCounts] += 1; });

    // Revenue
    const totalRevenue = valid.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const todayOrders = all.filter((o: any) => new Date(o.created_at) >= today);
    const yesterdayOrders = all.filter((o: any) => { const d = new Date(o.created_at); return d >= yesterday && d < today; });
    const todayRevenue = todayOrders.filter((o: any) => o.status !== "cancelled" && o.status !== "returned").reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const yesterdayRevenue = yesterdayOrders.filter((o: any) => o.status !== "cancelled" && o.status !== "returned").reduce((s: number, o: any) => s + Number(o.total || 0), 0);

    // Ad spend
    const totalSpend = adSpend.reduce((s: number, a: any) => s + Number(a.amount || 0), 0);

    // Rates
    const deliveryRate = all.length > 0 ? (statusCounts.delivered / all.length) * 100 : 0;
    const cancelRate = all.length > 0 ? ((statusCounts.cancelled + statusCounts.returned) / all.length) * 100 : 0;
    const confirmRate = all.length > 0 ? ((all.length - statusCounts.pending) / all.length) * 100 : 0;
    const codCollected = all.filter((o: any) => o.payment_collected).length;
    const codRate = all.length > 0 ? (codCollected / all.length) * 100 : 0;

    // AOV
    const aov = valid.length > 0 ? totalRevenue / valid.length : 0;

    // ROAS & CPA
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const cpa = valid.length > 0 ? totalSpend / valid.length : 0;

    // Revenue by source
    const sourceMap: Record<string, { orders: number; revenue: number }> = {};
    valid.forEach((o: any) => {
      const src = (o.referral_source || "direct").toLowerCase();
      if (!sourceMap[src]) sourceMap[src] = { orders: 0, revenue: 0 };
      sourceMap[src].orders += 1;
      sourceMap[src].revenue += Number(o.total || 0);
    });
    const topSources = Object.entries(sourceMap).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.revenue - a.revenue);

    // Top products - this week
    const weekOrders = valid.filter((o: any) => new Date(o.created_at) >= weekAgo);
    const weekProductMap: Record<string, number> = {};
    weekOrders.forEach((o: any) => {
      (o.items || []).forEach((item: any) => {
        const t = item.title || "Unknown";
        weekProductMap[t] = (weekProductMap[t] || 0) + (item.quantity || 1);
      });
    });
    const topProductsWeek = Object.entries(weekProductMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Top products - all time
    const allProductMap: Record<string, number> = {};
    valid.forEach((o: any) => {
      (o.items || []).forEach((item: any) => {
        const t = item.title || "Unknown";
        allProductMap[t] = (allProductMap[t] || 0) + (item.quantity || 1);
      });
    });
    const topProductsAll = Object.entries(allProductMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Top cities
    const cityMap: Record<string, number> = {};
    valid.forEach((o: any) => {
      const city = o.city || o.customer_address?.split(",").pop()?.trim() || "Unknown";
      cityMap[city] = (cityMap[city] || 0) + 1;
    });
    const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // Repeat customers
    const phoneMap: Record<string, { name: string; phone: string; count: number; lastOrder: string; totalSpent: number }> = {};
    valid.forEach((o: any) => {
      const phone = (o.customer_phone || "").trim();
      if (!phone) return;
      if (!phoneMap[phone]) phoneMap[phone] = { name: o.customer_name || "Unknown", phone, count: 0, lastOrder: o.created_at, totalSpent: 0 };
      phoneMap[phone].count += 1;
      phoneMap[phone].totalSpent += Number(o.total || 0);
      if (new Date(o.created_at) > new Date(phoneMap[phone].lastOrder)) {
        phoneMap[phone].lastOrder = o.created_at;
        phoneMap[phone].name = o.customer_name || phoneMap[phone].name;
      }
    });
    const repeatCustomers = Object.values(phoneMap).filter((c) => c.count >= 2).sort((a, b) => b.count - a.count);

    // Daily orders for last 7 days
    const dailyOrders: { date: string; count: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      const dayOrders = valid.filter((o: any) => o.created_at.startsWith(dateStr));
      dailyOrders.push({
        date: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }),
        count: dayOrders.length,
        revenue: dayOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
      });
    }

    return {
      totalOrders: all.length, validOrders: valid.length, totalRevenue, totalSpend,
      todayOrders: todayOrders.length, yesterdayOrders: yesterdayOrders.length,
      todayRevenue, yesterdayRevenue,
      statusCounts, deliveryRate, cancelRate, confirmRate, codRate, codCollected,
      aov, roas, cpa,
      topSources, topProductsWeek, topProductsAll, topCities,
      repeatCustomers, dailyOrders,
    };
  }, [orders, adSpend]);

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const daysSinceLaunch = Math.max(1, Math.ceil((Date.now() - new Date(MB_START_DATE).getTime()) / 86400000));

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const STATUS_ICONS = {
    pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
    confirmed: { icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/10" },
    shipped: { icon: Truck, color: "text-purple-400", bg: "bg-purple-500/10" },
    delivered: { icon: Package, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    cancelled: { icon: Ban, color: "text-zinc-400", bg: "bg-zinc-500/10" },
    returned: { icon: RotateCcw, color: "text-red-400", bg: "bg-red-500/10" },
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-1">Viltrum Egypt</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-[10px] text-zinc-600 mt-1">Since Sep 12, 2026 — Day {daysSinceLaunch}</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-400 border border-zinc-800 rounded-xl hover:text-white hover:border-zinc-600 transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Today vs Yesterday */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Today Orders</p>
          <p className="text-2xl font-black text-white">{stats.todayOrders}</p>
          <div className="flex items-center gap-1 mt-1">
            {stats.todayOrders >= stats.yesterdayOrders ? <ArrowUpRight size={12} className="text-emerald-400" /> : <ArrowDownRight size={12} className="text-red-400" />}
            <span className="text-[10px] text-zinc-500">vs {stats.yesterdayOrders} yesterday</span>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Today Revenue</p>
          <p className="text-2xl font-black text-emerald-400">{fmt(stats.todayRevenue)}<span className="text-sm ml-1">EGP</span></p>
          <div className="flex items-center gap-1 mt-1">
            {stats.todayRevenue >= stats.yesterdayRevenue ? <ArrowUpRight size={12} className="text-emerald-400" /> : <ArrowDownRight size={12} className="text-red-400" />}
            <span className="text-[10px] text-zinc-500">vs {fmt(stats.yesterdayRevenue)} yesterday</span>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-black text-emerald-400">{fmt(stats.totalRevenue)}<span className="text-sm ml-1">EGP</span></p>
          <span className="text-[10px] text-zinc-500">{stats.validOrders} orders</span>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ad Spend</p>
          <p className="text-2xl font-black text-red-400">{fmt(stats.totalSpend)}<span className="text-sm ml-1">EGP</span></p>
          <span className="text-[10px] text-zinc-500">ROAS: <span className={`font-bold ${stats.roas >= 2 ? "text-emerald-400" : stats.roas >= 1 ? "text-amber-400" : "text-red-400"}`}>{stats.roas.toFixed(2)}x</span></span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center"><DollarSign size={18} className="text-cyan-400" /></div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">AOV</p>
            <p className="text-lg font-black text-white">{fmt(stats.aov)} EGP</p>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center"><ShoppingCart size={18} className="text-orange-400" /></div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">CPA</p>
            <p className="text-lg font-black text-white">{fmt(stats.cpa)} EGP</p>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Percent size={18} className="text-emerald-400" /></div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Delivery Rate</p>
            <p className="text-lg font-black text-white">{stats.deliveryRate.toFixed(0)}%</p>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><XCircle size={18} className="text-red-400" /></div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Cancel Rate</p>
            <p className="text-lg font-black text-white">{stats.cancelRate.toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Order Status Pipeline */}
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Order Pipeline</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(Object.entries(STATUS_ICONS) as [keyof typeof STATUS_ICONS, typeof STATUS_ICONS[keyof typeof STATUS_ICONS]][]).map(([status, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={status} className="text-center">
                <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={20} className={cfg.color} />
                </div>
                <p className="text-xl font-black text-white">{stats.statusCounts[status]}</p>
                <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{status}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-800/50 flex flex-wrap gap-4 text-[10px] text-zinc-500">
          <span>COD Collected: <span className="text-emerald-400 font-bold">{stats.codCollected}/{stats.totalOrders}</span> ({stats.codRate.toFixed(0)}%)</span>
          <span>Confirmation Rate: <span className="text-blue-400 font-bold">{stats.confirmRate.toFixed(0)}%</span></span>
        </div>
      </div>

      {/* Last 7 days */}
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Last 7 Days</h3>
        <div className="grid grid-cols-7 gap-2">
          {stats.dailyOrders.map((d, i) => (
            <div key={i} className="text-center">
              <p className="text-[9px] text-zinc-600 font-bold uppercase mb-2">{d.date}</p>
              <div className="bg-zinc-800/50 rounded-xl py-3 px-1">
                <p className="text-lg font-black text-white">{d.count}</p>
                <p className="text-[9px] text-zinc-500">orders</p>
                <p className="text-[10px] text-emerald-400 font-bold mt-1">{d.revenue > 0 ? `${fmt(d.revenue)}` : "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by Source */}
      {stats.topSources.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-blue-400" /> Revenue by Source</h3>
          <div className="space-y-3">
            {stats.topSources.map((src, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-blue-400 uppercase bg-blue-500/10 px-2 py-1 rounded-lg min-w-[70px] text-center">{src.name}</span>
                  <span className="text-xs text-zinc-400">{src.orders} orders</span>
                </div>
                <span className="text-sm font-bold text-emerald-400">{fmt(src.revenue)} EGP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products: This Week vs All Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Package size={16} className="text-amber-400" /> Best Sellers — This Week</h3>
          <div className="space-y-3">
            {stats.topProductsWeek.length > 0 ? stats.topProductsWeek.map(([name, qty], i) => (
              <SimpleBar key={i} label={name} value={qty} max={stats.topProductsWeek[0]?.[1] || 1} color="bg-amber-500" suffix=" sold" />
            )) : <p className="text-xs text-zinc-600">No sales this week yet</p>}
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Package size={16} className="text-cyan-400" /> Best Sellers — All Time</h3>
          <div className="space-y-3">
            {stats.topProductsAll.length > 0 ? stats.topProductsAll.map(([name, qty], i) => (
              <SimpleBar key={i} label={name} value={qty} max={stats.topProductsAll[0]?.[1] || 1} color="bg-cyan-500" suffix=" sold" />
            )) : <p className="text-xs text-zinc-600">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Top Cities */}
      {stats.topCities.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><MapPin size={16} className="text-purple-400" /> Top Cities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.topCities.map(([city, count], i) => (
              <div key={i} className="bg-zinc-800/40 rounded-xl p-3 text-center">
                <p className="text-xs text-zinc-400 truncate">{city}</p>
                <p className="text-lg font-black text-white">{count as number}</p>
                <p className="text-[9px] text-zinc-600">orders</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repeat Customers */}
      {stats.repeatCustomers.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users size={16} className="text-amber-400" /> Repeat Customers
            <span className="text-[10px] text-zinc-500 font-normal ml-auto">{stats.repeatCustomers.length} customers</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                  <th className="text-left py-2 pr-4">Customer</th>
                  <th className="text-left py-2 pr-4">Phone</th>
                  <th className="text-center py-2 pr-4">Orders</th>
                  <th className="text-right py-2 pr-4">Total Spent</th>
                  <th className="text-right py-2">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {stats.repeatCustomers.slice(0, 15).map((c, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 pr-4 font-semibold text-white">{c.name}</td>
                    <td className="py-2.5 pr-4 text-zinc-400 font-mono flex items-center gap-1.5">
                      <Phone size={10} className="text-zinc-600" /> {c.phone}
                    </td>
                    <td className="py-2.5 pr-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">{c.count}x</span>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-emerald-400 font-bold">{c.totalSpent.toLocaleString()} EGP</td>
                    <td className="py-2.5 text-right text-zinc-500">{new Date(c.lastOrder).toLocaleDateString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
