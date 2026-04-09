"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types";
import {
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  Image as ImageIcon,
  Phone,
  MapPin,
  X,
  RefreshCw,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    cssClass: "status-pending",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    cssClass: "status-confirmed",
    icon: CheckCircle,
  },
  shipped: {
    label: "Shipped",
    cssClass: "status-shipped",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    cssClass: "status-delivered",
    icon: PackageCheck,
  },
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered"] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [screenshotModal, setScreenshotModal] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (!error) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-viltrum-red border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-[0.2em] text-viltrum-mist/30 uppercase">Loading orders</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-viltrum-white tracking-tight">Orders</h1>
          <p className="text-sm text-viltrum-mist/35 mt-1">
            {orders.length} total · {pendingCount} pending
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="admin-btn admin-btn-ghost"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: orders.length, color: "text-viltrum-white" },
          { label: "Pending", value: pendingCount, color: "text-yellow-400" },
          { label: "Revenue", value: `EGP ${totalRevenue.toFixed(0)}`, color: "text-viltrum-red" },
          { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length, color: "text-green-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-5 glass-card-static"
          >
            <p className="text-[10px] tracking-[0.2em] text-viltrum-mist/30 uppercase font-semibold">{stat.label}</p>
            <p className={`text-2xl font-display font-black mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="text-center py-24 glass-card-static rounded-2xl">
          <ShoppingCart size={40} className="mx-auto text-viltrum-mist/15 mb-5" />
          <h2 className="text-lg font-display font-bold text-viltrum-mist/40">No orders yet</h2>
          <p className="text-sm text-viltrum-mist/20 mt-2">
            Orders will appear here once customers place them.
          </p>
        </div>
      ) : (
        <div className="glass-card-static rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:block overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const config = STATUS_CONFIG[order.status];
                  const isExpanded = expandedOrder === order.id;
                  const items = Array.isArray(order.items) ? order.items : [];

                  return (
                    <>
                      <tr key={order.id} className="cursor-pointer" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                        <td>
                          <span className="font-display font-bold text-viltrum-white">
                            #{order.order_number}
                          </span>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-viltrum-white text-sm">{order.customer_name}</p>
                            <p className="text-xs text-viltrum-mist/30 mt-0.5">{order.customer_phone}</p>
                          </div>
                        </td>
                        <td>
                          <span className="font-display font-bold text-viltrum-white">
                            EGP {order.total}
                          </span>
                        </td>
                        <td>
                          <span className="text-[13px] text-viltrum-mist/50">
                            {order.payment_method === "vodafone_cash" ? "Vodafone Cash" : "InstaPay"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${config.cssClass}`}>
                            <config.icon size={12} />
                            {config.label}
                          </span>
                        </td>
                        <td>
                          <span className="text-[13px] text-viltrum-mist/35">
                            {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                          </span>
                        </td>
                        <td>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-viltrum-mist/30" />
                          ) : (
                            <ChevronDown size={16} className="text-viltrum-mist/30" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${order.id}-details`}>
                          <td colSpan={7} className="!p-0">
                            <div className="p-6 space-y-5" style={{ background: "rgba(178, 0, 0, 0.02)", borderTop: "1px solid rgba(240, 240, 240, 0.03)" }}>
                              {/* Customer Info */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                  <Phone size={14} className="text-viltrum-mist/25 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] text-viltrum-mist/25 uppercase tracking-wider">Phone</p>
                                    <p className="text-sm text-viltrum-white mt-0.5">{order.customer_phone}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <MapPin size={14} className="text-viltrum-mist/25 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] text-viltrum-mist/25 uppercase tracking-wider">Address</p>
                                    <p className="text-sm text-viltrum-white mt-0.5">{order.customer_address}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Items */}
                              <div>
                                <p className="text-[10px] text-viltrum-mist/25 uppercase tracking-wider mb-3">Items</p>
                                <div className="space-y-2">
                                  {items.map((item, i) => (
                                    <div
                                      key={i}
                                      className="flex justify-between items-center py-3 px-4 rounded-lg"
                                      style={{ background: "rgba(240, 240, 240, 0.02)" }}
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-viltrum-white">{item.title}</p>
                                        <p className="text-xs text-viltrum-mist/30 mt-0.5">
                                          Size: {item.size} × {item.quantity}
                                        </p>
                                      </div>
                                      <span className="text-sm font-display font-bold text-viltrum-white">
                                        EGP {item.price * item.quantity}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Actions Row */}
                              <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                                {/* Screenshot */}
                                {order.payment_screenshot_url && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setScreenshotModal(order.payment_screenshot_url);
                                    }}
                                    className="admin-btn admin-btn-ghost text-xs"
                                  >
                                    <ImageIcon size={14} />
                                    View Screenshot
                                  </button>
                                )}

                                {/* Status Update */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] text-viltrum-mist/25 uppercase tracking-wider mr-1">
                                    Update:
                                  </span>
                                  {STATUSES.map((status) => {
                                    const sc = STATUS_CONFIG[status];
                                    return (
                                      <button
                                        key={status}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateStatus(order.id, status);
                                        }}
                                        className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-300 ${
                                          order.status === status
                                            ? sc.cssClass
                                            : "text-viltrum-mist/25 hover:text-viltrum-mist/60"
                                        }`}
                                        style={
                                          order.status !== status
                                            ? { background: "rgba(240, 240, 240, 0.03)", border: "1px solid rgba(240, 240, 240, 0.05)" }
                                            : undefined
                                        }
                                      >
                                        {sc.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-viltrum-white/[0.03]">
            {orders.map((order) => {
              const config = STATUS_CONFIG[order.status];
              const isExpanded = expandedOrder === order.id;
              const items = Array.isArray(order.items) ? order.items : [];

              return (
                <div key={order.id}>
                  <div
                    className="p-4 cursor-pointer active:bg-viltrum-white/[0.02]"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-viltrum-white">
                              #{order.order_number}
                            </span>
                            <span className={`status-badge text-[10px] ${config.cssClass}`}>
                              {config.label}
                            </span>
                          </div>
                          <p className="text-xs text-viltrum-mist/30 mt-1 truncate">
                            {order.customer_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-display font-bold text-viltrum-white text-sm">
                          EGP {order.total}
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-viltrum-mist/25" />
                        ) : (
                          <ChevronDown size={16} className="text-viltrum-mist/25" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-5 space-y-4" style={{ background: "rgba(178, 0, 0, 0.02)" }}>
                      <div className="flex items-start gap-2 text-xs text-viltrum-mist/40">
                        <Phone size={12} className="mt-0.5" />
                        {order.customer_phone}
                      </div>
                      <div className="flex items-start gap-2 text-xs text-viltrum-mist/40">
                        <MapPin size={12} className="mt-0.5" />
                        {order.customer_address}
                      </div>

                      <div className="space-y-2">
                        {items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs py-2 px-3 rounded-lg" style={{ background: "rgba(240, 240, 240, 0.02)" }}>
                            <span className="text-viltrum-white">{item.title} ({item.size}) ×{item.quantity}</span>
                            <span className="text-viltrum-mist/50 font-semibold">EGP {item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {order.payment_screenshot_url && (
                        <button
                          onClick={() => setScreenshotModal(order.payment_screenshot_url)}
                          className="admin-btn admin-btn-ghost text-xs w-full"
                        >
                          <ImageIcon size={14} />
                          View Screenshot
                        </button>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {STATUSES.map((status) => {
                          const sc = STATUS_CONFIG[status];
                          return (
                            <button
                              key={status}
                              onClick={() => updateStatus(order.id, status)}
                              className={`flex-1 py-2 text-[10px] font-semibold rounded-lg transition-all ${
                                order.status === status ? sc.cssClass : "text-viltrum-mist/25"
                              }`}
                              style={
                                order.status !== status
                                  ? { background: "rgba(240, 240, 240, 0.03)", border: "1px solid rgba(240, 240, 240, 0.05)" }
                                  : undefined
                              }
                            >
                              {sc.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Screenshot Modal */}
      {screenshotModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setScreenshotModal(null)}>
          <div className="glass-card-static rounded-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(240, 240, 240, 0.05)" }}>
              <h3 className="font-display font-bold text-viltrum-white text-sm tracking-wide">
                Payment Screenshot
              </h3>
              <button
                onClick={() => setScreenshotModal(null)}
                className="p-1.5 rounded-lg text-viltrum-mist/40 hover:text-viltrum-white hover:bg-viltrum-white/5 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <img
                src={screenshotModal}
                alt="Payment proof"
                className="w-full rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
