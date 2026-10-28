/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  // Simple API key protection
  if (key !== "viltrum-returns-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const month = searchParams.get("month"); // optional: "2026-10"
  const format = (searchParams.get("format") || "xlsx").toLowerCase();

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch returns
    const { data: returns, error: returnsError } = await supabase
      .from("returns")
      .select("*")
      .order("created_at", { ascending: false });

    if (returnsError) {
      return NextResponse.json({ error: returnsError.message }, { status: 500 });
    }

    // Filter by month if specified
    let filteredReturns = returns || [];
    if (month) {
      filteredReturns = filteredReturns.filter((r: any) => {
        if (!r.created_at) return false;
        const d = new Date(r.created_at);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return mKey === month;
      });
    }

    // Get order numbers from returns
    const orderNumbers = [...new Set(filteredReturns.map((r: any) => r.order_number).filter(Boolean))];

    // Fetch matching orders
    let orders: any[] = [];
    if (orderNumbers.length > 0) {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .in("order_number", orderNumbers);
      orders = ordersData || [];
    }

    const ordersMap = new Map<number, any>();
    orders.forEach((o: any) => {
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
      vodafone_cash: "فودافون كاش",
      instapay: "انستاباي",
      store_credit: "رصيد متجر",
      exchange: "استبدال",
    };

    const RETURN_STATUS_MAP: Record<string, string> = {
      pending: "قيد الانتظار",
      approved: "تم الموافقة",
      rejected: "مرفوض",
      refunded: "تم الاسترداد",
      exchanged: "تم الاستبدال",
    };

    // Build structured data
    const rows = filteredReturns.map((ret: any, idx: number) => {
      const order = ordersMap.get(ret.order_number) || {};
      const items = Array.isArray(order.items) ? order.items : [];
      const itemsSummary = items
        .map((it: any) => `${it.title || "منتج"} (${it.size || "Free"}) x${it.quantity || 1}`)
        .join(" | ");
      const totalUnits = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
      const adminNotes = order.notes || ret.admin_notes || ret.notes || "";

      return {
        row_number: idx + 1,
        order_number: ret.order_number ? `#${ret.order_number}` : "",
        order_date: order.created_at ? new Date(order.created_at).toLocaleDateString("en-GB") : "",
        return_date: ret.created_at ? new Date(ret.created_at).toLocaleDateString("en-GB") : "",
        customer_name: order.customer_name || "",
        customer_phone: order.customer_phone ? String(order.customer_phone).trim() : "",
        governorate: order.customer_governorate || "",
        address: order.customer_address || "",
        items_summary: itemsSummary,
        total_units: totalUnits,
        order_total: Number(order.total || 0),
        refund_amount: Number(ret.refund_amount || 0),
        refund_method: REFUND_METHOD_MAP[ret.refund_method] || ret.refund_method || "",
        return_reason: REASON_MAP[ret.reason] || ret.reason || "",
        reason_details: ret.reason_details || "",
        return_status: RETURN_STATUS_MAP[ret.status] || ret.status || "",
        shipping_company: order.shipping_company || "",
        tracking_number: order.tracking_number ? String(order.tracking_number).trim() : "",
        refund_completed: ret.refund_completed ? "نعم" : "لا",
        admin_notes: adminNotes,
      };
    });

    // 1. CSV Format
    if (format === "csv") {
      const headers = [
        "م",
        "رقم الأوردر",
        "تاريخ الطلب",
        "تاريخ طلب الإرجاع",
        "اسم العميل",
        "رقم الهاتف",
        "المحافظة",
        "العنوان",
        "المنتجات والمقاسات",
        "عدد القطع",
        "إجمالي الأوردر (ج.م)",
        "مبلغ الاسترداد (ج.م)",
        "طريقة الاسترداد",
        "سبب الإرجاع",
        "تفاصيل السبب",
        "حالة الإرجاع",
        "شركة الشحن",
        "رقم التتبع",
        "تم استرداد المبلغ؟",
        "ملاحظات الأدمن (Admin Notes)",
      ];

      const csvEscape = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const csvRows = [
        headers.join(","),
        ...rows.map((r) =>
          [
            r.row_number,
            csvEscape(r.order_number),
            csvEscape(r.order_date),
            csvEscape(r.return_date),
            csvEscape(r.customer_name),
            csvEscape(r.customer_phone),
            csvEscape(r.governorate),
            csvEscape(r.address),
            csvEscape(r.items_summary),
            r.total_units,
            r.order_total,
            r.refund_amount,
            csvEscape(r.refund_method),
            csvEscape(r.return_reason),
            csvEscape(r.reason_details),
            csvEscape(r.return_status),
            csvEscape(r.shipping_company),
            csvEscape(r.tracking_number),
            csvEscape(r.refund_completed),
            csvEscape(r.admin_notes),
          ].join(",")
        ),
      ];

      const csvContent = "\uFEFF" + csvRows.join("\r\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="viltrum_returns_${month || "all"}.csv"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // Summary calculations
    const totalReturns = filteredReturns.length;
    const totalRefunded = filteredReturns
      .filter((r: any) => r.refund_completed)
      .reduce((s: number, r: any) => s + Number(r.refund_amount || 0), 0);
    const pendingCount = filteredReturns.filter((r: any) => r.status === "pending").length;
    const approvedCount = filteredReturns.filter((r: any) => r.status === "approved").length;
    const refundedCount = filteredReturns.filter((r: any) => r.status === "refunded").length;
    const rejectedCount = filteredReturns.filter((r: any) => r.status === "rejected").length;

    // 2. JSON Format
    if (format === "json") {
      return NextResponse.json({
        success: true,
        updated_at: new Date().toISOString(),
        summary: {
          total_returns: totalReturns,
          total_refunded_egp: totalRefunded,
          pending: pendingCount,
          approved: approvedCount,
          refunded: refundedCount,
          rejected: rejectedCount,
        },
        returns: rows,
      });
    }

    // 3. Excel (.xlsx) Format (Default)
    const excelRows = rows.map((r) => ({
      "#": r.row_number,
      "رقم الأوردر (Order #)": r.order_number,
      "تاريخ الأوردر (Order Date)": r.order_date,
      "تاريخ المرتجع (Return Date)": r.return_date,
      "اسم العميل (Customer Name)": r.customer_name,
      "رقم الهاتف (Phone)": r.customer_phone,
      "المحافظة (Governorate)": r.governorate,
      "العنوان (Address)": r.address,
      "المنتجات والمقاسات (Items & Sizes)": r.items_summary,
      "عدد القطع (Total Units)": r.total_units,
      "إجمالي الأوردر (Order Total EGP)": r.order_total,
      "مبلغ الاسترداد (Refund Amount EGP)": r.refund_amount,
      "طريقة الاسترداد (Refund Method)": r.refund_method,
      "سبب المرتجع (Return Reason)": r.return_reason,
      "تفاصيل السبب (Reason Details)": r.reason_details,
      "حالة المرتجع (Return Status)": r.return_status,
      "شركة الشحن (Shipping Company)": r.shipping_company,
      "رقم البوليصة (Tracking #)": r.tracking_number,
      "تم الاسترداد؟ (Refund Complete?)": r.refund_completed,
      "ملاحظات الأدمن (Admin Notes)": r.admin_notes,
      "سبب المرتجع من الشركة (Company Return Reason)": "",
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);

    // Auto-size columns
    const colKeys = Object.keys(excelRows[0] || {});
    ws["!cols"] = colKeys.map((k) => {
      const headerLen = k.length;
      const maxDataLen = excelRows.reduce(
        (max, row) => Math.max(max, String((row as any)[k] ?? "").length),
        0
      );
      return { wch: Math.min(Math.max(headerLen, maxDataLen) + 4, 60) };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Returns");

    // Summary sheet
    const summaryData = [
      { "ملخص المرتجعات": "الفترة", القيمة: month || "All Time" },
      { "ملخص المرتجعات": "إجمالي المرتجعات", القيمة: totalReturns },
      { "ملخص المرتجعات": "إجمالي المبالغ المستردة (ج.م)", القيمة: totalRefunded },
      { "ملخص المرتجعات": "قيد الانتظار (Pending)", القيمة: pendingCount },
      { "ملخص المرتجعات": "تمت الموافقة (Approved)", القيمة: approvedCount },
      { "ملخص المرتجعات": "تم الاسترداد (Refunded)", القيمة: refundedCount },
      { "ملخص المرتجعات": "مرفوض (Rejected)", القيمة: rejectedCount },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="viltrum_returns_${month || "all"}.xlsx"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
