import { getStore } from "../store.ts";
import { LSD_BY_NAME } from "./tools.ts";
import { trimResult } from "./trim.ts";

// Calls the Local SEO Data REST API directly, so the app (not the model
// provider) holds the key, can reuse recent results, trims them before the
// model reads them, and knows exactly how many credits each customer uses.

const BASE = process.env.LOCALSEODATA_API_URL || "https://api.localseodata.com";
const MONTH = () => new Date().toISOString().slice(0, 7);

export function lsdAvailable(): boolean {
  return Boolean(process.env.LOCALSEODATA_API_KEY);
}

export type LsdResult = { ok: true; content: string; cached: boolean; credits: number } | { ok: false; content: string };

/** Stable cache key: tool + inputs with sorted keys and normalized strings. */
export function cacheKey(tool: string, input: Record<string, unknown>): string {
  const norm = Object.keys(input)
    .sort()
    .map((k) => {
      const v = input[k];
      return `${k}=${typeof v === "string" ? v.trim().toLowerCase().replace(/\s+/g, " ") : JSON.stringify(v)}`;
    })
    .join("&");
  return `lsd:cache:${tool}:${norm}`;
}

/** The API wraps most payloads in `data`, but some endpoints put them at the top level. */
export function unwrap(body: Record<string, unknown>): Record<string, unknown> {
  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) return body.data as Record<string, unknown>;
  const { status, credits_used, ...rest } = body;
  void status;
  void credits_used;
  return rest;
}

function budgetFor(scope: string): number {
  if (scope === "anon") return Number(process.env.LSD_CREDITS_ANON_PER_DAY || 2000);
  return Number(process.env.LSD_CREDITS_PER_MEMBER_PER_MONTH || 1500);
}

function usageKey(scope: string): string {
  return scope === "anon" ? `lsd:credits:anon:${new Date().toISOString().slice(0, 10)}` : `lsd:credits:${scope}:${MONTH()}`;
}

/**
 * Run one tool call. `scope` is who pays: a member's memory key
 * ("email:sam@x.com", a Slack team ID) or "anon" for free web visitors.
 */
export async function callLsd(tool: string, rawInput: unknown, scope: string, fetchImpl: typeof fetch = fetch): Promise<LsdResult> {
  const def = LSD_BY_NAME.get(tool);
  if (!def) return { ok: false, content: `Unknown tool ${tool}.` };
  if (!lsdAvailable()) return { ok: false, content: "Live data isn't connected right now. Answer from experience and say so." };

  const input: Record<string, unknown> = { ...(def.defaults ?? {}), ...((rawInput as Record<string, unknown>) ?? {}) };
  for (const r of def.required) {
    if (input[r] === undefined || input[r] === "") return { ok: false, content: `Missing ${r}.` };
  }

  const store = getStore();
  const key = cacheKey(tool, input);
  const hit = await store.get<string>(key);
  if (hit) return { ok: true, content: hit, cached: true, credits: 0 };

  const used = (await store.get<number>(usageKey(scope))) ?? 0;
  if (used >= budgetFor(scope)) {
    return { ok: false, content: "This account has used its live-data allowance for now. Answer from experience and say live checks are paused." };
  }

  const url = new URL(def.path, BASE);
  const init: RequestInit = {
    method: def.method,
    headers: { Authorization: `Bearer ${process.env.LOCALSEODATA_API_KEY}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(90_000),
  };
  if (def.method === "GET") for (const [k, v] of Object.entries(input)) url.searchParams.set(k, String(v));
  else init.body = JSON.stringify(input);

  let res: Response;
  try {
    res = await fetchImpl(url, init);
  } catch (err) {
    return { ok: false, content: `The ${def.label} check timed out or couldn't connect (${(err as Error).name}).` };
  }
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !body || body.status === "error") {
    const msg = (body?.message as string) || `HTTP ${res.status}`;
    console.error(`[lsd] ${tool} failed: ${msg}`);
    return { ok: false, content: `The ${def.label} check failed: ${msg}` };
  }

  const credits = Number(body.credits_used ?? res.headers.get("x-credits-used") ?? 0) || 0;
  if (credits) {
    await store.incrBy(usageKey(scope), credits, scope === "anon" ? 2 * 86_400 : 32 * 86_400);
    await store.incrBy(`lsd:credits:all:${MONTH()}`, credits, 32 * 86_400);
  }

  const content = JSON.stringify(trimResult(tool, unwrap(body)));
  await store.set(key, content, def.cacheSeconds);
  return { ok: true, content, cached: false, credits };
}
