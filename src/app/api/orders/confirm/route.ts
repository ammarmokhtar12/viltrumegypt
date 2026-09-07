import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyToken(orderNumber: string, token: string): boolean {
  const secret = process.env.ADMIN_PASSWORD || "viltrum-secret";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`confirm_${orderNumber}`)
    .digest("hex")
    .slice(0, 16);
  return token === expected;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("order");
  const token = searchParams.get("token");

  if (!orderNumber || !token) {
    return NextResponse.redirect(new URL("/?error=invalid", request.url));
  }

  if (!verifyToken(orderNumber, token)) {
    return NextResponse.redirect(new URL("/?error=invalid", request.url));
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("order_number", orderNumber)
    .single();

  if (!order) {
    return NextResponse.redirect(new URL("/?error=not_found", request.url));
  }

  if (order.status === "pending") {
    await supabase
      .from("orders")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", order.id);
  }

  return NextResponse.redirect(
    new URL(`/order-confirmed?order=${orderNumber}`, request.url)
  );
}
