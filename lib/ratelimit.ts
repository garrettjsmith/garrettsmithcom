import { getStore } from "./store.ts";

// Daily counters for the anonymous web chat: one per visitor IP, one global
// ceiling so a traffic spike can't run up the API bill.

const DAY = 86_400;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function allowWebMessage(ip: string): Promise<{ ok: true } | { ok: false; reason: "visitor" | "global" }> {
  const perIp = Number(process.env.WEB_MESSAGES_PER_IP_PER_DAY || 30);
  const global = Number(process.env.WEB_MESSAGES_GLOBAL_PER_DAY || 1500);
  const store = getStore();
  const d = today();
  if ((await store.incr(`rl:web:ip:${ip}:${d}`, DAY)) > perIp) return { ok: false, reason: "visitor" };
  if ((await store.incr(`rl:web:all:${d}`, DAY)) > global) return { ok: false, reason: "global" };
  return { ok: true };
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
