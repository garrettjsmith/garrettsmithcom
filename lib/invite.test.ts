import { test } from "node:test";
import assert from "node:assert/strict";

process.env.INVITE_SECRET = "test-secret-at-least-16";
const { createInvite, verifyInvite } = await import("./invite.ts");

test("round-trips a valid invite", () => {
  assert.equal(verifyInvite(createInvite("a@b.co"))?.email, "a@b.co");
});

test("rejects tampered, expired, and missing tokens", () => {
  const t = createInvite("a@b.co");
  const [payload, sig] = t.split(".");
  const forged = Buffer.from(JSON.stringify({ email: "evil@x.co", exp: Date.now() + 1e9 })).toString("base64url");
  assert.equal(verifyInvite(`${forged}.${sig}`), null);
  assert.equal(verifyInvite(`${payload}.x${sig.slice(1)}`), null);
  assert.equal(verifyInvite(createInvite("a@b.co", -1)), null);
  assert.equal(verifyInvite(null), null);
});
