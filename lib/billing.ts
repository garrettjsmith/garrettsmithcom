import Stripe from "stripe";
import { ASK_ADDRESS, sendEmail } from "./email.ts";
import { linkify, renderChatHtml } from "./garrett/format.ts";
import { createInvite } from "./invite.ts";
import { emailForCustomer, getMember, upsertMember, type Plan } from "./members.ts";
import { signToken } from "./signed.ts";

// Stripe subscriptions -> members. Checkout creates the subscription; the
// webhook is the source of truth for who is paying.

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export function billingEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_SOLO);
}

export function site(): string {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function priceFor(plan: Plan): string | undefined {
  return plan === "teams" ? process.env.STRIPE_PRICE_TEAMS : process.env.STRIPE_PRICE_SOLO;
}

function planForPrice(priceId: string | undefined): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_TEAMS) return "teams";
  if (priceId === process.env.STRIPE_PRICE_SOLO) return "solo";
  return null;
}

export async function createCheckout(plan: Plan, email?: string): Promise<string> {
  const price = priceFor(plan);
  if (!price) throw new Error(`No Stripe price configured for ${plan}`);
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    customer_email: email || undefined,
    allow_promotion_codes: true,
    metadata: { plan },
    subscription_data: { metadata: { plan } },
    custom_text: { submit: { message: `By subscribing you agree to the Terms (${site()}/terms) and Privacy Policy (${site()}/privacy). Cancel any time.` } },
    success_url: `${site()}/api/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site()}/?checkout=canceled#pricing`,
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return session.url;
}

export async function createPortal(email: string): Promise<string | null> {
  const member = await getMember(email);
  if (!member?.stripeCustomerId) return null;
  const session = await stripe().billingPortal.sessions.create({
    customer: member.stripeCustomerId,
    return_url: `${site()}/`,
  });
  return session.url;
}

const id = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : v?.id);

/** Record a completed checkout. Safe to call twice (success redirect and webhook both do). */
export async function activateFromCheckout(session: Stripe.Checkout.Session): Promise<{ email: string; plan: Plan; isNew: boolean } | null> {
  if (session.status !== "complete") return null;
  const email = (session.customer_details?.email || session.customer_email || "").toLowerCase();
  if (!email) return null;
  const plan: Plan = session.metadata?.plan === "teams" ? "teams" : "solo";
  const before = await getMember(email);
  await upsertMember(email, {
    plan,
    status: "active",
    stripeCustomerId: id(session.customer),
    stripeSubscriptionId: id(session.subscription),
    ...(before ? {} : { since: new Date().toISOString() }),
  });
  const isNew = !before || before.status === "canceled" || before.stripeSubscriptionId !== id(session.subscription);
  return { email, plan, isNew };
}

async function syncSubscription(sub: Stripe.Subscription, deleted: boolean) {
  const customerId = id(sub.customer);
  if (!customerId) return;
  const email = await emailForCustomer(customerId);
  if (!email) return;
  const status: "active" | "past_due" | "canceled" =
    deleted || ["canceled", "unpaid", "incomplete_expired"].includes(sub.status)
      ? "canceled"
      : sub.status === "past_due"
        ? "past_due"
        : "active";
  const plan = planForPrice(sub.items?.data?.[0]?.price?.id);
  await upsertMember(email, { status, stripeSubscriptionId: sub.id, ...(plan ? { plan } : {}) });
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const done = await activateFromCheckout(event.data.object);
      if (done?.isNew) await sendWelcome(done.email, done.plan).catch((e) => console.error("[billing] welcome email failed", e));
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created":
      await syncSubscription(event.data.object, false);
      break;
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object, true);
      break;
  }
}

export function signInLink(email: string): string {
  return `${site()}/api/auth/callback?token=${encodeURIComponent(signToken("signin", { email }, 60 * 60))}`;
}

async function sendWelcome(email: string, plan: Plan) {
  if (!process.env.RESEND_API_KEY) return;
  const lines = [
    "Welcome to Ask Garrett.",
    "",
    `**Ask by email:** write to ${ASK_ADDRESS} any time. Reply to keep a conversation going. I remember your business between emails.`,
    "",
    `**Ask on the web:** ${signInLink(email)} signs you in on this device (the link works for an hour; you can get a new one from the site any time).`,
  ];
  if (plan === "teams") {
    lines.push(
      "",
      `**Add Garrett to Slack:** ${site()}/api/slack/install?invite=${encodeURIComponent(createInvite(email, 30))} (works for 30 days). Mention @Garrett in any channel or DM him.`,
    );
  }
  lines.push("", "Start with something hard.", "", "— Garrett (AI)");
  const text = lines.join("\n");
  await sendEmail({ to: email, subject: "You're in: Ask Garrett", text: text.replace(/\*\*/g, ""), html: linkify(renderChatHtml(text)) });
}
