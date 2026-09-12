/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, FileSpreadsheet, FileText, Check, X, AlertTriangle, RefreshCw } from "lucide-react";

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

interface DBOrder {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
}

const TRACKING_PATTERNS: Record<string, RegExp> = {
  "J&T Express": /\b(JT\d{10,13}|6\d{12,14})\b/i,
  "Aramex":      /\b(\d{10,12})\b/,
  "Bosta":       /\b(BS-?\d{6,10}|\d{8,10})\b/i,
  "Mylerz":      /\b(MY\d{8,12}|\d{10,12})\b/i,
  "Sprint":      /\b(SP\d{8,10}|\d{9,12})\b/i,
  "iMile":       /\b(IM\d{8,12}|\d{10,14})\b/i,
};

const PHONE_REGEX = /(?:0|\+?20)\s*1[0125]\d[\s-]?\d{3}[\s-]?\d{4}/g;

async function extractPDFText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as any[];
    let lastY: number | null = null;
    for (const item of items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        fullText += "\n";
      }
      fullText += item.str + " ";
      lastY = item.transform[5];
    }
    fullText += "\n---PAGE_BREAK---\n";
  }
  return fullText;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\+]/g, "").replace(/^0/, "20").replace(/^20{2,}/, "20");
}

async function smartParsePDF(file: File): Promise<ParsedRow[]> {
  const text = await extractPDFText(file);

  const { data: dbOrders } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone")
    .order("created_at", { ascending: false });

  const ordersByNumber = new Map<number, DBOrder>();
  const ordersByPhone = new Map<string, DBOrder>();
  const ordersByName = new Map<string, DBOrder>();

  (dbOrders || []).forEach((o: DBOrder) => {
    ordersByNumber.set(o.order_number, o);
    if (o.customer_phone) {
      ordersByPhone.set(normalizePhone(o.customer_phone), o);
    }
    if (o.customer_name) {
      ordersByName.set(o.customer_name.toLowerCase().trim(), o);
    }
  });

  const lines = text.split(/\n/).filter((l) => l.trim() && l.trim() !== "---PAGE_BREAK---");
  const results: ParsedRow[] = [];
  const seenOrders = new Set<number>();

  for (const line of lines) {
    let matchedOrder: DBOrder | null = null;
    let trackingNumber = "";

    const orderNumMatch = line.match(/(?:order|طلب|أوردر|ref|رقم)[#:\s]*(\d{1,6})/i);
    if (orderNumMatch) {
      const num = parseInt(orderNumMatch[1]);
      if (ordersByNumber.has(num)) matchedOrder = ordersByNumber.get(num)!;
    }

    if (!matchedOrder) {
      const nums = line.match(/\b(\d{1,5})\b/g);
      if (nums) {
        for (const n of nums) {
          const num = parseInt(n);
          if (ordersByNumber.has(num)) {
            matchedOrder = ordersByNumber.get(num)!;
            break;
          }
        }
      }
    }

    if (!matchedOrder) {
      const phones = line.match(PHONE_REGEX);
      if (phones) {
        for (const phone of phones) {
          const normalized = normalizePhone(phone);
          if (ordersByPhone.has(normalized)) {
            matchedOrder = ordersByPhone.get(normalized)!;
            break;
          }
        }
      }
    }

    if (!matchedOrder) {
      for (const [name, order] of ordersByName) {
        if (name.length > 3 && line.toLowerCase().includes(name)) {
          matchedOrder = order;
          break;
        }
      }
    }

    if (!matchedOrder) continue;
    if (seenOrders.has(matchedOrder.order_number)) continue;
    seenOrders.add(matchedOrder.order_number);

    const company = detectCompany({ raw_line: line }, file.name);
    for (const [comp, pattern] of Object.entries(TRACKING_PATTERNS)) {
      const m = line.match(pattern);
      if (m) {
        trackingNumber = m[1];
        if (company === "Unknown") break;
        if (comp === company) break;
      }
    }
    if (!trackingNumber) {
      const genericTrack = line.match(/\b([A-Z]{2,3}\d{8,14})\b/) || line.match(/\b(\d{10,15})\b/);
      if (genericTrack) trackingNumber = genericTrack[1];
    }

    results.push({
      orderNumber: matchedOrder.order_number,
      trackingNumber,
      shippingCompany: company !== "Unknown" ? company : detectCompanyFromTracking(trackingNumber),
      status: detectStatus({ raw_line: line }),
      rawRow: { raw_line: line, matched_by: "smart_pdf", customer: matchedOrder.customer_name },
    });
  }

  return results;
}

function detectCompanyFromTracking(tracking: string): string {
  if (!tracking) return "Unknown";
  if (/^JT/i.test(tracking)) return "J&T Express";
  if (/^BS/i.test(tracking)) return "Bosta";
  if (/^MY/i.test(tracking)) return "Mylerz";
  if (/^SP/i.test(tracking)) return "Sprint";
  if (/^IM/i.test(tracking)) return "iMile";
  return "Unknown";
}

export default function UploadPage() {
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"csv" | "pdf">("csv");
  const [updating, setUpdating] = useState(false);
  const [results, setResults] = useState<{ orderNumber: number; success: boolean; message: string }[]>([]);
  const [done, setDone] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setDone(false);
    setResults([]);
    setFileType(file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "csv");

    try {
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const parsedRows = await smartParsePDF(file);
        setParsed(parsedRows);
      } else {
        const text = await file.text();
        const rows = parseCSV(text);
        const parsedRows: ParsedRow[] = rows.map((row) => ({
          orderNumber: detectOrderNumber(row),
          trackingNumber: detectTracking(row),
          shippingCompany: detectCompany(row, file.name),
          status: detectStatus(row),
          rawRow: row,
        }));
        setParsed(parsedRows);
      }
    } catch (err) {
      console.error("Error parsing file:", err);
      setParsed([]);
    }
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
        <p className="text-xs text-zinc-500 mt-2">Upload a CSV or PDF file from your shipping company. The system will auto-detect order numbers, tracking info, and update statuses.</p>
      </div>

      {/* Upload Area */}
      <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all cursor-pointer">
        <Upload size={40} className="text-zinc-700 mb-4" />
        <span className="text-sm font-bold text-zinc-400 mb-1">Drop CSV or PDF file here or click to upload</span>
        <span className="text-[10px] text-zinc-600">Supports: J&T, Aramex, Bosta, Mylerz, Sprint, iMile, FedEx</span>
        <input type="file" accept=".csv,.txt,.pdf" onChange={handleFile} className="hidden" />
      </label>

      {fileName && (
        <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl">
          {fileType === "pdf" ? <FileText size={18} className="text-red-400" /> : <FileSpreadsheet size={18} className="text-emerald-400" />}
          <span className="text-sm font-bold text-white">{fileName}</span>
          <span className="text-[10px] text-zinc-500">{parsed.length} rows detected</span>
        </div>
      )}

      {/* Parsed Preview */}
      {parsed.length > 0 && !done && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Preview ({parsed.length} rows) — <span className="text-zinc-500 normal-case">click any field to edit</span></h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-zinc-800">
                  <th className="text-left py-3 px-3">Order #</th>
                  <th className="text-left py-3 px-3">Tracking</th>
                  <th className="text-left py-3 px-3">Company</th>
                  <th className="text-left py-3 px-3">Status</th>
                  <th className="text-left py-3 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={row.orderNumber || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || null;
                          setParsed((prev) => prev.map((r, idx) => idx === i ? { ...r, orderNumber: val } : r));
                        }}
                        className="w-24 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-bold text-xs focus:outline-none focus:border-red-500/50"
                        placeholder="Order #"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={row.trackingNumber}
                        onChange={(e) => {
                          setParsed((prev) => prev.map((r, idx) => idx === i ? { ...r, trackingNumber: e.target.value } : r));
                        }}
                        className="w-36 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 font-mono text-xs focus:outline-none focus:border-red-500/50"
                        placeholder="Tracking #"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={row.shippingCompany}
                        onChange={(e) => {
                          setParsed((prev) => prev.map((r, idx) => idx === i ? { ...r, shippingCompany: e.target.value } : r));
                        }}
                        className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none focus:border-red-500/50"
                      >
                        <option value="J&T Express">J&T Express</option>
                        <option value="Aramex">Aramex</option>
                        <option value="Bosta">Bosta</option>
                        <option value="Mylerz">Mylerz</option>
                        <option value="Sprint">Sprint</option>
                        <option value="iMile">iMile</option>
                        <option value="FedEx">FedEx</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={row.status}
                        onChange={(e) => {
                          setParsed((prev) => prev.map((r, idx) => idx === i ? { ...r, status: e.target.value } : r));
                        }}
                        className={`px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold focus:outline-none focus:border-red-500/50 ${
                          row.status === "delivered" ? "text-emerald-400" :
                          row.status === "cancelled" ? "text-red-400" :
                          "text-purple-400"
                        }`}
                      >
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="returned">Returned</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => setParsed((prev) => prev.filter((_, idx) => idx !== i))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Remove row"
                      >
                        <X size={13} />
                      </button>
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

          <button onClick={() => { setParsed([]); setDone(false); setResults([]); setFileName(""); setFileType("csv"); }} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all">
            <RefreshCw size={14} className="inline mr-2" />Upload Another
          </button>
        </div>
      )}
    </div>
  );
}
