import Link from "next/link";
import { Mark } from "./Mark.tsx";

// Header and footer for the plain pages (Search Notes). The chat landing page
// has its own header with sign-in and plans.
export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <section className="view on">
      <header>
        <Link href="/" className="mark" aria-label="vGarrett home">
          <Mark />
          <span className="wordmark" translate="no">
            Garrett Smith <span className="labs">Labs</span>
          </span>
        </Link>
        <div className="hdr-right">
          <Link className="linkish always" href="/notes">
            Search Notes
          </Link>
          <Link className="hdr-cta" href="/">
            <span className="long">Ask vGarrett</span>
            <span className="short">Ask</span>
          </Link>
        </div>
      </header>
      <main className="body">
        {children}
        <footer className="foot">
          <div className="wrap">
            <p className="foot-brand">
              <Mark /> Garrett Smith Labs
            </p>
            <p>
              <Link href="/notes">Search Notes</Link> · <Link href="/">vGarrett</Link> · <Link href="/terms">Terms</Link> ·{" "}
              <Link href="/privacy">Privacy</Link> · &copy; Garrett Smith
            </p>
          </div>
        </footer>
      </main>
    </section>
  );
}
