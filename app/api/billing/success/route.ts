import { activateFromCheckout, site, stripe } from "@/lib/billing.ts";
import { setMemberCookie } from "@/lib/session.ts";

export const runtime = "nodejs";

// Stripe sends people here after paying. Don't wait for the webhook: confirm
// the session directly, sign them in, and drop them back into the chat.
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return Response.redirect(`${site()}/`, 302);
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    const done = await activateFromCheckout(session);
    if (!done) return Response.redirect(`${site()}/?checkout=pending`, 302);
    await setMemberCookie(done.email);
    return Response.redirect(`${site()}/?welcome=${done.plan}`, 302);
  } catch (err) {
    console.error("[billing] success lookup failed", err);
    return Response.redirect(`${site()}/?checkout=pending`, 302);
  }
}
