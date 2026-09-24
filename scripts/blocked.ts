// Show the most recent messages the scope screen turned away, newest first,
// so you can spot real questions it blocked by mistake.
// Needs the production Redis credentials in the environment:
//   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... npm run blocked -- [count]
import { getStore } from "../lib/store.ts";

if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL) {
  console.error("Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_*) to the production store first.");
  process.exit(1);
}
const count = Number(process.argv[2]) || 50;
const rows = await getStore().lrange<string | { at: string; verdict: string; channel: string; text: string }>("guard:blocked", count);
if (!rows.length) console.log("Nothing blocked yet.");
for (const row of rows) {
  const r = typeof row === "string" ? JSON.parse(row) : row;
  console.log(`${r.at.slice(0, 16).replace("T", " ")}  ${r.verdict.padEnd(5)}  ${r.channel.padEnd(5)}  ${r.text.replace(/\s+/g, " ").slice(0, 140)}`);
}
