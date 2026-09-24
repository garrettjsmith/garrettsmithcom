import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTranscript } from "./transcript.ts";

test("accepts an alternating transcript ending with the user", () => {
  const t = parseTranscript({ messages: [{ role: "user", content: "a" }, { role: "assistant", content: "b" }, { role: "user", content: " c " }] });
  assert.deepEqual(t, [
    { role: "user", content: "a" },
    { role: "assistant", content: "b" },
    { role: "user", content: "c" },
  ]);
});

test("rejects bad shapes", () => {
  assert.equal(typeof parseTranscript({}), "string");
  assert.equal(typeof parseTranscript({ messages: [{ role: "system", content: "x" }] }), "string");
  assert.equal(typeof parseTranscript({ messages: [{ role: "user", content: "a" }, { role: "user", content: "b" }] }), "string");
  assert.equal(typeof parseTranscript({ messages: [{ role: "user", content: "x".repeat(2001) }] }), "string");
  assert.equal(typeof parseTranscript({ messages: [{ role: "user", content: "a" }, { role: "assistant", content: "b" }] }), "string");
});

test("trims long histories to recent turns starting with the user", () => {
  const messages = Array.from({ length: 41 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: String(i) }));
  const t = parseTranscript({ messages });
  assert.ok(Array.isArray(t));
  assert.equal(t[0].role, "user");
  assert.equal(t.at(-1)?.content, "40");
  assert.ok(t.length <= 24);
});
