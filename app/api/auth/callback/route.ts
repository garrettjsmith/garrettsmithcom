import { site } from "@/lib/billing.ts";
import { getActiveMember } from "@/lib/members.ts";
import { setMemberCookie } from "@/lib/session.ts";
import { verifyToken } from "@/lib/signed.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const data = verifyToken<{ email: string }>("signin", new URL(req.url).searchParams.get("token"));
  if (!data || !(await getActiveMember(data.email))) return Response.redirect(`${site()}/?signin=expired`, 302);
  await setMemberCookie(data.email);
  return Response.redirect(`${site()}/?signedin=1`, 302);
}
