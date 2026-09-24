import { getStore } from "./store.ts";

// Members, keyed by email address. Stripe writes here when someone pays; the
// `member` script covers comps and manual approvals.

export type Plan = "solo" | "teams";

export type Member = {
  email: string;
  plan: Plan;
  since: string;
  /** Absent for manual members, who are always active. */
  status?: "active" | "past_due" | "canceled";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  note?: string;
};

const key = (email: string) => `member:${email.trim().toLowerCase()}`;
const customerKey = (id: string) => `stripe:customer:${id}`;

export async function getMember(email: string): Promise<Member | null> {
  return getStore().get<Member>(key(email));
}

/** A member who should get answers right now. Past-due keeps access through Stripe's retry window. */
export async function getActiveMember(email: string): Promise<Member | null> {
  const m = await getMember(email);
  return m && m.status !== "canceled" ? m : null;
}

export async function upsertMember(email: string, patch: Partial<Omit<Member, "email">>): Promise<Member> {
  const existing = await getMember(email);
  const member: Member = {
    plan: "solo",
    since: new Date().toISOString(),
    ...existing,
    ...patch,
    email: email.trim().toLowerCase(),
  };
  await getStore().set(key(email), member);
  if (member.stripeCustomerId) await getStore().set(customerKey(member.stripeCustomerId), member.email);
  return member;
}

export async function addMember(email: string, plan: Plan = "solo", note?: string): Promise<Member> {
  return upsertMember(email, { plan, status: "active", note });
}

export async function removeMember(email: string): Promise<void> {
  await getStore().set(key(email), null);
}

export async function emailForCustomer(customerId: string): Promise<string | null> {
  return getStore().get<string>(customerKey(customerId));
}
