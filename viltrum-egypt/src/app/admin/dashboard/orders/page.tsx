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
  Search,
  XCircle,
  DollarSign,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
  confirmed: { label: "Confirmed", bg: "bg-blue-50", text: "text-blue-700", icon: CheckCircle },
  shipped: { label: "Shipped", bg: "bg-purple-50", text: "text-purple-700", icon: Truck },
  delivered: { label: "Delivered", bg: "bg-emerald-50", text: "text-emerald-700", icon: PackageCheck },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-600", icon: XCircle },
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered"] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [screenshotModal, setScreenshotModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (!error) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_phone.includes(searchQuery) ||
      String(o.order_number).includes(searchQuery);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
          <span className="text-xs tracking-[0.2em] text-zinc-400 uppercase font-medium">
            Loading orders
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-zinc-900 tracking-wide">
            Orders
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {orders.length} total · {pendingCount} pending
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 h-10 px-4 text-[11px] font-semibold text-zinc-500 border border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 transition-all rounded-md"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or order #..."
            className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-zinc-400"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {["all", "pending", "confirmed", "shipped", "delivered"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`h-10 px-3.5 text-[11px] font-semibold capitalize border rounded-md whitespace-nowrap transition-all ${
                statusFilter === s
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
              }`}
            >
              {s === "all" ? `All (${orders.length})` : `${s} (${orders.filter((o) => o.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-zinc-100 rounded-lg">
          <ShoppingCart size={32} className="mx-auto text-zinc-200 mb-4" />
          <p className="text-sm text-zinc-400">
            {searchQuery ? "No orders match your search" : "No orders yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedOrder === order.id;
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <div key={order.id} className="bg-white border border-zinc-100 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                {/* Order Header Row */}
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50/50 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Customer Avatar */}
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex-shrink-0 flex items-center justify-center text-sm font-display font-bold text-zinc-500">
                      {order.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-display font-bold text-zinc-900">
                          #{order.order_number}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${config.bg} ${config.text}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-zinc-400 mt-0.5 truncate">
                        {order.customer_name} · {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="font-display font-bold text-zinc-900 text-base">
                      EGP {order.total}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-zinc-300" />
                    ) : (
                      <ChevronDown size={16} className="text-zinc-300" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-zinc-100">
                    <div className="p-5 space-y-5">
                      {/* Customer Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3 bg-zinc-50 rounded-lg p-3.5">
                          <Phone size={14} className="text-zinc-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Phone</p>
                            <p className="text-sm text-zinc-900 mt-0.5">{order.customer_phone}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-zinc-50 rounded-lg p-3.5">
                          <MapPin size={14} className="text-zinc-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Address</p>
                            <p className="text-sm text-zinc-900 mt-0.5">{order.customer_address}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-zinc-50 rounded-lg p-3.5">
                          <DollarSign size={14} className="text-zinc-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Payment</p>
                            <p className="text-sm text-zinc-900 mt-0.5">
                              {order.payment_method === "vodafone_cash" ? "Vodafone Cash" : "InstaPay"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-3">
                          Order Items ({items.length})
                        </p>
                        <div className="space-y-2">
                          {items.map((item, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center py-2.5 px-4 bg-zinc-50 rounded-lg"
                            >
                              <div>
                                <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                                <p className="text-[11px] text-zinc-400 mt-0.5">
                                  Size: {item.size} · Qty: {item.quantity}
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-zinc-100">
                        {/* Screenshot */}
                        <div className="flex gap-2">
                          {order.payment_screenshot_url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setScreenshotModal(order.payment_screenshot_url);
                              }}
                              className="inline-flex items-center gap-2 h-9 px-4 text-[11px] font-semibold text-zinc-500 border border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 transition-all rounded-md"
                            >
                              <ImageIcon size={13} />
                              Payment Proof
                            </button>
                          )}
                        </div>

                        {/* Status Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Quick Actions */}
                          {order.status === "pending" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(order.id, "confirmed");
                                }}
                                className="h-9 px-4 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors inline-flex items-center gap-1.5"
                              >
                                <CheckCircle size={13} />
                                Confirm Order
                              </button>
                            </>
                          )}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to COMPLETELY DELETE this order? This cannot be undone.")) {
                                const { error } = await supabase.from("orders").delete().eq("id", order.id);
                                if (!error) {
                                  setOrders(orders.filter(o => o.id !== order.id));
                                } else {
                                  alert("Failed to delete order.");
                                }
                              }
                            }}
                            className="h-9 px-4 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-md transition-colors inline-flex items-center gap-1.5"
                          >
                            <XCircle size={13} />
                            Delete
                          </button>
                          {order.status === "confirmed" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(order.id, "shipped");
                              }}
                              className="h-9 px-4 text-[11px] font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors inline-flex items-center gap-1.5"
                            >
                              <Truck size={13} />
                              Mark Shipped
                            </button>
                          )}
                          {order.status === "shipped" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(order.id, "delivered");
                              }}
                              className="h-9 px-4 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors inline-flex items-center gap-1.5"
                            >
                              <PackageCheck size={13} />
                              Mark Delivered
                            </button>
                          )}

                          {/* All status buttons */}
                          <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-zinc-100">
                            {STATUSES.map((status) => {
                              const sc = STATUS_CONFIG[status];
                              return (
                                <button
                                  key={status}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(order.id, status);
                                  }}
                                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                                    order.status === status
                                      ? `${sc.bg} ${sc.text}`
                                      : "text-zinc-300 hover:text-zinc-500"
                                  }`}
                                >
                                  {sc.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Modal */}
      {screenshotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setScreenshotModal(null)}
        >
          <div
            className="bg-white max-w-lg w-full overflow-hidden rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <h3 className="font-display text-sm text-zinc-900">Payment Screenshot</h3>
              <button
                onClick={() => setScreenshotModal(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <img src={screenshotModal} alt="Payment proof" className="w-full rounded-md" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
