import { COPY } from "@/content/copy.ts";
import { Hire } from "./Hire.tsx";
import { Mark } from "./Mark.tsx";

// Everything below the hero: who Garrett is, how the AI version works, what it
// costs next to the real thing, and the Slack pitch.
export function LandingSections() {
  const { how, pricing, team } = COPY;
  return (
    <>
      <section className="sec how" aria-labelledby="how-title">
        <div className="wrap">
          <h2 id="how-title">{how.title}</h2>
          <p className="lede">{how.intro}</p>
          <div className="equation">
            {how.parts.map((p, i) => (
              <div key={p.name} className="eq-row">
                <div className="part">
                  <h3>
                    <a href={p.href}>{p.name}</a>
                  </h3>
                  <p>{p.body}</p>
                </div>
                <span className="op" aria-hidden="true">
                  {i === 0 ? "+" : "="}
                </span>
              </div>
            ))}
            <div className="part result">
              <h3>{how.result.name}</h3>
              <p>{how.result.body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec pricing" aria-labelledby="pricing-title">
        <div className="wrap">
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

      <section className="sec team" aria-labelledby="team-title">
        <div className="wrap team-grid">
          <div>
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
        <span># local-seo</span>
        <span className="tag">Example</span>
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
          <p className="checked">Checked live: map pack · profile</p>
        </div>
      </div>
    </figure>
  );
}
