"use client";

// Browser-side billing helpers.

export async function startCheckout(plan: "solo" | "teams"): Promise<string | null> {
  try {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
      return null;
    }
    return data.error || "Couldn't start checkout.";
  } catch {
    return "Couldn't reach the server. Check your connection.";
  }
}

export async function openPortal(): Promise<string | null> {
  const res = await fetch("/api/billing/portal", { method: "POST" }).catch(() => null);
  const data = (await res?.json().catch(() => ({}))) as { url?: string; error?: string } | undefined;
  if (data?.url) {
    window.location.href = data.url;
    return null;
  }
  return data?.error || "Couldn't open billing.";
}

/** Anything on the page can ask for the sign-in dialog. */
export function requestSignIn() {
  window.dispatchEvent(new Event("ag:signin"));
}
