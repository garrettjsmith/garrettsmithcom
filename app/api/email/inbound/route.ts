import { after } from "next/server";
import { think } from "@/lib/garrett/brain.ts";
import { renderChatHtml } from "@/lib/garrett/format.ts";
import type { ChatTurn } from "@/lib/garrett/transcript.ts";
import {
  ASK_ADDRESS,
  getReceivedEmail,
  htmlToText,
  isAutomated,
  parseAddress,
  senderVerified,
  sendEmail,
  stripQuoted,
  threadKey,
  verifySvix,
} from "@/lib/email.ts";
import { getActiveMember } from "@/lib/members.ts";
import { allowMemberMessage } from "@/lib/ratelimit.ts";
import { getStore } from "@/lib/store.ts";

export const runtime = "nodejs";
export const maxDuration = 300;

const SITE = (process.env.SITE_URL || "https://garrettsmith.com").replace(/\/$/, "");
const THREAD_TTL = 60 * 86_400;
const MAX_TURNS = 12;
const MAX_INCOMING_CHARS = 6000;

// Resend "email.received" webhook for the Ask Garrett address (content/site.ts). Verify, ack fast,
// then read the email and reply in after().
export async function POST(req: Request) {
  const raw = await req.text();
  const ok = verifySvix(
    raw,
    {
      id: req.headers.get("svix-id"),
      timestamp: req.headers.get("svix-timestamp"),
      signature: req.headers.get("svix-signature"),
    },
    process.env.RESEND_WEBHOOK_SECRET,
  );
  if (!ok) return new Response("bad signature", { status: 401 });

  const event = JSON.parse(raw) as { type: string; data?: { email_id?: string } };
  const emailId = event.data?.email_id;
  if (event.type !== "email.received" || !emailId) return new Response("ok");
  // Resend retries on slow or failed responses; answer each email once.
  if (!(await getStore().claim(`email:event:${emailId}`, 7 * 86_400))) return new Response("ok");

  after(() => handle(emailId).catch((e) => console.error("[email] failed", e)));
  return new Response("ok");
}

async function handle(emailId: string) {
  const email = await getReceivedEmail(emailId);
  const headers = email.headers ?? {};
  const { name, email: from } = parseAddress(email.from);
  if (from === ASK_ADDRESS.toLowerCase() || isAutomated(email.from, headers)) return;
  // Never reply to an address we can't verify: it may be spoofed.
  if (!senderVerified(email.authentication)) {
    console.warn(`[email] unverified sender ${from}, not replying`);
    return;
  }

  const subject = email.subject?.trim() || "Your question";
  const replySubject = /^re:/i.test(subject) ? subject : `Re: ${subject}`;
  const threading = { inReplyTo: email.message_id, references: headers["references"] ?? null };

  const member = await getActiveMember(from);
  if (!member) {
    // One polite pointer per address per month; no free answers by email.
    if (!(await getStore().claim(`email:nonmember:${from}`, 30 * 86_400))) return;
    const text = [
      `Hi${name ? ` ${name.split(" ")[0]}` : ""},`,
      "",
      "Thanks for writing. Answers by email are part of Ask Garrett.",
      "",
      `You can try it free at ${SITE} (a few questions, no signup) and pick a plan there. Already a member? Write from the address you signed up with.`,
      "",
      "— Garrett (AI)",
    ].join("\n");
    await sendEmail({ to: from, subject: replySubject, text, html: renderChatHtml(text), ...threading });
    return;
  }

  const body = stripQuoted(email.text ?? htmlToText(email.html ?? "")).slice(0, MAX_INCOMING_CHARS);
  if (!body) return;

  // Same monthly fair-use cap as the web chat, shared across both.
  const quota = await allowMemberMessage(from);
  if (!quota.ok) {
    if (await getStore().claim(`email:capped:${from}:${new Date().toISOString().slice(0, 7)}`, 32 * 86_400)) {
      const text = `You've hit this month's fair-use limit, so I'll pick back up next month. If you need more before then, reply and the real Garrett will sort it out.\n\n— Garrett (AI)`;
      await sendEmail({ to: from, subject: replySubject, text, html: renderChatHtml(text), ...threading });
    }
    return;
  }

  const store = getStore();
  const convKey = `email:conv:${from}:${threadKey(subject)}`;
  const history = (await store.get<ChatTurn[]>(convKey)) ?? [];
  const intro = name ? `(From ${name} <${from}>)\n\n` : "";
  const messages: ChatTurn[] = [...history, { role: "user", content: intro + body }];

  let result;
  try {
    result = await think({ channel: "email", teamId: `email:${from}`, messages });
  } catch (err) {
    await quota.refund();
    throw err;
  }
  const answer = result.text || "I came back empty on that one. Can you add a little more detail and send it again?";

  const checked = result.checked.length ? `Checked live: ${result.checked.join(" · ")}\n\n` : "";
  const footer = "— Garrett (AI)\nAI, not the real Garrett. Reply to this email to keep going.";
  const text = `${answer}\n\n${checked}${footer}`;
  const html =
    `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0E1410">` +
    renderChatHtml(answer) +
    (checked ? `<p style="font-size:12px;color:#56605A">${renderChatHtml(checked).replace(/<\/?p>/g, "")}</p>` : "") +
    `<p style="font-size:13px;color:#56605A">— Garrett (AI)<br>AI, not the real Garrett. Reply to this email to keep going.</p></div>`;

  await sendEmail({ to: from, subject: replySubject, text, html, ...threading });
  await store.set(convKey, [...messages, { role: "assistant", content: answer }].slice(-MAX_TURNS), THREAD_TTL);
}
