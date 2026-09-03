/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types";
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown, Percent, CheckCircle, AlertTriangle } from "lucide-react";
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
} from "recharts";

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
          setProductCount(productsRes.data.filter(p => p.is_active).length);
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

  // Filter out cancelled and returned orders from revenue calculations
  const completedOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const uniqueCustomers = new Set(orders.map((o) => o.customer_phone)).size;

  // Delivered-only revenue
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const avgDeliveredOrder = deliveredOrders.length > 0 ? deliveredRevenue / deliveredOrders.length : 0;

  // Chart 1: Revenue Stream over time
  const revenueDataMap = new Map();
  orders.forEach(o => {
    if (o.status === 'cancelled' || o.status === 'returned') return; // Skip cancelled/returned orders in chart
    const date = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!revenueDataMap.has(date)) {
      revenueDataMap.set(date, { name: date, Revenue: 0 });
    }
    const current = revenueDataMap.get(date);
    current.Revenue += o.total;
  });
  const chartData = Array.from(revenueDataMap.values());

  // Chart 2: Expenses by Category
  const expenseCategories = {
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

  expenses.forEach((e) => {
    const cat = e.category as keyof typeof expenseCategories;
    if (expenseCategories[cat]) {
      expenseCategories[cat].value += Number(e.amount);
    } else if (expenseCategories.other) {
      expenseCategories.other.value += Number(e.amount);
    }
  });

  const expenseChartData = Object.values(expenseCategories).filter((item) => item.value > 0);

  // Stock Alerts list: inventory items with quantity <= 3
  const lowStockItems = inventory
    .filter((item) => item.quantity <= 3)
    .map((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      return {
        id: `${item.product_id}-${item.size}`,
        title: prod ? prod.title : "Unknown Product",
        size: item.size,
        quantity: item.quantity,
      };
    })
    .slice(0, 5);

  const recentOrders = [...orders].reverse().slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Here is what is happening with your store today.</p>
      </div>

      {/* Delivered Revenue Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={20} className="text-emerald-200" />
              <span className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Delivered Revenue</span>
            </div>
            <p className="text-4xl font-bold text-white">{deliveredRevenue.toLocaleString()} <span className="text-xl font-medium text-emerald-200">EGP</span></p>
            <p className="text-emerald-200 text-sm mt-1">Cash collected from delivered orders only</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{deliveredOrders.length}</p>
              <p className="text-emerald-200 text-[11px] font-semibold uppercase tracking-wider mt-1">Delivered Orders</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{avgDeliveredOrder.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-emerald-200 text-[11px] font-semibold uppercase tracking-wider mt-1">Avg. Order (EGP)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</h3>
            <DollarSign size={18} className="text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-black">{totalRevenue.toLocaleString()} EGP</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Expenses</h3>
            <TrendingDown size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">{totalExpenses.toLocaleString()} EGP</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Profit</h3>
            <TrendingUp size={18} className={netProfit >= 0 ? "text-emerald-400" : "text-red-400"} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {netProfit.toLocaleString()} EGP
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Profit Margin</h3>
            <Percent size={18} className="text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-black">{profitMargin.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Operational KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</h3>
            <ShoppingCart size={18} className="text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-black">{orders.length}</p>
            <span className="text-[10px] text-gray-400 font-medium">Includes {orders.filter(o => o.status === 'cancelled').length} cancelled & {orders.filter(o => o.status === 'returned').length} returned</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Products</h3>
            <Package size={18} className="text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-black">{productCount}</p>
            <span className="text-[10px] text-gray-400 font-medium">Catalog collection total</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Customers</h3>
            <Users size={18} className="text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-black">{uniqueCustomers}</p>
            <span className="text-[10px] text-gray-400 font-medium">Unique purchase entities</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Stream */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-black mb-6">Revenue Stream</h3>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="Revenue" stroke="#000000" strokeWidth={2} fill="#000000" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                No revenue data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Expenses Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-black mb-6">Expenses Breakdown by Category</h3>
          <div className="h-[300px] w-full">
            {expenseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                No expenses logged yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operational Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : order.status === 'returned' ? 'bg-rose-100 text-rose-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No orders found.
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <h3 className="font-semibold text-black mb-6">Low Stock Warnings</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-b-gray-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-black text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">Size: {item.size}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg border ${item.quantity === 0 ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {item.quantity === 0 ? 'Out of Stock' : `${item.quantity} Left`}
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
