import { type ClassValue, clsx } from "clsx";

// Lightweight class merge utility (no twMerge needed with Tailwind v4)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number): string {
  return `EGP ${price.toFixed(0)}`;
}

export function generateOrderWhatsAppUrl(
  orderNumber: number,
  items: { title: string; size: string; quantity: number; price: number }[],
  total: number,
  customerName: string,
  paymentMethod: string
): string {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229";

  const itemLines = items
    .map(
      (item, i) =>
        `${i + 1}. ${item.title} (${item.size}) x${item.quantity} — EGP ${item.price}`
    )
    .join("%0A");

  const message = `🔴 *VILTRUM EGYPT — New Order*%0A%0A📋 *Order #${orderNumber}*%0A👤 ${customerName}%0A💳 ${paymentMethod === "vodafone_cash" ? "Vodafone Cash" : "InstaPay"}%0A%0A📦 *Items:*%0A${itemLines}%0A%0A💰 *Total: EGP ${total}*%0A🚚 *Shipping:* EGP 80 (Flat Rate)%0A%0A✅ Payment screenshot uploaded.`;

  return `https://wa.me/${phoneNumber}?text=${message}`;
}

export function generateCustomerWhatsAppUrl(
  orderNumber: number,
  items: { title: string; size: string; quantity: number; price: number }[],
  total: number,
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  paymentMethod: string
): string {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229";

  const itemLines = items
    .map(
      (item, i) =>
        `${i + 1}. ${item.title} (${item.size}) x${item.quantity} — EGP ${item.price}`
    )
    .join("%0A");

  const message = `✅ *تأكيد الأوردر — VILTRUM EGYPT*%0A%0A📋 *أوردر رقم #${orderNumber}*%0A👤 *الاسم:* ${customerName}%0A📱 *الموبايل:* ${customerPhone}%0A📍 *العنوان:* ${customerAddress}%0A💳 *الدفع:* ${paymentMethod === "vodafone_cash" ? "كاش عند الاستلام" : "InstaPay / فودافون كاش"}%0A%0A📦 *المنتجات:*%0A${itemLines}%0A%0A💰 *الإجمالي: EGP ${total}*%0A%0A⬇️ *اختار واحدة:*%0A1️⃣ تأكيد الأوردر ✅%0A2️⃣ تعديل الأوردر ✏️`;

  return `https://wa.me/${phoneNumber}?text=${message}`;
}
