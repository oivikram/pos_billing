"use client";

import React, { FormEvent, useState } from "react";
import { Line } from "@/types/pos";

export function EmailInvoiceBox({
  invoiceId,
  total,
  date,
  method,
  items,
  cashAmount,
  upiAmount,
  received,
  change,
  isRefund,
}: {
  invoiceId: string;
  total: number;
  date?: string;
  method: string;
  items?: Line[];
  cashAmount?: number;
  upiAmount?: number;
  received?: number;
  change?: number;
  isRefund?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setSending(true);
    setStatus(null);

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email.trim(),
          invoiceId,
          date,
          items,
          total,
          method,
          cashAmount,
          upiAmount,
          received,
          change,
          isRefund,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send invoice email via Resend.");
      }

      setStatus({
        type: "success",
        message: `✓ Invoice successfully emailed to ${email.trim()}!`,
      });
      setEmail("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending email.";
      setStatus({
        type: "error",
        message: `Email Error: ${msg}`,
      });
    } finally {
      setSending(false);
    }
  };

  const handleFallbackDraft = () => {
    const target = email.trim() || "customer@example.com";
    const subject = encodeURIComponent(`Invoice ${invoiceId} from Vikram Store (vikramstore.shop)`);
    const itemsText = (items || [])
      .map((i) => `• ${i.name} (x${i.quantity}) - ₹${(i.price * i.quantity).toFixed(2)}`)
      .join("\n");
    const body = encodeURIComponent(
      `Hello,\n\nHere is your ${isRefund ? "refund receipt" : "tax invoice"} from Vikram Store for ${invoiceId}.\n` +
      `Total: ₹${Math.abs(total).toFixed(2)}\nPayment Mode: ${method}\n\n` +
      `Items:\n${itemsText || "Store merchandise"}\n\n` +
      `Website: www.vikramstore.shop | Email: billing@vikramstore.shop\n` +
      `Thank you for shopping at Vikram Store!`
    );
    window.open(`mailto:${target}?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="email-form-wrap">
      <label style={{ display: "block", font: "700 11px var(--mono)", textTransform: "uppercase", color: "#5f635f" }}>
        📧 Send Invoice to Customer Email (Resend)
      </label>
      <form onSubmit={handleSend} className="email-input-row">
        <input
          type="email"
          className="email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter customer email (e.g. customer@domain.com)"
          disabled={sending}
          required
        />
        <button type="submit" className="email-submit-btn" disabled={sending}>
          {sending ? "Sending..." : "Send Email"}
        </button>
      </form>
      {status && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            className={status.type === "success" ? "email-success-badge" : "refund-banner"}
            style={{ margin: 0, padding: "10px 14px", fontSize: "11px", fontFamily: "var(--mono)", lineHeight: 1.4 }}
          >
            {status.message}
          </div>
          {status.type === "error" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#fbfaf4", border: "1px solid var(--line)", padding: "10px 12px", borderRadius: "3px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                💡 <b>Note on Resend:</b> In free test mode, Resend only delivers to your registered account email. To deliver directly to any customer inbox in background, verify your custom domain on Resend (resend.com/domains).
              </span>
              <button
                type="button"
                onClick={handleFallbackDraft}
                style={{
                  alignSelf: "flex-start",
                  marginTop: "4px",
                  padding: "6px 12px",
                  background: "var(--ink)",
                  color: "var(--paper)",
                  border: 0,
                  font: "700 11px var(--mono)",
                  cursor: "pointer",
                  borderRadius: "2px",
                }}
              >
                ➔ Send via Email Client / Gmail (Instant Fallback)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

