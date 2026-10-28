/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const { updates, mode = "append" } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 1. Collect all order numbers
    const cleanUpdates = updates
      .map((u: any) => ({
        orderNumber: parseInt(String(u.orderNumber).replace(/[^0-9]/g, ""), 10),
        note: String(u.note || "").trim(),
      }))
      .filter((u: any) => !isNaN(u.orderNumber) && u.orderNumber > 0 && u.note.length > 0);

    const orderNumbers = [...new Set(cleanUpdates.map((u: any) => u.orderNumber))];

    if (orderNumbers.length === 0) {
      return NextResponse.json({ error: "لم يتم العثور على أرقام أوردرات صالحة" }, { status: 400 });
    }

    // 2. Fetch existing orders in one query
    const { data: existingOrders, error: fetchErr } = await supabase
      .from("orders")
      .select("id, order_number, notes")
      .in("order_number", orderNumbers);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const existingMap = new Map<number, any>();
    (existingOrders || []).forEach((o) => {
      if (o.order_number) existingMap.set(o.order_number, o);
    });

    let updatedCount = 0;
    const notFound: number[] = [];
    const todayStr = new Date().toLocaleDateString("en-GB");

    // 3. Update orders in DB
    for (const item of cleanUpdates) {
      const existing = existingMap.get(item.orderNumber);
      if (!existing) {
        notFound.push(item.orderNumber);
        continue;
      }

      let finalNote = item.note;
      if (mode === "append" && existing.notes && existing.notes.trim()) {
        finalNote = `${existing.notes.trim()}\n[${todayStr}]: ${item.note}`;
      }

      const { error: updateErr } = await supabase
        .from("orders")
        .update({
          notes: finalNote,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (!updateErr) {
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      totalRequested: cleanUpdates.length,
      notFoundCount: notFound.length,
      notFound,
    });
  } catch (err: any) {
    console.error("Error importing notes:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
