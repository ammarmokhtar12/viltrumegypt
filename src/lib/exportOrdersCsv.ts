import * as XLSX from "xlsx";
import { Order } from "@/types";

export function exportOrdersToCsv(orders: Order[] | any[], filenamePrefix = "viltrum-orders") {
  if (!orders || orders.length === 0) {
    alert("No orders to export");
    return;
  }

  const headers = [
    "Order #",
    "Date",
    "Customer Name",
    "Phone",
    "Governorate",
    "Address",
    "Status",
    "Payment Method",
    "Items & Sizes",
    "Total Units",
    "Total (EGP)",
    "Shipping Company",
    "Tracking #",
    "Coupon Code",
    "Referral Source",
    "Admin Notes",
  ];

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
  };

  const paymentLabels: Record<string, string> = {
    vodafone_cash: "Vodafone Cash",
    instapay: "InstaPay",
    cod: "Cash on Delivery (COD)",
  };

  const rows = orders.map((o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    const itemsSummary = items
      .map((it: any) => `${it.title || "Item"} (${it.size || "Free"}) x${it.quantity || 1}`)
      .join(" | ");
    const totalUnits = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
    const dateFormatted = o.created_at
      ? new Date(o.created_at).toLocaleString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return [
      o.order_number ? `#${o.order_number}` : "",
      dateFormatted,
      o.customer_name || "",
      o.customer_phone ? String(o.customer_phone).trim() : "",
      o.customer_governorate || "",
      o.customer_address || "",
      statusLabels[o.status] || o.status || "",
      paymentLabels[o.payment_method] || o.payment_method || "",
      itemsSummary,
      totalUnits,
      Number(o.total || 0),
      o.shipping_company || "",
      o.tracking_number ? String(o.tracking_number).trim() : "",
      o.coupon_code || "",
      o.referral_source || "",
      o.admin_comment || "",
    ];
  });

  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Auto-calculated column widths
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    for (const r of rows) {
      const val = r[i];
      if (val !== undefined && val !== null) {
        const len = String(val).length;
        if (len > maxLen) maxLen = len;
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 48) };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");

  const dateStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `${filenamePrefix}-${dateStr}.xlsx`);
}
