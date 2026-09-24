import { think } from "./garrett/brain.ts";
import { renderChatHtml } from "./garrett/format.ts";
import { allBriefKeys, getBrief, saveBrief, takeDueReminders, type Brief, type Business } from "./garrett/brief.ts";
import { callLsd } from "./lsd/client.ts";
import { sendEmail, threadKey } from "./email.ts";
import { getActiveMember } from "./members.ts";
import { signToken } from "./signed.ts";
import { getStore } from "./store.ts";

// The weekly check-in: for every member with a brief, re-check what matters,
// compare it with last time, and email what changed, review replies to post,
// due reminders, and the next step. The first check-in of each month adds a
// competitor look, an AI answers snapshot, and profile post drafts.
//
// Adapted from Local SEO Skills' scheduled tasks (rankings monitor, review
// velocity, GBP change monitor, review response drafts, post drafts, weekly
// and monthly reports), folded into one email so members get one useful
// message a week instead of six.

const SITE = (process.env.SITE_URL || "https://garrettsmith.com").replace(/\/$/, "");
const MAX_BUSINESSES_PER_CHECKIN = 3;
const MAX_KEYWORDS = 2;

type J = Record<string, any>;
const today = () => new Date().toISOString().slice(0, 10);

/** ISO week id like 2026-W39, so a re-run in the same week never double-sends. */
export function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const year = t.getUTCFullYear();
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Where the business sits in a local pack result, matching loosely on name. */
export function positionIn(results: J[] | undefined, name: string): number | null {
  const want = norm(name);
  const hit = (results ?? []).find((r) => {
    const got = norm(String(r?.name ?? ""));
    return got && (got.includes(want) || want.includes(got));
  });
  return hit ? Number(hit.rank ?? hit.position) || null : null;
}

const PROFILE_FIELDS = ["name", "address", "phone", "website", "categories", "hours", "description"] as const;

/** Profile fields that changed since the last check-in (edits by the owner, Google, or anyone else). */
export function profileChanges(before: J | undefined, after: J | undefined): string[] {
  if (!before || !after) return [];
  return PROFILE_FIELDS.filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null)).map(
    (k) => `${k}: ${JSON.stringify(before[k] ?? null).slice(0, 120)} → ${JSON.stringify(after[k] ?? null).slice(0, 120)}`,
  );
}

async function check(tool: string, input: J, scope: string): Promise<J | null> {
  const r = await callLsd(tool, input, scope);
  if (!r.ok) return null;
  try {
    return JSON.parse(r.content) as J;
  } catch {
    return null;
  }
}

/** Pull this week's data for one business and work out what changed. */
export async function gather(biz: Business, scope: string, monthly: boolean) {
  const location = biz.city;
  if (!location) return { skipped: "No city on file yet, so there's nothing to check. Ask them for it." };
  const keywords = biz.keywords.slice(0, MAX_KEYWORDS);
  const [packs, profile, reviews] = await Promise.all([
    Promise.all(keywords.map((keyword) => check("local_pack", { keyword, location }, scope))),
    check("business_profile", { business_name: biz.name, location }, scope),
    check("google_reviews", { business_name: biz.name, location, limit: 10 }, scope),
  ]);

  const ranks = keywords.map((keyword, i) => ({ keyword, position: packs[i] ? positionIn(packs[i]!.results, biz.name) : null }));
  const lastRanks = new Map((biz.baseline?.ranks ?? []).map((r) => [r.keyword, r.position]));
  const rankLines = keywords.map((keyword, i) => ({
    keyword,
    now: packs[i] ? (ranks[i].position ?? "not in the top 3") : "check failed",
    last_check: lastRanks.has(keyword) ? (lastRanks.get(keyword) ?? "not in the top 3") : "first check",
    top_3: (packs[i]?.results ?? []).slice(0, 3).map((r: J) => `${r.rank}. ${r.name} (${r.rating}★, ${r.reviews_count} reviews)`),
  }));

  const profileNow = profile?.matched === false ? undefined : profile ?? undefined;
  const snapshot = profileNow ? Object.fromEntries(PROFILE_FIELDS.map((k) => [k, profileNow[k] ?? null])) : undefined;
  const changes = profileChanges(biz.baseline?.profile, snapshot);

  const since = biz.baseline?.reviews?.latest ?? "";
  const recent: J[] = reviews?.recent ?? [];
  const newReviews = since ? recent.filter((r) => String(r.date) > since) : recent.slice(0, 3);

  const extra: J = {};
  if (monthly && keywords[0]) {
    const [gap, ai] = await Promise.all([
      check("competitor_gap", { business_name: biz.name, location, keyword: keywords[0] }, scope),
      check("ai_mode", { keyword: `best ${keywords[0]} in ${location}`, location }, scope),
    ]);
    extra.competitor_gap = gap ?? "check failed";
    extra.ai_mode = ai ? { businesses_named: ai.businesses_named, answer_excerpt: String(ai.answer ?? "").slice(0, 800) } : "check failed";
  }

  const baseline: Business["baseline"] = {
    date: today(),
    profile: snapshot ?? biz.baseline?.profile,
    ranks: ranks.map((r, i) => (packs[i] ? r : { keyword: r.keyword, position: lastRanks.get(r.keyword) ?? null })),
    reviews: {
      count: profileNow?.reviews_count ?? reviews?.total_reviews ?? biz.baseline?.reviews?.count,
      rating: profileNow?.rating ?? reviews?.average_rating ?? biz.baseline?.reviews?.rating,
      latest: recent.map((r) => String(r.date)).sort().at(-1) ?? since,
    },
  };

  return {
    data: {
      last_check_in: biz.baseline?.date ?? "none (this is the first)",
      map_pack: rankLines,
      reviews: {
        total_now: baseline.reviews?.count ?? "unknown",
        total_last_check: biz.baseline?.reviews?.count ?? "first check",
        rating_now: baseline.reviews?.rating ?? "unknown",
        new_since_last_check: newReviews,
      },
      profile: profileNow
        ? { changes_since_last_check: biz.baseline?.profile ? changes : "first check (baseline saved)", photos: profileNow.photos_count }
        : "check failed",
      ...extra,
    },
    baseline,
  };
}

export type CheckinOutcome = { key: string; status: "sent" | "skipped" | "failed"; detail?: string };

/** Run one member's check-in. `force` ignores the once-a-week guard (for testing). */
export async function checkinFor(key: string, opts: { dryRun?: boolean; force?: boolean; now?: Date } = {}): Promise<CheckinOutcome> {
  const now = opts.now ?? new Date();
  if (!key.startsWith("email:")) return { key, status: "skipped", detail: "not an email member" };
  const email = key.slice("email:".length);
  const [brief, member] = await Promise.all([getBrief(key), getActiveMember(email)]);
  if (!member) return { key, status: "skipped", detail: "not an active member" };
  if (!brief?.businesses.length) return { key, status: "skipped", detail: "no business on file" };
  if (!brief.checkins) return { key, status: "skipped", detail: "check-ins paused" };

  const week = isoWeek(now);
  const store = getStore();
  if (!opts.dryRun && !opts.force && !(await store.claim(`checkin:sent:${key}:${week}`, 14 * 86_400))) {
    return { key, status: "skipped", detail: `already sent for ${week}` };
  }
  const month = now.toISOString().slice(0, 7);
  const monthly = opts.dryRun ? now.getUTCDate() <= 7 : await store.claim(`checkin:monthly:${key}:${month}`, 40 * 86_400);

  const sections: string[] = [];
  const businesses = brief.businesses.slice(0, MAX_BUSINESSES_PER_CHECKIN);
  for (const biz of businesses) {
    const got = await gather(biz, key, monthly);
    const due = takeDueReminders(biz, now.toISOString().slice(0, 10));
    if ("baseline" in got && got.baseline) biz.baseline = got.baseline;
    sections.push(
      `<business name="${biz.name}">\n${JSON.stringify({ ...("data" in got ? got.data : { note: got.skipped }), due_reminders: due.map((r) => r.text) }, null, 1)}\n</business>`,
    );
  }
  // Save baselines and reminder dates before writing, so the brief tools in
  // the model call below build on them.
  if (!opts.dryRun) await saveBrief(brief);

  const request =
    `Write this ${monthly ? "month's first (monthly)" : "week's"} check-in email for ${email}. ` +
    `Today is ${now.toISOString().slice(0, 10)}. Live data pulled just now, per business:\n\n${sections.join("\n\n")}`;
  let text: string;
  try {
    const result = await think({
      channel: "checkin",
      teamId: key,
      readOnly: opts.dryRun,
      messages: [{ role: "user", content: request }],
      live: false,
      guard: false,
    });
    text = result.text.trim();
  } catch (err) {
    // Let the next run try again.
    if (!opts.dryRun) await store.set(`checkin:sent:${key}:${week}`, 0, 1);
    return { key, status: "failed", detail: (err as Error).message };
  }
  if (!text) return { key, status: "failed", detail: "empty email" };

  const names = businesses.map((b) => b.name).join(", ");
  const subject = `${monthly ? "Monthly" : "Weekly"} check-in: ${names}`;
  const pause = `${SITE}/api/checkin/pause?t=${signToken("checkin-pause", { key }, 180 * 86_400)}`;
  const footer = `— Garrett (AI)\nReply to this email to ask about anything here. AI, not the real Garrett.\nDon't want these? Pause check-ins: ${pause}`;
  if (opts.dryRun) {
    console.log(`\n===== ${subject} → ${email}\n${text}\n\n${footer}\n`);
    return { key, status: "sent", detail: "dry run" };
  }
  const html =
    `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0E1410">` +
    renderChatHtml(text) +
    `<p style="font-size:13px;color:#56605A">— Garrett (AI)<br>Reply to this email to ask about anything here. AI, not the real Garrett.<br>` +
    `<a href="${pause}" style="color:#56605A">Pause check-ins</a></p></div>`;
  await sendEmail({ to: email, subject, text: `${text}\n\n${footer}`, html });
  // A reply lands in the normal email thread for this subject; seed it with the
  // check-in so "what about #2?" has something to point at.
  await store.set(
    `email:conv:${email}:${threadKey(subject)}`,
    [
      { role: "user", content: `(Scheduled ${monthly ? "monthly" : "weekly"} check-in)` },
      { role: "assistant", content: text.slice(0, 5500) },
    ],
    60 * 86_400,
  );
  return { key, status: "sent" };
}

/** Every member's check-in, one at a time (keeps API and data-credit use smooth). */
export async function runCheckins(opts: { dryRun?: boolean; force?: boolean; only?: string } = {}): Promise<CheckinOutcome[]> {
  const keys = opts.only ? [opts.only.includes(":") ? opts.only : `email:${opts.only.toLowerCase()}`] : await allBriefKeys();
  const out: CheckinOutcome[] = [];
  for (const key of keys) {
    try {
      out.push(await checkinFor(key, opts));
    } catch (err) {
      out.push({ key, status: "failed", detail: (err as Error).message });
    }
  }
  return out;
}

export type { Brief };
