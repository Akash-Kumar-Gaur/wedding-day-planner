import { supabase } from "@/lib/supabase";
import type {
  BudgetCategory,
  CreateExpenseInput,
  CreateGuestGroupInput,
  CreateGuestInput,
  CreateTimelineEventInput,
  CreateVendorInput,
  CreateWeddingInput,
  Guest,
  GuestGroup,
  PendingSuggestion,
  PlanningTask,
  TimelineEvent,
  Transaction,
  UpdateExpenseInput,
  UpdateGuestInput,
  Vendor,
  VendorCategory,
  VendorStatus,
  Wedding,
  WeddingCollaborator,
} from "@/data/wedding-types";

type WeddingRow = {
  id: string;
  owner_id: string;
  couple_names: string;
  location: string | null;
  wedding_date: string;
  end_date: string;
  total_budget: number | null;
  onboarding_mode: string | null;
};

type VendorRow = {
  id: string;
  wedding_id: string;
  name: string;
  category: string;
  contact_name: string | null;
  phone: string | null;
  total_cost: number;
  advance_paid: number;
  due_date: string | null;
  status: string;
  notes: string | null;
};

type PaymentRow = {
  id: string;
  vendor_id: string;
  amount: number;
  paid_date: string;
  note: string | null;
};

function mapWedding(row: WeddingRow): Wedding {
  return {
    id: row.id,
    ownerId: row.owner_id,
    coupleNames: row.couple_names,
    location: row.location ?? "",
    date: row.wedding_date,
    endDate: row.end_date ?? row.wedding_date,
    totalBudget: row.total_budget != null ? Number(row.total_budget) : null,
    onboardingMode: row.onboarding_mode === "ai" ? "ai" : "manual",
  };
}

function asVendorCategory(value: string): VendorCategory {
  const allowed: VendorCategory[] = [
    "Venue",
    "Catering",
    "Photography",
    "Decor",
    "Transport",
    "Music",
    "Attire",
    "Other",
  ];
  return allowed.find((c) => c === value) ?? "Other";
}

function asVendorStatus(value: string): VendorStatus {
  if (value === "Confirmed" || value === "Paid") return value;
  return "Pending";
}

function mapVendor(row: VendorRow, payments: PaymentRow[]): Vendor {
  return {
    id: row.id,
    name: row.name,
    category: asVendorCategory(row.category),
    contactName: row.contact_name ?? "",
    phone: row.phone ?? "",
    totalCost: Number(row.total_cost),
    advancePaid: Number(row.advance_paid),
    dueDate: row.due_date ?? "",
    status: asVendorStatus(row.status),
    notes: row.notes ?? undefined,
    payments: payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      date: p.paid_date,
      note: p.note ?? undefined,
    })),
  };
}

export async function updateWeddingOnboardingMode(
  weddingId: string,
  mode: "manual" | "ai",
): Promise<void> {
  const { error } = await supabase
    .from("weddings")
    .update({ onboarding_mode: mode })
    .eq("id", weddingId);
  if (error) throw error;
}

export async function resolveUserWedding(userId: string, userEmail: string): Promise<Wedding | null> {
  const normalizedEmail = userEmail.trim().toLowerCase();

  const { data: owned, error: ownedError } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();
  if (ownedError) throw ownedError;
  if (owned) return mapWedding(owned as WeddingRow);

  const { data: pending, error: pendingError } = await supabase
    .from("wedding_collaborators")
    .select("id, wedding_id")
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .maybeSingle();
  if (pendingError) throw pendingError;

  if (pending) {
    const { error: acceptError } = await supabase
      .from("wedding_collaborators")
      .update({
        user_id: userId,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", pending.id);
    if (acceptError) throw acceptError;

    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("*")
      .eq("id", pending.wedding_id)
      .single();
    if (weddingError) throw weddingError;
    return mapWedding(wedding as WeddingRow);
  }

  const { data: membership, error: memberError } = await supabase
    .from("wedding_collaborators")
    .select("wedding_id")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();
  if (memberError) throw memberError;
  if (membership) {
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("*")
      .eq("id", membership.wedding_id)
      .single();
    if (weddingError) throw weddingError;
    return mapWedding(wedding as WeddingRow);
  }

  return null;
}

/** @deprecated Use resolveUserWedding */
export async function fetchWeddingForUser(userId: string): Promise<Wedding | null> {
  const { data, error } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapWedding(data as WeddingRow) : null;
}

type CollaboratorRow = {
  id: string;
  wedding_id: string;
  email: string;
  user_id: string | null;
  status: string;
  invited_at: string;
  accepted_at: string | null;
};

function mapCollaborator(row: CollaboratorRow): WeddingCollaborator {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    email: row.email,
    userId: row.user_id,
    status: row.status === "accepted" ? "accepted" : "pending",
    invitedAt: row.invited_at,
    acceptedAt: row.accepted_at,
  };
}

export async function fetchCollaborators(weddingId: string): Promise<WeddingCollaborator[]> {
  const { data, error } = await supabase
    .from("wedding_collaborators")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("invited_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapCollaborator(row as CollaboratorRow));
}

export async function inviteCollaborator(
  weddingId: string,
  email: string,
): Promise<WeddingCollaborator> {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("wedding_collaborators")
    .insert({
      wedding_id: weddingId,
      email: normalized,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return mapCollaborator(data as CollaboratorRow);
}

export async function createWedding(
  ownerId: string,
  input: CreateWeddingInput,
): Promise<Wedding> {
  const { data, error } = await supabase
    .from("weddings")
    .insert({
      owner_id: ownerId,
      couple_names: input.coupleNames,
      location: input.location,
      wedding_date: input.weddingDate,
      end_date: input.endDate,
      total_budget: input.totalBudget ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  const wedding = mapWedding(data as WeddingRow);
  await seedDefaultBudgetCategories(wedding.id);
  return wedding;
}

export async function updateWedding(
  weddingId: string,
  input: Partial<CreateWeddingInput>,
): Promise<Wedding> {
  const payload: Record<string, unknown> = {};
  if (input.coupleNames !== undefined) payload.couple_names = input.coupleNames;
  if (input.location !== undefined) payload.location = input.location;
  if (input.weddingDate !== undefined) payload.wedding_date = input.weddingDate;
  if (input.endDate !== undefined) payload.end_date = input.endDate;
  if (input.totalBudget !== undefined) payload.total_budget = input.totalBudget;

  const { data, error } = await supabase
    .from("weddings")
    .update(payload)
    .eq("id", weddingId)
    .select()
    .single();

  if (error) throw error;
  return mapWedding(data as WeddingRow);
}

export async function redistributeBudgetPlanned(
  weddingId: string,
  totalBudget: number,
  categories: BudgetCategory[],
): Promise<void> {
  if (categories.length === 0) return;
  const plannedEach = Math.round(totalBudget / categories.length);
  const updates = categories.map((cat) =>
    supabase.from("budget_categories").update({ planned: plannedEach }).eq("id", cat.id),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export const DEFAULT_BUDGET_CATEGORIES = [
  "Venue",
  "Catering",
  "Photography",
  "Decor",
  "Attire",
  "Transport",
  "Music",
  "Jewelry",
  "Misc",
] as const;

async function seedDefaultBudgetCategories(weddingId: string): Promise<void> {
  const { error } = await supabase.from("budget_categories").insert(
    DEFAULT_BUDGET_CATEGORIES.map((name) => ({
      wedding_id: weddingId,
      name,
      planned: 0,
      actual: 0,
    })),
  );
  if (error) throw error;
}

export async function insertBudgetCategory(
  weddingId: string,
  input: { name: string; planned?: number },
): Promise<BudgetCategory> {
  const { data, error } = await supabase
    .from("budget_categories")
    .insert({
      wedding_id: weddingId,
      name: input.name.trim(),
      planned: input.planned ?? 0,
      actual: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    planned: Number(data.planned),
    actual: Number(data.actual),
  };
}

export async function updateBudgetCategory(
  weddingId: string,
  id: string,
  patch: { name?: string; planned?: number },
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.planned !== undefined) payload.planned = patch.planned;
  const { error } = await supabase
    .from("budget_categories")
    .update(payload)
    .eq("wedding_id", weddingId)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteBudgetCategory(weddingId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from("budget_categories")
    .delete()
    .eq("wedding_id", weddingId)
    .eq("id", id);
  if (error) throw error;
}

export async function fetchVendors(weddingId: string): Promise<Vendor[]> {
  const { data: vendorRows, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("name");

  if (error) throw error;
  if (!vendorRows?.length) return [];

  const vendorIds = vendorRows.map((v) => v.id);
  const { data: paymentRows, error: payError } = await supabase
    .from("vendor_payments")
    .select("*")
    .in("vendor_id", vendorIds);

  if (payError) throw payError;

  const paymentsByVendor = new Map<string, PaymentRow[]>();
  for (const payment of paymentRows ?? []) {
    const list = paymentsByVendor.get(payment.vendor_id) ?? [];
    list.push(payment as PaymentRow);
    paymentsByVendor.set(payment.vendor_id, list);
  }

  return (vendorRows as VendorRow[]).map((row) =>
    mapVendor(row, paymentsByVendor.get(row.id) ?? []),
  );
}

export async function insertVendor(
  weddingId: string,
  input: CreateVendorInput,
  budgetCategories: BudgetCategory[],
): Promise<Vendor> {
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      wedding_id: weddingId,
      name: input.name.trim(),
      category: input.category,
      contact_name: input.contactName.trim() || null,
      phone: input.phone.trim() || null,
      total_cost: input.totalCost,
      advance_paid: 0,
      due_date: input.dueDate || null,
      status: input.status,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;

  let vendor = mapVendor(data as VendorRow, []);

  if (input.advancePaid > 0) {
    const categoryId =
      budgetCategories.find((c) => c.name === input.category)?.id ??
      budgetCategories[0]?.id;
    if (categoryId) {
      const paidDate = new Date().toISOString().slice(0, 10);
      await recordVendorPayment(weddingId, vendor, categoryId, input.advancePaid, paidDate);
      const refreshed = await fetchVendors(weddingId);
      vendor = refreshed.find((v) => v.id === vendor.id) ?? vendor;
    } else {
      await supabase
        .from("vendors")
        .update({ advance_paid: input.advancePaid })
        .eq("id", vendor.id);
      vendor = { ...vendor, advancePaid: input.advancePaid };
    }
  }

  return vendor;
}

export async function insertGuestGroup(
  weddingId: string,
  input: CreateGuestGroupInput,
): Promise<GuestGroup> {
  const { data, error } = await supabase
    .from("guest_groups")
    .insert({
      wedding_id: weddingId,
      name: input.name.trim(),
      side: input.side,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    side: data.side === "Groom" ? "Groom" : "Bride",
  };
}

export async function insertGuest(weddingId: string, input: CreateGuestInput): Promise<Guest> {
  const { data, error } = await supabase
    .from("guests")
    .insert({
      wedding_id: weddingId,
      group_id: input.groupId,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      rsvp: "Pending",
      meal: input.meal,
      accommodation: input.accommodation,
      transport_needed: input.transportNeeded,
      accompanying_count: input.accompanyingCount ?? 0,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    groupId: data.group_id ?? "",
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    rsvp: (data.rsvp as Guest["rsvp"]) ?? "Pending",
    meal: (data.meal as Guest["meal"]) ?? "Veg",
    accommodation: data.accommodation ?? false,
    transportNeeded: data.transport_needed ?? false,
    accompanyingCount: data.accompanying_count ?? 0,
    notes: data.notes ?? undefined,
  };
}

export async function updateGuest(
  weddingId: string,
  id: string,
  patch: UpdateGuestInput,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.groupId !== undefined) payload.group_id = patch.groupId;
  if (patch.rsvp !== undefined) payload.rsvp = patch.rsvp;
  if (patch.meal !== undefined) payload.meal = patch.meal;
  if (patch.accommodation !== undefined) payload.accommodation = patch.accommodation;
  if (patch.transportNeeded !== undefined) payload.transport_needed = patch.transportNeeded;
  if (patch.accompanyingCount !== undefined) payload.accompanying_count = patch.accompanyingCount;
  if (patch.notes !== undefined) payload.notes = patch.notes?.trim() || null;
  if (patch.phone !== undefined) payload.phone = patch.phone?.trim() || null;

  const { error } = await supabase
    .from("guests")
    .update(payload)
    .eq("wedding_id", weddingId)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteGuest(weddingId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("wedding_id", weddingId)
    .eq("id", id);
  if (error) throw error;
}

export async function fetchGuestGroups(weddingId: string): Promise<GuestGroup[]> {
  const { data, error } = await supabase
    .from("guest_groups")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("name");

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    side: (row.side === "Groom" ? "Groom" : "Bride") as "Bride" | "Groom",
  }));
}

export async function fetchGuests(weddingId: string): Promise<Guest[]> {
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("name");

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    groupId: row.group_id ?? "",
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    rsvp: (row.rsvp as Guest["rsvp"]) ?? "Pending",
    meal: (row.meal as Guest["meal"]) ?? "Veg",
    accommodation: row.accommodation ?? false,
    transportNeeded: row.transport_needed ?? false,
    accompanyingCount: row.accompanying_count ?? 0,
    notes: row.notes ?? undefined,
  }));
}

export async function fetchTimelineEvents(weddingId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from("timeline_events")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("event_date")
    .order("event_time");

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    eventDate: row.event_date,
    time: row.event_time,
    name: row.name,
    venue: row.venue ?? "",
    dressCode: row.dress_code ?? "",
    done: row.done ?? false,
  }));
}

export async function insertTimelineEvent(
  weddingId: string,
  input: CreateTimelineEventInput,
): Promise<TimelineEvent> {
  const { data, error } = await supabase
    .from("timeline_events")
    .insert({
      wedding_id: weddingId,
      event_date: input.eventDate,
      event_time: input.time,
      name: input.name.trim(),
      venue: input.venue?.trim() || "",
      dress_code: input.dressCode?.trim() || "",
      done: false,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    eventDate: data.event_date,
    time: data.event_time,
    name: data.name,
    venue: data.venue ?? "",
    dressCode: data.dress_code ?? "",
    done: data.done ?? false,
  };
}

/** @deprecated Prefer insertTimelineEvent for single events */
export async function insertTimelineEvents(
  weddingId: string,
  events: Omit<TimelineEvent, "id">[],
): Promise<TimelineEvent[]> {
  if (!events.length) return [];
  const { data, error } = await supabase
    .from("timeline_events")
    .insert(
      events.map((e) => ({
        wedding_id: weddingId,
        event_date: e.eventDate,
        event_time: e.time,
        name: e.name,
        venue: e.venue,
        dress_code: e.dressCode,
        done: e.done,
      })),
    )
    .select();

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    eventDate: row.event_date,
    time: row.event_time,
    name: row.name,
    venue: row.venue ?? "",
    dressCode: row.dress_code ?? "",
    done: row.done ?? false,
  }));
}

export async function updateTimelineEvent(
  id: string,
  patch: Partial<Pick<TimelineEvent, "time" | "name" | "venue" | "dressCode" | "done" | "eventDate">>,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.time !== undefined) payload.event_time = patch.time;
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.venue !== undefined) payload.venue = patch.venue;
  if (patch.dressCode !== undefined) payload.dress_code = patch.dressCode;
  if (patch.done !== undefined) payload.done = patch.done;
  if (patch.eventDate !== undefined) payload.event_date = patch.eventDate || null;
  const { error } = await supabase.from("timeline_events").update(payload).eq("id", id);
  if (error) throw error;
}

export async function updateTimelineEventDone(id: string, done: boolean): Promise<void> {
  await updateTimelineEvent(id, { done });
}

type PlanningTaskRow = {
  id: string;
  wedding_id: string;
  task: string;
  lead_time: string;
  category: string;
  commonly_missed: boolean;
  reason: string | null;
  done: boolean;
  suggested_date: string | null;
  event_time: string | null;
  venue: string | null;
};

function mapPlanningTask(row: PlanningTaskRow): PlanningTask {
  return {
    id: row.id,
    task: row.task,
    leadTime: row.lead_time,
    category: row.category,
    commonlyMissed: row.commonly_missed,
    reason: row.reason ?? undefined,
    done: row.done,
    suggestedDate: row.suggested_date ?? "",
    eventTime: row.event_time ?? undefined,
    venue: row.venue ?? undefined,
  };
}

export async function fetchPlanningTasks(weddingId: string): Promise<PlanningTask[]> {
  const { data, error } = await supabase
    .from("planning_tasks")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("suggested_date", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapPlanningTask(row as PlanningTaskRow));
}

export async function insertPlanningTasks(
  weddingId: string,
  inputs: Array<Omit<PlanningTask, "id">>,
): Promise<void> {
  if (!inputs.length) return;
  const { error } = await supabase.from("planning_tasks").insert(
    inputs.map((input) => ({
      wedding_id: weddingId,
      task: input.task,
      lead_time: input.leadTime,
      category: input.category,
      commonly_missed: input.commonlyMissed,
      reason: input.reason ?? null,
      done: input.done,
      suggested_date: input.suggestedDate || null,
      event_time: input.eventTime || null,
      venue: input.venue || null,
    })),
  );
  if (error) throw error;
}

export async function deletePlanningTask(weddingId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from("planning_tasks")
    .delete()
    .eq("wedding_id", weddingId)
    .eq("id", id);
  if (error) throw error;
}

export async function insertPlanningTask(
  weddingId: string,
  input: Omit<PlanningTask, "id">,
): Promise<PlanningTask> {
  const { data, error } = await supabase
    .from("planning_tasks")
    .insert({
      wedding_id: weddingId,
      task: input.task,
      lead_time: input.leadTime,
      category: input.category,
      commonly_missed: input.commonlyMissed,
      reason: input.reason ?? null,
      done: input.done,
      suggested_date: input.suggestedDate || null,
      event_time: input.eventTime || null,
      venue: input.venue || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPlanningTask(data as PlanningTaskRow);
}

/** @deprecated Use per-item accept flow instead of bulk replace */
export async function replacePlanningTasks(
  weddingId: string,
  tasks: PlanningTask[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("planning_tasks")
    .delete()
    .eq("wedding_id", weddingId);
  if (deleteError) throw deleteError;
  if (!tasks.length) return;

  const { error: insertError } = await supabase.from("planning_tasks").insert(
    tasks.map((t) => ({
      id: t.id,
      wedding_id: weddingId,
      task: t.task,
      lead_time: t.leadTime,
      category: t.category,
      commonly_missed: t.commonlyMissed,
      reason: t.reason ?? null,
      done: t.done,
      suggested_date: t.suggestedDate ?? null,
      event_time: t.eventTime ?? null,
      venue: t.venue ?? null,
    })),
  );
  if (insertError) throw insertError;
}

export async function updatePlanningTask(
  weddingId: string,
  id: string,
  patch: Partial<Pick<PlanningTask, "done" | "suggestedDate" | "eventTime" | "venue" | "task">>,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.done !== undefined) payload.done = patch.done;
  if (patch.suggestedDate !== undefined) payload.suggested_date = patch.suggestedDate || null;
  if (patch.eventTime !== undefined) payload.event_time = patch.eventTime || null;
  if (patch.venue !== undefined) payload.venue = patch.venue || null;
  if (patch.task !== undefined) payload.task = patch.task;
  const { error } = await supabase
    .from("planning_tasks")
    .update(payload)
    .eq("wedding_id", weddingId)
    .eq("id", id);
  if (error) throw error;
}

type PendingSuggestionRow = {
  id: string;
  wedding_id: string;
  pool_item_id: string;
  task: string;
  category: string;
  lead_time: string;
  commonly_missed: boolean;
  suggested_date: string | null;
  status: string;
  batch_nonce: number;
};

function mapPendingSuggestion(row: PendingSuggestionRow): PendingSuggestion {
  return {
    id: row.id,
    poolItemId: row.pool_item_id,
    task: row.task,
    category: row.category,
    leadTime: row.lead_time,
    commonlyMissed: row.commonly_missed,
    suggestedDate: row.suggested_date ?? "",
    status: row.status === "dismissed" ? "dismissed" : "pending",
    batchNonce: row.batch_nonce,
  };
}

export async function fetchPendingSuggestions(weddingId: string): Promise<PendingSuggestion[]> {
  const { data, error } = await supabase
    .from("pending_suggestions")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("category")
    .order("created_at");

  if (error) throw error;
  return (data ?? []).map((row) => mapPendingSuggestion(row as PendingSuggestionRow));
}

export async function fetchUsedSuggestionPoolItemIds(weddingId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("pending_suggestions")
    .select("pool_item_id")
    .eq("wedding_id", weddingId);

  if (error) throw error;
  return (data ?? []).map((r) => r.pool_item_id);
}

export async function syncPendingSuggestionsBatch(
  weddingId: string,
  items: Array<{
    poolItemId: string;
    task: string;
    category: string;
    leadTime: string;
    commonlyMissed: boolean;
    suggestedDate: string;
    batchNonce: number;
  }>,
  opts?: { categories?: string[]; usedPoolItemIds?: string[] },
): Promise<PendingSuggestion[]> {
  let usedPoolIds: Set<string>;
  if (opts?.usedPoolItemIds) {
    usedPoolIds = new Set(opts.usedPoolItemIds);
  } else {
    const { data, error: existingError } = await supabase
      .from("pending_suggestions")
      .select("pool_item_id")
      .eq("wedding_id", weddingId);
    if (existingError) throw existingError;
    usedPoolIds = new Set((data ?? []).map((r) => r.pool_item_id));
  }

  let deleteQuery = supabase
    .from("pending_suggestions")
    .delete()
    .eq("wedding_id", weddingId)
    .eq("status", "pending");

  if (opts?.categories?.length) {
    deleteQuery = deleteQuery.in("category", opts.categories);
  }

  const { error: deleteError } = await deleteQuery;
  if (deleteError) throw deleteError;

  const toInsert = items.filter((item) => !usedPoolIds.has(item.poolItemId));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("pending_suggestions").upsert(
      toInsert.map((item) => ({
        wedding_id: weddingId,
        pool_item_id: item.poolItemId,
        task: item.task,
        category: item.category,
        lead_time: item.leadTime,
        commonly_missed: item.commonlyMissed,
        suggested_date: item.suggestedDate || null,
        status: "pending",
        batch_nonce: item.batchNonce,
      })),
      { onConflict: "wedding_id,pool_item_id", ignoreDuplicates: true },
    );

    if (insertError) throw insertError;
  }

  return fetchPendingSuggestions(weddingId);
}

export async function updatePendingSuggestion(
  id: string,
  patch: Partial<Pick<PendingSuggestion, "task" | "suggestedDate">>,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.task !== undefined) payload.task = patch.task;
  if (patch.suggestedDate !== undefined) payload.suggested_date = patch.suggestedDate || null;
  const { error } = await supabase.from("pending_suggestions").update(payload).eq("id", id);
  if (error) throw error;
}

export async function dismissPendingSuggestion(id: string): Promise<void> {
  const { error } = await supabase
    .from("pending_suggestions")
    .update({ status: "dismissed" })
    .eq("id", id);
  if (error) throw error;
}

export async function removePendingSuggestion(id: string): Promise<void> {
  const { error } = await supabase.from("pending_suggestions").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchBudgetCategories(weddingId: string): Promise<BudgetCategory[]> {
  const { data, error } = await supabase
    .from("budget_categories")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("name");

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name as BudgetCategory["name"],
    planned: Number(row.planned),
    actual: Number(row.actual),
  }));
}

export function buildTransactionsFromVendorPayments(
  vendors: Vendor[],
  budgetCategories: BudgetCategory[],
): Transaction[] {
  const categoryByName = new Map(budgetCategories.map((c) => [c.name, c.id]));
  const txs: Transaction[] = [];

  for (const vendor of vendors) {
    const categoryId = categoryByName.get(vendor.category) ?? budgetCategories[0]?.id ?? "";
    for (const payment of vendor.payments) {
      txs.push({
        id: payment.id,
        vendorId: vendor.id,
        vendorName: vendor.name,
        categoryId,
        amount: payment.amount,
        date: payment.date,
        note: payment.note,
      });
    }
  }

  return txs;
}

export function mergeTransactionSources(
  dbTransactions: Transaction[],
  vendors: Vendor[],
  budgetCategories: BudgetCategory[],
): Transaction[] {
  const dbIds = new Set(dbTransactions.map((t) => t.id));
  const legacy = buildTransactionsFromVendorPayments(vendors, budgetCategories);
  const merged = [...dbTransactions];
  for (const tx of legacy) {
    if (!dbIds.has(tx.id)) {
      merged.push(tx);
    }
  }
  return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function applyActualsFromTransactions(
  categories: BudgetCategory[],
  transactions: Transaction[],
): BudgetCategory[] {
  const sums = new Map<string, number>();
  for (const tx of transactions) {
    if (!tx.categoryId) continue;
    sums.set(tx.categoryId, (sums.get(tx.categoryId) ?? 0) + tx.amount);
  }
  return categories.map((c) => ({
    ...c,
    actual: sums.get(c.id) ?? 0,
  }));
}

type TransactionRow = {
  id: string;
  wedding_id: string;
  vendor_id: string | null;
  vendor_name: string;
  category_id: string | null;
  amount: number;
  paid_date: string;
  note: string | null;
};

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    vendorId: row.vendor_id ?? undefined,
    vendorName: row.vendor_name,
    categoryId: row.category_id ?? "",
    amount: Number(row.amount),
    date: row.paid_date,
    note: row.note ?? undefined,
  };
}

export async function fetchTransactions(weddingId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("paid_date", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapTransaction(row as TransactionRow));
}

export async function insertTransaction(
  weddingId: string,
  input: CreateExpenseInput,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      wedding_id: weddingId,
      vendor_id: null,
      vendor_name: input.vendorName?.trim() || "Expense",
      category_id: input.categoryId,
      amount: input.amount,
      paid_date: input.date,
      note: input.note ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapTransaction(data as TransactionRow);
}

async function syncVendorAdvanceFromPayments(vendorId: string): Promise<void> {
  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("total_cost")
    .eq("id", vendorId)
    .single();
  if (vendorError) throw vendorError;

  const { data: payments, error: payError } = await supabase
    .from("vendor_payments")
    .select("amount")
    .eq("vendor_id", vendorId);
  if (payError) throw payError;

  const advancePaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCost = Number(vendor.total_cost);
  const status = advancePaid >= totalCost ? "Paid" : advancePaid > 0 ? "Confirmed" : "Pending";

  const { error } = await supabase
    .from("vendors")
    .update({ advance_paid: advancePaid, status })
    .eq("id", vendorId);
  if (error) throw error;
}

export async function updateTransaction(
  weddingId: string,
  id: string,
  patch: UpdateExpenseInput,
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("transactions")
    .select("vendor_id")
    .eq("wedding_id", weddingId)
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const txPayload: Record<string, unknown> = {};
  if (patch.amount !== undefined) txPayload.amount = patch.amount;
  if (patch.categoryId !== undefined) txPayload.category_id = patch.categoryId;
  if (patch.date !== undefined) txPayload.paid_date = patch.date;
  if (patch.note !== undefined) txPayload.note = patch.note?.trim() || null;
  if (patch.vendorName !== undefined && !existing.vendor_id) {
    txPayload.vendor_name = patch.vendorName.trim() || "Expense";
  }

  if (Object.keys(txPayload).length > 0) {
    const { error: txError } = await supabase
      .from("transactions")
      .update(txPayload)
      .eq("wedding_id", weddingId)
      .eq("id", id);
    if (txError) throw txError;
  }

  if (existing.vendor_id) {
    const paymentPayload: Record<string, unknown> = {};
    if (patch.amount !== undefined) paymentPayload.amount = patch.amount;
    if (patch.date !== undefined) paymentPayload.paid_date = patch.date;
    if (patch.note !== undefined) paymentPayload.note = patch.note?.trim() || null;

    if (Object.keys(paymentPayload).length > 0) {
      const { error: paymentError } = await supabase
        .from("vendor_payments")
        .update(paymentPayload)
        .eq("id", id);
      if (paymentError) throw paymentError;
    }

    await syncVendorAdvanceFromPayments(existing.vendor_id);
  }
}

export async function deleteTransaction(weddingId: string, id: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("transactions")
    .select("vendor_id")
    .eq("wedding_id", weddingId)
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const { error: txError } = await supabase
    .from("transactions")
    .delete()
    .eq("wedding_id", weddingId)
    .eq("id", id);
  if (txError) throw txError;

  if (existing.vendor_id) {
    const { error: paymentError } = await supabase
      .from("vendor_payments")
      .delete()
      .eq("id", id);
    if (paymentError) throw paymentError;
    await syncVendorAdvanceFromPayments(existing.vendor_id);
  }
}

export async function recordVendorPayment(
  weddingId: string,
  vendor: Vendor,
  categoryId: string,
  amount: number,
  paidDate: string,
  note?: string,
): Promise<void> {
  const { data: payment, error: paymentError } = await supabase
    .from("vendor_payments")
    .insert({
      vendor_id: vendor.id,
      amount,
      paid_date: paidDate,
      note: note ?? null,
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  const { error: txError } = await supabase.from("transactions").insert({
    id: payment.id,
    wedding_id: weddingId,
    vendor_id: vendor.id,
    vendor_name: vendor.name,
    category_id: categoryId,
    amount,
    paid_date: paidDate,
    note: note ?? null,
  });
  if (txError) throw txError;

  const newAdvance = vendor.advancePaid + amount;
  const { error: vendorError } = await supabase
    .from("vendors")
    .update({
      advance_paid: newAdvance,
      status: newAdvance >= vendor.totalCost ? "Paid" : "Confirmed",
    })
    .eq("id", vendor.id);
  if (vendorError) throw vendorError;
}

/** @deprecated Use mergeTransactionSources instead */
export function buildTransactions(
  vendors: Vendor[],
  budgetCategories: BudgetCategory[],
): Transaction[] {
  return buildTransactionsFromVendorPayments(vendors, budgetCategories);
}

export async function loadWeddingBundle(userId: string, userEmail: string) {
  const wedding = await resolveUserWedding(userId, userEmail);
  if (!wedding) {
    return {
      wedding: null,
      isOwner: false,
      collaborators: [] as WeddingCollaborator[],
      vendors: [] as Vendor[],
      guestGroups: [] as GuestGroup[],
      guests: [] as Guest[],
      timelineEvents: [] as TimelineEvent[],
      budgetCategories: [] as BudgetCategory[],
      planningTasks: [] as PlanningTask[],
      pendingSuggestions: [] as PendingSuggestion[],
      transactions: [] as Transaction[],
    };
  }

  const [
    vendors,
    guestGroups,
    guests,
    timelineEvents,
    budgetCategoriesRaw,
    planningTasks,
    pendingSuggestions,
    dbTransactions,
    collaborators,
  ] = await Promise.all([
    fetchVendors(wedding.id),
    fetchGuestGroups(wedding.id),
    fetchGuests(wedding.id),
    fetchTimelineEvents(wedding.id),
    fetchBudgetCategories(wedding.id),
    fetchPlanningTasks(wedding.id),
    fetchPendingSuggestions(wedding.id),
    fetchTransactions(wedding.id),
    fetchCollaborators(wedding.id),
  ]);

  const transactions = mergeTransactionSources(dbTransactions, vendors, budgetCategoriesRaw);
  const budgetCategories = applyActualsFromTransactions(budgetCategoriesRaw, transactions);

  return {
    wedding,
    isOwner: wedding.ownerId === userId,
    collaborators,
    vendors,
    guestGroups,
    guests,
    timelineEvents,
    budgetCategories,
    planningTasks,
    pendingSuggestions,
    transactions,
  };
}

export function budgetRangeToAmount(range: string): number {
  if (range.startsWith("Under")) return 2_500_000;
  if (range.includes("₹25–50")) return 3_750_000;
  if (range.includes("₹50 lakh")) return 7_500_000;
  if (range.includes("₹1–2")) return 15_000_000;
  if (range.includes("₹2 crore")) return 25_000_000;
  return 4_500_000;
}
