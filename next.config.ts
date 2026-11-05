import type { NextConfig } from "next";

// Old addresses from the WordPress site that bots and old links still request.
// None of the old posts were rewritten as Notes, so posts and archives go to
// the Notes index and the old pages go home. Each source also matches its
// trailing-slash form (/news/), and lands on the destination in one hop.
// Old feeds, sitemaps, wp-json and uploads are left out on purpose: 404.
const toNotes = [
  "/news",
  "/blog",
  "/internet-marketing-blog",
  "/category/:rest*",
  "/changing-a-tire-while-the-bus-is-still-moving",
  "/no-one-wants-to-train-you",
  "/college-is-an-investment",
  "/what-you-can-learn-from-nick-foles-about-stepping-up-and-winning",
  "/phone-ringing",
  "/orchard-fresh",
  "/i-immediately-thought-of-you-%F0%9F%A4%94",
  "/img_7402-jpg",
];
const toHome = ["/about", "/home", "/buy", "/services/:rest*"];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      ...toNotes.map((source) => ({ source, destination: "/notes", permanent: true })),
      ...toHome.map((source) => ({ source, destination: "/", permanent: true })),
    ];
  },
};

export default nextConfig;
