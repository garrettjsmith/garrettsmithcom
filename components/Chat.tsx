"use client";

import { useEffect, useRef, useState } from "react";
import { COPY } from "@/content/copy.ts";
import { escapeHtml, renderChatHtml, visiblePartial } from "@/lib/garrett/format.ts";
import { openPortal, requestSignIn } from "./billing.ts";
import { Gate } from "./Gate.tsx";
import { LandingSections } from "./Landing.tsx";
import { Mark } from "./Mark.tsx";
import { SignIn } from "./SignIn.tsx";
import { HeroStage } from "./Stage.tsx";

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
type Item = UserMsg | BotMsg | { id: number; role: "hire"; gate?: boolean };
type Saved = { items: Item[]; history: Turn[]; followups: string[]; remaining: number | null; locked: boolean };

const SAVE_KEY = "ask-garrett:conversation";

// Only focus the input for mouse-and-keyboard users; on phones it opens the
// keyboard over the answer they're trying to read.
const finePointer = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function Wordmark() {
  return (
    <>
      <Mark />
      <span className="wordmark" translate="no">
        Garrett Smith <span className="labs">Labs</span>
      </span>
    </>
  );
}

function Field({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const local = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? local;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value, ref]);
  return (
    <div className="field">
      <textarea
        ref={ref}
        rows={1}
        name="question"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        aria-label="Ask Garrett a question"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <button className="go" disabled={disabled || !value.trim()} onClick={onSubmit}>
        {disabled ? "…" : "Ask"}
      </button>
    </div>
  );
}

function Bot({ m }: { m: BotMsg }) {
  const visible = visiblePartial(m.raw);
  let body: string;
  if (m.error) body = `<p class="err">${escapeHtml(m.error)}</p>`;
  else if (!visible.trim())
    body = `<div class="thinking"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span><span>${escapeHtml(m.status ?? "Reading your question")}…</span></div>`;
  else body = renderChatHtml(visible) + (m.done ? "" : '<span class="cursor" aria-hidden="true"></span>');

  const traces: string[] = [];
  if (m.done && m.checked?.length)
    traces.push(`<div class="trace">Checked live: ${m.checked.map((n) => `<b>${escapeHtml(n)}</b>`).join("")}</div>`);
  else if (m.done && m.offline)
    traces.push("<div class=\"trace off\">Answering from <b>experience only</b>. Live data isn&rsquo;t connected right now.</div>");
  if (m.done && m.playbooks?.length)
    traces.push(`<div class="trace">Playbook: ${m.playbooks.map((n) => `<b>${escapeHtml(n.replace(/-/g, " "))}</b>`).join("")}</div>`);

  return (
    <div className="msg bot" id={`m-${m.id}`}>
      <Mark className="face" />
      {/* renderChatHtml and escapeHtml escape all model text before adding tags. */}
      <div className="said" aria-busy={!m.done} dangerouslySetInnerHTML={{ __html: traces.join("") + body }} />
    </div>
  );
}

export function Chat({ banner }: { banner?: { text: string; bad?: boolean } }) {
  const [view, setView] = useState<"landing" | "chat">("landing");
  const [items, setItems] = useState<Item[]>([]);
  const [followups, setFollowups] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState("");
  const history = useRef<Turn[]>([]);
  const nextId = useRef(1);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [member, setMember] = useState<{ email: string; plan: string; billing: boolean } | null>(null);
  const pushedChat = useRef(false);
  const scrollTarget = useRef<{ id: number; block: ScrollLogicalPosition } | null>(null);
  const chatInput = useRef<HTMLTextAreaElement>(null);
  const about = useRef<HTMLDialogElement>(null);

  // Restore the conversation after a refresh, and follow the back button.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SAVE_KEY) || "null") as Saved | null;
      if (saved?.items?.length) {
        setItems(saved.items);
        setFollowups(saved.followups);
        history.current = saved.history;
        setRemaining(saved.remaining ?? null);
        setLocked(Boolean(saved.locked));
        nextId.current = Math.max(...saved.items.map((i) => i.id)) + 1;
        if (location.hash === "#chat") setView("chat");
      } else if (location.hash === "#chat") {
        window.history.replaceState(null, "", location.pathname + location.search);
      }
    } catch {
      /* storage blocked or corrupt: start fresh */
    }
    const onPop = () => setView(location.hash === "#chat" ? "chat" : "landing");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Members skip the free-question gate entirely.
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: { member: { email: string; plan: string; billing: boolean } | null }) => {
        if (!d.member) return;
        setMember(d.member);
        setLocked(false);
        setRemaining(null);
        setItems((xs) => xs.filter((i) => !(i.role === "hire" && i.gate)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (busy) return;
    try {
      const done = items.filter((i) => i.role !== "bot" || i.done);
      sessionStorage.setItem(SAVE_KEY, JSON.stringify({ items: done, history: history.current, followups, remaining, locked } satisfies Saved));
    } catch {
      /* ignore */
    }
  }, [items, followups, busy, remaining, locked]);

  // Scroll a new question to the top so the answer streams in below it,
  // instead of chasing the bottom on every word.
  useEffect(() => {
    const t = scrollTarget.current;
    if (!t) return;
    scrollTarget.current = null;
    document.getElementById(`m-${t.id}`)?.scrollIntoView({ block: t.block });
  }, [items, view]);

  function goChat() {
    setView("chat");
    if (location.hash !== "#chat") {
      window.history.pushState(null, "", "#chat");
      pushedChat.current = true;
    }
  }

  function goLanding() {
    if (pushedChat.current) {
      pushedChat.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", location.pathname + location.search);
      setView("landing");
    }
  }

  // The header button in the chat: show the plans without locking the chat.
  function showPlans() {
    goChat();
    setItems((xs) => {
      const gate = xs.find((i) => i.role === "hire" && i.gate);
      if (gate) {
        scrollTarget.current = { id: gate.id, block: "start" };
        return [...xs];
      }
      const id = nextId.current++;
      scrollTarget.current = { id, block: "start" };
      return [...xs, { id, role: "hire", gate: true }];
    });
  }

  // Out of free questions: the conversation ends in the access form.
  function lockChat() {
    goChat();
    setLocked(true);
    setFollowups([]);
    setItems((xs) => {
      const gate = xs.find((i) => i.role === "hire" && i.gate);
      if (gate) {
        scrollTarget.current = { id: gate.id, block: "start" };
        return [...xs];
      }
      const id = nextId.current++;
      scrollTarget.current = { id, block: "start" };
      return [...xs, { id, role: "hire", gate: true }];
    });
  }

  function patchBot(id: number, patch: (m: BotMsg) => Partial<BotMsg>) {
    setItems((xs) => xs.map((x) => (x.id === id && x.role === "bot" ? { ...x, ...patch(x) } : x)));
  }

  async function ask(text: string) {
    text = text.trim();
    if (!text || busy) return;
    if (locked && !member) return lockChat();
    setBusy(true);
    goChat();
    setFollowups([]);
    setDraft("");
    setAnnounce("");
    const userId = nextId.current++;
    const botId = nextId.current++;
    scrollTarget.current = { id: userId, block: "start" };
    setItems((xs) => [...xs, { id: userId, role: "user", text }, { id: botId, role: "bot", raw: "", done: false }]);
    const turns: Turn[] = [...history.current, { role: "user", content: text }];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: turns }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; limited?: boolean };
        const error = data.error || "I couldn't connect. Check your connection and send it again.";
        patchBot(botId, () => ({ done: true, error }));
        setAnnounce(error);
        if (data.limited) lockChat();
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
            if (typeof ev.remaining === "number") setRemaining(ev.remaining);
            setAnnounce(`Garrett replied: ${ev.text}`);
          } else if (ev.type === "error") {
            patchBot(botId, () => ({ done: true, error: ev.message }));
            setAnnounce(ev.message);
          }
        }
      }
      if (final) {
        history.current = [...turns, { role: "assistant", content: final.text }];
        if ((final as { remaining?: number }).remaining === 0) lockChat();
      } else patchBot(botId, (m) => (m.error ? {} : { done: true, error: "The connection dropped. Send it again." }));
    } catch {
      patchBot(botId, () => ({ done: true, error: "I couldn't connect. Check your connection and send it again." }));
    } finally {
      setBusy(false);
      if (finePointer()) chatInput.current?.focus();
    }
  }

  const bannerEl = banner && (
    <div className={banner.bad ? "banner bad" : "banner"} role="status">
      {banner.text}
    </div>
  );
  const aboutBtn = (
    <button className="linkish" onClick={() => about.current?.showModal()}>
      What is this?
    </button>
  );
  const cta = (onClick: () => void) =>
    member ? (
      <div className="account">
        {member.billing && (
          <button className="linkish" onClick={() => void openPortal()}>
            Billing
          </button>
        )}
        <button
          className="linkish always"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
            setMember(null);
          }}
        >
          Sign out
        </button>
      </div>
    ) : (
      <>
        <button className="linkish always" onClick={requestSignIn}>
          Sign in
        </button>
        <button className="hdr-cta" onClick={onClick}>
          <span className="long">{COPY.cta}</span>
          <span className="short">{COPY.ctaShort}</span>
        </button>
      </>
    );

  return (
    <>
      {view === "landing" ? (
        <section className="view on" id="landing">
          {bannerEl}
          <header>
            <div className="mark">
              <Wordmark />
            </div>
            <div className="hdr-right">
              {aboutBtn}
              {cta(() => document.getElementById("pricing")?.scrollIntoView({ block: "start" }))}
            </div>
          </header>
          <main className="body">
            <div className="hero-wrap">
              <div className="wrap hero-grid">
                <div className="hero">
                  <p className="eyebrow">
                    <span className="live-dot" aria-hidden="true" />
                    {COPY.hero.eyebrow}
                  </p>
                  <h1>
                    {COPY.hero.headline} <mark>{COPY.hero.highlight}</mark>
                  </h1>
                  <p className="sub">{COPY.hero.subhead}</p>
                  <Field value={draft} onChange={setDraft} onSubmit={() => ask(draft)} disabled={busy} placeholder={COPY.hero.placeholder} />
                  <p className="try">{COPY.hero.tryLine}</p>
                  <div className="chips">
                    {COPY.questions.map((q) => (
                      <button key={q} className="chip q" onClick={() => ask(q)}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                <HeroStage />
              </div>
            </div>
            <LandingSections />
          </main>
        </section>
      ) : (
        <section className="view on" id="chat">
          {bannerEl}
          <header>
            <button className="mark" onClick={goLanding} aria-label="Back to the start">
              <Wordmark />
            </button>
            <div className="hdr-right">
              {aboutBtn}
              {cta(showPlans)}
            </div>
          </header>
          <main className="body">
            <h1 className="sr-only">Ask Garrett</h1>
            <div className="thread">
              {items.map((it) =>
                it.role === "user" ? (
                  <div key={it.id} id={`m-${it.id}`} className="msg user">
                    {it.text}
                  </div>
                ) : it.role === "bot" ? (
                  <Bot key={it.id} m={it} />
                ) : (
                  <div key={it.id} id={`m-${it.id}`}>
                    <Gate />
                  </div>
                ),
              )}
            </div>
          </main>
          <div className="dock">
            <div className="inner">
              {locked ? (
                <div className="locked">
                  <p>{COPY.gate.locked}</p>
                  <button className="go" onClick={lockChat}>
                    See plans
                  </button>
                </div>
              ) : (
                <>
                  {followups.length > 0 && (
                    <div className="followups">
                      {followups.map((q) => (
                        <button key={q} className="chip c" onClick={() => ask(q)}>
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                  <Field value={draft} onChange={setDraft} onSubmit={() => ask(draft)} disabled={busy} placeholder="Keep going…" inputRef={chatInput} />
                  {remaining !== null && remaining > 0 && remaining <= 2 && <p className="left">{COPY.gate.remaining(remaining)}</p>}
                </>
              )}
              <p className="disclaimer">{COPY.disclaimer}</p>
            </div>
          </div>
        </section>
      )}

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <SignIn />

      <dialog ref={about}>
        <h2>What this is</h2>
        <p>
          Ask Garrett is an AI version of Garrett Smith: his local search playbooks, his rules, and live data, available
          to anyone for a fraction of what an hour of his time costs.
        </p>
        <p>
          It runs on Claude with Garrett&rsquo;s <a href="https://github.com/garrettjsmith/localseoskills">Local SEO Skills</a>{" "}
          as its playbook and <a href="https://localseodata.com">Local SEO Data</a> for live rankings, profiles, and
          reviews, so it pulls real numbers instead of talking in generalities.
        </p>
        <div className="row">
          <button className="go" onClick={() => about.current?.close()}>
            Got it
          </button>
        </div>
      </dialog>
    </>
  );
}
