/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import {
  Shirt,
  Calendar,
  Download,
  ChevronDown,
  ChevronUp,
  Layers,
  Copy,
  Check,
  Printer,
  Sparkles,
  Calculator,
  FileSpreadsheet,
  BarChart3,
  Factory,
} from "lucide-react";

interface WeeklyProductSizeAnalyticsProps {
  orders: any[];
  allOrders?: any[];
  periodLabel?: string;
  title?: string;
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"];

// Distinct vibrant theme colors for sizes
const SIZE_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  XS: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20", bar: "bg-teal-500" },
  S: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", bar: "bg-sky-500" },
  M: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", bar: "bg-emerald-500" },
  L: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", bar: "bg-amber-500" },
  XL: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", bar: "bg-violet-500" },
  XXL: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", bar: "bg-rose-500" },
  "2XL": { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", bar: "bg-rose-500" },
  "3XL": { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/20", bar: "bg-fuchsia-500" },
};

function getSizeColor(size: string) {
  const normalized = size.toUpperCase();
  return SIZE_COLORS[normalized] || {
    bg: "bg-zinc-800/60",
    text: "text-zinc-300",
    border: "border-zinc-700/50",
    bar: "bg-zinc-500",
  };
}

function sortSizes(a: string, b: string) {
  const ai = SIZE_ORDER.indexOf(a.toUpperCase());
  const bi = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;
  return a.localeCompare(b);
}

export default function WeeklyProductSizeAnalytics({
  orders,
  allOrders,
  periodLabel,
  title = "Weekly Manufacturing & Size Demand · خطة التصنيع والمقاسات أسبوعياً",
}: WeeklyProductSizeAnalyticsProps) {
  const [dataScope, setDataScope] = useState<"all_time" | "filtered">("all_time");
  const [statusFilter, setStatusFilter] = useState<"valid" | "all" | "delivered" | "confirmed">("valid");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "volume">("newest");
  const [viewMode, setViewMode] = useState<"matrix" | "cards">("matrix");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Batch planner state
  const [batchTargetQty, setBatchTargetQty] = useState<number>(100);
  const [showBatchPlanner, setShowBatchPlanner] = useState<boolean>(true);

  // Determine active raw orders based on scope
  const rawOrders = useMemo(() => {
    if (dataScope === "filtered" || !allOrders) {
      return orders;
    }
    return allOrders;
  }, [dataScope, allOrders, orders]);

  // Determine current week key for badge
  const currentWeekKey = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.getFullYear(), now.getMonth(), diff);
    start.setHours(0, 0, 0, 0);
    return start.toISOString().split("T")[0];
  }, []);

  // Filter orders by status
  const filteredOrders = useMemo(() => {
    return rawOrders.filter((o: any) => {
      if (statusFilter === "valid") {
        return o.status !== "cancelled" && o.status !== "returned";
      }
      if (statusFilter === "delivered") {
        return o.status === "delivered";
      }
      if (statusFilter === "confirmed") {
        return o.status === "confirmed" || o.status === "shipped" || o.status === "delivered";
      }
      return true;
    });
  }, [rawOrders, statusFilter]);

  // Extract all distinct product titles across orders for filtering
  const allProductTitles = useMemo(() => {
    const titles = new Set<string>();
    rawOrders.forEach((o: any) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it: any) => {
        if (it?.title) titles.add(it.title);
      });
    });
    return Array.from(titles).sort();
  }, [rawOrders]);

  // Group by week and analyze items & sizes
  const weeklyData = useMemo(() => {
    const weeksMap: Record<
      string,
      {
        weekKey: string;
        start: Date;
        end: Date;
        label: string;
        isCurrentWeek: boolean;
        totalTshirts: number;
        totalOrders: number;
        sizes: Record<string, number>;
        byProduct: Record<string, { total: number; sizes: Record<string, number> }>;
      }
    > = {};

    filteredOrders.forEach((o: any) => {
      const dateVal = o.created_at || o.date;
      if (!dateVal) return;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return;

      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      const weekStart = new Date(d.getFullYear(), d.getMonth(), diff);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const key = weekStart.toISOString().split("T")[0];

      if (!weeksMap[key]) {
        const startStr = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        const endStr = weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        weeksMap[key] = {
          weekKey: key,
          start: weekStart,
          end: weekEnd,
          label: `${startStr} – ${endStr}`,
          isCurrentWeek: key === currentWeekKey,
          totalTshirts: 0,
          totalOrders: 0,
          sizes: {},
          byProduct: {},
        };
      }

      const items = Array.isArray(o.items) ? o.items : [];
      let orderHadMatchingItems = false;

      items.forEach((item: any) => {
        const title = item.title || "T-Shirt";
        if (selectedProduct !== "all" && title !== selectedProduct) {
          return;
        }

        orderHadMatchingItems = true;
        const qty = Number(item.quantity) || 1;
        const rawSize = item.size ? String(item.size).trim().toUpperCase() : "FREE";
        const size = rawSize || "FREE";

        weeksMap[key].totalTshirts += qty;
        weeksMap[key].sizes[size] = (weeksMap[key].sizes[size] || 0) + qty;

        if (!weeksMap[key].byProduct[title]) {
          weeksMap[key].byProduct[title] = { total: 0, sizes: {} };
        }
        weeksMap[key].byProduct[title].total += qty;
        weeksMap[key].byProduct[title].sizes[size] =
          (weeksMap[key].byProduct[title].sizes[size] || 0) + qty;
      });

      if (orderHadMatchingItems) {
        weeksMap[key].totalOrders += 1;
      }
    });

    let list = Object.values(weeksMap);

    // Filter out empty weeks if a specific product was selected
    if (selectedProduct !== "all") {
      list = list.filter((w) => w.totalTshirts > 0);
    }

    // Sort list
    if (sortOrder === "newest") {
      list.sort((a, b) => b.weekKey.localeCompare(a.weekKey));
    } else if (sortOrder === "oldest") {
      list.sort((a, b) => a.weekKey.localeCompare(b.weekKey));
    } else if (sortOrder === "volume") {
      list.sort((a, b) => b.totalTshirts - a.totalTshirts);
    }

    return list;
  }, [filteredOrders, currentWeekKey, selectedProduct, sortOrder]);

  // Overall aggregate metrics across all weeks in current filter
  const overallMetrics = useMemo(() => {
    let totalTshirts = 0;
    let totalOrders = 0;
    const sizeDistribution: Record<string, number> = {};

    weeklyData.forEach((w) => {
      totalTshirts += w.totalTshirts;
      totalOrders += w.totalOrders;
      Object.entries(w.sizes).forEach(([size, qty]) => {
        sizeDistribution[size] = (sizeDistribution[size] || 0) + qty;
      });
    });

    const sortedSizes = Object.entries(sizeDistribution).sort(([a], [b]) => sortSizes(a, b));

    let topSize = { size: "None", count: 0, pct: 0 };
    sortedSizes.forEach(([size, count]) => {
      if (count > topSize.count) {
        topSize = {
          size,
          count,
          pct: totalTshirts > 0 ? Math.round((count / totalTshirts) * 100) : 0,
        };
      }
    });

    const maxWeeklyTshirts = Math.max(...weeklyData.map((w) => w.totalTshirts), 1);
    const bestWeek = weeklyData.reduce(
      (best, w) => (w.totalTshirts > (best?.totalTshirts || 0) ? w : best),
      weeklyData[0] || null
    );

    const avgTshirtsPerWeek =
      weeklyData.length > 0 ? Math.round(totalTshirts / weeklyData.length) : 0;

    return {
      totalTshirts,
      totalOrders,
      sortedSizes,
      topSize,
      maxWeeklyTshirts,
      bestWeek,
      avgTshirtsPerWeek,
    };
  }, [weeklyData]);

  // All distinct sizes present in current dataset for matrix columns
  const allDistinctSizes = useMemo(() => {
    const set = new Set<string>();
    weeklyData.forEach((w) => {
      Object.keys(w.sizes).forEach((sz) => set.add(sz));
    });
    return Array.from(set).sort(sortSizes);
  }, [weeklyData]);

  // Batch production planner calculation based on actual size demand ratio
  const batchRecommendation = useMemo(() => {
    if (overallMetrics.totalTshirts === 0 || batchTargetQty <= 0) return [];
    return overallMetrics.sortedSizes.map(([size, count]) => {
      const ratio = count / overallMetrics.totalTshirts;
      const targetPieces = Math.max(1, Math.round(batchTargetQty * ratio));
      return {
        size,
        ratio: (ratio * 100).toFixed(1),
        pieces: targetPieces,
      };
    });
  }, [overallMetrics, batchTargetQty]);

  const toggleWeek = (weekKey: string) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekKey]: !prev[weekKey],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    weeklyData.forEach((w) => {
      next[w.weekKey] = true;
    });
    setExpandedWeeks(next);
  };

  const collapseAll = () => {
    setExpandedWeeks({});
  };

  // Generate WhatsApp Message for Workshop / Factory
  const handleCopyWhatsApp = (week: (typeof weeklyData)[0]) => {
    const sortedSizes = Object.entries(week.sizes).sort(([a], [b]) => sortSizes(a, b));
    let msg = `🔴 *أمر تشغيل وتصنيع أسبوعي — VILTRUM EGYPT*\n`;
    msg += `📅 *الأسبوع:* ${week.label}\n`;
    msg += `📦 *إجمالي المطلوب تصنيعه:* ${week.totalTshirts} تيشرت\n`;
    msg += `🧾 *عدد الأوردرات:* ${week.totalOrders}\n\n`;

    msg += `📊 *إجمالي المقاسات المطلوب قصها (Cutting Breakdown):*\n`;
    sortedSizes.forEach(([sz, count]) => {
      const pct = week.totalTshirts > 0 ? Math.round((count / week.totalTshirts) * 100) : 0;
      msg += `• مقاس *${sz}*: ${count} قطعة (${pct}%)\n`;
    });

    msg += `\n👕 *تفصيل الموديلات والمقاسات (Product Breakdown):*\n`;
    Object.entries(week.byProduct).forEach(([prod, data]) => {
      msg += `\n🔹 *${prod}* (إجمالي: ${data.total} تيشرت)\n`;
      const prodSizes = Object.entries(data.sizes).sort(([a], [b]) => sortSizes(a, b));
      prodSizes.forEach(([sz, count]) => {
        msg += `   - مقاس ${sz}: ${count} قطعة\n`;
      });
    });

    msg += `\n✅ يرجى مطابقة المقاسات مع الباترون وأمر القص والبدء في التشغيل.`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(msg).then(() => {
        setCopiedKey(week.weekKey);
        setTimeout(() => setCopiedKey(null), 3000);
      });
    }
  };

  // Printable Cutting Sheet for Workshop
  const handlePrintCuttingSheet = (week: (typeof weeklyData)[0]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const sortedSizes = Object.entries(week.sizes).sort(([a], [b]) => sortSizes(a, b));
    const sizeCols = allDistinctSizes.length > 0 ? allDistinctSizes : sortedSizes.map(([s]) => s);

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>أمر تشغيل وقص - ${week.label}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #111; }
          .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; color: #d00; }
          .sub { color: #555; font-size: 13px; margin-top: 4px; }
          .badge-box { background: #f4f4f4; border: 1px solid #ddd; padding: 10px 18px; border-radius: 8px; text-align: left; }
          .badge-title { font-size: 11px; text-transform: uppercase; color: #777; }
          .badge-num { font-size: 24px; font-weight: 900; color: #111; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th, td { border: 1px solid #333; padding: 10px 8px; text-align: center; }
          th { background: #222; color: #fff; font-weight: bold; }
          .th-prod { text-align: right; width: 35%; }
          .td-prod { text-align: right; font-weight: bold; }
          .total-row { background: #f0f0f0; font-weight: 900; }
          .signatures { margin-top: 40px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px dashed #aaa; }
          .sig-box { width: 30%; text-align: center; font-size: 13px; }
          .sig-line { border-bottom: 1px solid #222; margin-top: 40px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>VILTRUM EGYPT — أمر تشغيل وقص</h1>
            <div class="sub">الأسبوع: <strong>${week.label}</strong> · تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG")}</div>
          </div>
          <div class="badge-box">
            <div class="badge-title">إجمالي القطع المطلوب تصنيعها</div>
            <div class="badge-num">${week.totalTshirts} تيشرت</div>
          </div>
        </div>

        <h3>1. إجمالي كميات القص للمقاسات (Cutting Sizes Summary)</h3>
        <table>
          <thead>
            <tr>
              ${sizeCols.map((sz) => `<th>مقاس ${sz}</th>`).join("")}
              <th>الإجمالي الكلي</th>
            </tr>
          </thead>
          <tbody>
            <tr class="total-row">
              ${sizeCols.map((sz) => `<td>${week.sizes[sz] || 0}</td>`).join("")}
              <td style="color:#d00; font-size:16px;">${week.totalTshirts}</td>
            </tr>
          </tbody>
        </table>

        <h3 style="margin-top: 25px;">2. تفصيل الموديلات والمقاسات (Product Breakdown)</h3>
        <table>
          <thead>
            <tr>
              <th class="th-prod">اسم الموديل / التيشرت</th>
              ${sizeCols.map((sz) => `<th>${sz}</th>`).join("")}
              <th>إجمالي الموديل</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(week.byProduct)
              .map(
                ([prod, data]) => `
                <tr>
                  <td class="td-prod">${prod}</td>
                  ${sizeCols.map((sz) => `<td>${data.sizes[sz] || 0}</td>`).join("")}
                  <td style="font-weight:bold;">${data.total}</td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">
            <div>مسؤول الإنتاج / Viltrum</div>
            <div class="sig-line"></div>
          </div>
          <div class="sig-box">
            <div>المقص دار / الفصالة</div>
            <div class="sig-line"></div>
          </div>
          <div class="sig-box">
            <div>المصنع / ورشة الخياطة</div>
            <div class="sig-line"></div>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Export Weekly Sizes Report to CSV
  const handleExportCsv = () => {
    if (weeklyData.length === 0) {
      alert("No weekly data to export");
      return;
    }

    const allSizesSet = new Set<string>();
    weeklyData.forEach((w) => {
      Object.keys(w.sizes).forEach((sz) => allSizesSet.add(sz));
    });
    const sizeColumns = Array.from(allSizesSet).sort(sortSizes);

    const headers = [
      "الأسبوع (Week Period)",
      "تاريخ بداية الأسبوع (Week Start)",
      "إجمالي التيشرتات (Total T-Shirts)",
      "إجمالي الأوردرات (Total Orders)",
      ...sizeColumns.map((sz) => `مقاس (${sz})`),
    ];

    const rows = weeklyData.map((w) => {
      return [
        w.label,
        w.weekKey,
        w.totalTshirts,
        w.totalOrders,
        ...sizeColumns.map((sz) => w.sizes[sz] || 0),
      ];
    });

    const csvContent = [
      headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) =>
        row.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\r\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `weekly-manufacturing-orders-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 sm:p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Factory size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                {title}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                تحديد كميات التصنيع والقص لكل موديل ومقاس أسبوعياً بناءً على حجم الطلب الحقيقي
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle: Matrix vs Cards */}
          <div className="flex items-center bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-1 text-[11px]">
            <button
              onClick={() => setViewMode("matrix")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "matrix"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <FileSpreadsheet size={13} />
              <span>جدول التشغيل والقص</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "cards"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layers size={13} />
              <span>كروت الأسابيع</span>
            </button>
          </div>

          {/* Data Scope Toggle (if allOrders passed) */}
          {allOrders && (
            <div className="flex items-center bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-1 text-[11px]">
              <button
                onClick={() => setDataScope("all_time")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  dataScope === "all_time"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                كل الأسابيع
              </button>
              <button
                onClick={() => setDataScope("filtered")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  dataScope === "filtered"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title={periodLabel ? `الفترة المحددة: ${periodLabel}` : "فلتر الصفحة"}
              >
                فلتر الصفحة {periodLabel ? `(${periodLabel})` : ""}
              </button>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-1 text-[11px]">
            <button
              onClick={() => setStatusFilter("valid")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === "valid"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ناجحة (Valid)
            </button>
            <button
              onClick={() => setStatusFilter("confirmed")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === "confirmed"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              مؤكدة وشحن
            </button>
            <button
              onClick={() => setStatusFilter("delivered")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === "delivered"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              مستلمة
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === "all"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              الكل
            </button>
          </div>

          {/* Product Filter */}
          {allProductTitles.length > 0 && (
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-2 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-[11px] font-bold text-zinc-300 focus:outline-none focus:border-red-500/40 cursor-pointer"
            >
              <option value="all">كل الموديلات (All T-Shirts)</option>
              {allProductTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          )}

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 rounded-xl text-[11px] font-bold text-zinc-200 transition-all cursor-pointer shadow-sm active:scale-95"
            title="تحميل جدول القص الأسبوعي بصيغة Excel / CSV"
          >
            <Download size={13} className="text-zinc-300" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-xl p-3.5 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Shirt size={12} className="text-red-400" />
            إجمالي المطلوب تصنيعه
          </p>
          <p className="text-xl font-black text-white">
            {overallMetrics.totalTshirts.toLocaleString()}{" "}
            <span className="text-xs text-zinc-500 font-normal">تيشرت</span>
          </p>
          <p className="text-[10px] text-zinc-400">
            عبر {overallMetrics.totalOrders.toLocaleString()} أوردر
          </p>
        </div>

        <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-xl p-3.5 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <BarChart3 size={12} className="text-blue-400" />
            متوسط التصنيع الأسبوعي
          </p>
          <p className="text-xl font-black text-blue-400">
            {overallMetrics.avgTshirtsPerWeek.toLocaleString()}{" "}
            <span className="text-xs text-zinc-500 font-normal">تيشرت / أسبوع</span>
          </p>
          <p className="text-[10px] text-zinc-400">
            على مدار {weeklyData.length} أسبوع عمل
          </p>
        </div>

        <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-xl p-3.5 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Layers size={12} className="text-emerald-400" />
            أكتر مقاس مطلوب (Top Size)
          </p>
          <p className="text-xl font-black text-emerald-400 flex items-baseline gap-2">
            <span>{overallMetrics.topSize.size}</span>
            <span className="text-xs text-zinc-400 font-normal">
              ({overallMetrics.topSize.count} قطعة · {overallMetrics.topSize.pct}%)
            </span>
          </p>
          <p className="text-[10px] text-zinc-400">أولوية أولى لخطوط القص</p>
        </div>

        <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-xl p-3.5 space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Calendar size={12} className="text-amber-400" />
            أعلى أسبوع إنتاجاً (Peak Week)
          </p>
          <p className="text-xl font-black text-amber-400 truncate">
            {overallMetrics.bestWeek ? `${overallMetrics.bestWeek.totalTshirts} تيشرت` : "—"}
          </p>
          <p className="text-[10px] text-zinc-400 truncate">
            {overallMetrics.bestWeek ? overallMetrics.bestWeek.label : "لا توجد بيانات"}
          </p>
        </div>
      </div>

      {/* Production Batch Planner (حاسبة دفعة التصنيع المقترحة للمصنع) */}
      <div className="bg-gradient-to-r from-red-950/20 via-zinc-950/40 to-zinc-950/40 border border-red-500/20 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
              <Calculator size={15} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>حاسبة دفعة القص والتصنيع المقترحة (Batch Cutting Calculator)</span>
                <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-extrabold">
                  ذكي
                </span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                أدخل إجمالي التيشرتات التي تنوي تصنيعها، وسيقوم النظام بتوزيع المقاسات بدقة بناءً على طلب السوق الفعلي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-bold">عايز تصنع:</span>
            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1">
              <input
                type="number"
                min="10"
                step="10"
                value={batchTargetQty}
                onChange={(e) => setBatchTargetQty(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-16 bg-transparent text-white font-black text-sm text-center focus:outline-none"
              />
              <span className="text-xs text-zinc-400 font-bold mr-1">تيشرت</span>
            </div>
          </div>
        </div>

        {/* Calculated Sizes Recommendation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
          {batchRecommendation.map((rec) => {
            const color = getSizeColor(rec.size);
            return (
              <div
                key={rec.size}
                className={`p-3 rounded-xl border flex flex-col justify-between ${color.bg} ${color.border}`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold text-white text-xs">مقاس {rec.size}</span>
                  <span className="text-[10px] text-zinc-400">{rec.ratio}%</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-2xl font-black ${color.text}`}>{rec.pieces}</span>
                  <span className="text-[10px] text-zinc-400 font-bold">قطعة</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main View: Matrix (جدول القص والتشغيل للمصنع) vs Cards */}
      {viewMode === "matrix" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet size={15} className="text-red-400" />
              <span>جدول أوامر القص الأسبوعية للمصنع (Weekly Cutting Table)</span>
            </h4>
            <span className="text-[11px] text-zinc-500">
              اضغط على أي أسبوع لنسخ رسالة الواتساب أو طباعة أمر التشغيل
            </span>
          </div>

          {weeklyData.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
              لا توجد أوردرات في الفترة المحددة.
            </div>
          ) : (
            <div className="space-y-5">
              {weeklyData.map((week) => {
                const isCurrent = week.isCurrentWeek;
                const isExpanded = !!expandedWeeks[week.weekKey];
                const sortedSizes = allDistinctSizes.length > 0 ? allDistinctSizes : Object.keys(week.sizes).sort(sortSizes);
                const isCopied = copiedKey === week.weekKey;

                return (
                  <div
                    key={week.weekKey}
                    className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                      isCurrent
                        ? "bg-zinc-950/80 border-red-500/40 shadow-lg shadow-red-500/5"
                        : "bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700/80"
                    }`}
                  >
                    {/* Week Action Header */}
                    <div className="p-4 bg-zinc-900/60 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-red-400" />
                          <span className="font-bold text-white text-sm">{week.label}</span>
                        </div>

                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500 text-white animate-pulse">
                            أمر تشغيل هذا الأسبوع (Active)
                          </span>
                        )}

                        <span className="text-xs text-zinc-400">
                          ({week.totalOrders} أوردر)
                        </span>

                        <div className="flex items-baseline gap-1.5 bg-zinc-800/80 px-3 py-1 rounded-lg border border-zinc-700/50">
                          <span className="text-xs text-zinc-400 font-bold">المطلوب تصنيعه:</span>
                          <span className="text-base font-black text-red-400">{week.totalTshirts}</span>
                          <span className="text-[10px] text-zinc-400">تيشرت</span>
                        </div>
                      </div>

                      {/* Quick Export Actions */}
                      <div className="flex items-center gap-2">
                        {/* WhatsApp Copy */}
                        <button
                          onClick={() => handleCopyWhatsApp(week)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            isCopied
                              ? "bg-emerald-500 text-white"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                          title="نسخ أمر التشغيل لإرساله لواتساب المصنع"
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          <span>{isCopied ? "تم النسخ بنجاح!" : "نسخ لواتساب المصنع"}</span>
                        </button>

                        {/* Print Sheet */}
                        <button
                          onClick={() => handlePrintCuttingSheet(week)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                          title="طباعة أمر القص والتشغيل A4"
                        >
                          <Printer size={13} />
                          <span>طباعة أمر القص</span>
                        </button>

                        {/* Expand Details */}
                        <button
                          onClick={() => toggleWeek(week.weekKey)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                          title={isExpanded ? "إخفاء التفاصيل" : "عرض تفاصيل الموديلات"}
                        >
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Matrix Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right">
                        <thead>
                          <tr className="bg-zinc-900/30 border-b border-zinc-800/80 text-zinc-400 text-[11px]">
                            <th className="py-2.5 px-4 font-bold text-zinc-300">الموديل / التيشرت</th>
                            {sortedSizes.map((sz) => (
                              <th key={sz} className="py-2.5 px-3 font-bold text-center">
                                مقاس {sz}
                              </th>
                            ))}
                            <th className="py-2.5 px-4 font-black text-center text-white">إجمالي القطع</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                          {Object.entries(week.byProduct).map(([prod, data]) => (
                            <tr key={prod} className="hover:bg-zinc-900/30 transition-colors">
                              <td className="py-2.5 px-4 font-bold text-white max-w-[220px] truncate" title={prod}>
                                {prod}
                              </td>
                              {sortedSizes.map((sz) => {
                                const qty = data.sizes[sz] || 0;
                                const color = getSizeColor(sz);
                                return (
                                  <td key={sz} className="py-2.5 px-3 text-center">
                                    {qty > 0 ? (
                                      <span
                                        className={`inline-block min-w-[28px] px-2 py-0.5 rounded-md font-bold text-[11px] ${color.bg} ${color.text} ${color.border} border`}
                                      >
                                        {qty}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-600 font-mono">—</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="py-2.5 px-4 text-center font-extrabold text-white">
                                {data.total}
                              </td>
                            </tr>
                          ))}

                          {/* Grand Totals Row for this week */}
                          <tr className="bg-zinc-900/90 font-black border-t-2 border-zinc-700 text-white">
                            <td className="py-3 px-4 font-black text-red-400">
                              إجمالي مقاسات الأسبوع (Total Cut)
                            </td>
                            {sortedSizes.map((sz) => {
                              const qty = week.sizes[sz] || 0;
                              const color = getSizeColor(sz);
                              return (
                                <td key={sz} className="py-3 px-3 text-center">
                                  {qty > 0 ? (
                                    <span className={`text-sm font-black ${color.text}`}>{qty}</span>
                                  ) : (
                                    <span className="text-zinc-600 font-mono">0</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="py-3 px-4 text-center font-black text-red-400 text-sm">
                              {week.totalTshirts} تيشرت
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Cards View */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
              <span>الأسابيع ({weeklyData.length})</span>
              {selectedProduct !== "all" && (
                <span className="text-[11px] font-normal text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                  مفلتر بـ: {selectedProduct}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2 text-[10px]">
              <button onClick={expandAll} className="text-zinc-400 hover:text-white transition-colors">
                فتح تفاصيل الكل
              </button>
              <span className="text-zinc-600">·</span>
              <button onClick={collapseAll} className="text-zinc-400 hover:text-white transition-colors">
                غلق الكل
              </button>
            </div>
          </div>

          {weeklyData.map((week) => {
            const isExpanded = !!expandedWeeks[week.weekKey];
            const sortedWeekSizes = Object.entries(week.sizes).sort(([a], [b]) => sortSizes(a, b));
            const volumePct = (week.totalTshirts / overallMetrics.maxWeeklyTshirts) * 100;
            const isCopied = copiedKey === week.weekKey;

            return (
              <div
                key={week.weekKey}
                className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                  week.isCurrentWeek
                    ? "bg-zinc-950/70 border-red-500/30 shadow-sm shadow-red-500/5"
                    : "bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700/60"
                }`}
              >
                {/* Week Header Row */}
                <div className="p-4 sm:p-4.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                        <Calendar size={14} className="text-zinc-400" />
                        <span>{week.label}</span>
                      </div>

                      {week.isCurrentWeek && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-red-500 text-white animate-pulse">
                          هذا الأسبوع (Current)
                        </span>
                      )}

                      <span className="text-[11px] text-zinc-500 font-medium">
                        ({week.totalOrders} {week.totalOrders === 1 ? "أوردر" : "أوردرات"})
                      </span>
                    </div>

                    {/* Total T-shirts badge & Actions */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-baseline gap-1.5 bg-zinc-900 border border-zinc-700/60 px-3.5 py-1.5 rounded-xl">
                        <Shirt size={14} className="text-red-400 self-center" />
                        <span className="text-lg font-black text-white">{week.totalTshirts}</span>
                        <span className="text-[11px] text-zinc-400 font-bold">تيشرت</span>
                      </div>

                      <button
                        onClick={() => handleCopyWhatsApp(week)}
                        className={`p-2 rounded-lg border text-xs transition-all ${
                          isCopied
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
                        }`}
                        title="نسخ لواتساب المصنع"
                      >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      </button>

                      <button
                        onClick={() => handlePrintCuttingSheet(week)}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                        title="طباعة أمر القص"
                      >
                        <Printer size={14} />
                      </button>

                      <button
                        onClick={() => toggleWeek(week.weekKey)}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                        title={isExpanded ? "إخفاء التفاصيل" : "عرض تفاصيل الموديلات"}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Volume Relative Bar */}
                  <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(volumePct, 2)}%` }}
                    />
                  </div>

                  {/* Sizes Grid for this week */}
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5">
                      المقاسات المطلوبة هذا الأسبوع:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sortedWeekSizes.map(([size, qty]) => {
                        const pct = week.totalTshirts > 0 ? Math.round((qty / week.totalTshirts) * 100) : 0;
                        const color = getSizeColor(size);
                        return (
                          <div
                            key={size}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs ${color.bg} ${color.text} ${color.border}`}
                          >
                            <span className="font-mono text-zinc-400 text-[11px]">{size}:</span>
                            <span className="text-sm font-extrabold text-white">{qty}</span>
                            <span className="text-[10px] font-normal text-zinc-400">({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Collapsible Product Breakdown */}
                {isExpanded && (
                  <div className="bg-zinc-950/90 border-t border-zinc-800/80 p-4 space-y-3 animate-fadeIn">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={13} className="text-red-400" />
                      تفاصيل الموديلات المطلوبة للقص في هذا الأسبوع:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {Object.entries(week.byProduct).map(([productTitle, data]) => {
                        const productSizes = Object.entries(data.sizes).sort(([a], [b]) => sortSizes(a, b));
                        return (
                          <div
                            key={productTitle}
                            className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate max-w-[200px]" title={productTitle}>
                                {productTitle}
                              </span>
                              <span className="text-xs font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                                {data.total} تيشرت
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {productSizes.map(([sz, count]) => {
                                const c = getSizeColor(sz);
                                return (
                                  <span
                                    key={sz}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${c.bg} ${c.text} ${c.border}`}
                                  >
                                    {sz}: <strong className="text-white">{count}</strong>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
