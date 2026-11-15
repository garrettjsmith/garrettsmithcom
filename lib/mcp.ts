import { ask as realAsk, briefFor as realBriefFor, briefMarkdown, MAX_QUESTION_CHARS } from "./agent.ts";
import type { Member } from "./members.ts";

// vGarrett as an MCP server (Streamable HTTP, stateless). Every request
// carries the member's API key, so there are no sessions to keep: each
// JSON-RPC message is answered on its own. The route in app/api/mcp does the
// HTTP part; this file is the protocol.

export const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

export type RpcMessage = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
export type RpcReply = { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string } };

export const isRequest = (m: RpcMessage) => typeof m?.method === "string" && m.id !== undefined && m.id !== null;

const INSTRUCTIONS =
  "vGarrett is Garrett Smith's AI twin for local search: Google Business Profile, map pack rankings, reviews, citations, local landing pages, Local Services Ads, and showing up in AI answers for local queries. " +
  "It answers with Garrett's playbooks and judgment and can pull live rankings, profiles, and reviews itself, so ask it the real question (with the business name and city) instead of gathering data for it first. " +
  "It keeps a brief per business for this account; call get_brief to see what it already knows. Each ask_vgarrett call counts toward the account's monthly questions, so ask complete questions and reuse thread_id for follow-ups.";

export const TOOLS = [
  {
    name: "ask_vgarrett",
    title: "Ask vGarrett",
    description:
      "Ask vGarrett, Garrett Smith's AI local search advisor, a question about a local business's visibility: Google Business Profile, map pack and local rankings, reviews, citations, location pages, Local Services Ads, competitors, or AI search for local. " +
      "It pulls live data when the question needs it (name the business and its city), applies Garrett's playbooks, and returns a diagnosis with prioritized next steps. It remembers the account's businesses between calls. " +
      "Can take up to a minute or two when it runs live checks. Pass the thread_id from a previous answer to ask a follow-up in the same conversation.",
    inputSchema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          maxLength: MAX_QUESTION_CHARS,
          description: "The question, in plain language, with the business name and city when it's about a specific business. Include any context vGarrett should weigh.",
        },
        thread_id: {
          type: "string",
          description: "Optional. The thread_id returned by an earlier answer, to continue that conversation. Omit to start a new one.",
        },
      },
      required: ["question"],
    },
    annotations: { title: "Ask vGarrett", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  {
    name: "get_brief",
    title: "Get the brief",
    description:
      "Read what vGarrett has on file for this account: each business's details, current findings (critical, important, monitor), the next action, reminders, and a recent log. Free: doesn't count as a question. Use it before asking, to avoid repeating what's already known.",
    inputSchema: { type: "object", properties: {} },
    annotations: { title: "Get the brief", readOnlyHint: true, openWorldHint: false },
  },
];

export type McpDeps = {
  ask: typeof realAsk;
  briefFor: typeof realBriefFor;
};

export type McpOptions = {
  /** Status updates while a tool runs ("Checking map pack"). */
  onProgress?: (message: string) => void;
  signal?: AbortSignal;
  deps?: McpDeps;
};

const text = (t: string, extra: Record<string, unknown> = {}) => ({ content: [{ type: "text", text: t }], ...extra });

/** Answers one JSON-RPC message. Returns null for notifications, which get no reply. */
export async function handleMcp(msg: RpcMessage, member: Member, opts: McpOptions = {}): Promise<RpcReply | null> {
  if (!isRequest(msg)) return null;
  const id = msg.id as string | number;
  const ok = (result: unknown): RpcReply => ({ jsonrpc: "2.0", id, result });
  const fail = (code: number, message: string): RpcReply => ({ jsonrpc: "2.0", id, error: { code, message } });
  const deps = opts.deps ?? { ask: realAsk, briefFor: realBriefFor };

  switch (msg.method) {
    case "initialize": {
      const wanted = String(msg.params?.protocolVersion ?? "");
      return ok({
        protocolVersion: PROTOCOL_VERSIONS.includes(wanted) ? wanted : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "vgarrett", title: "vGarrett", version: "1.0.0" },
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call": {
      const name = msg.params?.name;
      const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
      if (name === "get_brief") {
        const brief = await deps.briefFor(member);
        return ok(text(briefMarkdown(brief), brief ? { structuredContent: brief } : {}));
      }
      if (name === "ask_vgarrett") {
        const r = await deps.ask(member, { question: args.question, thread_id: args.thread_id }, {
          signal: opts.signal,
          onEvent: (e) => {
            if (e.type === "status") opts.onProgress?.(e.kind === "live" ? `Checking ${e.label}` : `Opening the ${e.label} playbook`);
          },
        });
        if (!r.ok) return ok(text(r.error, { isError: true }));
        const notes = [
          r.checked.length ? `Checked live: ${r.checked.join(", ")}` : r.offline ? "Live data was unavailable; this answer is from experience only." : "",
          `thread_id: ${r.thread_id} (pass it back to ask a follow-up)`,
        ].filter(Boolean);
        const { ok: _ok, ...structured } = r;
        return ok(text(`${r.answer}\n\n---\n${notes.join("\n")}`, { structuredContent: structured }));
      }
      return fail(-32602, `Unknown tool: ${String(name)}`);
    }
    default:
      return fail(-32601, `Method not found: ${msg.method}`);
  }
}
