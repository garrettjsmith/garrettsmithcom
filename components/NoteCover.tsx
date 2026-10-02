import { Portal } from "./Stage.tsx";

// The cover every note shares: topic, the one-line takeaway, and the portal.
// Replaces the one-off images from the newsletter so the section looks like
// one thing. (The share image uses the same look with the title.)
export function NoteCover({ takeaway, topic, minutes, uid }: { takeaway: string; topic: string; minutes: number; uid: string }) {
  return (
    <div className="ncover">
      <div className="ncover-text">
        <span className="ncover-topic">{topic}</span>
        <span className="ncover-title">{takeaway}</span>
        <span className="ncover-date">{minutes} min read · Search Notes</span>
      </div>
      <Portal className="ncover-portal" uid={uid} />
    </div>
  );
}
