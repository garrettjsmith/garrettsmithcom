import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getActiveMember, type Member } from "./members.ts";
import { getStore } from "./store.ts";

// API keys let a member's own agents call vGarrett (REST and MCP). Only a
// hash is stored, so a key is shown once, when it's created. Access follows
// the membership: a canceled member's keys stop working on their own.

export type KeyInfo = { id: string; label: string; hint: string; created: string };
type Stored = KeyInfo & { hash: string };

export const MAX_KEYS = 5;
const PREFIX = "vg_";

const hashOf = (key: string) => createHash("sha256").update(key).digest("hex");
const lookupKey = (hash: string) => `apikey:${hash}`;
const listKey = (email: string) => `apikeys:${email.trim().toLowerCase()}`;
const publicInfo = ({ id, label, hint, created }: Stored): KeyInfo => ({ id, label, hint, created });

async function stored(email: string): Promise<Stored[]> {
  return (await getStore().get<Stored[]>(listKey(email))) ?? [];
}

export async function listKeys(email: string): Promise<KeyInfo[]> {
  return (await stored(email)).map(publicInfo);
}

/** Returns the full key once. Null when the member already has MAX_KEYS. */
export async function createKey(email: string, label: string): Promise<{ key: string; info: KeyInfo } | null> {
  const keys = await stored(email);
  if (keys.length >= MAX_KEYS) return null;
  const key = PREFIX + randomBytes(24).toString("base64url");
  const entry: Stored = {
    id: randomUUID().slice(0, 8),
    label: label.trim().slice(0, 40) || "My agent",
    hint: `${PREFIX}…${key.slice(-4)}`,
    created: new Date().toISOString(),
    hash: hashOf(key),
  };
  const store = getStore();
  await store.set(lookupKey(entry.hash), email.trim().toLowerCase());
  await store.set(listKey(email), [...keys, entry]);
  return { key, info: publicInfo(entry) };
}

export async function revokeKey(email: string, id: string): Promise<boolean> {
  const keys = await stored(email);
  const entry = keys.find((k) => k.id === id);
  if (!entry) return false;
  const store = getStore();
  await store.set(lookupKey(entry.hash), null);
  await store.set(listKey(email), keys.filter((k) => k.id !== id));
  return true;
}

/** The active member a key belongs to, or null. */
export async function memberForKey(key: string | null | undefined): Promise<Member | null> {
  if (!key || !key.startsWith(PREFIX) || key.length > 80) return null;
  const email = await getStore().get<string>(lookupKey(hashOf(key)));
  return email ? getActiveMember(email) : null;
}

/** Reads the key from `Authorization: Bearer vg_…` or `X-Api-Key`. */
export async function memberForRequest(req: Request): Promise<Member | null> {
  const auth = req.headers.get("authorization");
  const bearer = auth && /^bearer\s+/i.test(auth) ? auth.replace(/^bearer\s+/i, "").trim() : null;
  return memberForKey(bearer || req.headers.get("x-api-key"));
}

export function unauthorized(): Response {
  return Response.json(
    { error: "Missing or invalid API key. Create one at garrettsmith.com (sign in, then API) and send it as: Authorization: Bearer vg_…" },
    { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="vGarrett"' } },
  );
}
