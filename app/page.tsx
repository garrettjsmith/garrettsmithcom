import { Chat } from "@/components/Chat.tsx";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  let banner: { text: string; bad?: boolean } | undefined;
  const welcome = one(q.welcome);
  if (welcome) banner = { text: `You're in. Ask away. Check your email for how to reach Garrett by email${welcome === "teams" ? " and add him to Slack" : ""}.` };
  else if (one(q.signedin)) banner = { text: "Signed in. Ask away." };
  else if (one(q.signin) === "expired") banner = { text: "That sign-in link expired or isn't for a current plan. Use Sign in to get a new one.", bad: true };
  else if (one(q.checkout) === "pending") banner = { text: "Payment went through? It can take a minute to confirm. Refresh shortly, or email ask@garrettsmith.com.", bad: true };
  else if (one(q.installed)) banner = { text: `I'm in ${one(q.installed)}. Mention @Garrett in any channel or DM me.` };
  else if (one(q.invite) === "invalid") banner = { text: "That invite link is invalid or expired. Request access and I'll send a fresh one.", bad: true };
  else if (one(q.install) === "failed") banner = { text: "Slack install didn't go through. Try the link again.", bad: true };
  return <Chat banner={banner} />;
}
