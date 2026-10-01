import { stripe } from "@/lib/billing.ts";
import { HUMAN_OFFERS } from "@/content/human.ts";
import { claimIncluded, createHumanCheckout, getCase, includedAvailable, markPaid, slotsLeft } from "@/lib/human.ts";
import { currentMember } from "@/lib/session.ts";

export const runtime = "nodejs";

// The button on vGarrett's offer card (and the link in email/Slack offers).
// Sends the person to Stripe, or straight through when it's a Teams member's
// included Second Opinion.
export async function GET(req: Request) {
  const site = new URL(req.url).origin;
  const id = new URL(req.url).searchParams.get("case") ?? "";
  const c = await getCase(id);
  if (!c) return Response.redirect(`${site}/?human=expired`, 303);
  if (c.status === "paid") return Response.redirect(`${site}/?human=sent`, 303);
  if ((await slotsLeft()) <= 0) return Response.redirect(`${site}/?human=full`, 303);

  const member = await currentMember();
  const email = member?.email ?? (c.who?.startsWith("email:") ? c.who.slice(6) : undefined);
  if (await includedAvailable(c, email)) {
    // A click, not a page load: Slack and mail scanners open links on their own.
    return new Response(
      `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Second Opinion · vGarrett</title>` +
        `<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#F4F6F3;color:#0E1410;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px">` +
        `<main style="max-width:440px;background:#fff;border:1px solid #DDE3DC;border-radius:16px;padding:28px;line-height:1.55">` +
        `<h1 style="font-size:20px;margin:0 0 8px">Use this month's included Second Opinion?</h1>` +
        `<p>${HUMAN_OFFERS.second_opinion.card} It's included with Teams, once a month.</p>` +
        `<form method="post"><input type="hidden" name="case" value="${c.id}">` +
        `<button style="font:inherit;font-weight:600;background:#0A0D0A;color:#fff;border:0;border-radius:999px;padding:10px 18px;cursor:pointer">Send it to Garrett</button></form></main></body>`,
      { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }
  if (!process.env.STRIPE_SECRET_KEY) return Response.redirect(`${site}/?human=unavailable`, 303);
  try {
    return Response.redirect(await createHumanCheckout(c, stripe(), email), 303);
  } catch (err) {
    console.error("[human] checkout failed", err);
    return Response.redirect(`${site}/?human=unavailable`, 303);
  }
}

export async function POST(req: Request) {
  const site = new URL(req.url).origin;
  const id = String((await req.formData()).get("case") ?? "");
  const c = await getCase(id);
  if (!c) return Response.redirect(`${site}/?human=expired`, 303);
  if (c.status === "paid") return Response.redirect(`${site}/?human=sent`, 303);
  const member = await currentMember();
  const email = member?.email ?? (c.who?.startsWith("email:") ? c.who.slice(6) : undefined);
  if ((await slotsLeft()) > 0 && (await claimIncluded(c, email))) {
    await markPaid(c.id, { email: email!, amountCents: 0, included: true });
    return Response.redirect(`${site}/?human=sent`, 303);
  }
  return Response.redirect(`${site}/api/human/checkout?case=${c.id}`, 303);
}
