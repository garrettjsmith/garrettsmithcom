import { briefFor } from "@/lib/agent.ts";
import { memberForRequest, unauthorized } from "@/lib/apikeys.ts";

export const runtime = "nodejs";

// GET with Authorization: Bearer vg_… -> {"brief": {...} | null}. Doesn't count as a question.
export async function GET(req: Request) {
  const member = await memberForRequest(req);
  if (!member) return unauthorized();
  return Response.json({ brief: await briefFor(member) }, { headers: { "Cache-Control": "no-store" } });
}
