import { verifyInvite } from "@/lib/invite.ts";
import { saveInstall, slackApi } from "@/lib/slack.ts";

export const runtime = "nodejs";

// Slack redirects here after "Allow". The invite rides along as `state`.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const invite = verifyInvite(url.searchParams.get("state"));
  const code = url.searchParams.get("code");
  // Behind the host's proxy req.url is an internal address, so redirects use SITE_URL.
  const site = (process.env.SITE_URL || url.origin).replace(/\/$/, "");
  if (!invite || !code) return Response.redirect(`${site}/?invite=invalid`, 302);

  const res = await slackApi<{
    access_token?: string;
    bot_user_id?: string;
    team?: { id: string; name: string };
  }>(null, "oauth.v2.access", {
    client_id: process.env.SLACK_CLIENT_ID,
    client_secret: process.env.SLACK_CLIENT_SECRET,
    code,
    redirect_uri: `${site}/api/slack/oauth`,
  });
  if (!res.ok || !res.access_token || !res.team || !res.bot_user_id) {
    return Response.redirect(`${site}/?install=failed`, 302);
  }

  await saveInstall({
    teamId: res.team.id,
    teamName: res.team.name,
    botToken: res.access_token,
    botUserId: res.bot_user_id,
    installedBy: invite.email,
    at: new Date().toISOString(),
  });
  return Response.redirect(`${site}/?installed=${encodeURIComponent(res.team.name)}`, 302);
}
