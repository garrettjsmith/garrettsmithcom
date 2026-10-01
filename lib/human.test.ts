import { test } from "node:test";
import assert from "node:assert/strict";
import { getCase, isoWeek, markPaid, openCase, recordOutcome, slotsLeft, weeklyNumbers } from "./human.ts";

const ctx = (visitor: string) => ({ channel: "web", visitor, transcript: [{ role: "user", content: "We got suspended after moving offices." }] });
const handoff = "BUSINESS: Test Co\\nTHE QUESTION: suspended\\nMY DIAGNOSIS: address change";

test("an offer opens a case with a card and counts toward this week", async () => {
  const before = await slotsLeft();
  const r = await openCase({ type: "suspension_review", trigger: "hard", reason: "Active suspension after a move", handoff }, ctx("ip:1"));
  assert.ok(r.ok);
  assert.equal(r.card?.name, "Suspension Review");
  assert.equal(r.card?.price, "$750");
  assert.match(r.message, /card/);
  const c = await getCase(r.card!.caseId!);
  assert.equal(c?.status, "offered");
  assert.equal(c?.transcript.length, 1);
  assert.equal(await slotsLeft(), before);
});

test("soft offers don't repeat for the same visitor; hard ones do", async () => {
  const soft = { type: "second_opinion", trigger: "soft", reason: "Data disagrees", handoff };
  assert.ok((await openCase(soft, ctx("ip:2"))).ok);
  assert.equal((await openCase(soft, ctx("ip:2"))).ok, false);
  const hard = { type: "suspension_review", trigger: "hard", reason: "Suspended", handoff };
  assert.ok((await openCase(hard, ctx("ip:2"))).ok);
  assert.ok((await openCase(hard, ctx("ip:2"))).ok);
});

test("no handoff, no case", async () => {
  const r = await openCase({ type: "second_opinion", trigger: "asked", reason: "Asked", handoff: "" }, ctx("ip:3"));
  assert.equal(r.ok, false);
});

test("email offers carry a checkout link instead of a card instruction", async () => {
  const r = await openCase({ type: "second_opinion", trigger: "asked", reason: "Asked for a person", handoff }, { ...ctx("ip:4"), channel: "email" });
  assert.match(r.message, /\/api\/human\/checkout\?case=/);
});

test("paying uses a slot once, and outcomes count once", async () => {
  const r = await openCase({ type: "second_opinion", trigger: "asked", reason: "Asked", handoff }, ctx("ip:5"));
  const left = await slotsLeft();
  await markPaid(r.card!.caseId!, { email: "sam@x.com", amountCents: 15_000 });
  await markPaid(r.card!.caseId!, { email: "sam@x.com", amountCents: 15_000 });
  assert.equal(await slotsLeft(), left - 1);
  assert.equal((await getCase(r.card!.caseId!))?.status, "paid");
  await recordOutcome(r.card!.caseId!, "amended", "Should have checked the service area first");
  await recordOutcome(r.card!.caseId!, "amended");
  const n = await weeklyNumbers(isoWeek());
  assert.equal(n.amended, 1);
  assert.ok(n.paid >= 1);
  assert.ok(n.revenue >= 150);
});

test("full weeks show a card without a case", async () => {
  process.env.HUMAN_SLOTS_PER_WEEK = "0";
  const r = await openCase({ type: "second_opinion", trigger: "asked", reason: "Asked", handoff }, ctx("ip:6"));
  assert.equal(r.ok, false);
  assert.equal(r.card?.caseId, null);
  delete process.env.HUMAN_SLOTS_PER_WEEK;
});
