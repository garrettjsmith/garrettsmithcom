import { ask, type AskInput } from "@/lib/agent.ts";
import { memberForRequest, unauthorized } from "@/lib/apikeys.ts";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST {"question": "...", "thread_id": "optional"} with Authorization: Bearer vg_…
// -> {"answer", "thread_id", "checked", "playbooks", "offline"}
export async function POST(req: Request) {
  const member = await memberForRequest(req);
  if (!member) return unauthorized();
  let body: AskInput;
  try {
    body = (await req.json()) as AskInput;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const r = await ask(member, body ?? {}, { signal: req.signal });
  if (!r.ok) return Response.json({ error: r.error }, { status: r.status });
  const { ok: _ok, ...result } = r;
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
