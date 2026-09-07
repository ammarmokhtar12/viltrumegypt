/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Target,
  Users,
  Package,
  RotateCcw,
  Wallet,
  BarChart3,
  Percent,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Settings,
  Save,
  RefreshCw,
  Megaphone,
  Factory,
} from "lucide-react";

interface KPICard {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color: string;
  trend?: "up" | "down" | "neutral";
}

export default function CommandCenterDashboard() {
  const [loading, setLoading] = useState(true);
  const [budgetInput, setBudgetInput] = useState("");
  const [adBudgetInput, setAdBudgetInput] = useState("");
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  // Raw data
  const [orders, setOrders] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [adSpend, setAdSpend] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ordersRes, expensesRes, adSpendRes, batchesRes, invRes, returnsRes, budgetRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("expenses").select("*"),
        supabase.from("ad_spend").select("*"),
        supabase.from("manufacturing_batches").select("*"),
        supabase.from("inventory").select("*"),
        supabase.from("returns").select("*"),
        supabase.from("budget_settings").select("*").order("created_at", { ascending: false }).limit(1),
      ]);

      setOrders(ordersRes.data || []);
      setExpenses(expensesRes.data || []);
      setAdSpend(adSpendRes.data || []);
      setBatches(batchesRes.data || []);
      setInventory(invRes.data || []);
      setReturns(returnsRes.data || []);

      if (budgetRes.data?.[0]) {
        setBudget(budgetRes.data[0]);
        setBudgetInput(String(budgetRes.data[0].total_budget || ""));
        setAdBudgetInput(String(budgetRes.data[0].ad_budget || ""));
      } else {
        setShowBudgetForm(true);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    const total = parseFloat(budgetInput) || 0;
    const ad = parseFloat(adBudgetInput) || 0;

    if (budget?.id) {
      await supabase.from("budget_settings").update({ total_budget: total, ad_budget: ad, updated_at: new Date().toISOString() }).eq("id", budget.id);
    } else {
      await supabase.from("budget_settings").insert({ total_budget: total, ad_budget: ad });
    }

    setBudgetSaved(true);
    setShowBudgetForm(false);
    setTimeout(() => setBudgetSaved(false), 2000);
    fetchAll();
  };

  // === CALCULATIONS ===
  const totalRevenue = orders
    .filter((o: any) => o.status !== "cancelled" && o.status !== "returned")
    .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

  const totalAdSpend = adSpend.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
  const totalManufacturing = batches.reduce((sum: number, b: any) => sum + Number(b.total_cost || 0), 0);
  const totalCost = totalAdSpend + totalExpenses + totalManufacturing;
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const validOrders = orders.filter((o: any) => o.status !== "cancelled" && o.status !== "returned");
  const totalOrders = validOrders.length;
  const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
  const confirmedOrders = orders.filter((o: any) => o.status === "confirmed").length;
  const shippedOrders = orders.filter((o: any) => o.status === "shipped").length;
  const deliveredOrders = orders.filter((o: any) => o.status === "delivered").length;
  const cancelledOrders = orders.filter((o: any) => o.status === "cancelled").length;
  const returnedOrders = orders.filter((o: any) => o.status === "returned").length;

  const roas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
  const cpa = totalOrders > 0 ? totalAdSpend / totalOrders : 0;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const totalImpressions = adSpend.reduce((sum: number, a: any) => sum + Number(a.impressions || 0), 0);
  const totalClicks = adSpend.reduce((sum: number, a: any) => sum + Number(a.clicks || 0), 0);
  const avgCPM = totalImpressions > 0 ? (totalAdSpend / totalImpressions) * 1000 : 0;
  const avgCPC = totalClicks > 0 ? totalAdSpend / totalClicks : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const refundRate = orders.length > 0 ? (returnedOrders / orders.length) * 100 : 0;
  const totalStock = inventory.reduce((sum: number, i: any) => sum + Number(i.quantity || 0), 0);
  const avgCostPerUnit = batches.length > 0
    ? batches.reduce((sum: number, b: any) => sum + Number(b.cost_per_unit || 0), 0) / batches.length
    : 0;
  const stockValue = totalStock * avgCostPerUnit;

  const budgetTotal = Number(budget?.total_budget || 0);
  const budgetRemaining = budgetTotal - totalCost;
  const breakEven = avgCostPerUnit > 0 && aov > 0 ? Math.ceil(totalCost / (aov - avgCostPerUnit)) : 0;

  const collectedOrders = orders.filter((o: any) => o.payment_collected === true).length;
  const collectedRevenue = orders.filter((o: any) => o.payment_collected === true).reduce((s: number, o: any) => s + Number(o.total || 0), 0);

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const fmtDec = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  const kpis: KPICard[] = [
    { label: "Total Revenue", value: `${fmt(totalRevenue)} EGP`, icon: DollarSign, color: "text-emerald-400", trend: "up" },
    { label: "Gross Profit", value: `${fmt(grossProfit)} EGP`, sub: grossProfit >= 0 ? "Profitable" : "Loss", icon: TrendingUp, color: grossProfit >= 0 ? "text-emerald-400" : "text-red-400", trend: grossProfit >= 0 ? "up" : "down" },
    { label: "Profit Margin", value: `${fmtDec(profitMargin)}%`, icon: Percent, color: profitMargin >= 20 ? "text-emerald-400" : "text-amber-400" },
    { label: "ROAS", value: `${fmtDec(roas)}x`, sub: roas >= 3 ? "Healthy" : roas >= 1 ? "OK" : "Below target", icon: Target, color: roas >= 3 ? "text-emerald-400" : roas >= 1 ? "text-amber-400" : "text-red-400" },
    { label: "CPA", value: `${fmt(cpa)} EGP`, sub: "Cost Per Acquisition", icon: Users, color: "text-blue-400" },
    { label: "AOV", value: `${fmt(aov)} EGP`, sub: "Avg Order Value", icon: ShoppingCart, color: "text-purple-400" },
    { label: "CPM", value: `${fmtDec(avgCPM)} EGP`, sub: "Cost Per 1K Impressions", icon: BarChart3, color: "text-cyan-400" },
    { label: "CPC", value: `${fmtDec(avgCPC)} EGP`, sub: "Cost Per Click", icon: Target, color: "text-sky-400" },
    { label: "CTR", value: `${fmtDec(avgCTR)}%`, sub: "Click-Through Rate", icon: TrendingUp, color: avgCTR >= 1 ? "text-emerald-400" : "text-amber-400" },
    { label: "Total Orders", value: fmt(totalOrders), sub: `${pendingOrders} pending · ${deliveredOrders} delivered`, icon: ShoppingCart, color: "text-zinc-300" },
    { label: "Ad Spend", value: `${fmt(totalAdSpend)} EGP`, sub: `Meta + TikTok + Other`, icon: Megaphone, color: "text-orange-400" },
    { label: "Total Expenses", value: `${fmt(totalExpenses)} EGP`, sub: "Manufacturing + Operations", icon: Wallet, color: "text-rose-400" },
    { label: "Manufacturing Cost", value: `${fmt(totalManufacturing)} EGP`, sub: `${fmtDec(avgCostPerUnit)} EGP/unit`, icon: Factory, color: "text-amber-400" },
    { label: "Total Cost", value: `${fmt(totalCost)} EGP`, sub: "Ads + Expenses + Manufacturing", icon: DollarSign, color: "text-red-400" },
    { label: "Refund Rate", value: `${fmtDec(refundRate)}%`, sub: `${returnedOrders} returned / ${cancelledOrders} cancelled`, icon: RotateCcw, color: refundRate <= 5 ? "text-emerald-400" : "text-red-400" },
    { label: "Stock Units", value: fmt(totalStock), sub: `Value: ${fmt(stockValue)} EGP`, icon: Package, color: totalStock > 10 ? "text-emerald-400" : "text-red-400" },
    { label: "Budget Remaining", value: `${fmt(budgetRemaining)} EGP`, sub: budgetTotal > 0 ? `of ${fmt(budgetTotal)} EGP` : "No budget set", icon: Wallet, color: budgetRemaining >= 0 ? "text-emerald-400" : "text-red-400" },
    { label: "Break-Even Orders", value: fmt(breakEven), sub: "Orders needed to cover costs", icon: Target, color: "text-cyan-400" },
    { label: "Collected Revenue", value: `${fmt(collectedRevenue)} EGP`, sub: `${collectedOrders} of ${orders.length} orders`, icon: DollarSign, color: "text-emerald-400" },
    { label: "Cash Flow", value: `${fmt(collectedRevenue - totalCost)} EGP`, sub: "Collected - Total Cost", icon: TrendingUp, color: (collectedRevenue - totalCost) >= 0 ? "text-emerald-400" : "text-red-400", trend: (collectedRevenue - totalCost) >= 0 ? "up" : "down" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase font-bold">Loading Analytics</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-1">Media Buyer Analytics</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBudgetForm(!showBudgetForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <Settings size={14} /> Budget
          </button>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Budget Input */}
      {showBudgetForm && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Wallet size={16} className="text-red-400" /> Set Your Budget
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Total Budget (EGP)</label>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Ad Budget (EGP)</label>
              <input
                type="number"
                value={adBudgetInput}
                onChange={(e) => setAdBudgetInput(e.target.value)}
                placeholder="e.g. 20000"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>
          </div>
          <button
            onClick={handleSaveBudget}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Save size={14} /> {budgetSaved ? "Saved!" : "Save Budget"}
          </button>
        </div>
      )}

      {/* Monthly Target */}
      {(() => {
        const TARGET_ORDERS = 100;
        const TARGET_REVENUE = aov > 0 ? TARGET_ORDERS * aov : 50000;
        const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const dayOfMonth = new Date().getDate();
        const daysLeft = daysInMonth - dayOfMonth;
        const orderPct = Math.min((totalOrders / TARGET_ORDERS) * 100, 100);
        const revPct = Math.min((totalRevenue / TARGET_REVENUE) * 100, 100);
        const ordersPerDay = dayOfMonth > 0 ? totalOrders / dayOfMonth : 0;
        const projectedOrders = Math.round(ordersPerDay * daysInMonth);
        const onTrack = projectedOrders >= TARGET_ORDERS;

        return (
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em]">{currentMonth} Target</p>
                <h2 className="text-xl font-black text-white mt-1">Reach {TARGET_ORDERS} Orders</h2>
              </div>
              <div className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                onTrack ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"
              }`}>
                {onTrack ? "On Track" : "Behind"}
              </div>
            </div>

            {/* Orders Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs text-zinc-500 font-bold">Orders</span>
                <span className="text-sm font-black text-white">{totalOrders} <span className="text-zinc-600 font-medium">/ {TARGET_ORDERS}</span></span>
              </div>
              <div className="h-4 bg-zinc-800 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${orderPct >= 100 ? "bg-emerald-500" : orderPct >= 60 ? "bg-blue-500" : "bg-red-500"}`}
                  style={{ width: `${orderPct}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white/80">{orderPct.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-600">
                <span>{TARGET_ORDERS - totalOrders > 0 ? `${TARGET_ORDERS - totalOrders} orders to go` : "Target reached!"}</span>
                <span>{daysLeft} days left</span>
              </div>
            </div>

            {/* Revenue Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs text-zinc-500 font-bold">Revenue</span>
                <span className="text-sm font-black text-white">{fmt(totalRevenue)} <span className="text-zinc-600 font-medium">/ {fmt(TARGET_REVENUE)} EGP</span></span>
              </div>
              <div className="h-4 bg-zinc-800 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${revPct >= 100 ? "bg-emerald-500" : revPct >= 60 ? "bg-purple-500" : "bg-amber-500"}`}
                  style={{ width: `${revPct}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white/80">{revPct.toFixed(0)}%</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="text-center">
                <p className="text-lg font-black text-white">{ordersPerDay.toFixed(1)}</p>
                <p className="text-[9px] text-zinc-600 font-bold uppercase">Orders/Day</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-black ${onTrack ? "text-emerald-400" : "text-amber-400"}`}>{projectedOrders}</p>
                <p className="text-[9px] text-zinc-600 font-bold uppercase">Projected</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-white">{daysLeft > 0 ? Math.ceil((TARGET_ORDERS - totalOrders) / daysLeft) : 0}</p>
                <p className="text-[9px] text-zinc-600 font-bold uppercase">Needed/Day</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Orders Status Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: "Pending", count: pendingOrders, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { label: "Confirmed", count: confirmedOrders, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
          { label: "Shipped", count: shippedOrders, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
          { label: "Delivered", count: deliveredOrders, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { label: "Cancelled", count: cancelledOrders, color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
          { label: "Returned", count: returnedOrders, color: "text-red-400 bg-red-500/10 border-red-500/20" },
        ].map((s) => (
          <div key={s.label} className={`px-4 py-3 rounded-xl border text-center ${s.color}`}>
            <p className="text-lg font-black">{s.count}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 hover:border-zinc-700/60 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-zinc-800/80 flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                <kpi.icon size={16} />
              </div>
              {kpi.trend && (
                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${kpi.trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
                  {kpi.trend === "up" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{kpi.label}</p>
            <p className={`text-xl font-black tracking-tight ${kpi.color}`}>{kpi.value}</p>
            {kpi.sub && <p className="text-[10px] text-zinc-600 font-medium mt-1">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* Quick Warning Alerts */}
      {(totalStock <= 10 || refundRate > 10 || (roas > 0 && roas < 1)) && (
        <div className="space-y-3">
          {totalStock <= 10 && (
            <div className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-xs font-bold text-red-300">Low Stock Alert — Only {totalStock} units remaining in inventory</p>
            </div>
          )}
          {refundRate > 10 && (
            <div className="flex items-center gap-3 px-5 py-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-300">High Refund Rate — {fmtDec(refundRate)}% of orders returned</p>
            </div>
          )}
          {roas > 0 && roas < 1 && (
            <div className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-xs font-bold text-red-300">ROAS Below 1x — You&apos;re losing money on ads ({fmtDec(roas)}x return)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
