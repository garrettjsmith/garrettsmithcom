import { createHmac, timingSafeEqual } from "node:crypto";
import { getStore } from "./store.ts";

export const SLACK_SCOPES = ["app_mentions:read", "chat:write", "channels:history", "groups:history", "im:history"];

export type Install = {
  teamId: string;
  teamName: string;
  botToken: string;
  botUserId: string;
  installedBy: string;
  at: string;
};

/** Slack request signing: https://api.slack.com/authentication/verifying-requests-from-slack */
export function verifySlackSignature(rawBody: string, timestamp: string | null, signature: string | null): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret || !timestamp || !signature) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 60 * 5) return false;
  const want = Buffer.from("v0=" + createHmac("sha256", secret).update(`v0:${timestamp}:${rawBody}`).digest("hex"));
  const got = Buffer.from(signature);
  return want.length === got.length && timingSafeEqual(want, got);
}

export async function slackApi<T = Record<string, unknown>>(
  token: string | null,
  method: string,
  params: Record<string, string | number | undefined>,
): Promise<T & { ok: boolean; error?: string }> {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) form.set(k, String(v));
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  const data = (await res.json()) as T & { ok: boolean; error?: string };
  if (!data.ok) console.error(`[slack] ${method} failed: ${data.error}`);
  return data;
}

const installKey = (teamId: string) => `slack:install:${teamId}`;

export async function saveInstall(install: Install): Promise<void> {
  await getStore().set(installKey(install.teamId), install);
}

export async function removeInstall(teamId: string): Promise<void> {
  await getStore().set(installKey(teamId), null);
}

/** The team's OAuth install, or SLACK_BOT_TOKEN for your own workspace during dev. */
export async function getInstall(teamId: string): Promise<Install | null> {
  const install = await getStore().get<Install>(installKey(teamId));
  if (install) return install;
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;
  const auth = await slackApi<{ team_id?: string; team?: string; user_id?: string }>(token, "auth.test", {});
  if (!auth.ok || auth.team_id !== teamId) return null;
  return { teamId, teamName: auth.team ?? "", botToken: token, botUserId: auth.user_id ?? "", installedBy: "env", at: "" };
}
