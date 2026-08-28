import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vikram Store POS | vikramstore.shop",
  description: "Official Point of Sale and Billing System for Vikram Store (vikramstore.shop)",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
