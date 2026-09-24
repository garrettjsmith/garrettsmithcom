import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { formatHours, trimResult, cleanUrl } from "./trim.ts";
import { LSD_TOOLS } from "./tools.ts";

process.env.LOCALSEODATA_API_KEY = "sk_test_x";
const { callLsd, cacheKey, unwrap } = await import("./client.ts");

const fixture = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"));

test("every fixture trims to something smaller or annotated, and valid JSON", () => {
  for (const f of readdirSync(new URL("./fixtures/", import.meta.url))) {
    const tool = f.replace(".json", "");
    const out = JSON.stringify(trimResult(tool, fixture(tool)));
    assert.doesNotThrow(() => JSON.parse(out), tool);
  }
});

test("hours become one readable line", () => {
  const bp = fixture("business_profile");
  assert.equal(formatHours(bp.hours), "Mon-Fri 08:00-17:00; Sat-Sun closed");
  const maps = trimResult("maps", fixture("maps")) as { results: { hours: string; website: string }[] };
  assert.equal(maps.results[0].hours, "Mon-Sun 24 hours");
});

test("tracking parameters are stripped from URLs", () => {
  assert.equal(cleanUrl("https://a.com/b/?utm_source=Google&utm_medium=organic&x=1"), "https://a.com/b/?x=1");
});

test("organic results are numbered among organic results only", () => {
  const raw = fixture("organic_serp") as { organic_results: { rank: number }[] };
  assert.ok(raw.organic_results[0].rank > 1);
  const out = trimResult("organic_serp", raw) as { organic: { position: number }[] };
  assert.deepEqual(out.organic.slice(0, 3).map((r) => r.position), [1, 2, 3]);
});

test("a zero word count is flagged as a likely JavaScript page", () => {
  const out = trimResult("page_audit", fixture("page_audit")) as { note?: string };
  assert.match(out.note ?? "", /JavaScript/);
});

test("a letter-spaced title is flagged, a normal one isn't", () => {
  const spaced = trimResult("page_audit", fixture("page_audit")) as { flags?: string[] };
  assert.match(spaced.flags?.[0] ?? "", /title is letter-spaced/);
  const normal = trimResult("page_audit", { title: "Plumber in Buffalo, NY | A B Plumbing", h1: ["We fix it"] }) as { flags?: string[] };
  assert.equal(normal.flags, undefined);
});

test("both response envelopes unwrap", () => {
  assert.deepEqual(unwrap({ status: "success", credits_used: 2, data: { a: 1 } }), { a: 1 });
  assert.deepEqual(unwrap({ status: "success", credits_used: 2, results: [1] }), { results: [1] });
});

test("documented REST shapes (position, summary) trim like the MCP ones", () => {
  const lp = trimResult("local_pack", { results: [{ position: 1, name: "A", rating: 4.7 }], search_metadata: { keyword: "plumber", location: "X" } }) as { keyword: string; results: { rank: number }[] };
  assert.equal(lp.results[0].rank, 1);
  assert.equal(lp.keyword, "plumber");
  const rv = trimResult("google_reviews", { reviews: [], summary: { total_reviews: 847, average_rating: 4.6 } }) as { total_reviews: number };
  assert.equal(rv.total_reviews, 847);
});

test("cache keys ignore case, spacing, and argument order", () => {
  assert.equal(cacheKey("local_pack", { keyword: "Plumber ", location: "Buffalo,  NY" }), cacheKey("local_pack", { location: "buffalo, ny", keyword: "plumber" }));
});

test("callLsd posts to the right path, trims, caches, and counts credits", async () => {
  const seen: { url: string; body: unknown; auth: string | null }[] = [];
  const fake = (async (url: URL, init: RequestInit) => {
    seen.push({ url: String(url), body: JSON.parse(String(init.body)), auth: new Headers(init.headers).get("authorization") });
    return new Response(JSON.stringify({ status: "success", credits_used: 5, data: fixture("business_profile") }), { status: 200 });
  }) as unknown as typeof fetch;
  const a = await callLsd("business_profile", { business_name: "Jon the Plumber", location: "Buffalo, NY" }, "email:t@x.co", fake);
  assert.ok(a.ok && !a.cached && a.credits === 5);
  assert.equal(seen[0].url, "https://api.localseodata.com/v1/business/profile");
  assert.equal(seen[0].auth, "Bearer sk_test_x");
  assert.match(a.ok ? a.content : "", /Mon-Fri 08:00-17:00/);
  const b = await callLsd("business_profile", { business_name: "jon the plumber", location: "Buffalo, NY" }, "email:t@x.co", fake);
  assert.ok(b.ok && b.cached, "second identical lookup is served from cache");
  assert.equal(seen.length, 1);
});

test("defaults are applied and errors come back as tool errors", async () => {
  let body: Record<string, unknown> = {};
  const fake = (async (_u: URL, init: RequestInit) => {
    body = JSON.parse(String(init.body));
    return new Response(JSON.stringify({ status: "error", error: "INSUFFICIENT_CREDITS", message: "Out of credits" }), { status: 402 });
  }) as unknown as typeof fetch;
  const r = await callLsd("competitor_gap", { business_name: "X", location: "Y", keyword: "plumber" }, "anon", fake);
  assert.equal(body.competitors, 3);
  assert.equal(r.ok, false);
  assert.match(r.content, /Out of credits/);
  const missing = await callLsd("local_pack", { keyword: "plumber" }, "anon", fake);
  assert.match(missing.content, /Missing location/);
});

test("expensive and country-level tools stay off the list", () => {
  const names = LSD_TOOLS.map((t) => t.name);
  for (const off of ["local_audit", "geogrid_scan", "citation_audit", "ai_visibility", "search_volume", "keyword_suggestions"]) assert.ok(!names.includes(off), off);
});
