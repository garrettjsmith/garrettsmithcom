import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { HUMAN_OFFERS, SLOTS_PER_WEEK, type HumanOfferId } from "../content/human.ts";
import { sendEmail } from "./email.ts";
import { renderChatHtml } from "./garrett/format.ts";
import { getActiveMember } from "./members.ts";
import { signToken } from "./signed.ts";
import { getStore } from "./store.ts";

// The human tier. vGarrett opens a case when a conversation needs the real
// Garrett (offer_human_review), the person pays with a one-time Stripe
// checkout (or uses the Second Opinion included in Teams), Garrett gets the
// handoff brief by email and replies to the customer directly, then tags the
// outcome. Counts for the weekly numbers live under human:stat:<week>:*.

export type Outcome = "agreed" | "amended" | "overruled";

export type HumanCase = {
  id: string;
  type: HumanOfferId;
  trigger: "hard" | "soft" | "asked";
  reason: string;
  handoff: string;
  channel: string;
  /** Member email or Slack/email memory key when known. */
  who?: string;
  transcript: { role: string; content: string }[];
  status: "offered" | "paid";
  createdAt: string;
  paidAt?: string;
  email?: string;
  amountCents?: number;
  included?: boolean;
  outcome?: Outcome;
  outcomeNote?: string;
};

const CASE_TTL = 120 * 86_400;
const caseKey = (id: string) => `human:case:${id}`;
const site = () => (process.env.SITE_URL || "https://garrettsmith.com").replace(/\/$/, "");

/** ISO week like 2026-W40; slots and stats reset weekly. */
export function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const year = t.getUTCFullYear();
  return `${year}-W${String(Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7)).padStart(2, "0")}`;
}

const slotsPerWeek = () => Number(process.env.HUMAN_SLOTS_PER_WEEK || SLOTS_PER_WEEK);
const statKey = (name: string, week = isoWeek()) => `human:stat:${week}:${name}`;
const bump = (name: string, by = 1) => getStore().incrBy(statKey(name), by, 400 * 86_400).catch(() => 0);

export async function slotsLeft(week = isoWeek()): Promise<number> {
  const used = (await getStore().get<number>(`human:slots:${week}`)) ?? 0;
  return Math.max(0, slotsPerWeek() - used);
}

export async function getCase(id: string): Promise<HumanCase | null> {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return null;
  return getStore().get<HumanCase>(caseKey(id));
}

async function saveCase(c: HumanCase) {
  await getStore().set(caseKey(c.id), c, CASE_TTL);
}

export const checkoutUrl = (id: string) => `${site()}/api/human/checkout?case=${id}`;

export type OfferInput = { type?: unknown; trigger?: unknown; reason?: unknown; handoff?: unknown };

/**
 * Open a case for the offer_human_review tool. Soft offers are limited to one
 * per visitor per type per day so the AI can't nag; hard triggers always go
 * through. Returns what the model should know, plus the card for the web.
 */
export async function openCase(
  input: OfferInput,
  ctx: { channel: string; who?: string; visitor: string; transcript: { role: string; content: string }[] },
): Promise<{ ok: boolean; message: string; card?: OfferCard }> {
  const type = (Object.keys(HUMAN_OFFERS) as HumanOfferId[]).find((t) => t === input.type) ?? "second_opinion";
  const trigger = input.trigger === "hard" || input.trigger === "asked" ? input.trigger : "soft";
  const reason = String(input.reason ?? "").trim().slice(0, 300);
  const handoff = String(input.handoff ?? "").trim().slice(0, 6000);
  if (!handoff) return { ok: false, message: "Write the handoff brief first (the handoff field), then call again." };

  const store = getStore();
  if (trigger === "soft" && !(await store.claim(`human:offered:${ctx.visitor}:${type}`, 86_400))) {
    return { ok: false, message: "You already offered this recently. Don't offer it again; keep helping." };
  }
  await bump("offers");
  await bump(`offers:${trigger}`);

  const offer = HUMAN_OFFERS[type];
  const left = await slotsLeft();
  if (left <= 0) {
    return {
      ok: false,
      message: `Garrett's ${offer.name} slots are full this week. Say so in a sentence and keep helping; they open again Monday.`,
      card: { ...cardFor(offer), caseId: null, slotsLeft: 0 },
    };
  }

  const id = randomBytes(12).toString("base64url");
  await saveCase({
    id,
    type,
    trigger,
    reason,
    handoff,
    channel: ctx.channel,
    who: ctx.who,
    transcript: ctx.transcript.slice(-16).map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
    status: "offered",
    createdAt: new Date().toISOString(),
  });
  const card = { ...cardFor(offer), caseId: id, slotsLeft: left };
  const link = checkoutUrl(id);
  return {
    ok: true,
    card,
    message:
      ctx.channel === "web"
        ? `Offer shown under your reply as a card with the price (${offer.price}), turnaround, and a button. Don't repeat the price or a link.`
        : `Include this link so they can send the case to Garrett: ${link} (${offer.name}, ${offer.price}, ${offer.turnaround}).`,
  };
}

export type OfferCard = {
  id: HumanOfferId;
  name: string;
  price: string;
  turnaround: string;
  card: string;
  caseId: string | null;
  slotsLeft: number;
  handoff?: string;
};

function cardFor(o: (typeof HUMAN_OFFERS)[HumanOfferId]): Omit<OfferCard, "caseId" | "slotsLeft"> {
  return { id: o.id, name: o.name, price: o.price, turnaround: o.turnaround, card: o.card };
}

const includedKey = (email: string) => `human:included:${email}:${new Date().toISOString().slice(0, 7)}`;

/** Teams members get one Second Opinion a month without paying. Is this one covered? (No side effects.) */
export async function includedAvailable(c: HumanCase, email: string | undefined): Promise<boolean> {
  if (!email || c.type !== "second_opinion") return false;
  const member = await getActiveMember(email);
  if (member?.plan !== "teams") return false;
  return !(await getStore().get(includedKey(email)));
}

/** Use this month's included Second Opinion. True if this call used it. */
export async function claimIncluded(c: HumanCase, email: string | undefined): Promise<boolean> {
  if (!email || !(await includedAvailable(c, email))) return false;
  return getStore().claim(includedKey(email), 40 * 86_400);
}

export async function createHumanCheckout(c: HumanCase, stripe: Stripe, email?: string): Promise<string> {
  const offer = HUMAN_OFFERS[c.type];
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: offer.cents,
          product_data: { name: `${offer.name} with Garrett Smith`, description: offer.card },
        },
      },
    ],
    customer_email: email || undefined,
    metadata: { kind: "human", caseId: c.id, type: c.type },
    payment_intent_data: { metadata: { kind: "human", caseId: c.id } },
    custom_text: {
      submit: { message: `${offer.turnaround[0].toUpperCase()}${offer.turnaround.slice(1)}. Advice, not a guarantee of any outcome with Google. Terms: ${site()}/terms` },
    },
    success_url: `${site()}/?human=sent`,
    cancel_url: `${site()}/?human=canceled`,
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return session.url;
}

/** Called from the Stripe webhook (or directly for an included Second Opinion). */
export async function markPaid(caseId: string, payment: { email: string; amountCents: number; included?: boolean }): Promise<void> {
  const c = await getCase(caseId);
  if (!c || c.status === "paid") return;
  c.status = "paid";
  c.paidAt = new Date().toISOString();
  c.email = payment.email.toLowerCase();
  c.amountCents = payment.amountCents;
  c.included = payment.included;
  await saveCase(c);
  await getStore().incrBy(`human:slots:${isoWeek()}`, 1, 21 * 86_400);
  await bump("paid");
  await bump(`paid:${c.type}`);
  await bump("revenue_cents", payment.amountCents);
  await bump("minutes", HUMAN_OFFERS[c.type].minutes);
  await Promise.all([notifyGarrett(c), confirmToCustomer(c)]).catch((e) => console.error("[human] notify failed", e));
}

export async function handleHumanCheckout(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.metadata?.kind !== "human" || !session.metadata.caseId) return false;
  if (session.payment_status !== "paid") return true;
  const email = session.customer_details?.email || session.customer_email || "";
  await markPaid(session.metadata.caseId, { email, amountCents: session.amount_total ?? 0 });
  return true;
}

const outcomeLink = (id: string, outcome: Outcome) =>
  `${site()}/api/human/outcome?t=${encodeURIComponent(signToken("human-outcome", { id, outcome }, 120 * 86_400))}`;

async function notifyGarrett(c: HumanCase) {
  const to = process.env.GARRETT_EMAIL;
  if (!to) {
    console.error(`[human] GARRETT_EMAIL not set; paid case ${c.id} needs attention`);
    return;
  }
  const offer = HUMAN_OFFERS[c.type];
  const transcript = c.transcript.map((m) => `${m.role === "user" ? "THEM" : "vGARRETT"}: ${m.content}`).join("\n\n");
  const text = [
    `${offer.name.toUpperCase()} · ${c.included ? "included with Teams" : `paid $${((c.amountCents ?? 0) / 100).toFixed(0)}`} · ${offer.turnaround}`,
    `Customer: ${c.email}${c.who ? ` (${c.who})` : ""} · trigger: ${c.trigger} · ${c.channel}`,
    `Why vGarrett offered it: ${c.reason || "(not given)"}`,
    "",
    "Reply to this email to answer the customer directly (reply-to is set to them).",
    "",
    "———— HANDOFF BRIEF ————",
    c.handoff,
    "",
    "———— When you've replied, tag vGarrett's answer ————",
    `Agreed: ${outcomeLink(c.id, "agreed")}`,
    `Amended: ${outcomeLink(c.id, "amended")}`,
    `Overruled: ${outcomeLink(c.id, "overruled")}`,
    "",
    "———— TRANSCRIPT ————",
    transcript,
  ].join("\n");
  await sendEmail({
    to,
    subject: `${offer.name}: ${c.email}`,
    text,
    html: `<pre style="font:13px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`,
    replyTo: c.email,
  });
}

async function confirmToCustomer(c: HumanCase) {
  if (!c.email) return;
  const offer = HUMAN_OFFERS[c.type];
  const lines = [
    `Your ${offer.name} is with Garrett.`,
    "",
    `He has the case summary and our conversation, so you don't need to explain anything again. Expect his ${offer.turnaround}, from his own address.`,
  ];
  if (c.type === "strategy_call" && process.env.STRATEGY_BOOKING_URL) lines.push("", `Pick a time for the call here: ${process.env.STRATEGY_BOOKING_URL}`);
  if (c.type === "suspension_review") lines.push("", "Until you hear from him: don't edit the profile and don't file another appeal.");
  lines.push("", "— vGarrett (Garrett's AI)");
  const text = lines.join("\n");
  await sendEmail({ to: c.email, subject: `${offer.name}: Garrett has your case`, text, html: renderChatHtml(text), replyTo: process.env.GARRETT_EMAIL });
}

export async function recordOutcome(id: string, outcome: Outcome, note?: string): Promise<HumanCase | null> {
  const c = await getCase(id);
  if (!c) return null;
  const first = !c.outcome;
  c.outcome = outcome;
  if (note !== undefined) c.outcomeNote = note.slice(0, 2000);
  await saveCase(c);
  if (first) await bump(`outcome:${outcome}`);
  if (note) await getStore().lpush("human:lessons", JSON.stringify({ at: new Date().toISOString(), id, type: c.type, outcome, note: c.outcomeNote, reason: c.reason }), 500);
  return c;
}

/** Count answers so the escalation rate has a denominator. */
export const countAnswer = () => bump("answers");

/** The four numbers that test the 90/10 idea, for one week. */
export async function weeklyNumbers(week = isoWeek(new Date(Date.now() - 7 * 86_400_000))) {
  const get = async (n: string) => (await getStore().get<number>(statKey(n, week))) ?? 0;
  const [answers, offers, paid, revenue, minutes, agreed, amended, overruled] = await Promise.all(
    ["answers", "offers", "paid", "revenue_cents", "minutes", "outcome:agreed", "outcome:amended", "outcome:overruled"].map(get),
  );
  const tagged = agreed + amended + overruled;
  return {
    week,
    answers,
    offers,
    paid,
    escalationRate: answers ? offers / answers : 0,
    conversion: offers ? paid / offers : 0,
    revenue: revenue / 100,
    dollarsPerHour: minutes ? revenue / 100 / (minutes / 60) : 0,
    correctionsPer100: tagged ? ((amended + overruled) / tagged) * 100 : 0,
    agreed,
    amended,
    overruled,
  };
}

export async function sendWeeklyNumbers(): Promise<string> {
  const n = await weeklyNumbers();
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  const lessons = (await getStore().lrange<string | Record<string, string>>("human:lessons", 10))
    .map((l) => (typeof l === "string" ? JSON.parse(l) : l))
    .filter((l) => l.at >= new Date(Date.now() - 8 * 86_400_000).toISOString())
    .map((l) => `- ${l.outcome} (${l.type}): ${l.note}`);
  const text = [
    `vGarrett, week ${n.week}`,
    "",
    `Escalation rate: ${pct(n.escalationRate)} (${n.offers} offers / ${n.answers} answers)`,
    `Paid conversion: ${pct(n.conversion)} (${n.paid} paid)`,
    `Revenue: $${n.revenue.toFixed(0)} · about $${n.dollarsPerHour.toFixed(0)} per hour of your time`,
    `Corrections: ${n.correctionsPer100.toFixed(0)} per 100 reviewed answers (agreed ${n.agreed}, amended ${n.amended}, overruled ${n.overruled})`,
    ...(lessons.length ? ["", "Your notes this week (fold these into Local SEO Skills):", ...lessons] : []),
  ].join("\n");
  if (process.env.GARRETT_EMAIL) await sendEmail({ to: process.env.GARRETT_EMAIL, subject: `vGarrett numbers: ${n.week}`, text, html: renderChatHtml(text) });
  return text;
}

