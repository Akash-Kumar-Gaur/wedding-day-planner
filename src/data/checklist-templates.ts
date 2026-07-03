export type WeddingTradition =
  | "North Indian Hindu"
  | "South Indian"
  | "Punjabi"
  | "Bengali"
  | "Destination"
  | "Custom";

export type LeadTime = "12mo" | "9mo" | "6mo" | "3mo" | "1mo" | "1wk";

export interface ChecklistTemplateItem {
  id: string;
  category: string;
  task: string;
  leadTime: LeadTime;
  commonlyMissed: boolean;
  appliesTo: WeddingTradition[] | "all";
}

export const LEAD_TIME_LABELS: Record<LeadTime, string> = {
  "12mo": "12 months out",
  "9mo": "9 months out",
  "6mo": "6 months out",
  "3mo": "3 months out",
  "1mo": "1 month out",
  "1wk": "Final week",
};

export const CHECKLIST_TEMPLATES: ChecklistTemplateItem[] = [
  // Venue — 12mo
  {
    id: "venue-book",
    category: "Venue",
    task: "Book primary wedding venue and confirm date hold",
    leadTime: "12mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "venue-guest-block",
    category: "Venue",
    task: "Block guest rooms at hotel — negotiate group rate before local events sell out",
    leadTime: "12mo",
    commonlyMissed: true,
    appliesTo: "all",
  },
  {
    id: "venue-secondary",
    category: "Venue",
    task: "Reserve secondary venues for mehendi, sangeet, and haldi",
    leadTime: "9mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "venue-parking",
    category: "Venue",
    task: "Confirm valet/parking arrangement and guest drop-off points",
    leadTime: "1mo",
    commonlyMissed: true,
    appliesTo: "all",
  },
  {
    id: "venue-rain-plan",
    category: "Venue",
    task: "Backup plan for outdoor ceremonies (marquee, indoor hall, or rain date)",
    leadTime: "3mo",
    commonlyMissed: true,
    appliesTo: "all",
  },
  {
    id: "venue-noise-permit",
    category: "Venue",
    task: "Check sound permit and local noise curfew for late-night sangeet/baraat",
    leadTime: "1mo",
    commonlyMissed: true,
    appliesTo: "all",
  },

  // Catering
  {
    id: "cater-tasting",
    category: "Catering",
    task: "Schedule catering tastings and finalize veg/non-veg/Jain menu split",
    leadTime: "6mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "cater-rsvp-buffer",
    category: "Catering",
    task: "Set RSVP deadline with 2-week buffer before final headcount to caterer",
    leadTime: "3mo",
    commonlyMissed: true,
    appliesTo: "all",
  },
  {
    id: "cater-midnight",
    category: "Catering",
    task: "Plan midnight snacks and day-4 brunch catering",
    leadTime: "1mo",
    commonlyMissed: false,
    appliesTo: ["North Indian Hindu", "Punjabi", "Destination"],
  },
  {
    id: "cater-prasad",
    category: "Catering",
    task: "Arrange prasad and priest meal for ceremony day",
    leadTime: "1mo",
    commonlyMissed: true,
    appliesTo: ["North Indian Hindu", "South Indian", "Punjabi"],
  },

  // Photography & video
  {
    id: "photo-book",
    category: "Photography",
    task: "Book photographer and videographer for all event days",
    leadTime: "9mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "photo-shot-list",
    category: "Photography",
    task: "Share shot list, family groupings, and VIP names with photo team",
    leadTime: "1mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "photo-drone",
    category: "Photography",
    task: "Confirm drone permissions for palace/outdoor venues",
    leadTime: "3mo",
    commonlyMissed: true,
    appliesTo: ["Destination", "North Indian Hindu", "Punjabi"],
  },

  // Decor
  {
    id: "decor-moodboard",
    category: "Decor",
    task: "Finalize decor moodboard, florals, and mandap design",
    leadTime: "6mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "decor-flower-order",
    category: "Decor",
    task: "Place bulk marigold/rose orders — prices spike near wedding season",
    leadTime: "1mo",
    commonlyMissed: true,
    appliesTo: ["North Indian Hindu", "Punjabi", "Bengali"],
  },
  {
    id: "decor-kolam",
    category: "Decor",
    task: "Book kolam/rangoli artists for entrance and ceremony",
    leadTime: "3mo",
    commonlyMissed: false,
    appliesTo: ["South Indian", "North Indian Hindu"],
  },

  // Attire
  {
    id: "attire-bride",
    category: "Attire",
    task: "Order bridal lehenga/saree with alteration timeline buffer",
    leadTime: "9mo",
    commonlyMissed: true,
    appliesTo: "all",
  },
  {
    id: "attire-groom",
    category: "Attire",
    task: "Book groom sherwani/kurta fittings — allow 2 fittings minimum",
    leadTime: "6mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "attire-family",
    category: "Attire",
    task: "Coordinate family outfit colours for sangeet and wedding",
    leadTime: "3mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "attire-dupatta",
    category: "Attire",
    task: "Keep spare dupatta, safety pins, and heel grips in day-of kit",
    leadTime: "1wk",
    commonlyMissed: true,
    appliesTo: ["North Indian Hindu", "Punjabi", "Bengali"],
  },

  // Music & entertainment
  {
    id: "music-dj",
    category: "Music",
    task: "Book DJ/band and share must-play / do-not-play lists",
    leadTime: "6mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "music-dhol",
    category: "Music",
    task: "Book dhol players and baraat route musicians",
    leadTime: "3mo",
    commonlyMissed: false,
    appliesTo: ["North Indian Hindu", "Punjabi"],
  },
  {
    id: "music-sangeet",
    category: "Music",
    task: "Finalize sangeet performances, rehearsals, and AV cues",
    leadTime: "1mo",
    commonlyMissed: false,
    appliesTo: "all",
  },

  // Transport
  {
    id: "transport-shuttle",
    category: "Transport",
    task: "Schedule guest shuttles between hotel, venues, and airport",
    leadTime: "1mo",
    commonlyMissed: true,
    appliesTo: "all",
  },
  {
    id: "transport-baraat",
    category: "Transport",
    task: "Confirm baraat horse/elephant/car route with police if needed",
    leadTime: "1mo",
    commonlyMissed: true,
    appliesTo: ["North Indian Hindu", "Punjabi"],
  },
  {
    id: "transport-vip",
    category: "Transport",
    task: "Arrange VIP airport pickups for out-of-town elders",
    leadTime: "1mo",
    commonlyMissed: false,
    appliesTo: "all",
  },

  // Legal & paperwork
  {
    id: "legal-registration",
    category: "Legal",
    task: "Complete marriage registration / court paperwork if required",
    leadTime: "3mo",
    commonlyMissed: true,
    appliesTo: "all",
  },
  {
    id: "legal-visa",
    category: "Legal",
    task: "Check visa/immigration docs for NRI guests or destination wedding",
    leadTime: "6mo",
    commonlyMissed: true,
    appliesTo: ["Destination", "Custom"],
  },

  // Beauty
  {
    id: "beauty-trial",
    category: "Beauty",
    task: "Book hair and makeup trials 2–3 months ahead (not week-of)",
    leadTime: "3mo",
    commonlyMissed: true,
    appliesTo: "all",
  },
  {
    id: "beauty-bridal-party",
    category: "Beauty",
    task: "Schedule bridal party glam timeline for each event day",
    leadTime: "1mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "beauty-mehendi-artist",
    category: "Beauty",
    task: "Book mehendi artists for bride and family (separate from decor)",
    leadTime: "6mo",
    commonlyMissed: false,
    appliesTo: ["North Indian Hindu", "Punjabi", "Bengali"],
  },

  // Gifts & return favours
  {
    id: "gifts-return",
    category: "Gifts",
    task: "Source and pack return gifts for all events",
    leadTime: "3mo",
    commonlyMissed: true,
    appliesTo: "all",
  },
  {
    id: "gifts-welcome-bags",
    category: "Gifts",
    task: "Prepare welcome bags for hotel guests with itinerary card",
    leadTime: "1mo",
    commonlyMissed: false,
    appliesTo: ["Destination", "North Indian Hindu", "Punjabi"],
  },

  // Invitations
  {
    id: "invite-design",
    category: "Invitations",
    task: "Finalize invitation design, RSVP method, and dress codes",
    leadTime: "9mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "invite-send",
    category: "Invitations",
    task: "Send invitations with clear multi-day schedule and venue map",
    leadTime: "6mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "invite-digital",
    category: "Invitations",
    task: "Set up digital RSVP tracker and meal preference collection",
    leadTime: "6mo",
    commonlyMissed: false,
    appliesTo: "all",
  },

  // Jewelry
  {
    id: "jewelry-order",
    category: "Jewelry",
    task: "Order/customize bridal jewelry and confirm delivery dates",
    leadTime: "6mo",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "jewelry-insurance",
    category: "Jewelry",
    task: "Insure high-value jewelry for transit and event days",
    leadTime: "1mo",
    commonlyMissed: true,
    appliesTo: "all",
  },

  // Tradition-specific
  {
    id: "punjabi-chooda",
    category: "Attire",
    task: "Arrange chooda/kalire ceremony items and maternal uncle rituals",
    leadTime: "1mo",
    commonlyMissed: false,
    appliesTo: ["Punjabi", "North Indian Hindu"],
  },
  {
    id: "bengali-ai-buro",
    category: "Attire",
    task: "Plan ai buro bhaat and gaye holud logistics",
    leadTime: "3mo",
    commonlyMissed: false,
    appliesTo: ["Bengali"],
  },
  {
    id: "south-muhurtham",
    category: "Legal",
    task: "Confirm muhurtham/nakshatra with priest and family astrologer",
    leadTime: "12mo",
    commonlyMissed: false,
    appliesTo: ["South Indian"],
  },
  {
    id: "south-nadaswaram",
    category: "Music",
    task: "Book nadaswaram/melam for muhurtham and reception",
    leadTime: "6mo",
    commonlyMissed: false,
    appliesTo: ["South Indian"],
  },
  {
    id: "dest-welcome-event",
    category: "Venue",
    task: "Plan welcome dinner and local experience for flying guests",
    leadTime: "6mo",
    commonlyMissed: false,
    appliesTo: ["Destination"],
  },
  {
    id: "dest-local-vendor",
    category: "Venue",
    task: "Hire local wedding coordinator familiar with venue permits",
    leadTime: "9mo",
    commonlyMissed: true,
    appliesTo: ["Destination"],
  },

  // Emergency & day-of
  {
    id: "emergency-kit",
    category: "Emergency kit",
    task: "Pack day-of emergency kit: safety pins, stain remover, medicines, sewing kit",
    leadTime: "1wk",
    commonlyMissed: true,
    appliesTo: "all",
  },
  {
    id: "emergency-contacts",
    category: "Emergency kit",
    task: "Share vendor + family emergency contact sheet with coordinator",
    leadTime: "1wk",
    commonlyMissed: false,
    appliesTo: "all",
  },
  {
    id: "emergency-power",
    category: "Emergency kit",
    task: "Confirm generator/power backup for outdoor mandap and lighting",
    leadTime: "1mo",
    commonlyMissed: true,
    appliesTo: ["Destination", "North Indian Hindu", "Punjabi"],
  },
  {
    id: "priest-puja-samagri",
    category: "Legal",
    task: "Confirm priest, puja samagri list, and havan kund requirements",
    leadTime: "1mo",
    commonlyMissed: true,
    appliesTo: ["North Indian Hindu", "South Indian", "Punjabi"],
  },
  {
    id: "fireworks-permit",
    category: "Legal",
    task: "Check fireworks/sparkler permissions at venue",
    leadTime: "1mo",
    commonlyMissed: true,
    appliesTo: ["North Indian Hindu", "Punjabi", "Bengali"],
  },
];

export function getTemplateFor(tradition: WeddingTradition): ChecklistTemplateItem[] {
  return CHECKLIST_TEMPLATES.filter(
    (item) => item.appliesTo === "all" || item.appliesTo.includes(tradition),
  );
}
