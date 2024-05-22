import type { Metadata, Viewport } from "next";
import "modern-normalize";
import "./globals.css";
import Providers from "./Providers/Providers";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Ledger Platform Apps",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
