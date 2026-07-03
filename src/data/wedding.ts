// Mock data for ShadiPlan. Shapes mirror a realistic relational schema
// so this can be swapped for Supabase queries later.

export type VendorCategory =
  | "Venue"
  | "Catering"
  | "Photography"
  | "Decor"
  | "Transport"
  | "Music"
  | "Attire"
  | "Other";

export type VendorStatus = "Confirmed" | "Pending" | "Paid";

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contactName: string;
  phone: string;
  totalCost: number;
  advancePaid: number;
  dueDate: string; // ISO
  status: VendorStatus;
  notes?: string;
  payments: { id: string; amount: number; date: string; note?: string }[];
}

export type RsvpStatus = "Confirmed" | "Pending" | "Declined";
export type MealPref = "Veg" | "Non-veg" | "Jain";

export interface GuestGroup {
  id: string;
  name: string;
  side: "Bride" | "Groom";
}

export interface Guest {
  id: string;
  name: string;
  groupId: string;
  phone?: string;
  email?: string;
  rsvp: RsvpStatus;
  meal: MealPref;
  accommodation: boolean;
  transportNeeded: boolean;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  day: 1 | 2 | 3 | 4;
  time: string; // "18:30"
  name: string;
  venue: string;
  dressCode: string;
  done: boolean;
}

export interface BudgetCategory {
  id: string;
  name: VendorCategory | "Misc";
  planned: number;
  actual: number;
}

export interface Transaction {
  id: string;
  vendorId?: string;
  vendorName: string;
  categoryId: string;
  amount: number;
  date: string;
}

export const WEDDING = {
  coupleNames: "Aanya & Rohan",
  location: "Udaipur, Rajasthan",
  date: "2026-11-14",
  totalBudget: 4500000,
};

export const daysUntilWedding = (): number => {
  const target = new Date(WEDDING.date).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
};

export const vendors: Vendor[] = [
  {
    id: "v1",
    name: "The Leela Palace",
    category: "Venue",
    contactName: "Vikram Singh",
    phone: "+91 98290 12345",
    totalCost: 1800000,
    advancePaid: 900000,
    dueDate: "2026-10-01",
    status: "Confirmed",
    notes: "Includes 3 halls + poolside lawn. Ask about extra AV rental.",
    payments: [
      { id: "p1", amount: 500000, date: "2026-03-10", note: "Booking advance" },
      { id: "p2", amount: 400000, date: "2026-07-20", note: "Second installment" },
    ],
  },
  {
    id: "v2",
    name: "Saffron Catering Co.",
    category: "Catering",
    contactName: "Meera Kapoor",
    phone: "+91 98111 23456",
    totalCost: 750000,
    advancePaid: 200000,
    dueDate: "2026-08-15",
    status: "Pending",
    payments: [{ id: "p3", amount: 200000, date: "2026-05-02", note: "Advance" }],
  },
  {
    id: "v3",
    name: "Stories by Arjun",
    category: "Photography",
    contactName: "Arjun Mehta",
    phone: "+91 99876 54321",
    totalCost: 320000,
    advancePaid: 320000,
    dueDate: "2026-06-01",
    status: "Paid",
    payments: [{ id: "p4", amount: 320000, date: "2026-04-11", note: "Paid in full" }],
  },
  {
    id: "v4",
    name: "Marigold Decor Studio",
    category: "Decor",
    contactName: "Priya Nair",
    phone: "+91 98765 11223",
    totalCost: 480000,
    advancePaid: 150000,
    dueDate: "2026-08-05",
    status: "Pending",
    payments: [{ id: "p5", amount: 150000, date: "2026-05-18" }],
  },
  {
    id: "v5",
    name: "Rajasthan Rides",
    category: "Transport",
    contactName: "Karan Rathore",
    phone: "+91 90123 44556",
    totalCost: 180000,
    advancePaid: 60000,
    dueDate: "2026-10-20",
    status: "Confirmed",
    payments: [{ id: "p6", amount: 60000, date: "2026-06-01" }],
  },
  {
    id: "v6",
    name: "Dhol Baaje Band",
    category: "Music",
    contactName: "Rohit Sharma",
    phone: "+91 90000 77889",
    totalCost: 140000,
    advancePaid: 40000,
    dueDate: "2026-09-30",
    status: "Confirmed",
    payments: [{ id: "p7", amount: 40000, date: "2026-05-14" }],
  },
  {
    id: "v7",
    name: "Anita Dongre Atelier",
    category: "Attire",
    contactName: "Studio Manager",
    phone: "+91 91234 55667",
    totalCost: 420000,
    advancePaid: 210000,
    dueDate: "2026-09-01",
    status: "Pending",
    payments: [{ id: "p8", amount: 210000, date: "2026-04-22" }],
  },
];

export const guestGroups: GuestGroup[] = [
  { id: "g1", name: "Aanya's Immediate Family", side: "Bride" },
  { id: "g2", name: "Rohan's Immediate Family", side: "Groom" },
  { id: "g3", name: "Kapoor Cousins", side: "Bride" },
  { id: "g4", name: "College Friends", side: "Groom" },
  { id: "g5", name: "Mumbai Neighbours", side: "Bride" },
];

export const guests: Guest[] = [
  { id: "u1", name: "Neha Kapoor", groupId: "g1", phone: "+91 90000 11111", rsvp: "Confirmed", meal: "Veg", accommodation: true, transportNeeded: false },
  { id: "u2", name: "Arun Kapoor", groupId: "g1", phone: "+91 90000 22222", rsvp: "Confirmed", meal: "Veg", accommodation: true, transportNeeded: false },
  { id: "u3", name: "Dadi Kapoor", groupId: "g1", rsvp: "Confirmed", meal: "Jain", accommodation: true, transportNeeded: true, notes: "Ground floor room, wheelchair access." },
  { id: "u4", name: "Ravi Sharma", groupId: "g2", phone: "+91 90000 33333", rsvp: "Confirmed", meal: "Non-veg", accommodation: true, transportNeeded: false },
  { id: "u5", name: "Anita Sharma", groupId: "g2", rsvp: "Confirmed", meal: "Veg", accommodation: true, transportNeeded: false },
  { id: "u6", name: "Ishaan Kapoor", groupId: "g3", rsvp: "Pending", meal: "Non-veg", accommodation: false, transportNeeded: false },
  { id: "u7", name: "Tanya Kapoor", groupId: "g3", rsvp: "Pending", meal: "Veg", accommodation: false, transportNeeded: false },
  { id: "u8", name: "Kabir Malhotra", groupId: "g4", phone: "+91 90000 44444", rsvp: "Confirmed", meal: "Non-veg", accommodation: true, transportNeeded: true },
  { id: "u9", name: "Sara Iyer", groupId: "g4", rsvp: "Declined", meal: "Veg", accommodation: false, transportNeeded: false, notes: "Traveling abroad." },
  { id: "u10", name: "Zoya Khan", groupId: "g4", rsvp: "Confirmed", meal: "Non-veg", accommodation: true, transportNeeded: true },
  { id: "u11", name: "Mr. & Mrs. Desai", groupId: "g5", rsvp: "Pending", meal: "Veg", accommodation: false, transportNeeded: false },
  { id: "u12", name: "Ritika Shah", groupId: "g5", rsvp: "Confirmed", meal: "Jain", accommodation: false, transportNeeded: false },
];

export const timelineEvents: TimelineEvent[] = [
  // Day 1
  { id: "t1", day: 1, time: "16:00", name: "Guest arrivals & welcome tea", venue: "Leela Lobby", dressCode: "Smart casual", done: true },
  { id: "t2", day: 1, time: "19:00", name: "Mehendi ceremony", venue: "Poolside Lawn", dressCode: "Yellow / green florals", done: true },
  { id: "t3", day: 1, time: "21:00", name: "Family dinner", venue: "Chandni Terrace", dressCode: "Indian casual", done: false },
  // Day 2
  { id: "t4", day: 2, time: "10:00", name: "Haldi ceremony", venue: "Poolside Lawn", dressCode: "Yellow cotton", done: false },
  { id: "t5", day: 2, time: "13:00", name: "Lunch", venue: "Chandni Terrace", dressCode: "As-is", done: false },
  { id: "t6", day: 2, time: "19:30", name: "Sangeet night", venue: "Durbar Hall", dressCode: "Full Indian, jewel tones", done: false },
  { id: "t7", day: 2, time: "23:00", name: "After-party", venue: "Rooftop Bar", dressCode: "Cocktail", done: false },
  // Day 3
  { id: "t8", day: 3, time: "08:00", name: "Baraat arrival", venue: "Main Gate", dressCode: "Groom side sherwani", done: false },
  { id: "t9", day: 3, time: "10:30", name: "Wedding ceremony", venue: "Sheesh Mahal", dressCode: "Traditional, red/gold", done: false },
  { id: "t10", day: 3, time: "14:00", name: "Wedding lunch", venue: "Chandni Terrace", dressCode: "As-is", done: false },
  { id: "t11", day: 3, time: "20:00", name: "Reception", venue: "Durbar Hall", dressCode: "Black tie / lehenga", done: false },
  // Day 4
  { id: "t12", day: 4, time: "10:00", name: "Farewell brunch", venue: "Poolside Lawn", dressCode: "Brunch casual", done: false },
  { id: "t13", day: 4, time: "13:00", name: "Guest departures", venue: "Leela Lobby", dressCode: "Travel", done: false },
];

export const budgetCategories: BudgetCategory[] = [
  { id: "b1", name: "Venue", planned: 2000000, actual: 1800000 },
  { id: "b2", name: "Catering", planned: 800000, actual: 750000 },
  { id: "b3", name: "Photography", planned: 350000, actual: 320000 },
  { id: "b4", name: "Decor", planned: 500000, actual: 480000 },
  { id: "b5", name: "Attire", planned: 400000, actual: 420000 },
  { id: "b6", name: "Transport", planned: 200000, actual: 180000 },
  { id: "b7", name: "Music", planned: 150000, actual: 140000 },
  { id: "b8", name: "Misc", planned: 100000, actual: 65000 },
];

export const transactions: Transaction[] = [
  { id: "tx1", vendorId: "v1", vendorName: "The Leela Palace", categoryId: "b1", amount: 500000, date: "2026-03-10" },
  { id: "tx2", vendorId: "v3", vendorName: "Stories by Arjun", categoryId: "b3", amount: 320000, date: "2026-04-11" },
  { id: "tx3", vendorId: "v7", vendorName: "Anita Dongre Atelier", categoryId: "b5", amount: 210000, date: "2026-04-22" },
  { id: "tx4", vendorId: "v2", vendorName: "Saffron Catering Co.", categoryId: "b2", amount: 200000, date: "2026-05-02" },
  { id: "tx5", vendorId: "v6", vendorName: "Dhol Baaje Band", categoryId: "b7", amount: 40000, date: "2026-05-14" },
  { id: "tx6", vendorId: "v4", vendorName: "Marigold Decor Studio", categoryId: "b4", amount: 150000, date: "2026-05-18" },
  { id: "tx7", vendorId: "v5", vendorName: "Rajasthan Rides", categoryId: "b6", amount: 60000, date: "2026-06-01" },
  { id: "tx8", vendorId: "v1", vendorName: "The Leela Palace", categoryId: "b1", amount: 400000, date: "2026-07-20" },
];

export const formatINR = (n: number): string =>
  "₹" + new Intl.NumberFormat("en-IN").format(n);

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const daysUntil = (iso: string): number =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));