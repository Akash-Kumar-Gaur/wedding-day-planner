import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Phone,
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
  StickyNote,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ScreenHeader, StatusBadge } from "@/components/app-shell";
import {
  vendors as vendorsData,
  type Vendor,
  type VendorCategory,
  formatINR,
  formatDate,
  shortDate,
} from "@/data/wedding";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vendors")({
  head: () => ({
    meta: [
      { title: "Vendors — Wedding Ops" },
      {
        name: "description",
        content: "Track every wedding vendor, their payments, contacts and confirmation status.",
      },
      { property: "og:title", content: "Vendors — Wedding Ops" },
      {
        property: "og:description",
        content: "Track vendor payments and status for a multi-day wedding.",
      },
    ],
  }),
  component: VendorsScreen,
});

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
  const [filter, setFilter] = useState<Filter>("all");
  const [openVendor, setOpenVendor] = useState<Vendor | null>(null);

  const filtered = useMemo(() => {
    if (filter === "due") return vendorsData.filter((v) => v.totalCost > v.advancePaid);
    if (filter === "confirmed") return vendorsData.filter((v) => v.status !== "Pending");
    return vendorsData;
  }, [filter]);

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
      <ScreenHeader eyebrow="Wedding Ops" title="Vendors">
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
          <FilterChip active={filter === "due"} onClick={() => setFilter("due")}>Payment due</FilterChip>
          <FilterChip active={filter === "confirmed"} onClick={() => setFilter("confirmed")}>Confirmed</FilterChip>
        </div>
      </ScreenHeader>

      <div className="space-y-6 px-5 pt-5">
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
                {list.map((v) => {
                  const balance = v.totalCost - v.advancePaid;
                  return (
                    <Card
                      key={v.id}
                      role="button"
                      onClick={() => setOpenVendor(v)}
                      className="cursor-pointer rounded-2xl p-4 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{v.name}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {v.contactName}
                          </p>
                        </div>
                        <StatusBadge
                          status={
                            v.status === "Paid"
                              ? "done"
                              : v.status === "Confirmed"
                                ? "done"
                                : "pending"
                          }
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Advance paid</p>
                          <p className="mt-0.5 font-medium text-foreground">
                            {formatINR(v.advancePaid)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Balance due</p>
                          <p
                            className={cn(
                              "mt-0.5 font-medium",
                              balance > 0 ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {formatINR(balance)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {v.phone}
                        </span>
                        <span>Due {shortDate(v.dueDate)}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="h-4" />
      </div>

      <button
        aria-label="Add vendor"
        className="fixed bottom-24 right-[max(1rem,calc(50%-215px+1rem))] z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Plus className="h-6 w-6" />
      </button>

      <VendorSheet vendor={openVendor} onClose={() => setOpenVendor(null)} />
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
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

function VendorSheet({ vendor, onClose }: { vendor: Vendor | null; onClose: () => void }) {
  return (
    <Sheet open={!!vendor} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
        {vendor ? (
          <>
            <SheetHeader className="text-left">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {vendor.category}
              </p>
              <SheetTitle className="font-serif text-2xl">{vendor.name}</SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-4">
              <Card className="rounded-2xl p-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="mt-0.5 font-medium">{vendor.contactName}</p>
                    <p className="text-xs text-muted-foreground">{vendor.phone}</p>
                  </div>
                  <StatusBadge
                    status={vendor.status === "Pending" ? "pending" : "done"}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <Stat label="Total" value={formatINR(vendor.totalCost)} />
                  <Stat label="Paid" value={formatINR(vendor.advancePaid)} />
                  <Stat
                    label="Balance"
                    value={formatINR(vendor.totalCost - vendor.advancePaid)}
                  />
                </div>
              </Card>

              <div>
                <h3 className="mb-2 px-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Payment history
                </h3>
                <Card className="divide-y divide-border rounded-2xl p-0">
                  {vendor.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{formatINR(p.amount)}</p>
                        {p.note ? (
                          <p className="text-xs text-muted-foreground">{p.note}</p>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                    </div>
                  ))}
                </Card>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 px-1 text-xs uppercase tracking-wider text-muted-foreground">
                  <StickyNote className="h-3 w-3" /> Notes
                </label>
                <Textarea
                  defaultValue={vendor.notes ?? ""}
                  placeholder="Add a note about this vendor"
                  className="min-h-24 rounded-2xl bg-background"
                />
              </div>

              <Button className="h-11 w-full rounded-full text-sm">
                <Check className="h-4 w-4" /> Mark as paid
              </Button>
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