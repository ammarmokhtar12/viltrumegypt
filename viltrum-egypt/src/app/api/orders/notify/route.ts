import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { orderNumber, customerName, customerPhone, customerAddress, paymentMethod, items, total } = await req.json();

    const itemsHtml = items.map((item: any) => `
      <li>
        <strong>${item.title}</strong> (Size: ${item.size}) - ${item.quantity} x ${item.price} EGP
      </li>
    `).join('');

    const { data, error } = await resend.emails.send({
      from: 'Viltrum Egypt <orders@resend.dev>', // Note: User needs to verify domain for custom sender
      to: ['viltrumegypt@gmail.com'],
      subject: `New Order Received: #${orderNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px;">New Order Details</h2>
          <p><strong>Order Number:</strong> #${orderNumber}</p>
          
          <h3 style="margin-top: 20px;">Customer Information:</h3>
          <p><strong>Name:</strong> ${customerName}</p>
          <p><strong>Phone:</strong> ${customerPhone}</p>
          <p><strong>Address:</strong> ${customerAddress}</p>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>

          <h3 style="margin-top: 20px;">Order Items:</h3>
          <ul>
            ${itemsHtml}
          </ul>
          
          <p style="font-size: 1.2em; font-weight: bold; margin-top: 20px;">Total: ${total} EGP</p>
          
          <div style="margin-top: 30px; font-size: 0.8em; color: #666; border-top: 1px solid #eee; pt-10;">
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
