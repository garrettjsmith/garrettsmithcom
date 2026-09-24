import { Mark } from "./Mark.tsx";

// Spiral arms for the portal, computed once. Each arm is an Archimedean
// spiral from the rim toward the center, offset around the circle.
const ARMS = Array.from({ length: 7 }, (_, arm) => {
  const pts: string[] = [];
  const start = (arm / 7) * Math.PI * 2;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const r = 96 - t * 88;
    const a = start + t * Math.PI * 2.4;
    pts.push(`${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`);
  }
  return { d: `M${pts.join(" L")}`, w: 7 + (arm % 3) * 3, light: arm % 2 === 0 };
});

// The green portal the logomark comes through. SVG spiral with a displacement
// filter for the goopy rim; spins slowly unless reduced motion is on.
export function Portal({ className }: { className?: string }) {
  const id = className === "mini" ? "pm" : "p";
  return (
    <div className={`portal ${className ?? ""}`} aria-hidden="true">
      <div className="portal-glow" />
      <svg className="portal-svg" viewBox="0 0 200 200">
        <defs>
          <radialGradient id={`${id}-base`}>
            <stop offset="0" stopColor="#F2FFEC" />
            <stop offset=".28" stopColor="#9DFF86" />
            <stop offset=".7" stopColor="#2FEA22" />
            <stop offset="1" stopColor="#0C9F14" />
          </radialGradient>
          <filter id={`${id}-goo`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="9" />
          </filter>
          <clipPath id={`${id}-clip`}>
            <circle cx="100" cy="100" r="92" />
          </clipPath>
          <filter id={`${id}-soft`}>
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>
        <g filter={`url(#${id}-goo)`}>
          <circle cx="100" cy="100" r="92" fill={`url(#${id}-base)`} />
          <g clipPath={`url(#${id}-clip)`}>
          <g className="portal-spin" filter={`url(#${id}-soft)`}>
            {ARMS.map((a, i) => (
              <path
                key={i}
                d={a.d}
                fill="none"
                stroke={a.light ? "#E4FFD9" : "#0FA616"}
                strokeOpacity={a.light ? 0.8 : 0.55}
                strokeWidth={a.w}
                strokeLinecap="round"
              />
            ))}
          </g>
          </g>
          <circle cx="100" cy="100" r="92" fill="none" stroke="#0B8A12" strokeWidth="5" strokeOpacity=".6" />
        </g>
      </svg>
      <Mark className="portal-mark" />
    </div>
  );
}

const PACK = [
  { rank: 1, name: "Lakeside Plumbing Co.", rating: "4.9", reviews: 412 },
  { rank: 2, name: "Northtown Rooter", rating: "4.8", reviews: 268 },
  { rank: 3, name: "Elm Street Plumbing", rating: "4.7", reviews: 189 },
];

// Hero visual: the portal, with a sample answer card floating in front of it
// so visitors see a real-looking, data-backed reply before they type.
export function HeroStage() {
  return (
    <div className="stage">
      <Portal />
      <figure className="demo" aria-label="Example answer from Ask Garrett">
        <div className="demo-head">
          <Mark className="demo-avatar" />
          <span className="demo-name">Garrett</span>
          <span className="demo-tag">Example</span>
        </div>
        <p className="demo-q">Why did Smith Plumbing drop out of the pack in Buffalo?</p>
        <div className="demo-data">
          <p className="demo-label">
            <span className="live-dot" aria-hidden="true" /> Map pack · &ldquo;plumber buffalo ny&rdquo;
          </p>
          <ol>
            {PACK.map((b) => (
              <li key={b.rank}>
                <span className="r">{b.rank}</span>
                <span className="n">{b.name}</span>
                <span className="s">
                  ★ {b.rating} <em>({b.reviews})</em>
                </span>
              </li>
            ))}
            <li className="you">
              <span className="r">7</span>
              <span className="n">Smith Plumbing</span>
              <span className="s">
                ★ 4.6 <em>(61)</em>
              </span>
            </li>
          </ol>
        </div>
        <p className="demo-a">
          You&rsquo;re #7. The top three average <b>4× your review count</b>, and two sit closer to downtown. Start with
          review velocity; your category is fine.
        </p>
      </figure>
    </div>
  );
}
