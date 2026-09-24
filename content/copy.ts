// Every word on the landing page lives here so it can be edited without
// touching layout code. Prices are placeholders until pricing is final.

export const COPY = {
  hero: {
    // The phrase in `highlight` gets the neon marker.
    headline: "Ask Garrett about your",
    highlight: "local visibility.",
    subhead:
      "Access like this usually costs tens of thousands. Now 20+ years of local search experience is on call for you, whenever you need it, for a fraction of the price. Powered by Local SEO Skills and Local SEO Data.",
    placeholder: "Try it: Smith Plumbing in Buffalo, NY dropped out of the map pack…",
    tryLine: "Free to try right here. No signup.",
  },
  questions: [
    "Why am I not in the map pack?",
    "My listing got suspended. Now what?",
    "How do my reviews compare to competitors?",
    "Am I showing up in AI answers?",
  ],
  proof: ["Local SEO since 2003", "Google Business Profiles since 2011", "Founder of GMB Gorilla"],
  how: {
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
        body: "Live data. Map pack rankings, Google Business Profiles, reviews, competitors, and AI visibility, pulled the moment you ask.",
      },
    ],
    result: {
      name: "Ask Garrett",
      body: "My judgment, my playbooks, and your real numbers, answering your question instead of a generic one.",
    },
  },
  pricing: {
    title: "The same thinking, for a tenth of the price.",
    inPerson: {
      label: "Garrett, in person",
      price: "$1,999",
      unit: "for an hour or two",
      body: "A strategy session with me. Only a handful of companies a year get one.",
    },
    ask: {
      label: "Ask Garrett",
      price: "$19",
      unit: "per month",
      body: "Ask as often as you want, here or in your team's Slack. Remembers your locations between conversations.",
    },
  },
  team: {
    title: "Put Garrett on your team.",
    intro: "Add me to Slack like a new hire. Tag me in a thread and I'll answer the way a senior local search person would.",
    points: [
      "Remembers your locations, competitors, and goals",
      "Checks live rankings and reviews before answering",
      "Flags anything that could get a profile suspended for a human",
    ],
  },
  cta: "Add Garrett to Slack",
  disclaimer: "AI, not the real Garrett. Anything that could trigger a suspension goes to a human first.",
} as const;
