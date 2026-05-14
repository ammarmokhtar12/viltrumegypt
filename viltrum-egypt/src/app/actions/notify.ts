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
  items: any[];
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

    const itemsHtml = items.map((item: any) => `
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
  } catch (error: any) {
    console.error('Notification Action Error:', error);
    return { success: false, error: error.message };
  }
}
