import { Redis } from "@upstash/redis";

// Tiny key-value facade. Upstash Redis (or Vercel KV) in production; an
// in-memory map in dev so the site runs with zero setup. The in-memory store
// does not survive restarts and is per-instance, so never rely on it in prod.

export interface Store {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  incr(key: string, ttlSeconds: number): Promise<number>;
  decr(key: string): Promise<void>;
  lpush(key: string, value: unknown, max: number): Promise<void>;
  lrange<T>(key: string, count: number): Promise<T[]>;
  /** Set only if absent. Returns true when this call set it. */
  claim(key: string, ttlSeconds: number): Promise<boolean>;
}

function redisStore(url: string, token: string): Store {
  const r = new Redis({ url, token });
  return {
    get: (k) => r.get(k),
    async set(k, v, ttl) {
      if (ttl) await r.set(k, v, { ex: ttl });
      else await r.set(k, v);
    },
    async incr(k, ttl) {
      const n = await r.incr(k);
      if (n === 1) await r.expire(k, ttl);
      return n;
    },
    async decr(k) {
      await r.decr(k);
    },
    async lpush(k, v, max) {
      await r.lpush(k, v);
      await r.ltrim(k, 0, max - 1);
    },
    lrange: (k, count) => r.lrange(k, 0, count - 1),
    async claim(k, ttl) {
      return (await r.set(k, 1, { nx: true, ex: ttl })) === "OK";
    },
  };
}

function memoryStore(): Store {
  const m = new Map<string, { v: unknown; exp: number }>();
  const live = (k: string) => {
    const e = m.get(k);
    if (e && e.exp && e.exp < Date.now()) {
      m.delete(k);
      return undefined;
    }
    return e;
  };
  const exp = (ttl?: number) => (ttl ? Date.now() + ttl * 1000 : 0);
  return {
    async get<T>(k: string) {
      return (live(k)?.v as T) ?? null;
    },
    async set(k, v, ttl) {
      m.set(k, { v, exp: exp(ttl) });
    },
    async incr(k, ttl) {
      const e = live(k);
      const n = ((e?.v as number) ?? 0) + 1;
      m.set(k, { v: n, exp: e?.exp || exp(ttl) });
      return n;
    },
    async decr(k) {
      const e = live(k);
      if (e) m.set(k, { v: (e.v as number) - 1, exp: e.exp });
    },
    async lpush(k, v, max) {
      const list = [v, ...(((live(k)?.v as unknown[]) ?? []))].slice(0, max);
      m.set(k, { v: list, exp: 0 });
    },
    async lrange<T>(k: string, count: number) {
      return (((live(k)?.v as T[]) ?? [])).slice(0, count);
    },
    async claim(k, ttl) {
      if (live(k)) return false;
      m.set(k, { v: 1, exp: exp(ttl) });
      return true;
    },
  };
}

let store: Store | undefined;

export function getStore(): Store {
  if (store) return store;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    store = redisStore(url, token);
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn("[store] No Redis configured; using in-memory store. Data will not persist.");
    }
    store = memoryStore();
  }
  return store;
}
