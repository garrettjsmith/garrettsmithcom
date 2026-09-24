import Image from "next/image";
import { COPY } from "@/content/copy.ts";
import { Hire } from "./Hire.tsx";
import { Mark } from "./Mark.tsx";
import { Portal } from "./Stage.tsx";

const STATS = [
  { value: "20+", label: "years in local search" },
  { value: "25", label: "playbooks behind every answer" },
  { value: "Live", label: "rankings, reviews & profiles" },
  { value: "1/10th", label: "the cost of an hour with me" },
];

const PLAYBOOK_FILES = ["gbp-optimization", "review-management", "gbp-suspension-recovery", "ai-local-search"];

// Everything below the hero.
export function LandingSections() {
  const { how, pricing, team, letter } = COPY;
  return (
    <>
      <section className="stats" aria-label="At a glance">
        <div className="wrap stats-row">
          {STATS.map((s) => (
            <div key={s.label} className="stat">
              <p className="v">{s.value}</p>
              <p className="l">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sec" aria-labelledby="letter-title">
        <div className="wrap letter">
          <div className="portrait">
            <figure className="shot real">
              <Image src="/garrett.webp" alt="Garrett Smith" width={800} height={800} sizes="(max-width: 980px) 70vw, 360px" />
              <figcaption className="portrait-tag">
                <span className="live-dot" aria-hidden="true" /> The real one
              </figcaption>
            </figure>
            <figure className="shot virtual" aria-label="Virtual Garrett, the AI version">
              <Portal uid="pv" />
              <figcaption className="portrait-tag">
                <span className="live-dot" aria-hidden="true" /> The virtual one
              </figcaption>
            </figure>
          </div>
          <article className="note">
            <p className="eyebrow" id="letter-title">
              {letter.eyebrow}
            </p>
            {letter.paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "hello" : undefined}>
                {p}
              </p>
            ))}
            <div className="signoff">
              <p className="sig" aria-hidden="true">
                {letter.signature}
              </p>
              <p className="who">
                <b>{letter.name}</b>
                <span>{letter.role}</span>
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="sec sec-tint" aria-labelledby="how-title">
        <div className="wrap">
          <p className="eyebrow">{how.eyebrow}</p>
          <h2 id="how-title">{how.title}</h2>
          <p className="lede">{how.intro}</p>
          <div className="formula">
            <div className="card">
              <div className="viz files" aria-hidden="true">
                {PLAYBOOK_FILES.map((f) => (
                  <span key={f}>{f}.md</span>
                ))}
              </div>
              <h3>
                <a href={how.parts[0].href}>{how.parts[0].name}</a>
              </h3>
              <p>{how.parts[0].body}</p>
            </div>
            <span className="op" aria-hidden="true">
              +
            </span>
            <div className="card">
              <div className="viz bars" aria-hidden="true">
                {[38, 64, 52, 80, 71, 92, 60].map((h, i) => (
                  <i key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
              <h3>
                <a href={how.parts[1].href}>{how.parts[1].name}</a>
              </h3>
              <p>{how.parts[1].body}</p>
            </div>
            <span className="op" aria-hidden="true">
              =
            </span>
            <div className="card result">
              <div className="viz">
                <Portal className="mini" uid="pm" />
              </div>
              <h3>{how.result.name}</h3>
              <p>{how.result.body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="pricing-title">
        <div className="wrap">
          <p className="eyebrow">{pricing.eyebrow}</p>
          <h2 id="pricing-title">{pricing.title}</h2>
          <div className="prices">
            {[pricing.inPerson, pricing.ask].map((p, i) => (
              <div key={p.label} className={i ? "price ask" : "price"}>
                <h3>{p.label}</h3>
                <p className="amount">
                  {i ? <span className="num">{p.price}</span> : <s className="num">{p.price}</s>} <span className="unit">{p.unit}</span>
                </p>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec-tint" aria-labelledby="team-title">
        <div className="wrap team-grid">
          <div>
            <p className="eyebrow">{team.eyebrow}</p>
            <h2 id="team-title">{team.title}</h2>
            <p className="lede">{team.intro}</p>
            <ul className="points">
              {team.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <SlackMock />
        </div>
        <div className="wrap">
          <Hire id="access" title={["Get", "early access."]} />
        </div>
      </section>

      <footer className="foot">
        <div className="wrap">
          <p className="foot-brand">
            <Mark /> Garrett Smith Labs
          </p>
          <p>{COPY.disclaimer}</p>
          <p>&copy; Garrett Smith</p>
        </div>
      </footer>
    </>
  );
}

// An illustrative Slack thread. Static, labeled as an example.
function SlackMock() {
  return (
    <figure className="slack" aria-label="Example: Garrett answering in a Slack thread">
      <div className="slack-bar">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span># local-seo</span>
        <span className="demo-tag">Example</span>
      </div>
      <div className="slack-msg">
        <span className="avatar sam" aria-hidden="true">
          S
        </span>
        <div>
          <p className="who">
            Sam <span>9:41 AM</span>
          </p>
          <p>
            <b className="at">@Garrett</b> Rochester dropped out of the pack for &ldquo;emergency plumber&rdquo; this
            week. Anything change?
          </p>
        </div>
      </div>
      <div className="slack-msg">
        <Mark className="avatar" />
        <div>
          <p className="who">
            Garrett <span className="app">APP</span> <span>9:42 AM</span>
          </p>
          <p>
            Checked the map pack. A competitor 0.4 mi closer to downtown verified last week, and your profile lost its
            Sunday hours on the 12th. Put the hours back first; that&rsquo;s the quick win.
          </p>
          <p className="checked">
            <span className="live-dot" aria-hidden="true" /> Checked live: map pack · profile
          </p>
        </div>
      </div>
    </figure>
  );
}
