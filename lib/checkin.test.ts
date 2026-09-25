import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gather, isoWeek, positionIn, profileChanges } from "./checkin.ts";
import type { Business } from "./garrett/brief.ts";

test("iso weeks", () => {
  assert.equal(isoWeek(new Date("2026-09-24T12:00:00Z")), "2026-W39");
  assert.equal(isoWeek(new Date("2026-01-01T12:00:00Z")), "2026-W01");
});

test("finds the business in the pack by loose name match", () => {
  const results = [{ rank: 1, name: "Cellino Plumbing, Heating, Cooling & Electric" }, { rank: 2, name: "Jon the Plumber" }];
  assert.equal(positionIn(results, "Jon The Plumber"), 2);
  assert.equal(positionIn(results, "PCS Plumbing"), null);
});

test("profile changes are listed field by field", () => {
  const before = { name: "Jon the Plumber", phone: "1", categories: ["plumber"] };
  const after = { name: "Jon the Plumber", phone: "2", categories: ["plumber", "drainage service"] };
  const changes = profileChanges(before, after);
  assert.equal(changes.length, 2);
  assert.match(changes[0], /^phone:/);
  assert.deepEqual(profileChanges(undefined, after), []);
});

test("a check-in gathers ranks, reviews, and a baseline from live data", async () => {
  process.env.LOCALSEODATA_API_KEY = "sk_test";
  const real = globalThis.fetch;
  globalThis.fetch = (async (url: URL) => {
    const tool = { "/v1/serp/local-pack": "local_pack", "/v1/business/profile": "business_profile", "/v1/business/reviews": "google_reviews" }[new URL(url).pathname];
    const data = JSON.parse(readFileSync(new URL(`./lsd/fixtures/${tool}.json`, import.meta.url), "utf8"));
    return new Response(JSON.stringify({ status: "success", credits_used: 1, data }));
  }) as typeof fetch;
  try {
    const biz: Business = {
      id: "jon-the-plumber", name: "Jon the Plumber", city: "Buffalo, NY", keywords: ["plumber"], competitors: [],
      findings: { critical: [], important: [], monitor: [] }, log: [], reminders: [], updatedAt: "",
      baseline: { date: "2026-09-14", ranks: [{ keyword: "plumber", position: 3 }], reviews: { count: 99, latest: "2026-09-10" }, profile: { name: "Jon the Plumber", phone: "old" } },
    };
    const got = await gather(biz, "email:t@x.com", false);
    assert.ok("data" in got && got.data);
    const d = got.data as any;
    assert.equal(d.map_pack[0].now, 2);
    assert.equal(d.map_pack[0].last_check, 3);
    assert.equal(d.reviews.total_last_check, 99);
    assert.ok(d.reviews.new_since_last_check.length > 0);
    assert.ok(d.profile.changes_since_last_check.some((c: string) => c.startsWith("phone:")));
    assert.equal(got.baseline?.ranks?.[0].position, 2);
  } finally {
    globalThis.fetch = real;
    delete process.env.LOCALSEODATA_API_KEY;
  }
});
