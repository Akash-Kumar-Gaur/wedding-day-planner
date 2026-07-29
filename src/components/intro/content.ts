import type { IconKey } from "./icons";

export interface CeremonyCard {
  day: string;
  name: string;
  captionLabel: string;
  icon: IconKey;
  accent: "haldi" | "mehendi" | "shaadi" | "haldi2";
  dark?: boolean;
}

export const accentColors: Record<CeremonyCard["accent"], string> = {
  haldi: "#C99A2E",
  mehendi: "#4B5D3A",
  shaadi: "#8C1F3B",
  haldi2: "#E4B94F",
};

export const ceremonyCards: CeremonyCard[] = [
  { day: "DAY 01", name: "Engagement", captionLabel: "ENGAGEMENT", icon: "rings", accent: "haldi" },
  { day: "DAY 02", name: "Haldi & Mehendi", captionLabel: "HALDI/MEHENDI", icon: "leaf", accent: "mehendi" },
  { day: "DAY 03", name: "Wedding", captionLabel: "WEDDING", icon: "mandap", accent: "shaadi" },
  { day: "DAY 04", name: "Reception", captionLabel: "RECEPTION", icon: "sparkle", accent: "haldi2", dark: true },
];

// Fan geometry lives apart from content so a layout change (3-card, 5-card, different
// spread) doesn't require touching copy, and vice versa.
export const fanGeometry: { x: string; y: string; r: string }[] = [
  { x: "-96px", y: "14px", r: "-16deg" },
  { x: "-32px", y: "-4px", r: "-5deg" },
  { x: "32px", y: "-4px", r: "5deg" },
  { x: "96px", y: "14px", r: "16deg" },
];

export const chips: { label: string; icon: IconKey }[] = [
  { label: "Vendors", icon: "vendors" },
  { label: "Guests", icon: "guests" },
  { label: "Timeline", icon: "timeline" },
  { label: "Budget", icon: "budget" },
  { label: "Suggestions", icon: "suggestions" },
  { label: "Invites", icon: "invites" },
];

export interface FeatureRowData {
  eyebrow: string;
  heading: string;
  body: string;
  mockup: "timeline" | "vendors" | "budget";
  reverse?: boolean;
}

export const featureRows: FeatureRowData[] = [
  {
    eyebrow: "THE CORE OF SHADIPLAN",
    heading: "Every ceremony, laid out day by day",
    body: "See exactly what's happening on each of your four days — who's arriving when, which vendor is where, and what still needs a decision. No more scrolling through old chats to remember the haldi timing.",
    mockup: "timeline",
  },
  {
    eyebrow: "VENDORS",
    heading: "Know who's booked, who's paid, who's still pending",
    body: "Track every photographer, caterer, decorator and dhol player in one list — status, contact and payment, instead of a spreadsheet nobody opens twice.",
    mockup: "vendors",
    reverse: true,
  },
  {
    eyebrow: "BUDGET",
    heading: "Watch the wallet, not just the vendors",
    body: "Every advance and every balance, tracked against what you set aside — so the budget conversation happens with numbers, not guesses.",
    mockup: "budget",
  },
];

export interface GridCard {
  title: string;
  body: string;
  icon: IconKey;
}

export const gridCards: GridCard[] = [
  {
    title: "Guest list & RSVP",
    body: "Add guests once, assign them to the events they're invited to, and let them RSVP straight from a link.",
    icon: "guests",
  },
  {
    title: "Shared photo album",
    body: "A QR code at the venue turns every guest's phone into a photo booth, dropped straight into one shared album.",
    icon: "photoAlbum",
  },
  {
    title: "Smart suggestions",
    body: "Stuck on a décor theme or a haldi checklist? Get a starting point to react to instead of a blank page.",
    icon: "suggestions",
  },
  {
    title: "Invite cards",
    body: "Generate a shareable invite for each ceremony and send it straight over WhatsApp — no design tool needed.",
    icon: "invites",
  },
];

export interface AppBadge {
  id: "ios" | "android";
  label: string;
  /** Set the real store URL here when each app is published — that alone flips the badge live. */
  href: string | null;
}

export const appBadges: AppBadge[] = [
  { id: "ios", label: "iOS App", href: null },
  { id: "android", label: "Android App", href: null },
];
