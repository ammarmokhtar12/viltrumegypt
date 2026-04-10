"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Eye,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [ordersRes, productsRes] = await Promise.all([
          supabase.from("orders").select("*").order("created_at", { ascending: false }),
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
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
          <span className="text-xs tracking-[0.2em] text-zinc-400 uppercase font-medium">
            Loading dashboard
          </span>
        </div>
      </div>
    );
  }

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const shippedOrders = orders.filter((o) => o.status === "shipped");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const uniqueCustomers = new Set(orders.map((o) => o.customer_phone)).size;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Recent orders (last 5)
  const recentOrders = orders.slice(0, 5);

  // Revenue by status
  const revenueByStatus = {
    pending: pendingOrders.reduce((s, o) => s + o.total, 0),
    confirmed: confirmedOrders.reduce((s, o) => s + o.total, 0),
    shipped: shippedOrders.reduce((s, o) => s + o.total, 0),
    delivered: deliveredOrders.reduce((s, o) => s + o.total, 0),
  };

  const statusColors = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-400" },
    confirmed: { bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-400" },
    shipped: { bg: "bg-purple-50", text: "text-purple-700", bar: "bg-purple-400" },
    delivered: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-400" },
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-zinc-900 tracking-wide">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Welcome back. Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-zinc-100 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <ArrowUpRight size={12} />
              Revenue
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-zinc-900">
            {totalRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 font-medium">EGP Total Revenue</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-zinc-100 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShoppingCart size={18} className="text-blue-600" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
              <ArrowUpRight size={12} />
              Orders
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-zinc-900">
            {orders.length}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 font-medium">Total Orders</p>
        </div>

        {/* Customers */}
        <div className="bg-white border border-zinc-100 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Users size={18} className="text-violet-600" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600">
              <ArrowUpRight size={12} />
              Customers
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-zinc-900">
            {uniqueCustomers}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 font-medium">Unique Customers</p>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white border border-zinc-100 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-orange-600" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-500">
              Avg Value
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-zinc-900">
            {avgOrderValue.toFixed(0)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 font-medium">EGP / Order</p>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Breakdown */}
        <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg text-zinc-900">Order Pipeline</h3>
            <Link
              href="/admin/dashboard/orders"
              className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-wider"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {([
              { key: "pending", label: "Pending", icon: Clock, count: pendingOrders.length },
              { key: "confirmed", label: "Confirmed", icon: CheckCircle, count: confirmedOrders.length },
              { key: "shipped", label: "Shipped", icon: Truck, count: shippedOrders.length },
              { key: "delivered", label: "Delivered", icon: PackageCheck, count: deliveredOrders.length },
            ] as const).map((item) => {
              const colors = statusColors[item.key];
              return (
                <div key={item.key} className={`${colors.bg} rounded-lg p-4 text-center`}>
                  <item.icon size={20} className={`mx-auto ${colors.text} mb-2`} />
                  <p className={`text-2xl font-display font-bold ${colors.text}`}>
                    {item.count}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mt-1">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Revenue Bar Chart (CSS-only) */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-4">
              Revenue by Status
            </p>
            <div className="space-y-3">
              {(["delivered", "shipped", "confirmed", "pending"] as const).map((status) => {
                const colors = statusColors[status];
                const value = revenueByStatus[status];
                const maxValue = Math.max(...Object.values(revenueByStatus), 1);
                const width = (value / maxValue) * 100;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-zinc-500 w-20 capitalize">
                      {status}
                    </span>
                    <div className="flex-1 h-4 bg-zinc-50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.bar} rounded-full transition-all duration-1000`}
                        style={{ width: `${Math.max(width, 2)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-900 w-20 text-right">
                      EGP {value.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-6">
          {/* Products Card */}
          <div className="bg-white border border-zinc-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-zinc-900">Products</h3>
              <Link
                href="/admin/dashboard/products"
                className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-wider"
              >
                Manage →
              </Link>
            </div>
            <div className="flex items-end gap-4">
              <div className="w-14 h-14 rounded-lg bg-zinc-50 flex items-center justify-center">
                <Package size={24} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-zinc-900">{productCount}</p>
                <p className="text-[11px] text-zinc-400 font-medium">Total Products</p>
              </div>
            </div>
          </div>

          {/* Pending Actions Card */}
          {pendingOrders.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-800">Action Required</h3>
              </div>
              <p className="text-3xl font-display font-bold text-amber-700 mb-1">
                {pendingOrders.length}
              </p>
              <p className="text-[11px] text-amber-600 font-medium mb-4">
                Orders waiting for confirmation
              </p>
              <Link
                href="/admin/dashboard/orders"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-900 uppercase tracking-wider"
              >
                Review Now →
              </Link>
            </div>
          )}

          {/* Conversion Info */}
          <div className="bg-white border border-zinc-100 rounded-lg p-6">
            <h3 className="font-display text-lg text-zinc-900 mb-4">Fulfillment</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Completion Rate</span>
                <span className="text-sm font-semibold text-zinc-900">
                  {orders.length > 0
                    ? ((deliveredOrders.length / orders.length) * 100).toFixed(0)
                    : 0}%
                </span>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{
                    width: `${orders.length > 0 ? (deliveredOrders.length / orders.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>{deliveredOrders.length} delivered</span>
                <span>{orders.length} total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <h3 className="font-display text-lg text-zinc-900">Recent Orders</h3>
          <Link
            href="/admin/dashboard/orders"
            className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-wider"
          >
            View All →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart size={28} className="mx-auto text-zinc-200 mb-3" />
            <p className="text-sm text-zinc-400">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {recentOrders.map((order) => {
              const colors = statusColors[order.status];
              return (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-display font-bold text-zinc-500">
                      {order.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{order.customer_name}</p>
                      <p className="text-[11px] text-zinc-400">
                        #{order.order_number} · {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full ${colors.bg} ${colors.text}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-display font-bold text-zinc-900">
                      EGP {order.total}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
