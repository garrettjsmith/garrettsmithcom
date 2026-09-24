"use client";

import { useId, useState } from "react";

const WHERE = ["Slack", "Teams", "Text thread", "Email"] as const;

// "Put me on your team" access request. Used inline on the landing page and
// dropped into the chat thread after a few replies.
export function Hire({ id, title, intro }: { id?: string; title?: readonly [string, string]; intro?: string }) {
  const [where, setWhere] = useState<(typeof WHERE)[number]>("Slack");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const uid = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, where, note }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong. Try again in a minute.");
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  return (
    <div className="hire" id={id}>
      <h2>
        {title ? title[0] : "Put me on"} <span>{title ? title[1] : "your team."}</span>
      </h2>
      {intro && <p>{intro}</p>}
      {!title && (
        <p>
          Add Garrett where your team already talks. Ask about rankings, reviews, or a suspended location the same way
          you&rsquo;d ask a coworker.
        </p>
      )}
      {state === "done" ? (
        <p className="done" role="status">
          Requested for {where}. The real Garrett reviews every request and will email {email}.
        </p>
      ) : (
        <form onSubmit={submit} aria-describedby={error ? `${uid}-err` : undefined}>
          <div className="where" role="group" aria-label="Where should Garrett work?">
            {WHERE.map((w) => (
              <button key={w} type="button" aria-pressed={where === w} onClick={() => setWhere(w)}>
                {w}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor={`${uid}-email`}>
            Work email
          </label>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="you@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="sr-only" htmlFor={`${uid}-note`}>
            Notes (optional)
          </label>
          <textarea
            id={`${uid}-note`}
            name="note"
            rows={1}
            autoComplete="off"
            placeholder="Optional: # of locations, goals…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="submit" type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Request access"}
          </button>
          {error && (
            <p className="err" id={`${uid}-err`} role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
