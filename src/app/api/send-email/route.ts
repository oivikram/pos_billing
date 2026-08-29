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
          <td style="padding: 9px 0; border-bottom: 1px dashed #e5e7eb; vertical-align: top;">
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 700; color: #111827; line-height: 1.3;">
              ${item.name}
            </div>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #6b7280; margin-top: 3px;">
              ${item.quantity} Qty × ₹${Number(item.price).toFixed(2)}
            </div>
          </td>
          <td style="padding: 9px 0; border-bottom: 1px dashed #e5e7eb; text-align: right; vertical-align: top; font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 700; color: #111827; white-space: nowrap;">
            ₹${(Number(item.price) * Number(item.quantity)).toFixed(2)}
          </td>
        </tr>
      `
      )
      .join("");

    const totalNum = Math.abs(Number(total) || 0);
    // Statutory Indian GST Reverse Calculation (5.0% FMCG/Grocery Slab: CGST 2.5% + SGST 2.5%)
    const gstRate = 0.05;
    const taxableSubtotal = totalNum / (1 + gstRate);
    const totalGstAmount = totalNum - taxableSubtotal;
    const cgst = (totalGstAmount / 2).toFixed(2);
    const sgst = (totalGstAmount / 2).toFixed(2);
    const taxableValue = taxableSubtotal.toFixed(2);
    const totalItemsCount = (items || []).reduce(
      (sum: number, item: { quantity: number }) => sum + (Number(item.quantity) || 1),
      0
    );

    const splitBreakdownHtml =
      method === "Split"
        ? `
        <div style="background-color: #f3f4f6; border-left: 3px solid #111827; padding: 10px 12px; margin: 12px 0 6px; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #374151;">
            <span>💵 Cash Portion:</span>
            <b>₹${Number(cashAmount || 0).toFixed(2)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; color: #374151;">
            <span>📱 Online UPI:</span>
            <b>₹${Number(upiAmount || 0).toFixed(2)}</b>
          </div>
        </div>
      `
        : "";

    const cashChangeHtml =
      received !== undefined && change !== undefined && change > 0
        ? `
        <div style="margin-top: 6px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #4b5563;">
          <div>• Cash Received: ₹${Number(received).toFixed(2)}</div>
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
        <body style="margin: 0; padding: 20px 10px; background-color: #edebe4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <!-- Outer Receipt Slip -->
          <div style="max-width: 410px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 4px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); border: 1px solid #dcd7cb; overflow: hidden;">
            
            <!-- Top Serrated / Header Accent -->
            <div style="height: 6px; background: repeating-linear-gradient(90deg, #111827 0, #111827 10px, #c8db36 10px, #c8db36 20px);"></div>

            <!-- Receipt Content -->
            <div style="padding: 24px 22px 20px;">
              
              <!-- Store Brand Title -->
              <div style="text-align: center;">
                <div style="font-size: 23px; font-weight: 900; letter-spacing: 2px; color: #111827; text-transform: uppercase; font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0;">
                  VIKRAM STORE
                </div>
                <div style="font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #4b5563; text-transform: uppercase; margin: 4px 0 2px;">
                  Retail Supermarket & FMCG Store
                </div>
                <div style="font-size: 11px; font-weight: 700; color: #2563eb; margin: 2px 0;">
                  <a href="https://vikramstore.shop" style="color: #2563eb; text-decoration: none;">www.vikramstore.shop</a>
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #6b7280; margin-top: 3px;">
                  GSTIN: 27AABCV1234F1Z5 · TEL: +91 8591704117
                </div>

                <!-- Document Type Badge -->
                <div style="margin: 12px 0 8px;">
                  <span style="display: inline-block; padding: 4px 14px; background-color: ${isRefund ? "#fef2f2" : "#f4f3ec"}; border: 1px solid ${isRefund ? "#fca5a5" : "#d1d5db"}; color: ${isRefund ? "#b91c1c" : "#111827"}; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; font-family: 'Courier New', Courier, monospace; border-radius: 2px;">
                    ${isRefund ? "★ CASH REFUND VOUCHER ★" : "★ RETAIL TAX INVOICE ★"}
                  </span>
                </div>
              </div>

              <!-- Decorative Divider -->
              <div style="border-top: 2px dashed #9ca3af; margin: 14px 0 12px;"></div>

              <!-- Invoice Meta Grid -->
              <table style="width: 100%; border-collapse: collapse; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #374151; line-height: 1.6;">
                <tr>
                  <td style="color: #6b7280;">INVOICE NO:</td>
                  <td style="text-align: right; font-weight: 700; color: #111827;">${invoiceId}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">DATE & TIME:</td>
                  <td style="text-align: right; font-weight: 700; color: #111827;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">PAYMENT MODE:</td>
                  <td style="text-align: right; font-weight: 700; color: ${isRefund ? "#b91c1c" : "#111827"};">${method}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">CASHIER / POS:</td>
                  <td style="text-align: right; color: #111827;">Terminal 01 · Online</td>
                </tr>
              </table>

              <!-- Decorative Divider -->
              <div style="border-top: 2px dashed #9ca3af; margin: 12px 0 10px;"></div>

              <!-- Items Table Header -->
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid #111827; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #111827;">
                    <th style="text-align: left; padding: 4px 0;">ITEM DESCRIPTION</th>
                    <th style="text-align: right; padding: 4px 0;">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRowsHtml || `<tr><td colspan="2" style="padding: 10px 0; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #6b7280;">Store items</td></tr>`}
                </tbody>
              </table>

              <!-- Subtotal & Tax Breakdown -->
              <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #d1d5db; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #4b5563; line-height: 1.6;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Total Items / Qty:</span>
                  <span>${items.length} items (${totalItemsCount} pcs)</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Taxable Subtotal:</span>
                  <span>₹${taxableValue}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>CGST (2.5%):</span>
                  <span>₹${cgst}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>SGST (2.5%):</span>
                  <span>₹${sgst}</span>
                </div>
              </div>

              ${splitBreakdownHtml}
              ${cashChangeHtml}

              <!-- Highlighted Grand Total Box -->
              <div style="margin-top: 14px; padding: 14px 16px; background-color: ${isRefund ? "#fef2f2" : "#111827"}; border: 2px solid ${isRefund ? "#b91c1c" : "#111827"}; border-radius: 4px; color: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: ${isRefund ? "#991b1b" : "#9ca3af"};">
                      ${isRefund ? "TOTAL REFUND" : "NET AMOUNT PAID"}
                    </div>
                    <div style="font-size: 10px; color: ${isRefund ? "#b91c1c" : "#9ca3af"}; margin-top: 2px;">
                      Inclusive of all taxes
                    </div>
                  </div>
                  <div style="font-family: 'Courier New', Courier, monospace; font-size: 26px; font-weight: 900; color: ${isRefund ? "#b91c1c" : "#c8f53a"}; letter-spacing: -0.5px;">
                    ${isRefund ? `-₹${totalAmount}` : `₹${totalAmount}`}
                  </div>
                </div>
              </div>

              <!-- Decorative Divider -->
              <div style="border-top: 2px dashed #9ca3af; margin: 18px 0 14px;"></div>

              <!-- Barcode Graphic Simulation -->
              <div style="text-align: center; margin: 8px 0;">
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 18px; letter-spacing: 4px; font-weight: 900; color: #111827;">
                  ||| | | |||| | |||
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 2px; color: #6b7280; margin-top: 4px;">
                  *${invoiceId}*
                </div>
              </div>

              <!-- Thermal Receipt Footer -->
              <div style="text-align: center; margin-top: 14px; font-size: 11px; color: #4b5563; line-height: 1.5;">
                <div style="font-weight: 800; color: #111827; font-size: 12px; margin-bottom: 2px;">
                  *** THANK YOU FOR SHOPPING WITH US! ***
                </div>
                <div>Please retain this e-receipt for your records & returns.</div>
                <div style="margin-top: 6px; font-size: 10px; color: #059669; font-weight: 700;">
                  🌱 Digital Eco-Receipt · Save Trees & Go Green
                </div>
                <div style="margin-top: 6px; font-size: 10px; color: #9ca3af;">
                  Support: <a href="mailto:vikramgirhe07@gmail.com" style="color: #4b5563; text-decoration: underline;">vikramgirhe07@gmail.com</a> · <a href="https://vikramstore.shop" style="color: #2563eb; text-decoration: none;">vikramstore.shop</a>
                </div>
              </div>

            </div>

            <!-- Bottom Thermal Edge -->
            <div style="height: 6px; background: repeating-linear-gradient(90deg, #111827 0, #111827 10px, #c8db36 10px, #c8db36 20px);"></div>

          </div>
        </body>
      </html>
    `;

    let result = await resend.emails.send({
      from: `Vikram Store <${fromEmail}>`,
      to: [to],
      replyTo: "vikramgirhe07@gmail.com",
      subject: `${documentTitle}: ${invoiceId} - ₹${totalAmount} (Vikram Store)`,
      html: htmlContent,
    });

    // If custom domain sending failed (e.g. domain pending verification in Resend),
    // and recipient is the store owner, try fallback to onboarding@resend.dev
    if (result.error && fromEmail !== "onboarding@resend.dev") {
      result = await resend.emails.send({
        from: "Vikram Store <onboarding@resend.dev>",
        to: [to],
        replyTo: "vikramgirhe07@gmail.com",
        subject: `${documentTitle}: ${invoiceId} - ₹${totalAmount} (Vikram Store)`,
        html: htmlContent,
      });
    }

    if (result.error) {
      let errorMessage = result.error.message || "Resend email delivery failed.";
      if (
        errorMessage.toLowerCase().includes("domain") ||
        errorMessage.toLowerCase().includes("not verified") ||
        errorMessage.toLowerCase().includes("testing")
      ) {
        errorMessage =
          "Domain 'vikramstore.shop' is pending verification on Resend (resend.com/domains). In test mode, emails can only be sent to your account email (vikramgirhe07@gmail.com) until DNS records are verified.";
      }
      return NextResponse.json(
        { error: errorMessage },
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


