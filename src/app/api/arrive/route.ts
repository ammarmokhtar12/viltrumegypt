import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sectorsData from "@/lib/arrive-sectors.json";

const ARRIVE_BASE = "https://arrive-shipping.com/api/shipment.php";
const ARRIVE_USER = process.env.ARRIVE_API_USER || "622030109";
const ARRIVE_PASS = process.env.ARRIVE_API_PASS || "sIWx@4248";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SectorItem {
  id: number;
  name: string;
  keywords: string[];
  gov: string;
}

const sectors: SectorItem[] = sectorsData as SectorItem[];

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
    const matchedSector = findSectorForAddress(order.customer_address || "");

    return {
      sector_id: String(matchedSector.id),
      keyword: matchedSector.name,
      product_name: "Viltrum Tshirt",
      product_desc: productDesc || "Viltrum Tshirt",
      phone_1: phone,
      service_type: 1, // تسليم و تحصيل
      price: Number(order.total),
      weight: "0.5 kg",
      address: order.customer_address,
      notes: `Order #${order.order_number}`,
      client_name: order.customer_name,
      order_id: String(order.order_number),
      quantity: String(items.reduce((sum, i) => sum + (i.quantity || 1), 0) || 1),
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
  const rawList: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : data.response && Array.isArray(data.response)
    ? data.response
    : [];

  if (rawList.length > 0) {
    const errors: string[] = [];
    const successful: Record<string, unknown>[] = [];

    for (const item of rawList) {
      const waybill = (item.waybill as string) || null;
      const orderId = (item.order_id as string) || null;
      const itemError = (item.error as string) || null;

      if (waybill && orderId) {
        await supabase
          .from("orders")
          .update({
            status: "shipped",
            tracking_number: waybill,
            shipping_company: "Arrive",
            updated_at: new Date().toISOString(),
          })
          .eq("order_number", Number(orderId));
        successful.push(item);
      } else if (itemError) {
        errors.push(`Order #${orderId || "unknown"}: ${itemError}`);
      }
    }

    if (successful.length > 0) {
      return NextResponse.json({
        success: true,
        data: successful,
        warnings: errors.length > 0 ? errors : undefined,
      });
    }

    return NextResponse.json(
      { success: false, error: errors.join(", ") || "Failed to create shipments" },
      { status: 400 }
    );
  }

  const errMsg = typeof data === "string" ? data : (data.error || data.message || JSON.stringify(data));
  return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
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

function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "") // remove tashkeel
    .toLowerCase();
}

function findSectorForAddress(address: string): SectorItem {
  if (!address) return { id: 105, name: "القاهرة", keywords: [], gov: "القاهرة" };

  const normAddr = normalizeArabic(address);

  // 1. Direct match on sector name
  for (const s of sectors) {
    const normName = normalizeArabic(s.name);
    if (normAddr.includes(normName)) {
      return s;
    }
  }

  // 2. Match on keywords
  for (const s of sectors) {
    if (s.keywords && s.keywords.length > 0) {
      for (const kw of s.keywords) {
        const normKw = normalizeArabic(kw);
        if (normKw && normKw.length >= 3 && normAddr.includes(normKw)) {
          return s;
        }
      }
    }
  }

  // 3. Fallback match by governorate
  for (const s of sectors) {
    const normGov = normalizeArabic(s.gov);
    if (normGov && normGov.length >= 4 && normAddr.includes(normGov)) {
      return s;
    }
  }

  // Default fallback (وسط البلد / الأزبكية)
  return { id: 105, name: "الأزبكية", keywords: [], gov: "القاهرة" };
}
