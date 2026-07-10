import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, FileDown, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/app-shell";
import { INVITE_THEMES, INVITE_THEME_IDS } from "@/components/invite-themes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { TimelineEvent } from "@/data/wedding-types";
import { fetchInviteForGroup, fetchInviteForGuest, upsertInvite } from "@/lib/invite-api";
import {
  downloadInvitePdf,
  getCardDimensions,
  rasterizeInviteCard,
  shareInviteImage,
} from "@/lib/invite-export";
import { pickInviteImage } from "@/lib/invite-images";
import { buildInviteEventDetails, type InviteThemeId } from "@/lib/invite-utils";
import { distinctEventDates, dateTabLabel } from "@/lib/lead-time-dates";
import { formatDisplayTime } from "@/lib/time-utils";
import { useWeddingData } from "@/lib/wedding-data";
import { cn } from "@/lib/utils";

type InviteSearch = {
  guestId?: string;
  groupId?: string;
};

export const Route = createFileRoute("/invite")({
  validateSearch: (search: Record<string, unknown>): InviteSearch => ({
    guestId: typeof search.guestId === "string" ? search.guestId : undefined,
    groupId: typeof search.groupId === "string" ? search.groupId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create invite — ShadiPlan" },
      { property: "og:title", content: "Create invite — ShadiPlan" },
    ],
  }),
  component: InviteScreen,
});

const PREVIEW_SCALE = 0.25;

function InviteScreen() {
  const { guestId, groupId } = Route.useSearch();
  const { wedding, timelineEvents, guests, guestGroups } = useWeddingData();
  const cardExportRef = useRef<HTMLDivElement>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<InviteThemeId>("floral");
  const [savedInviteId, setSavedInviteId] = useState<string | undefined>();
  const [restored, setRestored] = useState(false);
  const [exporting, setExporting] = useState(false);

  const guest = guestId ? guests.find((g) => g.id === guestId) : undefined;
  const group = groupId ? guestGroups.find((g) => g.id === groupId) : undefined;
  const targetLabel = guest?.name ?? group?.name ?? "Guest";

  const savedQuery = useQuery({
    queryKey: ["invite", wedding?.id, guestId, groupId],
    queryFn: async () => {
      if (!wedding) return null;
      if (guestId) return fetchInviteForGuest(wedding.id, guestId);
      if (groupId) return fetchInviteForGroup(wedding.id, groupId);
      return null;
    },
    enabled: !!wedding && (!!guestId || !!groupId),
  });

  useEffect(() => {
    setSelectedIds(new Set());
    setTheme("floral");
    setSavedInviteId(undefined);
    setRestored(false);
  }, [guestId, groupId]);

  useEffect(() => {
    if (restored || !savedQuery.data) return;
    setSelectedIds(new Set(savedQuery.data.eventIds));
    setTheme(savedQuery.data.theme);
    setSavedInviteId(savedQuery.data.id);
    setRestored(true);
  }, [savedQuery.data, restored]);

  const eventDates = useMemo(() => distinctEventDates(timelineEvents), [timelineEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const date of eventDates) {
      map.set(
        date,
        timelineEvents.filter((e) => e.eventDate === date),
      );
    }
    return map;
  }, [timelineEvents, eventDates]);

  const selectedEvents = useMemo(
    () => timelineEvents.filter((e) => selectedIds.has(e.id)),
    [timelineEvents, selectedIds],
  );

  const inviteImageSeed = guestId ?? groupId;

  const cardProps = useMemo(() => {
    if (!wedding) {
      return {
        coupleNames: "Couple",
        events: [],
        location: "",
        inviteImage: pickInviteImage(inviteImageSeed),
      };
    }
    return {
      coupleNames: wedding.coupleNames,
      events: buildInviteEventDetails(selectedEvents),
      location: wedding.location,
      inviteImage: pickInviteImage(inviteImageSeed),
    };
  }, [wedding, selectedEvents, inviteImageSeed]);

  const cardDimensions = useMemo(
    () => getCardDimensions(cardProps.events.length),
    [cardProps.events.length],
  );

  const ThemeComponent = INVITE_THEMES[theme].Component;

  const toggleEvent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const persistInvite = async () => {
    if (!wedding) return;
    const saved = await upsertInvite({
      weddingId: wedding.id,
      guestId: guestId,
      guestGroupId: groupId,
      eventIds: [...selectedIds],
      theme,
      existingId: savedInviteId ?? savedQuery.data?.id,
    });
    setSavedInviteId(saved.id);
  };

  const canExport =
    !!wedding &&
    cardProps.events.length > 0 &&
    cardProps.coupleNames.trim().length > 0;

  const handleExport = async (mode: "share" | "pdf") => {
    if (!cardExportRef.current || !wedding || !canExport) return;
    setExporting(true);
    try {
      const dataUrl = await rasterizeInviteCard(cardExportRef.current, cardDimensions);
      await persistInvite();

      const safeName = targetLabel.replace(/[^\w\s-]/g, "").trim() || "guest";
      const coupleSlug = wedding.coupleNames.replace(/[^\w\s-]/g, "").trim() || "invite";

      if (mode === "share") {
        await shareInviteImage(dataUrl, wedding.coupleNames);
      } else {
        downloadInvitePdf(dataUrl, `${coupleSlug}-invite-${safeName}.pdf`, cardDimensions);
        toast.success("PDF downloaded");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (!guestId && !groupId) {
    return (
      <div className="px-5 pt-10 text-center">
        <p className="text-sm text-muted-foreground">No guest or group selected.</p>
        <Link to="/guests" className="mt-4 inline-block text-sm text-primary">
          Back to guests
        </Link>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="px-5 pt-10 text-center text-sm text-muted-foreground">
        Set up your wedding first.
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader eyebrow={targetLabel} title="Create invite">
        <Link
          to="/guests"
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to guests
        </Link>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5">
        {/* Full-resolution export target — painted off-screen, never display:none */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 overflow-hidden"
          style={{
            left: -cardDimensions.width - 100,
            width: cardDimensions.width,
            height: cardDimensions.height,
          }}
        >
          <div
            ref={cardExportRef}
            style={{ width: cardDimensions.width, height: cardDimensions.height }}
            className="overflow-hidden"
          >
            <ThemeComponent {...cardProps} />
          </div>
        </div>

        <section>
          <h2 className="mb-2 px-1 font-serif text-lg text-foreground">Events</h2>
          <Card className="divide-y divide-border rounded-2xl p-0">
            {[...eventsByDate.entries()].map(([date, events], index) => (
              <div key={date} className="px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  {dateTabLabel(date, index)}
                </p>
                <ul className="mt-2 space-y-2">
                  {events.map((event) => (
                    <li key={event.id}>
                      <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                          checked={selectedIds.has(event.id)}
                          onCheckedChange={() => toggleEvent(event.id)}
                          className="mt-0.5"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-foreground">{event.name}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {formatDisplayTime(event.time)} · {event.venue}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {eventsByDate.size === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No timeline events yet — add them from your checklist.
              </p>
            ) : null}
          </Card>
        </section>

        <section>
          <h2 className="mb-2 px-1 font-serif text-lg text-foreground">Theme</h2>
          <div className="selectable-scroll flex gap-3">
            {INVITE_THEME_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={cn(
                  "shrink-0 rounded-xl p-1 transition-shadow focus-visible:outline-none",
                  theme === id
                    ? "ring-2 ring-primary ring-offset-2"
                    : "ring-1 ring-border",
                )}
                aria-label={INVITE_THEMES[id].label}
              >
                <div
                  className="h-14 w-14 rounded-lg"
                  style={{ background: INVITE_THEMES[id].swatch }}
                />
                <p className="mt-1 text-center text-[10px] text-muted-foreground">
                  {INVITE_THEMES[id].label}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 font-serif text-lg text-foreground">Preview</h2>
          <Card className="flex justify-center overflow-hidden rounded-2xl p-4">
            <div
              className="overflow-hidden rounded-lg shadow-md"
              style={{
                width: cardDimensions.width * PREVIEW_SCALE,
                height: cardDimensions.height * PREVIEW_SCALE,
              }}
            >
              <div
                style={{
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: "top left",
                }}
              >
                <div
                  style={{
                    width: cardDimensions.width,
                    height: cardDimensions.height,
                  }}
                  className="overflow-hidden"
                >
                  <ThemeComponent {...cardProps} />
                </div>
              </div>
            </div>
          </Card>
        </section>

        <div className="space-y-3 pb-6">
          <Button
            className="w-full"
            disabled={exporting || !canExport}
            onClick={() => handleExport("share")}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share via WhatsApp
          </Button>
          <Button
            className="w-full"
            variant="outline"
            disabled={exporting || !canExport}
            onClick={() => handleExport("pdf")}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Save PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
