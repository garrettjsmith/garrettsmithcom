import { createHmac, timingSafeEqual } from "node:crypto";

// Signed, expiring invite tokens. You approve someone, run `npm run invite`,
// and send them the link; only a valid token can start the Slack install.
// Stateless: nothing to store, nothing to look up.

export type Invite = { email: string; exp: number };

function secret(): string {
  const s = process.env.INVITE_SECRET;
  if (!s || s.length < 16) throw new Error("INVITE_SECRET must be set (16+ chars)");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createInvite(email: string, days = 14): string {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + days * 86_400_000 } satisfies Invite)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyInvite(token: string | null | undefined): Invite | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const want = Buffer.from(sign(payload));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const invite = JSON.parse(Buffer.from(payload, "base64url").toString()) as Invite;
    return typeof invite.email === "string" && invite.exp > Date.now() ? invite : null;
  } catch {
    return null;
  }
}
