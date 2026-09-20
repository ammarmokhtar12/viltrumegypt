import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "add") {
      return handleAddToSafwa(body.orderIds);
    }

    if (action === "remove") {
      return handleRemoveFromSafwa(body.orderIds);
    }

    if (action === "getShipments") {
      return handleGetShipments();
    }

    if (action === "getShipmentsByDate") {
      return handleGetShipmentsByDate(body.date);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Safwa API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function handleAddToSafwa(orderIds: string[]) {
  if (!orderIds?.length) {
    return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });
  }

  // Fetch order details
  const { data: orders, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_number")
    .in("id", orderIds);

  if (fetchError || !orders?.length) {
    return NextResponse.json({ error: "Orders not found" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Insert into safwa_shipments (upsert to handle duplicates)
  const rows = orders.map((order) => ({
    order_id: order.id,
    order_number: order.order_number,
    shipment_date: today,
  }));

  const { error: insertError } = await supabase
    .from("safwa_shipments")
    .upsert(rows, { onConflict: "order_id" });

  if (insertError) {
    console.error("Safwa insert error:", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Update shipping_company on orders
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      shipping_company: "ALSAFWA",
      updated_at: new Date().toISOString(),
    })
    .in("id", orderIds);

  if (updateError) {
    console.error("Order update error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: orders.length });
}

async function handleRemoveFromSafwa(orderIds: string[]) {
  if (!orderIds?.length) {
    return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });
  }

  // Remove from safwa_shipments
  const { error: deleteError } = await supabase
    .from("safwa_shipments")
    .delete()
    .in("order_id", orderIds);

  if (deleteError) {
    console.error("Safwa delete error:", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Clear shipping_company on orders
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      shipping_company: null,
      tracking_number: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", orderIds);

  if (updateError) {
    console.error("Order update error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function handleGetShipments() {
  // Get all safwa shipments with order details
  const { data: shipments, error } = await supabase
    .from("safwa_shipments")
    .select(`
      id,
      order_id,
      order_number,
      shipment_date,
      created_at
    `)
    .order("shipment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Safwa fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!shipments?.length) {
    return NextResponse.json({ success: true, shipments: [], orders: [] });
  }

  // Fetch full order details
  const orderIds = shipments.map((s) => s.order_id);
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, customer_address, total, items, status, shipping_company, tracking_number, created_at")
    .in("id", orderIds);

  if (ordersError) {
    console.error("Orders fetch error:", ordersError);
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, shipments, orders: orders || [] });
}

async function handleGetShipmentsByDate(date: string) {
  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  const { data: shipments, error } = await supabase
    .from("safwa_shipments")
    .select("id, order_id, order_number, shipment_date, created_at")
    .eq("shipment_date", date)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Safwa fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!shipments?.length) {
    return NextResponse.json({ success: true, shipments: [], orders: [] });
  }

  const orderIds = shipments.map((s) => s.order_id);
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, customer_address, total, items, status, shipping_company, tracking_number, created_at")
    .in("id", orderIds);

  if (ordersError) {
    console.error("Orders fetch error:", ordersError);
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, shipments, orders: orders || [] });
}
