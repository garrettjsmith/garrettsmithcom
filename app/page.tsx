import { Chat } from "@/components/Chat.tsx";
import { ASK_EMAIL } from "@/content/site.ts";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  let banner: { text: string; bad?: boolean } | undefined;
  const welcome = one(q.welcome);
  const human = one(q.human);
  if (welcome) banner = { text: `You're in. Ask away. Check your email for how to reach vGarrett by email${welcome === "teams" ? " and add it to Slack" : ""}.` };
  else if (human === "sent") banner = { text: "Sent. The real Garrett has your case and will reply by email. Check your inbox for the confirmation." };
  else if (human === "canceled") banner = { text: "No charge. Your conversation is still here." };
  else if (human === "full") banner = { text: "Garrett's review slots are full this week. They open again Monday.", bad: true };
  else if (human === "expired") banner = { text: "That review link expired. Ask vGarrett again and it can open a fresh one.", bad: true };
  else if (human === "unavailable") banner = { text: `Reviews can't be booked online right now. Email ${ASK_EMAIL} and we'll sort it out.`, bad: true };
  else if (one(q.signedin)) banner = { text: "Signed in. Ask away." };
  else if (one(q.signin) === "expired") banner = { text: "That sign-in link expired or isn't for a current plan. Use Sign in to get a new one.", bad: true };
  else if (one(q.checkout) === "pending") banner = { text: `Payment went through? It can take a minute to confirm. Refresh shortly, or email ${ASK_EMAIL}.`, bad: true };
  else if (one(q.installed)) banner = { text: `vGarrett is in ${one(q.installed)}. Mention @vGarrett in any channel or DM it.` };
  else if (one(q.invite) === "invalid") banner = { text: "That invite link is invalid or expired. Request access and I'll send a fresh one.", bad: true };
  else if (one(q.install) === "failed") banner = { text: "Slack install didn't go through. Try the link again.", bad: true };
  return <Chat banner={banner} />;
}
