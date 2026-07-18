import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Phone, Plus, Trash2 } from "lucide-react";
import { ScreenHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteEmergencyContact,
  fetchEmergencyContacts,
  insertEmergencyContact,
  updateEmergencyContact,
  type EmergencyContact,
} from "@/lib/emergency-contacts-api";
import { useWeddingData } from "@/lib/wedding-data";
import { weddingQueryKeys } from "@/lib/wedding-query-keys";

export const Route = createFileRoute("/emergency-contacts")({
  head: () => ({
    meta: [
      { title: "Emergency contacts — ShadiPlan" },
      { property: "og:title", content: "Emergency contacts — ShadiPlan" },
    ],
  }),
  component: EmergencyContactsScreen,
});

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function EmergencyContactsScreen() {
  const { wedding, vendors } = useWeddingData();
  const weddingId = wedding?.id;
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: weddingQueryKeys.emergencyContacts(weddingId ?? ""),
    queryFn: () => fetchEmergencyContacts(weddingId!),
    enabled: !!weddingId,
  });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const vendorsWithPhone = useMemo(
    () => vendors.filter((v) => v.phone?.trim()),
    [vendors],
  );

  const custom = contactsQuery.data ?? [];

  const invalidate = () => {
    if (!weddingId) return;
    void queryClient.invalidateQueries({
      queryKey: weddingQueryKeys.emergencyContacts(weddingId),
    });
  };

  const resetForm = () => {
    setEditing(null);
    setName("");
    setPhone("");
    setRole("");
    setNotes("");
    setError(null);
  };

  useEffect(() => {
    if (!sheetOpen) return;
    if (editing) {
      setName(editing.name);
      setPhone(editing.phone);
      setRole(editing.role ?? "");
      setNotes(editing.notes ?? "");
      setError(null);
    } else {
      setName("");
      setPhone("");
      setRole("");
      setNotes("");
      setError(null);
    }
  }, [sheetOpen, editing]);

  const deleteMutation = useMutation({
    mutationFn: deleteEmergencyContact,
    onSuccess: invalidate,
  });

  const createMutation = useMutation({
    mutationFn: (input: { name: string; phone: string; role?: string; notes?: string }) => {
      if (!weddingId) throw new Error("No wedding");
      return insertEmergencyContact(weddingId, input);
    },
    onSuccess: () => {
      invalidate();
      setSheetOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      id: string;
      patch: { name: string; phone: string; role?: string; notes?: string };
    }) => updateEmergencyContact(input.id, input.patch),
    onSuccess: () => {
      invalidate();
      setSheetOpen(false);
      resetForm();
    },
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!phone.trim()) {
      setError("Phone is required");
      return;
    }
    setError(null);
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      role: role.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, patch: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!wedding) return null;

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Emergency contacts">
        <p className="mt-1 text-sm text-muted-foreground">
          Quick dial for vendors and day-of coordinators.
        </p>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5 pb-24">
        <section>
          <h2 className="mb-2 px-1 font-serif text-lg text-foreground">Vendors</h2>
          <Card className="divide-y divide-border rounded-2xl p-0">
            {vendorsWithPhone.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No vendor phone numbers yet.
              </p>
            ) : (
              vendorsWithPhone.map((v) => (
                <a
                  key={v.id}
                  href={telHref(v.phone!)}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.category}
                      {v.contactName ? ` · ${v.contactName}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-primary">{v.phone}</p>
                  </div>
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                </a>
              ))
            )}
          </Card>
        </section>

        <section>
          <h2 className="mb-2 px-1 font-serif text-lg text-foreground">Other contacts</h2>
          <Card className="divide-y divide-border rounded-2xl p-0">
            {custom.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Add family coordinators, hospital, etc.
              </p>
            ) : (
              custom.map((c) => (
                <div key={c.id} className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(c);
                      setSheetOpen(true);
                    }}
                    className="min-w-0 flex-1 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    {c.role ? (
                      <p className="text-xs text-muted-foreground">{c.role}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-primary">{c.phone}</p>
                  </button>
                  <a
                    href={telHref(c.phone)}
                    className="flex shrink-0 items-center border-l border-border px-3 text-primary transition-colors hover:bg-muted/40"
                    aria-label={`Call ${c.name}`}
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete ${c.name}?`)) {
                        deleteMutation.mutate(c.id);
                      }
                    }}
                    className="flex shrink-0 items-center border-l border-border px-3 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-[color:var(--destructive)]"
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>

      <button
        type="button"
        aria-label="Add contact"
        onClick={() => {
          resetForm();
          setSheetOpen(true);
        }}
        className="fixed bottom-24 right-[max(1rem,calc(50%-215px+1rem))] z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Sheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) resetForm();
        }}
      >
        <SheetContent side="bottom">
          <SheetHeader className="text-left">
            <SheetTitle className="font-serif text-2xl">
              {editing ? "Edit contact" : "Add contact"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name *</Label>
              <Input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nearest hospital"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone *</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 …"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-role">Role</Label>
              <Input
                id="contact-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-notes">Notes</Label>
              <Textarea
                id="contact-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                className="min-h-20 rounded-2xl"
              />
            </div>
            {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}
            {createMutation.isError || updateMutation.isError ? (
              <p className="text-sm text-[color:var(--destructive)]">
                {(createMutation.error ?? updateMutation.error) instanceof Error
                  ? ((createMutation.error ?? updateMutation.error) as Error).message
                  : "Could not save"}
              </p>
            ) : null}
            <Button className="w-full" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : editing ? "Save changes" : "Save"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
