/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Percent,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  Clock,
  Download,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

export default function AdminAffiliatesPage() {
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"influencers" | "commissions">("influencers");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    coupon_code: "",
    commission_percent: 5,
    status: "active",
    password: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch influencers
      const { data: infData, error: infError } = await supabase
        .from("influencers")
        .select("*")
        .order("created_at", { ascending: false });

      if (infError) throw infError;

      // Fetch commissions along with order data
      const { data: commData, error: commError } = await supabase
        .from("commissions")
        .select("*, order:orders(*)")
        .order("created_at", { ascending: false });

      if (commError) throw commError;

      setInfluencers(infData || []);
      setCommissions(commData || []);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      toast.error(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = formData.coupon_code.trim().toUpperCase();
      
      const { data, error } = await supabase
        .from("influencers")
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          coupon_code: code,
          commission_percent: Number(formData.commission_percent),
          status: formData.status,
          password: formData.password.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setInfluencers((prev) => [data, ...prev]);
      setIsAddModalOpen(false);
      resetForm();
      toast.success("Influencer created successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message}. Ensure email and coupon code are unique.`);
    }
  };

  const handleUpdateInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInfluencer) return;
    try {
      const code = formData.coupon_code.trim().toUpperCase();

      const { data, error } = await supabase
        .from("influencers")
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          coupon_code: code,
          commission_percent: Number(formData.commission_percent),
          status: formData.status,
          password: formData.password.trim(),
        })
        .eq("id", selectedInfluencer.id)
        .select()
        .single();

      if (error) throw error;

      setInfluencers((prev) =>
        prev.map((item) => (item.id === selectedInfluencer.id ? data : item))
      );
      setIsEditModalOpen(false);
      resetForm();
      toast.success("Influencer updated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleDeleteInfluencer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this influencer? This will also delete all associated commissions.")) return;
    try {
      const { error } = await supabase.from("influencers").delete().eq("id", id);
      if (error) throw error;
      setInfluencers((prev) => prev.filter((item) => item.id !== id));
      setCommissions((prev) => prev.filter((c) => c.influencer_id !== id));
      toast.success("Influencer deleted.");
    } catch (err: any) {
      console.error(err);
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const handleApproveInfluencerDirect = async (influencer: any) => {
    try {
      const { data, error } = await supabase
        .from("influencers")
        .update({ status: "active" })
        .eq("id", influencer.id)
        .select()
        .single();

      if (error) throw error;

      setInfluencers((prev) =>
        prev.map((item) => (item.id === influencer.id ? data : item))
      );
      toast.success(`Approved and activated coupon code ${influencer.coupon_code}!`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Approval failed: ${err.message}`);
    }
  };

  const handleToggleStatus = async (influencer: any) => {
    const newStatus = influencer.status === "active" ? "disabled" : "active";
    try {
      const { data, error } = await supabase
        .from("influencers")
        .update({ status: newStatus })
        .eq("id", influencer.id)
        .select()
        .single();

      if (error) throw error;

      setInfluencers((prev) =>
        prev.map((item) => (item.id === influencer.id ? data : item))
      );
      toast.success(`Coupon code ${influencer.coupon_code} is now ${newStatus}`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to toggle status: ${err.message}`);
    }
  };

  const handleApproveCommission = async (id: string) => {
    try {
      const { error } = await supabase
        .from("commissions")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setCommissions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "approved" } : c))
      );
      toast.success("Commission approved successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Approval failed: ${err.message}`);
    }
  };

  const handlePayCommission = async (id: string) => {
    try {
      const { error } = await supabase
        .from("commissions")
        .update({ 
          status: "paid", 
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      setCommissions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "paid", paid_at: new Date().toISOString() } : c))
      );
      toast.success("Commission marked as paid!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Payment updates failed: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    if (commissions.length === 0) {
      toast.error("No commissions to export.");
      return;
    }
    const headers = [
      "Order Number",
      "Coupon Code",
      "Customer",
      "Order Date",
      "Order Net Total (EGP)",
      "Commission Rate",
      "Commission Paid (EGP)",
      "Status",
      "Paid Date",
    ];

    const rows = commissions.map((c) => [
      c.order_number,
      c.coupon_code,
      c.order?.customer_name || "N/A",
      new Date(c.created_at).toLocaleDateString("en-GB"),
      c.net_amount,
      `${c.commission_percent}%`,
      c.commission_amount,
      c.status,
      c.paid_at ? new Date(c.paid_at).toLocaleDateString("en-GB") : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `commissions_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported successfully!");
  };

  const openEditModal = (influencer: any) => {
    setSelectedInfluencer(influencer);
    setFormData({
      name: influencer.name,
      email: influencer.email,
      phone: influencer.phone,
      coupon_code: influencer.coupon_code,
      commission_percent: Number(influencer.commission_percent),
      status: influencer.status,
      password: influencer.password || "",
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      coupon_code: "",
      commission_percent: 5,
      status: "active",
      password: "",
    });
    setSelectedInfluencer(null);
  };

  const generateRandomCoupon = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    setFormData((prev) => ({ ...prev, coupon_code: code }));
  };

  // Helper calculation functions for metrics
  const getInfluencerStats = (infId: string) => {
    const infComms = commissions.filter((c) => c.influencer_id === infId);
    const totalSales = infComms
      .filter((c) => c.status !== "cancelled")
      .reduce((sum, c) => sum + Number(c.net_amount), 0);
    const totalOrders = infComms.length;

    const pending = infComms
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + Number(c.commission_amount), 0);

    const approved = infComms
      .filter((c) => c.status === "approved")
      .reduce((sum, c) => sum + Number(c.commission_amount), 0);

    const paid = infComms
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.commission_amount), 0);

    return { totalSales, totalOrders, pending, approved, paid };
  };

  // Filtered lists
  const filteredInfluencers = influencers.filter((inf) => {
    const matchesSearch =
      inf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inf.coupon_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inf.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || inf.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredCommissions = commissions.filter((c) => {
    const customerName = c.order?.customer_name || "";
    const matchesSearch =
      c.coupon_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.order_number.toString().includes(searchQuery) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Global KPI Metrics
  const totalRevenueGenerated = commissions
    .filter((c) => c.status !== "cancelled")
    .reduce((sum, c) => sum + Number(c.net_amount), 0);

  const totalCommissionsPending = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);

  const totalCommissionsApproved = commissions
    .filter((c) => c.status === "approved")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);

  const totalCommissionsPaid = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);

  // Charts data aggregation
  // Chart 1: Top Influencers by Sales
  const topInfluencersMap: Record<string, number> = {};
  commissions.forEach((c) => {
    if (c.status === "cancelled") return;
    topInfluencersMap[c.coupon_code] = (topInfluencersMap[c.coupon_code] || 0) + Number(c.net_amount);
  });

  const topInfluencersData = Object.entries(topInfluencersMap)
    .map(([code, sales]) => ({ name: code, Sales: sales }))
    .sort((a, b) => b.Sales - a.Sales)
    .slice(0, 5);

  // Chart 2: Coupon Usage (Total orders)
  const couponUsageMap: Record<string, number> = {};
  commissions.forEach((c) => {
    couponUsageMap[c.coupon_code] = (couponUsageMap[c.coupon_code] || 0) + 1;
  });

  const couponUsageData = Object.entries(couponUsageMap)
    .map(([code, count]) => ({ name: code, Orders: count }))
    .sort((a, b) => b.Orders - a.Orders)
    .slice(0, 5);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Coupon code copied to clipboard!");
  };

  // Check if a commission is past the 14-day window
  const getCommissionReturnStatus = (comm: any) => {
    if (comm.order?.status !== "delivered") {
      return { label: "Not Delivered", class: "text-amber-500 bg-amber-500/10 border-amber-500/20", approvable: false };
    }
    if (!comm.order?.delivered_at) {
      return { label: "Delivery Date Unknown", class: "text-amber-500 bg-amber-500/10 border-amber-500/20", approvable: true };
    }

    const deliveredDate = new Date(comm.order.delivered_at);
    const diffTime = new Date().getTime() - deliveredDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 14) {
      return {
        label: `Return Period (${diffDays}/14 Days)`,
        class: "text-amber-600 bg-amber-500/5 border-amber-500/10",
        approvable: false
      };
    }

    return {
      label: "Passed Return window",
      class: "text-emerald-600 bg-emerald-500/5 border-emerald-500/10",
      approvable: true
    };
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Affiliates & Coupons</h1>
          <p className="text-gray-500 text-sm mt-1">Manage influencers, custom discount codes, and payout processes.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-neutral-900/5"
          >
            <Plus size={16} /> Add Influencer
          </button>
        </div>
      </div>

      {/* Global Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Influencers</h3>
            <Users size={16} className="text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-black">{influencers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sales</h3>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalRevenueGenerated.toLocaleString()} EGP</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Commissions Paid</h3>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-700">{totalCommissionsPaid.toLocaleString()} EGP</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approved Commissions</h3>
            <Clock size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalCommissionsApproved.toLocaleString()} EGP</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Commissions</h3>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{totalCommissionsPending.toLocaleString()} EGP</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab("influencers");
            setSearchQuery("");
          }}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === "influencers"
              ? "border-black text-black"
              : "border-transparent text-gray-400 hover:text-black"
          }`}
        >
          Influencers ({influencers.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("commissions");
            setSearchQuery("");
          }}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === "commissions"
              ? "border-black text-black"
              : "border-transparent text-gray-400 hover:text-black"
          }`}
        >
          Commissions ({commissions.length})
        </button>
      </div>

      {/* Control Panel (Search and Filters) */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={
              activeTab === "influencers"
                ? "Search by name, email, or code..."
                : "Search by coupon, customer name, or order #..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-all outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg py-2 px-4 text-sm bg-gray-50 outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          {activeTab === "influencers" ? (
            <>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="disabled">Disabled</option>
            </>
          ) : (
            <>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </>
          )}
        </select>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center py-20 bg-white border border-gray-200 rounded-xl">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full" />
        </div>
      ) : activeTab === "influencers" ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">Name & Contact</th>
                  <th className="px-6 py-4">Coupon Code</th>
                  <th className="px-6 py-4">Commission Rate</th>
                  <th className="px-6 py-4 text-right">Orders Generated</th>
                  <th className="px-6 py-4 text-right">Sales Volume</th>
                  <th className="px-6 py-4 text-right">Comm. (Pending / Appr. / Paid)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredInfluencers.length > 0 ? (
                  filteredInfluencers.map((inf) => {
                    const stats = getInfluencerStats(inf.id);
                    return (
                      <tr key={inf.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-black">{inf.name}</p>
                          <p className="text-xs text-gray-500">{inf.email}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{inf.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded text-xs">
                              {inf.coupon_code}
                            </span>
                            <button
                              onClick={() => copyToClipboard(inf.coupon_code)}
                              className="text-gray-400 hover:text-black cursor-pointer"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-black font-medium">{inf.commission_percent}%</td>
                        <td className="px-6 py-4 text-right text-black font-semibold">{stats.totalOrders}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">{stats.totalSales.toLocaleString()} EGP</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-amber-600 font-medium">{Math.round(stats.pending)}</span>
                          <span className="text-gray-300 mx-1.5">/</span>
                          <span className="text-blue-600 font-medium">{Math.round(stats.approved)}</span>
                          <span className="text-gray-300 mx-1.5">/</span>
                          <span className="text-emerald-600 font-bold">{Math.round(stats.paid)}</span>
                          <span className="text-xs text-gray-400 ml-1">EGP</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            onClick={() => handleToggleStatus(inf)}
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer transition-colors border ${
                              inf.status === "active"
                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                : inf.status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            }`}
                          >
                            {inf.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {inf.status === "pending" && (
                            <button
                              onClick={() => handleApproveInfluencerDirect(inf)}
                              className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm"
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(inf)}
                            className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteInfluencer(inf.id)}
                            className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400 bg-white">
                      No influencers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">Order Details</th>
                  <th className="px-6 py-4">Coupon & Influencer</th>
                  <th className="px-6 py-4">Order Net (EGP)</th>
                  <th className="px-6 py-4">Comm. Rate</th>
                  <th className="px-6 py-4">Comm. Amount</th>
                  <th className="px-6 py-4">Order Status</th>
                  <th className="px-6 py-4">Comms Status</th>
                  <th className="px-6 py-4">Return Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredCommissions.length > 0 ? (
                  filteredCommissions.map((comm) => {
                    const retStatus = getCommissionReturnStatus(comm);
                    return (
                      <tr key={comm.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-black">#{comm.order_number}</p>
                          <p className="text-[11px] text-gray-400">{new Date(comm.created_at).toLocaleDateString("en-GB")}</p>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">Cust: {comm.order?.customer_name || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded text-xs">
                            {comm.coupon_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-black font-semibold">{Number(comm.net_amount).toLocaleString()} EGP</td>
                        <td className="px-6 py-4 text-gray-500">{comm.commission_percent}%</td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">{Number(comm.commission_amount).toLocaleString()} EGP</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                            comm.order?.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : comm.order?.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {comm.order?.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full ${
                            comm.status === "paid"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : comm.status === "approved"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : comm.status === "cancelled"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {comm.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded border ${retStatus.class}`}>
                            {retStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {comm.status === "pending" && comm.order?.status !== "cancelled" && (
                            <button
                              onClick={() => handleApproveCommission(comm.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
                            >
                              Approve
                            </button>
                          )}
                          {comm.status === "approved" && (
                            <button
                              onClick={() => handlePayCommission(comm.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400 bg-white">
                      No commissions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-black mb-6">Top Influencers by Sales Volume</h3>
            <div className="h-[250px] w-full">
              {topInfluencersData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topInfluencersData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} formatter={(val) => [`${Number(val).toLocaleString()} EGP`, "Sales"]} />
                    <Bar dataKey="Sales" fill="#000000" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No sales volume details to chart.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-black mb-6">Top Performing Coupons (Usage Count)</h3>
            <div className="h-[250px] w-full">
              {couponUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={couponUsageData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} formatter={(val) => [val, "Orders"]} />
                    <Bar dataKey="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No coupon usage data to chart.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Influencer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-lg font-bold text-black">Add New Influencer</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-black cursor-pointer text-xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateInfluencer} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmed Ali"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="viltrum-input"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="viltrum-input"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="viltrum-input"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. AHMED"
                    value={formData.coupon_code}
                    onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value })}
                    className="viltrum-input flex-1 uppercase"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCoupon}
                    className="px-3 border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                  >
                    Random
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Commission Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={formData.commission_percent}
                  onChange={(e) => setFormData({ ...formData, commission_percent: Number(e.target.value) })}
                  className="viltrum-input"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm focus:bg-white outline-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Password (كلمة المرور للداشبورد)</label>
                <input
                  type="password"
                  placeholder="اتركه فارغ لو مفيش"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="viltrum-input"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-black hover:bg-neutral-800 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer"
                >
                  Create Influencer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Influencer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-lg font-bold text-black">Edit Influencer</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-black cursor-pointer text-xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateInfluencer} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmed Ali"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="viltrum-input"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="viltrum-input"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="viltrum-input"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AHMED"
                  value={formData.coupon_code}
                  onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value })}
                  className="viltrum-input uppercase"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Commission Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={formData.commission_percent}
                  onChange={(e) => setFormData({ ...formData, commission_percent: Number(e.target.value) })}
                  className="viltrum-input"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm focus:bg-white outline-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Password (كلمة المرور للداشبورد)</label>
                <input
                  type="password"
                  placeholder="اتركه فارغ لو مفيش"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="viltrum-input"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/2 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-black hover:bg-neutral-800 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
