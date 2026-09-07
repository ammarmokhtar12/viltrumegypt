/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, BarChart3, MapPin, Package, RefreshCw } from "lucide-react";

function SimpleBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-zinc-400 truncate">{label}</span>
        <span className="text-zinc-300 font-bold">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function MiniChart({ data, color, height = 60 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 300;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [adSpend, setAdSpend] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [oRes, eRes, aRes, bRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: true }),
      supabase.from("expenses").select("*"),
      supabase.from("ad_spend").select("*"),
      supabase.from("manufacturing_batches").select("*"),
    ]);
    setOrders(oRes.data || []);
    setExpenses(eRes.data || []);
    setAdSpend(aRes.data || []);
    setBatches(bRes.data || []);
    setLoading(false);
  };

  const filteredOrders = useMemo(() => {
    if (period === "all") return orders;
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return orders.filter((o) => new Date(o.created_at) >= cutoff);
  }, [orders, period]);

  const analytics = useMemo(() => {
    const validOrders = filteredOrders.filter((o: any) => o.status !== "cancelled" && o.status !== "returned");
    const revenue = validOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const totalAdSpend = adSpend.reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
    const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
    const totalManufacturing = batches.reduce((s: number, b: any) => s + Number(b.total_cost || 0), 0);
    const totalCost = totalAdSpend + totalExpenses + totalManufacturing;
    const profit = revenue - totalCost;

    // Revenue by day
    const revenueByDay: Record<string, number> = {};
    const costByDay: Record<string, number> = {};
    validOrders.forEach((o: any) => {
      const d = new Date(o.created_at).toISOString().split("T")[0];
      revenueByDay[d] = (revenueByDay[d] || 0) + Number(o.total || 0);
    });
    adSpend.forEach((a: any) => {
      const d = a.date;
      costByDay[d] = (costByDay[d] || 0) + Number(a.amount || 0);
    });

    const allDays = [...new Set([...Object.keys(revenueByDay), ...Object.keys(costByDay)])].sort();
    const revenueSeries = allDays.map((d) => revenueByDay[d] || 0);
    const costSeries = allDays.map((d) => costByDay[d] || 0);
    const profitSeries = allDays.map((d) => (revenueByDay[d] || 0) - (costByDay[d] || 0));
    const ordersSeries = allDays.map((d) => validOrders.filter((o: any) => o.created_at?.startsWith(d)).length);

    // By product
    const productMap: Record<string, { revenue: number; qty: number }> = {};
    validOrders.forEach((o: any) => {
      (o.items || []).forEach((item: any) => {
        const t = item.title || "Unknown";
        if (!productMap[t]) productMap[t] = { revenue: 0, qty: 0 };
        productMap[t].revenue += (item.price || 0) * (item.quantity || 1);
        productMap[t].qty += item.quantity || 1;
      });
    });
    const topProducts = Object.entries(productMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // By city
    const cityMap: Record<string, { orders: number; revenue: number }> = {};
    validOrders.forEach((o: any) => {
      const city = o.city || o.customer_address?.split(",").pop()?.trim() || "Unknown";
      if (!cityMap[city]) cityMap[city] = { orders: 0, revenue: 0 };
      cityMap[city].orders++;
      cityMap[city].revenue += Number(o.total || 0);
    });
    const topCities = Object.entries(cityMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);

    // By status
    const statusMap: Record<string, number> = {};
    filteredOrders.forEach((o: any) => {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    });

    return {
      revenue, totalCost, profit, totalAdSpend, totalExpenses, totalManufacturing,
      validOrders: validOrders.length, allOrders: filteredOrders.length,
      revenueSeries, costSeries, profitSeries, ordersSeries, allDays,
      topProducts, topCities, statusMap,
    };
  }, [filteredOrders, adSpend, expenses, batches]);

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" /></div>;
  }

  const maxProductRev = Math.max(...analytics.topProducts.map((p) => p.revenue), 1);
  const maxCityOrders = Math.max(...analytics.topCities.map((c) => c.orders), 1);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-1">Insights</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d", "all"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
              period === p ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-zinc-600 border-zinc-800 hover:text-zinc-300"
            }`}>{p === "all" ? "All" : p}</button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Revenue</p>
          <p className="text-lg font-black text-emerald-400">{fmt(analytics.revenue)}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Cost</p>
          <p className="text-lg font-black text-red-400">{fmt(analytics.totalCost)}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Profit</p>
          <p className={`text-lg font-black ${analytics.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(analytics.profit)}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ad Spend</p>
          <p className="text-lg font-black text-blue-400">{fmt(analytics.totalAdSpend)}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Orders</p>
          <p className="text-lg font-black text-white">{analytics.validOrders}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Margin</p>
          <p className={`text-lg font-black ${analytics.revenue > 0 && analytics.profit / analytics.revenue > 0.2 ? "text-emerald-400" : "text-amber-400"}`}>
            {analytics.revenue > 0 ? ((analytics.profit / analytics.revenue) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trend */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Revenue Trend</h3>
          </div>
          <MiniChart data={analytics.revenueSeries} color="#34d399" height={80} />
          <p className="text-[10px] text-zinc-600">{analytics.allDays.length} days</p>
        </div>

        {/* Orders Trend */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white">Orders per Day</h3>
          </div>
          <MiniChart data={analytics.ordersSeries} color="#60a5fa" height={80} />
          <p className="text-[10px] text-zinc-600">{analytics.allDays.length} days</p>
        </div>

        {/* Cost Trend */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-red-400" />
            <h3 className="text-sm font-bold text-white">Cost Trend (Ad Spend)</h3>
          </div>
          <MiniChart data={analytics.costSeries} color="#f87171" height={80} />
        </div>

        {/* Profit Trend */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">Profit Trend</h3>
          </div>
          <MiniChart data={analytics.profitSeries} color="#fbbf24" height={80} />
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white">Order Status Breakdown</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(analytics.statusMap).map(([status, count]) => {
            const colors: Record<string, string> = {
              pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
              confirmed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
              shipped: "text-purple-400 bg-purple-500/10 border-purple-500/20",
              delivered: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              cancelled: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
              returned: "text-red-400 bg-red-500/10 border-red-500/20",
            };
            return (
              <div key={status} className={`px-4 py-2.5 rounded-xl border ${colors[status] || colors.pending}`}>
                <span className="text-lg font-black">{count}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold ml-2">{status}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product & City Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Top Products by Revenue</h3>
          </div>
          <div className="space-y-3">
            {analytics.topProducts.map((p, i) => (
              <SimpleBar key={i} label={`${p.name} (×${p.qty})`} value={p.revenue} max={maxProductRev} color="bg-cyan-500" />
            ))}
            {analytics.topProducts.length === 0 && <p className="text-xs text-zinc-600">No product data</p>}
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-purple-400" />
            <h3 className="text-sm font-bold text-white">Top Cities by Orders</h3>
          </div>
          <div className="space-y-3">
            {analytics.topCities.map((c, i) => (
              <SimpleBar key={i} label={`${c.name} (${fmt(c.revenue)} EGP)`} value={c.orders} max={maxCityOrders} color="bg-purple-500" />
            ))}
            {analytics.topCities.length === 0 && <p className="text-xs text-zinc-600">No city data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
