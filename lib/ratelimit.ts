import { getStore } from "./store.ts";

// The anonymous web chat is a free taste: a few questions per visitor, then
// the access form. Counted per IP over a 30-day window, plus a global daily
// ceiling so a traffic spike can't run up the API bill. IP is a rough visitor
// ID; accounts replace it once billing exists.

const DAY = 86_400;
const FREE_WINDOW = 30 * DAY;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function freeQuestions(): number {
  return Number(process.env.WEB_FREE_QUESTIONS || 5);
}

export type WebGate =
  | { ok: true; remaining: number; refund: () => Promise<void> }
  | { ok: false; reason: "free" | "global" };

export async function allowWebMessage(ip: string): Promise<WebGate> {
  const global = Number(process.env.WEB_MESSAGES_GLOBAL_PER_DAY || 1500);
  const store = getStore();
  const visitorKey = `rl:web:free:${ip}`;
  const used = await store.incr(visitorKey, FREE_WINDOW);
  if (used > freeQuestions()) return { ok: false, reason: "free" };
  const globalKey = `rl:web:all:${today()}`;
  if ((await store.incr(globalKey, DAY)) > global) {
    await store.decr(visitorKey);
    return { ok: false, reason: "global" };
  }
  // A reply that fails shouldn't use up one of their free questions.
  const refund = async () => {
    await store.decr(visitorKey);
    await store.decr(globalKey);
  };
  return { ok: true, remaining: freeQuestions() - used, refund };
}

export async function allowAccessRequest(ip: string): Promise<boolean> {
  return (await getStore().incr(`rl:access:${ip}:${today()}`, DAY)) <= 5;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
