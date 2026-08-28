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
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; vertical-align: middle;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; color: #111111;">
              ${item.name}
            </div>
            <div style="font-family: monospace; font-size: 11px; color: #777777; margin-top: 2px;">
              ${item.quantity} pcs × ₹${Number(item.price).toFixed(2)}
            </div>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: middle; font-family: monospace; font-size: 13px; font-weight: 700; color: #111111;">
            ₹${(Number(item.price) * Number(item.quantity)).toFixed(2)}
          </td>
        </tr>
      `
      )
      .join("");

    const splitBreakdownHtml =
      method === "Split"
        ? `
        <div style="background-color: #f8f9fa; padding: 10px 12px; margin-top: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: #666;">• Cash Paid:</span>
            <b>₹${Number(cashAmount || 0).toFixed(2)}</b>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666;">• Online UPI:</span>
            <b>₹${Number(upiAmount || 0).toFixed(2)}</b>
          </div>
        </div>
      `
        : "";

    const cashChangeHtml =
      received !== undefined && change !== undefined && change > 0
        ? `
        <div style="margin-top: 8px; font-family: monospace; font-size: 12px; color: #555555;">
          <div>• Cash Tendered: ₹${Number(received).toFixed(2)}</div>
          <div>• Change Returned: ₹${Number(change).toFixed(2)}</div>
        </div>
      `
        : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="x-apple-disable-message-reformatting">
          <title>${documentTitle} - ${invoiceId}</title>
        </head>
        <body style="margin: 0; padding: 12px 6px; background-color: #f3f3f3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <div style="max-width: 420px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e2e2; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            
            <!-- Compact Header -->
            <div style="background-color: #1f2321; color: #ffffff; padding: 16px 18px; text-align: left;">
              <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #c8db36; text-transform: uppercase;">
                VIKRAM STORE
              </div>
              <div style="font-size: 10px; color: #a1a1aa; margin: 2px 0 8px;">
                Retail Supermarket · www.vikramstore.shop
              </div>
              <div style="font-size: 18px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">
                ${documentTitle}
              </div>
              <div style="font-family: monospace; font-size: 12px; color: #d4d4d8;">
                ${invoiceId}
              </div>
            </div>

            <!-- Receipt Meta -->
            <div style="padding: 14px 18px; background-color: #fafafa; border-bottom: 1px dashed #dddddd; font-size: 12px; color: #555555; line-height: 1.5;">
              <div style="display: flex; justify-content: space-between;">
                <span>Date:</span>
                <strong style="color: #222;">${formattedDate}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Payment Mode:</span>
                <strong style="color: #222;">${method}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Terminal:</span>
                <span>vikramstore.shop (POS 01)</span>
              </div>
            </div>

            <!-- Items Table -->
            <div style="padding: 12px 18px 16px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  ${itemsRowsHtml || `<tr><td colspan="2" style="padding: 10px 0; font-size: 12px; color: #666;">Store items</td></tr>`}
                </tbody>
              </table>

              ${splitBreakdownHtml}
              ${cashChangeHtml}

              <!-- Net Total Box -->
              <div style="background-color: ${isRefund ? "#fdf2f0" : "#f8faec"}; border: 1px solid ${isRefund ? "#f0b8af" : "#d8ef6a"}; border-radius: 6px; padding: 12px 14px; margin-top: 14px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; font-weight: 700; font-family: monospace; text-transform: uppercase; color: #555555;">
                  ${isRefund ? "Total Refunded" : "Net Paid"}
                </span>
                <span style="font-size: 22px; font-weight: 800; font-family: monospace; color: ${isRefund ? "#a94c38" : "#1f2321"};">
                  ${isRefund ? `-₹${totalAmount}` : `₹${totalAmount}`}
                </span>
              </div>

              <!-- Footer -->
              <div style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed #e2e2e2; text-align: center; font-size: 11px; color: #777777; line-height: 1.5;">
                <strong style="color: #222;">*** Thank you for shopping at Vikram Store! ***</strong><br>
                Visit: <a href="https://vikramstore.shop" style="color: #1a73e8; text-decoration: none;">www.vikramstore.shop</a> · <a href="mailto:vikramgirhe07@gmail.com" style="color: #777777; text-decoration: none;">vikramgirhe07@gmail.com</a>
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

