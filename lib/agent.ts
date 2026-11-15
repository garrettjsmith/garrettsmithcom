import { randomUUID } from "node:crypto";
import { getBrief, type Business } from "./garrett/brief.ts";
import { think, type ThinkEvent } from "./garrett/brain.ts";
import type { ChatTurn } from "./garrett/transcript.ts";
import type { Member } from "./members.ts";
import { allowMemberMessage } from "./ratelimit.ts";
import { getStore } from "./store.ts";
import { ASK_EMAIL } from "../content/site.ts";

// The agent channel: a member's own AI agent or script asking vGarrett,
// through the REST API or the MCP server. Both call ask() here, so they share
// threads, the member's brief and notes, and the monthly fair-use cap.

export const MAX_QUESTION_CHARS = 6000;
const MAX_TURNS = 24;
const THREAD_TTL = 30 * 86_400;
const THREAD_ID = /^[A-Za-z0-9_-]{1,64}$/;

export type AskInput = { question?: unknown; thread_id?: unknown };

export type AskResult =
  | {
      ok: true;
      answer: string;
      /** Send this back to continue the same conversation. */
      thread_id: string;
      /** Live data sources checked for this answer. */
      checked: string[];
      playbooks: string[];
      /** True when live data was unavailable and the answer is from experience only. */
      offline: boolean;
    }
  | { ok: false; status: 400 | 429 | 500; error: string };

const memoryKey = (m: Member) => `email:${m.email}`;

export async function ask(member: Member, input: AskInput, opts: { onEvent?: (e: ThinkEvent) => void; signal?: AbortSignal } = {}): Promise<AskResult> {
  const question = typeof input.question === "string" ? input.question.trim() : "";
  if (!question) return { ok: false, status: 400, error: "question is required" };
  if (question.length > MAX_QUESTION_CHARS) return { ok: false, status: 400, error: `question is too long (max ${MAX_QUESTION_CHARS} characters)` };
  if (input.thread_id !== undefined && input.thread_id !== null && (typeof input.thread_id !== "string" || !THREAD_ID.test(input.thread_id))) {
    return { ok: false, status: 400, error: "thread_id must be 1-64 letters, numbers, dashes, or underscores" };
  }
  const threadId = (input.thread_id as string | undefined | null) || randomUUID();

  // The same monthly cap as web and email, shared across all of them.
  const quota = await allowMemberMessage(member.email);
  if (!quota.ok) {
    return { ok: false, status: 429, error: `This account has hit this month's fair-use limit. It resets on the 1st. Email ${ASK_EMAIL} if you need more.` };
  }

  const store = getStore();
  const convKey = `agent:conv:${member.email}:${threadId}`;
  const history = (await store.get<ChatTurn[]>(convKey)) ?? [];
  const messages: ChatTurn[] = [...history, { role: "user", content: question }];

  try {
    const result = await think({ channel: "agent", teamId: memoryKey(member), messages, onEvent: opts.onEvent, signal: opts.signal });
    const answer = result.text || "I came back empty on that one. Add the business name, city, and what you're trying to find out, and ask again.";
    // A question the scope screen turned away isn't worth remembering.
    if (!result.blocked) await store.set(convKey, [...messages, { role: "assistant", content: answer }].slice(-MAX_TURNS), THREAD_TTL);
    return { ok: true, answer, thread_id: threadId, checked: result.checked, playbooks: result.playbooks, offline: result.offline };
  } catch (err) {
    await quota.refund().catch(() => {});
    console.error("[agent] ask failed", err);
    return { ok: false, status: 500, error: "vGarrett couldn't finish that one. Try again." };
  }
}

/** The member's brief without internal bookkeeping (storage key, check-in baselines). */
export async function briefFor(member: Member) {
  const brief = await getBrief(memoryKey(member));
  if (!brief) return null;
  return {
    updatedAt: brief.updatedAt,
    weeklyCheckins: brief.checkins,
    businesses: brief.businesses.map(({ id: _id, baseline: _baseline, ...b }) => b),
  };
}

export function briefMarkdown(brief: { businesses: Omit<Business, "id" | "baseline">[] } | null): string {
  if (!brief?.businesses.length) {
    return "No businesses on file yet. Ask vGarrett about a business (name and city) and it will start a brief for it.";
  }
  const out: string[] = [];
  for (const b of brief.businesses) {
    const facts = [
      b.city && `- City: ${b.city}`,
      b.address && `- Address: ${b.address}`,
      b.website && `- Website: ${b.website}`,
      b.phone && `- Phone: ${b.phone}`,
      b.primaryCategory && `- Primary category: ${b.primaryCategory}`,
      b.businessType && `- Type: ${b.businessType}`,
      b.serviceArea && `- Service area: ${b.serviceArea}`,
      b.keywords.length && `- Target keywords: ${b.keywords.join(", ")}`,
      b.competitors.length && `- Competitors: ${b.competitors.join(", ")}`,
    ].filter(Boolean);
    out.push(`## ${b.name}`, facts.join("\n") || "(no details yet)");
    for (const level of ["critical", "important", "monitor"] as const) {
      if (b.findings[level].length) out.push(`**${level[0].toUpperCase() + level.slice(1)}**\n${b.findings[level].map((f) => `- ${f}`).join("\n")}`);
    }
    if (b.nextAction) out.push(`**Next action:** ${b.nextAction}`);
    if (b.reminders.length) out.push(`**Reminders**\n${b.reminders.map((r) => `- ${r.text} (every ${r.every}, next ${r.due})`).join("\n")}`);
    if (b.log.length) out.push(`**Recent log**\n${b.log.slice(0, 8).map((l) => `- ${l.date}: ${l.text}`).join("\n")}`);
  }
  return out.join("\n\n");
}
