import { ASK_EMAIL } from "./site.ts";
import { HUMAN_OFFERS } from "./human.ts";

// Every word on the landing page lives here so it can be edited without
// touching layout code.
//
// Voice: the page is the real Garrett, in first person. The product is
// vGarrett, his AI twin, called "it". The chat and Slack bot are vGarrett,
// labeled as AI, and call him "Garrett" or "the real Garrett".

export const COPY = {
  hero: {
    eyebrow: "AI local search advisor · wired to live data",
    // The phrase in `highlight` gets the neon marker.
    headline: "Ask vGarrett about your",
    highlight: "local visibility.",
    subhead:
      "Companies pay me $36,000+ a year for monthly access. So I built vGarrett, my virtual twin: my playbooks, wired to live ranking data, on call in this chat or your inbox for about the price of lunch.",
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
      "I call it vGarrett. It's not me, and it won't pretend to be. When something really does need me, a suspension or a big call, it'll say so and put your case in front of me, and you'll get a real answer from the real me. The rest of the time, it's the closest thing to having me on call, for about the price of a lunch each month.",
      "Ask it something hard.",
    ],
    signature: "Garrett",
    name: "Garrett Smith",
    role: "Founder, GMB Gorilla",
  },
  proof: ["Local SEO since 2003", "Google Business Profiles since 2011", "Founder of GMB Gorilla"],
  how: {
    eyebrow: "How it works",
    title: "How 20 years fit in a chat box.",
    intro:
      "I spent two decades figuring out why businesses show up on Google Maps or don't. I wrote it all down as playbooks and wired them to live data. vGarrett uses both, so it works through your problem the way I would.",
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
      name: "vGarrett",
      body: "My playbooks and your real numbers, answering your question instead of a generic one. When it's out of its depth, it brings me in.",
    },
  },
  pricing: {
    eyebrow: "Pricing",
    title: "The same thinking, for less than 1% of the price.",
    plans: [
      {
        id: "solo",
        label: "vGarrett",
        price: "$19",
        unit: "per month",
        body: "For owners. Ask here or by email. It remembers your business between conversations.",
        features: [
          `Web chat and email (${ASK_EMAIL})`,
          "Audits, research, and a plan for your business",
          "Monday check-ins: rankings, new reviews, reminders",
          "Text and WhatsApp coming soon",
        ],
        featured: true,
      },
      {
        id: "teams",
        label: "vGarrett for Teams",
        price: "$299",
        unit: "per month",
        body: "For teams, multi-location brands, and agencies. Add vGarrett to Slack like a new hire.",
        features: [
          "Everything in vGarrett",
          "Slack for your whole team",
          "Remembers every location and competitor",
          "1 Second Opinion from me each month",
        ],
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
  human: {
    title: "When you need the real one.",
    body: "vGarrett flags anything that needs a human. Then you can bring me in, no retainer:",
    offers: [HUMAN_OFFERS.second_opinion, HUMAN_OFFERS.suspension_review, HUMAN_OFFERS.strategy_call],
    note: "A few slots a week, so each one gets my full attention. vGarrett offers them in the chat when your situation calls for it.",
  },
  team: {
    eyebrow: "In your Slack",
    title: "Put vGarrett on your team.",
    intro: "On the Teams plan, add vGarrett to Slack like a new hire. Tag it in a thread and it answers the way a senior local search person would.",
    points: [
      "Remembers your locations, competitors, and goals",
      "Checks live rankings and reviews before answering",
      "Flags anything suspension-risky and routes it to me before anyone touches the profile",
    ],
  },
  contact: {
    title: ["Talk to the", "real Garrett."],
    intro: "Retainers, bigger projects, or early access to text and WhatsApp. The real Garrett reads every one.",
  },
  gate: {
    title: ["Want to keep", "going?"],
    body: "That was your last free question. Keep going here and by email, and vGarrett remembers your business between conversations. Cancel any time.",
    locked: "You've used your free questions.",
    remaining: (n: number) => `${n} free question${n === 1 ? "" : "s"} left`,
  },
  cta: "Get vGarrett",
  ctaShort: "Get it",
  disclaimer:
    "vGarrett is an AI, not the real Garrett. It flags anything that could trigger a suspension and offers a human review before you act.",
} as const;
