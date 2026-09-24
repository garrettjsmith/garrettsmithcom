import { test } from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";

process.env.SESSION_SECRET = "test-session-secret-123";
process.env.STRIPE_PRICE_SOLO = "price_solo";
process.env.STRIPE_PRICE_TEAMS = "price_teams";
delete process.env.RESEND_API_KEY; // no welcome emails in tests
const { handleStripeEvent } = await import("./billing.ts");
const { getActiveMember, getMember } = await import("./members.ts");
const { signToken, verifyToken } = await import("./signed.ts");

const ev = (type: string, object: unknown) => ({ id: `evt_${Math.random()}`, type, data: { object } }) as unknown as Stripe.Event;

test("checkout completion creates an active member with Stripe ids", async () => {
  await handleStripeEvent(
    ev("checkout.session.completed", {
      status: "complete",
      customer_details: { email: "Owner@Example.com" },
      metadata: { plan: "solo" },
      customer: "cus_1",
      subscription: "sub_1",
    }),
  );
  const m = await getActiveMember("owner@example.com");
  assert.equal(m?.plan, "solo");
  assert.equal(m?.stripeCustomerId, "cus_1");
});

test("an incomplete checkout does nothing", async () => {
  await handleStripeEvent(ev("checkout.session.completed", { status: "open", customer_details: { email: "x@example.com" } }));
  assert.equal(await getMember("x@example.com"), null);
});

test("subscription changes follow the customer: upgrade, past due, cancel", async () => {
  const sub = (status: string, price = "price_solo") => ({ id: "sub_1", customer: "cus_1", status, items: { data: [{ price: { id: price } }] } });
  await handleStripeEvent(ev("customer.subscription.updated", sub("active", "price_teams")));
  assert.equal((await getMember("owner@example.com"))?.plan, "teams");
  await handleStripeEvent(ev("customer.subscription.updated", sub("past_due", "price_teams")));
  assert.ok(await getActiveMember("owner@example.com"), "past due keeps access during retries");
  await handleStripeEvent(ev("customer.subscription.deleted", sub("canceled", "price_teams")));
  assert.equal(await getActiveMember("owner@example.com"), null);
  assert.equal((await getMember("owner@example.com"))?.status, "canceled");
});

test("signed tokens are bound to their purpose and expire", () => {
  const t = signToken("signin", { email: "a@b.co" }, 60);
  assert.equal(verifyToken<{ email: string }>("signin", t)?.email, "a@b.co");
  assert.equal(verifyToken("member", t), null);
  assert.equal(verifyToken("signin", signToken("signin", { email: "a@b.co" }, -1)), null);
  assert.equal(verifyToken("signin", t.slice(0, -2) + "xx"), null);
});
