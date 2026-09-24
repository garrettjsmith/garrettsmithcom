import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import "./globals.css";

const display = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = Archivo({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://garrettsmith.com"),
  title: "Garrett Smith Labs — ask me about local search",
  description:
    "An AI version of Garrett Smith, built on 20+ years of local search work and wired to live ranking data. Ask it here, then add it to your team's Slack.",
  openGraph: {
    title: "Ask me why you're not in the map pack.",
    description: "Virtual Garrett: local search expertise you can add to your team's Slack.",
    type: "website",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
