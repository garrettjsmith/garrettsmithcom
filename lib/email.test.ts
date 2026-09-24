import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { isAutomated, parseAddress, senderVerified, stripQuoted, threadKey, verifySvix } from "./email.ts";

const secret = "whsec_" + Buffer.from("super-secret-key-for-tests").toString("base64");
function sign(body: string, id = "msg_1", ts = String(Math.floor(Date.now() / 1000))) {
  const key = Buffer.from(secret.slice(6), "base64");
  const sig = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64");
  return { id, timestamp: ts, signature: `v1,${sig}` };
}

test("verifySvix accepts a valid signature, including among rotated ones", () => {
  const body = '{"type":"email.received"}';
  const h = sign(body);
  assert.ok(verifySvix(body, h, secret));
  assert.ok(verifySvix(body, { ...h, signature: `v1,bogus ${h.signature}` }, secret));
});

test("verifySvix rejects tampering, stale timestamps, and missing secrets", () => {
  const body = '{"type":"email.received"}';
  const h = sign(body);
  assert.equal(verifySvix(body + " ", h, secret), false);
  assert.equal(verifySvix(body, sign(body, "msg_1", String(Math.floor(Date.now() / 1000) - 3600)), secret), false);
  assert.equal(verifySvix(body, h, undefined), false);
  assert.equal(verifySvix(body, { ...h, signature: null }, secret), false);
});

test("parseAddress handles names, quotes, and bare addresses", () => {
  assert.deepEqual(parseAddress("Sam Lee <Sam@Example.com>"), { name: "Sam Lee", email: "sam@example.com" });
  assert.deepEqual(parseAddress('"Lee, Sam" <sam@example.com>'), { name: "Lee, Sam", email: "sam@example.com" });
  assert.deepEqual(parseAddress("sam@example.com"), { name: "", email: "sam@example.com" });
});

test("threadKey ignores reply and forward prefixes", () => {
  assert.equal(threadKey("Re: RE: Fwd: Map pack drop"), "map pack drop");
  assert.equal(threadKey("Map Pack Drop"), "map pack drop");
});

test("stripQuoted keeps only the new message", () => {
  const gmail = "Thanks, what about photos?\n\nOn Tue, Sep 23, 2026 at 9:41 AM Garrett (AI) <ask@garrettsmith.com> wrote:\n> Reviews are the gap.";
  assert.equal(stripQuoted(gmail), "Thanks, what about photos?");
  const wrapped = "Got it.\n\nOn Tue, Sep 23, 2026 at 9:41 AM Garrett (AI) <ask@garrettsmith.com>\nwrote:\n> old";
  assert.equal(stripQuoted(wrapped), "Got it.");
  const outlook = "Sounds good\r\n\r\nFrom: Garrett (AI) <ask@garrettsmith.com>\r\nSent: Tuesday\r\nSubject: Re: x";
  assert.equal(stripQuoted(outlook), "Sounds good");
  assert.equal(stripQuoted("Line one\n> quoted\nLine two"), "Line one\nLine two");
});

test("isAutomated catches auto-replies, lists, and bounces", () => {
  assert.ok(isAutomated("sam@example.com", { "Auto-Submitted": "auto-replied" }));
  assert.ok(isAutomated("sam@example.com", { precedence: "bulk" }));
  assert.ok(isAutomated("news@example.com", { "list-unsubscribe": "<mailto:x>" }));
  assert.ok(isAutomated("MAILER-DAEMON@example.com", {}));
  assert.ok(isAutomated("no-reply@example.com", {}));
  assert.equal(isAutomated("sam@example.com", { "auto-submitted": "no" }), false);
});

test("senderVerified needs SPF or DKIM, and no DMARC failure", () => {
  assert.ok(senderVerified({ spf: "pass", dkim: "gray", dmarc: "gray" }));
  assert.ok(senderVerified({ spf: "fail", dkim: "pass", dmarc: "pass" }));
  assert.equal(senderVerified({ spf: "pass", dkim: "pass", dmarc: "fail" }), false);
  assert.equal(senderVerified({ spf: "gray", dkim: "gray", dmarc: "gray" }), false);
  assert.equal(senderVerified(null), false);
});
