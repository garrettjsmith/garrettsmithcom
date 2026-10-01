import { recordOutcome, type Outcome } from "@/lib/human.ts";
import { verifyToken } from "@/lib/signed.ts";

export const runtime = "nodejs";

// The Agreed / Amended / Overruled links in Garrett's case email. GET shows a
// confirm form (link scanners can't record anything); POST records it, with an
// optional note on what vGarrett should have said. Notes feed the weekly email
// and become rules in Local SEO Skills.

const LABEL: Record<Outcome, string> = { agreed: "Agreed", amended: "Amended", overruled: "Overruled" };

const page = (body: string) =>
  new Response(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Case outcome · vGarrett</title>` +
      `<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#F4F6F3;color:#0E1410;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px">` +
      `<main style="width:min(520px,100%);background:#fff;border:1px solid #DDE3DC;border-radius:16px;padding:28px;line-height:1.55">${body}</main></body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const data = verifyToken<{ id: string; outcome: Outcome }>("human-outcome", t);
  if (!data) return page("<p>This link has expired.</p>");
  const ask = data.outcome === "agreed" ? "Anything worth noting? (optional)" : "What should vGarrett have said? This becomes a rule in the playbooks.";
  return page(
    `<h1 style="font-size:20px;margin:0 0 8px">Mark this case: ${LABEL[data.outcome]}</h1>` +
      `<form method="post"><input type="hidden" name="t" value="${esc(t)}">` +
      `<label style="display:block;margin:12px 0 6px;font-weight:600">${ask}</label>` +
      `<textarea name="note" rows="5" style="width:100%;box-sizing:border-box;font:inherit;border:1px solid #C9D0C5;border-radius:10px;padding:10px"></textarea>` +
      `<button style="margin-top:12px;font:inherit;font-weight:600;background:#0A0D0A;color:#fff;border:0;border-radius:999px;padding:10px 18px;cursor:pointer">Save</button></form>`,
  );
}

export async function POST(req: Request) {
  const form = await req.formData();
  const data = verifyToken<{ id: string; outcome: Outcome }>("human-outcome", String(form.get("t") ?? ""));
  if (!data) return page("<p>This link has expired.</p>");
  const note = String(form.get("note") ?? "").trim();
  const c = await recordOutcome(data.id, data.outcome, note || undefined);
  if (!c) return page("<p>That case is gone (cases are kept 120 days).</p>");
  return page(`<h1 style="font-size:20px;margin:0 0 8px">Saved: ${LABEL[data.outcome]}.</h1><p>It'll show up in Monday's numbers.</p>`);
}
