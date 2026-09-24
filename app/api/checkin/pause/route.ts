import { getBrief, saveBrief } from "@/lib/garrett/brief.ts";
import { verifyToken } from "@/lib/signed.ts";

export const runtime = "nodejs";

// The "Pause check-ins" link in each check-in email. GET shows a button and
// POST does the pausing, so email scanners that follow links can't pause
// anyone by accident.

const page = (body: string) =>
  new Response(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Check-ins · Ask Garrett</title>` +
      `<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#F4F6F3;color:#0E1410;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px">` +
      `<main style="max-width:420px;background:#fff;border:1px solid #DDE3DC;border-radius:16px;padding:28px;line-height:1.55">${body}</main></body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );

const button = (t: string, resume: boolean) =>
  `<form method="post"><input type="hidden" name="t" value="${t}"><input type="hidden" name="resume" value="${resume ? "1" : ""}">` +
  `<button style="font:inherit;font-weight:600;background:#0A0D0A;color:#fff;border:0;border-radius:999px;padding:10px 18px;cursor:pointer">${resume ? "Turn check-ins back on" : "Pause check-ins"}</button></form>`;

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  if (!verifyToken<{ key: string }>("checkin-pause", t)) return page("<p>This link has expired. Reply to any check-in email and say “pause check-ins”.</p>");
  return page(`<h1 style="font-size:20px;margin:0 0 8px">Pause weekly check-ins?</h1><p>You'll stop getting the Monday email. Everything else keeps working, and you can turn it back on any time.</p>${button(t, false)}`);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const t = String(form.get("t") ?? "");
  const resume = form.get("resume") === "1";
  const data = verifyToken<{ key: string }>("checkin-pause", t);
  if (!data) return page("<p>This link has expired. Reply to any check-in email and say “pause check-ins”.</p>");
  const brief = await getBrief(data.key);
  if (brief) {
    brief.checkins = resume;
    await saveBrief(brief);
  }
  return page(
    resume
      ? `<h1 style="font-size:20px;margin:0 0 8px">Check-ins are back on.</h1><p>Next one arrives Monday.</p>`
      : `<h1 style="font-size:20px;margin:0 0 8px">Check-ins paused.</h1><p>No more Monday emails. Changed your mind?</p>${button(t, true)}`,
  );
}
