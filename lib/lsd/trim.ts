// Shrink Local SEO Data responses to what the model needs to answer well.
// Every token here is paid for on each round of the conversation, so drop
// internal IDs, coordinates, URLs nobody reads, and nested hour tables, and
// add the context the model tends to get wrong (absolute SERP positions,
// JavaScript-rendered pages).

type J = Record<string, any>;

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SHORT: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const pad = (n: number) => String(n).padStart(2, "0");
const hm = (t?: { hour?: number; minute?: number }) => (t ? `${pad(t.hour ?? 0)}:${pad(t.minute ?? 0)}` : "?");

/** {timetable:{monday:[{open,close}]...}} -> "Mon-Fri 08:00-17:00; Sat-Sun closed" */
export function formatHours(hours: unknown): string | null {
  const tt = (hours as J)?.work_hours?.timetable ?? (hours as J)?.timetable;
  if (!tt || typeof tt !== "object") return typeof hours === "string" && hours ? hours : null;
  const per = DAYS.map((d) => {
    const slots = tt[d] as J[] | null | undefined;
    if (!slots?.length) return "closed";
    return slots
      .map((s) => {
        const o = hm(s.open);
        const c = hm(s.close);
        return o === "00:00" && (c === "24:00" || c === "00:00") ? "24 hours" : `${o}-${c}`;
      })
      .join(", ");
  });
  // Group consecutive days with the same hours.
  const parts: string[] = [];
  for (let i = 0; i < 7; ) {
    let j = i;
    while (j + 1 < 7 && per[j + 1] === per[i]) j++;
    const days = i === j ? SHORT[DAYS[i]] : `${SHORT[DAYS[i]]}-${SHORT[DAYS[j]]}`;
    parts.push(`${days} ${per[i]}`);
    i = j + 1;
  }
  return parts.join("; ");
}

const clip = (s: unknown, n: number) => (typeof s === "string" && s.length > n ? s.slice(0, n) + "…" : s);
const pick = (o: J, keys: string[]) => Object.fromEntries(keys.filter((k) => o?.[k] !== undefined && o[k] !== "" && o[k] !== null).map((k) => [k, o[k]]));

/** Drop tracking parameters (utm_*, gclid, …) from a URL; they're noise to the model. */
export function cleanUrl(u: unknown): unknown {
  if (typeof u !== "string" || !u.startsWith("http")) return u;
  try {
    const url = new URL(u);
    for (const k of [...url.searchParams.keys()]) if (/^(utm_|gclid|fbclid|msclkid|y_source)/i.test(k)) url.searchParams.delete(k);
    return url.toString();
  } catch {
    return u;
  }
}

function listing(r: J): J {
  if (r.rank === undefined && r.position !== undefined) r = { ...r, rank: r.position };
  const out = pick(r, ["rank", "name", "rating", "reviews_count", "categories", "category", "address", "phone", "website"]);
  if (out.website) out.website = cleanUrl(out.website);
  const hours = formatHours(r.hours);
  if (hours) out.hours = hours;
  if (r.hours?.current_status) out.open_now = r.hours.current_status === "open";
  return out;
}

const TRIMMERS: Record<string, (j: J) => J> = {
  location_search: (j) => ({ locations: (j.locations ?? []).slice(0, 5).map((l: J) => l.name) }),

  business_profile: (j) => {
    if (j.matched === false) return { matched: false, suggestions: j.suggestions ?? null };
    const out = pick(j, ["name", "address", "phone", "website", "categories", "rating", "reviews_count", "photos_count", "verified", "attributes"]);
    out.hours = formatHours(j.hours) ?? "not listed";
    if (j.hours?.current_status) out.open_now = j.hours.current_status === "open";
    if (j.description) out.description = clip(j.description, 400);
    else out.description = "none";
    return out;
  },

  profile_health: (j) => pick(j, ["completeness_score", "verified", "photos_count", "qa_count", "posts_last_30d", "missing_fields", "incomplete_fields", "recommendations"]),

  local_pack: (j) => ({ keyword: j.keyword ?? j.search_metadata?.keyword, location: j.location ?? j.search_metadata?.location, results: (j.results ?? []).map(listing) }),
  local_finder: (j) => ({ keyword: j.keyword, location: j.location, total_results: j.total_results, results: (j.results ?? []).map(listing) }),
  maps: (j) => ({ keyword: j.keyword, location: j.location, results: (j.results ?? []).map(listing) }),

  organic_serp: (j) => {
    // The API's rank counts the map pack and other features too, so the first
    // organic result is often "rank 5". Renumber so position means organic order.
    const organic = (j.organic_results ?? []).map((r: J, i: number) => ({
      position: i + 1,
      title: r.title,
      url: cleanUrl(r.url),
      snippet: clip(r.snippet, 120),
    }));
    return {
      organic,
      local_pack: (j.local_pack ?? []).map((r: J) => pick(r, ["rank", "name", "rating", "reviews_count"])),
      ads: (j.ads ?? []).length,
      lsa_ads: (j.lsa_ads ?? []).length,
      people_also_ask: j.people_also_ask ?? [],
      ai_overview: j.ai_overview ? clip(typeof j.ai_overview === "string" ? j.ai_overview : JSON.stringify(j.ai_overview), 800) : "none",
      knowledge_panel: j.knowledge_panel ? "yes" : "none",
    };
  },

  google_reviews: (j) => ({
    total_reviews: j.total_reviews ?? j.summary?.total_reviews,
    average_rating: j.average_rating ?? j.summary?.average_rating,
    ...(j.summary?.rating_distribution ? { rating_distribution: j.summary.rating_distribution } : {}),
    recent: (j.reviews ?? []).map((r: J) => {
      const out: J = { rating: r.rating, date: String(r.date ?? "").slice(0, 10) };
      if (r.text) out.text = clip(r.text, 280);
      out.owner_replied = Boolean(r.owner_reply);
      return out;
    }),
  }),

  review_velocity: (j) => pick(j, ["reviews_per_month", "rating_trend", "current_rating", "period_rating", "reply_rate", "sentiment_themes", "review_count_by_month"]),
  multi_platform_reviews: (j) => j,
  qa: (j) => ({
    total_questions: j.total_questions ?? (j.questions ?? []).length,
    questions: (j.questions ?? []).slice(0, 10).map((q: J) => ({ q: clip(q.question ?? q.text, 200), answered: Boolean(q.answer ?? q.answers?.length) })),
  }),
  competitor_gap: (j) => j,
  local_authority: (j) => j,
  keyword_opportunities: (j) => ({ keywords: (j.keywords ?? []).slice(0, 15) }),

  page_audit: (j) => {
    const out = pick(j, ["seo_score", "title", "meta_description", "h1", "word_count", "load_time_ms", "mobile_friendly", "issues"]);
    out.meta_description = j.meta_description || "missing";
    out.schema_types = (j.schema_markup ?? []).map((s: J) => s?.["@type"] ?? s?.type ?? s).slice(0, 10);
    // Letter-spaced titles ("J O N  T H E  P L U M B E R") read as single letters to search engines.
    for (const k of ["title", "h1"] as const) {
      const v = Array.isArray(j[k]) ? j[k][0] : j[k];
      if (typeof v === "string" && /(?:^|\s)(?:\S\s+){4,}\S(?:\s|$)/.test(v)) {
        (out.flags ??= []).push(`${k} is letter-spaced ("${clip(v, 60)}"), so search engines read single letters, not the business name or service`);
      }
    }
    if (j.word_count === 0) {
      out.note = "word_count 0 usually means the page is built with JavaScript and the crawler didn't see the text, not that the page is empty. Say so rather than calling the content thin.";
    }
    const cwv = j.core_web_vitals ?? {};
    if (Object.values(cwv).some((v) => v !== null && v !== undefined)) out.core_web_vitals = cwv;
    return out;
  },

  local_services_ads: (j) => ({ total_ads: j.total_ads, ads: (j.ads ?? []).slice(0, 10).map((a: J) => pick(a, ["rank", "name", "rating", "reviews_count", "badge", "years_in_business"])) }),

  ai_overview: (j) => {
    if (!j.has_ai_overview) return { has_ai_overview: false, note: "Google showed no AI Overview for this search at the time of the check." };
    return {
      has_ai_overview: true,
      summary: clip(j.summary_text, 1500),
      cited_sources: (j.cited_sources ?? []).slice(0, 10).map((s: J) => pick(s, ["title", "domain", "url", "position"])),
    };
  },

  ai_mode: (j) => ({
    answer: clip(j.ai_response, 2500),
    businesses_named: (j.local_businesses ?? []).map((b: J) => pick(b, ["rank", "name", "rating", "reviews_count", "address"])),
    sources: (j.references ?? []).slice(0, 8).map((r: J) => pick(r, ["domain", "title"])),
  }),

  ai_visibility: (j) => ({
    ...pick(j, ["domain", "total_mentions", "total_impressions", "ai_search_volume", "platform_breakdown", "location_scope"]),
    top_sources: (j.top_sources ?? []).slice(0, 5),
  }),
};

/** Trim a tool result. Unknown tools pass through, minus obvious noise. */
export function trimResult(tool: string, data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const fn = TRIMMERS[tool];
  if (fn) return fn(data as J);
  const { location_used, cid, place_id, ...rest } = data as J;
  void location_used;
  void cid;
  void place_id;
  return rest;
}
