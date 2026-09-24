import Anthropic from "@anthropic-ai/sdk";
import type {
  BetaContentBlock,
  BetaContentBlockParam,
  BetaMessageParam,
  BetaTextBlockParam,
  BetaToolResultBlockParam,
  BetaToolUnion,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { CHANNEL_RULES, PERSONA, type Channel } from "./persona.ts";
import { PLAYBOOK_INDEX, PLAYBOOK_NAMES, getPlaybook } from "./playbooks.ts";
import { addTeamNote, getTeamNotes } from "./memory.ts";

// One brain, every channel. The web chat, Slack, and anything added later
// (SMS, email) call think() with a transcript and get Garrett's reply back.

const MODEL = process.env.GARRETT_MODEL || "claude-sonnet-5";
const EFFORT = (process.env.GARRETT_EFFORT || "medium") as "low" | "medium" | "high";
const MCP_NAME = "local-seo-data";
const MAX_ROUNDS = 6;

// Local SEO Data tools Garrett may call. Everything else on the server stays
// off, which keeps expensive calls (local_audit, geogrid_scan, bulk keyword
// research) out of reach of anonymous visitors.
const LIVE_TOOLS: Record<string, string> = {
  location_search: "location",
  business_profile: "profile",
  profile_health: "profile health",
  local_pack: "map pack",
  maps: "maps",
  local_finder: "local finder",
  organic_serp: "search results",
  google_reviews: "reviews",
  review_velocity: "review velocity",
  multi_platform_reviews: "reviews across sites",
  qa: "Q&A",
  competitor_gap: "competitors",
  local_authority: "local authority",
  citation_audit: "citations",
  keyword_opportunities: "keywords",
  page_audit: "page audit",
  local_services_ads: "LSAs",
  ai_overview: "AI Overview",
  ai_mode: "AI Mode",
  ai_visibility: "AI visibility",
};

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
}

export interface ThinkResult {
  text: string;
  /** Labels of live data sources checked. */
  checked: string[];
  playbooks: string[];
  /** True when live data was requested but unavailable. */
  offline: boolean;
}

function liveAvailable(): boolean {
  return Boolean(process.env.LOCALSEODATA_MCP_TOKEN);
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
  if ((channel === "slack" || channel === "email") && teamId) {
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
  if (live) {
    tools.push({
      type: "mcp_toolset",
      mcp_server_name: MCP_NAME,
      default_config: { enabled: false },
      configs: Object.fromEntries(Object.keys(LIVE_TOOLS).map((t) => [t, { enabled: true }])),
    });
  }
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
  try {
    return await run(input, live, wantLive && !live);
  } catch (err) {
    // If the data server is what failed, answer without it rather than not at all.
    if (live && err instanceof Anthropic.APIError && err.status !== undefined && err.status < 500 && err.status !== 429) {
      console.error("[brain] live data failed, retrying without it:", err.message);
      return run(input, false, true);
    }
    throw err;
  }
}

async function run(input: ThinkInput, live: boolean, offline: boolean): Promise<ThinkResult> {
  const { channel, teamId, onEvent, signal } = input;
  const messages: BetaMessageParam[] = [...input.messages];
  const system = await buildSystem(channel, teamId);
  const tools = buildTools(channel, teamId, live);
  const checked = new Set<string>();
  const playbooks = new Set<string>();
  const parts: string[] = [];
  let emitted = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const stream = client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: EFFORT },
        system,
        tools,
        messages,
        cache_control: { type: "ephemeral" },
        ...(live
          ? {
              betas: ["mcp-client-2025-11-20"],
              mcp_servers: [
                {
                  type: "url" as const,
                  name: MCP_NAME,
                  url: process.env.LOCALSEODATA_MCP_URL || "https://mcp.localseodata.com/mcp",
                  authorization_token: process.env.LOCALSEODATA_MCP_TOKEN,
                },
              ],
            }
          : {}),
      },
      { signal },
    );

    for await (const event of stream) {
      if (event.type === "content_block_start") {
        const block = event.content_block;
        if (block.type === "text") {
          // Separate text that resumes after a tool call from what came before.
          if (emitted) onEvent?.({ type: "text", delta: "\n\n" });
        } else if (block.type === "mcp_tool_use") {
          const label = LIVE_TOOLS[block.name] ?? block.name.replace(/_/g, " ");
          checked.add(label);
          onEvent?.({ type: "status", label, kind: "live" });
        }
      } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        emitted = true;
        onEvent?.({ type: "text", delta: event.delta.text });
      }
    }

    const msg = await stream.finalMessage();
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

    const results: BetaToolResultBlockParam[] = [];
    for (const block of msg.content) {
      if (block.type !== "tool_use") continue;
      if (block.name === "open_playbook") {
        const name = String((block.input as { name?: unknown })?.name ?? "");
        playbooks.add(name);
        onEvent?.({ type: "status", label: name.replace(/-/g, " "), kind: "playbook" });
      }
      const r = await runClientTool(block.name, block.input, teamId);
      results.push({ type: "tool_result", tool_use_id: block.id, content: r.content, is_error: r.isError });
    }
    messages.push({ role: "assistant", content: msg.content as BetaContentBlockParam[] });
    messages.push({ role: "user", content: results });
  }

  return { text: parts.join("\n\n").trim(), checked: [...checked], playbooks: [...playbooks], offline };
}

function textOf(content: BetaContentBlock[]): string {
  return content
    .filter((b): b is Extract<BetaContentBlock, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")
    .trim();
}
