import { Chat } from "@/components/Chat.tsx";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  let banner: { text: string; bad?: boolean } | undefined;
  if (one(q.installed)) banner = { text: `I'm in ${one(q.installed)}. Mention @Garrett in any channel or DM me.` };
  else if (one(q.invite) === "invalid") banner = { text: "That invite link is invalid or expired. Request access and I'll send a fresh one.", bad: true };
  else if (one(q.install) === "failed") banner = { text: "Slack install didn't go through. Try the link again.", bad: true };
  return <Chat banner={banner} />;
}
