import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getNote, getNotes, TOPIC_LABELS } from "@/lib/notes.ts";

// The share image for a note: the same look as its on-page cover.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Search Notes by Garrett Smith";

export function generateStaticParams() {
  return getNotes().map((n) => ({ slug: n.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const n = getNote((await params).slug);
  const mark = `data:image/svg+xml;base64,${readFileSync(path.join(process.cwd(), "app", "icon.svg")).toString("base64")}`;
  const title = n?.title ?? "Search Notes";
  const topic = n ? (TOPIC_LABELS[n.topics[0]] ?? "Local search") : "Local search";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0E1410", color: "#fff", padding: 72, position: "relative" }}>
        <div style={{ position: "absolute", right: -140, top: 75, width: 480, height: 480, borderRadius: 480, background: "radial-gradient(circle, rgba(61,255,46,.55), rgba(24,209,24,.15) 55%, rgba(14,20,16,0) 70%)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 860 }}>
          <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#3DFF2E" }}>{topic}</div>
          <div style={{ fontSize: title.length > 60 ? 58 : 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>{title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, color: "rgba(255,255,255,.75)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mark} width={56} height={56} alt="" />
            Search Notes · Garrett Smith
          </div>
        </div>
      </div>
    ),
    size,
  );
}
