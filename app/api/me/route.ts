import { billingEnabled } from "@/lib/billing.ts";
import { currentMember } from "@/lib/session.ts";

export const runtime = "nodejs";

export async function GET() {
  const m = await currentMember();
  return Response.json(
    { member: m ? { email: m.email, plan: m.plan, billing: Boolean(m.stripeCustomerId) } : null, billing: billingEnabled() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
