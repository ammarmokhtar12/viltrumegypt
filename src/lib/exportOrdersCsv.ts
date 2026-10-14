import { Order } from "@/types";

export function exportOrdersToCsv(orders: Order[] | any[], filenamePrefix = "viltrum-orders") {
  if (!orders || orders.length === 0) {
    alert("لا توجد أوردرات لتصديرها");
    return;
  }

  const headers = [
    "رقم الأوردر (Order #)",
    "التاريخ (Date)",
    "اسم العميل (Customer Name)",
    "رقم الهاتف (Phone)",
    "المحافظة (Governorate)",
    "العنوان بالتفصيل (Address)",
    "الحالة (Status)",
    "طريقة الدفع (Payment Method)",
    "المنتجات والمقاسات (Items & Sizes)",
    "إجمالي القطع (Total Units)",
    "الإجمالي بالجنيه (Total EGP)",
    "شركة الشحن (Shipping Company)",
    "رقم البوليصة / التتبع (Tracking #)",
    "كود الخصم (Coupon Code)",
    "مصدر الطلب (Referral Source)",
    "ملاحظات الأدمن (Admin Comment)",
  ];

  const statusLabels: Record<string, string> = {
    pending: "قيد الانتظار (Pending)",
    confirmed: "تم التأكيد (Confirmed)",
    shipped: "تم الشحن (Shipped)",
    delivered: "تم التوصيل (Delivered)",
    cancelled: "ملغي (Cancelled)",
    returned: "مرتجع (Returned)",
  };

  const paymentLabels: Record<string, string> = {
    vodafone_cash: "فودافون كاش",
    instapay: "انستاباي",
    cod: "دفع عند الاستلام",
  };

  const rows = orders.map((o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    const itemsSummary = items
      .map((it: any) => `${it.title || "منتج"} (${it.size || "Free"}) x${it.quantity || 1}`)
      .join(" | ");
    const totalUnits = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
    const dateFormatted = o.created_at
      ? new Date(o.created_at).toLocaleString("ar-EG", {
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
      o.customer_phone ? `\t${o.customer_phone}` : "",
      o.customer_governorate || "",
      o.customer_address || "",
      statusLabels[o.status] || o.status || "",
      paymentLabels[o.payment_method] || o.payment_method || "",
      itemsSummary,
      totalUnits,
      o.total || 0,
      o.shipping_company || "",
      o.tracking_number ? `\t${o.tracking_number}` : "",
      o.coupon_code || "",
      o.referral_source || "",
      o.admin_comment || "",
    ];
  });

  const csvContent = [
    headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","),
    ...rows.map((row) =>
      row
        .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\r\n");

  const BOM = "\uFEFF"; // UTF-8 Byte Order Mark for proper Arabic rendering in Excel
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = `${filenamePrefix}-${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
