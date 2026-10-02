import type { Metadata } from "next";
import Link from "next/link";
import { NOTES_COPY } from "@/content/notes-copy.ts";
import { SiteFrame } from "@/components/SiteFrame.tsx";
import { Subscribe } from "@/components/Subscribe.tsx";
import { formatDate, getNotes, readingMinutes, TOPIC_LABELS } from "@/lib/notes.ts";

export const metadata: Metadata = {
  title: `${NOTES_COPY.title} · Garrett Smith`,
  description: NOTES_COPY.intro,
  alternates: { canonical: "/notes" },
};

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function NotesIndex({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const topic = typeof q.topic === "string" && TOPIC_LABELS[q.topic] ? q.topic : null;
  const all = getNotes();
  const notes = topic ? all.filter((n) => n.topics.includes(topic)) : all;
  const used = Object.keys(TOPIC_LABELS).filter((t) => all.some((n) => n.topics.includes(t)));
  return (
    <SiteFrame>
      <div className="notes wrap">
        <p className="eyebrow">{NOTES_COPY.eyebrow}</p>
        <h1>{NOTES_COPY.title}</h1>
        <p className="lede">{NOTES_COPY.intro}</p>
        <nav className="topics" aria-label="Filter by topic">
          <Link href="/notes" aria-current={!topic ? "page" : undefined}>
            {NOTES_COPY.all}
          </Link>
          {used.map((t) => (
            <Link key={t} href={`/notes?topic=${t}`} aria-current={topic === t ? "page" : undefined}>
              {TOPIC_LABELS[t]}
            </Link>
          ))}
        </nav>
        <ol className="note-list">
          {notes.map((n) => (
            <li key={n.slug}>
              <Link href={`/notes/${n.slug}`}>
                <span className="nl-meta">
                  <time dateTime={n.date}>{formatDate(n.date)}</time> · {readingMinutes(n)} min
                </span>
                <span className="nl-title">{n.title}</span>
                <span className="nl-desc">{n.description}</span>
                <span className="nl-topics">{n.topics.map((t) => TOPIC_LABELS[t] ?? t).join(" · ")}</span>
              </Link>
            </li>
          ))}
        </ol>
        <Subscribe />
      </div>
    </SiteFrame>
  );
}
