import type { OfferCard } from "@/lib/human.ts";

// vGarrett's offer to bring in the real Garrett, shown under the reply that
// made it. The button goes to checkout for this case; "What I'll send" shows
// the handoff brief so the person knows exactly what Garrett will see.
export function Offer({ o }: { o: OfferCard }) {
  const full = !o.caseId || o.slotsLeft <= 0;
  return (
    <aside className={full ? "offer full" : "offer"} aria-label={`${o.name} with the real Garrett`}>
      <div className="ot">
        <b>{o.name}</b>
        <span className="op">{o.price}</span>
        <span className="os">{full ? "Full this week" : `${o.slotsLeft} slot${o.slotsLeft === 1 ? "" : "s"} left this week`}</span>
      </div>
      <p>{o.card}</p>
      <p>{o.turnaround[0].toUpperCase() + o.turnaround.slice(1)}.</p>
      {o.handoff && (
        <details>
          <summary>What I&rsquo;ll send Garrett</summary>
          <pre>{o.handoff}</pre>
        </details>
      )}
      {!full && (
        <a className="buy" href={`/api/human/checkout?case=${encodeURIComponent(o.caseId!)}`}>
          Send it to Garrett · {o.price}
        </a>
      )}
    </aside>
  );
}
