import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@fontsource-variable/archivo/standard.css";
import "@fontsource-variable/archivo/standard-italic.css";
import "@fontsource-variable/newsreader/wght.css";
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "taraonchain — on-chain investigations & crypto, explained",
  description:
    "Vedika (taraonchain) reconstructs crypto exploits, DeFi attacks and wallet flows from raw chain data — every hop, split and exit mapped, with observed facts kept distinct from analysis. Investigations for the chain, education for everyone.",
  icons: {
    icon: "/glyph.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#070808",
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
