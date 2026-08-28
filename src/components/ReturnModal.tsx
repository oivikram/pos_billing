"use client";

import React, { FormEvent, useState } from "react";
import { Line, Product, Sale } from "@/types/pos";

export function generateRefundId() {
  return `REF-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(Date.now()).slice(-6)}`;
}

export function ReturnModal({
  sales,
  catalog,
  onClose,
  onProcessRefund,
}: {
  sales: Sale[];
  catalog: Product[];
  onClose: () => void;
  onProcessRefund: (refundSale: Sale) => void;
}) {
  const [searchInv, setSearchInv] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [returnCart, setReturnCart] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pastRefunds = sales.filter((s) => s.isReturn && s.originalInvoice);

  const handleSearchInvoice = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = searchInv.trim().toUpperCase();
    if (!clean) return;

    const found = sales.find(
      (s) => s.invoice.toUpperCase() === clean && !s.isReturn
    );

    if (!found) {
      setError(`No completed invoice found matching "${clean}".`);
      setSelectedInvoice(null);
      return;
    }

    setSelectedInvoice(found);
    setReturnCart([]);
  };

  const invoiceAvailableItems: Line[] = selectedInvoice
    ? (selectedInvoice.items || []).map((origItem) => {
        const alreadyRefundedQty = pastRefunds
          .filter((r) => r.originalInvoice === selectedInvoice.invoice)
          .flatMap((r) => r.items || [])
          .filter((i) => i.barcode === origItem.barcode)
          .reduce((sum, i) => sum + i.quantity, 0);

        const available = Math.max(0, origItem.quantity - alreadyRefundedQty);
        return { ...origItem, quantity: available };
      })
    : [];

  const addInvoiceItem = (item: Line) => {
    const maxAvailable = item.quantity;
    if (maxAvailable <= 0) return;

    setReturnCart((curr) => {
      const existing = curr.find((p) => p.barcode === item.barcode);
      if (existing) {
        if (existing.quantity >= maxAvailable) return curr;
        return curr.map((p) =>
          p.barcode === item.barcode ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...curr, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (barcode: string) => {
    setReturnCart((curr) => curr.filter((item) => item.barcode !== barcode));
  };

  const updateQuantity = (barcode: string, delta: number) => {
    setReturnCart((curr) =>
      curr
        .map((item) => {
          if (item.barcode === barcode) {
            const maxAllowed = selectedInvoice
              ? (invoiceAvailableItems.find((i) => i.barcode === barcode)?.quantity ?? 0)
              : 99;
            const newQty = item.quantity + delta;
            if (newQty > maxAllowed) return item;
            return { ...item, quantity: Math.max(0, newQty) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const refundTotal = returnCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleConfirmRefund = () => {
    if (returnCart.length === 0 || refundTotal <= 0) return;
    const refundSale: Sale = {
      invoice: generateRefundId(),
      date: new Date().toISOString(),
      total: -refundTotal,
      method: "Cash Refund",
      items: returnCart,
      isReturn: true,
      originalInvoice: selectedInvoice?.invoice,
    };
    onProcessRefund(refundSale);
  };

  return (
    <div className="payment-modal-backdrop">
      <div className="payment-modal" style={{ maxWidth: "620px" }}>
        <button
          className="payment-close"
          type="button"
          onClick={onClose}
          title="Back to billing"
          aria-label="Back to billing"
        >
          ←
        </button>
        <p className="section-kicker" style={{ color: "#a94c38" }}>
          Customer Returns
        </p>
        <h2>
          Process product
          <br />
          <strong>return & refund.</strong>
        </h2>

        <form onSubmit={handleSearchInvoice} style={{ margin: "16px 0 20px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px", font: "500 11px var(--mono)", textTransform: "uppercase", color: "var(--muted)" }}>
            Lookup Original Invoice Number
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={searchInv}
                onChange={(e) => setSearchInv(e.target.value)}
                placeholder="e.g. INV-20260828-..."
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "1px solid var(--line)",
                  background: "var(--white)",
                  font: "14px var(--mono)",
                  outline: 0,
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "0 18px",
                  background: "var(--ink)",
                  color: "var(--paper)",
                  border: 0,
                  font: "700 12px var(--mono)",
                  cursor: "pointer",
                }}
              >
                Search
              </button>
            </div>
          </label>
        </form>

        {error && (
          <div className="refund-banner" style={{ margin: "0 0 16px" }}>
            ⚠️ {error}
          </div>
        )}

        {selectedInvoice && (
          <div style={{ border: "1px solid var(--line)", background: "var(--white)", padding: "16px", marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ece9e0", paddingBottom: "8px", marginBottom: "10px", font: "11px var(--mono)" }}>
              <span>Invoice: <b>{selectedInvoice.invoice}</b></span>
              <span>Paid: <b>₹{selectedInvoice.total.toFixed(2)}</b> ({selectedInvoice.method})</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "8px", textTransform: "uppercase", fontFamily: "var(--mono)" }}>
              Select items from original bill to return:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {invoiceAvailableItems.map((item) => {
                const inCart = returnCart.find((p) => p.barcode === item.barcode)?.quantity || 0;
                const isFullyReturned = item.quantity <= 0;
                const isAllSelected = inCart >= item.quantity;

                return (
                  <div
                    key={item.barcode}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      background: isFullyReturned ? "#f9f8f5" : isAllSelected ? "#f4f8e6" : "#ffffff",
                      border: "1px solid var(--line)",
                      opacity: isFullyReturned ? 0.6 : 1,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "12px" }}>{item.name}</div>
                      <small style={{ color: "var(--muted)", font: "10px var(--mono)" }}>
                        Rate: ₹{item.price.toFixed(2)} · Available for return: {item.quantity}
                      </small>
                    </div>

                    <button
                      type="button"
                      disabled={isFullyReturned || isAllSelected}
                      onClick={() => addInvoiceItem(item)}
                      style={{
                        padding: "6px 12px",
                        background: isAllSelected ? "#e5edb5" : "var(--ink)",
                        color: isAllSelected ? "#3f470a" : "var(--paper)",
                        border: 0,
                        font: "700 11px var(--mono)",
                        cursor: isFullyReturned || isAllSelected ? "not-allowed" : "pointer",
                      }}
                    >
                      {isFullyReturned ? "Already Returned" : isAllSelected ? "✓ In Return Bill" : "+ Add to Return"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Return Bill items */}
        <div style={{ borderTop: "2px solid var(--line)", paddingTop: "14px", marginTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", font: "700 12px var(--mono)", textTransform: "uppercase" }}>
            <span>Items Being Refunded ({returnCart.length})</span>
            <span style={{ color: "#a94c38" }}>Refund Total: ₹{refundTotal.toFixed(2)}</span>
          </div>

          {returnCart.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)", font: "12px var(--mono)", background: "#fcfbf8", border: "1px dashed var(--line)" }}>
              No items added to return bill yet. Search an invoice above.
            </div>
          ) : (
            returnCart.map((item) => {
              const origAvail = selectedInvoice
                ? (invoiceAvailableItems.find((i) => i.barcode === item.barcode)?.quantity ?? 0)
                : 99;
              const isAtMax = item.quantity >= origAvail;

              return (
                <div
                  key={item.barcode}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "var(--white)",
                    border: "1px solid var(--line)",
                    marginBottom: "6px",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "12px" }}>{item.name}</strong>
                    <small style={{ display: "block", color: "var(--muted)", font: "10px var(--mono)" }}>
                      ₹{item.price.toFixed(2)} each {selectedInvoice && `(max returnable: ${origAvail})`}
                    </small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        className="return-qty-btn"
                        onClick={() => updateQuantity(item.barcode, -1)}
                        title="Decrease return quantity"
                      >
                        -
                      </button>
                      <span style={{ font: "700 12px var(--mono)", minWidth: "20px", textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="return-qty-btn"
                        disabled={isAtMax}
                        onClick={() => updateQuantity(item.barcode, 1)}
                        title={isAtMax ? "Maximum purchased quantity reached" : "Increase return quantity"}
                      >
                        +
                      </button>
                    </div>
                    <b style={{ minWidth: "65px", textAlign: "right" }}>₹{(item.price * item.quantity).toFixed(2)}</b>
                    <button
                      type="button"
                      onClick={() => removeItem(item.barcode)}
                      style={{ border: 0, background: "transparent", color: "#a94c38", fontSize: "16px", cursor: "pointer", padding: "0 4px" }}
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="refund-banner">
          <strong>Refund Method: CASH ONLY</strong>
          All customer returns are refunded directly in Cash. Please disburse <b>₹{refundTotal.toFixed(2)}</b> in physical cash from the register drawer.
        </div>

        <button
          type="button"
          className="refund-confirm-btn"
          disabled={returnCart.length === 0 || refundTotal <= 0}
          onClick={handleConfirmRefund}
        >
          Confirm Cash Refund (₹{refundTotal.toFixed(2)})
        </button>
      </div>
    </div>
  );
}

