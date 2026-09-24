import { clearMemberCookie } from "@/lib/session.ts";

export const runtime = "nodejs";

export async function POST() {
  await clearMemberCookie();
  return Response.json({ ok: true });
}
