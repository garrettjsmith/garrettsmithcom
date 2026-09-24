import { getStore } from "./store.ts";

// Paying (or approved early-access) members, keyed by email address. Email is
// the member channel today; Stripe will write here once billing exists.

export type Member = { email: string; plan: "solo" | "teams"; since: string; note?: string };

const key = (email: string) => `member:${email.trim().toLowerCase()}`;

export async function getMember(email: string): Promise<Member | null> {
  return getStore().get<Member>(key(email));
}

export async function addMember(email: string, plan: Member["plan"] = "solo", note?: string): Promise<Member> {
  const member: Member = { email: email.trim().toLowerCase(), plan, since: new Date().toISOString(), note };
  await getStore().set(key(email), member);
  return member;
}

export async function removeMember(email: string): Promise<void> {
  await getStore().set(key(email), null);
}
