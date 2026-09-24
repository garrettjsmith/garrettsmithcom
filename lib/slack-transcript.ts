import type { ChatTurn } from "./garrett/transcript.ts";

export type SlackMessage = { user?: string; bot_id?: string; text?: string; subtype?: string; ts?: string };

const MAX_TURNS = 30;

/**
 * Turn a Slack thread into an alternating user/assistant transcript. Garrett's
 * own messages become assistant turns; everyone else's become user turns
 * prefixed with their ID so the model can tell teammates apart.
 */
export function slackToTranscript(messages: SlackMessage[], botUserId: string, botId?: string): ChatTurn[] {
  const turns: ChatTurn[] = [];
  const mention = new RegExp(`<@${botUserId}>`, "g");
  for (const m of messages) {
    if (m.subtype && m.subtype !== "thread_broadcast" && m.subtype !== "bot_message") continue;
    const mine = m.user === botUserId || (botId !== undefined && m.bot_id === botId);
    if (!mine && m.bot_id) continue; // other bots
    const text = (m.text ?? "").replace(mention, "Garrett").trim();
    if (!text) continue;
    const role = mine ? "assistant" : "user";
    const content = mine ? text : `<@${m.user}>: ${text}`;
    const last = turns.at(-1);
    if (last?.role === role) last.content += "\n\n" + content;
    else turns.push({ role, content });
  }
  let out = turns.slice(-MAX_TURNS);
  while (out[0]?.role === "assistant") out = out.slice(1);
  while (out.at(-1)?.role === "assistant") out = out.slice(0, -1);
  return out;
}
