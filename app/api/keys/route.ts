import { createKey, listKeys, MAX_KEYS, revokeKey } from "@/lib/apikeys.ts";
import { currentMember } from "@/lib/session.ts";

export const runtime = "nodejs";

// A signed-in member's API keys, managed from the site header.
const signIn = () => Response.json({ error: "Sign in first." }, { status: 401 });
const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  const member = await currentMember();
  if (!member) return signIn();
  return Response.json({ keys: await listKeys(member.email), max: MAX_KEYS }, noStore);
}

export async function POST(req: Request) {
  const member = await currentMember();
  if (!member) return signIn();
  const body = (await req.json().catch(() => ({}))) as { label?: unknown };
  const made = await createKey(member.email, typeof body.label === "string" ? body.label : "");
  if (!made) return Response.json({ error: `You can have up to ${MAX_KEYS} keys. Revoke one first.` }, { status: 409 });
  return Response.json({ key: made.key, info: made.info }, noStore);
}

export async function DELETE(req: Request) {
  const member = await currentMember();
  if (!member) return signIn();
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!(await revokeKey(member.email, id))) return Response.json({ error: "No such key." }, { status: 404 });
  return Response.json({ ok: true }, noStore);
}
