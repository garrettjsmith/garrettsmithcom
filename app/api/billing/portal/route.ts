import { createPortal } from "@/lib/billing.ts";
import { currentMember } from "@/lib/session.ts";
import { ASK_EMAIL } from "@/content/site.ts";

export const runtime = "nodejs";

export async function POST() {
  const member = await currentMember();
  if (!member) return Response.json({ error: "Sign in first." }, { status: 401 });
  const url = await createPortal(member.email).catch(() => null);
  if (!url) return Response.json({ error: `No billing on file for this account. Email ${ASK_EMAIL}.` }, { status: 404 });
  return Response.json({ url });
}
