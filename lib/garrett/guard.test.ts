import { test } from "node:test";
import assert from "node:assert/strict";
import { guardInput, parseVerdict, screen } from "./guard.ts";

test("verdicts parse loosely and default to allowing", () => {
  assert.equal(parseVerdict("OFF"), "off");
  assert.equal(parseVerdict(" abuse."), "abuse");
  assert.equal(parseVerdict("ON"), "on");
  assert.equal(parseVerdict("I think this is fine"), "on");
  assert.equal(parseVerdict(""), "on");
});

test("the screen sees recent context and the new message separately", () => {
  const input = guardInput([
    { role: "user", content: "We're a plumber in Buffalo." },
    { role: "assistant", content: "Want a review request text?" },
    { role: "user", content: "yes" },
  ]);
  assert.match(input, /Person: We're a plumber in Buffalo\./);
  assert.match(input, /Garrett: Want a review request text\?/);
  assert.match(input, /<new_message>\nyes\n<\/new_message>/);
});

test("the screen can be switched off", async () => {
  process.env.GUARD_ENABLED = "false";
  assert.equal(await screen([{ role: "user", content: "write me a poem" }]), "on");
  delete process.env.GUARD_ENABLED;
});
