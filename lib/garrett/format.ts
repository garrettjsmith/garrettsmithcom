// Pure text helpers shared by the server and the browser. No dependencies.

export const FOLLOWUPS_MARKER = "[[FOLLOWUPS]]";

/** Split the model's reply into the visible answer and its suggested follow-ups. */
export function splitFollowups(raw: string): { text: string; followups: string[] } {
  const i = raw.lastIndexOf(FOLLOWUPS_MARKER);
  if (i === -1) return { text: raw.trim(), followups: [] };
  const followups = raw
    .slice(i + FOLLOWUPS_MARKER.length)
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  return { text: raw.slice(0, i).trim(), followups };
}

/**
 * What to show while a reply is still streaming: everything before the
 * follow-ups marker, and never a half-typed "[[FOLLOW" at the tail.
 */
export function visiblePartial(raw: string): string {
  const i = raw.indexOf(FOLLOWUPS_MARKER);
  if (i !== -1) return raw.slice(0, i);
  const open = raw.lastIndexOf("[[");
  if (open !== -1 && FOLLOWUPS_MARKER.startsWith(raw.slice(open))) return raw.slice(0, open);
  return raw;
}

/** Markdown-ish model output to Slack mrkdwn. */
export function toSlackMrkdwn(md: string): string {
  return md
    .replace(/^#{1,6}\s*(.+)$/gm, "*$1*")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/__(.+?)__/g, "*$1*")
    .replace(/^(\s*)[-*]\s+/gm, "$1• ")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "<$2|$1>");
}

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC[c]);
}

function inline(s: string): string {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/**
 * Minimal, escape-first Markdown to HTML for chat bubbles: paragraphs, bullet
 * and numbered lists, bold. Everything is escaped before any tag is added, so
 * the output is safe to set as innerHTML.
 */
export function renderChatHtml(md: string): string {
  const lines = md.replace(/^#+\s*/gm, "").split("\n");
  let html = "";
  let list = false;
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      html += "<p>" + inline(para.join(" ")) + "</p>";
      para = [];
    }
  };
  for (const raw of lines) {
    const l = raw.trim();
    const m = l.match(/^(?:[-*•]|\d+[.)])\s+(.*)/);
    if (m) {
      flush();
      if (!list) {
        html += "<ul>";
        list = true;
      }
      html += "<li>" + inline(m[1]) + "</li>";
      continue;
    }
    if (list) {
      html += "</ul>";
      list = false;
    }
    if (!l) {
      flush();
      continue;
    }
    para.push(l);
  }
  flush();
  if (list) html += "</ul>";
  return html;
}
