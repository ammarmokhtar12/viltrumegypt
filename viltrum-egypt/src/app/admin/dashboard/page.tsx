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
  pending: { label: "Pending", cssClass: "status-pending", icon: Clock },
  confirmed: { label: "Confirmed", cssClass: "status-confirmed", icon: CheckCircle },
  shipped: { label: "Shipped", cssClass: "status-shipped", icon: Truck },
  delivered: { label: "Delivered", cssClass: "status-delivered", icon: PackageCheck },
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

  const updateStatus = async (orderId: string, newStatus: Order["status"]) => {
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
          <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
          <span className="text-[11px] tracking-[0.25em] text-zinc-400 uppercase font-semibold">
            Loading orders
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-zinc-900 tracking-wide">
            Orders
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {orders.length} total · {pendingCount} pending
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 border border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 transition-all rounded-sm"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: orders.length, color: "text-zinc-900" },
          { label: "Pending", value: pendingCount, color: "text-amber-600" },
          { label: "Revenue", value: `EGP ${totalRevenue.toFixed(0)}`, color: "text-zinc-900" },
          { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length, color: "text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-zinc-100 p-5 rounded-sm">
            <p className="text-[10px] tracking-[0.25em] text-zinc-400 uppercase font-semibold">
              {stat.label}
            </p>
            <p className={`text-2xl font-display mt-2 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="text-center py-24 bg-white border border-zinc-100 rounded-sm">
          <ShoppingCart size={36} className="mx-auto text-zinc-200 mb-5" />
          <h2 className="text-lg font-display text-zinc-400">No orders yet</h2>
          <p className="text-sm text-zinc-300 mt-2">
            Orders will appear here once customers place them.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-100 rounded-sm overflow-hidden">
          {/* Desktop Table */}
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
                      <tr
                        key={order.id}
                        className="cursor-pointer hover:bg-zinc-50 transition-colors"
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      >
                        <td>
                          <span className="font-display font-bold text-zinc-900">
                            #{order.order_number}
                          </span>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-zinc-900 text-sm">
                              {order.customer_name}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {order.customer_phone}
                            </p>
                          </div>
                        </td>
                        <td>
                          <span className="font-display font-bold text-zinc-900">
                            EGP {order.total}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-zinc-500">
                            {order.payment_method === "vodafone_cash"
                              ? "Vodafone Cash"
                              : "InstaPay"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${config.cssClass}`}>
                            <config.icon size={12} />
                            {config.label}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-zinc-400">
                            {new Date(order.created_at).toLocaleDateString(
                              "en-GB",
                              { day: "2-digit", month: "short" }
                            )}
                          </span>
                        </td>
                        <td>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-zinc-300" />
                          ) : (
                            <ChevronDown size={16} className="text-zinc-300" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${order.id}-details`}>
                          <td colSpan={7} className="!p-0">
                            <div className="p-6 space-y-5 bg-zinc-50 border-t border-zinc-100">
                              {/* Customer Info */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                  <Phone size={14} className="text-zinc-300 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                                      Phone
                                    </p>
                                    <p className="text-sm text-zinc-900 mt-0.5">
                                      {order.customer_phone}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <MapPin size={14} className="text-zinc-300 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                                      Address
                                    </p>
                                    <p className="text-sm text-zinc-900 mt-0.5">
                                      {order.customer_address}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Items */}
                              <div>
                                <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-3">
                                  Items
                                </p>
                                <div className="space-y-2">
                                  {items.map((item, i) => (
                                    <div
                                      key={i}
                                      className="flex justify-between items-center py-3 px-4 bg-white border border-zinc-100 rounded-sm"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-zinc-900">
                                          {item.title}
                                        </p>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                          Size: {item.size} × {item.quantity}
                                        </p>
                                      </div>
                                      <span className="text-sm font-display font-bold text-zinc-900">
                                        EGP {item.price * item.quantity}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                                {order.payment_screenshot_url && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setScreenshotModal(order.payment_screenshot_url);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 border border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 transition-all rounded-sm"
                                  >
                                    <ImageIcon size={14} />
                                    View Screenshot
                                  </button>
                                )}

                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider mr-1">
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
                                        className={`px-3 py-1.5 text-[11px] font-semibold rounded-sm transition-all duration-300 ${
                                          order.status === status
                                            ? sc.cssClass
                                            : "text-zinc-400 bg-white border border-zinc-200 hover:border-zinc-400"
                                        }`}
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
          <div className="md:hidden divide-y divide-zinc-100">
            {orders.map((order) => {
              const config = STATUS_CONFIG[order.status];
              const isExpanded = expandedOrder === order.id;
              const items = Array.isArray(order.items) ? order.items : [];

              return (
                <div key={order.id}>
                  <div
                    className="p-4 cursor-pointer active:bg-zinc-50"
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-zinc-900">
                              #{order.order_number}
                            </span>
                            <span className={`status-badge text-[10px] ${config.cssClass}`}>
                              {config.label}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 truncate">
                            {order.customer_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-display font-bold text-zinc-900 text-sm">
                          EGP {order.total}
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-zinc-300" />
                        ) : (
                          <ChevronDown size={16} className="text-zinc-300" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-5 space-y-4 bg-zinc-50">
                      <div className="flex items-start gap-2 text-xs text-zinc-500">
                        <Phone size={12} className="mt-0.5" />
                        {order.customer_phone}
                      </div>
                      <div className="flex items-start gap-2 text-xs text-zinc-500">
                        <MapPin size={12} className="mt-0.5" />
                        {order.customer_address}
                      </div>

                      <div className="space-y-2">
                        {items.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-xs py-2 px-3 bg-white border border-zinc-100 rounded-sm"
                          >
                            <span className="text-zinc-900">
                              {item.title} ({item.size}) ×{item.quantity}
                            </span>
                            <span className="text-zinc-500 font-semibold">
                              EGP {item.price * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.payment_screenshot_url && (
                        <button
                          onClick={() =>
                            setScreenshotModal(order.payment_screenshot_url)
                          }
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 border border-zinc-200 hover:border-zinc-400 transition-all rounded-sm"
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
                              className={`flex-1 py-2 text-[10px] font-semibold rounded-sm transition-all ${
                                order.status === status
                                  ? sc.cssClass
                                  : "text-zinc-400 bg-white border border-zinc-200"
                              }`}
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
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setScreenshotModal(null)}
        >
          <div
            className="bg-white max-w-lg w-full overflow-hidden rounded-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h3 className="font-display text-sm tracking-wide text-zinc-900">
                Payment Screenshot
              </h3>
              <button
                onClick={() => setScreenshotModal(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <img
                src={screenshotModal}
                alt="Payment proof"
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
