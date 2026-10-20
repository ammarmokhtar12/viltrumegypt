/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from "xlsx";

/**
 * Export returned orders for a given month to a styled .xlsx Excel file.
 * Includes an empty "سبب المرتجع من الشركة" column for the shipping company to fill.
 */
export function exportReturnsToExcel(
  returns: any[],
  orders: any[],
  monthLabel: string // e.g. "October 2026"
) {
  if (!returns || returns.length === 0) {
    alert("لا توجد مرتجعات لتصديرها");
    return;
  }

  // Build a map of orders by order_number for quick lookup
  const ordersMap = new Map<number, any>();
  orders.forEach((o) => {
    if (o.order_number) ordersMap.set(o.order_number, o);
  });

  const REASON_MAP: Record<string, string> = {
    defective: "عيب تصنيع (Defective)",
    wrong_size: "مقاس غلط (Wrong Size)",
    wrong_item: "منتج غلط (Wrong Item)",
    not_as_described: "مش زي الوصف (Not as Described)",
    changed_mind: "غير رأيه (Changed Mind)",
    other: "سبب تاني (Other)",
  };

  const REFUND_METHOD_MAP: Record<string, string> = {
    vodafone_cash: "فودافون كاش (Vodafone Cash)",
    instapay: "انستاباي (InstaPay)",
    store_credit: "رصيد متجر (Store Credit)",
    exchange: "استبدال (Exchange)",
  };

  const RETURN_STATUS_MAP: Record<string, string> = {
    pending: "قيد الانتظار (Pending)",
    approved: "تم الموافقة (Approved)",
    rejected: "مرفوض (Rejected)",
    refunded: "تم الاسترداد (Refunded)",
    exchanged: "تم الاستبدال (Exchanged)",
  };

  // Build rows
  const rows = returns.map((ret, idx) => {
    const order = ordersMap.get(ret.order_number) || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const itemsSummary = items
      .map(
        (it: any) =>
          `${it.title || "منتج"} (${it.size || "Free"}) x${it.quantity || 1}`
      )
      .join(" | ");
    const totalUnits = items.reduce(
      (sum: number, it: any) => sum + (it.quantity || 1),
      0
    );

    const returnDate = ret.created_at
      ? new Date(ret.created_at).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "";

    const orderDate = order.created_at
      ? new Date(order.created_at).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "";

    return {
      "#": idx + 1,
      "رقم الأوردر (Order #)": ret.order_number
        ? `#${ret.order_number}`
        : "",
      "تاريخ الأوردر (Order Date)": orderDate,
      "تاريخ المرتجع (Return Date)": returnDate,
      "اسم العميل (Customer Name)": order.customer_name || "",
      "رقم الهاتف (Phone)": order.customer_phone || "",
      "المحافظة (Governorate)": order.customer_governorate || "",
      "العنوان (Address)": order.customer_address || "",
      "المنتجات والمقاسات (Items & Sizes)": itemsSummary,
      "عدد القطع (Total Units)": totalUnits,
      "إجمالي الأوردر (Order Total EGP)": order.total || 0,
      "مبلغ الاسترداد (Refund Amount EGP)": Number(ret.refund_amount || 0),
      "طريقة الاسترداد (Refund Method)":
        REFUND_METHOD_MAP[ret.refund_method] || ret.refund_method || "",
      "سبب المرتجع (Return Reason)":
        REASON_MAP[ret.reason] || ret.reason || "",
      "تفاصيل السبب (Reason Details)": ret.reason_details || "",
      "حالة المرتجع (Return Status)":
        RETURN_STATUS_MAP[ret.status] || ret.status || "",
      "شركة الشحن (Shipping Company)": order.shipping_company || "",
      "رقم البوليصة (Tracking #)": order.tracking_number || "",
      "تم الاسترداد؟ (Refund Complete?)": ret.refund_completed
        ? "✅ نعم"
        : "❌ لا",
      "سبب المرتجع من الشركة (Company Return Reason)": "",
    };
  });

  // Create workbook & worksheet
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns
  const colKeys = Object.keys(rows[0] || {});
  ws["!cols"] = colKeys.map((key) => {
    const headerLen = key.length;
    const maxDataLen = rows.reduce(
      (max, row) => Math.max(max, String((row as any)[key] ?? "").length),
      0
    );
    return { wch: Math.min(Math.max(headerLen, maxDataLen) + 4, 60) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Returns - ${monthLabel}`);

  // Summary sheet
  const totalReturns = returns.length;
  const totalRefunded = returns
    .filter((r) => r.refund_completed)
    .reduce((s: number, r: any) => s + Number(r.refund_amount || 0), 0);
  const pendingCount = returns.filter((r) => r.status === "pending").length;
  const approvedCount = returns.filter((r) => r.status === "approved").length;
  const refundedCount = returns.filter((r) => r.status === "refunded").length;
  const rejectedCount = returns.filter((r) => r.status === "rejected").length;
  const exchangedCount = returns.filter((r) => r.status === "exchanged").length;

  const reasonBreakdown: Record<string, number> = {};
  returns.forEach((r) => {
    const key = REASON_MAP[r.reason] || r.reason || "غير محدد";
    reasonBreakdown[key] = (reasonBreakdown[key] || 0) + 1;
  });

  const summaryData = [
    { "ملخص المرتجعات (Returns Summary)": "الشهر (Month)", القيمة: monthLabel },
    {
      "ملخص المرتجعات (Returns Summary)": "إجمالي المرتجعات (Total Returns)",
      القيمة: totalReturns,
    },
    {
      "ملخص المرتجعات (Returns Summary)":
        "إجمالي المبالغ المستردة (Total Refunded EGP)",
      القيمة: totalRefunded.toLocaleString(),
    },
    {
      "ملخص المرتجعات (Returns Summary)": "قيد الانتظار (Pending)",
      القيمة: pendingCount,
    },
    {
      "ملخص المرتجعات (Returns Summary)": "تم الموافقة (Approved)",
      القيمة: approvedCount,
    },
    {
      "ملخص المرتجعات (Returns Summary)": "تم الاسترداد (Refunded)",
      القيمة: refundedCount,
    },
    {
      "ملخص المرتجعات (Returns Summary)": "مرفوض (Rejected)",
      القيمة: rejectedCount,
    },
    {
      "ملخص المرتجعات (Returns Summary)": "تم الاستبدال (Exchanged)",
      القيمة: exchangedCount,
    },
    { "ملخص المرتجعات (Returns Summary)": "", القيمة: "" },
    {
      "ملخص المرتجعات (Returns Summary)": "--- تفصيل الأسباب (Reason Breakdown) ---",
      القيمة: "",
    },
    ...Object.entries(reasonBreakdown).map(([reason, count]) => ({
      "ملخص المرتجعات (Returns Summary)": reason,
      القيمة: count,
    })),
  ];

  const ws2 = XLSX.utils.json_to_sheet(summaryData);
  ws2["!cols"] = [{ wch: 50 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  // Download
  const dateStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `viltrum-returns-${monthLabel.replace(/\s+/g, "-")}-${dateStr}.xlsx`);
}
