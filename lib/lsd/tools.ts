import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";

// The Local SEO Data endpoints Virtual Garrett may call, as client tools the
// app runs itself. Names and parameters match the MCP server's tools so the
// playbooks' instructions still apply. Expensive or country-level tools
// (local_audit, geogrid_scan, citation_audit, ai_visibility, bulk keyword
// research) are deliberately absent.

export type LsdTool = {
  name: string;
  label: string;
  method: "GET" | "POST";
  path: string;
  /** How long a result can be reused, in seconds. */
  cacheSeconds: number;
  description: string;
  properties: Record<string, unknown>;
  required: string[];
  /** Defaults the app fills in (e.g. fewer competitors to save credits). */
  defaults?: Record<string, unknown>;
};

const H = 3600;
const biz = {
  business_name: { type: "string", description: "Business name" },
  location: { type: "string", description: 'City and state, e.g. "Buffalo, NY"' },
};
const kw = {
  keyword: { type: "string", description: 'Search keyword, e.g. "plumber"' },
  location: { type: "string", description: 'City and state, e.g. "Buffalo, NY"' },
};
const placeId = { place_id: { type: "string", description: "Google Place ID for an exact match (from business_profile)" } };

export const LSD_TOOLS: LsdTool[] = [
  {
    name: "local_pack",
    label: "map pack",
    method: "POST",
    path: "/v1/serp/local-pack",
    cacheSeconds: 6 * H,
    description: "Who ranks in Google's local 3-pack for a keyword in a city: rank, name, rating, reviews, address, phone, hours, website. Start here to see where a business ranks.",
    properties: { ...kw },
    required: ["keyword", "location"],
  },
  {
    name: "maps",
    label: "maps",
    method: "POST",
    path: "/v1/serp/maps",
    cacheSeconds: 6 * H,
    description: "Google Maps results beyond the top 3 (default 10 listings) with ratings, reviews, categories, and hours. Use when a business isn't in the 3-pack and you need to find where it sits.",
    properties: { ...kw, limit: { type: "integer", minimum: 1, maximum: 20, description: "Number of results (default 10)" } },
    required: ["keyword", "location"],
    defaults: { limit: 10 },
  },
  {
    name: "local_finder",
    label: "local finder",
    method: "POST",
    path: "/v1/serp/local-finder",
    cacheSeconds: 6 * H,
    description: "The extended local results list ('More places') for a keyword and city, default 10 listings.",
    properties: { ...kw, limit: { type: "integer", minimum: 1, maximum: 20, description: "Number of results (default 10)" } },
    required: ["keyword", "location"],
    defaults: { limit: 10 },
  },
  {
    name: "organic_serp",
    label: "search results",
    method: "POST",
    path: "/v1/serp/organic",
    cacheSeconds: 6 * H,
    description: "The full Google results page for a keyword and city: organic listings (with the website ranking picture), local pack, ads, People Also Ask, AI Overview flag. Use for website rankings.",
    properties: { ...kw },
    required: ["keyword", "location"],
  },
  {
    name: "local_services_ads",
    label: "LSAs",
    method: "POST",
    path: "/v1/serp/lsa",
    cacheSeconds: 6 * H,
    description: "Google Local Services Ads (Guaranteed/Screened) for a keyword and city: businesses, ratings, reviews, badges.",
    properties: { ...kw },
    required: ["keyword", "location"],
  },
  {
    name: "business_profile",
    label: "profile",
    method: "POST",
    path: "/v1/business/profile",
    cacheSeconds: 24 * H,
    description: "One business's Google Business Profile: name, address, phone, website, hours, categories, photos, rating, reviews, description, verified. If there's no exact match it returns suggestions.",
    properties: { ...biz, ...placeId },
    required: ["business_name", "location"],
  },
  {
    name: "profile_health",
    label: "profile health",
    method: "POST",
    path: "/v1/profile/health",
    cacheSeconds: 24 * H,
    description: "What's missing or weak on a Google Business Profile: completeness score, missing and incomplete fields, specific recommendations.",
    properties: { ...biz, ...placeId },
    required: ["business_name", "location"],
  },
  {
    name: "google_reviews",
    label: "reviews",
    method: "POST",
    path: "/v1/business/reviews",
    cacheSeconds: 12 * H,
    description: "Recent Google reviews for a business (default 10): rating, date, text, whether the owner replied, plus totals. Can take 10-30 seconds.",
    properties: {
      ...biz,
      ...placeId,
      limit: { type: "integer", minimum: 1, maximum: 30, description: "Number of reviews (default 10)" },
      sort: { type: "string", enum: ["newest", "highest", "lowest", "most_relevant"], description: "Default newest" },
    },
    required: ["business_name", "location"],
    defaults: { limit: 10 },
  },
  {
    name: "review_velocity",
    label: "review velocity",
    method: "POST",
    path: "/v1/reviews/velocity",
    cacheSeconds: 12 * H,
    description: "Review growth and trends: reviews per month, rating trend, reply rate, sentiment themes, monthly breakdown. Can take 10-30 seconds.",
    properties: { ...biz, ...placeId, period: { type: "string", enum: ["30d", "90d", "6m", "1y"], description: "Default 90d" } },
    required: ["business_name", "location"],
  },
  {
    name: "multi_platform_reviews",
    label: "reviews across sites",
    method: "POST",
    path: "/v1/reviews/multi-platform",
    cacheSeconds: 12 * H,
    description: "Ratings and review counts on Google and Trustpilot side by side.",
    properties: { ...biz, ...placeId },
    required: ["business_name", "location"],
  },
  {
    name: "qa",
    label: "Q&A",
    method: "POST",
    path: "/v1/business/qa",
    cacheSeconds: 24 * H,
    description: "Questions people ask on a Google Business Profile and whether they're answered.",
    properties: { ...biz, ...placeId },
    required: ["business_name", "location"],
  },
  {
    name: "competitor_gap",
    label: "competitors",
    method: "POST",
    path: "/v1/report/competitor-gap",
    cacheSeconds: 24 * H,
    description: "A business vs. its local competitors for a keyword: rank, rating, reviews, profile completeness, each competitor's advantages, and the business's gaps. Always pass the keyword that matters (e.g. the main service).",
    properties: {
      business_name: biz.business_name,
      location: biz.location,
      keyword: { type: "string", description: "Keyword to compare on, e.g. the main service" },
      competitors: { type: "integer", minimum: 1, maximum: 5, description: "Number of competitors (default 3)" },
    },
    required: ["business_name", "location", "keyword"],
    defaults: { competitors: 3 },
  },
  {
    name: "local_authority",
    label: "local authority",
    method: "POST",
    path: "/v1/score/local-authority",
    cacheSeconds: 24 * H,
    description: "A 0-100 local authority score with a breakdown (ranking, reviews, profile, citations) and percentile.",
    properties: { ...biz, keyword: { type: "string", description: "Keyword to evaluate authority for" } },
    required: ["business_name", "location"],
  },
  {
    name: "keyword_opportunities",
    label: "keywords",
    method: "POST",
    path: "/v1/keywords/local-opportunities",
    cacheSeconds: 24 * H,
    description: "Local keywords worth targeting: difficulty, the business's current rank, and search volume. Pass category (e.g. 'plumber') for service keywords rather than brand keywords.",
    properties: { ...biz, category: { type: "string", description: "Business category, e.g. 'plumber'" } },
    required: ["business_name", "location"],
  },
  {
    name: "page_audit",
    label: "page audit",
    method: "POST",
    path: "/v1/site/page-audit",
    cacheSeconds: 6 * H,
    description: "On-page SEO audit of one URL: title, meta description, H1, word count, load time, issues by severity, schema, mobile-friendliness.",
    properties: { url: { type: "string", description: "Full URL, e.g. https://example.com/" } },
    required: ["url"],
  },
  {
    name: "ai_overview",
    label: "AI Overview",
    method: "POST",
    path: "/v1/serp/ai-overview",
    cacheSeconds: 1 * H,
    description: "Whether Google shows an AI Overview for a search, its summary, and the sources it cites. Can take 10-30 seconds.",
    properties: { ...kw },
    required: ["keyword", "location"],
  },
  {
    name: "ai_mode",
    label: "AI Mode",
    method: "POST",
    path: "/v1/serp/ai-mode",
    cacheSeconds: 1 * H,
    description: "Google AI Mode's answer for a search, including the local businesses it recommends (review counts are rounded by Google). Can take 10-30 seconds.",
    properties: { ...kw },
    required: ["keyword", "location"],
  },
  {
    name: "location_search",
    label: "location",
    method: "GET",
    path: "/v1/locations/search",
    cacheSeconds: 30 * 24 * H,
    description: "Resolve an ambiguous place name to the exact location format. Only use when another tool says the location couldn't be found.",
    properties: { q: { type: "string", description: "Place name" }, state: { type: "string", description: "State filter, e.g. NY" } },
    required: ["q"],
  },
];

export const LSD_BY_NAME = new Map(LSD_TOOLS.map((t) => [t.name, t]));

/** Tool definitions for the Messages API, in a fixed order so the cached prefix never changes. */
export function lsdToolDefinitions(): Tool[] {
  return LSD_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: { type: "object", properties: t.properties, required: t.required, additionalProperties: false },
  })) as Tool[];
}
