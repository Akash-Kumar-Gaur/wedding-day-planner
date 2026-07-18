import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Plus,
  Camera,
  Utensils,
  Sparkles,
  Music,
  Bus,
  Shirt,
  Building2,
  Store,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { CateringHeadcountNote } from "@/components/catering-headcount-note";
import { ScreenHeader } from "@/components/app-shell";
import { VendorCard } from "@/components/vendor-card";
import { GetSuggestionsSheet } from "@/components/get-suggestions-sheet";
import { GetSuggestionsLink, SectionEmptyState } from "@/components/get-suggestions-prompt";
import type { Vendor, VendorCategory, VendorStatus } from "@/data/wedding-types";
import { formatINR, formatDate, shortDate } from "@/data/wedding";
import { useWeddingData } from "@/lib/wedding-data";
import { cn } from "@/lib/utils";

const VENDOR_SUGGESTION_CATEGORIES: string[] = [
  "Venue",
  "Catering",
  "Photography",
  "Decor",
  "Music",
  "Transport",
  "Attire",
];

export const Route = createFileRoute("/vendors")({
  head: () => ({
    meta: [
      { title: "Vendors — ShadiPlan" },
      {
        name: "description",
        content: "Track every wedding vendor, their payments, contacts and confirmation status.",
      },
      { property: "og:title", content: "Vendors — ShadiPlan" },
      {
        property: "og:description",
        content: "Track vendor payments and status for a multi-day wedding.",
      },
    ],
  }),
  component: VendorsScreen,
});

const VENDOR_CATEGORIES: VendorCategory[] = [
  "Venue",
  "Catering",
  "Photography",
  "Decor",
  "Music",
  "Transport",
  "Attire",
  "Other",
];

const CATEGORY_ICON: Record<VendorCategory, typeof Camera> = {
  Venue: Building2,
  Catering: Utensils,
  Photography: Camera,
  Decor: Sparkles,
  Music: Music,
  Transport: Bus,
  Attire: Shirt,
  Other: Store,
};

type Filter = "all" | "due" | "confirmed";

function VendorsScreen() {
  const { vendors: vendorsData } = useWeddingData();
  const [filter, setFilter] = useState<Filter>("all");
  const [openVendor, setOpenVendor] = useState<Vendor | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "due") return vendorsData.filter((v) => v.totalCost > v.advancePaid);
    if (filter === "confirmed") return vendorsData.filter((v) => v.status !== "Pending");
    return vendorsData;
  }, [filter, vendorsData]);

  const grouped = useMemo(() => {
    const map = new Map<VendorCategory, Vendor[]>();
    for (const v of filtered) {
      const list = map.get(v.category) ?? [];
      list.push(v);
      map.set(v.category, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Vendors">
        <div className="selectable-scroll mt-3 flex gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
          <FilterChip active={filter === "due"} onClick={() => setFilter("due")}>Payment due</FilterChip>
          <FilterChip active={filter === "confirmed"} onClick={() => setFilter("confirmed")}>Confirmed</FilterChip>
        </div>
      </ScreenHeader>

      <div className="space-y-6 px-5 pt-5">
        {grouped.length === 0 ? (
          <SectionEmptyState
            title="No vendors yet"
            description="Add vendors yourself or browse planning ideas from our library."
            primaryAction={<Button onClick={() => setCreateOpen(true)}>Add vendor</Button>}
            onGetSuggestions={() => setSuggestionsOpen(true)}
            suggestionsLabel="Not sure what you need? Get suggestions"
          />
        ) : null}

        {grouped.map(([category, list]) => {
          const Icon = CATEGORY_ICON[category] ?? Store;
          return (
            <section key={category}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <Icon className="h-4 w-4 text-primary" />
                <h2 className="font-serif text-lg text-foreground">{category}</h2>
                <span className="text-xs text-muted-foreground">· {list.length}</span>
              </div>
              <div className="space-y-3">
                {list.map((v) => (
                  <VendorCard key={v.id} vendor={v} onClick={() => setOpenVendor(v)} />
                ))}
              </div>
            </section>
          );
        })}

        {grouped.length > 0 ? (
          <div className="text-center">
            <GetSuggestionsLink
              onClick={() => setSuggestionsOpen(true)}
              label="Not sure what you need? Get suggestions"
            />
          </div>
        ) : null}

        <div className="h-4" />
      </div>

      <button
        type="button"
        aria-label="Add vendor"
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-24 right-[max(1rem,calc(50%-215px+1rem))] z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Plus className="h-6 w-6" />
      </button>

      <VendorCreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <VendorSheet vendor={openVendor} onClose={() => setOpenVendor(null)} />

      <GetSuggestionsSheet
        open={suggestionsOpen}
        onClose={() => setSuggestionsOpen(false)}
        title="Vendor planning ideas"
        categories={VENDOR_SUGGESTION_CATEGORIES}
        includeCommonlyMissed={false}
      />
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
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

function VendorCreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createVendor } = useWeddingData();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<VendorCategory>("Venue");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [advancePaid, setAdvancePaid] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<VendorStatus>("Pending");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setCategory("Venue");
    setContactName("");
    setPhone("");
    setTotalCost("");
    setAdvancePaid("0");
    setDueDate("");
    setStatus("Pending");
    setNotes("");
    setError(null);
  };

  useEffect(() => {
    if (open) reset();
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Vendor name is required");
      return;
    }
    const cost = Number(totalCost);
    if (!cost || cost <= 0) {
      setError("Enter a valid total cost");
      return;
    }
    const advance = Number(advancePaid) || 0;
    if (advance < 0 || advance > cost) {
      setError("Advance paid must be between 0 and total cost");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createVendor({
        name: name.trim(),
        category,
        contactName: contactName.trim(),
        phone: phone.trim(),
        totalCost: cost,
        advancePaid: advance,
        dueDate,
        status,
        notes: notes.trim() || undefined,
      });
      toast.success("Vendor added");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add vendor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl">Add vendor</SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor-name">Name *</Label>
            <Input id="vendor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vendor name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory)}>
              <SelectTrigger id="vendor-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-contact">Contact name</Label>
            <Input id="vendor-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-phone">Phone</Label>
            <Input id="vendor-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="vendor-total">Total cost (₹) *</Label>
              <Input id="vendor-total" type="number" min={0} value={totalCost} onChange={(e) => setTotalCost(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-advance">Advance paid (₹)</Label>
              <Input id="vendor-advance" type="number" min={0} value={advancePaid} onChange={(e) => setAdvancePaid(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="vendor-due">Due date</Label>
              <Input id="vendor-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as VendorStatus)}>
                <SelectTrigger id="vendor-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-notes">Notes</Label>
            <Textarea id="vendor-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-20 rounded-2xl" />
          </div>

          {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

          <Button className="w-full" disabled={saving} onClick={handleSubmit}>
            {saving ? "Saving…" : "Add vendor"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function VendorSheet({ vendor, onClose }: { vendor: Vendor | null; onClose: () => void }) {
  const { vendors, markVendorPaid, updateVendorDetails, deleteVendorById } = useWeddingData();
  const liveVendor = vendor ? vendors.find((v) => v.id === vendor.id) ?? vendor : null;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<VendorCategory>("Venue");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [advancePaid, setAdvancePaid] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<VendorStatus>("Pending");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  useEffect(() => {
    if (!liveVendor) return;
    setName(liveVendor.name);
    setCategory(liveVendor.category);
    setContactName(liveVendor.contactName ?? "");
    setPhone(liveVendor.phone ?? "");
    setTotalCost(String(liveVendor.totalCost));
    setAdvancePaid(String(liveVendor.advancePaid));
    setDueDate(liveVendor.dueDate ?? "");
    setStatus(liveVendor.status);
    setNotes(liveVendor.notes ?? "");
    setError(null);
    setRemoveConfirmOpen(false);
  }, [liveVendor]);

  const balance = liveVendor ? liveVendor.totalCost - liveVendor.advancePaid : 0;

  const handleSave = async () => {
    if (!liveVendor) return;
    if (!name.trim()) {
      setError("Vendor name is required");
      return;
    }
    const cost = Number(totalCost);
    if (!cost || cost <= 0) {
      setError("Enter a valid total cost");
      return;
    }
    const advance = Number(advancePaid) || 0;
    if (advance < 0 || advance > cost) {
      setError("Advance paid must be between 0 and total cost");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateVendorDetails(liveVendor.id, {
        name: name.trim(),
        category,
        contactName: contactName.trim(),
        phone: phone.trim(),
        totalCost: cost,
        advancePaid: advance,
        dueDate,
        status,
        notes: notes.trim() || undefined,
      });
      toast.success("Vendor updated");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save vendor");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!liveVendor || balance <= 0) return;
    setSaving(true);
    setError(null);
    try {
      await markVendorPaid(liveVendor.id);
      toast.success("Payment recorded");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record payment");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!liveVendor) return;
    setRemoving(true);
    setError(null);
    try {
      await deleteVendorById(liveVendor.id);
      toast.success("Vendor removed");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove vendor");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Sheet
      open={!!vendor}
      onOpenChange={(o) => {
        if (!o) {
          setRemoveConfirmOpen(false);
          onClose();
        }
      }}
    >
      <SheetContent side="bottom">
        {liveVendor ? (
          <>
            <SheetHeader className="text-left">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {liveVendor.category}
              </p>
              <SheetTitle className="font-serif text-2xl">Edit vendor</SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-4">
              {liveVendor.category === "Catering" ? <CateringHeadcountNote /> : null}

              <Card className="rounded-2xl p-4">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <Stat label="Total" value={formatINR(liveVendor.totalCost)} />
                  <Stat label="Paid" value={formatINR(liveVendor.advancePaid)} />
                  <Stat label="Balance" value={formatINR(balance)} />
                </div>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="edit-vendor-name">Name *</Label>
                <Input
                  id="edit-vendor-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vendor name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-vendor-category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory)}>
                  <SelectTrigger id="edit-vendor-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-vendor-contact">Contact name</Label>
                <Input
                  id="edit-vendor-contact"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-vendor-phone">Phone</Label>
                <Input
                  id="edit-vendor-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-vendor-total">Total cost (₹) *</Label>
                  <Input
                    id="edit-vendor-total"
                    type="number"
                    min={0}
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-vendor-advance">Advance paid (₹)</Label>
                  <Input
                    id="edit-vendor-advance"
                    type="number"
                    min={0}
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-vendor-due">Due date</Label>
                  <Input
                    id="edit-vendor-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-vendor-status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as VendorStatus)}>
                    <SelectTrigger id="edit-vendor-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-vendor-notes">Notes</Label>
                <Textarea
                  id="edit-vendor-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-20 rounded-2xl"
                />
              </div>

              <div>
                <h3 className="mb-2 px-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Payment history
                </h3>
                <Card className="divide-y divide-border rounded-2xl p-0">
                  {liveVendor.payments.length === 0 ? (
                    <p className="px-4 py-4 text-center text-sm text-muted-foreground">
                      No payments yet
                    </p>
                  ) : (
                    liveVendor.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{formatINR(p.amount)}</p>
                          {p.note ? (
                            <p className="text-xs text-muted-foreground">{p.note}</p>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                      </div>
                    ))
                  )}
                </Card>
              </div>

              {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

              <Button className="w-full" disabled={saving || removing} onClick={handleSave}>
                {saving ? "Saving…" : "Save changes"}
              </Button>

              <Button
                className="h-11 w-full rounded-full text-sm"
                variant="outline"
                disabled={saving || removing || balance <= 0}
                onClick={handleMarkPaid}
              >
                <Check className="h-4 w-4" />
                {balance <= 0
                  ? "Fully paid"
                  : saving
                    ? "Saving…"
                    : `Mark as paid (${formatINR(balance)})`}
              </Button>

              <div className="border-t border-border pt-4">
                {removeConfirmOpen ? (
                  <Card className="rounded-2xl border border-[color-mix(in_oklab,var(--destructive)_35%,transparent)] bg-[color-mix(in_oklab,var(--destructive)_8%,transparent)] p-4">
                    <p className="text-sm text-foreground">
                      Remove <span className="font-medium">{liveVendor.name}</span>?
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Payment history for this vendor will be removed too.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        disabled={removing}
                        onClick={() => setRemoveConfirmOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="flex-1"
                        disabled={removing}
                        onClick={() => void handleRemove()}
                      >
                        {removing ? "Removing…" : "Remove"}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <button
                    type="button"
                    className="w-full py-2 text-center text-sm font-medium text-[color:var(--destructive)]"
                    onClick={() => setRemoveConfirmOpen(true)}
                  >
                    Remove vendor
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium text-foreground">{value}</p>
    </div>
  );
}
