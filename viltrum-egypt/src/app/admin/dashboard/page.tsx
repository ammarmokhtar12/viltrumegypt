"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types";
import { DollarSign, ShoppingCart, Users, Package, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [ordersRes, productsRes] = await Promise.all([
          supabase.from("orders").select("*").order("created_at", { ascending: true }),
          supabase.from("products").select("id", { count: "exact" }),
        ]);

        if (ordersRes.data) setOrders(ordersRes.data);
        if (productsRes.count !== null) setProductCount(productsRes.count);
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

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const uniqueCustomers = new Set(orders.map((o) => o.customer_phone)).size;

  const revenueDataMap = new Map();
  orders.forEach(o => {
    const date = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!revenueDataMap.has(date)) {
      revenueDataMap.set(date, { name: date, Revenue: 0 });
    }
    const current = revenueDataMap.get(date);
    current.Revenue += o.total;
  });
  const chartData = Array.from(revenueDataMap.values());

  const recentOrders = [...orders].reverse().slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Here is what is happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <DollarSign size={20} className="text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-black">{totalRevenue.toLocaleString()} EGP</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <ShoppingCart size={20} className="text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-black">{orders.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Active Products</h3>
            <Package size={20} className="text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-black">{productCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
            <Users size={20} className="text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-black">{uniqueCustomers}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-black">Revenue Stream</h3>
          </div>
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

        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <h3 className="font-semibold text-black mb-6">Recent Orders</h3>
          <div className="flex-1 overflow-y-auto pr-2">
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-black text-sm">{order.customer_name}</p>
                      <p className="text-xs text-gray-500 mt-1">#{order.order_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-black text-sm">{order.total.toLocaleString()} EGP</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
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
      </div>
    </div>
  );
}
