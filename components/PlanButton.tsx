"use client";

import { useState } from "react";
import { startCheckout } from "./billing.ts";

export function PlanButton({ plan, label, primary }: { plan: "solo" | "teams"; label: string; primary?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="plan-cta">
      <button
        className={primary ? "buy primary" : "buy"}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          const err = await startCheckout(plan);
          if (err) {
            setError(err);
            setBusy(false);
          }
        }}
      >
        {busy ? "Opening checkout…" : label}
      </button>
      {error && (
        <p className="plan-err" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
