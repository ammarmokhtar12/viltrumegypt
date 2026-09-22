"use server";

import crypto from "crypto";

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateConfirmToken(orderNumber: number): string {
  const secret = process.env.ADMIN_PASSWORD || "viltrum-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`confirm_${orderNumber}`)
    .digest("hex")
    .slice(0, 16);
}

export async function sendOrderNotification(orderData: {
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: string;
  items: {title: string; size: string; quantity: number; price: number}[];
  total: number;
}) {
  try {
    const { orderNumber, customerName, customerPhone, customerAddress, paymentMethod, items, total } = orderData;

    if (!orderNumber || !customerName || !items || !total) {
      return { success: false, error: 'Missing required fields' };
    }

    const safeName = escapeHtml(customerName);
    const safePhone = escapeHtml(customerPhone);
    const safeAddress = escapeHtml(customerAddress);
    const safePayment = escapeHtml(paymentMethod);

    const itemsHtml = items.map((item: {title: string; size: string; quantity: number; price: number}) => `
      <li>
        <strong>${escapeHtml(item.title)}</strong> (Size: ${escapeHtml(item.size)}) - ${Number(item.quantity)} x ${Number(item.price)} EGP
      </li>
    `).join('');

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Viltrum Egypt', email: 'viltrumegypt@gmail.com' },
        to: [{ email: 'viltrumegypt@gmail.com', name: 'Viltrum Admin' }],
        subject: `New Order: #${Number(orderNumber)}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px;">New Order Details</h2>
            <p><strong>Order Number:</strong> #${Number(orderNumber)}</p>
            
            <h3 style="margin-top: 20px;">Customer Information:</h3>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Phone:</strong> ${safePhone}</p>
            <p><strong>Address:</strong> ${safeAddress}</p>
            <p><strong>Payment Method:</strong> ${safePayment}</p>

            <h3 style="margin-top: 20px;">Order Items:</h3>
            <ul>
              ${itemsHtml}
            </ul>
            
            <p style="font-size: 1.2em; font-weight: bold; margin-top: 20px;">Total: ${Number(total)} EGP</p>
            
            <div style="margin-top: 30px; font-size: 0.8em; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
              This is an automated notification from the Viltrum Egypt Store (Powered by Brevo).
            </div>
          </div>
        `
      })
    });

    const result = await brevoResponse.json();

    if (!brevoResponse.ok) {
      console.error('Brevo API Error:', result);
      return { success: false, error: result };
    }

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Notification Action Error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendCustomerConfirmation(orderData: {
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: {title: string; size: string; quantity: number; price: number}[];
  total: number;
}) {
  try {
    const { orderNumber, customerName, customerEmail, customerPhone, customerAddress, items, total } = orderData;

    if (!orderNumber || !customerName || !customerEmail || !items || !total) {
      return { success: false, error: 'Missing required fields' };
    }

    const safeName = escapeHtml(customerName);
    const safePhone = escapeHtml(customerPhone);
    const safeAddress = escapeHtml(customerAddress);
    const confirmToken = generateConfirmToken(orderNumber);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://viltrumegypt.vercel.app';
    const confirmUrl = `${siteUrl}/api/orders/confirm?order=${orderNumber}&token=${confirmToken}`;
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '201031429229';
    const editUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`مرحبا، عايز أعدل الأوردر رقم #${orderNumber}`)}`;

    const itemsHtml = items.map((item: {title: string; size: string; quantity: number; price: number}) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333;">
          ${escapeHtml(item.title)} <span style="color: #888;">(${escapeHtml(item.size)})</span>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 14px; color: #333;">${Number(item.quantity)}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 14px; font-weight: 600; color: #111;">${Number(item.price)} EGP</td>
      </tr>
    `).join('');

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Viltrum Egypt', email: 'viltrumegypt@gmail.com' },
        to: [{ email: customerEmail, name: customerName }],
        subject: `تأكيد الأوردر #${Number(orderNumber)} — Viltrum Egypt`,
        htmlContent: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;" dir="rtl">
            <!-- Header -->
            <div style="background: #111; padding: 32px; text-align: center;">
              <h1 style="color: #fff; font-size: 22px; letter-spacing: 4px; margin: 0; text-transform: uppercase;">VILTRUM EGYPT</h1>
            </div>

            <!-- Confirmation -->
            <div style="padding: 40px 32px; text-align: center;">
              <div style="width: 56px; height: 56px; background: #f59e0b; border-radius: 50%; margin: 0 auto 20px; line-height: 56px; color: #fff; font-size: 24px;">📋</div>
              <h2 style="color: #111; font-size: 22px; margin: 0 0 8px; font-weight: 700;">تأكيد بيانات الأوردر</h2>
              <p style="color: #666; font-size: 14px; margin: 0;">أهلاً <strong style="color: #111;">${safeName}</strong>، راجع بيانات أوردرك وأكّده</p>
            </div>

            <!-- Order Info -->
            <div style="margin: 0 32px; padding: 20px; background: #fafafa; border: 1px solid #eee; border-radius: 12px;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #888;">رقم الأوردر</td>
                  <td style="padding: 6px 0; font-size: 16px; font-weight: 800; color: #111; text-align: left; font-family: monospace;">#${Number(orderNumber)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #888;">الاسم</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #111; text-align: left;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #888;">الموبايل</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #111; text-align: left;" dir="ltr">${safePhone}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #888;">العنوان</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #111; text-align: left;">${safeAddress}</td>
                </tr>
              </table>
            </div>

            <!-- Items Table -->
            <div style="padding: 24px 32px;">
              <h3 style="color: #111; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px; border-bottom: 2px solid #111; padding-bottom: 8px;">المنتجات</h3>
              <table style="width: 100%; border-collapse: collapse;" dir="ltr">
                <thead>
                  <tr style="background: #fafafa;">
                    <th style="padding: 10px 16px; text-align: left; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Item</th>
                    <th style="padding: 10px 16px; text-align: center; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                    <th style="padding: 10px 16px; text-align: right; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #111; text-align: center;">
                <span style="font-size: 13px; color: #888;">الإجمالي: </span>
                <span style="font-size: 24px; font-weight: 800; color: #111;">${Number(total)} EGP</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="padding: 0 32px 32px; text-align: center;">
              <p style="color: #666; font-size: 13px; margin: 0 0 20px;">لو البيانات صح، أكّد الأوردر. لو محتاج تعدل حاجة، كلمنا على واتساب.</p>
              <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0;">
                <tr>
                  <td style="width: 50%;">
                    <a href="${confirmUrl}" style="display: block; padding: 16px 24px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 700; text-align: center;">
                      ✅ تأكيد الأوردر
                    </a>
                  </td>
                  <td style="width: 50%;">
                    <a href="${editUrl}" style="display: block; padding: 16px 24px; background: #111; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 700; text-align: center;">
                      ✏️ تعديل الأوردر
                    </a>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Delivery Note -->
            <div style="margin: 0 32px 24px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; text-align: center;">
              <p style="color: #166534; font-size: 13px; font-weight: 600; margin: 0;">
                🚚 التوصيل خلال 3-5 أيام عمل
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0 0 4px;">محتاج مساعدة؟ كلمنا على واتساب</p>
              <p style="color: #999; font-size: 11px; margin: 0;">Viltrum Egypt — Premium Streetwear</p>
            </div>
          </div>
        `
      })
    });

    const result = await brevoResponse.json();

    if (!brevoResponse.ok) {
      console.error('Brevo Customer Email Error:', result);
      return { success: false, error: result };
    }

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Customer Confirmation Error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendDeliveryFeedback(orderData: {
  orderNumber: number;
  customerName: string;
  customerEmail: string;
}) {
  try {
    const { orderNumber, customerName, customerEmail } = orderData;

    if (!orderNumber || !customerName || !customerEmail) {
      return { success: false, error: 'Missing required fields' };
    }

    const safeName = escapeHtml(customerName);
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '201031429229';
    const feedbackUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`مرحبا، أنا ${customerName} (أوردر #${orderNumber})\n\nالفيدباك بتاعي:\n`)}`;
    const notifyMeUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`مرحبا، أنا ${customerName} (أوردر #${orderNumber})\nعايز أكون أول حد يعرف لما تنزل عروض جديدة 🔥`)}`;

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Viltrum Egypt', email: 'viltrumegypt@gmail.com' },
        to: [{ email: customerEmail, name: customerName }],
        subject: `رأيك يهمنا 💬 — Viltrum Egypt`,
        htmlContent: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;" dir="rtl">
            <!-- Header -->
            <div style="background: #111; padding: 32px; text-align: center;">
              <h1 style="color: #fff; font-size: 22px; letter-spacing: 4px; margin: 0; text-transform: uppercase;">VILTRUM EGYPT</h1>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 32px; text-align: center;">
              <div style="width: 64px; height: 64px; background: #16a34a; border-radius: 50%; margin: 0 auto 20px; line-height: 64px; color: #fff; font-size: 28px;">✅</div>
              <h2 style="color: #111; font-size: 24px; margin: 0 0 8px; font-weight: 700;">أوردرك وصلك!</h2>
              <p style="color: #666; font-size: 15px; margin: 0 0 4px;">أهلاً <strong style="color: #111;">${safeName}</strong></p>
              <p style="color: #888; font-size: 13px; margin: 0;">أوردر <span style="font-family: monospace; font-weight: 700; color: #111;">#${Number(orderNumber)}</span></p>
            </div>

            <!-- Feedback Section -->
            <div style="margin: 0 32px; padding: 28px 24px; background: #fafafa; border: 1px solid #eee; border-radius: 16px; text-align: center;">
              <h3 style="color: #111; font-size: 18px; margin: 0 0 12px; font-weight: 700;">رأيك يهمنا جداً 💬</h3>
              <p style="color: #666; font-size: 14px; margin: 0 0 8px; line-height: 1.7;">
                إيه رأيك في المنتج؟ الخامة عجبتك؟
              </p>
              <p style="color: #666; font-size: 14px; margin: 0 0 24px; line-height: 1.7;">
                إيه اللي ممكن نحسنه عشان تجربتك تكون أحسن؟
              </p>
              <a href="${feedbackUrl}" style="display: inline-block; padding: 16px 40px; background: #111; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 700;">
                ✍️ ابعتلنا رأيك
              </a>
            </div>

            <!-- VIP Section -->
            <div style="margin: 20px 32px; padding: 28px 24px; background: linear-gradient(135deg, #111 0%, #1a1a2e 100%); border-radius: 16px; text-align: center;">
              <p style="color: #f59e0b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 12px;">عرض حصري</p>
              <h3 style="color: #fff; font-size: 18px; margin: 0 0 12px; font-weight: 700;">عايز تعرف عن العروض الجديدة قبل أي حد؟ 🔥</h3>
              <p style="color: #999; font-size: 13px; margin: 0 0 24px; line-height: 1.7;">
                ابعتلنا على واتساب وهنضيفك في لستة الـ VIP — أول ناس تعرف لما ينزل أي عرض جديد
              </p>
              <a href="${notifyMeUrl}" style="display: inline-block; padding: 16px 40px; background: #c41e3a; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 700;">
                🔔 ضيفني في الـ VIP
              </a>
            </div>

            <!-- Thank You -->
            <div style="padding: 32px; text-align: center;">
              <p style="color: #111; font-size: 16px; font-weight: 700; margin: 0 0 4px;">شكراً إنك اخترت Viltrum 🖤</p>
              <p style="color: #888; font-size: 13px; margin: 0;">نتمنى نشوفك تاني قريب!</p>
            </div>

            <!-- Footer -->
            <div style="background: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0 0 4px;">محتاج مساعدة؟ كلمنا على واتساب</p>
              <p style="color: #999; font-size: 11px; margin: 0;">Viltrum Egypt — Premium Streetwear</p>
            </div>
          </div>
        `
      })
    });

    const result = await brevoResponse.json();

    if (!brevoResponse.ok) {
      console.error('Brevo Feedback Email Error:', result);
      return { success: false, error: result };
    }

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Delivery Feedback Error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ─── Exchange / Replacement Notification ─────────────────────────────────────

export async function sendExchangeNotification(data: {
  replacementNumber: number;
  originalOrderNumber: number | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  returnedItems: { title: string; size: string; quantity: number; price: number }[];
  newItems: { title: string; size: string; quantity: number; price: number }[];
  exchangeType: 'same_type' | 'different_type';
  shippingFees: number;
  priceDifference: number;
  total: number;
  notes?: string | null;
}) {
  try {
    const {
      replacementNumber, originalOrderNumber, customerName, customerPhone,
      customerAddress, returnedItems, newItems, exchangeType,
      shippingFees, priceDifference, total, notes,
    } = data;

    const safeName    = escapeHtml(customerName);
    const safePhone   = escapeHtml(customerPhone);
    const safeAddress = escapeHtml(customerAddress || '—');
    const exchangeLabel = exchangeType === 'same_type' ? 'نفس النوع — 90 EGP' : 'نوع مختلف — 150 EGP';

    const buildRows = (items: typeof returnedItems, color: string) =>
      items.map(i => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;">
            <strong>${escapeHtml(i.title)}</strong> <span style="color:#888;">(${escapeHtml(i.size)})</span>
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px;">×${i.quantity}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;font-weight:700;color:${color};">
            ${(i.price * i.quantity).toLocaleString()} EGP
          </td>
        </tr>
      `).join('');

    const returnedTotal = returnedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const newTotal      = newItems.reduce((s, i) => s + i.price * i.quantity, 0);

    const whatsappUrl  = `https://wa.me/2${customerPhone}?text=${encodeURIComponent(`مرحباً ${customerName}،\nتم استلام طلب الاستبدال #${replacementNumber} ✅\nهيتواصل معاك الفريق خلال 24 ساعة.`)}`;
    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://viltrumegypt.vercel.app'}/command-center/replacements`;

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Viltrum Egypt', email: 'viltrumegypt@gmail.com' },
        to: [{ email: 'viltrumegypt@gmail.com', name: 'Viltrum Admin' }],
        subject: `🔄 Exchange #${replacementNumber} — ${customerName}`,
        htmlContent: `
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;">

            <div style="background:#111;padding:28px 32px;">
              <p style="color:#c41e3a;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin:0 0 4px;">Exchange Request</p>
              <h1 style="color:#fff;font-size:20px;letter-spacing:3px;margin:0 0 6px;text-transform:uppercase;">VILTRUM EGYPT</h1>
              <p style="color:#aaa;font-size:13px;margin:0;">طلب استبدال جديد — يحتاج متابعة</p>
            </div>

            <div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:14px 24px;">
              <p style="margin:0;font-size:13px;color:#92400e;font-weight:700;">
                🔄 Exchange #${replacementNumber}
                ${originalOrderNumber ? ` &nbsp;|&nbsp; أوردر أصلي: #${originalOrderNumber}` : ''}
              </p>
            </div>

            <div style="padding:24px 32px;background:#fafafa;border-bottom:1px solid #eee;">
              <h3 style="color:#111;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 14px;font-weight:700;">بيانات العميل</h3>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:5px 0;font-size:12px;color:#888;width:100px;">الاسم</td><td style="padding:5px 0;font-size:14px;font-weight:700;color:#111;">${safeName}</td></tr>
                <tr><td style="padding:5px 0;font-size:12px;color:#888;">الموبايل</td><td style="padding:5px 0;font-size:14px;font-weight:700;color:#111;" dir="ltr">${safePhone}</td></tr>
                <tr><td style="padding:5px 0;font-size:12px;color:#888;">العنوان</td><td style="padding:5px 0;font-size:13px;color:#333;">${safeAddress}</td></tr>
                <tr><td style="padding:5px 0;font-size:12px;color:#888;">نوع الاستبدال</td><td style="padding:5px 0;font-size:13px;font-weight:700;color:${exchangeType === 'same_type' ? '#2563eb' : '#ea580c'};">${exchangeLabel}</td></tr>
              </table>
            </div>

            <div style="padding:24px 32px;">
              <h3 style="color:#ef4444;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;border-bottom:2px solid #ef4444;padding-bottom:6px;">📦 مرتجع من العميل</h3>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <tbody>${buildRows(returnedItems, '#ef4444')}</tbody>
                <tfoot><tr><td colspan="2" style="padding:10px 14px;font-size:12px;color:#888;text-align:right;">الإجمالي</td><td style="padding:10px 14px;font-size:14px;font-weight:800;color:#ef4444;text-align:right;">${returnedTotal.toLocaleString()} EGP</td></tr></tfoot>
              </table>

              <h3 style="color:#16a34a;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;border-bottom:2px solid #16a34a;padding-bottom:6px;">✨ منتجات جديدة للعميل</h3>
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                <tbody>${buildRows(newItems, '#16a34a')}</tbody>
                <tfoot><tr><td colspan="2" style="padding:10px 14px;font-size:12px;color:#888;text-align:right;">الإجمالي</td><td style="padding:10px 14px;font-size:14px;font-weight:800;color:#16a34a;text-align:right;">${newTotal.toLocaleString()} EGP</td></tr></tfoot>
              </table>
            </div>

            <div style="margin:0 32px 24px;padding:20px;background:#111;border-radius:14px;">
              <h3 style="color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 14px;">ملخص الحساب</h3>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:5px 0;font-size:12px;color:#999;">فرق السعر</td><td style="padding:5px 0;font-size:14px;font-weight:700;color:${priceDifference >= 0 ? '#4ade80' : '#f87171'};text-align:right;">${priceDifference >= 0 ? '+' : ''}${priceDifference.toLocaleString()} EGP</td></tr>
                <tr><td style="padding:5px 0;font-size:12px;color:#999;">رسوم الشحن</td><td style="padding:5px 0;font-size:14px;font-weight:700;color:#f59e0b;text-align:right;">${shippingFees} EGP</td></tr>
                <tr style="border-top:1px solid #333;"><td style="padding:10px 0 4px;font-size:13px;color:#fff;font-weight:700;">الإجمالي على العميل</td><td style="padding:10px 0 4px;font-size:22px;font-weight:900;color:#fff;text-align:right;">${total.toLocaleString()} EGP</td></tr>
              </table>
            </div>

            ${notes ? `<div style="margin:0 32px 24px;padding:14px 18px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;"><p style="font-size:11px;font-weight:700;color:#92400e;margin:0 0 5px;text-transform:uppercase;">ملاحظات العميل</p><p style="font-size:13px;color:#78350f;margin:0;">${escapeHtml(notes)}</p></div>` : ''}

            <div style="padding:0 32px 32px;display:flex;gap:12px;">
              <a href="${whatsappUrl}" style="display:inline-block;padding:14px 0;background:#16a34a;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;text-align:center;width:48%;">📱 واتساب العميل</a>
              <a href="${dashboardUrl}" style="display:inline-block;padding:14px 0;background:#c41e3a;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;text-align:center;width:48%;">📊 فتح الداشبورد</a>
            </div>

            <div style="background:#fafafa;padding:18px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:11px;margin:0;">Viltrum Egypt — Exchange System Notification</p>
            </div>
          </div>
        `
      })
    });

    const result = await brevoResponse.json();
    if (!brevoResponse.ok) {
      console.error('Brevo Exchange Email Error:', result);
      return { success: false, error: result };
    }
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Exchange Notification Error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

