/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileSpreadsheet,
  Download,
  Users,
  Calendar,
  TrendingUp,
  RefreshCw,
  Repeat,
  ShoppingCart,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [adSpend, setAdSpend] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"weekly" | "repeat">("weekly");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [ordersRes, adRes, batchRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("ad_spend").select("*"),
      supabase.from("manufacturing_batches").select("*"),
    ]);
    setOrders(ordersRes.data || []);
    setAdSpend(adRes.data || []);
    setBatches(batchRes.data || []);
    setLoading(false);
  };

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const fmtDec = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  // === Weekly Reports ===
  const getWeeklyReports = useCallback(() => {
    const weeks: Record<string, { start: Date; end: Date; orders: any[]; adSpend: number }> = {};

    for (const order of orders) {
      const d = new Date(order.created_at);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.getFullYear(), d.getMonth(), diff);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const key = weekStart.toISOString().split("T")[0];

      if (!weeks[key]) weeks[key] = { start: weekStart, end: weekEnd, orders: [], adSpend: 0 };
      weeks[key].orders.push(order);
    }

    for (const ad of adSpend) {
      const d = new Date(ad.date || ad.created_at);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.getFullYear(), d.getMonth(), diff);
      weekStart.setHours(0, 0, 0, 0);
      const key = weekStart.toISOString().split("T")[0];
      if (weeks[key]) weeks[key].adSpend += Number(ad.amount || 0);
    }

    return Object.entries(weeks)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, w]) => {
        const valid = w.orders.filter((o: any) => o.status !== "cancelled" && o.status !== "returned");
        const revenue = valid.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
        const totalOrders = valid.length;
        const cancelled = w.orders.filter((o: any) => o.status === "cancelled").length;
        const delivered = w.orders.filter((o: any) => o.status === "delivered").length;
        const aov = totalOrders > 0 ? revenue / totalOrders : 0;
        const roas = w.adSpend > 0 ? revenue / w.adSpend : 0;

        return { key, ...w, revenue, totalOrders, cancelled, delivered, aov, roas };
      });
  }, [orders, adSpend]);

  // === Repeat Customers ===
  const getRepeatCustomers = useCallback(() => {
    const map: Record<string, { name: string; phone: string; orders: any[]; totalSpent: number }> = {};

    for (const order of orders) {
      if (order.status === "cancelled") continue;
      const phone = (order.customer_phone || "").trim();
      if (!phone) continue;

      if (!map[phone]) {
        map[phone] = { name: order.customer_name || "", phone, orders: [], totalSpent: 0 };
      }
      map[phone].orders.push(order);
      map[phone].totalSpent += Number(order.total || 0);
      if (order.customer_name && !map[phone].name) map[phone].name = order.customer_name;
    }

    return Object.values(map)
      .filter((c) => c.orders.length >= 2)
      .sort((a, b) => b.orders.length - a.orders.length);
  }, [orders]);

  // === Excel Export ===
  const exportWeeklyExcel = (week: any) => {
    const headers = ["Order #", "Customer", "Phone", "City", "Status", "Total (EGP)", "Payment", "Date"];
    const rows = week.orders.map((o: any) => [
      o.order_number || "",
      o.customer_name || "",
      o.customer_phone || "",
      (o.customer_address || "").split(" - ")[0] || "",
      o.status || "",
      Number(o.total || 0),
      o.payment_method || "",
      new Date(o.created_at).toLocaleDateString("en-US"),
    ]);

    const summaryRows = [
      [],
      ["WEEKLY SUMMARY"],
      ["Total Orders", week.totalOrders],
      ["Revenue", `${fmt(week.revenue)} EGP`],
      ["Cancelled", week.cancelled],
      ["Delivered", week.delivered],
      ["AOV", `${fmt(week.aov)} EGP`],
      ["Ad Spend", `${fmt(week.adSpend)} EGP`],
      ["ROAS", `${fmtDec(week.roas)}x`],
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map((r: any) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
      ...summaryRows.map((r: any) => r.join(",")),
    ].join("\n");

    const BOM = "﻿";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `viltrum-report-${week.key}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllData = () => {
    const headers = ["Order #", "Customer", "Phone", "City", "Address", "Status", "Total (EGP)", "Payment", "Shipping Co.", "Tracking #", "Referral Source", "Date"];
    const rows = orders.map((o: any) => [
      o.order_number || "",
      o.customer_name || "",
      o.customer_phone || "",
      (o.customer_address || "").split(" - ")[0] || "",
      o.customer_address || "",
      o.status || "",
      Number(o.total || 0),
      o.payment_method || "",
      o.shipping_company || "",
      o.tracking_number || "",
      o.referral_source || "",
      new Date(o.created_at).toLocaleDateString("en-US"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r: any) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const BOM = "﻿";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `viltrum-all-orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const weeklyReports = getWeeklyReports();
  const repeatCustomers = getRepeatCustomers();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase font-bold">Loading Reports</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-1">Business Intelligence</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Reports</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportAllData}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <Download size={14} /> Export All Orders
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("weekly")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold border transition-all ${
            tab === "weekly" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50 hover:text-white"
          }`}
        >
          <Calendar size={14} /> Weekly Reports
        </button>
        <button
          onClick={() => setTab("repeat")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold border transition-all ${
            tab === "repeat" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50 hover:text-white"
          }`}
        >
          <Repeat size={14} /> Repeat Customers ({repeatCustomers.length})
        </button>
      </div>

      {/* Weekly Reports Tab */}
      {tab === "weekly" && (
        <div className="space-y-4">
          {weeklyReports.map((week) => (
            <div key={week.key} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar size={16} className="text-red-400" />
                    {week.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {week.end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={() => exportWeeklyExcel(week)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                >
                  <FileSpreadsheet size={12} /> Export CSV
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: "Orders", value: week.totalOrders, icon: ShoppingCart, color: "text-zinc-300" },
                  { label: "Revenue", value: `${fmt(week.revenue)}`, icon: DollarSign, color: "text-emerald-400" },
                  { label: "AOV", value: `${fmt(week.aov)}`, icon: TrendingUp, color: "text-purple-400" },
                  { label: "Delivered", value: week.delivered, icon: ShoppingCart, color: "text-emerald-400" },
                  { label: "Cancelled", value: week.cancelled, icon: ShoppingCart, color: week.cancelled > 0 ? "text-red-400" : "text-zinc-500" },
                  { label: "Ad Spend", value: `${fmt(week.adSpend)}`, icon: DollarSign, color: "text-orange-400" },
                  { label: "ROAS", value: `${fmtDec(week.roas)}x`, icon: TrendingUp, color: week.roas >= 3 ? "text-emerald-400" : week.roas >= 1 ? "text-amber-400" : "text-red-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-zinc-800/40 rounded-xl p-3 text-center">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">{stat.label}</p>
                    <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {weeklyReports.length === 0 && (
            <div className="text-center py-20">
              <Calendar size={40} className="mx-auto text-zinc-700 mb-4" />
              <p className="text-sm text-zinc-500 font-bold">No weekly data yet</p>
            </div>
          )}
        </div>
      )}

      {/* Repeat Customers Tab */}
      {tab === "repeat" && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Repeat Customers</p>
              <p className="text-2xl font-black text-purple-400">{repeatCustomers.length}</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Repeat Orders</p>
              <p className="text-2xl font-black text-blue-400">{repeatCustomers.reduce((s, c) => s + c.orders.length, 0)}</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Revenue from Repeats</p>
              <p className="text-2xl font-black text-emerald-400">{fmt(repeatCustomers.reduce((s, c) => s + c.totalSpent, 0))} EGP</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Repeat Rate</p>
              <p className="text-2xl font-black text-amber-400">
                {orders.length > 0 ? fmtDec((repeatCustomers.reduce((s, c) => s + c.orders.length, 0) / orders.length) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Customer List */}
          <div className="space-y-3">
            {repeatCustomers.map((customer) => {
              const expanded = expandedCustomer === customer.phone;
              return (
                <div key={customer.phone} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCustomer(expanded ? null : customer.phone)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <Users size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{customer.name}</p>
                        <p className="text-[10px] text-zinc-500">{customer.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-black text-purple-400">{customer.orders.length} orders</p>
                        <p className="text-[10px] text-zinc-500 font-bold">{fmt(customer.totalSpent)} EGP total</p>
                      </div>
                      {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                    </div>
                  </button>

                  {expanded && (
                    <div className="px-5 pb-5 border-t border-zinc-800/50 pt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-zinc-500 text-left">
                              <th className="pb-2 font-bold">Order #</th>
                              <th className="pb-2 font-bold">Status</th>
                              <th className="pb-2 font-bold text-right">Total</th>
                              <th className="pb-2 font-bold text-right">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50">
                            {customer.orders
                              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                              .map((o: any) => (
                                <tr key={o.id} className="text-zinc-300">
                                  <td className="py-2 font-medium">#{o.order_number}</td>
                                  <td className="py-2">
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                      o.status === "delivered" ? "bg-emerald-500/10 text-emerald-400" :
                                      o.status === "cancelled" ? "bg-zinc-500/10 text-zinc-400" :
                                      o.status === "shipped" ? "bg-purple-500/10 text-purple-400" :
                                      "bg-amber-500/10 text-amber-400"
                                    }`}>{o.status}</span>
                                  </td>
                                  <td className="py-2 text-right font-bold text-white">{fmt(Number(o.total || 0))} EGP</td>
                                  <td className="py-2 text-right text-zinc-500">{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {repeatCustomers.length === 0 && (
              <div className="text-center py-20">
                <Users size={40} className="mx-auto text-zinc-700 mb-4" />
                <p className="text-sm text-zinc-500 font-bold">No repeat customers yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
