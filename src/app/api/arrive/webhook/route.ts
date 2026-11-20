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
  "6": "shipped",    // تأجيل
  "7": "returned",   // تم الارتجاع للمخزن
  "8": "returned",   // تقفيل المرتجع
  "13": "shipped",   // مشكلة في التسليم / فشل التسليم
  "14": "returned",  // تم الارتجاع للراسل
  "16": "shipped",   // في الطريق للمخزن
  "17": "shipped",   // استبدال او استلام طرد
  "18": "delivered", // تسليم جزئي
  "19": "cancelled", // تهرب بعد الوصول و التنسيق
  "20": "returned",  // رفض الاستلام و تم دفع الشحن
  "21": "returned",  // مرتجع جزئي
  "22": "returned",  // مرتجع استبدال
  "24": "shipped",   // in transit
  "25": "returned",  // رفض الاستلام و رفض والدفع
  "26": "shipped",   // في الطريق إلي الفرع
  "27": "returned",  // في الطريق للتاجر
  "28": "returned",  // مرتجعات الى
  "31": "returned",  // مرتجعات بالفرع
  "32": "shipped",   // تخصيص البيك أب
  "33": "delivered", // تم التسليم
  "34": "shipped",   // اعاده توزيع
  "112": "returned", // خروج للمخزن وعدم وصول
  "120": "returned", // وصول لمخزن خطأ
  "125": "shipped",  // استلام في الفرع
  "135": "returned", // مرتجعات فى الطريق
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body.response || (Array.isArray(body) ? body : [body]);
    const results: { waybill: string; status: string; updated: boolean }[] = [];

    for (const item of items) {
      const waybill = item.waybill;
      const statusId = String(item.status_id || "");
      const newStatus = STATUS_MAP[statusId] || "shipped";
      const statusAr = item.status_ar || item.ar_status || "";
      const statusEn = item.status_en || "";

      if (!waybill) continue;

      const { data: order } = await supabase
        .from("orders")
        .select("id, order_number, status")
        .eq("tracking_number", waybill)
        .single();

      if (!order) {
        // Check replacements table
        let repMatch = null;
        try {
          const { data: rep } = await supabase
            .from("replacements")
            .select("id, status")
            .eq("tracking_number", waybill)
            .maybeSingle();
          repMatch = rep;
        } catch {
          // Column might not exist yet
        }

        if (!repMatch) {
          const { data: repByNotes } = await supabase
            .from("replacements")
            .select("id, status")
            .ilike("notes", `%${waybill}%`)
            .maybeSingle();
          repMatch = repByNotes;
        }

        if (repMatch) {
          await supabase
            .from("replacements")
            .update({
              status: newStatus === "delivered" ? "delivered" : newStatus === "cancelled" ? "cancelled" : "shipped",
              updated_at: new Date().toISOString(),
            })
            .eq("id", repMatch.id);
          results.push({ waybill, status: newStatus, updated: true });
          continue;
        }

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
    console.error("Arrive Webhook Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
