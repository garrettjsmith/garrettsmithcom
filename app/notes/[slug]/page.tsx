import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NOTES_COPY } from "@/content/notes-copy.ts";
import { NoteCover } from "@/components/NoteCover.tsx";
import { SiteFrame } from "@/components/SiteFrame.tsx";
import { formatDate, getNote, getNotes, readingMinutes, renderNote, TOPIC_LABELS } from "@/lib/notes.ts";
import { Subscribe } from "@/components/Subscribe.tsx";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getNotes().map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const n = getNote((await params).slug);
  if (!n) return {};
  return {
    title: `${n.title} · Search Notes`,
    description: n.description,
    alternates: { canonical: `/notes/${n.slug}` },
    authors: [{ name: "Garrett Smith", url: "https://garrettsmith.com" }],
    openGraph: { title: n.title, description: n.description, type: "article", publishedTime: n.date, authors: ["Garrett Smith"] },
  };
}

export default async function NotePage({ params }: { params: Params }) {
  const n = getNote((await params).slug);
  if (!n) notFound();
  const all = getNotes();
  const i = all.findIndex((x) => x.slug === n.slug);
  const newer = all[i - 1];
  const older = all[i + 1];
  const topic = TOPIC_LABELS[n.topics[0]] ?? "Local search";
  const site = (process.env.SITE_URL || "https://garrettsmith.com").replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: n.title,
    description: n.description,
    datePublished: n.date,
    url: `${site}/notes/${n.slug}`,
    mainEntityOfPage: `${site}/notes/${n.slug}`,
    keywords: n.topics.map((t) => TOPIC_LABELS[t] ?? t).join(", "),
    author: {
      "@type": "Person",
      name: "Garrett Smith",
      url: site,
      jobTitle: "Local search consultant",
      sameAs: ["https://github.com/garrettjsmith", "https://coconotes.beehiiv.com"],
    },
    publisher: { "@type": "Organization", name: "Garrett Smith Labs", url: site },
  };
  return (
    <SiteFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <article className="note-page">
        <div className="note-head wrap">
          <p className="eyebrow">
            <Link href={`/notes?topic=${n.topics[0] ?? ""}`}>{topic}</Link>
          </p>
          <h1>{n.title}</h1>
          {n.subtitle && <p className="note-sub">{n.subtitle}</p>}
          <p className="note-meta">
            By Garrett Smith · <time dateTime={n.date}>{formatDate(n.date)}</time>
          </p>
          <NoteCover takeaway={n.description} topic={topic} minutes={readingMinutes(n)} uid={`nc-${i}`} />
        </div>
        {/* Rendered from Garrett's own Markdown in content/notes. */}
        <div className="prose wrap" dangerouslySetInnerHTML={{ __html: renderNote(n.body) }} />
        <div className="wrap note-end">
          {n.ask && (
            <aside className="note-ask">
              <p className="eyebrow">{NOTES_COPY.askTitle}</p>
              <p>{NOTES_COPY.askBody}</p>
              <Link className="note-ask-q" href={`/?q=${encodeURIComponent(n.ask)}`}>
                <span>{n.ask}</span>
                <span className="go" aria-hidden="true">
                  Ask
                </span>
              </Link>
            </aside>
          )}
          <Subscribe />
          <nav className="note-nav" aria-label="More notes">
            {older ? (
              <Link href={`/notes/${older.slug}`}>
                <span>Older</span>
                {older.title}
              </Link>
            ) : (
              <span />
            )}
            {newer && (
              <Link href={`/notes/${newer.slug}`} className="newer">
                <span>Newer</span>
                {newer.title}
              </Link>
            )}
          </nav>
          <p className="note-source">
            First sent to the newsletter on {formatDate(n.date)}. <Link href="/notes">All Search Notes</Link>
          </p>
        </div>
      </article>
    </SiteFrame>
  );
}
