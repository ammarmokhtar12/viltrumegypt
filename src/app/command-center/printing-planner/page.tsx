/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Layers,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Save,
  Search,
  CheckCircle2,
  Sparkles,
  RotateCcw,
} from "lucide-react";

const SIZES = ["M", "L", "XL", "2XL"] as const;
type TargetSize = (typeof SIZES)[number];

function normalizeSize(rawSize: string | undefined): TargetSize | null {
  if (!rawSize) return null;
  const s = String(rawSize).trim().toUpperCase();
  if (s === "M") return "M";
  if (s === "L") return "L";
  if (s === "XL" || s === "1XL") return "XL";
  if (s === "2XL" || s === "XXL") return "2XL";
  return null;
}

export default function PrintingPlannerPage() {
  const [loading, setLoading] = useState(true);
  const [savingStock, setSavingStock] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [localStock, setLocalStock] = useState<Record<string, number>>({});
  const [dirtyStock, setDirtyStock] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, iRes, oRes] = await Promise.all([
        supabase.from("products").select("id, title, image_url").eq("is_active", true).order("title"),
        supabase.from("inventory").select("*"),
        supabase.from("orders").select("id, order_number, status, items").eq("status", "pending"),
      ]);

      const prods = pRes.data || [];
      const invs = iRes.data || [];
      const orders = oRes.data || [];

      setProducts(prods);
      setPendingOrders(orders);

      const stockMap: Record<string, number> = {};
      invs.forEach((inv: any) => {
        const key = `${inv.product_id}_${inv.size?.toUpperCase()}`;
        stockMap[key] = Number(inv.quantity) || 0;
      });
      setLocalStock(stockMap);
      setDirtyStock({});
    } catch (err) {
      console.error("Error fetching planner data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (productId: string, size: string, value: number) => {
    const key = `${productId}_${size}`;
    const qty = Math.max(0, value);
    setLocalStock((prev) => ({ ...prev, [key]: qty }));
    setDirtyStock((prev) => ({ ...prev, [key]: true }));
  };

  const handleClearAllStock = () => {
    if (!confirm("هل أنت متأكد من تصفير رصيد المخزن للبدء بجرد جديد؟")) return;
    const cleared: Record<string, number> = {};
    const dirty: Record<string, boolean> = {};
    products.forEach((p) => {
      SIZES.forEach((sz) => {
        const k = `${p.id}_${sz}`;
        cleared[k] = 0;
        dirty[k] = true;
      });
    });
    setLocalStock(cleared);
    setDirtyStock(dirty);
  };

  const handleSaveStock = async () => {
    setSavingStock(true);
    try {
      const updates = Object.keys(dirtyStock).map((key) => {
        const [productId, size] = key.split("_");
        const qty = localStock[key] || 0;
        return {
          product_id: productId,
          size,
          quantity: qty,
        };
      });

      if (updates.length > 0) {
        const { error } = await supabase.from("inventory").upsert(updates, {
          onConflict: "product_id,size",
        });
        if (error) {
          alert(`خطأ أثناء حفظ المخزن: ${error.message}`);
        } else {
          setDirtyStock({});
          alert("تم حفظ المخزن بنجاح ✅");
        }
      }
    } catch (err: any) {
      alert(`خطأ: ${err?.message || err}`);
    } finally {
      setSavingStock(false);
    }
  };

  // Solver for patterns based on PENDING ORDERS ONLY - STOCK
  const planData = useMemo(() => {
    const pendingDemand: Record<string, Record<TargetSize, number>> = {};
    pendingOrders.forEach((o: any) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it: any) => {
        const prod = products.find((p) => p.id === it.product_id || p.title === it.title);
        if (!prod) return;
        const size = normalizeSize(it.size);
        if (!size) return;
        if (!pendingDemand[prod.id]) pendingDemand[prod.id] = { M: 0, L: 0, XL: 0, "2XL": 0 };
        pendingDemand[prod.id][size] += Number(it.quantity) || 1;
      });
    });

    const rows = products.map((prod) => {
      const t = (prod.title || "").toUpperCase();

      // Special (2M + 2L): Nightwing Short Sleeve, Spider Long Sleeve, Red Hood
      const hasSpecial =
        (t.includes("NIGHT WING") && !t.includes("LONG")) ||
        (t.includes("SPIDER") && t.includes("LONG")) ||
        t.includes("RED HOOD");

      // Super Special (2XL + 2 2XL): Spider Long Sleeve, Conquest Short Sleeve, Red Hood, Superior Short Sleeve
      const hasSuperSpecial =
        (t.includes("SPIDER") && t.includes("LONG")) ||
        (t.includes("CONQUEST") && !t.includes("LONG")) ||
        t.includes("RED HOOD") ||
        (t.includes("SUPERIOR") && !t.includes("LONG"));

      const pending: Record<TargetSize, number> = pendingDemand[prod.id] || { M: 0, L: 0, XL: 0, "2XL": 0 };

      const stock: Record<TargetSize, number> = {
        M: localStock[`${prod.id}_M`] || 0,
        L: localStock[`${prod.id}_L`] || 0,
        XL: localStock[`${prod.id}_XL`] || 0,
        "2XL": localStock[`${prod.id}_2XL`] || localStock[`${prod.id}_XXL`] || 0,
      };

      const deficit: Record<TargetSize, number> = {
        M: Math.max(0, pending.M - stock.M),
        L: Math.max(0, pending.L - stock.L),
        XL: Math.max(0, pending.XL - stock.XL),
        "2XL": Math.max(0, pending["2XL"] - stock["2XL"]),
      };

      const totalPending = pending.M + pending.L + pending.XL + pending["2XL"];
      const totalStock = stock.M + stock.L + stock.XL + stock["2XL"];
      const totalDeficit = deficit.M + deficit.L + deficit.XL + deficit["2XL"];

      let standard = 0;
      let special = 0;
      let superSpecial = 0;
      let note = "";

      if (totalDeficit > 0) {
        const maxS = Math.max(deficit.M, deficit.L, deficit.XL, deficit["2XL"]) + 2;
        const maxSp = hasSpecial ? Math.ceil(Math.max(deficit.M, deficit.L) / 2) + 2 : 0;
        const maxSsp = hasSuperSpecial ? Math.ceil(Math.max(deficit.XL, deficit["2XL"]) / 2) + 2 : 0;

        let minPenalty = Infinity;
        let chosen = { s: 0, sp: 0, ssp: 0 };

        for (let s = 0; s <= maxS; s++) {
          for (let sp = 0; sp <= maxSp; sp++) {
            for (let ssp = 0; ssp <= maxSsp; ssp++) {
              const pM = s + sp * 2;
              const pL = s + sp * 2;
              const pXL = s + ssp * 2;
              const p2XL = s + ssp * 2;

              if (pM >= deficit.M && pL >= deficit.L && pXL >= deficit.XL && p2XL >= deficit["2XL"]) {
                const waste = (pM - deficit.M) + (pL - deficit.L) + (pXL - deficit.XL) + (p2XL - deficit["2XL"]);
                const penalty = waste * 10 + (s + sp + ssp);
                if (penalty < minPenalty) {
                  minPenalty = penalty;
                  chosen = { s, sp, ssp };
                }
              }
            }
          }
        }

        standard = chosen.s;
        special = chosen.sp;
        superSpecial = chosen.ssp;

        if (special > 0 && superSpecial === 0 && standard === 0) {
          note = "المخزن فيه مقاسات كبيرة، طبعنا سبيشيال (2M+2L) لتوفير القماش";
        } else if (superSpecial > 0 && special === 0 && standard === 0) {
          note = "المخزن فيه مقاسات صغيرة، طبعنا سوبر سبيشيال (2XL+2 2XL)";
        } else if (special > 0 || superSpecial > 0) {
          note = "دمجنا الباترونات لتحقيق أقل فائض قماش";
        } else {
          note = "طلب متوازن على المقاسات";
        }
      }

      return {
        product: prod,
        hasSpecial,
        hasSuperSpecial,
        pending,
        stock,
        deficit,
        totalPending,
        totalStock,
        totalDeficit,
        standard,
        special,
        superSpecial,
        totalPatterns: standard + special + superSpecial,
        note,
      };
    });

    let sumPending = 0;
    let sumStock = 0;
    let sumDeficit = 0;
    let sumStandard = 0;
    let sumSpecial = 0;
    let sumSuperSpecial = 0;

    rows.forEach((r) => {
      sumPending += r.totalPending;
      sumStock += r.totalStock;
      sumDeficit += r.totalDeficit;
      sumStandard += r.standard;
      sumSpecial += r.special;
      sumSuperSpecial += r.superSpecial;
    });

    return {
      rows,
      summary: {
        sumPending,
        sumStock,
        sumDeficit,
        sumStandard,
        sumSpecial,
        sumSuperSpecial,
        grandTotalPatterns: sumStandard + sumSpecial + sumSuperSpecial,
      },
    };
  }, [products, pendingOrders, localStock]);

  const filteredRows = useMemo(() => {
    return planData.rows.filter((r) =>
      r.product.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [planData.rows, search]);

  // WhatsApp Message
  const handleCopyWhatsApp = () => {
    const toPrint = planData.rows.filter((r) => r.totalPatterns > 0);
    let msg = `🔴 *أمر طباعة الباترونات — VILTRUM EGYPT*\n`;
    msg += `📅 *التاريخ:* ${new Date().toLocaleDateString("ar-EG")}\n`;
    msg += `📦 *إجمالي الباترونات:* ${planData.summary.grandTotalPatterns} باترون (${planData.summary.grandTotalPatterns * 4} تيشرت)\n`;
    if (planData.summary.sumStandard > 0) msg += `  • عادي (M,L,XL,2XL): ${planData.summary.sumStandard} باترون\n`;
    if (planData.summary.sumSpecial > 0) msg += `  • سبيشيال (2M,2L): ${planData.summary.sumSpecial} باترون\n`;
    if (planData.summary.sumSuperSpecial > 0) msg += `  • سوبر سبيشيال (2XL,2 2XL): ${planData.summary.sumSuperSpecial} باترون\n\n`;

    msg += `📋 *تفصيل المطلوب طباعته:*\n`;
    toPrint.forEach((r) => {
      msg += `\n👕 *${r.product.title}*:\n`;
      if (r.standard > 0) msg += `   - باترون عادي: *${r.standard}*\n`;
      if (r.special > 0) msg += `   - باترون سبيشيال (2M+2L): *${r.special}*\n`;
      if (r.superSpecial > 0) msg += `   - باترون سوبر سبيشيال (2XL+2 2XL): *${r.superSpecial}*\n`;
      msg += `   -> إجمالي التيشرتات: ${r.totalPatterns * 4} قطعة\n`;
    });

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(msg).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // Print Sheet
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const toPrint = planData.rows.filter((r) => r.totalPatterns > 0);

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>أمر طباعة الباترونات</title>
        <style>
          body { font-family: sans-serif; padding: 25px; color: #111; }
          .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0; font-size: 20px; color: #d00; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 15px; }
          th, td { border: 1px solid #333; padding: 8px 10px; text-align: center; }
          th { background: #222; color: #fff; }
          .text-right { text-align: right; font-weight: bold; }
          .total-row { background: #eee; font-weight: 900; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>VILTRUM EGYPT — أمر طباعة الباترونات</h1>
            <div>التاريخ: ${new Date().toLocaleDateString("ar-EG")} · مبني على أوردرات البيندينج والمخزن الحالي</div>
          </div>
          <div>
            <strong>الإجمالي: ${planData.summary.grandTotalPatterns} باترون (${planData.summary.grandTotalPatterns * 4} تيشرت)</strong>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th class="text-right">الموديل</th>
              <th>عادي (M,L,XL,2XL)</th>
              <th>سبيشيال (2M,2L)</th>
              <th>سوبر سبيشيال (2XL,2 2XL)</th>
              <th>إجمالي الباترونات</th>
              <th>إجمالي التيشرتات</th>
            </tr>
          </thead>
          <tbody>
            ${toPrint.map((r) => `
              <tr>
                <td class="text-right">${r.product.title}</td>
                <td>${r.standard || "—"}</td>
                <td style="color:#0284c7; font-weight:bold;">${r.special || "—"}</td>
                <td style="color:#7c3aed; font-weight:bold;">${r.superSpecial || "—"}</td>
                <td style="font-weight:bold;">${r.totalPatterns}</td>
                <td style="font-weight:bold; color:#d00;">${r.totalPatterns * 4}</td>
              </tr>
            `).join("")}
            <tr class="total-row">
              <td class="text-right">الإجمالي</td>
              <td>${planData.summary.sumStandard}</td>
              <td>${planData.summary.sumSpecial}</td>
              <td>${planData.summary.sumSuperSpecial}</td>
              <td>${planData.summary.grandTotalPatterns} باترون</td>
              <td style="color:#d00;">${planData.summary.grandTotalPatterns * 4} تيشرت</td>
            </tr>
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const hasUnsavedStock = Object.keys(dirtyStock).length > 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>خطة طباعة الباترونات</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold">
              بيندينج فقط
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            <span className="text-emerald-400 font-bold">الصف اللي فوق بالأخضر:</span> بضاعة المخزن اليدوي ·{" "}
            <span className="text-amber-400 font-bold">الصف اللي تحت بالأصفر:</span> أوردرات البيندينج المطلوبة
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchAll}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={handleClearAllStock}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-bold transition-all"
            title="تصفير كل أرقام المخزن لجرد يدوي"
          >
            <RotateCcw size={13} />
            <span>تصفير المخزن</span>
          </button>

          <button
            onClick={handleCopyWhatsApp}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "تم النسخ!" : "نسخ للواتساب"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-xl text-xs font-bold transition-all"
          >
            <Printer size={14} />
            <span>طباعة</span>
          </button>

          <button
            onClick={handleSaveStock}
            disabled={savingStock || !hasUnsavedStock}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              hasUnsavedStock
                ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 cursor-pointer animate-pulse"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
            }`}
          >
            <Save size={14} />
            <span>{savingStock ? "جاري الحفظ..." : hasUnsavedStock ? "حفظ المخزن *" : "المخزن محفوظ"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4">
          <span className="text-xs text-emerald-400 font-bold block">🟢 المتاح في المخزن اليدوي</span>
          <span className="text-3xl font-black text-white mt-1 block">{planData.summary.sumStock}</span>
          <span className="text-xs text-zinc-400">تيشرت مسجل</span>
        </div>

        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4">
          <span className="text-xs text-amber-400 font-bold block">🟡 أوردرات البيندينج المطلوبة</span>
          <span className="text-3xl font-black text-white mt-1 block">{planData.summary.sumPending}</span>
          <span className="text-xs text-zinc-400">تيشرت مطلوب</span>
        </div>

        <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-4">
          <span className="text-xs text-red-400 font-bold block">🔴 العجز الصافي المطلوب طباعته</span>
          <span className="text-3xl font-black text-red-400 mt-1 block">{planData.summary.sumDeficit}</span>
          <span className="text-xs text-zinc-400">تيشرت ناقص</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
          <span className="text-xs text-zinc-300 font-bold block">📜 إجمالي الباترونات للطباعة</span>
          <span className="text-3xl font-black text-white mt-1 block">
            {planData.summary.grandTotalPatterns}{" "}
            <span className="text-base text-red-400 font-bold">باترون</span>
          </span>
          <span className="text-xs text-zinc-400 block mt-0.5">
            ({planData.summary.sumStandard} عادي · {planData.summary.sumSpecial} سبيشيال · {planData.summary.sumSuperSpecial} سوبر)
          </span>
        </div>
      </div>

      {/* Search & Pattern Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
          <span className="font-bold text-white">الباترونات المتاحة:</span>
          <span>عادي (M,L,XL,2XL)</span>
          <span className="text-zinc-600">|</span>
          <span className="text-sky-400 font-bold">سبيشيال (2M+2L)</span>
          <span className="text-zinc-600">|</span>
          <span className="text-violet-400 font-bold">سوبر سبيشيال (2XL+2 2XL)</span>
        </div>

        <div className="relative">
          <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="بحث في أسماء الموديلات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl pr-10 pl-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Stacked Product Cards: Green on Top (Stock), Yellow on Bottom (Pending) */}
      <div className="space-y-4">
        {filteredRows.map((r) => {
          const isPrinting = r.totalPatterns > 0;

          return (
            <div
              key={r.product.id}
              className={`bg-zinc-950/80 border rounded-2xl p-5 sm:p-6 transition-all space-y-4 ${
                isPrinting
                  ? "border-zinc-800 hover:border-zinc-700 shadow-md"
                  : "border-zinc-800/60 opacity-85 hover:opacity-100"
              }`}
            >
              {/* Product Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                <div>
                  <h3 className="text-xl font-black text-white tracking-wide">
                    {r.product.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                    <span>الباترونات:</span>
                    <span className="text-zinc-300 font-semibold">عادي (M, L, XL, 2XL)</span>
                    {r.hasSpecial && (
                      <span className="text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        سبيشيال (2M+2L)
                      </span>
                    )}
                    {r.hasSuperSpecial && (
                      <span className="text-violet-400 font-bold bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                        سوبر (2XL+2 2XL)
                      </span>
                    )}
                  </div>
                </div>

                {/* Pattern Recommendation Badge */}
                <div>
                  {isPrinting ? (
                    <div className="flex flex-col sm:items-end gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-zinc-400 font-bold">المطلوب طباعته:</span>
                        {r.standard > 0 && (
                          <span className="px-3.5 py-1.5 rounded-xl bg-zinc-800 text-white font-black text-base border border-zinc-700 shadow-sm">
                            {r.standard} باترون عادي
                          </span>
                        )}
                        {r.special > 0 && (
                          <span className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 text-sky-400 font-black text-base border border-sky-500/40 shadow-sm">
                            {r.special} باترون سبيشيال (2M+2L)
                          </span>
                        )}
                        {r.superSpecial > 0 && (
                          <span className="px-3.5 py-1.5 rounded-xl bg-violet-500/20 text-violet-400 font-black text-base border border-violet-500/40 shadow-sm">
                            {r.superSpecial} باترون سوبر (2XL+2 2XL)
                          </span>
                        )}
                      </div>
                      {r.note && (
                        <span className="text-xs text-amber-400/90 font-medium flex items-center gap-1 mt-0.5">
                          <Sparkles size={12} /> {r.note}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 font-black bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 size={16} /> المخزن مغطي الطلب بالكامل
                    </span>
                  )}
                </div>
              </div>

              {/* Stacked Layout: Stock on Top (Green), Pending on Bottom (Yellow), Deficit on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* The 2 Stacked Rows */}
                <div className="lg:col-span-9 space-y-3">
                  {/* 🟢 ROW 1: المخزن اليدوي (بالأخضر) */}
                  <div className="bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 sm:w-48">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/50" />
                      <div>
                        <span className="text-base font-black text-emerald-400 block">
                          المخزن اليدوي (أخضر)
                        </span>
                        <span className="text-[11px] text-emerald-500/80 block">
                          اكتب بضاعتك المتاحة
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 justify-end flex-1 flex-wrap">
                      {SIZES.map((sz) => (
                        <div key={sz} className="flex flex-col items-center gap-1.5">
                          <span className="text-xs font-black text-emerald-300 font-mono">
                            مقاس {sz}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={r.stock[sz]}
                            onChange={(e) =>
                              handleStockChange(r.product.id, sz, parseInt(e.target.value) || 0)
                            }
                            className="w-16 sm:w-20 h-12 bg-zinc-950 border-2 border-emerald-500/60 focus:border-emerald-400 text-center text-emerald-300 text-2xl font-black rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-inner transition-all"
                          />
                        </div>
                      ))}

                      <div className="flex flex-col items-center justify-center pl-2 border-r border-emerald-500/20 pr-4 min-w-[75px]">
                        <span className="text-[10px] text-emerald-400 uppercase font-black">
                          إجمالي المخزن
                        </span>
                        <span className="text-2xl font-black text-emerald-400">
                          {r.totalStock}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🟡 ROW 2: البيندينج (بالأصفر) */}
                  <div className="bg-amber-950/20 border-2 border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 sm:w-48">
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
                      <div>
                        <span className="text-base font-black text-amber-400 block">
                          البيندينج (أصفر)
                        </span>
                        <span className="text-[11px] text-amber-500/80 block">
                          المطلوب في الأوردرات
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 justify-end flex-1 flex-wrap">
                      {SIZES.map((sz) => (
                        <div key={sz} className="flex flex-col items-center gap-1.5">
                          <span className="text-xs font-black text-amber-300 font-mono">
                            مقاس {sz}
                          </span>
                          <div className="w-16 sm:w-20 h-12 bg-zinc-950 border-2 border-amber-500/60 flex items-center justify-center text-amber-300 text-2xl font-black rounded-xl shadow-inner">
                            {r.pending[sz]}
                          </div>
                        </div>
                      ))}

                      <div className="flex flex-col items-center justify-center pl-2 border-r border-amber-500/20 pr-4 min-w-[75px]">
                        <span className="text-[10px] text-amber-400 uppercase font-black">
                          إجمالي المطلوب
                        </span>
                        <span className="text-2xl font-black text-amber-400">
                          {r.totalPending}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🔴 Deficit Column (العجز الصافي المطلوب طباعته) */}
                <div className="lg:col-span-3 bg-red-950/20 border-2 border-red-500/30 rounded-2xl p-4 flex flex-col justify-between h-full min-h-[160px]">
                  <div>
                    <span className="text-xs font-black text-red-400 block uppercase tracking-wider mb-2.5">
                      العجز المطلوب طباعته:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {SIZES.map((sz) => (
                        <div
                          key={sz}
                          className="p-2 rounded-xl bg-zinc-950 border border-red-500/20 flex flex-col items-center"
                        >
                          <span className="text-[10px] text-zinc-400 block font-mono font-bold">
                            {sz}
                          </span>
                          <span
                            className={`text-lg font-black ${
                              r.deficit[sz] > 0 ? "text-red-400" : "text-zinc-600"
                            }`}
                          >
                            {r.deficit[sz]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-red-500/20 flex items-baseline justify-between">
                    <span className="text-xs text-zinc-400 font-bold">إجمالي العجز:</span>
                    <span className="text-2xl font-black text-red-400">
                      {r.totalDeficit}{" "}
                      <span className="text-xs text-zinc-400 font-normal">تيشرت</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
