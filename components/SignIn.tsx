"use client";

import { useEffect, useId, useRef, useState } from "react";

// Email-link sign-in for members. Opened by requestSignIn() from anywhere.
export function SignIn() {
  const ref = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const uid = useId();

  useEffect(() => {
    const open = () => {
      setState("idle");
      setError("");
      ref.current?.showModal();
    };
    window.addEventListener("ag:signin", open);
    return () => window.removeEventListener("ag:signin", open);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    const res = await fetch("/api/auth/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    if (!res?.ok) {
      const data = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
      setError(data?.error || "Couldn't send the link. Try again.");
      setState("idle");
      return;
    }
    setState("sent");
  }

  return (
    <dialog ref={ref} className="signin">
      <h2>Sign in</h2>
      {state === "sent" ? (
        <p role="status">
          If {email} has an Ask Garrett plan, a sign-in link is on its way. It works for an hour.
        </p>
      ) : (
        <form onSubmit={submit}>
          <p>We&rsquo;ll email you a link. No password.</p>
          <label className="sr-only" htmlFor={`${uid}-email`}>
            Email
          </label>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && (
            <p className="err" role="alert">
              {error}
            </p>
          )}
          <div className="row">
            <button className="go" type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : "Email me a link"}
            </button>
            <button type="button" className="linkish" onClick={() => ref.current?.close()}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {state === "sent" && (
        <div className="row">
          <button className="go" onClick={() => ref.current?.close()}>
            Done
          </button>
        </div>
      )}
    </dialog>
  );
}
