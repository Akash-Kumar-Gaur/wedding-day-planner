import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/date-picker";
import { TimePicker } from "@/components/time-picker";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CreateTimelineEventInput } from "@/data/wedding-types";
import { normalizeTimeForStorage } from "@/lib/time-utils";

export function TimelineCreateSheet({
  open,
  defaultDate,
  onClose,
  onCreate,
}: {
  open: boolean;
  defaultDate: string;
  onClose: () => void;
  onCreate: (input: CreateTimelineEventInput) => Promise<void>;
}) {
  const [eventDate, setEventDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEventDate(defaultDate);
      setTime("19:00");
      setName("");
      setVenue("");
      setDressCode("");
    }
  }, [open, defaultDate]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl">Add timeline event</SheetTitle>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-event-name">Event name</Label>
            <Input
              id="new-event-name"
              placeholder="e.g. Sangeet"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-event-date">Date</Label>
            <DatePicker id="new-event-date" value={eventDate} onChange={setEventDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-event-time">Time</Label>
            <TimePicker id="new-event-time" value={time} onChange={setTime} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-event-venue">Venue</Label>
            <Input
              id="new-event-venue"
              placeholder="Venue name"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-event-dress">Dress code</Label>
            <Input
              id="new-event-dress"
              placeholder="e.g. Traditional"
              value={dressCode}
              onChange={(e) => setDressCode(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={saving || !name.trim() || !eventDate || !time}
            onClick={async () => {
              setSaving(true);
              try {
                await onCreate({
                  eventDate,
                  time: normalizeTimeForStorage(time),
                  name: name.trim(),
                  venue: venue.trim() || undefined,
                  dressCode: dressCode.trim() || undefined,
                });
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Adding…" : "Add event"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
