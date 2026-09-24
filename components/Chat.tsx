"use client";

import { useEffect, useRef, useState } from "react";
import { escapeHtml, renderChatHtml, visiblePartial } from "@/lib/garrett/format.ts";

type Turn = { role: "user" | "assistant"; content: string };
type BotMsg = {
  id: number;
  role: "bot";
  raw: string;
  done: boolean;
  status?: string;
  checked?: string[];
  playbooks?: string[];
  offline?: boolean;
  error?: string;
};
type UserMsg = { id: number; role: "user"; text: string };
type Item = UserMsg | BotMsg | { id: number; role: "hire" };

const QUESTIONS = [
  "Why am I not in the map pack?",
  "My listing got suspended. Now what?",
  "How do my reviews compare to competitors?",
  "Am I showing up in AI answers?",
];
const WHERE = ["Slack", "Teams", "Text thread", "Email"] as const;

function Mark({ className }: { className?: string }) {
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

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button className="mark" onClick={onClick} aria-label="Garrett Smith Labs home">
      <Mark />
      <span className="wordmark">
        Garrett Smith<span className="labs">Labs</span>
      </span>
    </button>
  );
}

function Field({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  useEffect(() => {
    if (!disabled && autoFocus) ref.current?.focus();
  }, [disabled, autoFocus]);
  return (
    <div className="field">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        placeholder={placeholder}
        aria-label="Ask Garrett"
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <button className="go" disabled={disabled || !value.trim()} onClick={onSubmit}>
        Ask
      </button>
    </div>
  );
}

function Bot({ m }: { m: BotMsg }) {
  const visible = visiblePartial(m.raw);
  let body: string;
  if (m.error) body = `<p class="err">${escapeHtml(m.error)}</p>`;
  else if (!visible.trim())
    body = `<div class="thinking"><span class="bars"><i></i><i></i><i></i></span><span>${escapeHtml(m.status ?? "Reading your question")}…</span></div>`;
  else body = renderChatHtml(visible) + (m.done ? "" : '<span class="cursor" aria-hidden="true"></span>');

  const traces: string[] = [];
  if (m.done && m.checked?.length)
    traces.push(`<div class="trace">Checked live: ${m.checked.map((n) => `<b>${escapeHtml(n)}</b>`).join("")}</div>`);
  else if (m.done && m.offline)
    traces.push('<div class="trace off">Answering from <b>experience only</b>. Live data isn\'t connected right now.</div>');
  if (m.done && m.playbooks?.length)
    traces.push(`<div class="trace">Playbook: ${m.playbooks.map((n) => `<b>${escapeHtml(n.replace(/-/g, " "))}</b>`).join("")}</div>`);

  return (
    <div className="msg bot">
      <Mark className="face" />
      {/* renderChatHtml and escapeHtml escape all model text before adding tags. */}
      <div className="said" dangerouslySetInnerHTML={{ __html: traces.join("") + body }} />
    </div>
  );
}

function Hire({ onDone }: { onDone?: () => void }) {
  const [where, setWhere] = useState<(typeof WHERE)[number]>("Slack");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

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
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setState("done");
      onDone?.();
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  return (
    <div className="hire">
      <h2>
        Put me on <span>your team.</span>
      </h2>
      <p>
        Add this Garrett where your team already talks. Ask about rankings, reviews, or a suspended location the same way
        you&apos;d ask a coworker. I remember your locations and competitors between conversations.
      </p>
      {state === "done" ? (
        <div className="done" role="status">
          Requested for {where}. The real Garrett reviews every one and will email {email}.
        </div>
      ) : (
        <>
          <div className="where" role="group" aria-label="Where should I work">
            {WHERE.map((w) => (
              <button key={w} type="button" aria-pressed={where === w} onClick={() => setWhere(w)}>
                {w}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <input
              type="email"
              placeholder="Your work email"
              required
              aria-label="Your work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="submit" type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : "Request access"}
            </button>
            <textarea
              rows={1}
              placeholder="Optional: how many locations, what you need help with"
              aria-label="Notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </form>
          {error && <p className="err">{error}</p>}
        </>
      )}
    </div>
  );
}

export function Chat({ banner }: { banner?: { text: string; bad?: boolean } }) {
  const [view, setView] = useState<"landing" | "chat">("landing");
  const [items, setItems] = useState<Item[]>([]);
  const [followups, setFollowups] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(true);
  const history = useRef<Turn[]>([]);
  const nextId = useRef(1);
  const replies = useRef(0);
  const hireShown = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const about = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items]);

  function showHire() {
    setView("chat");
    if (hireShown.current) return;
    hireShown.current = true;
    setItems((xs) => [...xs, { id: nextId.current++, role: "hire" }]);
  }

  function patchBot(id: number, patch: (m: BotMsg) => Partial<BotMsg>) {
    setItems((xs) => xs.map((x) => (x.id === id && x.role === "bot" ? { ...x, ...patch(x) } : x)));
  }

  async function ask(text: string) {
    text = text.trim();
    if (!text || busy) return;
    setBusy(true);
    setView("chat");
    setFollowups([]);
    setDraft("");
    const botId = nextId.current + 1;
    setItems((xs) => [...xs, { id: nextId.current++, role: "user", text }, { id: nextId.current++, role: "bot", raw: "", done: false }]);
    const turns: Turn[] = [...history.current, { role: "user", content: text }];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: turns, live }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; limited?: boolean };
        patchBot(botId, () => ({ done: true, error: data.error || "Couldn't reach me. Send it again." }));
        if (data.limited) showHire();
        return;
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      let final: { text: string } | null = null;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === "text") patchBot(botId, (m) => ({ raw: m.raw + ev.delta }));
          else if (ev.type === "status")
            patchBot(botId, () => ({ status: ev.kind === "live" ? `Checking ${ev.label}` : `Opening the ${ev.label} playbook` }));
          else if (ev.type === "done") {
            final = ev;
            patchBot(botId, () => ({ raw: ev.text, done: true, checked: ev.checked, playbooks: ev.playbooks, offline: ev.offline }));
            setFollowups(ev.followups ?? []);
          } else if (ev.type === "error") patchBot(botId, () => ({ done: true, error: ev.message }));
        }
      }
      if (final) {
        history.current = [...turns, { role: "assistant", content: final.text }];
        replies.current++;
        if (replies.current >= 3) showHire();
      } else patchBot(botId, (m) => (m.error ? {} : { done: true, error: "The connection dropped. Send it again." }));
    } catch {
      patchBot(botId, () => ({ done: true, error: "Couldn't reach me. Send it again." }));
    } finally {
      setBusy(false);
    }
  }

  const bannerEl = banner && <div className={banner.bad ? "banner bad" : "banner"} role="status">{banner.text}</div>;
  const aboutBtn = (
    <button className="linkish" onClick={() => about.current?.showModal()}>
      What is this?
    </button>
  );

  return (
    <>
      {view === "landing" ? (
        <section className="view on" id="landing">
          {bannerEl}
          <header>
            <Brand />
            <div className="hdr-right">{aboutBtn}</div>
          </header>
          <div className="body">
            <div className="wrap">
              <div className="hero">
                <h1>
                  Ask me why you&apos;re not in the <mark>map pack.</mark>
                </h1>
                <p>
                  An AI version of Garrett Smith, built on 20+ years of local search work and wired to live ranking data.
                  Give me a business name and a city and I&apos;ll go look.
                </p>
              </div>
              <Field
                value={draft}
                onChange={setDraft}
                onSubmit={() => ask(draft)}
                disabled={busy}
                placeholder="e.g. Smith Plumbing in Buffalo, NY dropped out of the pack"
              />
              <div className="chips">
                {QUESTIONS.map((q) => (
                  <button key={q} className="chip q" onClick={() => ask(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <div className="chips">
                <button className="chip c" onClick={() => ask("We manage 50+ locations")}>
                  We manage 50+ locations
                </button>
                <button className="chip c" onClick={showHire}>
                  Add you to our Slack
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="view on" id="chat">
          {bannerEl}
          <header>
            <Brand onClick={() => setView("landing")} />
            <div className="hdr-right">
              {aboutBtn}
              <button className="hdr-cta" onClick={showHire}>
                Add me to Slack
              </button>
            </div>
          </header>
          <div className="body" ref={scroller}>
            <div className="thread" aria-live="polite">
              {items.map((it) =>
                it.role === "user" ? (
                  <div key={it.id} className="msg user">
                    {it.text}
                  </div>
                ) : it.role === "bot" ? (
                  <Bot key={it.id} m={it} />
                ) : (
                  <Hire key={it.id} />
                ),
              )}
            </div>
          </div>
          <div className="dock">
            <div className="inner">
              <div className="followups">
                {followups.map((q) => (
                  <button key={q} className="chip c" onClick={() => ask(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <Field value={draft} onChange={setDraft} onSubmit={() => ask(draft)} disabled={busy} placeholder="Keep going…" autoFocus />
              <p className="note">AI, not the real Garrett. Anything that could trigger a suspension goes to a human first.</p>
            </div>
          </div>
        </section>
      )}

      <dialog ref={about}>
        <h3>What this is</h3>
        <p>
          An experiment out of Garrett Smith Labs: an expert you can talk to here, then add to your team&apos;s Slack and
          keep using like a coworker.
        </p>
        <p>
          It runs on Claude with Garrett&apos;s{" "}
          <a href="https://github.com/garrettjsmith/localseoskills">Local SEO Skills</a> as its playbook and{" "}
          <a href="https://localseodata.com">Local SEO Data</a> for live rankings, profiles, and reviews, so it pulls
          real numbers instead of talking in generalities.
        </p>
        <div className="row">
          <label className="toggle">
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> Use live data
          </label>
          <button className="go" onClick={() => about.current?.close()}>
            Got it
          </button>
        </div>
      </dialog>
    </>
  );
}
