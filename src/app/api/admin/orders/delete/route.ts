import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const session = request.cookies.get("admin_session");
    if (!session?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Delete related records first to prevent foreign key errors
    await supabase.from("returns").delete().eq("order_id", orderId);
    await supabase.from("replacements").delete().eq("original_order_id", orderId);

    // Delete the order itself
    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) {
      console.error("Order delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId });
  } catch (err: any) {
    console.error("Error deleting order:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
