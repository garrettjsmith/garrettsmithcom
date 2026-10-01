import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono, Mrs_Saint_Delafield } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz", "wdth"], variable: "--font-display" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const signature = Mrs_Saint_Delafield({ weight: "400", subsets: ["latin"], variable: "--font-signature" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://garrettsmith.com"),
  title: "vGarrett: Garrett Smith's virtual twin for local search",
  description:
    "Garrett Smith's local search playbooks and live ranking data, in an AI advisor. And the real Garrett when you need him.",
  openGraph: {
    title: "Ask vGarrett about your local visibility.",
    description: "Garrett Smith's local search playbooks and live ranking data, in an AI advisor. And the real Garrett when you need him.",
    type: "website",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0A0D0A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} ${signature.variable}`}>
      <body>{children}</body>
    </html>
  );
}
