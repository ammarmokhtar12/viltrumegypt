/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ProfitCalculatorPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "profit" | "margin">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [ordersRes, batchesRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("manufacturing_batches").select("*"),
    ]);
    setOrders(ordersRes.data || []);
    setBatches(batchesRes.data || []);
    setLoading(false);
  };

  const avgCostPerUnit =
    batches.length > 0
      ? batches.reduce((sum: number, b: any) => sum + Number(b.cost_per_unit || 0), 0) / batches.length
      : 0;

  const getCostMap = () => {
    const map: Record<string, number> = {};
    for (const b of batches) {
      const name = (b.product_name || "").toLowerCase().trim();
      if (name) map[name] = Number(b.cost_per_unit || 0);
    }
    return map;
  };

  const costMap = getCostMap();

  const getItemCost = (item: any) => {
    const name = (item.name || item.product_name || "").toLowerCase().trim();
    for (const key of Object.keys(costMap)) {
      if (name.includes(key) || key.includes(name)) return costMap[key];
    }
    return avgCostPerUnit;
  };

  const calculateOrderProfit = (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    let totalCost = 0;
    const itemDetails: any[] = [];

    for (const item of items) {
      const qty = Number(item.quantity || 1);
      const unitCost = getItemCost(item);
      const itemCost = unitCost * qty;
      const itemRevenue = Number(item.price || 0) * qty;
      totalCost += itemCost;

      itemDetails.push({
        name: item.name || item.product_name || "Unknown",
        size: item.size || "-",
        qty,
        price: Number(item.price || 0),
        unitCost,
        itemCost,
        itemRevenue,
        itemProfit: itemRevenue - itemCost,
      });
    }

    const revenue = Number(order.total || 0);
    const shippingCost = 45;
    const totalOrderCost = totalCost + shippingCost;
    const profit = revenue - totalOrderCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return { revenue, totalCost, shippingCost, totalOrderCost, profit, margin, itemDetails };
  };

  const validOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned");

  const ordersWithProfit = validOrders.map((o) => ({
    ...o,
    calc: calculateOrderProfit(o),
  }));

  const sorted = [...ordersWithProfit].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "date") return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (sortBy === "profit") return dir * (a.calc.profit - b.calc.profit);
    return dir * (a.calc.margin - b.calc.margin);
  });

  const totalProfit = ordersWithProfit.reduce((s, o) => s + o.calc.profit, 0);
  const totalRevenue = ordersWithProfit.reduce((s, o) => s + o.calc.revenue, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const avgProfitPerOrder = ordersWithProfit.length > 0 ? totalProfit / ordersWithProfit.length : 0;

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const fmtDec = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase font-bold">Calculating Profits</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-1">Financial Analysis</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Profit Calculator</h1>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Profit", value: `${fmt(totalProfit)} EGP`, icon: DollarSign, color: totalProfit >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Avg Margin", value: `${fmtDec(avgMargin)}%`, icon: TrendingUp, color: avgMargin >= 20 ? "text-emerald-400" : "text-amber-400" },
          { label: "Avg Profit/Order", value: `${fmt(avgProfitPerOrder)} EGP`, icon: Calculator, color: avgProfitPerOrder >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Avg Cost/Unit", value: `${fmtDec(avgCostPerUnit)} EGP`, icon: Package, color: "text-blue-400" },
        ].map((card) => (
          <div key={card.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-xl bg-zinc-800/80 flex items-center justify-center ${card.color} mb-3`}>
              <card.icon size={16} />
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Batch Cost Reference */}
      {batches.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Package size={16} className="text-amber-400" /> Manufacturing Batch Costs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {batches.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between px-4 py-3 bg-zinc-800/40 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-white">{b.product_name}</p>
                  <p className="text-[10px] text-zinc-500">{b.quantity} units</p>
                </div>
                <p className="text-sm font-black text-amber-400">{fmtDec(Number(b.cost_per_unit || 0))} EGP/unit</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex gap-2 flex-wrap">
        {(["date", "profit", "margin"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              if (sortBy === s) setSortDir(sortDir === "asc" ? "desc" : "asc");
              else { setSortBy(s); setSortDir("desc"); }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              sortBy === s ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50 hover:text-white"
            }`}
          >
            {s === "date" ? "Date" : s === "profit" ? "Profit" : "Margin"}
            {sortBy === s && (sortDir === "desc" ? " ↓" : " ↑")}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {sorted.map((order) => {
          const { calc } = order;
          const expanded = expandedOrder === order.id;
          return (
            <div key={order.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedOrder(expanded ? null : order.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    calc.profit >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {calc.profit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">
                      #{order.order_number}
                      <span className="text-zinc-600 font-medium ml-2">
                        {order.customer_name}
                      </span>
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {" · "}
                      {(order.items || []).length} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-sm font-black ${calc.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {calc.profit >= 0 ? "+" : ""}{fmt(calc.profit)} EGP
                    </p>
                    <p className="text-[10px] text-zinc-500 font-bold">{fmtDec(calc.margin)}% margin</p>
                  </div>
                  {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                </div>
              </button>

              {expanded && (
                <div className="px-5 pb-5 border-t border-zinc-800/50 pt-4 space-y-4">
                  {/* Items breakdown */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Items Breakdown</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-zinc-500 text-left">
                            <th className="pb-2 font-bold">Product</th>
                            <th className="pb-2 font-bold text-center">Size</th>
                            <th className="pb-2 font-bold text-center">Qty</th>
                            <th className="pb-2 font-bold text-right">Price</th>
                            <th className="pb-2 font-bold text-right">Cost</th>
                            <th className="pb-2 font-bold text-right">Profit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {calc.itemDetails.map((item: any, i: number) => (
                            <tr key={i} className="text-zinc-300">
                              <td className="py-2 font-medium">{item.name}</td>
                              <td className="py-2 text-center text-zinc-500">{item.size}</td>
                              <td className="py-2 text-center">{item.qty}</td>
                              <td className="py-2 text-right">{fmt(item.itemRevenue)}</td>
                              <td className="py-2 text-right text-amber-400">{fmt(item.itemCost)}</td>
                              <td className={`py-2 text-right font-bold ${item.itemProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {item.itemProfit >= 0 ? "+" : ""}{fmt(item.itemProfit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-800/40 rounded-xl p-3 text-center">
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">Revenue</p>
                      <p className="text-sm font-black text-white">{fmt(calc.revenue)}</p>
                    </div>
                    <div className="bg-zinc-800/40 rounded-xl p-3 text-center">
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">Product Cost</p>
                      <p className="text-sm font-black text-amber-400">{fmt(calc.totalCost)}</p>
                    </div>
                    <div className="bg-zinc-800/40 rounded-xl p-3 text-center">
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">Shipping Cost</p>
                      <p className="text-sm font-black text-orange-400">{fmt(calc.shippingCost)}</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${calc.profit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">Net Profit</p>
                      <p className={`text-sm font-black ${calc.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {calc.profit >= 0 ? "+" : ""}{fmt(calc.profit)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-20">
          <Calculator size={40} className="mx-auto text-zinc-700 mb-4" />
          <p className="text-sm text-zinc-500 font-bold">No orders to calculate</p>
        </div>
      )}
    </div>
  );
}
