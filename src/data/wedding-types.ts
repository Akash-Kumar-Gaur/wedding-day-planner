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
  dueDate: string;
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
  accompanyingCount: number;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  eventDate: string;
  time: string;
  name: string;
  venue: string;
  dressCode: string;
  done: boolean;
}

export interface PendingSuggestion {
  id: string;
  poolItemId: string;
  task: string;
  category: string;
  leadTime: string;
  commonlyMissed: boolean;
  suggestedDate: string;
  status: "pending" | "dismissed";
  batchNonce: number;
}

export interface CreateTimelineEventInput {
  eventDate: string;
  time: string;
  name: string;
  venue?: string;
  dressCode?: string;
}

export interface CommonlyMissedTask {
  id: string;
  task: string;
  leadTime: string;
  category?: string;
  reason?: string;
  done: boolean;
  suggestedDate?: string;
  eventTime?: string;
  venue?: string;
}

export interface PlanningTask {
  id: string;
  task: string;
  leadTime: string;
  category: string;
  done: boolean;
  commonlyMissed: boolean;
  reason?: string;
  suggestedDate: string;
  eventTime?: string;
  venue?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
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
  note?: string;
}

export interface CreateExpenseInput {
  amount: number;
  categoryId: string;
  vendorName?: string;
  date: string;
  note?: string;
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface Wedding {
  id: string;
  ownerId: string;
  coupleNames: string;
  location: string;
  /** First day of the wedding (inclusive). */
  date: string;
  /** Last day of the wedding (inclusive). */
  endDate: string;
  totalBudget: number | null;
  onboardingMode?: "manual" | "ai";
}

export type CollaboratorStatus = "pending" | "accepted";

export interface WeddingCollaborator {
  id: string;
  weddingId: string;
  email: string;
  userId: string | null;
  status: CollaboratorStatus;
  invitedAt: string;
  acceptedAt: string | null;
}

export interface CreateWeddingInput {
  coupleNames: string;
  location: string;
  weddingDate: string;
  endDate: string;
  totalBudget?: number | null;
}

export interface CreateVendorInput {
  name: string;
  category: VendorCategory;
  contactName: string;
  phone: string;
  totalCost: number;
  advancePaid: number;
  dueDate: string;
  status: VendorStatus;
  notes?: string;
}

export interface CreateGuestGroupInput {
  name: string;
  side: "Bride" | "Groom";
}

export interface CreateGuestInput {
  name: string;
  groupId: string;
  phone?: string;
  email?: string;
  meal: MealPref;
  accommodation: boolean;
  transportNeeded: boolean;
  accompanyingCount?: number;
  notes?: string;
}

export interface UpdateGuestInput {
  groupId?: string;
  rsvp?: RsvpStatus;
  meal?: MealPref;
  accommodation?: boolean;
  transportNeeded?: boolean;
  accompanyingCount?: number;
  notes?: string;
  phone?: string;
}
