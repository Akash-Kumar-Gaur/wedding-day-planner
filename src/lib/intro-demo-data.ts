import type {
  BudgetCategory,
  Guest,
  TimelineEvent,
  Vendor,
  WeddingCollaborator,
} from "@/data/wedding-types";
import type { InviteEventDetail } from "@/lib/invite-utils";

export const DEMO_VENDORS: Vendor[] = [
  {
    id: "demo-v1",
    name: "Grand Heritage Banquets",
    category: "Venue",
    contactName: "Priya Sharma",
    phone: "+91 98765 43210",
    totalCost: 450000,
    advancePaid: 150000,
    dueDate: "2026-10-01",
    status: "Confirmed",
    payments: [],
  },
  {
    id: "demo-v2",
    name: "Rang Decor",
    category: "Decor",
    contactName: "Vikram Mehta",
    phone: "+91 91234 56789",
    totalCost: 180000,
    advancePaid: 60000,
    dueDate: "2026-10-15",
    status: "Pending",
    payments: [],
  },
  {
    id: "demo-v3",
    name: "Lens & Light Studio",
    category: "Photography",
    contactName: "Ananya Rao",
    phone: "+91 99887 76655",
    totalCost: 220000,
    advancePaid: 80000,
    dueDate: "2026-11-01",
    status: "Confirmed",
    payments: [],
  },
];

export const DEMO_GUESTS: Guest[] = [
  {
    id: "demo-g1",
    name: "Rahul & Family",
    groupId: "demo-grp",
    rsvp: "Confirmed",
    meal: "Veg",
    accommodation: true,
    transportNeeded: true,
    accompanyingCount: 3,
  },
  {
    id: "demo-g2",
    name: "Meera Patel",
    groupId: "demo-grp",
    rsvp: "Pending",
    meal: "Jain",
    accommodation: false,
    transportNeeded: false,
    accompanyingCount: 1,
  },
  {
    id: "demo-g3",
    name: "Arjun Khanna",
    groupId: "demo-grp",
    rsvp: "Confirmed",
    meal: "Non-veg",
    accommodation: true,
    transportNeeded: false,
    accompanyingCount: 0,
  },
];

export const DEMO_BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: "demo-c1", name: "Venue & catering", planned: 600000, actual: 285000 },
  { id: "demo-c2", name: "Decor & florals", planned: 200000, actual: 95000 },
  { id: "demo-c3", name: "Photography", planned: 250000, actual: 120000 },
];

export const DEMO_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "demo-e1",
    eventDate: "2026-11-14",
    time: "11:00",
    name: "Engagement",
    venue: "Grand Heritage Banquets",
    dressCode: "Formal Indian",
    done: true,
  },
  {
    id: "demo-e2",
    eventDate: "2026-11-14",
    time: "19:00",
    name: "Dinner",
    venue: "Grand Heritage Banquets",
    dressCode: "Smart casual",
    done: false,
  },
  {
    id: "demo-e3",
    eventDate: "2026-11-15",
    time: "10:00",
    name: "Haldi",
    venue: "Rameshwaram The Village Home",
    dressCode: "Yellow / casual",
    done: false,
  },
  {
    id: "demo-e4",
    eventDate: "2026-11-15",
    time: "16:00",
    name: "Mehendi",
    venue: "Rameshwaram The Village Home",
    dressCode: "Colourful",
    done: false,
  },
];

export const DEMO_WEDDING_DAYS = ["2026-11-14", "2026-11-15", "2026-11-16"];

export const DEMO_INVITE_EVENTS: InviteEventDetail[] = [
  { name: "Engagement", dateLabel: "14 Nov · 11:00 am", venue: "Grand Heritage Banquets" },
  { name: "Wedding", dateLabel: "16 Nov · 6:00 pm", venue: "Grand Heritage Banquets" },
  { name: "Reception", dateLabel: "16 Nov · 8:30 pm", venue: "Grand Heritage Banquets" },
];

export const DEMO_COLLABORATORS: WeddingCollaborator[] = [
  {
    id: "demo-col1",
    weddingId: "demo-wedding",
    email: "sister@example.com",
    userId: "demo-user-1",
    status: "accepted",
    invitedAt: "2026-06-01T10:00:00Z",
    acceptedAt: "2026-06-02T08:00:00Z",
  },
  {
    id: "demo-col2",
    weddingId: "demo-wedding",
    email: "dad@example.com",
    userId: null,
    status: "pending",
    invitedAt: "2026-06-10T12:00:00Z",
    acceptedAt: null,
  },
];

export const DEMO_COUPLE_NAMES = "Ananya & Rohan";
export const DEMO_LOCATION = "Udaipur, Rajasthan";

export const DEMO_EVENTS_BY_DATE = DEMO_TIMELINE_EVENTS.reduce<
  Record<string, TimelineEvent[]>
>((acc, event) => {
  const list = acc[event.eventDate] ?? [];
  list.push(event);
  acc[event.eventDate] = list;
  return acc;
}, {});
