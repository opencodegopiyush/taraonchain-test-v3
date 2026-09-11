import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/newsreader";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "TARAONCHAIN — ON-CHAIN FORENSICS · CASE ARCHIVE",
  description:
    "Privacy-first on-chain investigation archive. Independent case files — SLINK (R-0905) and SHARAV (S-0830) — every entity, funding trail and figure from the verified reports, walkable as interactive evidence graphs in your browser. Local archive, zero telemetry.",
};

export const viewport: Viewport = {
  themeColor: "#0b0c0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
