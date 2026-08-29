"use client";

import React, { FormEvent, useState } from "react";
import QRCode from "qrcode";
import { Line, Product, Sale } from "@/types/pos";
import { isSupabaseConfigured, syncSaleToSupabase } from "@/lib/supabase";
import { CameraScannerModal } from "@/components/CameraScannerModal";
import { ReturnModal } from "@/components/ReturnModal";
import { Invoice, RefundInvoice } from "@/components/InvoiceModals";
import { HistoryPanel } from "@/components/HistoryPanel";

export function generateInvoiceId() {
  return `INV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(Date.now()).slice(-6)}`;
}

export function PosBilling({
  lines,
  setLines,
  total,
  addBarcode,
  barcode,
  upi,
  catalog,
  sales,
  shiftSales,
  setShiftSales,
  setSales,
  completeCash,
  historyOpen,
  setHistoryOpen,
  onLogout,
}: {
  lines: Line[];
  setLines: (value: Line[] | ((current: Line[]) => Line[])) => void;
  total: number;
  addBarcode: (event: FormEvent) => void;
  barcode: React.RefObject<HTMLInputElement | null>;
  upi: string;
  catalog: Product[];
  sales: Sale[];
  shiftSales: Sale[];
  setShiftSales: (value: Sale[] | ((current: Sale[]) => Sale[])) => void;
  setSales: (value: Sale[] | ((current: Sale[]) => Sale[])) => void;
  completeCash: (received: number) => { paid: string; change: number };
  historyOpen: boolean;
  setHistoryOpen: (value: boolean) => void;
  onLogout: () => void;
}) {
  const [payment, setPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "split" | null>(null);
  const [received, setReceived] = useState("");
  const [splitCash, setSplitCash] = useState("");
  const [splitReceived, setSplitReceived] = useState("");
  const [splitQr, setSplitQr] = useState<string | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [completedRefund, setCompletedRefund] = useState<{
    id: string;
    items: Line[];
    total: number;
    originalInvoice?: string;
  } | null>(null);
  const [completedInvoice, setCompletedInvoice] = useState<{
    invoice: string;
    method: string;
    total: number;
    items?: Line[];
    cashAmount?: number;
    upiAmount?: number;
    received?: number;
    change?: number;
  } | null>(null);

  const handleCameraScan = (code: string) => {
    const clean = code.trim();
    const product = catalog.find(
      (item) =>
        item.barcode === clean ||
        item.barcode.endsWith(clean) ||
        clean.endsWith(item.barcode)
    );
    if (!product) return { success: false };

    setLines((current) => {
      const old = current.find((line) => line.barcode === product.barcode);
      return old
        ? current.map((line) =>
            line.barcode === product.barcode
              ? { ...line, quantity: line.quantity + 1 }
              : line
          )
        : [...current, { ...product, quantity: 1 }];
    });

    return { success: true, name: product.name, price: product.price, barcode: product.barcode };
  };

  const updateLineQuantity = (itemBarcode: string, delta: number) => {
    setLines((current) => {
      const existing = current.find((l) => l.barcode === itemBarcode);
      if (!existing) return current;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return current.filter((l) => l.barcode !== itemBarcode);
      }
      return current.map((l) =>
        l.barcode === itemBarcode ? { ...l, quantity: newQty } : l
      );
    });
  };

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const cashPortion = Math.min(total, Math.max(0, Number(splitCash) || 0));
  const upiPortion = Math.max(0, total - cashPortion);
  const splitReceivedNum = splitReceived === "" ? cashPortion : Number(splitReceived);
  const splitChange = Math.max(0, splitReceivedNum - cashPortion);

  const recordCompletedSale = (newSale: Sale) => {
    setSales((current) => [...current, newSale]);
    setShiftSales((current) => {
      const updated = [...current, newSale];
      try {
        sessionStorage.setItem("vikramstore-shift-sales", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    syncSaleToSupabase(newSale);
  };

  const payCash = () => {
    const value = Number(received);
    if (!Number.isFinite(value) || value < total) return;
    const result = completeCash(value);
    const newSale: Sale = {
      invoice: result.paid,
      date: new Date().toISOString(),
      total,
      method: "Cash",
      items: [...lines],
      received: value,
      change: result.change,
    };
    recordCompletedSale(newSale);
    setCompletedInvoice({
      invoice: result.paid,
      method: "Cash",
      total,
      items: [...lines],
      received: value,
      change: result.change,
    });
    setPayment(false);
    setReceived("");
  };

  const payUpi = async () => {
    const payload = `upi://pay?pa=${encodeURIComponent(upi)}&pn=Vikram%20Store&am=${total.toFixed(2)}&cu=INR`;
    const qr = await QRCode.toDataURL(payload, { width: 280, margin: 2 });
    const modal = document.createElement("div");
    modal.className = "payment-modal-backdrop";
    modal.innerHTML = `
      <div class="payment-modal">
        <button class="payment-close" title="Back" aria-label="Back">←</button>
        <p class="section-kicker">UPI payment / ₹${total.toFixed(2)}</p>
        <h2>Scan to<br><strong>pay.</strong></h2>
        <img class="generated-qr" src="${qr}" alt="UPI payment QR code">
        <p>${upi}</p>
        <button class="payment-done upi-finish" type="button">Finish payment</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector(".payment-close")?.addEventListener("click", () => modal.remove());
    modal.querySelector(".upi-finish")?.addEventListener("click", () => {
      const paid = generateInvoiceId();
      const newSale: Sale = {
        invoice: paid,
        date: new Date().toISOString(),
        total,
        method: "UPI",
        items: [...lines],
      };
      recordCompletedSale(newSale);
      setLines([]);
      modal.remove();
      setCompletedInvoice({ invoice: paid, method: "UPI", total, items: [...lines] });
    });
  };

  if (completedRefund) {
    return (
      <RefundInvoice
        id={completedRefund.id}
        items={completedRefund.items}
        total={completedRefund.total}
        originalInvoice={completedRefund.originalInvoice}
        onFinish={() => {
          setCompletedRefund(null);
          setTimeout(() => barcode.current?.focus(), 0);
        }}
      />
    );
  }

  if (completedInvoice) {
    return (
      <Invoice
        invoice={completedInvoice.invoice}
        method={completedInvoice.method}
        total={completedInvoice.total}
        items={completedInvoice.items}
        cashAmount={completedInvoice.cashAmount}
        upiAmount={completedInvoice.upiAmount}
        change={completedInvoice.change}
        onFinish={() => {
          setCompletedInvoice(null);
          setPayment(false);
          setPaymentMethod(null);
          setTimeout(() => barcode.current?.focus(), 0);
        }}
      />
    );
  }

  if (historyOpen) {
    return (
      <HistoryPanel
        sales={sales}
        shiftSales={shiftSales}
        onBack={() => setHistoryOpen(false)}
      />
    );
  }

  return (
    <div className="billing-view">
      <div className="billing-heading">
        <div>
          <p className="section-kicker">Register open / Vikram Store Terminal 01</p>
          <h2>
            Build the
            <br />
            <strong>customer&apos;s bill.</strong>
          </h2>
        </div>
        <div className="dashboard-actions">
          <span
            className="live-pill"
            style={
              isSupabaseConfigured()
                ? { background: "#e6f4ea", color: "#137333" }
                : { background: "#f1f3f4", color: "#5f6368" }
            }
            title={
              isSupabaseConfigured()
                ? "Supabase cloud database connected & synced"
                : "Local storage mode (Add Supabase keys in .env.local to sync)"
            }
          >
            <i style={isSupabaseConfigured() ? { background: "#137333" } : { background: "#5f6368" }}></i>{" "}
            {isSupabaseConfigured() ? "Cloud Synced" : "Local DB"}
          </span>
          <button
            type="button"
            className="return-button"
            onClick={() => setReturnOpen(true)}
            title="Customer Return & Cash Refund"
          >
            ↩ Return / Refund
          </button>
          <button className="history-button" onClick={() => setHistoryOpen(true)}>
            Payment history ({shiftSales.length} shift / {sales.length} total)
          </button>
        </div>
      </div>

      {cameraOpen && (
        <CameraScannerModal
          isOpen={cameraOpen}
          onClose={() => {
            setCameraOpen(false);
            setTimeout(() => barcode.current?.focus(), 50);
          }}
          onScan={handleCameraScan}
          lines={lines}
          onUpdateQuantity={updateLineQuantity}
        />
      )}

      <form className="barcode-form" onSubmit={addBarcode}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "9px",
          }}
        >
          <label htmlFor="barcode" style={{ margin: 0 }}>
            Barcode number
          </label>
          <button
            type="button"
            className="history-button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              background: "var(--soft-lime)",
              borderColor: "var(--olive)",
              color: "#3f470a",
              fontWeight: 800,
              cursor: "pointer",
            }}
            onClick={() => setCameraOpen(true)}
            title="Open phone or computer camera to scan physical barcodes"
          >
            📷 Scan with Camera
          </button>
        </div>
        <div className="barcode-input">
          <span>▦</span>
          <input
            id="barcode"
            ref={barcode}
            placeholder="Scan with camera, type barcode, or use scanner gun"
            autoFocus
          />
          <button type="submit">Add</button>
        </div>
      </form>

      <div className="bill-layout">
        <section className="bill-lines">
          <div className="bill-title">
            <strong>Current bill</strong>
            <span>{itemCount} items</span>
          </div>
          {lines.length ? (
            lines.map((line) => (
              <div className="bill-line" key={line.barcode}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                  <strong>{line.name}</strong>
                  <small>
                    {line.barcode} · ₹{line.price.toFixed(2)} / unit
                  </small>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#f7f6f0",
                    padding: "3px 6px",
                    borderRadius: "4px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "3px",
                      border: "1px solid #b5b7ae",
                      background: "var(--white)",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: "14px",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--ink)",
                    }}
                    onClick={() => updateLineQuantity(line.barcode, -1)}
                    title="Decrease quantity"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val) || val <= 0) {
                        setLines((current) => current.filter((item) => item.barcode !== line.barcode));
                      } else {
                        setLines((current) =>
                          current.map((item) =>
                            item.barcode === line.barcode ? { ...item, quantity: val } : item
                          )
                        );
                      }
                    }}
                    style={{
                      width: "40px",
                      height: "26px",
                      textAlign: "center",
                      font: "700 13px var(--mono)",
                      padding: "0",
                      border: "1px solid #b5b7ae",
                      borderRadius: "3px",
                      background: "var(--white)",
                      color: "var(--ink)",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "3px",
                      border: "1px solid #b5b7ae",
                      background: "var(--white)",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: "14px",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--ink)",
                    }}
                    onClick={() => updateLineQuantity(line.barcode, 1)}
                    title="Increase quantity"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <b style={{ minWidth: "75px", textAlign: "right", font: "700 13px var(--mono)" }}>
                  ₹{(line.price * line.quantity).toFixed(2)}
                </b>

                <button
                  type="button"
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#a94c38",
                    fontSize: "20px",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "0 6px",
                  }}
                  onClick={() => setLines(lines.filter((item) => item.barcode !== line.barcode))}
                  title="Remove item from bill"
                  aria-label="Remove item"
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <div className="bill-empty">
              <span>+</span>
              <strong>No products added yet</strong>
              <p>Use the scanner or type a barcode above.</p>
            </div>
          )}
        </section>

        <aside className="bill-summary">
          <small>Bill total</small>
          <strong>₹{total.toFixed(2)}</strong>
          <div className="summary-row">
            <span>Items</span>
            <span>{itemCount}</span>
          </div>
          <button
            type="button"
            className="checkout-button"
            disabled={!lines.length}
            onClick={() => {
              setPayment(true);
              setPaymentMethod(null);
            }}
          >
            Take payment <b>-&gt;</b>
          </button>
          <button
            type="button"
            className="clear-button"
            disabled={!lines.length}
            onClick={() => setLines([])}
          >
            Clear bill
          </button>
        </aside>
      </div>

      {payment && (
        <div className="payment-modal-backdrop">
          <div className="payment-modal">
            <button
              className="payment-close"
              onClick={() => {
                setPayment(false);
                setPaymentMethod(null);
                setSplitQr(null);
              }}
              title="Back to billing"
              aria-label="Back to billing"
            >
              ←
            </button>
            <p className="section-kicker">Payment / ₹{total.toFixed(2)}</p>
            <h2>
              Choose a
              <br />
              <strong>payment method.</strong>
            </h2>
            <div className="payment-options">
              <button
                className={`payment-option ${paymentMethod === "cash" ? "active" : ""}`}
                onClick={() => {
                  setPaymentMethod("cash");
                  setSplitQr(null);
                }}
              >
                <strong>Cash</strong>
                <span>100% Cash payment</span>
              </button>
              <button
                className="payment-option"
                onClick={() => {
                  setPaymentMethod(null);
                  payUpi();
                }}
              >
                <strong>UPI</strong>
                <span>100% UPI QR</span>
              </button>
              <button
                className={`payment-option ${paymentMethod === "split" ? "active" : ""}`}
                onClick={() => {
                  setPaymentMethod("split");
                  setSplitCash(String(Math.round(total / 2)));
                  setSplitQr(null);
                }}
              >
                <strong>Split</strong>
                <span>Cash + Online UPI</span>
              </button>
            </div>

            {paymentMethod === "cash" && (
              <div className="cash-entry">
                <button
                  type="button"
                  className="back-button"
                  style={{ marginTop: 0, marginBottom: "16px" }}
                  onClick={() => setPaymentMethod(null)}
                >
                  <span className="back-arrow-icon">←</span>
                  <span>Choose other method</span>
                </button>
                <label>
                  Enter Cash Received
                  <input
                    type="number"
                    value={received}
                    onChange={(event) => setReceived(event.target.value)}
                    placeholder={total.toFixed(2)}
                    autoFocus
                  />
                </label>
                {received && Number(received) >= total && (
                  <p style={{ marginTop: "10px", color: "var(--olive)", fontWeight: 700 }}>
                    Change to return: ₹{(Number(received) - total).toFixed(2)}
                  </p>
                )}
                <button
                  className="payment-done"
                  onClick={payCash}
                  disabled={!received || Number(received) < total}
                >
                  Confirm Cash Payment
                </button>
              </div>
            )}

            {paymentMethod === "split" && (
              <div className="split-entry">
                <button
                  type="button"
                  className="back-button"
                  style={{ marginTop: 0, marginBottom: "16px" }}
                  onClick={() => {
                    setPaymentMethod(null);
                    setSplitQr(null);
                  }}
                >
                  <span className="back-arrow-icon">←</span>
                  <span>Choose other method</span>
                </button>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Cash Amount (₹)
                    <input
                      type="number"
                      value={splitCash}
                      onChange={(e) => {
                        setSplitCash(e.target.value);
                        setSplitQr(null);
                      }}
                      placeholder="0.00"
                      min="0"
                      max={total}
                    />
                  </label>
                  <label>
                    UPI Amount (₹)
                    <input
                      type="number"
                      value={upiPortion.toFixed(2)}
                      disabled
                      style={{ background: "#e8e6df", color: "#666" }}
                    />
                  </label>
                </div>

                <div className="split-summary-box">
                  <div>
                    <span>Cash Due:</span>
                    <strong>₹{cashPortion.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>UPI Due:</span>
                    <strong style={{ color: "var(--olive)" }}>₹{upiPortion.toFixed(2)}</strong>
                  </div>
                </div>

                {cashPortion > 0 && (
                  <label style={{ marginTop: "12px" }}>
                    Cash Tendered by Customer (Optional)
                    <input
                      type="number"
                      value={splitReceived}
                      onChange={(e) => setSplitReceived(e.target.value)}
                      placeholder={cashPortion.toFixed(2)}
                    />
                  </label>
                )}

                {splitChange > 0 && (
                  <p style={{ marginTop: "8px", color: "var(--olive)", fontWeight: 700 }}>
                    Change to return: ₹{splitChange.toFixed(2)}
                  </p>
                )}

                {upiPortion > 0 && !splitQr && (
                  <button
                    type="button"
                    className="payment-done"
                    onClick={async () => {
                      const payload = `upi://pay?pa=${encodeURIComponent(upi)}&pn=Vikram%20Store&am=${upiPortion.toFixed(2)}&cu=INR`;
                      const qr = await QRCode.toDataURL(payload, { width: 220, margin: 2 });
                      setSplitQr(qr);
                    }}
                  >
                    Generate UPI QR for ₹{upiPortion.toFixed(2)}
                  </button>
                )}

                {upiPortion > 0 && splitQr && (
                  <div style={{ textAlign: "center", marginTop: "14px" }}>
                    <img
                      className="generated-qr"
                      src={splitQr}
                      alt="Split UPI QR"
                      style={{ width: "190px", margin: "10px auto" }}
                    />
                    <small style={{ display: "block", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                      Scan ₹{upiPortion.toFixed(2)} to {upi}
                    </small>
                    <button
                      type="button"
                      className="payment-done"
                      style={{ marginTop: "12px" }}
                      onClick={() => {
                        const paidId = generateInvoiceId();
                        const newSale: Sale = {
                          invoice: paidId,
                          date: new Date().toISOString(),
                          total,
                          method: "Split",
                          cashAmount: cashPortion,
                          upiAmount: upiPortion,
                          received: splitReceivedNum,
                          change: splitChange,
                          items: lines.map((l) => ({ ...l })),
                        };
                        recordCompletedSale(newSale);
                        setLines([]);
                        setPayment(false);
                        setPaymentMethod(null);
                        setSplitQr(null);
                        setCompletedInvoice({
                          invoice: paidId,
                          method: "Split",
                          total,
                          items: lines.map((l) => ({ ...l })),
                          cashAmount: cashPortion,
                          upiAmount: upiPortion,
                          received: splitReceivedNum,
                          change: splitChange,
                        });
                      }}
                    >
                      Finish Split Payment
                    </button>
                  </div>
                )}

                {upiPortion === 0 && (
                  <button
                    type="button"
                    className="payment-done"
                    onClick={() => {
                      const result = completeCash(splitReceivedNum);
                      const newSale: Sale = {
                        invoice: result.paid,
                        date: new Date().toISOString(),
                        total,
                        method: "Cash",
                        items: lines.map((l) => ({ ...l })),
                        received: splitReceivedNum,
                        change: result.change,
                      };
                      recordCompletedSale(newSale);
                      setLines([]);
                      setPayment(false);
                      setPaymentMethod(null);
                      setCompletedInvoice({
                        invoice: result.paid,
                        method: "Cash",
                        total,
                        items: lines.map((l) => ({ ...l })),
                        received: splitReceivedNum,
                        change: result.change,
                      });
                    }}
                  >
                    Complete 100% Cash Payment
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {returnOpen && (
        <ReturnModal
          sales={sales}
          catalog={catalog}
          onClose={() => setReturnOpen(false)}
          onProcessRefund={(refundSale) => {
            recordCompletedSale(refundSale);
            setCompletedRefund({
              id: refundSale.invoice,
              items: refundSale.items || [],
              total: Math.abs(refundSale.total),
              originalInvoice: refundSale.originalInvoice,
            });
            setReturnOpen(false);
          }}
        />
      )}

      <button className="outline-button" onClick={onLogout}>
        Log out
      </button>
    </div>
  );
}

