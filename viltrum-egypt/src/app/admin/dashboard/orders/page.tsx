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
  ChevronDown,
  ChevronUp,
  Search,
  XCircle,
  DollarSign,
  User,
  ArrowRight,
  ExternalLink,
  ShoppingCart,
  Trash2,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500", icon: Clock },
  confirmed: { label: "Confirmed", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-500", icon: CheckCircle },
  shipped: { label: "Shipped", bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-500", icon: Truck },
  delivered: { label: "Delivered", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500", icon: PackageCheck },
  cancelled: { label: "Cancelled", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-500", icon: XCircle },
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
          <div className="w-8 h-8 border-2 border-border-light border-t-foreground rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.25em] text-muted uppercase font-bold">
            Ingesting Orders
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 pb-4">
        <div>
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] block mb-2">Operations</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground border-l-4 border-primary pl-6 leading-none">
            Orders
          </h1>
          <p className="text-secondary text-sm font-medium mt-4 italic">Monitor and manage global customer transactions.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="btn-outline flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Sync Data
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         {[
           { label: "Total Flow", value: orders.length, color: "text-foreground" },
           { label: "Critical (Pending)", value: pendingCount, color: "text-amber-500" },
           { label: "Total Volume", value: `${orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()} EGP`, color: "text-foreground" },
           { label: "Fulfillment", value: `${orders.length > 0 ? ((orders.filter(o => o.status === 'delivered').length / orders.length) * 100).toFixed(0) : 0}%`, color: "text-emerald-500" },
         ].map((s, i) => (
           <div key={i} className="bg-surface border border-border-light p-6 rounded-2xl">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">{s.label}</p>
              <p className={`text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
           </div>
         ))}
      </div>

      {/* Control Strip */}
      <div className="flex flex-col lg:flex-row gap-5 items-center">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search identity, phone or order code..."
            className="viltrum-input pl-11 !min-h-[2.75rem]"
          />
        </div>
        <div className="flex gap-2 p-1 bg-surface border border-border-light rounded-xl overflow-x-auto w-full lg:w-auto">
          {["all", "pending", "confirmed", "shipped", "delivered"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
                statusFilter === s
                  ? "bg-primary text-white shadow-md shadow-primary/10"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {s} ({s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid/Table */}
      {filteredOrders.length === 0 ? (
        <div className="py-32 text-center bg-surface border border-border-light rounded-[2.5rem]">
           <ShoppingCart size={40} className="mx-auto text-muted opacity-20 mb-4" />
           <p className="text-sm font-bold text-muted tracking-widest uppercase italic">Transaction log is clean</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedOrder === order.id;
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <div 
                key={order.id} 
                className={`bg-surface border rounded-[1.5rem] transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'border-primary shadow-xl ring-1 ring-primary/5' : 'border-border-light hover:border-secondary shadow-sm'
                }`}
              >
                {/* Visual Strip */}
                <div 
                  className="px-6 py-5 flex items-center justify-between cursor-pointer group"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-6 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-background border border-border-light flex-shrink-0 flex items-center justify-center text-sm font-bold text-foreground shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                      {order.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-foreground text-lg tracking-tight">
                          #{order.order_number}
                        </span>
                        <div className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${config.bg} ${config.text} ${config.border}`}>
                          {config.label}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-muted mt-1 truncate uppercase tracking-widest">
                        {order.customer_name} · {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                       <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Grand Total</p>
                       <p className="text-lg font-bold text-foreground leading-none mt-1">{order.total.toLocaleString()} <span className="text-xs opacity-50">EGP</span></p>
                    </div>
                    <div className="p-2 rounded-xl bg-background border border-border-light text-muted group-hover:text-primary transition-all">
                       {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Content Reveal */}
                {isExpanded && (
                  <div className="px-8 pb-8 pt-4 border-t border-border-light animate-in slide-in-from-top-2 duration-300 bg-background/30">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      
                      {/* Technical Info */}
                      <div className="lg:col-span-4 space-y-6">
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.25em]">Customer Coordinates</h4>
                            
                            <div className="p-4 bg-background border border-border-light rounded-2xl space-y-4">
                               <div className="flex items-start gap-4">
                                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted"><Phone size={14} /></div>
                                  <div>
                                     <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Voice/Data</p>
                                     <p className="text-sm font-bold text-foreground mt-0.5">{order.customer_phone}</p>
                                  </div>
                               </div>
                               <div className="flex items-start gap-4">
                                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted"><MapPin size={14} /></div>
                                  <div>
                                     <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Physical Location</p>
                                     <p className="text-sm font-bold text-foreground mt-0.5 leading-relaxed">{order.customer_address}</p>
                                  </div>
                               </div>
                               <div className="flex items-start gap-4">
                                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted"><DollarSign size={14} /></div>
                                  <div>
                                     <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Payment Protocol</p>
                                     <p className="text-sm font-bold text-foreground mt-0.5 uppercase">{order.payment_method?.replace('_', ' ')}</p>
                                  </div>
                               </div>
                            </div>
                         </div>

                         {order.payment_screenshot_url && (
                           <button
                             onClick={() => setScreenshotModal(order.payment_screenshot_url)}
                             className="w-full p-4 bg-primary text-white rounded-2xl flex items-center justify-between group hover:opacity-90 transition-all font-bold text-xs uppercase tracking-widest"
                           >
                             <span>Verification Proof</span>
                             <ExternalLink size={14} />
                           </button>
                         )}
                      </div>

                      {/* Item Matrix */}
                      <div className="lg:col-span-8 space-y-6">
                        <div className="flex justify-between items-center">
                           <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.25em]">Unit Inventory ({items.length})</h4>
                           <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Order Hash: {order.id.split('-')[0]}</span>
                        </div>
                        
                        <div className="space-y-3">
                          {items.map((item, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center p-4 bg-surface border border-border-light rounded-2xl hover:border-secondary transition-all"
                            >
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center text-muted opacity-50"><PackageCheck size={18} /></div>
                                 <div>
                                   <p className="text-sm font-bold text-foreground leading-none">{item.title}</p>
                                   <p className="text-[10px] text-muted font-bold mt-1.5 uppercase tracking-widest">
                                     Size {item.size} · {item.quantity} Units
                                   </p>
                                 </div>
                              </div>
                              <span className="font-bold text-foreground">
                                {(item.price * item.quantity).toLocaleString()} <span className="text-[10px] opacity-40 ml-1">EGP</span>
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Status Management */}
                        <div className="pt-8 border-t border-border-light">
                           <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.25em] mb-5">Command Control</h4>
                           <div className="flex flex-wrap items-center gap-3">
                              {/* Workflow Actions */}
                              {order.status === "pending" && (
                                <button
                                  onClick={() => updateStatus(order.id, "confirmed")}
                                  className="h-12 px-6 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                                >
                                  <CheckCircle size={16} />
                                  Confirm Mission
                                </button>
                              )}
                              
                              {order.status === "confirmed" && (
                                <button
                                  onClick={() => updateStatus(order.id, "shipped")}
                                  className="h-12 px-6 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                                >
                                  <Truck size={16} />
                                  Commence Logistics
                                </button>
                              )}

                              {order.status === "shipped" && (
                                <button
                                  onClick={() => updateStatus(order.id, "delivered")}
                                  className="h-12 px-6 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                                >
                                  <PackageCheck size={16} />
                                  Confirm Delivery
                                </button>
                              )}

                              <div className="h-10 w-px bg-border-light mx-2"></div>

                              {/* Universal Toggles */}
                              <div className="flex gap-1.5 p-1 bg-background border border-border-light rounded-xl">
                                {STATUSES.map((status) => {
                                  const sc = STATUS_CONFIG[status];
                                  return (
                                    <button
                                      key={status}
                                      onClick={() => updateStatus(order.id, status)}
                                      className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                        order.status === status
                                          ? "bg-surface text-foreground shadow-sm ring-1 ring-border-light"
                                          : "text-muted hover:text-foreground"
                                      }`}
                                    >
                                      {sc.label}
                                    </button>
                                  );
                                })}
                              </div>

                              <button
                                onClick={async () => {
                                  if (confirm("Executing high-level purge. Confirm deletion of order data?")) {
                                    const { error } = await supabase.from("orders").delete().eq("id", order.id);
                                    if (!error) setOrders(orders.filter(o => o.id !== order.id));
                                  }
                                }}
                                className="h-10 w-10 flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-auto"
                                title="Purge Record"
                              >
                                <Trash2 size={16} />
                              </button>
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

      {/* Proof Modal */}
      {screenshotModal && (
        <div
          className="fixed inset-0 z-[110] bg-primary/40 backdrop-blur-xl flex items-center justify-center p-4 lg:p-10 animate-fade-in"
          onClick={() => setScreenshotModal(null)}
        >
          <div
            className="bg-background max-w-2xl w-full max-h-full overflow-y-auto rounded-3xl border border-secondary shadow-2xl scale-100 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 px-6 flex items-center justify-between border-b border-border-light sticky top-0 bg-background/80 backdrop-blur-md z-10">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Verification Protocol Image</h3>
              <button
                onClick={() => setScreenshotModal(null)}
                className="p-2 text-muted hover:text-foreground hover:bg-surface rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-8">
              <img src={screenshotModal} alt="Payment proof" className="w-full rounded-2xl shadow-lg border border-border-light" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
