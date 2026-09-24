import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import "./globals.css";

const display = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = Archivo({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://garrettsmith.com"),
  title: "Ask Garrett: 20+ years of local search, on call",
  description:
    "Ask Garrett about your local visibility. Garrett Smith's local search playbooks and live ranking data, for a fraction of what an hour of his time costs.",
  openGraph: {
    title: "Ask Garrett about your local visibility.",
    description: "20+ years of local search experience, on call. Powered by Local SEO Skills and Local SEO Data.",
    type: "website",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
