/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Factory, PlusCircle, Package, AlertTriangle, Trash2, RefreshCw } from "lucide-react";

export default function ManufacturingPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [batchName, setBatchName] = useState("");
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split("T")[0]);
  const [qty, setQty] = useState("");
  const [fabricCost, setFabricCost] = useState("");
  const [printingCost, setPrintingCost] = useState("");
  const [sewingCost, setSewingCost] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [otherCost, setOtherCost] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const [bRes, iRes, pRes] = await Promise.all([
        supabase.from("manufacturing_batches").select("*").order("date", { ascending: false }),
        supabase.from("inventory").select("*"),
        supabase.from("products").select("id, title, image_url").eq("is_active", true),
      ]);

      if (bRes.error && (bRes.error.code === "PGRST205" || bRes.error.message?.includes("does not exist"))) {
        setDbError(true);
      } else {
        setBatches(bRes.data || []);
      }
      setInventory(iRes.data || []);
      setProducts(pRes.data || []);
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("manufacturing_batches").insert({
        batch_name: batchName,
        date: batchDate,
        quantity_produced: parseInt(qty) || 0,
        fabric_cost: parseFloat(fabricCost) || 0,
        printing_cost: parseFloat(printingCost) || 0,
        sewing_cost: parseFloat(sewingCost) || 0,
        packaging_cost: parseFloat(packagingCost) || 0,
        transport_cost: parseFloat(transportCost) || 0,
        other_cost: parseFloat(otherCost) || 0,
        notes: notes.trim() || null,
      }).select();

      if (error) alert(`Error: ${error.message}`);
      else if (data) {
        setBatches((prev) => [data[0], ...prev]);
        setShowForm(false);
        setBatchName(""); setQty(""); setFabricCost(""); setPrintingCost(""); setSewingCost("");
        setPackagingCost(""); setTransportCost(""); setOtherCost(""); setNotes("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this batch?")) return;
    await supabase.from("manufacturing_batches").delete().eq("id", id);
    setBatches((prev) => prev.filter((b) => b.id !== id));
  };

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" /></div>;
  }

  if (dbError) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <AlertTriangle size={40} className="mx-auto text-amber-400" />
        <h2 className="text-xl font-bold text-white">Manufacturing Table Not Found</h2>
        <p className="text-xs text-zinc-500">Run <code className="text-red-400">command-center-migration.sql</code> in Supabase SQL Editor.</p>
        <button onClick={fetchAll} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-400">Retry</button>
      </div>
    );
  }

  // Stock by product
  const stockByProduct: Record<string, { title: string; sizes: Record<string, number>; total: number }> = {};
  inventory.forEach((inv: any) => {
    const prod = products.find((p: any) => p.id === inv.product_id);
    const title = prod?.title || "Unknown";
    if (!stockByProduct[inv.product_id]) stockByProduct[inv.product_id] = { title, sizes: {}, total: 0 };
    stockByProduct[inv.product_id].sizes[inv.size] = inv.quantity;
    stockByProduct[inv.product_id].total += inv.quantity;
  });

  const totalStock = inventory.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0);
  const totalManufacturing = batches.reduce((s: number, b: any) => s + Number(b.total_cost || 0), 0);
  const totalProduced = batches.reduce((s: number, b: any) => s + Number(b.quantity_produced || 0), 0);
  const avgCPU = totalProduced > 0 ? totalManufacturing / totalProduced : 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-1">Production & Inventory</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Manufacturing & Stock</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all">
          <PlusCircle size={14} /> Add Batch
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Produced</p>
          <p className="text-xl font-black text-white">{fmt(totalProduced)}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Cost</p>
          <p className="text-xl font-black text-amber-400">{fmt(totalManufacturing)} EGP</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Cost Per Unit</p>
          <p className="text-xl font-black text-cyan-400">{avgCPU.toFixed(1)} EGP</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Current Stock</p>
          <p className={`text-xl font-black ${totalStock <= 10 ? "text-red-400" : "text-emerald-400"}`}>{fmt(totalStock)} units</p>
        </div>
      </div>

      {/* Stock by Product */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><Package size={16} /> Stock by Product</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(stockByProduct).map(([pid, data]) => (
            <div key={pid} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate">{data.title}</span>
                <span className={`text-sm font-black ${data.total <= 3 ? "text-red-400" : "text-emerald-400"}`}>{data.total}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.sizes).map(([size, qty]) => (
                  <span key={size} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                    qty <= 0 ? "text-red-400 bg-red-500/10 border-red-500/20" :
                    qty <= 3 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                    "text-zinc-400 bg-zinc-800 border-zinc-700"
                  }`}>
                    {size}: {qty}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Batch Form */}
      {showForm && (
        <form onSubmit={handleAddBatch} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Factory size={16} className="text-amber-400" /> New Manufacturing Batch</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Batch Name *</label>
              <input type="text" required value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g. Batch #5 - September" className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Date</label>
              <input type="date" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Quantity Produced *</label>
              <input type="number" required value={qty} onChange={(e) => setQty(e.target.value)} placeholder="e.g. 100" className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-red-500/50" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pt-2">Costs (EGP)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Fabric", val: fabricCost, set: setFabricCost },
              { label: "Printing", val: printingCost, set: setPrintingCost },
              { label: "Sewing", val: sewingCost, set: setSewingCost },
              { label: "Packaging", val: packagingCost, set: setPackagingCost },
              { label: "Transport", val: transportCost, set: setTransportCost },
              { label: "Other", val: otherCost, set: setOtherCost },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider block mb-1">{f.label}</label>
                <input type="number" step="0.01" value={f.val} onChange={(e) => f.set(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-amber-500/50" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none" />
          </div>
          <button type="submit" disabled={submitting} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
            {submitting ? "Saving..." : "Save Batch"}
          </button>
        </form>
      )}

      {/* Batches List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Production History</h2>
        {batches.map((b) => (
          <div key={b.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-bold text-white">{b.batch_name}</span>
                <span className="text-[10px] text-zinc-600">{new Date(b.date).toLocaleDateString("en-GB")}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500 font-medium">
                <span>Qty: <span className="text-zinc-300 font-bold">{b.quantity_produced}</span></span>
                <span>Total: <span className="text-amber-400 font-bold">{fmt(b.total_cost || 0)} EGP</span></span>
                <span>Per Unit: <span className="text-cyan-400 font-bold">{Number(b.cost_per_unit || 0).toFixed(1)} EGP</span></span>
              </div>
            </div>
            <button onClick={() => handleDelete(b.id)} className="p-2 text-zinc-700 hover:text-red-400 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {batches.length === 0 && (
          <div className="text-center py-16">
            <Factory size={40} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-sm font-bold text-zinc-600">No batches recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
