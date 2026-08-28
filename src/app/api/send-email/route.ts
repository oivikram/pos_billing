import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      to,
      invoiceId,
      date,
      items = [],
      total,
      method,
      cashAmount,
      upiAmount,
      received,
      change,
      isRefund,
    } = body;

    if (!to || typeof to !== "string" || !to.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid recipient email address." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "RESEND_API_KEY is not configured in .env.local. Please add RESEND_API_KEY=re_... to your environment.",
        },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const formattedDate = date
      ? new Date(date).toLocaleString("en-IN")
      : new Date().toLocaleString("en-IN");
    const documentTitle = isRefund ? "Cash Refund Receipt" : "Store Tax Invoice";
    const totalAmount = Math.abs(Number(total) || 0).toFixed(2);

    const itemsRowsHtml = (items || [])
      .map(
        (item: { name: string; quantity: number; price: number }) => `
        <tr style="border-bottom: 1px solid #eeeeee;">
          <td style="padding: 10px 0; font-family: monospace; font-size: 14px; color: #222222;">
            ${item.name}
          </td>
          <td style="padding: 10px 0; text-align: center; font-family: monospace; font-size: 14px; color: #666666;">
            ${item.quantity}
          </td>
          <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 14px; color: #666666;">
            ₹${Number(item.price).toFixed(2)}
          </td>
          <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 14px; font-weight: bold; color: #222222;">
            ₹${(Number(item.price) * Number(item.quantity)).toFixed(2)}
          </td>
        </tr>
      `
      )
      .join("");

    const splitBreakdownHtml =
      method === "Split"
        ? `
        <div style="background-color: #f6f8fa; padding: 12px; margin-top: 12px; border-radius: 4px; font-family: monospace; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Cash Paid:</span>
            <b>₹${Number(cashAmount || 0).toFixed(2)}</b>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Online UPI Paid:</span>
            <b>₹${Number(upiAmount || 0).toFixed(2)}</b>
          </div>
        </div>
      `
        : "";

    const cashChangeHtml =
      received !== undefined && change !== undefined && change > 0
        ? `
        <div style="margin-top: 8px; font-family: monospace; font-size: 13px; color: #555555;">
          <div>Cash Tendered: ₹${Number(received).toFixed(2)}</div>
          <div>Change Returned: ₹${Number(change).toFixed(2)}</div>
        </div>
      `
        : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${documentTitle} - ${invoiceId}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e4e4e7;">
            
            <!-- Header -->
            <div style="background-color: #202422; color: #ffffff; padding: 24px; text-align: left;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #d6f32f; font-weight: bold; margin-bottom: 4px;">
                VIKRAM STORE
              </div>
              <div style="font-size: 11px; color: #a1a1aa; margin-bottom: 12px; letter-spacing: 0.5px;">
                Retail Supermarket & FMCG Store · www.vikramstore.shop
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">
                ${documentTitle}
              </h1>
              <div style="font-family: monospace; font-size: 13px; color: #a1a1aa; margin-top: 6px;">
                ${invoiceId}
              </div>
            </div>

            <!-- Body -->
            <div style="padding: 24px;">
              <div style="margin-bottom: 20px; font-size: 13px; color: #71717a; border-bottom: 1px solid #e4e4e7; padding-bottom: 16px;">
                <div style="margin-bottom: 4px;"><strong>Date:</strong> ${formattedDate}</div>
                <div style="margin-bottom: 4px;"><strong>Payment Mode:</strong> ${method}</div>
                <div style="margin-bottom: 4px;"><strong>Store:</strong> Vikram Store Main Branch</div>
                <div><strong>Cashier:</strong> Terminal 01 (vikramstore.shop)</div>
              </div>

              <!-- Items Table -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #202422; text-align: left; font-size: 11px; text-transform: uppercase; color: #71717a; font-family: monospace;">
                    <th style="padding-bottom: 8px;">Item</th>
                    <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                    <th style="padding-bottom: 8px; text-align: right;">Price</th>
                    <th style="padding-bottom: 8px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRowsHtml || `<tr><td colspan="4" style="padding: 12px 0; font-family: monospace; font-size: 13px; color: #666;">Store items</td></tr>`}
                </tbody>
              </table>

              ${splitBreakdownHtml}
              ${cashChangeHtml}

              <!-- Total Card -->
              <div style="background-color: ${isRefund ? "#fdf2f0" : "#fbfef0"}; border: 1px solid ${isRefund ? "#f0b8af" : "#d8ef6a"}; padding: 18px; border-radius: 6px; margin-top: 20px; text-align: right;">
                <span style="font-size: 12px; font-family: monospace; text-transform: uppercase; color: #71717a; display: block; margin-bottom: 4px;">
                  Total ${isRefund ? "Refunded" : "Paid"}
                </span>
                <span style="font-size: 28px; font-weight: 800; font-family: monospace; color: ${isRefund ? "#a94c38" : "#202422"};">
                  ${isRefund ? `-₹${totalAmount}` : `₹${totalAmount}`}
                </span>
              </div>

              <!-- Footer Note -->
              <div style="margin-top: 28px; padding-top: 18px; border-top: 1px dashed #e4e4e7; text-align: center; font-size: 12px; color: #71717a; line-height: 1.6;">
                <strong>*** Thank you for shopping at Vikram Store! ***</strong><br>
                Visit us online: <a href="https://vikramstore.shop" style="color: #1a73e8; text-decoration: none;">www.vikramstore.shop</a><br>
                Contact & Support: <a href="mailto:vikramgirhe07@gmail.com" style="color: #71717a;">vikramgirhe07@gmail.com</a>
              </div>
            </div>

          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: `Vikram Store <${fromEmail}>`,
      to: [to],
      replyTo: "vikramgirhe07@gmail.com",
      subject: `${documentTitle}: ${invoiceId} - ₹${totalAmount} (Vikram Store)`,
      html: htmlContent,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || "Resend email delivery failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send email via Resend.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

