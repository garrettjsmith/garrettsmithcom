import { signInLink } from "@/lib/billing.ts";
import { sendEmail } from "@/lib/email.ts";
import { linkify, renderChatHtml } from "@/lib/garrett/format.ts";
import { getActiveMember } from "@/lib/members.ts";
import { allowAccessRequest, clientIp } from "@/lib/ratelimit.ts";

export const runtime = "nodejs";

// "Sign in": email a one-hour link to members. Same answer either way, so the
// form can't be used to find out who's a member.
export async function POST(req: Request) {
  if (!(await allowAccessRequest(clientIp(req)))) return Response.json({ error: "Too many requests today." }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Enter a valid email." }, { status: 400 });
  if (await getActiveMember(email)) {
    const text = `Here's your sign-in link for Ask Garrett. It works for an hour, on this device:\n\n${signInLink(email)}\n\nIf you didn't ask for this, ignore it.\n\n— Garrett (AI)`;
    await sendEmail({ to: email, subject: "Your Ask Garrett sign-in link", text, html: linkify(renderChatHtml(text)) }).catch((e) =>
      console.error("[auth] link email failed", e),
    );
  }
  return Response.json({ ok: true });
}
