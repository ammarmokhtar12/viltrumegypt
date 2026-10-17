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
  Package,
  ArrowLeftRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

interface ExchangeItem {
  title: string;
  size: string;
  quantity: number;
}

interface ProductPatternRule {
  productId: string;
  hasSpecial: boolean; // 2x M, 2x L
  hasSuperSpecial: boolean; // 2x XL, 2x 2XL
}

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

  // Raw data from DB
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [pendingReplacements, setPendingReplacements] = useState<any[]>([]);

  // User-edited local stock cache: Record<productId_size, quantity>
  const [localStock, setLocalStock] = useState<Record<string, number>>({});
  const [dirtyStock, setDirtyStock] = useState<Record<string, boolean>>({});

  // Pattern capabilities customization per product
  const [customPatternRules, setCustomPatternRules] = useState<Record<string, ProductPatternRule>>({});
  const [showPatternSettings, setShowPatternSettings] = useState(false);

  // Status toggle: only 'pending' orders or also 'confirmed'
  const [includeConfirmed, setIncludeConfirmed] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [includeConfirmed]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const orderStatuses = includeConfirmed ? ["pending", "confirmed"] : ["pending"];

      const [pRes, iRes, oRes, rRes] = await Promise.all([
        supabase.from("products").select("id, title, image_url, is_active").eq("is_active", true).order("title"),
        supabase.from("inventory").select("*"),
        supabase.from("orders").select("id, order_number, status, items, created_at").in("status", orderStatuses),
        supabase.from("replacements").select("id, replacement_number, status, new_items, created_at").neq("status", "delivered"),
      ]);

      const prods = pRes.data || [];
      setProducts(prods);
      setInventory(iRes.data || []);
      setPendingOrders(oRes.data || []);
      setPendingReplacements(rRes.data || []);

      // Build local stock map
      const stockMap: Record<string, number> = {};
      (iRes.data || []).forEach((inv: any) => {
        const key = `${inv.product_id}_${inv.size?.toUpperCase()}`;
        stockMap[key] = Number(inv.quantity) || 0;
      });
      setLocalStock(stockMap);
      setDirtyStock({});

      // Initialize default pattern rules based on product titles
      const rules: Record<string, ProductPatternRule> = {};
      prods.forEach((p: any) => {
        const t = (p.title || "").toUpperCase();

        // Special: 2x M + 2x L
        // Available for: Night Wing short sleeve, Spider Long Sleeve, Red Hood
        const hasSpecialDefault =
          (t.includes("NIGHT WING") && !t.includes("LONG")) ||
          (t.includes("SPIDER") && t.includes("LONG")) ||
          t.includes("RED HOOD");

        // Super Special: 2x XL + 2x 2XL
        // Available for: Spider Long Sleeve, Conquest Short Sleeve, Red Hood, Superior Short Sleeve
        const hasSuperSpecialDefault =
          (t.includes("SPIDER") && t.includes("LONG")) ||
          (t.includes("CONQUEST") && !t.includes("LONG")) ||
          t.includes("RED HOOD") ||
          (t.includes("SUPERIOR") && !t.includes("LONG"));

        rules[p.id] = {
          productId: p.id,
          hasSpecial: hasSpecialDefault,
          hasSuperSpecial: hasSuperSpecialDefault,
        };
      });
      setCustomPatternRules(rules);
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
          alert("تم تحديث وحفظ بيانات المخزن بنجاح ✅");
        }
      }
    } catch (err: any) {
      alert(`خطأ: ${err?.message || err}`);
    } finally {
      setSavingStock(false);
    }
  };

  const togglePatternRule = (productId: string, type: "hasSpecial" | "hasSuperSpecial") => {
    setCustomPatternRules((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [type]: !prev[productId]?.[type],
      },
    }));
  };

  // ─── Mathematical Solver for Pattern Optimization ──────────────────────────
  const planData = useMemo(() => {
    // 1. Accumulate demand from pending orders
    const ordersDemand: Record<string, Record<TargetSize, number>> = {};
    pendingOrders.forEach((o: any) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it: any) => {
        const prod = products.find((p) => p.id === it.product_id || p.title === it.title);
        if (!prod) return;
        const size = normalizeSize(it.size);
        if (!size) return;
        if (!ordersDemand[prod.id]) ordersDemand[prod.id] = { M: 0, L: 0, XL: 0, "2XL": 0 };
        ordersDemand[prod.id][size] += Number(it.quantity) || 1;
      });
    });

    // 2. Accumulate demand from pending replacements
    const replacementsDemand: Record<string, Record<TargetSize, number>> = {};
    pendingReplacements.forEach((r: any) => {
      const items = Array.isArray(r.new_items) ? r.new_items : [];
      items.forEach((it: any) => {
        const prod = products.find((p) => p.id === it.product_id || p.title === it.title);
        if (!prod) return;
        const size = normalizeSize(it.size);
        if (!size) return;
        if (!replacementsDemand[prod.id]) replacementsDemand[prod.id] = { M: 0, L: 0, XL: 0, "2XL": 0 };
        replacementsDemand[prod.id][size] += Number(it.quantity) || 1;
      });
    });

    // 3. Calculate per-product deficit and optimize pattern count
    const productPlans = products.map((prod) => {
      const oDem = ordersDemand[prod.id] || { M: 0, L: 0, XL: 0, "2XL": 0 };
      const rDem = replacementsDemand[prod.id] || { M: 0, L: 0, XL: 0, "2XL": 0 };

      const totalRequired: Record<TargetSize, number> = {
        M: oDem.M + rDem.M,
        L: oDem.L + rDem.L,
        XL: oDem.XL + rDem.XL,
        "2XL": oDem["2XL"] + rDem["2XL"],
      };

      const currentStock: Record<TargetSize, number> = {
        M: localStock[`${prod.id}_M`] || 0,
        L: localStock[`${prod.id}_L`] || 0,
        XL: localStock[`${prod.id}_XL`] || 0,
        "2XL": localStock[`${prod.id}_2XL`] || localStock[`${prod.id}_XXL`] || 0,
      };

      const deficit: Record<TargetSize, number> = {
        M: Math.max(0, totalRequired.M - currentStock.M),
        L: Math.max(0, totalRequired.L - currentStock.L),
        XL: Math.max(0, totalRequired.XL - currentStock.XL),
        "2XL": Math.max(0, totalRequired["2XL"] - currentStock["2XL"]),
      };

      const totalDeficit = deficit.M + deficit.L + deficit.XL + deficit["2XL"];
      const totalReqSum = totalRequired.M + totalRequired.L + totalRequired.XL + totalRequired["2XL"];

      const rule = customPatternRules[prod.id] || {
        productId: prod.id,
        hasSpecial: false,
        hasSuperSpecial: false,
      };

      // Solver: Find optimal count of Standard (S), Special (SP), Super Special (SSP)
      // Standard: 1 M, 1 L, 1 XL, 1 2XL
      // Special: 2 M, 2 L, 0 XL, 0 2XL
      // Super Special: 0 M, 0 L, 2 XL, 2 2XL

      let bestPlan = {
        standard: 0,
        special: 0,
        superSpecial: 0,
        produced: { M: 0, L: 0, XL: 0, "2XL": 0 },
        remainingStock: { ...currentStock },
        wastedShirts: 0,
        reasoning: "",
      };

      if (totalDeficit > 0) {
        // Upper bound search range
        const maxStandard = Math.max(deficit.M, deficit.L, deficit.XL, deficit["2XL"]) + 2;
        const maxSpecial = rule.hasSpecial ? Math.ceil(Math.max(deficit.M, deficit.L) / 2) + 2 : 0;
        const maxSuper = rule.hasSuperSpecial ? Math.ceil(Math.max(deficit.XL, deficit["2XL"]) / 2) + 2 : 0;

        let minPenalty = Infinity;
        let chosen = { s: 0, sp: 0, ssp: 0 };

        for (let s = 0; s <= maxStandard; s++) {
          for (let sp = 0; sp <= maxSpecial; sp++) {
            for (let ssp = 0; ssp <= maxSuper; ssp++) {
              const prodM = s + sp * 2;
              const prodL = s + sp * 2;
              const prodXL = s + ssp * 2;
              const prod2XL = s + ssp * 2;

              // Check if all deficits are satisfied
              if (
                prodM >= deficit.M &&
                prodL >= deficit.L &&
                prodXL >= deficit.XL &&
                prod2XL >= deficit["2XL"]
              ) {
                // Surplus produced above deficit
                const surplusM = prodM - deficit.M;
                const surplusL = prodL - deficit.L;
                const surplusXL = prodXL - deficit.XL;
                const surplus2XL = prod2XL - deficit["2XL"];
                const totalSurplus = surplusM + surplusL + surplusXL + surplus2XL;
                const totalPatterns = s + sp + ssp;

                // Penalize total surplus heavily, and slightly penalize number of patterns
                const penalty = totalSurplus * 10 + totalPatterns;

                if (penalty < minPenalty) {
                  minPenalty = penalty;
                  chosen = { s, sp, ssp };
                }
              }
            }
          }
        }

        const prodM = chosen.s + chosen.sp * 2;
        const prodL = chosen.s + chosen.sp * 2;
        const prodXL = chosen.s + chosen.ssp * 2;
        const prod2XL = chosen.s + chosen.ssp * 2;

        const produced = { M: prodM, L: prodL, XL: prodXL, "2XL": prod2XL };
        const remainingStock = {
          M: currentStock.M + prodM - totalRequired.M,
          L: currentStock.L + prodL - totalRequired.L,
          XL: currentStock.XL + prodXL - totalRequired.XL,
          "2XL": currentStock["2XL"] + prod2XL - totalRequired["2XL"],
        };

        const wastedShirts =
          Math.max(0, prodM - deficit.M) +
          Math.max(0, prodL - deficit.L) +
          Math.max(0, prodXL - deficit.XL) +
          Math.max(0, prod2XL - deficit["2XL"]);

        // Generate intelligent Arabic reasoning
        let reasoning = "";
        const smallDeficit = deficit.M + deficit.L;
        const bigDeficit = deficit.XL + deficit["2XL"];

        if (chosen.sp > 0 && chosen.ssp === 0 && chosen.s === 0) {
          reasoning = `🎯 المخزن يغطي المقاسات الكبيرة والمطلوب مقاسات صغيرة فقط (M, L) -> تم اختيار ${chosen.sp} باترون سبيشيال لتفادي تراكم المقاسات الكبيرة.`;
        } else if (chosen.ssp > 0 && chosen.sp === 0 && chosen.s === 0) {
          reasoning = `⚡ المخزن يغطي المقاسات الصغيرة والمطلوب مقاسات كبيرة فقط (XL, 2XL) -> تم اختيار ${chosen.ssp} باترون سوبر سبيشيال لتفادي هدر المقاسات الصغيرة.`;
        } else if (chosen.sp > 0 || chosen.ssp > 0) {
          reasoning = `✨ تم دمج الباترونات (${chosen.s > 0 ? `${chosen.s} عادي + ` : ""}${chosen.sp > 0 ? `${chosen.sp} سبيشيال + ` : ""}${chosen.ssp > 0 ? `${chosen.ssp} سوبر سبيشيال` : ""}) لتحقيق أقل فائض قماش ممكن.`;
        } else if (smallDeficit > 0 && bigDeficit === 0 && !rule.hasSpecial) {
          reasoning = `💡 ملاحظة: مطلوب مقاسات صغيرة فقط ولا يوجد باترون سبيشيال مفعل لهذا الموديل. تم استخدام ${chosen.s} باترون عادي (يمكنك تفعيل سبيشيال إذا كان الباترون متوفراً لديك).`;
        } else if (bigDeficit > 0 && smallDeficit === 0 && !rule.hasSuperSpecial) {
          reasoning = `💡 ملاحظة: مطلوب مقاسات كبيرة فقط ولا يوجد باترون سوبر سبيشيال لهذا الموديل. تم استخدام ${chosen.s} باترون عادي.`;
        } else {
          reasoning = `✅ طلب متوازن عبر كل المقاسات -> تم استخدام ${chosen.s} باترون عادي.`;
        }

        bestPlan = {
          standard: chosen.s,
          special: chosen.sp,
          superSpecial: chosen.ssp,
          produced,
          remainingStock,
          wastedShirts,
          reasoning,
        };
      }

      return {
        product: prod,
        ordersDemand: oDem,
        replacementsDemand: rDem,
        totalRequired,
        currentStock,
        deficit,
        totalDeficit,
        totalReqSum,
        rule,
        plan: bestPlan,
      };
    });

    // Summary totals across all products
    let totalPendingOrdersUnits = 0;
    let totalReplacementsUnits = 0;
    let totalGrossRequired = 0;
    let totalCurrentStock = 0;
    let totalNetDeficit = 0;
    let totalStandardPatterns = 0;
    let totalSpecialPatterns = 0;
    let totalSuperSpecialPatterns = 0;

    productPlans.forEach((p) => {
      totalPendingOrdersUnits += p.ordersDemand.M + p.ordersDemand.L + p.ordersDemand.XL + p.ordersDemand["2XL"];
      totalReplacementsUnits += p.replacementsDemand.M + p.replacementsDemand.L + p.replacementsDemand.XL + p.replacementsDemand["2XL"];
      totalGrossRequired += p.totalReqSum;
      totalCurrentStock += p.currentStock.M + p.currentStock.L + p.currentStock.XL + p.currentStock["2XL"];
      totalNetDeficit += p.totalDeficit;
      totalStandardPatterns += p.plan.standard;
      totalSpecialPatterns += p.plan.special;
      totalSuperSpecialPatterns += p.plan.superSpecial;
    });

    return {
      productPlans,
      summary: {
        totalPendingOrdersUnits,
        totalReplacementsUnits,
        totalGrossRequired,
        totalCurrentStock,
        totalNetDeficit,
        totalStandardPatterns,
        totalSpecialPatterns,
        totalSuperSpecialPatterns,
        grandTotalPatterns: totalStandardPatterns + totalSpecialPatterns + totalSuperSpecialPatterns,
      },
    };
  }, [products, pendingOrders, pendingReplacements, localStock, customPatternRules]);

  // Filtered product plans
  const filteredProductPlans = useMemo(() => {
    return planData.productPlans.filter((p) =>
      p.product.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [planData.productPlans, search]);

  // Copy WhatsApp message for print workshop
  const handleCopyWhatsApp = () => {
    const plansWithPrint = planData.productPlans.filter(
      (p) => p.plan.standard > 0 || p.plan.special > 0 || p.plan.superSpecial > 0
    );

    let msg = `🔴 *أمر طباعة الباترونات والتشغيل — VILTRUM EGYPT*\n`;
    msg += `📅 *التاريخ:* ${new Date().toLocaleDateString("ar-EG")}\n`;
    msg += `📦 *إجمالي الباترونات المطلوب طباعتها:* ${planData.summary.grandTotalPatterns} باترون (${planData.summary.grandTotalPatterns * 4} تيشرت)\n`;
    msg += `  • عادي (M, L, XL, 2XL): ${planData.summary.totalStandardPatterns} باترون\n`;
    msg += `  • سبيشيال (2M, 2L): ${planData.summary.totalSpecialPatterns} باترون\n`;
    msg += `  • سوبر سبيشيال (2XL, 2 2XL): ${planData.summary.totalSuperSpecialPatterns} باترون\n\n`;

    msg += `📋 *تفصيل المطلوب طباعته لكل موديل:*\n`;

    plansWithPrint.forEach((p) => {
      msg += `\n👕 *${p.product.title}*\n`;
      if (p.plan.standard > 0) msg += `   - باترون عادي (M,L,XL,2XL): *${p.plan.standard}* باترون\n`;
      if (p.plan.special > 0) msg += `   - باترون سبيشيال (2M, 2L): *${p.plan.special}* باترون\n`;
      if (p.plan.superSpecial > 0) msg += `   - باترون سوبر سبيشيال (2XL, 2 2XL): *${p.plan.superSpecial}* باترون\n`;
      msg += `   -> إجمالي الناتج: M: ${p.plan.produced.M} | L: ${p.plan.produced.L} | XL: ${p.plan.produced.XL} | 2XL: ${p.plan.produced["2XL"]} (${(p.plan.standard + p.plan.special + p.plan.superSpecial) * 4} تيشرت)\n`;
    });

    msg += `\n✅ يرجى فحص ملفات الطباعة والبدء فوراً.`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(msg).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  // Print A4 Sheet
  const handlePrintSheet = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const plansWithPrint = planData.productPlans.filter(
      (p) => p.plan.standard > 0 || p.plan.special > 0 || p.plan.superSpecial > 0
    );

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>أمر طباعة الباترونات - Viltrum Egypt</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #111; }
          .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0; font-size: 22px; color: #d00; }
          .badge-num { font-size: 24px; font-weight: 900; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th, td { border: 1px solid #333; padding: 8px 10px; text-align: center; }
          th { background: #222; color: #fff; }
          .text-right { text-align: right; font-weight: bold; }
          .total-row { background: #f0f0f0; font-weight: 900; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>VILTRUM EGYPT — أمر طباعة الباترونات (Cutting & Printing Order)</h1>
            <div>التاريخ: ${new Date().toLocaleDateString("ar-EG")} · مبني على الأوردرات المعلقة والاستبدالات بعد خصم المخزن</div>
          </div>
          <div>
            <div>إجمالي الباترونات المطلوب طباعتها</div>
            <div class="badge-num">${planData.summary.grandTotalPatterns} باترون (${planData.summary.grandTotalPatterns * 4} قطعة)</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-right">اسم الموديل</th>
              <th>باترون عادي<br>(M, L, XL, 2XL)</th>
              <th>باترون سبيشيال<br>(2M, 2L)</th>
              <th>باترون سوبر سبيشيال<br>(2XL, 2 2XL)</th>
              <th>إجمالي الباترونات</th>
              <th>إجمالي التيشرتات الناتجة</th>
            </tr>
          </thead>
          <tbody>
            ${plansWithPrint
              .map(
                (p) => `
              <tr>
                <td class="text-right">${p.product.title}</td>
                <td style="font-weight:bold;">${p.plan.standard > 0 ? p.plan.standard : "—"}</td>
                <td style="font-weight:bold; color:#0284c7;">${p.plan.special > 0 ? p.plan.special : "—"}</td>
                <td style="font-weight:bold; color:#7c3aed;">${p.plan.superSpecial > 0 ? p.plan.superSpecial : "—"}</td>
                <td style="font-weight:900;">${p.plan.standard + p.plan.special + p.plan.superSpecial}</td>
                <td style="font-weight:900; color:#d00;">${(p.plan.standard + p.plan.special + p.plan.superSpecial) * 4}</td>
              </tr>
            `
              )
              .join("")}
            <tr class="total-row">
              <td class="text-right">الإجمالي الكلي</td>
              <td>${planData.summary.totalStandardPatterns}</td>
              <td style="color:#0284c7;">${planData.summary.totalSpecialPatterns}</td>
              <td style="color:#7c3aed;">${planData.summary.totalSuperSpecialPatterns}</td>
              <td style="font-size:16px;">${planData.summary.grandTotalPatterns} باترون</td>
              <td style="font-size:16px; color:#d00;">${planData.summary.grandTotalPatterns * 4} تيشرت</td>
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
        <div className="w-10 h-10 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const hasUnsavedStock = Object.keys(dirtyStock).length > 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em]">
              Production Intelligence
            </span>
            <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
              حساب الباترونات الذكي
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            خطة طباعة الباترونات والمخزن
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            النظام يحسب تلقائياً المطلوب طباعته بناءً على الأوردرات المعلقة والاستبدالات، ويخصم المخزون المتوفر، ثم يقترح الباترون الأنسب (عادي، سبيشيال، سوبر سبيشيال) لتوفير القماش وعدم تراكم مقاسات راكدة.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status scope toggle */}
          <button
            onClick={() => setIncludeConfirmed(!includeConfirmed)}
            className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
              includeConfirmed
                ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
            }`}
            title="التبديل بين احتساب البيندينج فقط، أو إضافة المؤكد"
          >
            {includeConfirmed ? "الأوردرات: المعلقة + المؤكدة" : "الأوردرات: المعلقة فقط (Pending)"}
          </button>

          {/* Refresh */}
          <button
            onClick={fetchAll}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw size={15} />
          </button>

          {/* WhatsApp Copy */}
          <button
            onClick={handleCopyWhatsApp}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "تم النسخ!" : "نسخ لواتساب المطبعة"}</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrintSheet}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-xl text-xs font-bold transition-all"
          >
            <Printer size={14} />
            <span>طباعة كشف الباترونات</span>
          </button>

          {/* Save Stock Button */}
          <button
            onClick={handleSaveStock}
            disabled={savingStock || !hasUnsavedStock}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              hasUnsavedStock
                ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 animate-pulse"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
            }`}
          >
            <Save size={14} />
            <span>{savingStock ? "جاري الحفظ..." : hasUnsavedStock ? "حفظ تعديلات المخزن *" : "المخزن محفوظ"}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Package size={11} className="text-amber-400" />
            أوردرات معلقة
          </p>
          <p className="text-xl font-black text-amber-400">
            {planData.summary.totalPendingOrdersUnits}{" "}
            <span className="text-[11px] font-normal text-zinc-400">تيشرت</span>
          </p>
          <p className="text-[10px] text-zinc-500">
            {pendingOrders.length} أوردر {includeConfirmed ? "(معلق ومؤكد)" : "Pending"}
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <ArrowLeftRight size={11} className="text-purple-400" />
            استبدالات معلقة
          </p>
          <p className="text-xl font-black text-purple-400">
            {planData.summary.totalReplacementsUnits}{" "}
            <span className="text-[11px] font-normal text-zinc-400">تيشرت</span>
          </p>
          <p className="text-[10px] text-zinc-500">
            {pendingReplacements.length} طلب استبدال
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <span>إجمالي المطلوب</span>
          </p>
          <p className="text-xl font-black text-white">
            {planData.summary.totalGrossRequired}{" "}
            <span className="text-[11px] font-normal text-zinc-400">تيشرت</span>
          </p>
          <p className="text-[10px] text-zinc-500">الطلب الكلي قبل خصم المخزن</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="text-emerald-400">رصيد المخزن الفعلي</span>
          </p>
          <p className="text-xl font-black text-emerald-400">
            {planData.summary.totalCurrentStock}{" "}
            <span className="text-[11px] font-normal text-zinc-400">تيشرت</span>
          </p>
          <p className="text-[10px] text-zinc-500">متاح وجاهز للتسليم</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="text-red-400">العجز الفعلي للطباعة</span>
          </p>
          <p className="text-xl font-black text-red-400">
            {planData.summary.totalNetDeficit}{" "}
            <span className="text-[11px] font-normal text-zinc-400">تيشرت</span>
          </p>
          <p className="text-[10px] text-zinc-500">بعد خصم رصيد المخزن</p>
        </div>

        <div className="bg-zinc-900/60 border border-red-500/30 rounded-2xl p-4 space-y-1 bg-gradient-to-br from-red-950/30 to-zinc-900/60">
          <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Layers size={11} />
            إجمالي الباترونات المطلوبة
          </p>
          <p className="text-2xl font-black text-white">
            {planData.summary.grandTotalPatterns}{" "}
            <span className="text-xs text-red-400 font-bold">باترون</span>
          </p>
          <p className="text-[10px] text-zinc-400">
            = {planData.summary.grandTotalPatterns * 4} تيشرت مطبوع
          </p>
        </div>
      </div>

      {/* Pattern Rules & Capabilities Toggle */}
      <div className="bg-zinc-900/40 border border-zinc-800/70 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-red-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              قواعد الباترونات المتاحة لكل موديل (Pattern Setup)
            </h3>
          </div>
          <button
            onClick={() => setShowPatternSettings(!showPatternSettings)}
            className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
          >
            <span>{showPatternSettings ? "إخفاء الإعدادات" : "عرض وتعديل أنواع الباترونات لكل موديل"}</span>
            {showPatternSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-zinc-400 pt-1">
          <div className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl">
            <strong className="text-white block mb-0.5">1. الباترون العادي (Standard):</strong>
            <span>4 تيشرتات (M, L, XL, 2XL) — متوفر لكل أنواع التيشرتات تلقائياً.</span>
          </div>
          <div className="p-2.5 bg-zinc-950/60 border border-sky-500/20 rounded-xl">
            <strong className="text-sky-400 block mb-0.5">2. باترون سبيشيال (Special):</strong>
            <span>4 تيشرتات صغيرة (2x M + 2x L) — مفعل لـ: Nightwing Short, Spider Long, Red Hood.</span>
          </div>
          <div className="p-2.5 bg-zinc-950/60 border border-violet-500/20 rounded-xl">
            <strong className="text-violet-400 block mb-0.5">3. باترون سوبر سبيشيال (Super Special):</strong>
            <span>4 تيشرتات كبيرة (2x XL + 2x 2XL) — مفعل لـ: Spider Long, Conquest Short, Red Hood, Superior Short.</span>
          </div>
        </div>

        {showPatternSettings && (
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <p className="text-[11px] text-zinc-400">
              يمكنك تخصيص أو تفعيل باترونات إضافية لأي موديل إذا قمت بتجهيزها:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {products.map((p) => {
                const rule = customPatternRules[p.id];
                return (
                  <div key={p.id} className="p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate max-w-[150px]" title={p.title}>
                      {p.title}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        onClick={() => togglePatternRule(p.id, "hasSpecial")}
                        className={`px-2 py-1 rounded font-bold transition-all ${
                          rule?.hasSpecial
                            ? "bg-sky-500 text-white"
                            : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        سبيشيال (2M+2L)
                      </button>
                      <button
                        onClick={() => togglePatternRule(p.id, "hasSuperSpecial")}
                        className={`px-2 py-1 rounded font-bold transition-all ${
                          rule?.hasSuperSpecial
                            ? "bg-violet-500 text-white"
                            : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        سوبر (2XL+2 2XL)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Table: Inventory + Demand + Pattern Plan */}
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-red-400" />
              <span>جدول تسجيل المخزن وتحليل خطة الباترونات</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              عدل كميات المخزن مباشرة في الخانات الزرقاء، والنظام سيعيد حساب العجز والباترونات فوراً.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="بحث في الموديلات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/40 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Product Plans List */}
        <div className="space-y-4">
          {filteredProductPlans.map((item) => {
            const hasPrint =
              item.plan.standard > 0 || item.plan.special > 0 || item.plan.superSpecial > 0;

            return (
              <div
                key={item.product.id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all ${
                  hasPrint
                    ? "bg-zinc-950/80 border-red-500/30 shadow-md shadow-red-500/5"
                    : "bg-zinc-950/40 border-zinc-800/60 opacity-80 hover:opacity-100"
                }`}
              >
                {/* Product Title Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-red-400 font-bold">
                      👕
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.product.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        <span>الباترونات المتاحة:</span>
                        <span className="text-zinc-300">عادي (M,L,XL,2XL)</span>
                        {item.rule.hasSpecial && (
                          <span className="text-sky-400 font-bold">· سبيشيال (2M,2L)</span>
                        )}
                        {item.rule.hasSuperSpecial && (
                          <span className="text-violet-400 font-bold">· سوبر سبيشيال (2XL,2 2XL)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deficit badge */}
                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                        العجز الفعلي للطباعة
                      </span>
                      <span className={`text-base font-black ${item.totalDeficit > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {item.totalDeficit > 0 ? `${item.totalDeficit} تيشرت ناقص` : "المخزن يغطي الطلب"}
                      </span>
                    </div>

                    {/* Proposed Patterns Count */}
                    {hasPrint && (
                      <div className="bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl text-center">
                        <span className="text-[10px] text-red-400 font-bold block">المقترح طباعته</span>
                        <span className="text-base font-black text-white">
                          {item.plan.standard + item.plan.special + item.plan.superSpecial} باترون
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sizing Matrix: Pending Orders + Replacements + Stock + Deficit */}
                <div className="overflow-x-auto pt-3">
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className="text-zinc-500 text-[10px] uppercase font-bold border-b border-zinc-800/40">
                        <th className="py-2 pr-2">البيان / المقاس</th>
                        <th className="py-2 px-3 text-center text-teal-400">مقاس M</th>
                        <th className="py-2 px-3 text-center text-sky-400">مقاس L</th>
                        <th className="py-2 px-3 text-center text-amber-400">مقاس XL</th>
                        <th className="py-2 px-3 text-center text-rose-400">مقاس 2XL</th>
                        <th className="py-2 pl-2 text-center text-white">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30 text-xs">
                      {/* 1. Pending Orders */}
                      <tr className="hover:bg-zinc-900/20">
                        <td className="py-2 pr-2 text-zinc-400 font-medium flex items-center gap-1.5">
                          <Package size={12} className="text-amber-400" />
                          <span>أوردرات معلقة (Pending)</span>
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-white">{item.ordersDemand.M || 0}</td>
                        <td className="py-2 px-3 text-center font-bold text-white">{item.ordersDemand.L || 0}</td>
                        <td className="py-2 px-3 text-center font-bold text-white">{item.ordersDemand.XL || 0}</td>
                        <td className="py-2 px-3 text-center font-bold text-white">{item.ordersDemand["2XL"] || 0}</td>
                        <td className="py-2 pl-2 text-center font-black text-amber-400">
                          {item.ordersDemand.M + item.ordersDemand.L + item.ordersDemand.XL + item.ordersDemand["2XL"]}
                        </td>
                      </tr>

                      {/* 2. Replacements */}
                      <tr className="hover:bg-zinc-900/20">
                        <td className="py-2 pr-2 text-zinc-400 font-medium flex items-center gap-1.5">
                          <ArrowLeftRight size={12} className="text-purple-400" />
                          <span>استبدالات معلقة (Replacements)</span>
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-purple-300">{item.replacementsDemand.M || 0}</td>
                        <td className="py-2 px-3 text-center font-bold text-purple-300">{item.replacementsDemand.L || 0}</td>
                        <td className="py-2 px-3 text-center font-bold text-purple-300">{item.replacementsDemand.XL || 0}</td>
                        <td className="py-2 px-3 text-center font-bold text-purple-300">{item.replacementsDemand["2XL"] || 0}</td>
                        <td className="py-2 pl-2 text-center font-black text-purple-400">
                          {item.replacementsDemand.M + item.replacementsDemand.L + item.replacementsDemand.XL + item.replacementsDemand["2XL"]}
                        </td>
                      </tr>

                      {/* 3. Total Required */}
                      <tr className="bg-zinc-900/40 font-bold text-white">
                        <td className="py-2 pr-2 text-zinc-300">
                          = إجمالي المطلوب الفعلي
                        </td>
                        <td className="py-2 px-3 text-center text-teal-300">{item.totalRequired.M}</td>
                        <td className="py-2 px-3 text-center text-sky-300">{item.totalRequired.L}</td>
                        <td className="py-2 px-3 text-center text-amber-300">{item.totalRequired.XL}</td>
                        <td className="py-2 px-3 text-center text-rose-300">{item.totalRequired["2XL"]}</td>
                        <td className="py-2 pl-2 text-center text-white font-extrabold">{item.totalReqSum}</td>
                      </tr>

                      {/* 4. Current Stock (INLINE EDITABLE) */}
                      <tr className="bg-blue-950/20 border-y border-blue-500/20">
                        <td className="py-2 pr-2 font-bold text-blue-300 flex items-center gap-1.5">
                          <span>📦 رصيد المخزن الحالي (قابل للتعديل)</span>
                        </td>
                        {SIZES.map((sz) => {
                          const stockVal = item.currentStock[sz];
                          return (
                            <td key={sz} className="py-1.5 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={stockVal}
                                onChange={(e) =>
                                  handleStockChange(
                                    item.product.id,
                                    sz,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-14 bg-zinc-900 border border-blue-500/40 rounded-lg text-center font-black text-white text-xs py-1 focus:outline-none focus:border-blue-400 focus:bg-zinc-950"
                              />
                            </td>
                          );
                        })}
                        <td className="py-2 pl-2 text-center font-black text-blue-400">
                          {item.currentStock.M + item.currentStock.L + item.currentStock.XL + item.currentStock["2XL"]}
                        </td>
                      </tr>

                      {/* 5. Deficit */}
                      <tr className="bg-red-950/20 font-black">
                        <td className="py-2 pr-2 text-red-400 font-bold">
                          = العجز المطلوب طباعته (Deficit)
                        </td>
                        <td className="py-2 px-3 text-center text-teal-400">{item.deficit.M}</td>
                        <td className="py-2 px-3 text-center text-sky-400">{item.deficit.L}</td>
                        <td className="py-2 px-3 text-center text-amber-400">{item.deficit.XL}</td>
                        <td className="py-2 px-3 text-center text-rose-400">{item.deficit["2XL"]}</td>
                        <td className="py-2 pl-2 text-center text-red-400 text-sm font-black">
                          {item.totalDeficit}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* AI / Smart Decision Box */}
                <div className="mt-4 p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-400" />
                      <strong className="text-white">توصية الطباعة الذكية:</strong>
                      <span className="text-zinc-300">{item.plan.reasoning}</span>
                    </div>

                    {/* Breakdown of patterns to print */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.plan.standard > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-white font-bold border border-zinc-700">
                          عادي: {item.plan.standard} باترون
                        </span>
                      )}
                      {item.plan.special > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30">
                          سبيشيال (2M+2L): {item.plan.special} باترون
                        </span>
                      )}
                      {item.plan.superSpecial > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-400 font-bold border border-violet-500/30">
                          سوبر سبيشيال (2XL+2 2XL): {item.plan.superSpecial} باترون
                        </span>
                      )}
                      {!hasPrint && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 size={12} /> لا حاجة للطباعة
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resulting Output & Projected Residual Stock */}
                  {hasPrint && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
                      <div>
                        <span>الإنتاج الناتج من الطباعة: </span>
                        <strong className="text-white">
                          M: {item.plan.produced.M} · L: {item.plan.produced.L} · XL: {item.plan.produced.XL} · 2XL: {item.plan.produced["2XL"]}
                        </strong>
                        <span className="text-zinc-500 ml-1">
                          (إجمالي {(item.plan.standard + item.plan.special + item.plan.superSpecial) * 4} تيشرت)
                        </span>
                      </div>

                      <div>
                        <span>المخزون المتوقع بعد تسليم الأوردرات: </span>
                        <strong className="text-emerald-400">
                          M: {item.plan.remainingStock.M} · L: {item.plan.remainingStock.L} · XL: {item.plan.remainingStock.XL} · 2XL: {item.plan.remainingStock["2XL"]}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
