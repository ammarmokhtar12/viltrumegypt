/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { FileDown, RefreshCw, TrendingUp, ShoppingCart, DollarSign, Target, Users } from "lucide-react";

const MB_START_DATE = "2024-09-12T00:00:00";

export default function WeeklyReportPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [adSpend, setAdSpend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const weekLabel = `${weekStart.toLocaleDateString("en-GB")} — ${now.toLocaleDateString("en-GB")}`;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [oRes, aRes] = await Promise.all([
      supabase.from("orders").select("total, status, items, customer_name, customer_phone, customer_address, created_at").gte("created_at", MB_START_DATE).order("created_at", { ascending: false }),
      supabase.from("ad_spend").select("*").gte("date", "2024-09-12").order("date", { ascending: false }),
    ]);
    setOrders(oRes.data || []);
    setAdSpend(aRes.data || []);
    setLoading(false);
  };

  const weekOrders = useMemo(() => orders.filter((o) => new Date(o.created_at) >= weekStart), [orders]);
  const weekAdSpend = useMemo(() => adSpend.filter((a) => new Date(a.date) >= weekStart), [adSpend]);

  const stats = useMemo(() => {
    const valid = weekOrders.filter((o: any) => o.status !== "cancelled" && o.status !== "returned");
    const revenue = valid.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const spend = weekAdSpend.reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
    const impressions = weekAdSpend.reduce((s: number, a: any) => s + Number(a.impressions || 0), 0);
    const clicks = weekAdSpend.reduce((s: number, a: any) => s + Number(a.clicks || 0), 0);
    const roas = spend > 0 ? revenue / spend : 0;
    const cpa = valid.length > 0 ? spend / valid.length : 0;
    const aov = valid.length > 0 ? revenue / valid.length : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    const statusCounts: Record<string, number> = {};
    weekOrders.forEach((o: any) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

    const productMap: Record<string, number> = {};
    valid.forEach((o: any) => {
      (o.items || []).forEach((item: any) => {
        const t = item.title || "Unknown";
        productMap[t] = (productMap[t] || 0) + (item.quantity || 1);
      });
    });
    const topProducts = Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const cityMap: Record<string, number> = {};
    valid.forEach((o: any) => {
      const city = o.customer_address?.split(" - ")[0]?.trim() || "Unknown";
      cityMap[city] = (cityMap[city] || 0) + 1;
    });
    const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const phoneMap: Record<string, { name: string; phone: string; count: number; total: number; lastOrder: string }> = {};
    const allValid = orders.filter((o: any) => o.status !== "cancelled" && o.status !== "returned");
    allValid.forEach((o: any) => {
      const phone = (o.customer_phone || "").trim();
      if (!phone) return;
      if (!phoneMap[phone]) phoneMap[phone] = { name: o.customer_name, phone, count: 0, total: 0, lastOrder: o.created_at };
      phoneMap[phone].count += 1;
      phoneMap[phone].total += Number(o.total || 0);
      if (new Date(o.created_at) > new Date(phoneMap[phone].lastOrder)) {
        phoneMap[phone].lastOrder = o.created_at;
        phoneMap[phone].name = o.customer_name || phoneMap[phone].name;
      }
    });
    const repeatCustomers = Object.values(phoneMap).filter((c) => c.count >= 2).sort((a, b) => b.count - a.count).slice(0, 10);

    const platformMap: Record<string, { spend: number; impressions: number; clicks: number }> = {};
    weekAdSpend.forEach((a: any) => {
      if (!platformMap[a.platform]) platformMap[a.platform] = { spend: 0, impressions: 0, clicks: 0 };
      platformMap[a.platform].spend += Number(a.amount || 0);
      platformMap[a.platform].impressions += Number(a.impressions || 0);
      platformMap[a.platform].clicks += Number(a.clicks || 0);
    });

    return {
      revenue, spend, roas, cpa, aov, ctr, impressions, clicks,
      totalOrders: weekOrders.length,
      validOrders: valid.length,
      statusCounts, topProducts, topCities, repeatCustomers, platformMap,
    };
  }, [weekOrders, weekAdSpend, orders]);

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const el = reportRef.current;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Viltrum Weekly Report — ${weekLabel}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111; padding: 40px; font-size: 12px; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      h2 { font-size: 14px; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 2px; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
      .subtitle { font-size: 11px; color: #888; margin-bottom: 24px; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
      .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
      .card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px; }
      .card-label { font-size: 9px; color: #999; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
      .card-value { font-size: 18px; font-weight: 900; margin-top: 4px; }
      .green { color: #059669; }
      .red { color: #dc2626; }
      .amber { color: #d97706; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; padding: 6px 8px; border-bottom: 1px solid #ddd; }
      td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .bold { font-weight: 700; }
      .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #999; }
      @media print { body { padding: 20px; } }
    </style></head><body>`);

    printWindow.document.write(`<h1>Viltrum Egypt — Weekly Report</h1>`);
    printWindow.document.write(`<p class="subtitle">${weekLabel}</p>`);

    printWindow.document.write(`<h2>Key Metrics</h2><div class="grid">`);
    printWindow.document.write(`<div class="card"><div class="card-label">Revenue</div><div class="card-value green">${fmt(stats.revenue)} EGP</div></div>`);
    printWindow.document.write(`<div class="card"><div class="card-label">Ad Spend</div><div class="card-value red">${fmt(stats.spend)} EGP</div></div>`);
    printWindow.document.write(`<div class="card"><div class="card-label">ROAS</div><div class="card-value ${stats.roas >= 2 ? 'green' : stats.roas >= 1 ? 'amber' : 'red'}">${stats.roas.toFixed(2)}x</div></div>`);
    printWindow.document.write(`<div class="card"><div class="card-label">Orders</div><div class="card-value">${stats.validOrders}</div></div>`);
    printWindow.document.write(`</div><div class="grid">`);
    printWindow.document.write(`<div class="card"><div class="card-label">CPA</div><div class="card-value">${fmt(stats.cpa)} EGP</div></div>`);
    printWindow.document.write(`<div class="card"><div class="card-label">AOV</div><div class="card-value">${fmt(stats.aov)} EGP</div></div>`);
    printWindow.document.write(`<div class="card"><div class="card-label">CTR</div><div class="card-value">${stats.ctr.toFixed(2)}%</div></div>`);
    printWindow.document.write(`<div class="card"><div class="card-label">Impressions</div><div class="card-value">${fmt(stats.impressions)}</div></div>`);
    printWindow.document.write(`</div>`);

    printWindow.document.write(`<h2>Order Status</h2><div class="grid3">`);
    Object.entries(stats.statusCounts).forEach(([status, count]) => {
      printWindow.document.write(`<div class="card"><div class="card-label">${status}</div><div class="card-value">${count}</div></div>`);
    });
    printWindow.document.write(`</div>`);

    if (Object.keys(stats.platformMap).length > 0) {
      printWindow.document.write(`<h2>Platform Breakdown</h2><table><thead><tr><th>Platform</th><th class="text-right">Spend</th><th class="text-right">Impressions</th><th class="text-right">Clicks</th><th class="text-right">CTR</th></tr></thead><tbody>`);
      Object.entries(stats.platformMap).forEach(([p, d]) => {
        const pCtr = d.impressions > 0 ? ((d.clicks / d.impressions) * 100).toFixed(2) : "0";
        printWindow.document.write(`<tr><td class="bold">${p.toUpperCase()}</td><td class="text-right">${fmt(d.spend)} EGP</td><td class="text-right">${fmt(d.impressions)}</td><td class="text-right">${fmt(d.clicks)}</td><td class="text-right">${pCtr}%</td></tr>`);
      });
      printWindow.document.write(`</tbody></table>`);
    }

    if (stats.topProducts.length > 0) {
      printWindow.document.write(`<h2>Top Products</h2><table><thead><tr><th>Product</th><th class="text-right">Qty Sold</th></tr></thead><tbody>`);
      stats.topProducts.forEach(([name, qty]) => {
        printWindow.document.write(`<tr><td>${name}</td><td class="text-right bold">${qty}</td></tr>`);
      });
      printWindow.document.write(`</tbody></table>`);
    }

    if (stats.topCities.length > 0) {
      printWindow.document.write(`<h2>Top Cities</h2><table><thead><tr><th>City</th><th class="text-right">Orders</th></tr></thead><tbody>`);
      stats.topCities.forEach(([name, count]) => {
        printWindow.document.write(`<tr><td>${name}</td><td class="text-right bold">${count}</td></tr>`);
      });
      printWindow.document.write(`</tbody></table>`);
    }

    if (stats.repeatCustomers.length > 0) {
      printWindow.document.write(`<h2>Repeat Customers</h2><table><thead><tr><th>Name</th><th>Phone</th><th class="text-center">Orders</th><th class="text-right">Total Spent</th><th class="text-right">Last Order</th></tr></thead><tbody>`);
      stats.repeatCustomers.forEach((c) => {
        printWindow.document.write(`<tr><td class="bold">${c.name}</td><td>${c.phone}</td><td class="text-center">${c.count}x</td><td class="text-right">${fmt(c.total)} EGP</td><td class="text-right">${new Date(c.lastOrder).toLocaleDateString("en-GB")}</td></tr>`);
      });
      printWindow.document.write(`</tbody></table>`);
    }

    printWindow.document.write(`<div class="footer">Generated by Viltrum Egypt — ${new Date().toLocaleString("en-GB")}</div>`);
    printWindow.document.write(`</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-12" ref={reportRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-1">Performance Report</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Weekly Report</h1>
          <p className="text-xs text-zinc-500 mt-1">{weekLabel}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all">
            <FileDown size={14} /> Download PDF
          </button>
          <button onClick={fetchData} className="px-3 py-2.5 text-zinc-600 hover:text-white transition-colors border border-zinc-800 rounded-xl">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Revenue", value: `${fmt(stats.revenue)} EGP`, color: "text-emerald-400", icon: TrendingUp },
          { label: "Ad Spend", value: `${fmt(stats.spend)} EGP`, color: "text-red-400", icon: DollarSign },
          { label: "ROAS", value: `${stats.roas.toFixed(2)}x`, color: stats.roas >= 2 ? "text-emerald-400" : stats.roas >= 1 ? "text-amber-400" : "text-red-400", icon: Target },
          { label: "Orders", value: `${stats.validOrders}`, color: "text-white", icon: ShoppingCart },
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "CPA", value: `${fmt(stats.cpa)} EGP` },
          { label: "AOV", value: `${fmt(stats.aov)} EGP` },
          { label: "CTR", value: `${stats.ctr.toFixed(2)}%` },
          { label: "Impressions", value: fmt(stats.impressions) },
        ].map((m) => (
          <div key={m.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{m.label}</p>
            <p className="text-lg font-black text-white">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Order Status Breakdown */}
      {Object.keys(stats.statusCounts).length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Order Status Breakdown</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div key={status} className="px-4 py-2 bg-zinc-800/50 rounded-xl">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">{status}</span>
                <p className="text-lg font-black text-white">{count as number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Breakdown */}
      {Object.keys(stats.platformMap).length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Platform Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                  <th className="text-left py-2">Platform</th>
                  <th className="text-right py-2">Spend</th>
                  <th className="text-right py-2">Impressions</th>
                  <th className="text-right py-2">Clicks</th>
                  <th className="text-right py-2">CTR</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.platformMap).map(([p, d]) => {
                  const pCtr = d.impressions > 0 ? ((d.clicks / d.impressions) * 100).toFixed(2) : "0";
                  return (
                    <tr key={p} className="border-b border-zinc-800/50">
                      <td className="py-2 font-bold text-white uppercase">{p}</td>
                      <td className="py-2 text-right text-red-400 font-bold">{fmt(d.spend)} EGP</td>
                      <td className="py-2 text-right text-zinc-300">{fmt(d.impressions)}</td>
                      <td className="py-2 text-right text-zinc-300">{fmt(d.clicks)}</td>
                      <td className="py-2 text-right text-zinc-300">{pCtr}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Products & Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats.topProducts.length > 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Top Products</h3>
            <div className="space-y-2">
              {stats.topProducts.map(([name, qty], i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-zinc-800/50">
                  <span className="text-xs text-zinc-300">{name}</span>
                  <span className="text-xs font-bold text-white">{qty} sold</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {stats.topCities.length > 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Top Cities</h3>
            <div className="space-y-2">
              {stats.topCities.map(([name, count], i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-zinc-800/50">
                  <span className="text-xs text-zinc-300">{name}</span>
                  <span className="text-xs font-bold text-white">{count as number} orders</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Repeat Customers */}
      {stats.repeatCustomers.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users size={16} className="text-amber-400" /> Repeat Customers
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Phone</th>
                  <th className="text-center py-2">Orders</th>
                  <th className="text-right py-2">Total Spent</th>
                  <th className="text-right py-2">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {stats.repeatCustomers.map((c, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className="py-2 font-bold text-white">{c.name}</td>
                    <td className="py-2 text-zinc-400 font-mono">{c.phone}</td>
                    <td className="py-2 text-center"><span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold text-[10px]">{c.count}x</span></td>
                    <td className="py-2 text-right text-emerald-400 font-bold">{fmt(c.total)} EGP</td>
                    <td className="py-2 text-right text-zinc-500">{new Date(c.lastOrder).toLocaleDateString("en-GB")}</td>
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
