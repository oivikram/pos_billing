"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Line } from "@/types/pos";

export function playBeepSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1850, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // audio context blocked
  }
}

export function CameraScannerModal({
  isOpen,
  onClose,
  onScan,
  lines,
  onUpdateQuantity,
}: {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => { success: boolean; name?: string; price?: number; barcode?: string };
  lines: Line[];
  onUpdateQuantity: (barcode: string, delta: number) => void;
}) {
  const [lastItem, setLastItem] = useState<{
    name: string;
    price: number;
    barcode: string;
    success: boolean;
  } | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const currentLine = lines.find((l) => l.barcode === lastItem?.barcode);
  const currentQty = currentLine?.quantity || 1;

  const handleClose = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      } catch {
        // ignore
      }
    }
    onClose();
  };

  const resumeScanning = () => {
    setLastItem(null);
    setIsPaused(false);
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 250);
  };

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode: Html5Qrcode | null = null;
    const scannerId = "pos-camera-viewfinder";
    isProcessingRef.current = false;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        // Reliable 1D & 2D barcode scanning config
        const config = {
          fps: 15,
          qrbox: { width: 260, height: 130 },
          aspectRatio: 1.77,
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            playBeepSound();
            const result = onScanRef.current(decodedText);

            if (result.success) {
              setLastItem({
                name: result.name || "Product",
                price: result.price || 0,
                barcode: decodedText,
                success: true,
              });
            } else {
              setLastItem({
                name: "Unknown Product",
                price: 0,
                barcode: decodedText,
                success: false,
              });
            }

            setIsPaused(true);
          },
          () => {
            // scanning frame
          }
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setCameraError(
          msg.includes("Permission") || msg.includes("NotAllowed")
            ? "Camera permission denied. Please allow camera in browser."
            : msg
        );
      }
    };

    startScanner();

    return () => {
      isProcessingRef.current = false;
      if (scannerRef.current) {
        try {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch(() => {});
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="payment-modal-backdrop" style={{ zIndex: 100, padding: "12px" }}>
      <div
        className="payment-modal camera-modal"
        style={{
          width: "min(380px, 100%)",
          textAlign: "center",
          padding: "16px",
          borderRadius: "8px",
          maxHeight: "96vh",
        }}
      >
        {/* Compact Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                fontFamily: "var(--mono)",
                color: "var(--olive)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              📷 Camera Scanner
            </span>
            <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "1px" }}>
              {isPaused ? "Item Scanned!" : "Aim at Barcode"}
            </div>
          </div>
          <button
            type="button"
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              border: "1px solid var(--line)",
              background: "var(--white)",
              fontSize: "16px",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              lineHeight: 1,
            }}
            onClick={handleClose}
            title="Close"
          >
            ×
          </button>
        </div>

        {cameraError ? (
          <div
            className="refund-banner"
            style={{ textAlign: "left", margin: "10px 0", fontSize: "11px", padding: "10px" }}
          >
            ⚠️ {cameraError}
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              borderRadius: "6px",
              overflow: "hidden",
              background: "#000",
              border: "1px solid var(--line)",
            }}
          >
            <div
              id="pos-camera-viewfinder"
              style={{
                width: "100%",
                aspectRatio: "16/9",
                maxHeight: "210px",
                overflow: "hidden",
              }}
            />
            {/* Guide overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: "200px",
                  height: "75px",
                  border: isPaused ? "2px solid #34a853" : "2px dashed #d6f32f",
                  borderRadius: "4px",
                  background: isPaused ? "rgba(52, 168, 83, 0.15)" : "transparent",
                  transition: "all 0.2s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Scan Result Details & Quantity Stepper */}
        {lastItem && (
          <div
            style={{
              marginTop: "10px",
              padding: "10px 12px",
              background: lastItem.success ? "#f4f8e6" : "#fdf2f0",
              border: `1px solid ${lastItem.success ? "#cde26c" : "#f0b8af"}`,
              borderRadius: "6px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "13px",
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {lastItem.name}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                  {lastItem.barcode} · ₹{lastItem.price.toFixed(2)}
                </div>
              </div>

              {lastItem.success && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    type="button"
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "3px",
                      border: "1px solid var(--line)",
                      background: "var(--white)",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                    onClick={() => onUpdateQuantity(lastItem.barcode, -1)}
                    title="Decrease quantity"
                  >
                    -
                  </button>
                  <span
                    style={{
                      font: "700 13px var(--mono)",
                      minWidth: "18px",
                      textAlign: "center",
                    }}
                  >
                    {currentQty}
                  </span>
                  <button
                    type="button"
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "3px",
                      border: "1px solid var(--line)",
                      background: "var(--white)",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                    onClick={() => onUpdateQuantity(lastItem.barcode, 1)}
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {lastItem.success && (
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#2e6912",
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--mono)",
                }}
              >
                <span>✓ Added to bill!</span>
                <span>Total: ₹{(lastItem.price * currentQty).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          {isPaused ? (
            <button
              type="button"
              style={{
                flex: 1,
                padding: "10px",
                background: "var(--lime)",
                color: "var(--ink)",
                border: 0,
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
                borderRadius: "4px",
              }}
              onClick={resumeScanning}
            >
              ▶ Scan Next Item
            </button>
          ) : (
            <div
              style={{
                flex: 1,
                fontSize: "11px",
                color: "var(--muted)",
                fontFamily: "var(--mono)",
                padding: "6px 0",
              }}
            >
              Point camera at product barcode
            </div>
          )}
          <button
            type="button"
            style={{
              padding: "10px 16px",
              background: "var(--white)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              borderRadius: "4px",
            }}
            onClick={handleClose}
          >
            Done (Close)
          </button>
        </div>
      </div>
    </div>
  );
}

