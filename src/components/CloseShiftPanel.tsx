"use client";

import React, { useState } from "react";
import { Sale } from "@/types/pos";
import { syncShiftToSupabase } from "@/lib/supabase";

export function generateShiftId() {
  return `SHIFT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(Date.now()).slice(-4)}`;
}

export function CloseShiftPanel({
  employee,
  float,
  sales,
  shiftStartTime,
  onCancel,
  onConfirmLogout,
}: {
  employee: string;
  float: string;
  sales: Sale[];
  shiftStartTime?: string;
  onCancel: () => void;
  onConfirmLogout: () => void;
}) {
  const [actualCash, setActualCash] = useState("");
  const openingFloat = Number(float) || 0;
  const pureCashSales = sales.filter((s) => s.method === "Cash" && !s.isReturn && s.total > 0);
  const pureUpiSales = sales.filter((s) => s.method === "UPI" && !s.isReturn && s.total > 0);
  const splitSales = sales.filter((s) => s.method === "Split" && !s.isReturn && s.total > 0);
  const cashRefundsList = sales.filter((s) => s.isReturn || s.method === "Cash Refund" || s.total < 0);

  const pureCashTotal = pureCashSales.reduce((sum, s) => sum + s.total, 0);
  const splitCashTotal = splitSales.reduce((sum, s) => sum + (s.cashAmount ?? 0), 0);
  const cashSalesTotal = pureCashTotal + splitCashTotal;

  const pureUpiTotal = pureUpiSales.reduce((sum, s) => sum + s.total, 0);
  const splitUpiTotal = splitSales.reduce((sum, s) => sum + (s.upiAmount ?? 0), 0);
  const upiSalesTotal = pureUpiTotal + splitUpiTotal;

  const cashRefundsTotal = cashRefundsList.reduce((sum, s) => sum + Math.abs(s.total), 0);

  const grossRevenue = cashSalesTotal + upiSalesTotal - cashRefundsTotal;
  const expectedCash = openingFloat + cashSalesTotal - cashRefundsTotal;

  const actualCashNum = actualCash === "" ? null : Number(actualCash);
  const discrepancy = actualCashNum !== null ? actualCashNum - expectedCash : null;

  const handleConfirm = () => {
    const shiftSummary = {
      id: generateShiftId(),
      employee: employee || "Cashier",
      closedAt: new Date().toISOString(),
      openingFloat,
      cashSales: cashSalesTotal,
      cashTransactions: pureCashSales.length + splitSales.length,
      splitTransactions: splitSales.length,
      cashRefunds: cashRefundsTotal,
      cashRefundTransactions: cashRefundsList.length,
      upiSales: upiSalesTotal,
      upiTransactions: pureUpiSales.length + splitSales.length,
      grossRevenue,
      expectedCash,
      actualCash: actualCashNum ?? expectedCash,
      discrepancy: discrepancy ?? 0,
      totalTransactions: sales.length,
    };

    syncShiftToSupabase({
      id: shiftSummary.id,
      employee: shiftSummary.employee,
      closed_at: shiftSummary.closedAt,
      opening_float: shiftSummary.openingFloat,
      cash_sales: shiftSummary.cashSales,
      cash_transactions: shiftSummary.cashTransactions,
      split_transactions: shiftSummary.splitTransactions,
      cash_refunds: shiftSummary.cashRefunds,
      cash_refund_transactions: shiftSummary.cashRefundTransactions,
      upi_sales: shiftSummary.upiSales,
      upi_transactions: shiftSummary.upiTransactions,
      gross_revenue: shiftSummary.grossRevenue,
      expected_cash: shiftSummary.expectedCash,
      actual_cash: shiftSummary.actualCash,
      discrepancy: shiftSummary.discrepancy,
      total_transactions: shiftSummary.totalTransactions,
    });

    onConfirmLogout();
  };

  return (
    <div className="close-panel">
      <button className="back-button" type="button" onClick={onCancel} aria-label="Back">
        <span className="back-arrow-icon">←</span>
        <span>Back to register</span>
      </button>
      <p className="section-kicker">End of Shift / Close Register</p>
      <h2>
        Register
        <br />
        <strong>closing statement.</strong>
      </h2>
      <p className="section-intro">
        Count the cash drawer and review the shift summary statement before logging out.
      </p>

      <div className="cash-count-wrap">
        <label>
          Enter Actual Cash in Drawer (Physical Count)
          <div className="cash-count-input">
            <span>₹</span>
            <input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder={expectedCash.toFixed(2)}
              autoFocus
            />
          </div>
        </label>
      </div>

      <div className="statement-paper">
        <div className="statement-head">
          <span>VIKRAM STORE · REGISTER CLOSING STATEMENT (vikramstore.shop)</span>
          <span>
            {shiftStartTime
              ? `Shift: ${new Date(shiftStartTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} → ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : new Date().toLocaleString("en-IN")}
          </span>
        </div>
        <div className="statement-row">
          <span>Cashier / Employee ID</span>
          <b>{employee || "Cashier"}</b>
        </div>
        <div className="statement-row">
          <span>Opening Float Deposit</span>
          <b>₹{openingFloat.toFixed(2)}</b>
        </div>
        <div className="statement-row">
          <span>Cash Collected ({pureCashSales.length} cash + {splitSales.length} split)</span>
          <b>₹{cashSalesTotal.toFixed(2)}</b>
        </div>
        {cashRefundsTotal > 0 && (
          <div className="statement-row">
            <span>Cash Refunds Paid Out ({cashRefundsList.length} returns)</span>
            <b className="refund-text-neg">-₹{cashRefundsTotal.toFixed(2)}</b>
          </div>
        )}
        <div className="statement-row">
          <span>UPI Collected ({pureUpiSales.length} upi + {splitSales.length} split)</span>
          <b>₹{upiSalesTotal.toFixed(2)}</b>
        </div>
        <div className="statement-row total-row">
          <span>Net Shift Revenue ({sales.length} total txns)</span>
          <b>₹{grossRevenue.toFixed(2)}</b>
        </div>
        <div className="statement-row highlight-row">
          <span>Expected Cash in Drawer (Float + Cash Collected - Refunds)</span>
          <b>₹{expectedCash.toFixed(2)}</b>
        </div>
        {actualCashNum !== null && (
          <>
            <div className="statement-row">
              <span>Actual Cash Counted</span>
              <b>₹{actualCashNum.toFixed(2)}</b>
            </div>
            <div className="statement-row">
              <span>Cash Reconciliation Discrepancy</span>
              <div>
                {discrepancy === 0 ? (
                  <span className="discrepancy-badge discrepancy-balanced">
                    ✓ Balanced (₹0.00)
                  </span>
                ) : discrepancy! > 0 ? (
                  <span className="discrepancy-badge discrepancy-over">
                    + Over (+₹{discrepancy!.toFixed(2)})
                  </span>
                ) : (
                  <span className="discrepancy-badge discrepancy-short">
                    - Short (-₹{Math.abs(discrepancy!).toFixed(2)})
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="statement-actions">
        <button
          type="button"
          className="statement-button print-invoice"
          onClick={() => window.print()}
        >
          Print / Save PDF
        </button>
        <button
          type="button"
          className="statement-button confirm-logout-button"
          onClick={handleConfirm}
        >
          Confirm & Log out
        </button>
      </div>

      {sales.length > 0 && (
        <div className="shift-sales-preview" style={{ marginTop: "24px" }}>
          <div className="statement-head" style={{ padding: "10px 14px", background: "#f5f2eb" }}>
            <span>Shift Transactions ({sales.length})</span>
          </div>
          {sales
            .slice()
            .reverse()
            .map((sale) => {
              const isRefund = sale.isReturn || sale.method === "Cash Refund" || sale.total < 0;
              return (
                <div className="history-item" key={sale.invoice}>
                  <div>
                    <strong>{sale.invoice}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <small>
                        {new Date(sale.date).toLocaleTimeString("en-IN")} · {sale.method}
                      </small>
                      {isRefund && <span className="refund-badge">Refund</span>}
                    </div>
                  </div>
                  <b className={isRefund ? "refund-text-neg" : ""}>
                    {isRefund ? `-₹${Math.abs(sale.total).toFixed(2)}` : `₹${sale.total.toFixed(2)}`}
                  </b>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
