import Anthropic from "@anthropic-ai/sdk";
import type {
  BetaContentBlock,
  BetaContentBlockParam,
  BetaMessage,
  BetaMessageParam,
  BetaTextBlockParam,
  BetaToolResultBlockParam,
  BetaToolUnion,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { CHANNEL_RULES, PERSONA, type Channel } from "./persona.ts";
import { PLAYBOOK_INDEX, PLAYBOOK_NAMES, getPlaybook } from "./playbooks.ts";
import { addTeamNote, getTeamNotes } from "./memory.ts";
import { DECLINE_FOLLOWUPS, declineReply, logBlocked, screen, type Verdict } from "./guard.ts";
import { callLsd, lsdAvailable } from "../lsd/client.ts";
import { LSD_BY_NAME, lsdToolDefinitions } from "../lsd/tools.ts";

// One brain, every channel. The web chat, Slack, and anything added later
// (SMS, email) call think() with a transcript and get Garrett's reply back.

const MODEL = process.env.GARRETT_MODEL || "claude-sonnet-5";
const EFFORT = (process.env.GARRETT_EFFORT || "medium") as "low" | "medium" | "high";
const MAX_ROUNDS = 6;
// Live data calls allowed per answer (the prompt asks for at most 3).
const MAX_LIVE_CALLS = 4;

const client = new Anthropic();

export type ThinkEvent =
  | { type: "text"; delta: string }
  | { type: "status"; label: string; kind: "live" | "playbook" };

export interface ThinkInput {
  channel: Channel;
  messages: BetaMessageParam[];
  /** Memory key (a Slack team ID, or "email:<address>"): enables saved notes. */
  teamId?: string;
  /** Allow live Local SEO Data calls this turn. */
  live?: boolean;
  onEvent?: (e: ThinkEvent) => void;
  signal?: AbortSignal;
  /** Screen the newest message for scope before answering (default true). */
  guard?: boolean;
}

export interface ThinkResult {
  text: string;
  /** Labels of live data sources checked. */
  checked: string[];
  playbooks: string[];
  /** True when live data was requested but unavailable. */
  offline: boolean;
  /** Set when the screen turned the message away instead of answering it. */
  blocked?: Exclude<Verdict, "on">;
}

function liveAvailable(): boolean {
  return lsdAvailable();
}

function buildTools(channel: Channel, teamId: string | undefined, live: boolean): BetaToolUnion[] {
  // Order is fixed so the tool list (the front of the cached prefix) never changes.
  const tools: BetaToolUnion[] = [
    {
      name: "open_playbook",
      description:
        "Load one of Garrett's Local SEO playbooks by name. Returns the full method for that area. Use before giving specific advice in that area.",
      input_schema: {
        type: "object",
        properties: { name: { type: "string", enum: PLAYBOOK_NAMES } },
        required: ["name"],
        additionalProperties: false,
      },
      strict: true,
    },
  ];
  if (teamId) {
    tools.push({
      name: "save_team_note",
      description:
        "Remember a durable fact about this customer's business for future conversations: business names, locations, cities, competitors, goals, owners, preferences. One short sentence per note.",
      input_schema: {
        type: "object",
        properties: { note: { type: "string", description: "One short sentence." } },
        required: ["note"],
        additionalProperties: false,
      },
      strict: true,
    });
  }
  if (live) tools.push(...(lsdToolDefinitions() as BetaToolUnion[]));
  return tools;
}

async function buildSystem(channel: Channel, teamId?: string): Promise<BetaTextBlockParam[]> {
  const system: BetaTextBlockParam[] = [
    { type: "text", text: PERSONA + "\n\n" + PLAYBOOK_INDEX },
    { type: "text", text: CHANNEL_RULES[channel], cache_control: { type: "ephemeral" } },
  ];
  if (teamId) {
    const notes = await getTeamNotes(teamId);
    system.push({
      type: "text",
      text: notes.length
        ? "What you know about this customer (from your saved notes, oldest first):\n" + notes.map((n) => `- ${n}`).join("\n")
        : "You haven't saved any notes about this customer yet. Learn their business as you go.",
    });
  }
  return system;
}

async function runClientTool(
  name: string,
  input: unknown,
  teamId: string | undefined,
): Promise<{ content: string; isError?: boolean }> {
  const args = (input ?? {}) as Record<string, unknown>;
  if (name === "open_playbook" && typeof args.name === "string") {
    const body = getPlaybook(args.name);
    return body ? { content: body } : { content: `No playbook named ${args.name}.`, isError: true };
  }
  if (name === "save_team_note" && teamId && typeof args.note === "string" && args.note.trim()) {
    await addTeamNote(teamId, args.note);
    return { content: "Saved." };
  }
  return { content: `Tool ${name} is not available here.`, isError: true };
}

export async function think(input: ThinkInput): Promise<ThinkResult> {
  const wantLive = input.live !== false;
  const live = wantLive && liveAvailable();
  // A failed data call comes back to the model as a tool error, so it can
  // still answer from experience; nothing here needs a retry path.
  return run(input, live, wantLive && !live);
}

async function run(input: ThinkInput, live: boolean, offline: boolean): Promise<ThinkResult> {
  const { channel, teamId, signal } = input;

  // The scope screen runs alongside the first model call. Until it clears the
  // message, the answer's text is held back; if it doesn't, the model call is
  // cancelled and the person gets a short decline instead.
  const screenCtrl = new AbortController();
  const modelSignal = signal ? AbortSignal.any([signal, screenCtrl.signal]) : screenCtrl.signal;
  let verdict: Verdict | null = input.guard === false ? "on" : null;
  const held: ThinkEvent[] = [];
  const onEvent = (e: ThinkEvent) => {
    if (verdict === "on" || e.type === "status") input.onEvent?.(e);
    else if (verdict === null) held.push(e);
  };
  const screened: Promise<Verdict> =
    verdict === "on"
      ? Promise.resolve("on")
      : screen(input.messages, signal).then((v) => {
          verdict = v;
          if (v === "on") for (const e of held.splice(0)) input.onEvent?.(e);
          else screenCtrl.abort();
          return v;
        });
  const declined = async (): Promise<ThinkResult | null> => {
    const v = await screened;
    if (v === "on") return null;
    await logBlocked(v, channel, input.messages);
    const text = declineReply() + (channel === "web" ? `\n[[FOLLOWUPS]] ${DECLINE_FOLLOWUPS.join(" | ")}` : "");
    return { text, checked: [], playbooks: [], offline: false, blocked: v };
  };
  const messages: BetaMessageParam[] = [...input.messages];
  const system = await buildSystem(channel, teamId);
  const tools = buildTools(channel, teamId, live);
  const checked = new Set<string>();
  const playbooks = new Set<string>();
  const parts: string[] = [];
  let emitted = false;
  let liveCalls = 0;
  const scope = teamId ?? "anon";
  let emittedThisRound = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    let msg: BetaMessage;
    try {
      msg = await streamRound();
    } catch (err) {
      if (screenCtrl.signal.aborted && !signal?.aborted) break;
      // An overloaded or dropped model call gets one quiet retry, as long as
      // no words from it have reached the reader yet.
      if (signal?.aborted || emittedThisRound || !retryable(err)) throw err;
      console.error("[think] retrying model call:", (err as Error).message);
      msg = await streamRound();
    }
    const text = textOf(msg.content);
    if (text) parts.push(text);

    if (msg.stop_reason === "refusal") {
      if (!parts.length) parts.push("That's not something I can help with. Ask me about local search.");
      break;
    }
    if (msg.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: msg.content as BetaContentBlockParam[] });
      continue;
    }
    if (msg.stop_reason !== "tool_use") break;
    // No lookups (or credits) for a message the screen turns away.
    if ((await screened) !== "on") break;

    // Run this turn's tool calls in parallel; they're independent lookups.
    const calls = msg.content.filter((b): b is Extract<BetaContentBlock, { type: "tool_use" }> => b.type === "tool_use");
    const results: BetaToolResultBlockParam[] = await Promise.all(
      calls.map((block) =>
        runTool(block).catch((err): BetaToolResultBlockParam => {
          // One broken lookup must never cost the whole answer.
          console.error(`[think] tool ${block.name} failed:`, err);
          return { type: "tool_result", tool_use_id: block.id, content: "That check failed. Answer without it.", is_error: true };
        }),
      ),
    );
    messages.push({ role: "assistant", content: msg.content as BetaContentBlockParam[] });
    messages.push({ role: "user", content: results });
  }

  const decline = await declined();
  if (decline) return decline;
  return { text: parts.join("\n\n").trim(), checked: [...checked], playbooks: [...playbooks], offline };

  async function streamRound(): Promise<BetaMessage> {
    emittedThisRound = false;
    const stream = client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: EFFORT },
        system,
        tools,
        messages,
        cache_control: { type: "ephemeral" },
      },
      { signal: modelSignal },
    );

    for await (const event of stream) {
      if (event.type === "content_block_start") {
        const block = event.content_block;
        if (block.type === "text") {
          // Separate text that resumes after a tool call from what came before.
          if (emitted) onEvent?.({ type: "text", delta: "\n\n" });
        } else if (block.type === "tool_use" && LSD_BY_NAME.has(block.name)) {
          onEvent?.({ type: "status", label: LSD_BY_NAME.get(block.name)!.label, kind: "live" });
        }
      } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        emitted = true;
        emittedThisRound = true;
        onEvent?.({ type: "text", delta: event.delta.text });
      }
    }

    return stream.finalMessage();
  }

  async function runTool(block: Extract<BetaContentBlock, { type: "tool_use" }>): Promise<BetaToolResultBlockParam> {
    const def = LSD_BY_NAME.get(block.name);
    if (def) {
      if (++liveCalls > MAX_LIVE_CALLS) {
        return { type: "tool_result", tool_use_id: block.id, content: "Enough live checks for this answer. Answer with what you have.", is_error: true };
      }
      const r = await callLsd(block.name, block.input, scope);
      if (r.ok) checked.add(def.label);
      return { type: "tool_result", tool_use_id: block.id, content: r.content, is_error: !r.ok };
    }
    if (block.name === "open_playbook") {
      const name = String((block.input as { name?: unknown })?.name ?? "");
      playbooks.add(name);
      onEvent?.({ type: "status", label: name.replace(/-/g, " "), kind: "playbook" });
    }
    const r = await runClientTool(block.name, block.input, teamId);
    return { type: "tool_result", tool_use_id: block.id, content: r.content, is_error: r.isError };
  }
}

function retryable(err: unknown): boolean {
  if (err instanceof Anthropic.APIError) return err.status === undefined || err.status === 429 || err.status >= 500;
  return err instanceof Error && /overloaded|ECONNRESET|socket|network|terminated/i.test(err.message);
}

function textOf(content: BetaContentBlock[]): string {
  return content
    .filter((b): b is Extract<BetaContentBlock, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")
    .trim();
}
