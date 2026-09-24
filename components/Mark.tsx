// The round Garrett illustration: wild hair, round glasses, mismatched eyes.
export function Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#3DFF2E" stroke="#000" strokeWidth="3.5" />
      <path d="M18 34c0-9 6-14 14-14s14 5 14 14c0 11-6 19-14 19s-14-8-14-19z" fill="#fff" stroke="#000" strokeWidth="2.6" />
      <path d="M15.5 34.5 13 24l4.6 2.4L16.4 15l5.4 5.2L23.6 8.5l5.2 7.4L34.6 6l3.4 10.4L45 11.5l.4 9.6 5.4-3-2.6 16.4c.2-10.6-5.4-16.6-16.2-16.6S15.3 24 15.5 34.5z" fill="#000" />
      <circle cx="25.5" cy="34" r="6.2" fill="#fff" stroke="#000" strokeWidth="2.4" />
      <circle cx="39.5" cy="34" r="6.2" fill="#fff" stroke="#000" strokeWidth="2.4" />
      <path d="M31.7 34h1.6M19.3 33l-2.6-1.4M45.7 33l2.6-1.4" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="26.4" cy="34.4" r="2.3" fill="#000" />
      <circle cx="38.4" cy="33.4" r="1.5" fill="#000" />
      <path d="M24.2 44.6c2.6-2.4 5.2-1.6 7.8-.4 2.6-1.2 5.2-2 7.8.4-2 1-4 3.4-7.8 1.4-3.8 2-5.8-.4-7.8-1.4z" fill="#000" />
      <path d="M30.4 50.2h3.2v3.4h-3.2z" fill="#000" />
    </svg>
  );
}
