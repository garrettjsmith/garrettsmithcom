// Every word on the landing page lives here so it can be edited without
// touching layout code. Prices are placeholders until pricing is final.

export const COPY = {
  hero: {
    eyebrow: "AI local search advisor · wired to live data",
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
  letter: {
    eyebrow: "A note from the human",
    paragraphs: [
      "Hi, I'm Garrett.",
      "For twenty-some years I've helped businesses figure out why they do or don't show up when someone nearby searches for what they sell. Nearly all of that has lived in my head, and the only way to get it was to hire me. A strategy session runs $1,999, so only a handful of companies a year get one.",
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
        body: "Live data. Map pack rankings, Google Business Profiles, reviews, competitors, and AI visibility, pulled the moment you ask.",
      },
    ],
    result: {
      name: "Ask Garrett",
      body: "My judgment, my playbooks, and your real numbers, answering your question instead of a generic one.",
    },
  },
  pricing: {
    eyebrow: "Pricing",
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
    eyebrow: "In your Slack",
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
