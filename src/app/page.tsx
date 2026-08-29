"use client";

import React, { FormEvent, startTransition, useEffect, useRef, useState } from "react";
import { Line, Product, Sale } from "@/types/pos";
import {
  isSupabaseConfigured,
  fetchSalesFromSupabase,
  fetchProductsFromSupabase,
  authenticateCashier,
} from "@/lib/supabase";
import { PosBilling } from "@/components/PosBilling";
import { CloseShiftPanel } from "@/components/CloseShiftPanel";
import { playBeepSound } from "@/components/CameraScannerModal";

const defaultCatalog: Product[] = [
  { barcode: "8901030894501", name: "Tata Salt 1kg", price: 28 },
  { barcode: "8901063012345", name: "Amul Taaza Milk 1L", price: 64 },
  { barcode: "8901725111106", name: "Parle-G Biscuits", price: 10 },
  { barcode: "8901234567890", name: "Coca-Cola 750ml", price: 45 },
];

const defaultUpi = process.env.NEXT_PUBLIC_UPI_ID || "vikramgirhe07@okicici";

function generateInvoiceId() {
  return `INV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(Date.now()).slice(-6)}`;
}

export default function Home() {
  const [screen, setScreen] = useState<"login" | "float" | "upi" | "pos" | "close">("login");
  const [employee, setEmployee] = useState("vikramgirhe07@gmail.com");
  const [password, setPassword] = useState("");
  const [float, setFloat] = useState("");
  const [upi, setUpi] = useState(defaultUpi);
  const [lines, setLines] = useState<Line[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(defaultCatalog);
  const [sales, setSales] = useState<Sale[]>([]);
  const [shiftSales, setShiftSales] = useState<Sale[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(sessionStorage.getItem("vikramstore-shift-sales") || "[]");
    } catch {
      return [];
    }
  });
  const [shiftStartTime, setShiftStartTime] = useState<string>(() => new Date().toISOString());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [clock, setClock] = useState<Date | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const barcode = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("vikramstore-sales");
      window.localStorage.removeItem("counterpoint-sales");
      window.localStorage.removeItem("vikramstore-shifts");
      window.localStorage.removeItem("counterpoint-shifts");
    }

    const saved =
      localStorage.getItem("vikramstore-session") ||
      localStorage.getItem("counterpoint-session");
    if (saved) {
      startTransition(() => {
        const value = JSON.parse(saved);
        setEmployee(value.employeeId || "vikramgirhe07@gmail.com");
        setFloat(value.deposit || "");
        setUpi(value.upiId || defaultUpi);
        setShiftStartTime(value.shiftStartTime || new Date().toISOString());
        setScreen("pos");
      });
    }

    if (isSupabaseConfigured()) {
      fetchProductsFromSupabase().then((cloudProducts) => {
        if (cloudProducts && cloudProducts.length > 0) {
          setCatalog(cloudProducts);
        }
      });

      fetchSalesFromSupabase().then((cloudSales) => {
        if (cloudSales) {
          setSales(
            (cloudSales as Sale[]).sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
          );
        }
      });
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    const initial = setTimeout(() => setClock(new Date()), 0);
    return () => {
      clearInterval(timer);
      clearTimeout(initial);
    };
  }, []);

  const session = (extra: object = {}) =>
    localStorage.setItem(
      "vikramstore-session",
      JSON.stringify({
        employeeId: employee.trim(),
        deposit: float,
        upiId: upi.trim(),
        shiftStartTime: shiftStartTime || new Date().toISOString(),
        ...extra,
      })
    );

  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const addBarcode = (event: FormEvent) => {
    event.preventDefault();
    const input = barcode.current;
    if (!input || !input.value) return;

    const value = input.value.trim();
    input.value = "";

    const product = catalog.find(
      (item) =>
        item.barcode === value ||
        item.barcode.endsWith(value) ||
        value.endsWith(item.barcode)
    );

    if (!product) {
      alert(`Barcode ${value} not found in inventory.`);
      return;
    }

    playBeepSound();

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
  };

  const completeCash = (received: number) => {
    const paid = generateInvoiceId();
    const change = Math.max(0, received - total);
    setLines([]);
    return { paid, change };
  };

  return (
    <main className="min-h-screen flex flex-col justify-between">
      <header className="topbar">
        <span>Vikram Store POS (vikramstore.shop)</span>
        <div className="current-datetime">
          <span>{clock ? clock.toLocaleDateString("en-IN") : "Loading..."}</span>
          <strong>{clock ? clock.toLocaleTimeString("en-IN") : ""}</strong>
        </div>
      </header>

      <div className="flow-content">
        {screen === "login" && (
          <Setup
            title={
              <>
                Let&apos;s get you
                <br />
                <strong>checked in.</strong>
              </>
            }
            kicker="Good morning, cashier"
          >
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setIsLoggingIn(true);
                setLoginError(null);
                const res = await authenticateCashier(employee, password);
                setIsLoggingIn(false);
                if (!res.success) {
                  setLoginError(res.error || "Authentication failed. Please check your credentials.");
                  return;
                }
                setScreen("float");
              }}
              className="form-stack"
            >
              {loginError && (
                <div className="refund-banner" style={{ margin: "0 0 14px", padding: "10px 12px", fontSize: "11px", fontFamily: "var(--mono)" }}>
                  ⚠️ {loginError}
                </div>
              )}
              <label>Cashier Email (Supabase Login)</label>
              <div className="input-wrap">
                <span>@</span>
                <input
                  type="email"
                  value={employee}
                  onChange={(event) => {
                    setEmployee(event.target.value);
                    setLoginError(null);
                  }}
                  placeholder="vikramgirhe07@gmail.com"
                  disabled={isLoggingIn}
                  required
                />
              </div>
              <label>Password</label>
              <div className="input-wrap">
                <span>*</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setLoginError(null);
                  }}
                  placeholder="Enter your password"
                  disabled={isLoggingIn}
                  required
                />
              </div>
              <Primary disabled={isLoggingIn}>
                {isLoggingIn ? "Verifying..." : "Continue to opening float"}
              </Primary>
            </form>
          </Setup>
        )}

        {screen === "float" && (
          <Setup
            title={
              <>
                Set the
                <br />
                <strong>starting cash.</strong>
              </>
            }
            kicker="Opening float"
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!float || Number(float) <= 0) return;
                const now = new Date().toISOString();
                setShiftStartTime(now);
                setShiftSales([]);
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("vikramstore-shift-sales");
                }
                session({ shiftStartTime: now });
                setScreen("upi");
              }}
              className="form-stack"
            >
              <label>Cash deposit value</label>
              <div className="amount-wrap">
                <span>₹</span>
                <input
                  type="number"
                  min="1"
                  value={float}
                  onChange={(event) => setFloat(event.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="quick-values">
                {[500, 1000, 5000].map((value) => (
                  <button type="button" key={value} onClick={() => setFloat(String(value))}>
                    ₹{value.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
              <Primary>Continue to receiver</Primary>
              <Back onClick={() => setScreen("login")}>Back to employee access</Back>
            </form>
          </Setup>
        )}

        {screen === "upi" && (
          <Setup
            title={
              <>
                Set your
                <br />
                <strong>UPI receiver.</strong>
              </>
            }
            kicker="Payment receiver"
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!upi.includes("@")) return;
                session();
                setScreen("pos");
              }}
              className="form-stack"
            >
              <label>Receiver UPI ID</label>
              <div className="input-wrap">
                <span>UPI</span>
                <input
                  value={upi}
                  onChange={(event) => setUpi(event.target.value)}
                  placeholder="cashier@bank"
                />
              </div>
              <p className="upi-note">A fresh QR code will include the exact bill amount.</p>
              <Primary>Save UPI receiver</Primary>
              <Back onClick={() => setScreen("float")}>Back to opening float</Back>
            </form>
          </Setup>
        )}

        {screen === "pos" && (
          <PosBilling
            lines={lines}
            setLines={setLines}
            total={total}
            addBarcode={addBarcode}
            barcode={barcode}
            upi={upi}
            catalog={catalog}
            sales={sales}
            shiftSales={shiftSales}
            setShiftSales={setShiftSales}
            setSales={setSales}
            completeCash={completeCash}
            historyOpen={historyOpen}
            setHistoryOpen={setHistoryOpen}
            onLogout={() => setScreen("close")}
          />
        )}

        {screen === "close" && (
          <CloseShiftPanel
            employee={employee}
            float={float}
            sales={shiftSales}
            shiftStartTime={shiftStartTime}
            onCancel={() => setScreen("pos")}
            onConfirmLogout={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("vikramstore-shift-sales");
                localStorage.removeItem("vikramstore-session");
                localStorage.removeItem("counterpoint-session");
              }
              setShiftSales([]);
              setLines([]);
              setFloat("");
              setPassword("");
              setShiftStartTime(new Date().toISOString());
              setScreen("login");
            }}
          />
        )}
      </div>

      <footer className="flow-footer">
        <span>Secure POS · vikramstore.shop</span>
        <span>{employee || "Cashier"}</span>
      </footer>
    </main>
  );
}

function Setup({
  title,
  kicker,
  children,
}: {
  title: React.ReactNode;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <div className="step-view">
      <p className="section-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p className="section-intro">
        Use your store credentials and opening details to unlock today&apos;s register.
      </p>
      {children}
    </div>
  );
}

function Primary({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button className="primary-button" type="submit" disabled={disabled}>
      <span>{children}</span>
      <b>-&gt;</b>
    </button>
  );
}

function Back({ children, onClick }: { children?: React.ReactNode; onClick: () => void }) {
  return (
    <button className="back-button" type="button" onClick={onClick} aria-label="Back">
      <span className="back-arrow-icon">←</span>
      {children && <span>{children}</span>}
    </button>
  );
}