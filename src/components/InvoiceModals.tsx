"use client";

import React from "react";
import { Line } from "@/types/pos";
import { StoreReceiptPaper } from "@/components/StoreReceiptPaper";
import { EmailInvoiceBox } from "@/components/EmailInvoiceBox";

export function Invoice({
  invoice,
  method,
  total,
  items,
  cashAmount,
  upiAmount,
  change,
  received,
  onFinish,
}: {
  invoice: string;
  method: string;
  total: number;
  items?: Line[];
  cashAmount?: number;
  upiAmount?: number;
  change?: number;
  received?: number;
  onFinish: () => void;
}) {
  return (
    <div className="payment-modal-backdrop">
      <div className="payment-modal invoice-view">
        <button
          className="payment-close"
          type="button"
          onClick={onFinish}
          title="Back to billing"
          aria-label="Back to billing"
        >
          ←
        </button>
        <p className="section-kicker">Payment complete</p>
        <h2>
          Invoice
          <br />
          <strong>ready.</strong>
        </h2>

        <StoreReceiptPaper
          invoiceId={invoice}
          method={method}
          total={total}
          items={items}
          cashAmount={cashAmount}
          upiAmount={upiAmount}
          change={change}
          received={received}
        />

        <EmailInvoiceBox
          invoiceId={invoice}
          total={total}
          method={method}
          items={items}
          cashAmount={cashAmount}
          upiAmount={upiAmount}
          change={change}
          received={received}
        />

        <div className="invoice-actions" style={{ marginTop: "16px" }}>
          <button className="print-invoice" onClick={() => window.print()}>
            Print / Save PDF
          </button>
          <button className="email-invoice back-action-btn" onClick={onFinish}>
            <span className="back-arrow-icon">←</span>
            <span>Back to billing</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function RefundInvoice({
  id,
  items,
  total,
  originalInvoice,
  onFinish,
}: {
  id: string;
  items: Line[];
  total: number;
  originalInvoice?: string;
  onFinish: () => void;
}) {
  return (
    <div className="payment-modal-backdrop">
      <div className="payment-modal invoice-view">
        <button
          className="payment-close"
          type="button"
          onClick={onFinish}
          title="Back to billing"
          aria-label="Back to billing"
        >
          ←
        </button>
        <p className="section-kicker" style={{ color: "#a94c38" }}>
          Cash Refund Completed
        </p>
        <h2>
          Refund receipt
          <br />
          <strong>voucher.</strong>
        </h2>

        <StoreReceiptPaper
          invoiceId={id}
          method="Cash Refund"
          total={total}
          items={items}
          isRefund={true}
          originalInvoice={originalInvoice}
        />

        <EmailInvoiceBox
          invoiceId={id}
          total={total}
          method="Cash Refund"
          items={items}
          isRefund={true}
        />

        <div className="invoice-actions" style={{ marginTop: "16px" }}>
          <button className="print-invoice" onClick={() => window.print()}>
            Print / Save PDF
          </button>
          <button className="email-invoice back-action-btn" onClick={onFinish}>
            <span className="back-arrow-icon">←</span>
            <span>Back to billing</span>
          </button>
        </div>
      </div>
    </div>
  );
}

