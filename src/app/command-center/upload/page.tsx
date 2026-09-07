/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, FileSpreadsheet, Check, X, AlertTriangle, RefreshCw } from "lucide-react";

interface ParsedRow {
  orderNumber: number | null;
  trackingNumber: string;
  shippingCompany: string;
  status: string;
  rawRow: Record<string, string>;
}

const STATUS_KEYWORDS: Record<string, string[]> = {
  shipped: ["shipped", "in transit", "picked up", "out for delivery", "on the way", "dispatched"],
  delivered: ["delivered", "completed", "received", "done"],
  cancelled: ["cancelled", "canceled", "returned to sender", "rts", "failed"],
};

function detectStatus(row: Record<string, string>): string {
  const allValues = Object.values(row).join(" ").toLowerCase();
  for (const [status, keywords] of Object.entries(STATUS_KEYWORDS)) {
    if (keywords.some((kw) => allValues.includes(kw))) return status;
  }
  return "shipped";
}

function detectOrderNumber(row: Record<string, string>): number | null {
  for (const [key, val] of Object.entries(row)) {
    const k = key.toLowerCase();
    if (k.includes("order") || k.includes("رقم") || k.includes("طلب") || k.includes("ref")) {
      const num = parseInt(val);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  for (const val of Object.values(row)) {
    const num = parseInt(val);
    if (!isNaN(num) && num >= 1000 && num < 999999) return num;
  }
  return null;
}

function detectTracking(row: Record<string, string>): string {
  for (const [key, val] of Object.entries(row)) {
    const k = key.toLowerCase();
    if (k.includes("track") || k.includes("awb") || k.includes("waybill") || k.includes("بوليصة")) {
      if (val?.trim()) return val.trim();
    }
  }
  return "";
}

function detectCompany(row: Record<string, string>, fileName: string): string {
  const all = (Object.values(row).join(" ") + " " + fileName).toLowerCase();
  if (all.includes("j&t") || all.includes("jnt")) return "J&T Express";
  if (all.includes("aramex")) return "Aramex";
  if (all.includes("bosta")) return "Bosta";
  if (all.includes("mylerz")) return "Mylerz";
  if (all.includes("sprint")) return "Sprint";
  if (all.includes("imile") || all.includes("i-mile")) return "iMile";
  if (all.includes("fedex")) return "FedEx";
  return "Unknown";
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
}

export default function UploadPage() {
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [results, setResults] = useState<{ orderNumber: number; success: boolean; message: string }[]>([]);
  const [done, setDone] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setDone(false);
    setResults([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      const parsedRows: ParsedRow[] = rows.map((row) => ({
        orderNumber: detectOrderNumber(row),
        trackingNumber: detectTracking(row),
        shippingCompany: detectCompany(row, file.name),
        status: detectStatus(row),
        rawRow: row,
      }));
      setParsed(parsedRows);
    };
    reader.readAsText(file);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    const res: { orderNumber: number; success: boolean; message: string }[] = [];

    for (const row of parsed) {
      if (!row.orderNumber) {
        res.push({ orderNumber: 0, success: false, message: "No order number detected" });
        continue;
      }
      const { data: order, error: findErr } = await supabase
        .from("orders")
        .select("id, status")
        .eq("order_number", row.orderNumber)
        .single();

      if (findErr || !order) {
        res.push({ orderNumber: row.orderNumber, success: false, message: "Order not found" });
        continue;
      }

      const updates: any = { status: row.status };
      if (row.trackingNumber) updates.tracking_number = row.trackingNumber;
      if (row.shippingCompany !== "Unknown") updates.shipping_company = row.shippingCompany;

      const { error: upErr } = await supabase.from("orders").update(updates).eq("id", order.id);
      if (upErr) {
        res.push({ orderNumber: row.orderNumber, success: false, message: upErr.message });
      } else {
        res.push({ orderNumber: row.orderNumber, success: true, message: `${order.status} → ${row.status}` });
      }
    }

    setResults(res);
    setDone(true);
    setUpdating(false);
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-1">Bulk Operations</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">Upload Shipping Sheet</h1>
        <p className="text-xs text-zinc-500 mt-2">Upload a CSV file from your shipping company. The system will auto-detect order numbers, tracking info, and update statuses.</p>
      </div>

      {/* Upload Area */}
      <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all cursor-pointer">
        <Upload size={40} className="text-zinc-700 mb-4" />
        <span className="text-sm font-bold text-zinc-400 mb-1">Drop CSV file here or click to upload</span>
        <span className="text-[10px] text-zinc-600">Supports: J&T, Aramex, Bosta, Mylerz, Sprint, iMile, FedEx</span>
        <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
      </label>

      {fileName && (
        <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl">
          <FileSpreadsheet size={18} className="text-emerald-400" />
          <span className="text-sm font-bold text-white">{fileName}</span>
          <span className="text-[10px] text-zinc-500">{parsed.length} rows detected</span>
        </div>
      )}

      {/* Parsed Preview */}
      {parsed.length > 0 && !done && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Preview ({parsed.length} rows)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-zinc-800">
                  <th className="text-left py-3 px-3">Order #</th>
                  <th className="text-left py-3 px-3">Tracking</th>
                  <th className="text-left py-3 px-3">Company</th>
                  <th className="text-left py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-3 px-3 font-bold text-white">{row.orderNumber || <span className="text-red-400">N/A</span>}</td>
                    <td className="py-3 px-3 text-zinc-400 font-mono">{row.trackingNumber || "-"}</td>
                    <td className="py-3 px-3 text-zinc-400">{row.shippingCompany}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                        row.status === "delivered" ? "text-emerald-400 bg-emerald-500/10" :
                        row.status === "cancelled" ? "text-red-400 bg-red-500/10" :
                        "text-purple-400 bg-purple-500/10"
                      }`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsed.length > 50 && <p className="text-[10px] text-zinc-600">Showing 50 of {parsed.length} rows</p>}

          <button onClick={handleUpdate} disabled={updating} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
            {updating ? "Updating Orders..." : `Update ${parsed.length} Orders`}
          </button>
        </div>
      )}

      {/* Results */}
      {done && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-emerald-400">{successCount}</p>
              <p className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-wider">Updated</p>
            </div>
            <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-red-400">{failCount}</p>
              <p className="text-[10px] text-red-400/60 font-bold uppercase tracking-wider">Failed</p>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs ${
                r.success ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-red-500/5 border border-red-500/10"
              }`}>
                {r.success ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-red-400" />}
                <span className="font-bold text-white">#{r.orderNumber || "?"}</span>
                <span className={r.success ? "text-emerald-400" : "text-red-400"}>{r.message}</span>
              </div>
            ))}
          </div>

          <button onClick={() => { setParsed([]); setDone(false); setResults([]); setFileName(""); }} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all">
            <RefreshCw size={14} className="inline mr-2" />Upload Another
          </button>
        </div>
      )}
    </div>
  );
}
