/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Order, OrderItem } from "@/types";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Percent,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Repeat,
  ShoppingBag,
  Ruler,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const PIE_COLORS = ["#000000", "#404040", "#737373", "#a3a3a3", "#d4d4d4"];

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [ordersRes, productsRes, expensesRes, inventoryRes] = await Promise.all([
          supabase.from("orders").select("*").order("created_at", { ascending: true }),
          supabase.from("products").select("id, title, is_active"),
          supabase.from("expenses").select("*"),
          supabase.from("inventory").select("*"),
        ]);

        if (ordersRes.data) setOrders(ordersRes.data);
        if (productsRes.data) {
          setProducts(productsRes.data);
          setProductCount(productsRes.data.filter((p: any) => p.is_active).length);
        }
        if (expensesRes.data) setExpenses(expensesRes.data);
        if (inventoryRes.data) setInventory(inventoryRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full" />
      </div>
    );
  }

  // ─── Core filters (exclude cancelled & returned from ALL stats) ─────────
  const validOrders = orders.filter(o => o.status !== "cancelled" && o.status !== "returned");
  const cancelledCount = orders.filter(o => o.status === "cancelled").length;
  const returnedCount = orders.filter(o => o.status === "returned").length;

  // ─── Revenue (separate product revenue from shipping) ───────────────────
  const grossRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);

  const computeProductRevenue = (ordersList: Order[]) =>
    ordersList.reduce((sum, o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      return sum + items.reduce((s: number, i: OrderItem) => s + i.price * i.quantity, 0);
    }, 0);

  const productRevenue = computeProductRevenue(validOrders);
  const shippingCollected = grossRevenue - productRevenue;
  const totalCommissions = validOrders.reduce((sum, o) => sum + (Number((o as any).commission_amount) || 0), 0);
  const totalDiscounts = validOrders.reduce((sum, o) => sum + (Number((o as any).discount_amount) || 0), 0);
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = productRevenue - totalExpensesAmount - totalCommissions;
  const profitMargin = productRevenue > 0 ? (netProfit / productRevenue) * 100 : 0;

  // ─── Delivered ──────────────────────────────────────────────────────────
  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const deliveredGross = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const deliveredProductRevenue = computeProductRevenue(deliveredOrders);
  const deliveredShipping = deliveredGross - deliveredProductRevenue;
  const deliveredCommissions = deliveredOrders.reduce((sum, o) => sum + (Number((o as any).commission_amount) || 0), 0);
  const yourCash = deliveredProductRevenue - deliveredCommissions;

  // ─── AOV (Average Order Value) — what the media buyer needs ─────────────
  const aov = validOrders.length > 0 ? productRevenue / validOrders.length : 0;
  const deliveredAov = deliveredOrders.length > 0 ? deliveredProductRevenue / deliveredOrders.length : 0;

  // ─── Customers ──────────────────────────────────────────────────────────
  const uniqueCustomers = new Set(validOrders.map(o => o.customer_phone)).size;
  const customerOrderCounts = new Map<string, number>();
  validOrders.forEach(o => {
    customerOrderCounts.set(o.customer_phone, (customerOrderCounts.get(o.customer_phone) || 0) + 1);
  });
  const repeatCustomers = Array.from(customerOrderCounts.values()).filter(c => c > 1).length;
  const repeatRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;

  // ─── Units sold ─────────────────────────────────────────────────────────
  const totalUnitsSold = validOrders.reduce((sum, o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    return sum + items.reduce((s: number, i: OrderItem) => s + i.quantity, 0);
  }, 0);

  // ─── Top selling products ──────────────────────────────────────────────
  const productSalesMap = new Map<string, { title: string; qty: number; revenue: number }>();
  validOrders.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((item: OrderItem) => {
      const existing = productSalesMap.get(item.title) || { title: item.title, qty: 0, revenue: 0 };
      existing.qty += item.quantity;
      existing.revenue += item.price * item.quantity;
      productSalesMap.set(item.title, existing);
    });
  });
  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // ─── Top sizes ─────────────────────────────────────────────────────────
  const sizeSalesMap = new Map<string, number>();
  validOrders.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((item: OrderItem) => {
      sizeSalesMap.set(item.size, (sizeSalesMap.get(item.size) || 0) + item.quantity);
    });
  });
  const topSizes = Array.from(sizeSalesMap.entries())
    .map(([size, qty]) => ({ size, qty }))
    .sort((a, b) => b.qty - a.qty);
  const totalSizeUnits = topSizes.reduce((s, t) => s + t.qty, 0);

  // ─── Fulfillment rate ──────────────────────────────────────────────────
  const fulfillmentRate = validOrders.length > 0 ? (deliveredOrders.length / validOrders.length) * 100 : 0;

  // ─── Return rate ───────────────────────────────────────────────────────
  const returnRate = orders.length > 0 ? (returnedCount / orders.length) * 100 : 0;

  // ─── Today's stats ─────────────────────────────────────────────────────
  const today = new Date().toDateString();
  const todayOrders = validOrders.filter(o => new Date(o.created_at).toDateString() === today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

  // ─── This month vs last month comparison ───────────────────────────────
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthOrders = validOrders.filter(o => new Date(o.created_at) >= thisMonthStart);
  const lastMonthOrders = validOrders.filter(o => {
    const d = new Date(o.created_at);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  const thisMonthRevenue = computeProductRevenue(thisMonthOrders);
  const lastMonthRevenue = computeProductRevenue(lastMonthOrders);
  const revenueChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  const thisMonthAov = thisMonthOrders.length > 0 ? thisMonthRevenue / thisMonthOrders.length : 0;
  const lastMonthAov = lastMonthOrders.length > 0 ? lastMonthRevenue / lastMonthOrders.length : 0;
  const aovChange = lastMonthAov > 0 ? ((thisMonthAov - lastMonthAov) / lastMonthAov) * 100 : 0;

  // ─── Revenue over time chart (product revenue only, no shipping) ────────
  const revenueDataMap = new Map<string, { name: string; Revenue: number; Orders: number }>();
  validOrders.forEach(o => {
    const date = new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!revenueDataMap.has(date)) {
      revenueDataMap.set(date, { name: date, Revenue: 0, Orders: 0 });
    }
    const current = revenueDataMap.get(date)!;
    const items = Array.isArray(o.items) ? o.items : [];
    current.Revenue += items.reduce((s: number, i: OrderItem) => s + i.price * i.quantity, 0);
    current.Orders += 1;
  });
  const chartData = Array.from(revenueDataMap.values());

  // ─── Expenses by category ─────────────────────────────────────────────
  const expenseCategories: Record<string, { name: string; value: number; color: string }> = {
    fabric: { name: "Fabric (قماش)", value: 0, color: "#3b82f6" },
    pattern: { name: "Pattern (باترون)", value: 0, color: "#a855f7" },
    printing: { name: "Printing (طباعة)", value: 0, color: "#ec4899" },
    designer: { name: "Designer (ديزاينر)", value: 0, color: "#6366f1" },
    transport: { name: "Transport (مواصلات)", value: 0, color: "#f59e0b" },
    production: { name: "Production (إنتاج)", value: 0, color: "#10b981" },
    marketing: { name: "Marketing (تسويق)", value: 0, color: "#ef4444" },
    packaging: { name: "Packaging (تغليف)", value: 0, color: "#14b8a6" },
    other: { name: "Other (أخرى)", value: 0, color: "#64748b" },
  };
  expenses.forEach(e => {
    const cat = e.category as keyof typeof expenseCategories;
    if (expenseCategories[cat]) {
      expenseCategories[cat].value += Number(e.amount);
    } else {
      expenseCategories.other.value += Number(e.amount);
    }
  });
  const expenseChartData = Object.values(expenseCategories).filter(item => item.value > 0);

  // ─── Stock alerts ─────────────────────────────────────────────────────
  const lowStockItems = inventory
    .filter(item => item.quantity <= 3)
    .map(item => {
      const prod = products.find((p: any) => p.id === item.product_id);
      return {
        id: `${item.product_id}-${item.size}`,
        title: prod ? prod.title : "Unknown Product",
        size: item.size,
        quantity: item.quantity,
      };
    })
    .slice(0, 5);

  // ─── Recent orders ────────────────────────────────────────────────────
  const recentOrders = [...orders].reverse().slice(0, 5);

  // ─── Monthly breakdown ────────────────────────────────────────────────
  const monthlyOrdersMap = new Map<string, { count: number; revenue: number; aov: number }>();
  validOrders.forEach(o => {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyOrdersMap.has(key)) {
      monthlyOrdersMap.set(key, { count: 0, revenue: 0, aov: 0 });
    }
    const entry = monthlyOrdersMap.get(key)!;
    entry.count += 1;
    const items = Array.isArray(o.items) ? o.items : [];
    entry.revenue += items.reduce((s: number, i: OrderItem) => s + i.price * i.quantity, 0);
  });
  const monthlyOrders = Array.from(monthlyOrdersMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, data]) => {
      const [year, month] = key.split("-");
      const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      return { key, label, ...data, aov: data.count > 0 ? data.revenue / data.count : 0 };
    });

  // ─── Order status breakdown for pie chart ─────────────────────────────
  const statusCounts: Record<string, number> = {};
  orders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  const TrendBadge = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
    if (value === 0) return <span className="text-xs text-gray-400 flex items-center gap-0.5"><Minus size={12} /> 0{suffix}</span>;
    return value > 0 ? (
      <span className="text-xs text-emerald-600 flex items-center gap-0.5"><ArrowUpRight size={12} /> +{value.toFixed(1)}{suffix}</span>
    ) : (
      <span className="text-xs text-red-500 flex items-center gap-0.5"><ArrowDownRight size={12} /> {value.toFixed(1)}{suffix}</span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">
          Analytics exclude {returnedCount} returned & {cancelledCount} cancelled orders.
        </p>
      </div>

      {/* ─── Media Buyer KPIs ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-black to-neutral-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-neutral-400" />
          <span className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Media Buyer Metrics</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-neutral-400 text-[11px] font-semibold uppercase tracking-wider">AOV</p>
            <p className="text-2xl font-bold text-white mt-1">{Math.round(aov).toLocaleString()}</p>
            <p className="text-neutral-500 text-[10px] mt-0.5">EGP / order (product only)</p>
            <div className="mt-2"><TrendBadge value={aovChange} /></div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-neutral-400 text-[11px] font-semibold uppercase tracking-wider">Product Revenue</p>
            <p className="text-2xl font-bold text-white mt-1">{productRevenue.toLocaleString()}</p>
            <p className="text-neutral-500 text-[10px] mt-0.5">EGP (excl. shipping)</p>
            <div className="mt-2"><TrendBadge value={revenueChange} /></div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-neutral-400 text-[11px] font-semibold uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold text-white mt-1">{validOrders.length}</p>
            <p className="text-neutral-500 text-[10px] mt-0.5">excl. returns & cancelled</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-neutral-400 text-[11px] font-semibold uppercase tracking-wider">Units Sold</p>
            <p className="text-2xl font-bold text-white mt-1">{totalUnitsSold}</p>
            <p className="text-neutral-500 text-[10px] mt-0.5">total items</p>
          </div>
        </div>
      </div>

      {/* ─── Your Cash (Delivered) ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={20} className="text-emerald-200" />
              <span className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Your Cash (Delivered)</span>
            </div>
            <p className="text-4xl font-bold text-white">
              {yourCash.toLocaleString()} <span className="text-xl font-medium text-emerald-200">EGP</span>
            </p>
            <p className="text-emerald-200 text-sm mt-1">Product revenue from delivered orders — shipping & commissions excluded</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{deliveredOrders.length}</p>
              <p className="text-emerald-200 text-[10px] font-semibold uppercase tracking-wider mt-1">Orders</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{Math.round(deliveredAov).toLocaleString()}</p>
              <p className="text-emerald-200 text-[10px] font-semibold uppercase tracking-wider mt-1">AOV</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{deliveredShipping.toLocaleString()}</p>
              <p className="text-emerald-200 text-[10px] font-semibold uppercase tracking-wider mt-1">Shipping</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{fulfillmentRate.toFixed(0)}%</p>
              <p className="text-emerald-200 text-[10px] font-semibold uppercase tracking-wider mt-1">Fulfillment</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Money Breakdown ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Where your money goes (delivered orders)</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Customer paid (gross)</span>
            <span className="text-sm font-bold text-black">{deliveredGross.toLocaleString()} EGP</span>
          </div>
          <div className="flex items-center justify-between text-red-500">
            <span className="text-sm">− Shipping (goes to carrier)</span>
            <span className="text-sm font-medium">−{deliveredShipping.toLocaleString()} EGP</span>
          </div>
          <div className="flex items-center justify-between text-red-500">
            <span className="text-sm">− Influencer commissions</span>
            <span className="text-sm font-medium">−{deliveredCommissions.toLocaleString()} EGP</span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-600">= Your product revenue</span>
            <span className="text-lg font-bold text-emerald-600">{yourCash.toLocaleString()} EGP</span>
          </div>
        </div>
      </div>

      {/* ─── Financial KPIs ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Revenue</h3>
            <DollarSign size={18} className="text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-black">{productRevenue.toLocaleString()} EGP</p>
          <span className="text-[10px] text-gray-400 font-medium">excl. shipping ({shippingCollected.toLocaleString()} EGP)</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Profit</h3>
            <TrendingUp size={18} className={netProfit >= 0 ? "text-emerald-400" : "text-red-400"} />
          </div>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {netProfit.toLocaleString()} EGP
          </p>
          <span className="text-[10px] text-gray-400 font-medium">revenue − expenses − commissions</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Expenses</h3>
            <TrendingDown size={18} className="text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-500">{totalExpensesAmount.toLocaleString()} EGP</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Profit Margin</h3>
            <Percent size={18} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-black">{profitMargin.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Return Rate</h3>
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-black">{returnRate.toFixed(1)}%</p>
          <span className="text-[10px] text-gray-400 font-medium">{returnedCount} returned out of {orders.length}</span>
        </div>
      </div>

      {/* ─── Operational KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customers</h3>
            <Users size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-black">{uniqueCustomers}</p>
          <span className="text-[10px] text-gray-400 font-medium">unique buyers</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Repeat Rate</h3>
            <Repeat size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-black">{repeatRate.toFixed(0)}%</p>
          <span className="text-[10px] text-gray-400 font-medium">{repeatCustomers} repeat customers</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Products</h3>
            <Package size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-black">{productCount}</p>
          <span className="text-[10px] text-gray-400 font-medium">active catalog</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today</h3>
            <ShoppingBag size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-black">{todayOrders.length} <span className="text-base font-medium text-gray-400">orders</span></p>
          <span className="text-[10px] text-gray-400 font-medium">{todayRevenue.toLocaleString()} EGP</span>
        </div>
      </div>

      {/* ─── Top Products & Top Sizes ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <ShoppingBag size={18} className="text-gray-400" />
            <h3 className="font-semibold text-black">Top Selling Products</h3>
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, i) => {
                const maxQty = topProducts[0].qty;
                const widthPercent = maxQty > 0 ? (product.qty / maxQty) * 100 : 0;
                return (
                  <div key={product.title}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-300 w-5">#{i + 1}</span>
                        <span className="text-sm font-medium text-black truncate max-w-[200px]">{product.title}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-black">{product.qty}</span>
                        <span className="text-xs text-gray-400 ml-1">sold</span>
                        <span className="text-xs text-gray-300 ml-2">·</span>
                        <span className="text-xs text-gray-500 ml-2">{product.revenue.toLocaleString()} EGP</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-black rounded-full h-2 transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No sales data yet.</div>
          )}
        </div>

        {/* Top Sizes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Ruler size={18} className="text-gray-400" />
            <h3 className="font-semibold text-black">Most Requested Sizes</h3>
          </div>
          {topSizes.length > 0 ? (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {topSizes.slice(0, 4).map((s, i) => (
                  <div key={s.size} className={`rounded-xl p-4 text-center ${i === 0 ? "bg-black text-white" : "bg-gray-50 border border-gray-200"}`}>
                    <p className={`text-2xl font-bold ${i === 0 ? "text-white" : "text-black"}`}>{s.size}</p>
                    <p className={`text-xs mt-1 ${i === 0 ? "text-neutral-300" : "text-gray-500"}`}>
                      {s.qty} units · {totalSizeUnits > 0 ? ((s.qty / totalSizeUnits) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {topSizes.map(s => {
                  const pct = totalSizeUnits > 0 ? (s.qty / totalSizeUnits) * 100 : 0;
                  return (
                    <div key={s.size} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-black w-10">{s.size}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div className="bg-black rounded-full h-2.5 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{pct.toFixed(0)}% ({s.qty})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No size data yet.</div>
          )}
        </div>
      </div>

      {/* ─── Charts ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Stream */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-black mb-6">Revenue Stream</h3>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(val: any, name: any) => [name === "Revenue" ? `${Number(val || 0).toLocaleString()} EGP` : val, name]}
                  />
                  <Area type="monotone" dataKey="Revenue" stroke="#000000" strokeWidth={2} fill="#000000" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No revenue data available yet.</div>
            )}
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-black mb-6">Expenses Breakdown</h3>
          <div className="h-[300px] w-full">
            {expenseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B7280" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(val) => [`${Number(val || 0).toLocaleString()} EGP`, "Cost"]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {expenseChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No expenses logged yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Operational Logs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <h3 className="font-semibold text-black mb-6">Recent Orders</h3>
          <div className="flex-1 overflow-y-auto pr-2">
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between border-b border-b-gray-100 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-black text-sm">{order.customer_name}</p>
                      <p className="text-xs text-gray-500 mt-1">#{order.order_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-black text-sm">{order.total.toLocaleString()} EGP</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-700"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : order.status === "returned"
                                ? "bg-rose-100 text-rose-700"
                                : order.status === "shipped"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No orders found.</div>
            )}
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <h3 className="font-semibold text-black mb-6">Monthly Breakdown</h3>
          <div className="flex-1 overflow-y-auto pr-2">
            {monthlyOrders.length > 0 ? (
              <div className="space-y-3">
                {monthlyOrders.map(m => (
                  <div key={m.key} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-black text-sm">{m.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {m.revenue.toLocaleString()} EGP · AOV {Math.round(m.aov).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1.5 text-sm font-bold text-black bg-gray-100 rounded-lg">
                        {m.count} orders
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No orders yet.</div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <h3 className="font-semibold text-black mb-6">Low Stock Warnings</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between border-b border-b-gray-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-black text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">Size: {item.size}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                        item.quantity === 0
                          ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.quantity === 0 ? "Out of Stock" : `${item.quantity} Left`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-emerald-500 text-sm font-semibold py-12 gap-2">
                <CheckCircle size={32} />
                <span>All stock levels are optimal!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
