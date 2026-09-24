import { createHmac, timingSafeEqual } from "node:crypto";

// Email channel plumbing: Resend webhooks in, Resend API out. Pure helpers are
// exported separately so they can be unit tested without the network.

export const ASK_ADDRESS = process.env.ASK_EMAIL_ADDRESS || "ask@garrettsmith.com";

/**
 * Resend signs webhooks with Svix: HMAC-SHA256 over "id.timestamp.body" using
 * the base64 secret after the "whsec_" prefix. The header can carry several
 * space-separated "v1,<sig>" entries during secret rotation.
 */
export function verifySvix(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string | undefined,
  now = Date.now(),
): boolean {
  const { id, timestamp, signature } = headers;
  if (!secret || !id || !timestamp || !signature) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > 5 * 60) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const want = Buffer.from(createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64"));
  return signature.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const got = Buffer.from(sig);
    return got.length === want.length && timingSafeEqual(got, want);
  });
}

/** "Sam Lee <Sam@Example.com>" -> { name: "Sam Lee", email: "sam@example.com" } */
export function parseAddress(from: string): { name: string; email: string } {
  const m = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  const email = (m ? m[2] : from).trim().toLowerCase();
  return { name: m ? m[1].trim() : "", email };
}

/** "Re: RE: Fwd: Map pack drop" -> "map pack drop" (a stable thread key) */
export function threadKey(subject: string): string {
  return subject
    .replace(/^(\s*(re|fw|fwd|aw|sv)\s*(\[\d+\])?\s*:\s*)+/i, "")
    .trim()
    .toLowerCase()
    .slice(0, 120);
}

/** Drop the quoted history from a reply so only the new message is left. */
export function stripQuoted(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^On .+ wrote:\s*$/.test(line) || (/^On .+/.test(line) && /wrote:\s*$/.test(lines[i + 1] ?? ""))) break;
    if (/^-{2,}\s*Original Message\s*-{2,}/i.test(line)) break;
    if (/^From: .+/.test(line) && out.length > 0 && /^(Sent|Date): /.test(lines[i + 1] ?? "")) break;
    if (/^>/.test(line)) continue;
    out.push(line);
  }
  return out.join("\n").trim();
}

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Auto-replies, bounces and mailing lists must never get an answer, or two robots loop forever. */
export function isAutomated(from: string, headers: Record<string, string>): boolean {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).toLowerCase()]));
  if (h["auto-submitted"] && h["auto-submitted"] !== "no") return true;
  if (/^(bulk|junk|list|auto_reply)$/.test(h["precedence"] ?? "")) return true;
  if (h["list-id"] || h["list-unsubscribe"] || h["x-autoreply"] || h["x-autorespond"]) return true;
  return /^(mailer-daemon|postmaster|no-?reply|do-?not-?reply|bounce)/.test(parseAddress(from).email);
}

export type ReceivedEmail = {
  id: string;
  from: string;
  to: string[];
  subject: string | null;
  text: string | null;
  html: string | null;
  message_id: string | null;
  headers: Record<string, string> | null;
  authentication: { spf: string; dkim: string; dmarc: string } | null;
};

/** Trust the From address only when the receiving server verified it. */
export function senderVerified(auth: ReceivedEmail["authentication"]): boolean {
  if (!auth || auth.dmarc === "fail") return false;
  return auth.dkim === "pass" || auth.spf === "pass";
}

async function resend<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Resend ${path} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export function getReceivedEmail(id: string): Promise<ReceivedEmail> {
  return resend<ReceivedEmail>(`/emails/receiving/${encodeURIComponent(id)}`);
}

export async function sendEmail(msg: {
  to: string;
  subject: string;
  text: string;
  html: string;
  inReplyTo?: string | null;
  references?: string | null;
}): Promise<void> {
  const headers: Record<string, string> = {};
  if (msg.inReplyTo) headers["In-Reply-To"] = msg.inReplyTo;
  const refs = [msg.references, msg.inReplyTo].filter(Boolean).join(" ").trim();
  if (refs) headers["References"] = refs;
  await resend("/emails", {
    method: "POST",
    body: JSON.stringify({
      from: `Garrett (AI) <${ASK_ADDRESS}>`,
      to: [msg.to],
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      headers,
    }),
  });
}
