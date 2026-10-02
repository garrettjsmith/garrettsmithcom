import type { MetadataRoute } from "next";
import { getNotes } from "@/lib/notes.ts";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = (process.env.SITE_URL || "https://garrettsmith.com").replace(/\/$/, "");
  const notes = getNotes();
  return [
    { url: `${site}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/notes`, lastModified: notes[0]?.date, changeFrequency: "weekly", priority: 0.8 },
    ...notes.map((n) => ({ url: `${site}/notes/${n.slug}`, lastModified: n.date, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${site}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
