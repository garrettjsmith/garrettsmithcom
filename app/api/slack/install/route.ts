import { verifyInvite } from "@/lib/invite.ts";
import { SLACK_SCOPES } from "@/lib/slack.ts";

export const runtime = "nodejs";

// Entry point of an invite link. Valid invite -> Slack's "Add to workspace" screen.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("invite");
  if (!verifyInvite(token)) return Response.redirect(new URL("/?invite=invalid", url), 302);
  const site = process.env.SITE_URL || url.origin;
  const authorize = new URL("https://slack.com/oauth/v2/authorize");
  authorize.searchParams.set("client_id", process.env.SLACK_CLIENT_ID ?? "");
  authorize.searchParams.set("scope", SLACK_SCOPES.join(","));
  authorize.searchParams.set("redirect_uri", `${site}/api/slack/oauth`);
  authorize.searchParams.set("state", token!);
  return Response.redirect(authorize, 302);
}
