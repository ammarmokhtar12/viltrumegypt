/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Copy,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

export default function InfluencerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [influencer, setInfluencer] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchInfluencerData = async () => {
      try {
        // Support admin_preview query param for admin to view any influencer dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const adminPreviewCode = urlParams.get("admin_preview");

        // Read coupon code: admin preview takes priority over session
        const savedCode = adminPreviewCode || sessionStorage.getItem("influencer_code");

        if (!savedCode) {
          router.push("/influencer");
          return;
        }

        // Fetch influencer profile by coupon code
        // If admin preview, skip status check so we can view pending/disabled too
        let query = supabase
          .from("influencers")
          .select("*")
          .eq("coupon_code", savedCode);

        if (!adminPreviewCode) {
          query = query.eq("status", "active");
        }

        const { data: infData, error: infError } = await query.maybeSingle();

        if (infError) throw infError;

        if (!infData) {
          if (!adminPreviewCode) {
            sessionStorage.removeItem("influencer_code");
            router.push("/influencer");
          } else {
            toast.error("Influencer not found for this coupon code.");
          }
          return;
        }

        setInfluencer(infData);

        // Fetch commissions for this influencer
        const { data: commData, error: commError } = await supabase
          .from("commissions")
          .select("*, order:orders(*)")
          .eq("influencer_id", infData.id)
          .order("created_at", { ascending: false });

        if (commError) throw commError;

        setCommissions(commData || []);
      } catch (err: any) {
        console.error("Dashboard error:", err);
        toast.error("Error loading dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencerData();
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("influencer_code");
    router.push("/influencer");
  };

  const copyCouponCode = () => {
    if (!influencer) return;
    navigator.clipboard.writeText(influencer.coupon_code);
    toast.success("Coupon code copied!");
  };

  const copyReferralLink = () => {
    if (!influencer) return;
    const refLink = `${window.location.origin}/?ref=${influencer.coupon_code}`;
    navigator.clipboard.writeText(refLink);
    toast.success("Referral link copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full" />
      </div>
    );
  }

  // Stats calculations
  const totalOrders = commissions.length;
  const completedOrders = commissions.filter((c) => c.order?.status === "delivered").length;
  const pendingOrders = commissions.filter(
    (c) => c.order?.status !== "delivered" && c.order?.status !== "cancelled"
  ).length;
  const cancelledOrders = commissions.filter((c) => c.status === "cancelled").length;

  const totalRevenue = commissions
    .filter((c) => c.status !== "cancelled")
    .reduce((sum, c) => sum + Number(c.net_amount), 0);

  const pendingComm = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);

  const approvedComm = commissions
    .filter((c) => c.status === "approved")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);

  const paidComm = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);

  const clickCount = influencer.clicks || 0;
  const conversionRate =
    clickCount > 0 ? ((totalOrders / clickCount) * 100).toFixed(1) + "%" : "0.0%";

  // Monthly Performance Chart data
  const monthlyDataMap = new Map();
  commissions.forEach((c) => {
    if (c.status === "cancelled") return;
    const date = new Date(c.created_at);
    const monthYear = date.toLocaleString("en-US", { month: "short", year: "2-digit" });

    if (!monthlyDataMap.has(monthYear)) {
      monthlyDataMap.set(monthYear, { name: monthYear, Commission: 0, Sales: 0 });
    }

    const current = monthlyDataMap.get(monthYear);
    current.Commission += Number(c.commission_amount);
    current.Sales += Number(c.net_amount);
  });

  const chartData = Array.from(monthlyDataMap.values()).reverse();

  const isAdminPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("admin_preview");

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-16">
      {/* Admin Preview Banner */}
      {isAdminPreview && (
        <div className="bg-amber-400 text-amber-950 text-center py-2 px-4 text-xs font-bold uppercase tracking-widest">
          🔐 Admin Preview Mode — You are viewing {influencer?.name}&apos;s dashboard
        </div>
      )}
      {/* Header Banner */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-xl shadow-md">
              <Award size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">Creator Network</h2>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">
                Partner Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-black flex items-center gap-1.5 transition-colors"
            >
              Storefront <ExternalLink size={13} />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-8 space-y-6">
        {/* Welcome Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold">Welcome back, {influencer.name}!</h1>
            <p className="text-gray-500 text-xs">Here is the performance report for your coupon code.</p>
          </div>

          {/* Referral Asset controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Code:</span>
              <span className="font-mono font-bold text-black text-sm">{influencer.coupon_code}</span>
            </div>
            <button
              onClick={copyCouponCode}
              className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Copy size={13} /> Copy Code
            </button>
            <button
              onClick={copyReferralLink}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ExternalLink size={13} /> Referral Link
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Clicks</h3>
              <p className="text-2xl font-bold text-black">{clickCount}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Orders</h3>
              <p className="text-2xl font-bold text-black">{totalOrders}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Conversion Rate</h3>
              <p className="text-2xl font-bold text-black">{conversionRate}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sales Generated</h3>
              <p className="text-2xl font-bold text-emerald-600">{totalRevenue.toLocaleString()} EGP</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm col-span-2 md:col-span-1">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">My Commissions</h3>
              <p className="text-2xl font-bold text-emerald-600">{(pendingComm + approvedComm + paidComm).toLocaleString()} EGP</p>
            </div>
          </div>
        </div>

        {/* Breakdown of Commissions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Paid Commissions</h4>
            <p className="text-2xl font-bold text-slate-700">{paidComm.toLocaleString()} EGP</p>
            <p className="text-[10px] text-gray-400 mt-1">Transferred directly to your account</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Approved Earnings</h4>
            <p className="text-2xl font-bold text-blue-600">{approvedComm.toLocaleString()} EGP</p>
            <p className="text-[10px] text-gray-400 mt-1">Confirmed and waiting for payment</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Clearance</h4>
            <p className="text-2xl font-bold text-amber-600">{pendingComm.toLocaleString()} EGP</p>
            <p className="text-[10px] text-gray-400 mt-1">Delivered orders within 14-day return window</p>
          </div>
        </div>

        {/* Charts & Table Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-1 flex flex-col">
            <h3 className="font-semibold text-black mb-6">Performance History</h3>
            <div className="h-[250px] w-full flex-1">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B7280" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B7280" }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} formatter={(val) => [`${Number(val).toLocaleString()} EGP`, "Commission"]} />
                    <Bar dataKey="Commission" fill="#000000" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No monthly data to chart.
                </div>
              )}
            </div>
          </div>

          {/* Orders History List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2 flex flex-col">
            <h3 className="font-semibold text-black mb-6">Recent Sales & Commissions</h3>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">Order Number</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Net Sale</th>
                    <th className="px-4 py-3">My Commission</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {commissions.length > 0 ? (
                    commissions.slice(0, 8).map((comm) => (
                      <tr key={comm.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3.5 font-bold text-black">#{comm.order_number}</td>
                        <td className="px-4 py-3.5 text-gray-500">{new Date(comm.created_at).toLocaleDateString("en-GB")}</td>
                        <td className="px-4 py-3.5 text-slate-700 font-semibold">{Number(comm.net_amount).toLocaleString()} EGP</td>
                        <td className="px-4 py-3.5 text-emerald-600 font-bold">{Number(comm.commission_amount).toLocaleString()} EGP</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-full ${
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 bg-white">
                        No transactions registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
