import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// Prevent XSS in email HTML
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: Request) {
  try {
    // Verify this is an internal request
    const authHeader = req.headers.get('x-internal-secret');
    const internalSecret = process.env.NEXT_PUBLIC_INTERNAL_API_SECRET || 'fallback-secret-123';

    if (authHeader !== internalSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderNumber, customerName, customerPhone, customerAddress, paymentMethod, items, total } = await req.json();

    // Validate required fields
    if (!orderNumber || !customerName || !items || !total) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sanitize all user inputs before putting them in HTML
    const safeName = escapeHtml(customerName);
    const safePhone = escapeHtml(customerPhone);
    const safeAddress = escapeHtml(customerAddress);
    const safePayment = escapeHtml(paymentMethod);

    const itemsHtml = items.map((item: any) => `
      <li>
        <strong>${escapeHtml(item.title)}</strong> (Size: ${escapeHtml(item.size)}) - ${Number(item.quantity)} x ${Number(item.price)} EGP
      </li>
    `).join('');

    const { data, error } = await resend.emails.send({
      from: 'Viltrum Egypt <orders@resend.dev>',
      to: ['viltrumegypt@gmail.com'],
      subject: `New Order Received: #${Number(orderNumber)}`,
      html: `
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
            This is an automated notification from the Viltrum Egypt Store.
          </div>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
