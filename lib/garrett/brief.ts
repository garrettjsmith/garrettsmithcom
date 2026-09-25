import { getStore } from "../store.ts";

// The brief: what Garrett knows about a customer's business, what he found,
// and what's next. Adapted from Local SEO Skills' location briefs, stored in
// Redis instead of markdown files so web, email, Slack, and the scheduled
// check-ins all read and write the same one. Keyed like team notes: a Slack
// team ID, or "email:<address>" for members.

export type Cadence = "week" | "2 weeks" | "month";

export type Reminder = { id: string; text: string; every: Cadence; due: string };

export type Business = {
  id: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  primaryCategory?: string;
  businessType?: "storefront" | "service-area" | "hybrid";
  keywords: string[];
  serviceArea?: string;
  competitors: string[];
  findings: { critical: string[]; important: string[]; monitor: string[] };
  nextAction?: string;
  /** Newest first: what was checked, found, or agreed. */
  log: { date: string; text: string }[];
  reminders: Reminder[];
  /** What the last check-in saw, so the next one can report changes. */
  baseline?: {
    date: string;
    profile?: Record<string, unknown>;
    ranks?: { keyword: string; position: number | null }[];
    reviews?: { count?: number; rating?: number; latest?: string };
  };
  updatedAt: string;
};

export type Brief = {
  key: string;
  businesses: Business[];
  /** Weekly check-in emails (members only). On by default once a business is added. */
  checkins: boolean;
  updatedAt: string;
};

export const MAX_BUSINESSES = 10;
const MAX_LOG = 20;
const MAX_LIST = 8;
const MAX_REMINDERS = 8;
const INDEX = "briefs:index";

const briefKey = (key: string) => `brief:${key}`;
export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
const today = () => new Date().toISOString().slice(0, 10);
const clean = (s: unknown, n = 200) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ").slice(0, n) : undefined);
const list = (x: unknown, n = MAX_LIST) =>
  Array.isArray(x) ? x.map((v) => clean(v, 240)).filter((v): v is string => Boolean(v)).slice(0, n) : undefined;

export async function getBrief(key: string): Promise<Brief | null> {
  return getStore().get<Brief>(briefKey(key));
}

export async function saveBrief(brief: Brief): Promise<void> {
  brief.updatedAt = new Date().toISOString();
  await getStore().set(briefKey(brief.key), brief);
  await getStore().sadd(INDEX, brief.key);
}

export async function allBriefKeys(): Promise<string[]> {
  return getStore().smembers(INDEX);
}

export function findBusiness(brief: Brief | null, name: string | undefined): Business | undefined {
  if (!brief?.businesses.length) return undefined;
  if (!name) return brief.businesses.length === 1 ? brief.businesses[0] : undefined;
  const id = slug(name);
  return brief.businesses.find((b) => b.id === id) ?? brief.businesses.find((b) => b.id.includes(id) || id.includes(b.id));
}

export type BriefPatch = {
  business: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  primary_category?: string;
  business_type?: string;
  keywords?: string[];
  service_area?: string;
  competitors?: string[];
  findings?: { critical?: string[]; important?: string[]; monitor?: string[] };
  next_action?: string;
  log?: string;
  checkins?: boolean;
};

/** Apply a model's update_brief call. Creates the business on first mention. Returns a short result for the model. */
export function applyPatch(brief: Brief | null, key: string, p: BriefPatch): { brief: Brief; result: string } {
  const b: Brief = brief ?? { key, businesses: [], checkins: true, updatedAt: "" };
  const name = clean(p.business, 120);
  if (!name) return { brief: b, result: "Needs a business name." };
  let biz = findBusiness(b, name);
  if (!biz) {
    if (b.businesses.length >= MAX_BUSINESSES) return { brief: b, result: `This account already tracks ${MAX_BUSINESSES} businesses.` };
    biz = {
      id: slug(name),
      name,
      keywords: [],
      competitors: [],
      findings: { critical: [], important: [], monitor: [] },
      log: [],
      reminders: [],
      updatedAt: "",
    };
    b.businesses.push(biz);
  }
  const set = <K extends keyof Business>(k: K, v: Business[K] | undefined) => {
    if (v !== undefined && v !== "") biz![k] = v;
  };
  set("city", clean(p.city, 80));
  set("address", clean(p.address));
  set("phone", clean(p.phone, 40));
  set("website", clean(p.website));
  set("primaryCategory", clean(p.primary_category, 80));
  if (p.business_type === "storefront" || p.business_type === "service-area" || p.business_type === "hybrid") biz.businessType = p.business_type;
  set("keywords", list(p.keywords, 6));
  set("serviceArea", clean(p.service_area));
  set("competitors", list(p.competitors, 6));
  if (p.findings) {
    for (const level of ["critical", "important", "monitor"] as const) {
      const l = list(p.findings[level]);
      if (l) biz.findings[level] = l;
    }
  }
  set("nextAction", clean(p.next_action, 240));
  // Entries are dated here; drop a date the model may have prefixed.
  const log = clean(p.log, 240)?.replace(/^\d{4}-\d{2}-\d{2}\s*[:\-–—]\s*/, "");
  if (log) biz.log = [{ date: today(), text: log }, ...biz.log].slice(0, MAX_LOG);
  if (typeof p.checkins === "boolean") b.checkins = p.checkins;
  biz.updatedAt = new Date().toISOString();
  return { brief: b, result: `Brief updated for ${biz.name}.` };
}

const addDays = (date: string, days: number) => new Date(Date.parse(date) + days * 86_400_000).toISOString().slice(0, 10);
export const cadenceDays: Record<Cadence, number> = { week: 7, "2 weeks": 14, month: 30 };

export function applyReminder(
  brief: Brief | null,
  p: { business?: string; text?: string; every?: string; remove?: boolean },
): { brief: Brief | null; result: string } {
  const biz = findBusiness(brief, p.business);
  if (!brief || !biz) return { brief, result: "Add the business to the brief first (update_brief), then set the reminder." };
  const text = clean(p.text, 160);
  if (!text) return { brief, result: "Needs reminder text." };
  const existing = biz.reminders.findIndex((r) => slug(r.text) === slug(text));
  if (p.remove) {
    if (existing >= 0) biz.reminders.splice(existing, 1);
    return { brief, result: existing >= 0 ? "Reminder removed." : "No reminder like that to remove." };
  }
  const every: Cadence = p.every === "2 weeks" || p.every === "month" ? p.every : "week";
  const r: Reminder = { id: slug(text).slice(0, 40), text, every, due: today() };
  if (existing >= 0) biz.reminders[existing] = { ...r, due: biz.reminders[existing].due };
  else if (biz.reminders.length >= MAX_REMINDERS) return { brief, result: `Already ${MAX_REMINDERS} reminders for ${biz.name}; remove one first.` };
  else biz.reminders.push(r);
  return { brief, result: `Reminder set for ${biz.name}: every ${every}. It goes out with the weekly check-in.` };
}

/** Reminders due by `date`, and the brief with their next due dates moved on. */
export function takeDueReminders(biz: Business, date = today()): Reminder[] {
  const due = biz.reminders.filter((r) => r.due <= date);
  for (const r of due) r.due = addDays(date, cadenceDays[r.every]);
  return due;
}

/** The brief as the model reads it at the top of each conversation. */
export function renderBrief(brief: Brief | null, member: boolean): string {
  if (!brief?.businesses.length) {
    return "Brief: empty. You don't have this customer's business on file yet. When they name it, save it with update_brief.";
  }
  const out = [`Brief (what you know and what's next; keep it current with update_brief). Weekly check-in emails: ${member ? (brief.checkins ? "on" : "paused") : "not available on this channel"}.`];
  for (const b of brief.businesses) {
    const facts = [
      b.city && `City: ${b.city}`,
      b.address && `Address: ${b.address}`,
      b.website && `Website: ${b.website}`,
      b.phone && `Phone: ${b.phone}`,
      b.primaryCategory && `Primary category: ${b.primaryCategory}`,
      b.businessType && `Type: ${b.businessType}`,
      b.serviceArea && `Service area: ${b.serviceArea}`,
      b.keywords.length && `Target keywords: ${b.keywords.join(", ")}`,
      b.competitors.length && `Competitors: ${b.competitors.join(", ")}`,
    ].filter(Boolean);
    const missing = [!b.city && "city", !b.keywords.length && "target keywords", !b.website && "website"].filter(Boolean);
    out.push(`\n## ${b.name}\n${facts.join("\n") || "(no details yet)"}`);
    if (missing.length) out.push(`Missing: ${missing.join(", ")}`);
    for (const level of ["critical", "important", "monitor"] as const) {
      if (b.findings[level].length) out.push(`${level[0].toUpperCase() + level.slice(1)}:\n${b.findings[level].map((f) => `- ${f}`).join("\n")}`);
    }
    if (b.nextAction) out.push(`Next action: ${b.nextAction}`);
    if (b.reminders.length) out.push(`Reminders: ${b.reminders.map((r) => `${r.text} (every ${r.every})`).join("; ")}`);
    if (b.log.length) out.push(`Recent log:\n${b.log.slice(0, 6).map((l) => `- ${l.date}: ${l.text}`).join("\n")}`);
  }
  return out.join("\n");
}
