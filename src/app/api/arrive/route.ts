import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ARRIVE_BASE = "https://arrive-shipping.com/api/shipment.php";
const ARRIVE_USER = process.env.ARRIVE_API_USER || "01031429229";
const ARRIVE_PASS = process.env.ARRIVE_API_PASS || "123456";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SENDER = {
  sender_name: "Viltrum Egypt",
  sender_phone: "01012108929",
  sender_address: "الدار الملكية ابراج الخير شارع الفرماوي شبرا الخيمة",
  sender_sector: "36078",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "ship") {
      return handleShipOrders(body.orderIds);
    }

    if (action === "getSectors") {
      return handleGetSectors();
    }

    if (action === "getStatus") {
      return handleGetStatus(body.waybills);
    }

    if (action === "getStatusHistory") {
      return handleGetStatusHistory(body.waybill);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Arrive API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function handleShipOrders(orderIds: string[]) {
  if (!orderIds?.length) {
    return NextResponse.json({ error: "No order IDs" }, { status: 400 });
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, customer_address, total, items, status")
    .in("id", orderIds);

  if (error || !orders?.length) {
    return NextResponse.json({ error: "Orders not found" }, { status: 404 });
  }

  const shipments = orders.map((order) => {
    const items = (order.items || []) as { title: string; size: string; quantity: number }[];
    const productDesc = items.map((i) => `${i.title} (${i.size}) x${i.quantity}`).join(", ");
    const phone = (order.customer_phone || "").replace(/\D/g, "").replace(/^20/, "0");

    return {
      keyword: extractCity(order.customer_address),
      product_name: "Viltrum Tshirt",
      product_desc: productDesc,
      phone_1: phone,
      service_type: 1,
      price: Number(order.total),
      weight: "0.5 kg",
      address: order.customer_address,
      notes: `Order #${order.order_number}`,
      client_name: order.customer_name,
      order_id: String(order.order_number),
      quantity: String(items.reduce((sum, i) => sum + (i.quantity || 1), 0)),
      ...SENDER,
    };
  });

  const res = await fetch(`${ARRIVE_BASE}?action=addBulkShipments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: ARRIVE_USER,
      password: ARRIVE_PASS,
      shipments,
    }),
  });

  const data = await res.json();

  if (data.response && Array.isArray(data.response)) {
    for (const item of data.response) {
      if (item.waybill && item.order_id) {
        await supabase
          .from("orders")
          .update({
            status: "shipped",
            tracking_number: item.waybill,
            shipping_company: "Arrive",
            updated_at: new Date().toISOString(),
          })
          .eq("order_number", Number(item.order_id));
      }
    }
  }

  return NextResponse.json({ success: true, data: data.response || data });
}

async function handleGetSectors() {
  const res = await fetch(`${ARRIVE_BASE}?action=getAllSectors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: ARRIVE_USER, password: ARRIVE_PASS }),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

async function handleGetStatus(waybills: string[]) {
  if (!waybills?.length) {
    return NextResponse.json({ error: "No waybills" }, { status: 400 });
  }

  const res = await fetch(`${ARRIVE_BASE}?action=getCurrentStatus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: ARRIVE_USER,
      password: ARRIVE_PASS,
      waybill: waybills,
    }),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

async function handleGetStatusHistory(waybill: string) {
  if (!waybill) {
    return NextResponse.json({ error: "No waybill provided" }, { status: 400 });
  }

  const res = await fetch(`${ARRIVE_BASE}?action=statusHistory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: ARRIVE_USER,
      password: ARRIVE_PASS,
      waybill,
    }),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

function extractCity(address: string): string {
  const cities = [
    "القاهرة", "الجيزة", "الاسكندرية", "الدقهلية", "المنصورة", "الغربية", "المحلة",
    "الشرقية", "المنوفية", "البحيرة", "كفر الشيخ", "الفيوم", "بني سويف", "المنيا",
    "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "دمياط", "بورسعيد", "السويس",
    "الإسماعيلية", "شبرا الخيمة", "مدينة نصر", "المعادي", "حلوان", "6 أكتوبر",
    "الرحاب", "التجمع", "العبور", "الشروق", "طنطا", "دمنهور", "كفر الدوار",
  ];
  for (const city of cities) {
    if (address.includes(city)) return city;
  }
  return address.split(",")[0]?.trim() || address.substring(0, 30);
}
