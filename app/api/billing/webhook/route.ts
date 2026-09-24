import { handleStripeEvent, stripe } from "@/lib/billing.ts";
import { getStore } from "@/lib/store.ts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (err) {
    console.warn("[billing] bad webhook signature", (err as Error).message);
    return new Response("bad signature", { status: 400 });
  }
  if (!(await getStore().claim(`stripe:event:${event.id}`, 7 * 86_400))) return new Response("ok");
  try {
    await handleStripeEvent(event);
  } catch (err) {
    console.error("[billing] webhook handling failed", err);
    // Let Stripe retry.
    await getStore().set(`stripe:event:${event.id}`, null);
    return new Response("error", { status: 500 });
  }
  return new Response("ok");
}
