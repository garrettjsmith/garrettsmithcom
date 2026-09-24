import Link from "next/link";
import { Mark } from "./Mark.tsx";

// Shared shell for /terms and /privacy.
export function LegalPage({ title, effective, children }: { title: string; effective: string; children: React.ReactNode }) {
  return (
    <section className="view on">
      <header>
        <Link href="/" className="mark" aria-label="Ask Garrett home">
          <Mark />
          <span className="wordmark" translate="no">
            Garrett Smith <span className="labs">Labs</span>
          </span>
        </Link>
      </header>
      <main className="body">
        <article className="legal">
          <p className="eyebrow">Legal</p>
          <h1>{title}</h1>
          <p className="effective">Effective {effective}</p>
          {children}
        </article>
        <footer className="foot">
          <div className="wrap">
            <p>
              <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link>
            </p>
            <p>&copy; Garrett Smith</p>
          </div>
        </footer>
      </main>
    </section>
  );
}
