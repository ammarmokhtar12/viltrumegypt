/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp,
  BarChart3,
  Target,
  DollarSign,
  ShoppingCart,
  Package,
  MapPin,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

function MiniChart({ data, color, height = 50 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 200;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

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
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [oRes, aRes] = await Promise.all([
      supabase.from("orders").select("total, status, items, city, customer_address, created_at").order("created_at", { ascending: true }),
      supabase.from("ad_spend").select("*").order("date", { ascending: true }),
    ]);
    setOrders(oRes.data || []);
    setAdSpend(aRes.data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (period === "all") return { orders, adSpend };
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return {
      orders: orders.filter((o) => new Date(o.created_at) >= cutoff),
      adSpend: adSpend.filter((a) => new Date(a.date) >= cutoff),
    };
  }, [orders, adSpend, period]);

  const kpis = useMemo(() => {
    const validOrders = filtered.orders.filter((o: any) => o.status !== "cancelled" && o.status !== "returned");
    const revenue = validOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const totalSpend = filtered.adSpend.reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
    const totalImpressions = filtered.adSpend.reduce((s: number, a: any) => s + Number(a.impressions || 0), 0);
    const totalClicks = filtered.adSpend.reduce((s: number, a: any) => s + Number(a.clicks || 0), 0);
    const totalReach = filtered.adSpend.reduce((s: number, a: any) => s + Number(a.reach || 0), 0);

    const roas = totalSpend > 0 ? revenue / totalSpend : 0;
    const cpa = validOrders.length > 0 ? totalSpend / validOrders.length : 0;
    const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const aov = validOrders.length > 0 ? revenue / validOrders.length : 0;

    // Revenue by day for chart
    const revenueByDay: Record<string, number> = {};
    const ordersByDay: Record<string, number> = {};
    validOrders.forEach((o: any) => {
      const d = new Date(o.created_at).toISOString().split("T")[0];
      revenueByDay[d] = (revenueByDay[d] || 0) + Number(o.total || 0);
      ordersByDay[d] = (ordersByDay[d] || 0) + 1;
    });
    const days = Object.keys(revenueByDay).sort();
    const revenueSeries = days.map((d) => revenueByDay[d] || 0);
    const ordersSeries = days.map((d) => ordersByDay[d] || 0);

    // By product (qty sold only, no costs)
    const productMap: Record<string, { qty: number; revenue: number }> = {};
    validOrders.forEach((o: any) => {
      (o.items || []).forEach((item: any) => {
        const t = item.title || "Unknown";
        if (!productMap[t]) productMap[t] = { qty: 0, revenue: 0 };
        productMap[t].qty += item.quantity || 1;
        productMap[t].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    const topProducts = Object.entries(productMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    // By city (order count only)
    const cityMap: Record<string, number> = {};
    validOrders.forEach((o: any) => {
      const city = o.city || o.customer_address?.split(",").pop()?.trim() || "Unknown";
      cityMap[city] = (cityMap[city] || 0) + 1;
    });
    const topCities = Object.entries(cityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // By platform
    const platformMap: Record<string, { spend: number; impressions: number; clicks: number }> = {};
    filtered.adSpend.forEach((a: any) => {
      if (!platformMap[a.platform]) platformMap[a.platform] = { spend: 0, impressions: 0, clicks: 0 };
      platformMap[a.platform].spend += Number(a.amount || 0);
      platformMap[a.platform].impressions += Number(a.impressions || 0);
      platformMap[a.platform].clicks += Number(a.clicks || 0);
    });

    return {
      revenue, totalSpend, roas, cpa, cpm, cpc, ctr, aov, totalReach,
      totalImpressions, totalClicks,
      orderCount: validOrders.length, allOrders: filtered.orders.length,
      revenueSeries, ordersSeries, days,
      topProducts, topCities, platformMap,
    };
  }, [filtered]);

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const platformColor: Record<string, string> = {
    meta: "text-blue-400", tiktok: "text-pink-400", google: "text-emerald-400", snapchat: "text-yellow-400", other: "text-zinc-400",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-1">Performance Overview</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ad Dashboard</h1>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d", "all"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
              period === p ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-zinc-600 border-zinc-800 hover:text-zinc-300"
            }`}>{p === "all" ? "All" : p}</button>
          ))}
          <button onClick={fetchData} className="px-3 py-2 text-zinc-600 hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "ROAS", value: `${kpis.roas.toFixed(2)}x`, color: kpis.roas >= 2 ? "text-emerald-400" : kpis.roas >= 1 ? "text-amber-400" : "text-red-400", icon: Target },
          { label: "CPA", value: `${fmt(kpis.cpa)} EGP`, color: "text-orange-400", icon: DollarSign },
          { label: "Revenue", value: `${fmt(kpis.revenue)} EGP`, color: "text-emerald-400", icon: TrendingUp },
          { label: "Ad Spend", value: `${fmt(kpis.totalSpend)} EGP`, color: "text-red-400", icon: DollarSign },
          { label: "Orders", value: `${kpis.orderCount}`, color: "text-white", icon: ShoppingCart },
          { label: "AOV", value: `${fmt(kpis.aov)} EGP`, color: "text-cyan-400", icon: BarChart3 },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <kpi.icon size={12} className="text-zinc-600" />
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{kpi.label}</p>
            </div>
            <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Ad Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "CPM", value: `${kpis.cpm.toFixed(1)} EGP` },
          { label: "CPC", value: `${kpis.cpc.toFixed(1)} EGP` },
          { label: "CTR", value: `${kpis.ctr.toFixed(2)}%` },
          { label: "Impressions", value: fmt(kpis.totalImpressions) },
          { label: "Reach", value: fmt(kpis.totalReach) },
        ].map((m) => (
          <div key={m.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{m.label}</p>
            <p className="text-lg font-black text-white">{m.value}</p>
          </div>
        ))}
      </div>

      {/* ROAS Alert */}
      {kpis.roas > 0 && kpis.roas < 1 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
          <ArrowDown size={18} className="text-red-400" />
          <p className="text-xs text-red-400 font-bold">ROAS below 1x — ads are losing money. Review targeting and creatives.</p>
        </div>
      )}
      {kpis.roas >= 3 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
          <ArrowUp size={18} className="text-emerald-400" />
          <p className="text-xs text-emerald-400 font-bold">ROAS {kpis.roas.toFixed(1)}x — excellent performance! Consider scaling budget.</p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><TrendingUp size={16} className="text-emerald-400" /> Revenue Trend</h3>
          <MiniChart data={kpis.revenueSeries} color="#34d399" height={70} />
          <p className="text-[10px] text-zinc-600">{kpis.days.length} days</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><BarChart3 size={16} className="text-blue-400" /> Orders per Day</h3>
          <MiniChart data={kpis.ordersSeries} color="#60a5fa" height={70} />
          <p className="text-[10px] text-zinc-600">{kpis.days.length} days</p>
        </div>
      </div>

      {/* Platform Breakdown */}
      {Object.keys(kpis.platformMap).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Platform Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(kpis.platformMap).map(([p, d]) => {
              const pRoas = d.spend > 0 ? kpis.revenue / d.spend : 0;
              const pCtr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0;
              return (
                <div key={p} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 space-y-2">
                  <div className={`text-sm font-black uppercase ${platformColor[p] || "text-zinc-400"}`}>{p}</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500">
                    <span>Spend: <span className="text-white font-bold">{fmt(d.spend)} EGP</span></span>
                    <span>Impressions: <span className="text-white font-bold">{fmt(d.impressions)}</span></span>
                    <span>Clicks: <span className="text-white font-bold">{fmt(d.clicks)}</span></span>
                    <span>CTR: <span className="text-white font-bold">{pCtr.toFixed(2)}%</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Product & City Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Package size={16} className="text-cyan-400" /> Top Products (by units sold)</h3>
          <div className="space-y-3">
            {kpis.topProducts.map((p, i) => (
              <SimpleBar key={i} label={p.name} value={p.qty} max={kpis.topProducts[0]?.qty || 1} color="bg-cyan-500" suffix=" sold" />
            ))}
            {kpis.topProducts.length === 0 && <p className="text-xs text-zinc-600">No data yet</p>}
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><MapPin size={16} className="text-purple-400" /> Top Cities (by orders)</h3>
          <div className="space-y-3">
            {kpis.topCities.map((c, i) => (
              <SimpleBar key={i} label={c.name} value={c.count} max={kpis.topCities[0]?.count || 1} color="bg-purple-500" suffix=" orders" />
            ))}
            {kpis.topCities.length === 0 && <p className="text-xs text-zinc-600">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
