import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import { DIAGRAMS } from "./notes-diagrams.ts";

// Search Notes: Garrett's newsletter essays, kept as Markdown in content/notes.
// Only `kind: essay` is published; roundups and announcements stay in the
// folder for the record but aren't shown.

export type Note = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  ask: string;
  date: string;
  topics: string[];
  source: string;
  kind: "essay" | "roundup" | "announcement";
  body: string;
  words: number;
};

export const TOPIC_LABELS: Record<string, string> = {
  gbp: "Google Business Profile",
  reviews: "Reviews",
  "ai-visibility": "AI visibility",
  website: "Websites",
  ads: "Ads",
  "local-search": "Local search",
  tools: "Tools",
};

const DIR = path.join(process.cwd(), "content", "notes");

/** The small YAML subset the notes use: `key: value`, quoted strings, and `[a, b]` lists. */
export function parseFrontmatter(src: string): { data: Record<string, string | string[]>; body: string } {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: src };
  const data: Record<string, string | string[]> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i < 1 || line.trimStart().startsWith("#")) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).replace(/\s+#.*$/, "").trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value.slice(1, -1).split(",").map((v) => v.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      continue;
    }
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1).replace(/\\"/g, '"');
    data[key] = value;
  }
  return { data, body: src.slice(m[0].length) };
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function load(file: string): Note {
  const { data, body } = parseFrontmatter(readFileSync(path.join(DIR, file), "utf8"));
  const kind = str(data.kind);
  return {
    slug: str(data.slug) || file.replace(/\.md$/, ""),
    title: str(data.title),
    subtitle: str(data.subtitle),
    description: str(data.description) || str(data.subtitle),
    ask: str(data.ask),
    date: str(data.date),
    topics: Array.isArray(data.topics) ? data.topics : [],
    source: str(data.source),
    kind: kind === "roundup" || kind === "announcement" ? kind : "essay",
    body,
    words: body.replace(/<!--[\s\S]*?-->/g, "").split(/\s+/).filter(Boolean).length,
  };
}

let cache: Note[] | null = null;

/** Published notes, newest first. */
export function getNotes(): Note[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  cache = readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map(load)
    .filter((n) => n.kind === "essay" && n.title && n.date)
    .sort((a, b) => b.date.localeCompare(a.date));
  return cache;
}

export function getNote(slug: string): Note | undefined {
  return getNotes().find((n) => n.slug === slug);
}

export const readingMinutes = (n: Note) => Math.max(2, Math.round(n.words / 230));

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

const marked = new Marked({ gfm: true, breaks: false });

/**
 * Markdown to HTML for a note. Images become figures (screenshots and charts
 * get a frame and a caption from their import notes); `<div data-diagram=…>`
 * placeholders become the redrawn diagrams; site-relative links stay on site
 * and outside links open in a new tab.
 */
export function renderNote(body: string): string {
  const withFigures = body.replace(
    /!\[([^\]]*)\]\(([^)\s]+)\)\s*\n<!--\s*image:\s*(\w+);?\s*([\s\S]*?)-->(\s*\n_([^\n]+)_)?/g,
    (_m, alt: string, src: string, type: string, _desc: string, _c: string, caption?: string) =>
      `<figure class="nfig ${type}"><img src="${src}" alt="${alt.replace(/"/g, "&quot;")}" loading="lazy">${
        caption ? `<figcaption>${caption}</figcaption>` : alt ? `<figcaption>${alt}</figcaption>` : ""
      }</figure>`,
  );
  let html = marked.parse(withFigures.replace(/<!--[\s\S]*?-->/g, ""), { async: false }) as string;
  html = html.replace(/<div data-diagram="([\w-]+)"><\/div>/g, (_m, id: string) => DIAGRAMS[id] ?? "");
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, (_m, href: string) =>
    /^https?:\/\/(www\.)?garrettsmith\.com/.test(href) ? `<a href="${href}"` : `<a href="${href}" target="_blank" rel="noopener"`,
  );
  return html;
}

/** Plain text of a note for vGarrett (no images, links kept as text). */
export function noteText(n: Note): string {
  return n.body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<div data-diagram="[^"]*"><\/div>/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
