"use client";

import { COPY } from "@/content/copy.ts";
import { requestSignIn } from "./billing.ts";
import { PlanButton } from "./PlanButton.tsx";

// Where the free taste ends: pay to keep going, or sign in if you already did.
export function Gate() {
  const solo = COPY.pricing.plans.find((p) => p.id === "solo")!;
  const teams = COPY.pricing.plans.find((p) => p.id === "teams")!;
  return (
    <div className="hire gate">
      <h2>
        {COPY.gate.title[0]} <span>{COPY.gate.title[1]}</span>
      </h2>
      <p>{COPY.gate.body}</p>
      <div className="gate-actions">
        <PlanButton plan="solo" primary label={`Keep going for ${solo.price}/mo`} />
        <PlanButton plan="teams" label={`${teams.label}: ${teams.price}/mo`} />
      </div>
      <p className="gate-foot">
        Already a member?{" "}
        <button type="button" className="textlink" onClick={requestSignIn}>
          Sign in
        </button>
        . By subscribing you agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
      </p>
    </div>
  );
}
