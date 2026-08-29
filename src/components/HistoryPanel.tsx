"use client";

import React, { useState } from "react";
import { Sale } from "@/types/pos";
import { StoreReceiptPaper } from "@/components/StoreReceiptPaper";
import { EmailInvoiceBox } from "@/components/EmailInvoiceBox";

export function HistoryPanel({
  sales,
  shiftSales,
  onBack,
}: {
  sales: Sale[];
  shiftSales: Sale[];
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [tab, setTab] = useState<"shift" | "all">("shift");

  const activeSalesList = tab === "shift" ? shiftSales : sales;

  const result = activeSalesList.filter((sale) =>
    sale.invoice.toLowerCase().includes(query.toLowerCase())
  );

  if (selectedSale) {
    const isRefund =
      selectedSale.isReturn ||
      selectedSale.method === "Cash Refund" ||
      selectedSale.total < 0;

    return (
      <div className="history-panel invoice-detail-panel">
        <button
          className="back-button"
          type="button"
          onClick={() => setSelectedSale(null)}
          aria-label="Back"
        >
          <span className="back-arrow-icon">←</span>
          <span>Back to payment history</span>
        </button>
        <p
          className="section-kicker"
          style={{ color: isRefund ? "#a94c38" : "var(--olive)" }}
        >
          {isRefund ? "Refund Document" : "Historical Tax Invoice"}
        </p>
        <h2>
          {isRefund ? "Refund" : "Invoice"}
          <br />
          <strong>{selectedSale.invoice}</strong>
        </h2>

        <StoreReceiptPaper
          invoiceId={selectedSale.invoice}
          date={selectedSale.date}
          method={selectedSale.method}
          items={selectedSale.items}
          total={selectedSale.total}
          cashAmount={selectedSale.cashAmount}
          upiAmount={selectedSale.upiAmount}
          received={selectedSale.received}
          change={selectedSale.change}
          isRefund={isRefund}
          originalInvoice={selectedSale.originalInvoice}
        />

        <EmailInvoiceBox
          invoiceId={selectedSale.invoice}
          total={selectedSale.total}
          date={selectedSale.date}
          method={selectedSale.method}
          items={selectedSale.items}
          cashAmount={selectedSale.cashAmount}
          upiAmount={selectedSale.upiAmount}
          received={selectedSale.received}
          change={selectedSale.change}
          isRefund={isRefund}
        />

        <div className="invoice-actions" style={{ marginTop: "18px" }}>
          <button
            type="button"
            className="statement-button print-invoice"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              minHeight: "46px",
              width: "100%",
            }}
            onClick={() => window.print()}
          >
            🖨️ Reprint / Save PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-panel">
      <button className="back-button" type="button" onClick={onBack} aria-label="Back">
        <span className="back-arrow-icon">←</span>
        <span>Back to billing</span>
      </button>
      <p className="section-kicker">Cashier timeline</p>
      <h2>
        Payment
        <br />
        <strong>history.</strong>
      </h2>

      <div style={{ display: "flex", gap: "8px", margin: "14px 0 10px" }}>
        <button
          type="button"
          onClick={() => setTab("shift")}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 800,
            fontFamily: "var(--mono)",
            border: "1px solid",
            borderColor: tab === "shift" ? "var(--olive)" : "var(--line)",
            background: tab === "shift" ? "var(--soft-lime)" : "var(--white)",
            color: tab === "shift" ? "#3f470a" : "var(--charcoal)",
            cursor: "pointer",
          }}
        >
          🟢 Current Shift ({shiftSales.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("all")}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 800,
            fontFamily: "var(--mono)",
            border: "1px solid",
            borderColor: tab === "all" ? "var(--olive)" : "var(--line)",
            background: tab === "all" ? "var(--soft-lime)" : "var(--white)",
            color: tab === "all" ? "#3f470a" : "var(--charcoal)",
            cursor: "pointer",
          }}
        >
          📁 All Time Records ({sales.length})
        </button>
      </div>

      <label className="history-search">
        Search invoice number
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="INV-20260827"
        />
      </label>

      <div className="history-list">
        {result.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "var(--muted)",
              font: "12px var(--mono)",
            }}
          >
            No matching invoices found in {tab === "shift" ? "current shift" : "database"}.
          </div>
        ) : (
          result
            .slice()
            .reverse()
            .map((sale) => {
              const isRefund =
                sale.isReturn ||
                sale.method === "Cash Refund" ||
                sale.total < 0;
              const isSplit = sale.method === "Split";
              return (
                <div
                  className="history-item clickable"
                  key={sale.invoice}
                  onClick={() => setSelectedSale(sale)}
                  title="Click to view details, reprint PDF or email invoice"
                >
                  <div>
                    <strong>{sale.invoice}</strong>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "4px",
                      }}
                    >
                      <small>
                        {new Date(sale.date).toLocaleString("en-IN")} ·{" "}
                        {isSplit
                          ? `Split (Cash ₹${(sale.cashAmount ?? 0).toFixed(2)} + UPI ₹${(sale.upiAmount ?? 0).toFixed(2)})`
                          : sale.method}
                      </small>
                      {isRefund && (
                        <span className="refund-badge">Refund (Cash)</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <b className={isRefund ? "refund-text-neg" : ""}>
                      {isRefund
                        ? `-₹${Math.abs(sale.total).toFixed(2)}`
                        : `₹${sale.total.toFixed(2)}`}
                    </b>
                    <button
                      type="button"
                      className="history-view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSale(sale);
                      }}
                    >
                      View Invoice
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
