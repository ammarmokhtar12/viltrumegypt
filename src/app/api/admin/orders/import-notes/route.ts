/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

function toAsciiDigits(str: any): string {
  if (!str) return "";
  return String(str)
    .replace(/[٠۰]/g, "0")
    .replace(/[١۱]/g, "1")
    .replace(/[٢۲]/g, "2")
    .replace(/[٣۳]/g, "3")
    .replace(/[٤۴]/g, "4")
    .replace(/[٥۵]/g, "5")
    .replace(/[٦۶]/g, "6")
    .replace(/[٧۷]/g, "7")
    .replace(/[٨۸]/g, "8")
    .replace(/[٩۹]/g, "9");
}

function normalizePhone(p: any): string {
  if (!p) return "";
  const digits = toAsciiDigits(p).replace(/[^0-9]/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10); // last 10 digits
  }
  return digits;
}

function normalizeName(name: any): string {
  if (!name) return "";
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s\-_.]+/g, " ");
}

export async function POST(request: NextRequest) {
  try {
    const { updates, mode = "append" } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Fetch candidate orders from DB (up to 5000 recent orders)
    const { data: dbOrders, error: fetchErr } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, notes")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    // Build lookup indexes
    const orderIdMap = new Map<string, any>();
    const orderNumberMap = new Map<number, any>();
    const phoneMap = new Map<string, any>();
    const nameMap = new Map<string, any>();
    const ordersList = dbOrders || [];

    ordersList.forEach((o) => {
      if (o.id) {
        orderIdMap.set(o.id, o);
      }
      if (o.order_number) {
        const num = parseInt(toAsciiDigits(o.order_number).replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num)) orderNumberMap.set(num, o);
      }
      const normPhone = normalizePhone(o.customer_phone);
      if (normPhone && normPhone.length >= 8) {
        phoneMap.set(normPhone, o);
      }
      const normName = normalizeName(o.customer_name);
      if (normName && normName.length >= 3) {
        nameMap.set(normName, o);
      }
    });

    let updatedCount = 0;
    const notFound: string[] = [];
    const todayStr = new Date().toLocaleDateString("en-GB");

    // Process each update
    for (const item of updates) {
      const note = String(item.note || "").trim();
      if (!note) continue;

      let matched: any = null;

      // 1. Match by orderId if provided
      if (item.orderId && orderIdMap.has(item.orderId)) {
        matched = orderIdMap.get(item.orderId);
      }

      // 2. Match by Order Number
      if (!matched && item.orderNumber !== undefined && item.orderNumber !== null) {
        const rawOrderNum = parseInt(toAsciiDigits(item.orderNumber).replace(/[^0-9]/g, ""), 10);
        if (!isNaN(rawOrderNum) && rawOrderNum > 0 && orderNumberMap.has(rawOrderNum)) {
          matched = orderNumberMap.get(rawOrderNum);
        }
      }

      // 3. Match by Phone Number
      if (!matched && item.phone) {
        const normItemPhone = normalizePhone(item.phone);
        if (normItemPhone && phoneMap.has(normItemPhone)) {
          matched = phoneMap.get(normItemPhone);
        }
      }

      // 4. Match by Customer Name
      if (!matched && item.customerName) {
        const normItemName = normalizeName(item.customerName);
        if (normItemName) {
          if (nameMap.has(normItemName)) {
            matched = nameMap.get(normItemName);
          } else {
            matched = ordersList.find((o) => {
              const oName = normalizeName(o.customer_name);
              return (
                oName.length >= 4 &&
                (oName.includes(normItemName) || normItemName.includes(oName))
              );
            });
          }
        }
      }

      if (!matched) {
        const ident = item.orderNumber
          ? `#${item.orderNumber}`
          : item.phone || item.customerName || "غير محدد";
        notFound.push(String(ident));
        continue;
      }

      // Prepare final note
      let finalNote = note;
      if (mode === "append" && matched.notes && matched.notes.trim()) {
        finalNote = `${matched.notes.trim()}\n[${todayStr}]: ${note}`;
      }

      // Update order in DB
      const { error: updateErr } = await supabase
        .from("orders")
        .update({
          notes: finalNote,
          updated_at: new Date().toISOString(),
        })
        .eq("id", matched.id);

      if (!updateErr) {
        updatedCount++;
        matched.notes = finalNote;
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      totalRequested: updates.length,
      notFoundCount: notFound.length,
      notFound,
    });
  } catch (err: any) {
    console.error("Error importing notes:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
