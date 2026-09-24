import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono, Mrs_Saint_Delafield } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz", "wdth"], variable: "--font-display" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const signature = Mrs_Saint_Delafield({ weight: "400", subsets: ["latin"], variable: "--font-signature" });

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

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0A0D0A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} ${signature.variable}`}>
      <body>{children}</body>
    </html>
  );
}
