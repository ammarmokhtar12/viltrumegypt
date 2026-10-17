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
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
  Edit3,
  RotateCcw,
} from "lucide-react";

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

  // User-edited demand override cache: Record<productId_size, quantity>
  const [customDemand, setCustomDemand] = useState<Record<string, number>>({});
  const [demandMode, setDemandMode] = useState<"auto" | "manual">("auto");

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
      const invs = iRes.data || [];
      const orders = oRes.data || [];
      const replacements = rRes.data || [];

      setProducts(prods);
      setInventory(invs);
      setPendingOrders(orders);
      setPendingReplacements(replacements);

      // Build local stock map
      const stockMap: Record<string, number> = {};
      invs.forEach((inv: any) => {
        const key = `${inv.product_id}_${inv.size?.toUpperCase()}`;
        stockMap[key] = Number(inv.quantity) || 0;
      });
      setLocalStock(stockMap);
      setDirtyStock({});

      // Build initial auto demand
      const autoDemandMap: Record<string, number> = {};
      orders.forEach((o: any) => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach((it: any) => {
          const prod = prods.find((p) => p.id === it.product_id || p.title === it.title);
          if (!prod) return;
          const size = normalizeSize(it.size);
          if (!size) return;
          const k = `${prod.id}_${size}`;
          autoDemandMap[k] = (autoDemandMap[k] || 0) + (Number(it.quantity) || 1);
        });
      });

      replacements.forEach((r: any) => {
        const items = Array.isArray(r.new_items) ? r.new_items : [];
        items.forEach((it: any) => {
          const prod = prods.find((p) => p.id === it.product_id || p.title === it.title);
          if (!prod) return;
          const size = normalizeSize(it.size);
          if (!size) return;
          const k = `${prod.id}_${size}`;
          autoDemandMap[k] = (autoDemandMap[k] || 0) + (Number(it.quantity) || 1);
        });
      });

      setCustomDemand(autoDemandMap);

      // Initialize default pattern rules based on product titles
      const rules: Record<string, ProductPatternRule> = {};
      prods.forEach((p: any) => {
        const t = (p.title || "").toUpperCase();

        const hasSpecialDefault =
          (t.includes("NIGHT WING") && !t.includes("LONG")) ||
          (t.includes("SPIDER") && t.includes("LONG")) ||
          t.includes("RED HOOD");

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

  // Stock Handlers
  const handleStockChange = (productId: string, size: string, value: number) => {
    const key = `${productId}_${size}`;
    const qty = Math.max(0, value);
    setLocalStock((prev) => ({ ...prev, [key]: qty }));
    setDirtyStock((prev) => ({ ...prev, [key]: true }));
  };

  const handleClearAllStock = () => {
    if (!confirm("هل أنت متأكد من تصفير رصيد المخزن للبدء بجرد يدوي جديد من الصفر؟")) return;
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

  const handleResetStockFromDb = () => {
    const stockMap: Record<string, number> = {};
    inventory.forEach((inv: any) => {
      const key = `${inv.product_id}_${inv.size?.toUpperCase()}`;
      stockMap[key] = Number(inv.quantity) || 0;
    });
    setLocalStock(stockMap);
    setDirtyStock({});
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
          alert("تم حفظ وتحديث رصيد المخزن في قاعدة البيانات بنجاح ✅");
        }
      }
    } catch (err: any) {
      alert(`خطأ: ${err?.message || err}`);
    } finally {
      setSavingStock(false);
    }
  };

  // Demand Handlers (Manual Demand Input)
  const handleDemandChange = (productId: string, size: string, value: number) => {
    const key = `${productId}_${size}`;
    const qty = Math.max(0, value);
    setCustomDemand((prev) => ({ ...prev, [key]: qty }));
  };

  const handleClearAllDemand = () => {
    const cleared: Record<string, number> = {};
    products.forEach((p) => {
      SIZES.forEach((sz) => {
        cleared[`${p.id}_${sz}`] = 0;
      });
    });
    setCustomDemand(cleared);
    setDemandMode("manual");
  };

  const handleResetDemandToOrders = () => {
    const autoDemandMap: Record<string, number> = {};
    pendingOrders.forEach((o: any) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it: any) => {
        const prod = products.find((p) => p.id === it.product_id || p.title === it.title);
        if (!prod) return;
        const size = normalizeSize(it.size);
        if (!size) return;
        const k = `${prod.id}_${size}`;
        autoDemandMap[k] = (autoDemandMap[k] || 0) + (Number(it.quantity) || 1);
      });
    });

    pendingReplacements.forEach((r: any) => {
      const items = Array.isArray(r.new_items) ? r.new_items : [];
      items.forEach((it: any) => {
        const prod = products.find((p) => p.id === it.product_id || p.title === it.title);
        if (!prod) return;
        const size = normalizeSize(it.size);
        if (!size) return;
        const k = `${prod.id}_${size}`;
        autoDemandMap[k] = (autoDemandMap[k] || 0) + (Number(it.quantity) || 1);
      });
    });

    setCustomDemand(autoDemandMap);
    setDemandMode("auto");
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
    const productPlans = products.map((prod) => {
      const totalRequired: Record<TargetSize, number> = {
        M: customDemand[`${prod.id}_M`] || 0,
        L: customDemand[`${prod.id}_L`] || 0,
        XL: customDemand[`${prod.id}_XL`] || 0,
        "2XL": customDemand[`${prod.id}_2XL`] || 0,
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

              if (
                prodM >= deficit.M &&
                prodL >= deficit.L &&
                prodXL >= deficit.XL &&
                prod2XL >= deficit["2XL"]
              ) {
                const surplusM = prodM - deficit.M;
                const surplusL = prodL - deficit.L;
                const surplusXL = prodXL - deficit.XL;
                const surplus2XL = prod2XL - deficit["2XL"];
                const totalSurplus = surplusM + surplusL + surplusXL + surplus2XL;
                const totalPatterns = s + sp + ssp;

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
          reasoning = `💡 مطلوب مقاسات صغيرة فقط ولا يوجد باترون سبيشيال مفعل لهذا الموديل. تم استخدام ${chosen.s} باترون عادي (يمكنك تفعيل سبيشيال للموديل إذا كان متاحاً).`;
        } else if (bigDeficit > 0 && smallDeficit === 0 && !rule.hasSuperSpecial) {
          reasoning = `💡 مطلوب مقاسات كبيرة فقط ولا يوجد باترون سوبر سبيشيال لهذا الموديل. تم استخدام ${chosen.s} باترون عادي.`;
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
        totalRequired,
        currentStock,
        deficit,
        totalDeficit,
        totalReqSum,
        rule,
        plan: bestPlan,
      };
    });

    let totalGrossRequired = 0;
    let totalCurrentStock = 0;
    let totalNetDeficit = 0;
    let totalStandardPatterns = 0;
    let totalSpecialPatterns = 0;
    let totalSuperSpecialPatterns = 0;

    productPlans.forEach((p) => {
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
        totalGrossRequired,
        totalCurrentStock,
        totalNetDeficit,
        totalStandardPatterns,
        totalSpecialPatterns,
        totalSuperSpecialPatterns,
        grandTotalPatterns: totalStandardPatterns + totalSpecialPatterns + totalSuperSpecialPatterns,
      },
    };
  }, [products, customDemand, localStock, customPatternRules]);

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
            <div>التاريخ: ${new Date().toLocaleDateString("ar-EG")} · مبني على الكميات المدخلة بعد خصم المخزن</div>
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
    <div className="space-y-6 pb-20">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em]">
              Production Intelligence
            </span>
            <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
              إدخال يدوي وحساب ذكي
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            نظام جرد البضاعة وحساب الباترونات
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            سجل بضاعة المخزن يدوياً أو عدلها مباشرة في الخانات الزرقاء، وسجل الكميات المطلوبة في الخانات الصفراء، وسيقوم النظام فوراً بحساب العجز والباترونات الأنسب (عادي، سبيشيال، سوبر سبيشيال) في لحظتها.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
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
                ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 animate-pulse cursor-pointer"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
            }`}
          >
            <Save size={14} />
            <span>{savingStock ? "جاري الحفظ..." : hasUnsavedStock ? "حفظ البضاعة في المخزن *" : "المخزن محفوظ"}</span>
          </button>
        </div>
      </div>

      {/* Control Strip: Stock & Demand Mode Selectors */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Demand Mode Switch */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-zinc-400 font-bold">مصدر الطلبات (المطلوب تصنيعه):</span>
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 text-[11px]">
            <button
              onClick={handleResetDemandToOrders}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                demandMode === "auto"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              🤖 سحب آلي (أوردرات البيندينج + الاستبدالات)
            </button>
            <button
              onClick={() => setDemandMode("manual")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                demandMode === "manual"
                  ? "bg-amber-500 text-black font-extrabold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ✍️ إدخال يدوي مخصص بالكامل
            </button>
          </div>

          {demandMode === "manual" && (
            <button
              onClick={handleClearAllDemand}
              className="text-[11px] text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} />
              <span>تصفير المطلوب</span>
            </button>
          )}
        </div>

        {/* Stock Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs text-zinc-400 font-bold">إدارة بضاعة المخزن:</span>
          <button
            onClick={handleClearAllStock}
            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-950 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-xl text-[11px] font-bold transition-all"
            title="تصفير كل أرقام المخزن للبدء بجرد يدوي جديد"
          >
            <RotateCcw size={12} />
            <span>تصفير المخزن لجرد يدوي</span>
          </button>
          <button
            onClick={handleResetStockFromDb}
            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl text-[11px] font-bold transition-all"
            title="استرجاع الأرقام المسجلة في قاعدة البيانات"
          >
            <RefreshCw size={12} />
            <span>استرجاع رصيد السيستم</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-xl p-3.5 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Package size={11} className="text-amber-400" />
            إجمالي المطلوب تصنيعه
          </p>
          <p className="text-xl font-black text-amber-400">
            {planData.summary.totalGrossRequired}{" "}
            <span className="text-xs text-zinc-500 font-normal">تيشرت</span>
          </p>
          <p className="text-[10px] text-zinc-500">
            {demandMode === "auto" ? "مسحوب من الأوردرات والاستبدالات" : "مدخل يدوياً من قبلك"}
          </p>
        </div>

        <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-xl p-3.5 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="text-blue-400">رصيد بضاعة المخزن (المتاح)</span>
          </p>
          <p className="text-xl font-black text-blue-400">
            {planData.summary.totalCurrentStock}{" "}
            <span className="text-xs text-zinc-500 font-normal">تيشرت</span>
          </p>
          <p className="text-[10px] text-zinc-500">
            {hasUnsavedStock ? "يوجد تعديلات غير محفوظة *" : "جاهز ومسجل"}
          </p>
        </div>

        <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-xl p-3.5 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="text-red-400">العجز المطلوب طباعته</span>
          </p>
          <p className="text-xl font-black text-red-400">
            {planData.summary.totalNetDeficit}{" "}
            <span className="text-xs text-zinc-500 font-normal">تيشرت ناقص</span>
          </p>
          <p className="text-[10px] text-zinc-500">المطلوب ناقص المتاح بالمخزن</p>
        </div>

        <div className="bg-gradient-to-br from-red-950/30 to-zinc-950/50 border border-red-500/30 rounded-xl p-3.5 space-y-1">
          <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Layers size={11} />
            إجمالي الباترونات المقترح طباعتها
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
              قواعد وتخصيص الباترونات للموديلات
            </h3>
          </div>
          <button
            onClick={() => setShowPatternSettings(!showPatternSettings)}
            className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
          >
            <span>{showPatternSettings ? "إخفاء إعدادات الباترونات" : "تعديل الموديلات اللي ليها باترون سبيشيال / سوبر"}</span>
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
              يمكنك تخصيص وتفعيل أي باترون لأي موديل بسهولة:
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

      {/* Main Interactive Master Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 size={16} className="text-red-400" />
              <span>شيت إدخال البضاعة والطلبات وحساب الباترونات الفوري</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              <span className="text-blue-400 font-bold">الخانات الزرقاء:</span> بضاعة المخزن (أدخل بضاعتك يدوياً) ·{" "}
              <span className="text-amber-400 font-bold">الخانات الصفراء:</span> المطلوب تصنيعه (مسحوب آلياً أو أدخله يدوياً)
            </p>
          </div>

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

        {/* Product Rows List */}
        <div className="space-y-4">
          {filteredProductPlans.map((item) => {
            const hasPrint =
              item.plan.standard > 0 || item.plan.special > 0 || item.plan.superSpecial > 0;

            return (
              <div
                key={item.product.id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all ${
                  hasPrint
                    ? "bg-zinc-950/90 border-red-500/30 shadow-md shadow-red-500/5"
                    : "bg-zinc-950/40 border-zinc-800/60 opacity-85 hover:opacity-100"
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center font-bold text-red-400">
                      👕
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.product.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        <span>الباترونات:</span>
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

                  {/* Plan Summary Badge */}
                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                        العجز المطلوب طباعته
                      </span>
                      <span className={`text-base font-black ${item.totalDeficit > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {item.totalDeficit > 0 ? `${item.totalDeficit} تيشرت ناقص` : "مكتفي بالمخزن"}
                      </span>
                    </div>

                    {hasPrint ? (
                      <div className="bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl text-center">
                        <span className="text-[10px] text-red-400 font-bold block">المقترح طباعته</span>
                        <span className="text-base font-black text-white">
                          {item.plan.standard + item.plan.special + item.plan.superSpecial} باترون
                        </span>
                      </div>
                    ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-center">
                        <span className="text-[10px] text-emerald-400 font-bold block">المخزن كافي</span>
                        <span className="text-xs font-bold text-zinc-300">لا يحتاج طباعة</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Editable Table for Stock and Demand */}
                <div className="overflow-x-auto pt-3">
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className="text-zinc-500 text-[10px] uppercase font-bold border-b border-zinc-800/40">
                        <th className="py-2 pr-2">البيان</th>
                        <th className="py-2 px-3 text-center text-teal-400">مقاس M</th>
                        <th className="py-2 px-3 text-center text-sky-400">مقاس L</th>
                        <th className="py-2 px-3 text-center text-amber-400">مقاس XL</th>
                        <th className="py-2 px-3 text-center text-rose-400">مقاس 2XL</th>
                        <th className="py-2 pl-2 text-center text-white">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30 text-xs">
                      {/* Row 1: Warehouse Stock (EDITABLE) */}
                      <tr className="bg-blue-950/20">
                        <td className="py-2 pr-2 font-bold text-blue-300 flex items-center gap-1.5">
                          <span>📦 بضاعة المخزن (أدخل رصيدك):</span>
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
                                className="w-16 bg-zinc-900 border border-blue-500/50 rounded-lg text-center font-black text-white text-xs py-1.5 focus:outline-none focus:border-blue-400 focus:bg-zinc-950 shadow-inner"
                              />
                            </td>
                          );
                        })}
                        <td className="py-2 pl-2 text-center font-black text-blue-400 text-sm">
                          {item.currentStock.M + item.currentStock.L + item.currentStock.XL + item.currentStock["2XL"]}
                        </td>
                      </tr>

                      {/* Row 2: Required Demand (EDITABLE) */}
                      <tr className="bg-amber-950/20">
                        <td className="py-2 pr-2 font-bold text-amber-300 flex items-center gap-1.5">
                          <span>📋 المطلوب تصنيعه (أوردرات):</span>
                        </td>
                        {SIZES.map((sz) => {
                          const reqVal = item.totalRequired[sz];
                          return (
                            <td key={sz} className="py-1.5 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={reqVal}
                                onChange={(e) =>
                                  handleDemandChange(
                                    item.product.id,
                                    sz,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 bg-zinc-900 border border-amber-500/50 rounded-lg text-center font-black text-amber-300 text-xs py-1.5 focus:outline-none focus:border-amber-400 focus:bg-zinc-950 shadow-inner"
                              />
                            </td>
                          );
                        })}
                        <td className="py-2 pl-2 text-center font-black text-amber-400 text-sm">
                          {item.totalReqSum}
                        </td>
                      </tr>

                      {/* Row 3: Net Deficit */}
                      <tr className="bg-red-950/30 font-black">
                        <td className="py-2 pr-2 text-red-400 font-bold">
                          = العجز المطلوب طباعته (Deficit):
                        </td>
                        <td className="py-2 px-3 text-center text-teal-400 text-sm">{item.deficit.M}</td>
                        <td className="py-2 px-3 text-center text-sky-400 text-sm">{item.deficit.L}</td>
                        <td className="py-2 px-3 text-center text-amber-400 text-sm">{item.deficit.XL}</td>
                        <td className="py-2 px-3 text-center text-rose-400 text-sm">{item.deficit["2XL"]}</td>
                        <td className="py-2 pl-2 text-center text-red-400 text-base font-black">
                          {item.totalDeficit}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* AI / Smart Decision Box */}
                <div className="mt-3.5 p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2">
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
                        <span>الإنتاج المطبوع: </span>
                        <strong className="text-white">
                          M: {item.plan.produced.M} · L: {item.plan.produced.L} · XL: {item.plan.produced.XL} · 2XL: {item.plan.produced["2XL"]}
                        </strong>
                        <span className="text-zinc-500 ml-1">
                          (إجمالي {(item.plan.standard + item.plan.special + item.plan.superSpecial) * 4} تيشرت)
                        </span>
                      </div>

                      <div>
                        <span>المخزون المتوقع بعد تسليم الطلبات: </span>
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
