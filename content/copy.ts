import { ASK_EMAIL } from "./site.ts";

// Every word on the landing page lives here so it can be edited without
// touching layout code. Prices are placeholders until pricing is final.

export const COPY = {
  hero: {
    eyebrow: "AI local search advisor · wired to live data",
    // The phrase in `highlight` gets the neon marker.
    headline: "Ask Garrett about your",
    highlight: "local visibility.",
    subhead:
      "Clients pay over $36,000 a year for monthly access to Garrett. Now his 20+ years of local search experience is on call for you, in this chat or your inbox, for a fraction of that. Powered by Local SEO Skills and Local SEO Data.",
    placeholder: "Try it: Smith Plumbing in Buffalo, NY dropped out of the map pack…",
    tryLine: "Free to try right here. No signup.",
  },
  questions: [
    "Why am I not in the map pack?",
    "My listing got suspended. Now what?",
    "Is my website helping or hurting my local rankings?",
    "Am I showing up in AI answers?",
  ],
  letter: {
    eyebrow: "A note from the human",
    paragraphs: [
      "Hi, I'm Garrett.",
      "For twenty-some years I've helped businesses figure out why they do or don't show up when someone nearby searches for what they sell. Nearly all of that has lived in my head, and the only way to get it was to hire me. Clients pay over $36,000 a year for monthly access, so only a handful of companies ever get it.",
      "That always bugged me. The owner of a three-truck plumbing company needs this more than a national brand does, and can afford it least.",
      "So I wrote down how I work, every playbook, and open-sourced it as Local SEO Skills. Then I built Local SEO Data so those playbooks could look at real rankings and reviews instead of guessing. Put them together and you get something that works through your problem the way I would.",
      "It's not me, and it won't pretend to be. It'll tell you when something needs a human. But it's the closest thing to having me on call, for about the price of a lunch each month.",
      "Ask it something hard.",
    ],
    signature: "Garrett",
    name: "Garrett Smith",
    role: "Founder, GMB Gorilla",
  },
  proof: ["Local SEO since 2003", "Google Business Profiles since 2011", "Founder of GMB Gorilla"],
  how: {
    eyebrow: "How it works",
    title: "How I fit in a chat box.",
    intro:
      "I spent two decades figuring out why businesses show up on Google Maps or don't. Then I wrote it down and wired it to live data. Put the two together and you get the way I work, available to anyone.",
    parts: [
      {
        name: "Local SEO Skills",
        href: "https://github.com/garrettjsmith/localseoskills",
        body: "My playbooks. 25 of them, from map pack rankings and reviews to suspension recovery and showing up in AI answers. The same methods I use with clients.",
      },
      {
        name: "Local SEO Data",
        href: "https://localseodata.com",
        body: "Live data. Map pack and website rankings, Google Business Profiles, reviews, competitors, and AI answers, pulled the moment you ask.",
      },
    ],
    result: {
      name: "Ask Garrett",
      body: "My judgment, my playbooks, and your real numbers, answering your question instead of a generic one.",
    },
  },
  pricing: {
    eyebrow: "Pricing",
    title: "The same thinking, for less than 1% of the price.",
    // Placeholder prices until pricing is final.
    plans: [
      {
        id: "solo",
        label: "Ask Garrett",
        price: "$19",
        unit: "per month",
        body: "For owners. Ask here or by email, and Garrett remembers your business between conversations.",
        features: [`Web chat and email (${ASK_EMAIL})`, "Text and WhatsApp coming soon", "Live rankings, reviews & AI answers"],
        featured: true,
      },
      {
        id: "teams",
        label: "Ask Garrett for Teams",
        price: "$299",
        unit: "per month",
        body: "For teams, multi-location brands, and agencies. Garrett joins your Slack like a new hire.",
        features: ["Everything in Ask Garrett", "Slack for your whole team", "Remembers every location and competitor"],
        featured: false,
      },
      {
        id: "real",
        label: "The real Garrett",
        price: "$36k+",
        unit: "per year",
        body: "What clients pay for monthly access to me, with some light execution. A few companies at a time.",
        features: [],
        featured: false,
      },
    ],
  },
  team: {
    eyebrow: "In your Slack",
    title: "Put Garrett on your team.",
    intro: "On the Teams plan, add me to Slack like a new hire. Tag me in a thread and I'll answer the way a senior local search person would.",
    points: [
      "Remembers your locations, competitors, and goals",
      "Checks live rankings and reviews before answering",
      "Flags anything that could get a profile suspended for a human",
    ],
  },
  contact: {
    title: ["Talk to the", "real Garrett."],
    intro: "Retainers, bigger projects, or early access to text and WhatsApp. The real Garrett reads every one.",
  },
  gate: {
    title: ["Want to keep", "going?"],
    body: "That was your last free question. Keep going here and by email, and Garrett remembers your business between conversations. Cancel any time.",
    locked: "You've used your free questions.",
    remaining: (n: number) => `${n} free question${n === 1 ? "" : "s"} left`,
  },
  cta: "Get Ask Garrett",
  ctaShort: "Get it",
  disclaimer: "AI, not the real Garrett. Anything that could trigger a suspension goes to a human first.",
} as const;
