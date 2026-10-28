/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch returns
    let returnsQuery = supabase
      .from("returns")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: returns, error: returnsError } = await returnsQuery;

    if (returnsError) {
      return NextResponse.json({ error: returnsError.message }, { status: 500 });
    }

    // Filter by month if specified
    let filteredReturns = returns || [];
    if (month) {
      filteredReturns = filteredReturns.filter((r: any) => {
        if (!r.created_at) return false;
        const d = new Date(r.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return key === month;
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
      defective: "عيب تصنيع",
      wrong_size: "مقاس غلط",
      wrong_item: "منتج غلط",
      not_as_described: "مش زي الوصف",
      changed_mind: "غير رأيه",
      other: "سبب تاني",
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

    // Build rows for the sheet
    const rows = filteredReturns.map((ret: any, idx: number) => {
      const order = ordersMap.get(ret.order_number) || {};
      const items = Array.isArray(order.items) ? order.items : [];
      const itemsSummary = items
        .map((it: any) => `${it.title || "منتج"} (${it.size || "Free"}) x${it.quantity || 1}`)
        .join(" | ");
      const totalUnits = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);

      return {
        row_number: idx + 1,
        order_number: ret.order_number ? `#${ret.order_number}` : "",
        order_date: order.created_at ? new Date(order.created_at).toLocaleDateString("en-GB") : "",
        return_date: ret.created_at ? new Date(ret.created_at).toLocaleDateString("en-GB") : "",
        customer_name: order.customer_name || "",
        customer_phone: order.customer_phone || "",
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
        tracking_number: order.tracking_number || "",
        refund_completed: ret.refund_completed ? "نعم" : "لا",
        order_notes: order.notes || "",
      };
    });

    // Check format
    const format = searchParams.get("format");
    if (format === "csv") {
      const headers = [
        "م",
        "رقم الأوردر",
        "تاريخ الطلب",
        "تاريخ طلب الإرجاع",
        "اسم العميل",
        "رقم الهاتف",
        "العنوان",
        "المنتجات",
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
        "ملاحظات الأوردر",
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
            csvEscape(r.order_notes),
          ].join(",")
        ),
      ];

      // Add UTF-8 BOM so Excel and Google Sheets render Arabic correctly
      const csvContent = "\uFEFF" + csvRows.join("\r\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="viltrum_returns_${month || "all"}.csv"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // Summary
    const totalReturns = filteredReturns.length;
    const totalRefunded = filteredReturns
      .filter((r: any) => r.refund_completed)
      .reduce((s: number, r: any) => s + Number(r.refund_amount || 0), 0);
    const pendingCount = filteredReturns.filter((r: any) => r.status === "pending").length;
    const approvedCount = filteredReturns.filter((r: any) => r.status === "approved").length;
    const refundedCount = filteredReturns.filter((r: any) => r.status === "refunded").length;
    const rejectedCount = filteredReturns.filter((r: any) => r.status === "rejected").length;

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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
