// The human tier: what people can buy from the real Garrett between the AI and
// a retainer. vGarrett offers these inside a conversation when a situation
// needs a person (see the escalation rules in lib/garrett/persona.ts), and the
// pricing section lists them. Prices are in cents for Stripe.

export type HumanOfferId = "second_opinion" | "suspension_review" | "strategy_call";

export type HumanOffer = {
  id: HumanOfferId;
  name: string;
  cents: number;
  price: string;
  turnaround: string;
  /** Business days to reply (for the customer's confirmation email). */
  replyDays: number;
  card: string;
  /** Rough minutes of Garrett's time, for the weekly $/hour number. */
  minutes: number;
};

export const HUMAN_OFFERS: Record<HumanOfferId, HumanOffer> = {
  second_opinion: {
    id: "second_opinion",
    name: "Second Opinion",
    cents: 15_000,
    price: "$150",
    turnaround: "reply within 2 business days",
    replyDays: 2,
    card: "Garrett reviews this conversation, the data, and vGarrett's plan, then sends you a written reply (with a short video when it helps) on what he'd change.",
    minutes: 15,
  },
  suspension_review: {
    id: "suspension_review",
    name: "Suspension Review",
    cents: 75_000,
    price: "$750",
    turnaround: "reply within 1 business day",
    replyDays: 1,
    card: "Garrett reviews your case and tells you exactly what to submit to Google, and what not to, before you file. You file it; he never needs access to your profile.",
    minutes: 90,
  },
  strategy_call: {
    id: "strategy_call",
    name: "Strategy Call",
    cents: 75_000,
    price: "$750",
    turnaround: "45 minutes live, booked within a week",
    replyDays: 1,
    card: "45 minutes live with Garrett. vGarrett preps him with your data and this conversation first, so no time goes to background.",
    minutes: 75,
  },
};

/** Human slots across all three offers, per week. Override with HUMAN_SLOTS_PER_WEEK. */
export const SLOTS_PER_WEEK = 5;
