/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Megaphone, PlusCircle, Trash2, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";

export default function AdSpendPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [platform, setPlatform] = useState("meta");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [impressions, setImpressions] = useState("");
  const [clicks, setClicks] = useState("");
  const [reach, setReach] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const [aRes, oRes] = await Promise.all([
        supabase.from("ad_spend").select("*").order("date", { ascending: false }),
        supabase.from("orders").select("total, status"),
      ]);
      if (aRes.error && (aRes.error.code === "PGRST205" || aRes.error.message?.includes("does not exist"))) {
        setDbError(true);
      } else {
        setEntries(aRes.data || []);
      }
      setOrders(oRes.data || []);
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const imp = parseInt(impressions) || 0;
    const clk = parseInt(clicks) || 0;
    const amt = parseFloat(amount) || 0;

    const { data, error } = await supabase.from("ad_spend").insert({
      platform,
      date,
      amount: amt,
      impressions: imp,
      clicks: clk,
      reach: parseInt(reach) || 0,
      cpm: imp > 0 ? (amt / imp) * 1000 : 0,
      cpc: clk > 0 ? amt / clk : 0,
      ctr: imp > 0 ? (clk / imp) * 100 : 0,
      campaign_name: campaignName.trim() || null,
    }).select();

    if (error) alert(`Error: ${error.message}`);
    else if (data) {
      setEntries((prev) => [data[0], ...prev]);
      setShowForm(false);
      setAmount(""); setImpressions(""); setClicks(""); setReach(""); setCampaignName("");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("ad_spend").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" /></div>;
  }

  if (dbError) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <AlertTriangle size={40} className="mx-auto text-amber-400" />
        <h2 className="text-xl font-bold text-white">Ad Spend Table Not Found</h2>
        <p className="text-xs text-zinc-500">Run <code className="text-red-400">command-center-migration.sql</code> in Supabase SQL Editor.</p>
        <button onClick={fetchAll} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-400">Retry</button>
      </div>
    );
  }

  // Aggregates
  const totalSpend = entries.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const totalImpressions = entries.reduce((s: number, e: any) => s + Number(e.impressions || 0), 0);
  const totalClicks = entries.reduce((s: number, e: any) => s + Number(e.clicks || 0), 0);
  const totalReach = entries.reduce((s: number, e: any) => s + Number(e.reach || 0), 0);
  const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const revenue = orders
    .filter((o: any) => o.status !== "cancelled" && o.status !== "returned")
    .reduce((s: number, o: any) => s + Number(o.total || 0), 0);
  const roas = totalSpend > 0 ? revenue / totalSpend : 0;

  // By platform
  const byPlatform: Record<string, { spend: number; impressions: number; clicks: number }> = {};
  entries.forEach((e: any) => {
    if (!byPlatform[e.platform]) byPlatform[e.platform] = { spend: 0, impressions: 0, clicks: 0 };
    byPlatform[e.platform].spend += Number(e.amount || 0);
    byPlatform[e.platform].impressions += Number(e.impressions || 0);
    byPlatform[e.platform].clicks += Number(e.clicks || 0);
  });

  const platformColor: Record<string, string> = {
    meta: "text-blue-400",
    tiktok: "text-pink-400",
    google: "text-emerald-400",
    snapchat: "text-yellow-400",
    other: "text-zinc-400",
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-1">Advertising</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ad Spend</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all">
          <PlusCircle size={14} /> Add Entry
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Spend</p>
          <p className="text-xl font-black text-red-400">{fmt(totalSpend)} EGP</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">ROAS</p>
          <p className={`text-xl font-black ${roas >= 2 ? "text-emerald-400" : roas >= 1 ? "text-amber-400" : "text-red-400"}`}>{roas.toFixed(2)}x</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Avg CPM</p>
          <p className="text-xl font-black text-cyan-400">{avgCPM.toFixed(1)} EGP</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Avg CPC</p>
          <p className="text-xl font-black text-purple-400">{avgCPC.toFixed(1)} EGP</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Impressions</p>
          <p className="text-lg font-black text-white">{fmt(totalImpressions)}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Clicks</p>
          <p className="text-lg font-black text-white">{fmt(totalClicks)}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Reach</p>
          <p className="text-lg font-black text-white">{fmt(totalReach)}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Avg CTR</p>
          <p className="text-lg font-black text-white">{avgCTR.toFixed(2)}%</p>
        </div>
      </div>

      {/* Platform Breakdown */}
      {Object.keys(byPlatform).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">By Platform</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(byPlatform).map(([p, d]) => (
              <div key={p} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 flex items-center gap-4">
                <div className={`text-lg font-black uppercase ${platformColor[p] || "text-zinc-400"}`}>{p}</div>
                <div className="flex-1 text-xs text-zinc-500 space-y-0.5">
                  <p>Spend: <span className="text-white font-bold">{fmt(d.spend)} EGP</span></p>
                  <p>Impressions: <span className="text-white font-bold">{fmt(d.impressions)}</span></p>
                  <p>Clicks: <span className="text-white font-bold">{fmt(d.clicks)}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Entry Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Megaphone size={16} className="text-blue-400" /> New Ad Spend Entry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Platform *</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none">
                <option value="meta">Meta (Facebook/Instagram)</option>
                <option value="tiktok">TikTok</option>
                <option value="google">Google</option>
                <option value="snapchat">Snapchat</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Amount (EGP) *</label>
              <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-red-500/50" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Impressions</label>
              <input type="number" value={impressions} onChange={(e) => setImpressions(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Clicks</label>
              <input type="number" value={clicks} onChange={(e) => setClicks(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Reach</label>
              <input type="number" value={reach} onChange={(e) => setReach(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Campaign Name</label>
              <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Optional" className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
            {submitting ? "Saving..." : "Save Entry"}
          </button>
        </form>
      )}

      {/* Entries List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Spend History</h2>
        {entries.map((e) => (
          <div key={e.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-xs font-black uppercase ${platformColor[e.platform] || "text-zinc-400"}`}>{e.platform}</span>
                <span className="text-[10px] text-zinc-600">{new Date(e.date).toLocaleDateString("en-GB")}</span>
                {e.campaign_name && <span className="text-[10px] text-zinc-500 truncate">{e.campaign_name}</span>}
              </div>
              <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500 font-medium">
                <span>Spend: <span className="text-red-400 font-bold">{fmt(e.amount)} EGP</span></span>
                <span>Imp: <span className="text-zinc-300 font-bold">{fmt(e.impressions || 0)}</span></span>
                <span>Clicks: <span className="text-zinc-300 font-bold">{fmt(e.clicks || 0)}</span></span>
                <span>CPM: <span className="text-cyan-400 font-bold">{Number(e.cpm || 0).toFixed(1)}</span></span>
                <span>CPC: <span className="text-purple-400 font-bold">{Number(e.cpc || 0).toFixed(1)}</span></span>
                <span>CTR: <span className="text-white font-bold">{Number(e.ctr || 0).toFixed(2)}%</span></span>
              </div>
            </div>
            <button onClick={() => handleDelete(e.id)} className="p-2 text-zinc-700 hover:text-red-400 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-center py-16">
            <Megaphone size={40} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-sm font-bold text-zinc-600">No ad spend recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
