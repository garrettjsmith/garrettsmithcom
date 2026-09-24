import { createHmac, timingSafeEqual } from "node:crypto";

// Small signed, expiring tokens for sign-in links and the member cookie.
// Format: base64url(json).base64url(hmac). Not encrypted, so never put secrets in them.

function secret(): string {
  const s = process.env.SESSION_SECRET || process.env.INVITE_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET must be set (16+ chars)");
  return s;
}

function mac(purpose: string, payload: string): string {
  return createHmac("sha256", secret()).update(`${purpose}.${payload}`).digest("base64url");
}

/** `purpose` stops a token minted for one job (a sign-in link) being replayed as another (the cookie). */
export function signToken(purpose: string, data: Record<string, unknown>, ttlSeconds: number): string {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + ttlSeconds * 1000 })).toString("base64url");
  return `${payload}.${mac(purpose, payload)}`;
}

export function verifyToken<T extends Record<string, unknown>>(purpose: string, token: string | null | undefined): T | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const want = Buffer.from(mac(purpose, payload));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as T & { exp: number };
    return typeof data.exp === "number" && data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}
