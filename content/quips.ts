// What the chat says while Garrett is working. The real check still shows as
// a small tag next to the line, so this can have fun without hiding anything.
// Keep them short, lab-flavored, and about local search.

export const QUIPS: Record<string, string[]> = {
  start: [
    "Reading your question twice",
    "Adjusting goggles",
    "Flipping through twenty years of notes",
    "Firing up the lab",
    "Stroking chin, scientifically",
    "Checking my math",
  ],
  "map pack": ["Counting pins on the map", "Asking Google who's on top", "Measuring the 3-pack with calipers"],
  maps: ["Zooming out on the map", "Counting every pin in town"],
  "local finder": ["Scrolling past the 3-pack", "Reading the fine print on page two"],
  "search results": ["Scanning page one", "Sorting the websites from the directories"],
  LSAs: ["Checking who's paying for leads", "Looking for green checkmarks"],
  profile: ["Putting the profile under the microscope", "Counting photos. Every one."],
  "profile health": ["Taking the profile's vitals", "Listening for a heartbeat"],
  reviews: ["Reading reviews so you don't have to", "Counting stars", "Sniffing out review patterns"],
  "review velocity": ["Timing the reviews with a stopwatch", "Plotting the review curve"],
  "reviews across sites": ["Checking reviews beyond Google", "Comparing notes across sites"],
  "Q&A": ["Reading the Q&A", "Looking for unanswered questions"],
  competitors: ["Spying on the competition (legally)", "Lining up the rivals", "Measuring their lead"],
  "local authority": ["Weighing local clout", "Running the authority numbers"],
  keywords: ["Mining for keywords", "Weighing search demand"],
  "page audit": ["X-raying the website", "Poking the homepage with a stick", "Reading the page like Google does"],
  "AI Overview": ["Interrogating the robots", "Asking the AI what it thinks of you"],
  "AI Mode": ["Robot-to-robot small talk", "Seeing who the AI recommends"],
  location: ["Triangulating your city"],
  playbook: ["Pulling a playbook off the shelf", "Dusting off the playbook", "Consulting the notes"],
};

export function quipsFor(status?: { kind: "live" | "playbook"; label: string }): string[] {
  if (!status) return QUIPS.start;
  return (status.kind === "playbook" ? QUIPS.playbook : QUIPS[status.label]) ?? QUIPS.start;
}
