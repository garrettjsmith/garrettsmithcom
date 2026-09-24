import { billingEnabled, createCheckout } from "@/lib/billing.ts";
import { currentMember } from "@/lib/session.ts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!billingEnabled()) return Response.json({ error: "Billing isn't set up yet." }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { plan?: unknown };
  const plan = body.plan === "teams" ? "teams" : "solo";
  try {
    const member = await currentMember();
    return Response.json({ url: await createCheckout(plan, member?.email) });
  } catch (err) {
    console.error("[billing] checkout failed", err);
    return Response.json({ error: "Couldn't start checkout. Try again in a minute." }, { status: 502 });
  }
}
