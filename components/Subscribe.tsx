import { NOTES_COPY } from "@/content/notes-copy.ts";

// Newsletter signup at the end of the notes pages (sends people to beehiiv).
export function Subscribe() {
  return (
    <aside className="subscribe">
      <div>
        <h2>{NOTES_COPY.subscribeTitle}</h2>
        <p>{NOTES_COPY.subscribeBody}</p>
      </div>
      <a className="buy" href={NOTES_COPY.subscribeUrl} target="_blank" rel="noopener">
        Subscribe
      </a>
    </aside>
  );
}
