// Diagrams from the newsletter, redrawn as HTML in the site's style so they're
// sharp, readable by search engines and AI, and match the rest of the page.
// A note places one with <div data-diagram="id"></div> on its own line.

const icon = {
  pin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>`,
  list: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="4.5" rx="1.4"/><rect x="3" y="10" width="18" height="4.5" rx="1.4"/><rect x="3" y="16" width="18" height="4.5" rx="1.4"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.6"/><path d="M9.2 12.3l2 2 3.6-4"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M10.2 9a1.8 1.8 0 1 1 2.6 1.6c-.6.3-.8.7-.8 1.2"/><path d="M12 14.2h.01"/></svg>`,
  stars: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="15" height="11" rx="1.8"/><path d="M7 9.5h7M7 12h4"/><path d="M8 19h11a2 2 0 0 0 2-2V8"/></svg>`,
  verify: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><path d="M9.3 10.2l1.9 1.9 3.5-3.6"/></svg>`,
  store: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v10h16V10"/><path d="M3 10l1.5-5h15L21 10z"/><path d="M10 20v-5h4v5"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>`,
  hidden: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.5"/><path d="M4 20L20 4"/></svg>`,
};

const step = (cls: string, svg: string, label: string) => `<li class="${cls}"><span class="di">${svg}</span><span>${label}</span></li>`;

export const DIAGRAMS: Record<string, string> = {
  journey: `<figure class="ndiag journey" aria-label="The old customer journey compared with the new one">
<div class="row old"><p class="dh">The old journey</p><ol>${step("", icon.pin, "Google discovers")}${step("", icon.list, "Customer filters")}${step("", icon.phone, "Customer chooses")}</ol></div>
<div class="row new"><p class="dh">The new journey</p><ol>${step("", icon.chat, "AI discovers")}${step("", icon.stars, "AI filters")}${step("", icon.verify, "Google verifies")}</ol></div>
</figure>`,
  network: `<figure class="ndiag network" aria-label="Same brand, different AI visibility by city">
<p class="dh">Same brand. Different AI visibility.</p>
<div class="grid">
<div class="city on"><b>Phoenix</b>${icon.store}<span class="st">${icon.check} Visible</span></div>
<div class="city off"><b>Scottsdale</b>${icon.store}<span class="st">${icon.hidden} Invisible</span></div>
<div class="hub" aria-hidden="true">${icon.store}</div>
<div class="city on"><b>Denver</b>${icon.store}<span class="st">${icon.check} Visible</span></div>
<div class="city off"><b>Dallas</b>${icon.store}<span class="st">${icon.hidden} Invisible</span></div>
</div>
<figcaption>One network. Four very different answers.</figcaption>
</figure>`,
};
