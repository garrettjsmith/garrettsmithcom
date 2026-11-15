import { memberForRequest, unauthorized } from "@/lib/apikeys.ts";
import { handleMcp, isRequest, type RpcMessage } from "@/lib/mcp.ts";

export const runtime = "nodejs";
export const maxDuration = 300;

// MCP over Streamable HTTP, stateless: POST a JSON-RPC message with the
// member's API key, get the reply. Tool calls stream as server-sent events so
// status updates keep the connection alive while vGarrett runs live checks.

const rpcError = (code: number, message: string, status: number) =>
  Response.json({ jsonrpc: "2.0", id: null, error: { code, message } }, { status });

export async function POST(req: Request) {
  const member = await memberForRequest(req);
  if (!member) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return rpcError(-32700, "Parse error", 400);
  }

  if (Array.isArray(body)) {
    const replies = [];
    for (const m of body as RpcMessage[]) {
      const r = await handleMcp(m, member, { signal: req.signal });
      if (r) replies.push(r);
    }
    return replies.length ? Response.json(replies) : new Response(null, { status: 202 });
  }

  const msg = body as RpcMessage;
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0") return rpcError(-32600, "Invalid request", 400);
  if (!isRequest(msg)) return new Response(null, { status: 202 });
  if (msg.method !== "tools/call") return Response.json(await handleMcp(msg, member, { signal: req.signal }));

  const enc = new TextEncoder();
  const progressToken = (msg.params?._meta as { progressToken?: string | number } | undefined)?.progressToken;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (s: string) => {
        try {
          controller.enqueue(enc.encode(s));
        } catch {
          // The caller went away; think() stops through req.signal.
        }
      };
      const send = (obj: unknown) => write(`event: message\ndata: ${JSON.stringify(obj)}\n\n`);
      let step = 0;
      const progress = (message: string) =>
        progressToken === undefined
          ? write(`: ${message}\n\n`)
          : send({ jsonrpc: "2.0", method: "notifications/progress", params: { progressToken, progress: ++step, message } });
      const beat = setInterval(() => progress("Still working"), 15_000);
      try {
        send(await handleMcp(msg, member, { signal: req.signal, onProgress: progress }));
      } catch (err) {
        console.error("[mcp]", err);
        send({ jsonrpc: "2.0", id: msg.id, error: { code: -32603, message: "Internal error" } });
      } finally {
        clearInterval(beat);
        try {
          controller.close();
        } catch {}
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}

// No server-initiated stream and no sessions to end.
const notAllowed = () => new Response(null, { status: 405, headers: { Allow: "POST" } });
export { notAllowed as GET, notAllowed as DELETE };
