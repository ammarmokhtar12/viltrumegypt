import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STATUS_MAP: Record<string, string> = {
  "1": "shipped",    // طلب بيك أب
  "2": "shipped",    // تم استلام البيك أب
  "3": "shipped",    // تم الاستلام في المخزن
  "4": "shipped",    // قيد التوصيل
  "5": "delivered",  // تسليم ناجح
  "6": "shipped",    // شحنة مؤجلة
  "7": "returned",   // تم الارتجاع للمخزن
  "8": "returned",   // تقفيل مرتجع
  "13": "shipped",   // فشل التسليم (still trying)
  "14": "returned",  // تم الارتجاع للراسل
  "16": "shipped",   // في الطريق للمخزن
  "17": "shipped",   // استبدال
  "18": "delivered",  // تسليم جزئي
  "19": "cancelled", // شحنة ملغاه
  "20": "returned",  // مرتجع و تم دفع الشحن
  "21": "returned",  // مرتجع جزئي
  "25": "returned",  // رفض الاستلام والدفع
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body.response || [body];
    const results: { waybill: string; status: string; updated: boolean }[] = [];

    for (const item of items) {
      const waybill = item.waybill;
      const statusId = String(item.status_id);
      const newStatus = STATUS_MAP[statusId] || "shipped";
      const statusAr = item.ar_status || "";
      const statusEn = item.status_en || "";

      if (!waybill) continue;

      const { data: order } = await supabase
        .from("orders")
        .select("id, order_number, status")
        .eq("tracking_number", waybill)
        .single();

      if (!order) {
        results.push({ waybill, status: newStatus, updated: false });
        continue;
      }

      await supabase
        .from("orders")
        .update({
          status: newStatus,
          shipping_status_ar: statusAr,
          shipping_status_en: statusEn,
          shipping_status_id: statusId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      results.push({ waybill, status: newStatus, updated: true });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    console.error("Panther Webhook Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
