import { think } from "@/lib/garrett/brain.ts";
import { splitFollowups } from "@/lib/garrett/format.ts";
import { parseTranscript } from "@/lib/garrett/transcript.ts";
import { allowWebMessage, clientIp } from "@/lib/ratelimit.ts";

export const runtime = "nodejs";
export const maxDuration = 120;

// Streams newline-delimited JSON:
//   {"type":"text","delta":"..."}           as the answer is written
//   {"type":"status","label":"map pack","kind":"live"|"playbook"}
//   {"type":"done","text":"...","followups":[...],"checked":[...],"playbooks":[...],"offline":bool,"remaining":n}
//   {"type":"error","message":"..."}
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const transcript = parseTranscript(body);
  if (typeof transcript === "string") return Response.json({ error: transcript }, { status: 400 });

  const gate = await allowWebMessage(clientIp(req));
  if (!gate.ok) {
    const message =
      gate.reason === "free"
        ? "That's your free look. Request access below to keep going."
        : "I'm at capacity for today. Request access below and I'll follow up.";
    return Response.json({ error: message, limited: true }, { status: 429 });
  }

  const live = (body as { live?: unknown }).live !== false;
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
      try {
        const result = await think({
          channel: "web",
          messages: transcript,
          live,
          signal: req.signal,
          onEvent: send,
        });
        const { text, followups } = splitFollowups(result.text);
        send({
          type: "done",
          text: text || "I came back empty. Give me the business name and city and I'll try again.",
          followups,
          checked: result.checked,
          playbooks: result.playbooks,
          offline: result.offline,
          remaining: gate.remaining,
        });
      } catch (err) {
        await gate.refund().catch(() => {});
        if (!req.signal.aborted) {
          console.error("[chat]", err);
          send({ type: "error", message: "I couldn't finish that one. Send it again." });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
