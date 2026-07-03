import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Search, Leaf, Drumstick, Sprout, BedDouble, Car, MailPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AccompanyingCountStepper } from "@/components/accompanying-count-stepper";
import { ScreenHeader, StatusBadge } from "@/components/app-shell";
import { GetSuggestionsSheet } from "@/components/get-suggestions-sheet";
import { GetSuggestionsLink, SectionEmptyState } from "@/components/get-suggestions-prompt";
import type { Guest, MealPref, RsvpStatus } from "@/data/wedding-types";
import { computeGuestHeadcounts } from "@/lib/guest-headcount";
import { useWeddingData } from "@/lib/wedding-data";
import { cn } from "@/lib/utils";

const GUEST_SUGGESTION_CATEGORIES: string[] = ["Invitations", "Accommodation", "Transport", "Emergency"];

export const Route = createFileRoute("/guests")({
  head: () => ({
    meta: [
      { title: "Guests — ShadiPlan" },
      { name: "description", content: "Track RSVPs, meal preferences, and accommodation for every wedding guest." },
      { property: "og:title", content: "Guests — ShadiPlan" },
      { property: "og:description", content: "Guest list, RSVPs and logistics in one place." },
    ],
  }),
  component: GuestsScreen,
});

type Filter = "all" | RsvpStatus;

function GuestsScreen() {
  const navigate = useNavigate();
  const { guests: guestsData, guestGroups } = useWeddingData();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [openGuest, setOpenGuest] = useState<Guest | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const headcounts = useMemo(() => computeGuestHeadcounts(guestsData), [guestsData]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return guestsData.filter((g) => {
      if (filter !== "all" && g.rsvp !== filter) return false;
      if (query && !g.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [filter, q, guestsData]);

  const grouped = useMemo(() => {
    return guestGroups
      .map((group) => ({ group, members: filtered.filter((g) => g.groupId === group.id) }))
      .filter((x) => x.members.length > 0);
  }, [filtered, guestGroups]);

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Guests">
        <div className="mt-3 space-y-2 rounded-xl bg-secondary/60 px-3 py-3 text-center text-sm">
          <p>
            <span className="font-medium text-foreground">{headcounts.invitedRecords} invited</span>
            <span className="text-muted-foreground"> · </span>
            <span className="font-medium text-foreground">{headcounts.maxHeadcount} total guests</span>
          </p>
          <p>
            <span className="font-medium text-[color:var(--success)]">
              {headcounts.confirmedRecords} confirmed
            </span>
            <span className="text-muted-foreground"> · </span>
            <span className="font-medium text-[color:var(--success)]">
              {headcounts.confirmedHeadcount} attending
            </span>
          </p>
          {headcounts.pendingRecords > 0 ? (
            <p className="text-xs text-muted-foreground">{headcounts.pendingRecords} RSVP pending</p>
          ) : null}
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search guests"
            className="h-10 rounded-full border-border bg-secondary/60 pl-9 text-sm mb-4"
          />
        </div>

        <div className="selectable-scroll mt-3 flex gap-2">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
          <Chip active={filter === "Pending"} onClick={() => setFilter("Pending")}>RSVP pending</Chip>
          <Chip active={filter === "Confirmed"} onClick={() => setFilter("Confirmed")}>Confirmed</Chip>
          <Chip active={filter === "Declined"} onClick={() => setFilter("Declined")}>Declined</Chip>
        </div>
      </ScreenHeader>

      <div className="space-y-6 px-5 pt-5">
        {grouped.map(({ group, members }) => (
          <section key={group.id}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="font-serif text-lg text-foreground">{group.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/invite", search: { groupId: group.id } })}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"
                >
                  <MailPlus className="h-3.5 w-3.5" />
                  Group invite
                </button>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {group.side} side
                </span>
              </div>
            </div>
            <Card className="divide-y divide-border rounded-2xl p-0">
              {members.map((g) => (
                <GuestRow
                  key={g.id}
                  guest={g}
                  onOpen={() => setOpenGuest(g)}
                  onInvite={() => navigate({ to: "/invite", search: { guestId: g.id } })}
                />
              ))}
            </Card>
          </section>
        ))}

        {grouped.length === 0 ? (
          guestsData.length === 0 ? (
            <SectionEmptyState
              title="No guests yet"
              description="Add guests yourself or browse guest-related planning ideas."
              primaryAction={<Button onClick={() => setCreateOpen(true)}>Add guest</Button>}
              onGetSuggestions={() => setSuggestionsOpen(true)}
              suggestionsLabel="Not sure what you need? Get suggestions"
            />
          ) : (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              No guests match your search or filter.
            </p>
          )
        ) : null}

        {/* {grouped.length > 0 ? (
          <div className="text-center">
            <GetSuggestionsLink
              onClick={() => setSuggestionsOpen(true)}
              label="Not sure what you need? Get suggestions"
            />
          </div>
        ) : null} */}

        <div className="h-4" />
      </div>

      <button
        type="button"
        aria-label="Add guest"
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-24 right-[max(1rem,calc(50%-215px+1rem))] z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Plus className="h-6 w-6" />
      </button>

      <GuestCreateSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        guestGroups={guestGroups}
      />
      <GuestSheet
        guest={openGuest}
        onClose={() => setOpenGuest(null)}
        onInvite={(id) => navigate({ to: "/invite", search: { guestId: id } })}
      />

      <GetSuggestionsSheet
        open={suggestionsOpen}
        onClose={() => setSuggestionsOpen(false)}
        title="Guest-related planning ideas"
        categories={GUEST_SUGGESTION_CATEGORIES}
        includeCommonlyMissed={false}
        perCategory={2}
      />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function MealMeta({ meal }: { meal: MealPref }) {
  const config =
    meal === "Non-veg"
      ? { icon: Drumstick, label: "Non-veg" }
      : meal === "Jain"
        ? { icon: Sprout, label: "Jain" }
        : { icon: Leaf, label: "Veg" };
  const Icon = config.icon;

  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span>{config.label}</span>
    </span>
  );
}

function GuestRow({
  guest,
  onOpen,
  onInvite,
}: {
  guest: Guest;
  onOpen: () => void;
  onInvite: () => void;
}) {
  const initials = guest.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[15px] font-medium leading-tight text-foreground">
              {guest.name}
            </p>
            {guest.accompanyingCount > 0 ? (
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                +{guest.accompanyingCount}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-[10px] text-xs text-muted-foreground">
            <MealMeta meal={guest.meal} />
            {guest.accommodation ? (
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
                <BedDouble className="h-3 w-3 shrink-0" aria-hidden />
                <span>Room</span>
              </span>
            ) : null}
            {guest.transportNeeded ? (
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
                <Car className="h-3 w-3 shrink-0" aria-hidden />
                <span>Transport</span>
              </span>
            ) : null}
          </div>
        </div>
      </button>
      <div className="flex shrink-0 flex-col items-end justify-center gap-2">
        <StatusBadge
          status={
            guest.rsvp === "Confirmed" ? "done" : guest.rsvp === "Declined" ? "declined" : "pending"
          }
        />
        <button
          type="button"
          aria-label={`Create invite for ${guest.name}`}
          onClick={onInvite}
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
        >
          <MailPlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const NEW_GROUP_VALUE = "__new__";

function GuestCreateSheet({
  open,
  onClose,
  guestGroups,
}: {
  open: boolean;
  onClose: () => void;
  guestGroups: { id: string; name: string; side: "Bride" | "Groom" }[];
}) {
  const { createGuest, createGuestGroup } = useWeddingData();
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupSide, setNewGroupSide] = useState<"Bride" | "Groom">("Bride");
  const [phone, setPhone] = useState("");
  const [meal, setMeal] = useState<MealPref>("Veg");
  const [accompanyingCount, setAccompanyingCount] = useState(0);
  const [accommodation, setAccommodation] = useState(false);
  const [transportNeeded, setTransportNeeded] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setGroupId(guestGroups[0]?.id ?? NEW_GROUP_VALUE);
    setNewGroupName("");
    setNewGroupSide("Bride");
    setPhone("");
    setMeal("Veg");
    setAccompanyingCount(0);
    setAccommodation(false);
    setTransportNeeded(false);
    setNotes("");
    setError(null);
  };

  useEffect(() => {
    if (open) {
      reset();
      if (guestGroups.length === 0) setGroupId(NEW_GROUP_VALUE);
    }
  }, [open, guestGroups.length]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Guest name is required");
      return;
    }

    let resolvedGroupId = groupId;
    if (groupId === NEW_GROUP_VALUE) {
      if (!newGroupName.trim()) {
        setError("Group name is required for a new group");
        return;
      }
    } else if (!resolvedGroupId) {
      setError("Select a group");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (groupId === NEW_GROUP_VALUE) {
        const group = await createGuestGroup({
          name: newGroupName.trim(),
          side: newGroupSide,
        });
        resolvedGroupId = group.id;
      }

      await createGuest({
        name: name.trim(),
        groupId: resolvedGroupId,
        phone: phone.trim() || undefined,
        meal,
        accompanyingCount,
        accommodation,
        transportNeeded,
        notes: notes.trim() || undefined,
      });
      toast.success("Guest added");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add guest");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl">Add guest</SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guest-name">Name *</Label>
            <Input id="guest-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest-group">Group</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger id="guest-group">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {guestGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name} ({g.side} side)
                  </SelectItem>
                ))}
                <SelectItem value={NEW_GROUP_VALUE}>Add new group…</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {groupId === NEW_GROUP_VALUE ? (
            <Card className="space-y-3 rounded-2xl p-4">
              <div className="space-y-2">
                <Label htmlFor="new-group-name">New group name *</Label>
                <Input
                  id="new-group-name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Sharma family"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-group-side">Side</Label>
                <Select value={newGroupSide} onValueChange={(v) => setNewGroupSide(v as "Bride" | "Groom")}>
                  <SelectTrigger id="new-group-side">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bride">Bride</SelectItem>
                    <SelectItem value="Groom">Groom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="guest-phone">Phone</Label>
            <Input id="guest-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest-meal">Meal preference</Label>
            <Select value={meal} onValueChange={(v) => setMeal(v as MealPref)}>
              <SelectTrigger id="guest-meal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Veg">Veg</SelectItem>
                <SelectItem value="Non-veg">Non-veg</SelectItem>
                <SelectItem value="Jain">Jain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AccompanyingCountStepper value={accompanyingCount} onChange={setAccompanyingCount} />

          <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
            <Label htmlFor="guest-accommodation" className="cursor-pointer">Accommodation needed</Label>
            <Switch id="guest-accommodation" checked={accommodation} onCheckedChange={setAccommodation} />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
            <Label htmlFor="guest-transport" className="cursor-pointer">Transport needed</Label>
            <Switch id="guest-transport" checked={transportNeeded} onCheckedChange={setTransportNeeded} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest-notes">Notes</Label>
            <Textarea id="guest-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-20 rounded-2xl" />
          </div>

          {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

          <Button className="w-full" disabled={saving} onClick={handleSubmit}>
            {saving ? "Saving…" : "Add guest"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function GuestSheet({
  guest,
  onClose,
  onInvite,
}: {
  guest: Guest | null;
  onClose: () => void;
  onInvite: (guestId: string) => void;
}) {
  const { guestGroups, guests, updateGuestDetails } = useWeddingData();
  const liveGuest = guest ? guests.find((g) => g.id === guest.id) ?? guest : null;
  const group = liveGuest ? guestGroups.find((g) => g.id === liveGuest.groupId) : null;

  const [rsvp, setRsvp] = useState<RsvpStatus>("Pending");
  const [phone, setPhone] = useState("");
  const [meal, setMeal] = useState<MealPref>("Veg");
  const [accompanyingCount, setAccompanyingCount] = useState(0);
  const [accommodation, setAccommodation] = useState(false);
  const [transportNeeded, setTransportNeeded] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!liveGuest) return;
    setRsvp(liveGuest.rsvp);
    setPhone(liveGuest.phone ?? "");
    setMeal(liveGuest.meal);
    setAccompanyingCount(liveGuest.accompanyingCount);
    setAccommodation(liveGuest.accommodation);
    setTransportNeeded(liveGuest.transportNeeded);
    setNotes(liveGuest.notes ?? "");
    setError(null);
  }, [liveGuest]);

  const handleSave = async () => {
    if (!liveGuest) return;
    setSaving(true);
    setError(null);
    try {
      await updateGuestDetails(liveGuest.id, {
        rsvp,
        phone: phone.trim() || undefined,
        meal,
        accompanyingCount,
        accommodation,
        transportNeeded,
        notes: notes.trim() || undefined,
      });
      toast.success("Guest updated");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save guest");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={!!guest} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">
        {liveGuest ? (
          <>
            <SheetHeader className="text-left">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {group?.name} · {group?.side} side
              </p>
              <SheetTitle className="font-serif text-2xl">{liveGuest.name}</SheetTitle>
            </SheetHeader>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-rsvp">RSVP</Label>
                <Select value={rsvp} onValueChange={(v) => setRsvp(v as RsvpStatus)}>
                  <SelectTrigger id="edit-rsvp">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-meal">Meal preference</Label>
                <Select value={meal} onValueChange={(v) => setMeal(v as MealPref)}>
                  <SelectTrigger id="edit-meal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Veg">Veg</SelectItem>
                    <SelectItem value="Non-veg">Non-veg</SelectItem>
                    <SelectItem value="Jain">Jain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <AccompanyingCountStepper
                id="edit-accompanying-count"
                value={accompanyingCount}
                onChange={setAccompanyingCount}
              />

              <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                <Label htmlFor="edit-accommodation" className="cursor-pointer">
                  Accommodation needed
                </Label>
                <Switch
                  id="edit-accommodation"
                  checked={accommodation}
                  onCheckedChange={setAccommodation}
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                <Label htmlFor="edit-transport" className="cursor-pointer">
                  Transport needed
                </Label>
                <Switch
                  id="edit-transport"
                  checked={transportNeeded}
                  onCheckedChange={setTransportNeeded}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-20 rounded-2xl"
                />
              </div>

              {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

              <Button className="w-full" disabled={saving} onClick={handleSave}>
                {saving ? "Saving…" : "Save changes"}
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  onInvite(liveGuest.id);
                  onClose();
                }}
              >
                <MailPlus className="mr-2 h-4 w-4" />
                Create invite
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}