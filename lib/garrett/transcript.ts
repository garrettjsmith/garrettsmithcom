// Validation for transcripts that arrive from the browser. The web chat is
// stateless on the server: the page sends the conversation so far each turn.

export type ChatTurn = { role: "user" | "assistant"; content: string };

const MAX_TURNS = 24;
const MAX_USER_CHARS = 2000;
const MAX_ASSISTANT_CHARS = 6000;

export function parseTranscript(body: unknown): ChatTurn[] | string {
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0) return "messages is required";
  // Keep the most recent turns, starting on a user turn.
  let turns = messages.slice(-MAX_TURNS);
  if ((turns[0] as ChatTurn)?.role === "assistant") turns = turns.slice(1);
  const out: ChatTurn[] = [];
  for (const [i, m] of turns.entries()) {
    const role = (m as ChatTurn)?.role;
    const content = (m as ChatTurn)?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return "bad message shape";
    if (role !== (i % 2 === 0 ? "user" : "assistant")) return "turns must alternate, starting with user";
    const text = content.trim();
    if (!text) return "empty message";
    if (text.length > (role === "user" ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS)) return "message too long";
    out.push({ role, content: text });
  }
  if (out.at(-1)?.role !== "user") return "last message must be from the user";
  return out;
}
