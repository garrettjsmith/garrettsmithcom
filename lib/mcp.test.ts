import { test } from "node:test";
import assert from "node:assert/strict";
import type { Member } from "./members.ts";

const { handleMcp, PROTOCOL_VERSIONS, TOOLS } = await import("./mcp.ts");

const member: Member = { email: "a@b.co", plan: "solo", since: "2026-01-01" };
const deps = {
  ask: async (_m: Member, input: { question?: unknown; thread_id?: unknown }, opts?: { onEvent?: (e: never) => void }) => {
    if (!input.question) return { ok: false as const, status: 400 as const, error: "question is required" };
    opts?.onEvent?.({ type: "status", label: "map pack", kind: "live" } as never);
    return { ok: true as const, answer: "Fix the category.", thread_id: (input.thread_id as string) || "t1", checked: ["map pack"], playbooks: [], offline: false };
  },
  briefFor: async () => null,
};
const call = (method: string, params?: Record<string, unknown>, id: number | undefined = 1) => handleMcp({ jsonrpc: "2.0", id, method, params }, member, { deps });

test("initialize echoes a supported version and falls back to the newest", async () => {
  const a = (await call("initialize", { protocolVersion: "2025-03-26" }))!.result as { protocolVersion: string; capabilities: object };
  assert.equal(a.protocolVersion, "2025-03-26");
  assert.deepEqual(a.capabilities, { tools: { listChanged: false } });
  const b = (await call("initialize", { protocolVersion: "1999-01-01" }))!.result as { protocolVersion: string };
  assert.equal(b.protocolVersion, PROTOCOL_VERSIONS[0]);
});

test("notifications get no reply; unknown methods get an error", async () => {
  assert.equal(await handleMcp({ jsonrpc: "2.0", method: "notifications/initialized" }, member, { deps }), null);
  assert.equal((await call("resources/list"))!.error?.code, -32601);
  assert.deepEqual((await call("ping"))!.result, {});
});

test("lists both tools with input schemas", async () => {
  const { tools } = (await call("tools/list"))!.result as { tools: typeof TOOLS };
  assert.deepEqual(tools.map((t) => t.name), ["ask_vgarrett", "get_brief"]);
  for (const t of tools) assert.equal(t.inputSchema.type, "object");
});

test("ask_vgarrett returns the answer, the thread id, and progress", async () => {
  const progress: string[] = [];
  const reply = await handleMcp(
    { jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "ask_vgarrett", arguments: { question: "Why am I not in the map pack?", thread_id: "abc" } } },
    member,
    { deps, onProgress: (m) => progress.push(m) },
  );
  const result = reply!.result as { content: { text: string }[]; structuredContent: { thread_id: string }; isError?: boolean };
  assert.equal(reply!.id, 7);
  assert.match(result.content[0].text, /^Fix the category\./);
  assert.match(result.content[0].text, /Checked live: map pack/);
  assert.match(result.content[0].text, /thread_id: abc/);
  assert.equal(result.structuredContent.thread_id, "abc");
  assert.ok(!("ok" in result.structuredContent));
  assert.deepEqual(progress, ["Checking map pack"]);
});

test("tool failures come back as tool errors, unknown tools as protocol errors", async () => {
  const bad = (await call("tools/call", { name: "ask_vgarrett", arguments: {} }))!.result as { isError: boolean; content: { text: string }[] };
  assert.equal(bad.isError, true);
  assert.equal(bad.content[0].text, "question is required");
  assert.equal((await call("tools/call", { name: "nope" }))!.error?.code, -32602);
});

test("get_brief explains an empty brief", async () => {
  const r = (await call("tools/call", { name: "get_brief" }))!.result as { content: { text: string }[] };
  assert.match(r.content[0].text, /No businesses on file/);
});
