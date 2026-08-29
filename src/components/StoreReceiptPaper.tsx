"use client";

import React from "react";
import { Line } from "@/types/pos";

export function StoreReceiptPaper({
  invoiceId,
  date,
  method,
  items = [],
  total,
  cashAmount,
  upiAmount,
  received,
  change,
  isRefund,
  originalInvoice,
  employee,
}: {
  invoiceId: string;
  date?: string;
  method: string;
  items?: Line[];
  total: number;
  cashAmount?: number;
  upiAmount?: number;
  received?: number;
  change?: number;
  isRefund?: boolean;
  originalInvoice?: string;
  employee?: string;
}) {
  const formattedDate = date
    ? new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = Math.abs(total);
  const gstRate = 0.05;
  const taxableSubtotal = totalAmount / (1 + gstRate);
  const totalGstAmount = totalAmount - taxableSubtotal;
  const cgst = (totalGstAmount / 2).toFixed(2);
  const sgst = (totalGstAmount / 2).toFixed(2);
  const taxableFormatted = taxableSubtotal.toFixed(2);

  return (
    <div className="store-invoice-paper">
      <div className="store-invoice-header">
        <h1 className="store-brand-title">VIKRAM STORE</h1>
        <p className="store-brand-sub">Retail Supermarket & FMCG Store</p>
        <p className="store-brand-domain">www.vikramstore.shop · billing@vikramstore.shop</p>
        <p className="store-tax-ids">GSTIN: 27AABCV1234F1Z5 · FSSAI Lic: 11521012000452</p>
        <div className="store-invoice-type">
          {isRefund ? "★ CASH REFUND VOUCHER ★" : "★ TAX INVOICE / RETAIL CASH MEMO ★"}
        </div>
      </div>

      <div className="store-meta-grid">
        <div>
          <span>Invoice No:</span>
          <strong>{invoiceId}</strong>
        </div>
        <div>
          <span>Date & Time:</span>
          <strong>{formattedDate}</strong>
        </div>
        <div>
          <span>Cashier:</span>
          <strong>{employee || "Terminal 01 (vikramstore.shop)"}</strong>
        </div>
        <div>
          <span>Payment Mode:</span>
          <strong>{method === "Split" ? "Split (Cash + UPI)" : method}</strong>
        </div>
        {originalInvoice && (
          <div style={{ gridColumn: "span 2" }}>
            <span>Original Invoice Ref:</span>
            <strong>{originalInvoice}</strong>
          </div>
        )}
      </div>

      <div className="store-items-table-wrap">
        <table className="store-items-table">
          <thead>
            <tr>
              <th style={{ width: "24px" }}>#</th>
              <th>Item Description</th>
              <th style={{ textAlign: "center", width: "40px" }}>Qty</th>
              <th style={{ textAlign: "right", width: "65px" }}>Rate</th>
              <th style={{ textAlign: "right", width: "75px" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, idx) => (
                <tr key={item.barcode || idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <small>{item.barcode}</small>
                  </td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>₹{item.price.toFixed(2)}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "12px 0", color: "#666" }}>
                  Store Merchandise ({itemCount} items)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="store-summary-block">
        <div className="store-sum-row">
          <span>Total Items Count:</span>
          <span>{items.length} items ({itemCount} total pcs)</span>
        </div>
        <div className="store-sum-row">
          <span>Taxable Subtotal:</span>
          <span>₹{taxableFormatted}</span>
        </div>
        <div className="store-sum-row">
          <span>CGST (2.5%):</span>
          <span>₹{cgst}</span>
        </div>
        <div className="store-sum-row">
          <span>SGST (2.5%):</span>
          <span>₹{sgst}</span>
        </div>

        <div className="store-grand-total-row">
          <span>{isRefund ? "TOTAL CASH REFUNDED" : "NET AMOUNT PAID"}</span>
          <b>{isRefund ? `-₹${totalAmount.toFixed(2)}` : `₹${totalAmount.toFixed(2)}`}</b>
        </div>

        {method === "Split" && (
          <div className="store-tender-box">
            <div>
              <span>• Cash Received:</span>
              <b>₹{Number(cashAmount || 0).toFixed(2)}</b>
            </div>
            <div>
              <span>• Online UPI:</span>
              <b>₹{Number(upiAmount || 0).toFixed(2)}</b>
            </div>
          </div>
        )}

        {received !== undefined && change !== undefined && change > 0 && (
          <div className="store-tender-box">
            <div>
              <span>• Cash Tendered:</span>
              <b>₹{Number(received).toFixed(2)}</b>
            </div>
            <div>
              <span>• Change Returned:</span>
              <b>₹{Number(change).toFixed(2)}</b>
            </div>
          </div>
        )}
      </div>

      <div className="store-invoice-footer">
        <p className="store-footer-policy">
          {isRefund
            ? "Refund processed in cash. Items returned to inventory."
            : "Goods once sold can be returned within 7 days with original receipt."}
        </p>
        <div className="store-thermal-barcode">||| |||| || ||||| |||| ||| |||||||</div>
        <p className="store-footer-thanks">*** THANK YOU FOR VISITING VIKRAM STORE ***</p>
        <p className="store-footer-brand">www.vikramstore.shop · Support: vikramgirhe07@gmail.com</p>
      </div>
    </div>
  );
}
