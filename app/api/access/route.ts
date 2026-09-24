import { getStore } from "@/lib/store.ts";
import { allowAccessRequest, clientIp } from "@/lib/ratelimit.ts";

export const runtime = "nodejs";

const WHERE = ["Retainer", "Text", "WhatsApp", "Other"] as const;

// "Put me on your team" form. Saves the request and pings Garrett.
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await allowAccessRequest(ip))) return Response.json({ error: "Too many requests today." }, { status: 429 });

  let body: { email?: unknown; where?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Enter a valid email." }, { status: 400 });
  const where = WHERE.find((w) => w === body.where) ?? "Other";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : "";

  const request = { email, where, note, at: new Date().toISOString() };
  await getStore().lpush("access:requests", request, 1000);

  const hook = process.env.ACCESS_NOTIFY_WEBHOOK_URL;
  if (hook) {
    const text =
      `*Ask Garrett contact form*\n${email}: *${where}*` +
      (note ? `\n> ${note.replace(/\n/g, "\n> ")}` : "");
    await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }).catch((e) =>
      console.error("[access] notify failed", e),
    );
  }
  return Response.json({ ok: true });
}
