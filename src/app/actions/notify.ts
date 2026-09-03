"use server";

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  items: {title: string; size: string; quantity: number; price: number}[];
  total: number;
}) {
  try {
    const { orderNumber, customerName, customerEmail, items, total } = orderData;

    if (!orderNumber || !customerName || !customerEmail || !items || !total) {
      return { success: false, error: 'Missing required fields' };
    }

    const safeName = escapeHtml(customerName);

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
        subject: `Order Confirmed #${Number(orderNumber)} — Viltrum Egypt`,
        htmlContent: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: #111; padding: 32px; text-align: center;">
              <h1 style="color: #fff; font-size: 22px; letter-spacing: 4px; margin: 0; text-transform: uppercase;">VILTRUM EGYPT</h1>
            </div>

            <!-- Confirmation -->
            <div style="padding: 40px 32px; text-align: center;">
              <div style="width: 56px; height: 56px; background: #111; border-radius: 50%; margin: 0 auto 20px; line-height: 56px; color: #fff; font-size: 24px;">✓</div>
              <h2 style="color: #111; font-size: 24px; margin: 0 0 8px; font-weight: 700;">Order Confirmed</h2>
              <p style="color: #666; font-size: 14px; margin: 0;">Thank you, <strong style="color: #111;">${safeName}</strong></p>
            </div>

            <!-- Order Number -->
            <div style="margin: 0 32px; padding: 20px; background: #fafafa; border: 1px solid #eee; border-radius: 12px; text-align: center;">
              <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Order Number</p>
              <p style="color: #111; font-size: 28px; font-weight: 800; margin: 0; font-family: monospace;">#${Number(orderNumber)}</p>
            </div>

            <!-- Estimated Delivery -->
            <div style="margin: 20px 32px 0; padding: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; text-align: center;">
              <p style="color: #166534; font-size: 13px; font-weight: 600; margin: 0;">
                🚚 Estimated Delivery: <strong>5 Business Days</strong>
              </p>
              <p style="color: #15803d; font-size: 12px; margin: 8px 0 0;">Our team will contact you within 24 hours to confirm your address.</p>
            </div>

            <!-- Items Table -->
            <div style="padding: 32px;">
              <h3 style="color: #111; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px; border-bottom: 2px solid #111; padding-bottom: 8px;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
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
              <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #111; text-align: right;">
                <span style="font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Total: </span>
                <span style="font-size: 22px; font-weight: 800; color: #111;">${Number(total)} EGP</span>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0 0 4px;">Need help? Contact us on WhatsApp</p>
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
