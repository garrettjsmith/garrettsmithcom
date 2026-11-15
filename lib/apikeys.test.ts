import { test } from "node:test";
import assert from "node:assert/strict";

const { addMember, upsertMember } = await import("./members.ts");
const { createKey, listKeys, memberForKey, memberForRequest, revokeKey, MAX_KEYS } = await import("./apikeys.ts");

test("a new key finds its member; the stored list never holds the key", async () => {
  await addMember("a@b.co", "solo");
  const made = await createKey("A@b.co", "  Claude Code ");
  assert.ok(made);
  assert.match(made.key, /^vg_[\w-]{32}$/);
  assert.equal(made.info.label, "Claude Code");
  assert.equal((await memberForKey(made.key))?.email, "a@b.co");
  const listed = await listKeys("a@b.co");
  assert.equal(listed.length, 1);
  assert.ok(!JSON.stringify(listed).includes(made.key));
  assert.ok(!("hash" in listed[0]));
});

test("reads the key from a Bearer header or X-Api-Key", async () => {
  await addMember("h@b.co", "teams");
  const { key } = (await createKey("h@b.co", ""))!;
  const req = (headers: Record<string, string>) => new Request("http://x/", { headers });
  assert.equal((await memberForRequest(req({ Authorization: `Bearer ${key}` })))?.plan, "teams");
  assert.equal((await memberForRequest(req({ "X-Api-Key": key })))?.email, "h@b.co");
  assert.equal(await memberForRequest(req({})), null);
  assert.equal(await memberForRequest(req({ Authorization: "Bearer vg_nope" })), null);
});

test("revoked keys and canceled members stop working", async () => {
  await addMember("r@b.co", "solo");
  const one = (await createKey("r@b.co", "one"))!;
  const two = (await createKey("r@b.co", "two"))!;
  assert.equal(await revokeKey("r@b.co", "missing"), false);
  assert.equal(await revokeKey("r@b.co", one.info.id), true);
  assert.equal(await memberForKey(one.key), null);
  assert.equal((await memberForKey(two.key))?.email, "r@b.co");
  await upsertMember("r@b.co", { status: "canceled" });
  assert.equal(await memberForKey(two.key), null);
});

test("caps keys per member", async () => {
  await addMember("m@b.co", "solo");
  for (let i = 0; i < MAX_KEYS; i++) assert.ok(await createKey("m@b.co", `k${i}`));
  assert.equal(await createKey("m@b.co", "one too many"), null);
});
