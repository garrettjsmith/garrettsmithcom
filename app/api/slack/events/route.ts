import { after } from "next/server";
import { think } from "@/lib/garrett/brain.ts";
import { toSlackMrkdwn } from "@/lib/garrett/format.ts";
import { getStore } from "@/lib/store.ts";
import { getInstall, removeInstall, slackApi, verifySlackSignature } from "@/lib/slack.ts";
import { slackToTranscript, type SlackMessage } from "@/lib/slack-transcript.ts";

export const runtime = "nodejs";
export const maxDuration = 300;

type SlackEvent = SlackMessage & {
  type: string;
  channel: string;
  channel_type?: string;
  thread_ts?: string;
  ts: string;
};

// Slack Events API. Ack within 3 seconds, do the work in after().
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySlackSignature(raw, req.headers.get("x-slack-request-timestamp"), req.headers.get("x-slack-signature"))) {
    return new Response("bad signature", { status: 401 });
  }
  const body = JSON.parse(raw) as {
    type: string;
    challenge?: string;
    team_id?: string;
    event_id?: string;
    event?: SlackEvent;
  };

  if (body.type === "url_verification") return Response.json({ challenge: body.challenge });
  // We already acked the first delivery; Slack retries if we were slow. Ignore them.
  if (req.headers.get("x-slack-retry-num")) return new Response("ok");
  if (body.type !== "event_callback" || !body.event || !body.team_id) return new Response("ok");

  const { event, team_id: teamId } = body;

  if (event.type === "app_uninstalled" || event.type === "tokens_revoked") {
    await removeInstall(teamId);
    return new Response("ok");
  }

  const isMention = event.type === "app_mention";
  const isDm = event.type === "message" && event.channel_type === "im" && !event.subtype && !event.bot_id;
  if (!isMention && !isDm) return new Response("ok");
  if (body.event_id && !(await getStore().claim(`slack:event:${body.event_id}`, 3600))) return new Response("ok");

  after(() => reply(teamId, event).catch((e) => console.error("[slack] reply failed", e)));
  return new Response("ok");
}

async function reply(teamId: string, event: SlackEvent) {
  const install = await getInstall(teamId);
  if (!install) {
    console.warn(`[slack] no install for team ${teamId}`);
    return;
  }
  const token = install.botToken;
  // Channels: always answer in a thread. DMs: answer inline unless already threaded.
  const threadTs = event.thread_ts ?? (event.channel_type === "im" ? undefined : event.ts);

  const history = threadTs
    ? await slackApi<{ messages?: SlackMessage[] }>(token, "conversations.replies", { channel: event.channel, ts: threadTs, limit: 50 })
    : await slackApi<{ messages?: SlackMessage[] }>(token, "conversations.history", { channel: event.channel, limit: 12 });
  const messages = threadTs ? history.messages ?? [] : [...(history.messages ?? [])].reverse();
  const transcript = slackToTranscript(messages.length ? messages : [event], install.botUserId);
  if (!transcript.length) return;

  const placeholder = await slackApi<{ ts?: string }>(token, "chat.postMessage", {
    channel: event.channel,
    thread_ts: threadTs,
    text: "_On it…_",
  });
  const update = (text: string) =>
    placeholder.ts
      ? slackApi(token, "chat.update", { channel: event.channel, ts: placeholder.ts, text })
      : slackApi(token, "chat.postMessage", { channel: event.channel, thread_ts: threadTs, text });

  let lastStatus = 0;
  try {
    const result = await think({
      channel: "slack",
      teamId,
      messages: transcript,
      onEvent: (e) => {
        if (e.type !== "status" || !placeholder.ts || Date.now() - lastStatus < 1500) return;
        lastStatus = Date.now();
        void update(e.kind === "live" ? `_Checking ${e.label}…_` : `_Pulling up my ${e.label} playbook…_`);
      },
    });
    await update(toSlackMrkdwn(result.text || "I came back empty on that one. Try rephrasing?"));
  } catch (err) {
    console.error("[slack] think failed", err);
    await update("Something broke on my end. Try me again in a minute.");
  }
}
