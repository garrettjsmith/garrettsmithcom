"use client";

import { useEffect, useRef, useState } from "react";

type KeyInfo = { id: string; label: string; hint: string; created: string };

export const openApiAccess = () => window.dispatchEvent(new Event("ag:api"));

// API keys for a member's own agents, plus how to connect. Opened from the header.
export function ApiAccess() {
  const ref = useRef<HTMLDialogElement>(null);
  const [keys, setKeys] = useState<KeyInfo[] | null>(null);
  const [max, setMax] = useState(5);
  const [label, setLabel] = useState("");
  const [fresh, setFresh] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [origin, setOrigin] = useState("https://garrettsmith.com");

  async function load() {
    const res = await fetch("/api/keys").catch(() => null);
    if (!res?.ok) return setError("Couldn\u2019t load your keys. Sign in again and retry.");
    const d = (await res.json()) as { keys: KeyInfo[]; max: number };
    setKeys(d.keys);
    setMax(d.max);
  }

  useEffect(() => {
    const open = () => {
      setOrigin(window.location.origin);
      setFresh("");
      setError("");
      setLabel("");
      ref.current?.showModal();
      void load();
    };
    window.addEventListener("ag:api", open);
    return () => window.removeEventListener("ag:api", open);
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    }).catch(() => null);
    const d = ((await res?.json().catch(() => ({}))) ?? {}) as { key?: string; error?: string };
    setBusy(false);
    if (!res?.ok || !d.key) return setError(d.error || "Couldn\u2019t create a key. Try again.");
    setFresh(d.key);
    setLabel("");
    void load();
  }

  async function revoke(k: KeyInfo) {
    if (!window.confirm(`Revoke "${k.label}"? Anything using it stops working right away.`)) return;
    const res = await fetch(`/api/keys?id=${encodeURIComponent(k.id)}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return setError("Couldn\u2019t revoke that key. Try again.");
    void load();
  }

  function copy(what: string, value: string) {
    void navigator.clipboard?.writeText(value).then(() => {
      setCopied(what);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  const mcpUrl = `${origin}/api/mcp`;
  const shown = fresh || "YOUR_KEY";
  const claudeCmd = `claude mcp add --transport http vgarrett ${mcpUrl} --header "Authorization: Bearer ${shown}"`;
  const curlCmd = `curl ${origin}/api/v1/ask -H "Authorization: Bearer ${shown}" -H "Content-Type: application/json" -d '{"question":"Why is Acme Plumbing missing from the map pack in Buffalo, NY?"}'`;
  const snippet = (name: string, title: string, value: string) => (
    <div className="api-snip">
      <div className="api-snip-head">
        <span>{title}</span>
        <button type="button" className="linkish" onClick={() => copy(name, value)}>
          {copied === name ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>{value}</pre>
    </div>
  );

  return (
    <dialog ref={ref} className="signin api">
      <h2>API and MCP</h2>
      <p>
        Plug vGarrett into your own AI agents. It answers with the same playbooks, live data, and memory of your
        business as here. Each question counts toward your monthly questions.
      </p>

      {fresh && (
        <div className="api-fresh" role="status">
          <strong>Your new key. Copy it now; it isn&rsquo;t shown again.</strong>
          <div className="api-key">
            <code>{fresh}</code>
            <button type="button" className="go" onClick={() => copy("key", fresh)}>
              {copied === "key" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <h3>Your keys</h3>
      {keys === null ? (
        <p className="api-muted">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="api-muted">No keys yet. Create one to connect an agent.</p>
      ) : (
        <ul className="api-keys">
          {keys.map((k) => (
            <li key={k.id}>
              <span>
                <strong>{k.label}</strong> <code>{k.hint}</code>
                <small>Created {new Date(k.created).toLocaleDateString()}</small>
              </span>
              <button type="button" className="linkish" onClick={() => void revoke(k)}>
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
      {keys !== null && keys.length < max && (
        <form onSubmit={create} className="api-new">
          <label className="sr-only" htmlFor="api-label">
            Name for the new key
          </label>
          <input
            id="api-label"
            maxLength={40}
            placeholder="Name it, e.g. Claude Code"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button className="go" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create key"}
          </button>
        </form>
      )}
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}

      <h3>Connect</h3>
      {snippet("url", "MCP server URL (send the key as a Bearer token)", mcpUrl)}
      {snippet("claude", "Claude Code", claudeCmd)}
      {snippet("curl", "Plain HTTP", curlCmd)}
      <p className="api-muted">
        MCP tools: <code>ask_vgarrett</code> and <code>get_brief</code>. HTTP: <code>POST /api/v1/ask</code> and{" "}
        <code>GET /api/v1/brief</code>. Send back the <code>thread_id</code> from an answer to ask a follow-up.
      </p>

      <div className="row">
        <button className="go" type="button" onClick={() => ref.current?.close()}>
          Done
        </button>
      </div>
    </dialog>
  );
}
