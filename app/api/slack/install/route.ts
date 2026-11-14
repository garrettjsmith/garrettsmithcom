import { createInvite, verifyInvite } from "@/lib/invite.ts";
import { currentMember } from "@/lib/session.ts";
import { SLACK_SCOPES } from "@/lib/slack.ts";

export const runtime = "nodejs";

// Entry point of an invite link, and of the site's "Add to Slack" button.
// A valid invite, or a signed-in Teams member, goes to Slack's "Add to workspace" screen.
export async function GET(req: Request) {
  const url = new URL(req.url);
  let token = url.searchParams.get("invite");
  // Behind the host's proxy req.url is an internal address, so redirects use SITE_URL.
  const site = (process.env.SITE_URL || url.origin).replace(/\/$/, "");
  if (!verifyInvite(token)) {
    // No usable invite: a signed-in Teams member gets a fresh one, good for the install they're starting.
    const member = await currentMember();
    if (member?.plan !== "teams") return Response.redirect(`${site}/?invite=invalid`, 302);
    token = createInvite(member.email, 1);
  }
  const authorize = new URL("https://slack.com/oauth/v2/authorize");
  authorize.searchParams.set("client_id", process.env.SLACK_CLIENT_ID ?? "");
  authorize.searchParams.set("scope", SLACK_SCOPES.join(","));
  authorize.searchParams.set("redirect_uri", `${site}/api/slack/oauth`);
  authorize.searchParams.set("state", token!);
  return Response.redirect(authorize, 302);
}
