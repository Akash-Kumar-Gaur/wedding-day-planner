import type { ComponentType, CSSProperties } from "react";
import type { InviteEventDetail, InviteThemeId } from "@/lib/invite-utils";
import { cn } from "@/lib/utils";

export type { InviteEventDetail };

export interface InviteCardProps {
  coupleNames: string;
  events: InviteEventDetail[];
  location: string;
}

const cardBase = "flex h-full w-full flex-col items-center justify-center px-16 text-center";
const sans = "'Inter', sans-serif";

type EventListDensity = "comfortable" | "cozy" | "tight";

const OVERFLOW_EVENT_CAP = 6;

function eventListDensity(count: number): EventListDensity {
  if (count >= 6) return "tight";
  if (count >= 4) return "cozy";
  return "comfortable";
}

function eventListStyles(density: EventListDensity) {
  switch (density) {
    case "tight":
      return { gap: 6, nameSize: 14, metaSize: 12, metaMarginTop: 2, lineHeight: 1.25 };
    case "cozy":
      return { gap: 12, nameSize: 17, metaSize: 14, metaMarginTop: 3, lineHeight: 1.3 };
    default:
      return { gap: 20, nameSize: 20, metaSize: 17, metaMarginTop: 4, lineHeight: 1.35 };
  }
}

function partitionInviteEvents(events: InviteEventDetail[]) {
  if (events.length < 8) {
    return { visible: events, overflow: 0 };
  }
  return {
    visible: events.slice(0, OVERFLOW_EVENT_CAP),
    overflow: events.length - OVERFLOW_EVENT_CAP,
  };
}

function InviteEventList({
  events,
  nameColor,
  metaColor,
}: {
  events: InviteEventDetail[];
  nameColor: string;
  metaColor: string;
}) {
  const { visible, overflow } = partitionInviteEvents(events);
  const density = eventListDensity(visible.length);
  const { gap, nameSize, metaSize, metaMarginTop, lineHeight } = eventListStyles(density);

  if (events.length === 0) {
    return (
      <p style={{ fontFamily: sans, fontSize: 20, lineHeight: 1.4, color: metaColor, margin: 0 }}>
        Wedding celebrations
      </p>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        display: "flex",
        flexDirection: "column",
        gap,
        textAlign: "center",
      }}
    >
      {visible.map((event) => (
        <div key={`${event.name}-${event.dateLabel}`}>
          <p
            style={{
              fontFamily: sans,
              fontSize: nameSize,
              fontWeight: 500,
              lineHeight,
              color: nameColor,
              margin: 0,
            }}
          >
            {event.name}
          </p>
          <p
            style={{
              fontFamily: sans,
              fontSize: metaSize,
              lineHeight,
              color: metaColor,
              margin: `${metaMarginTop}px 0 0`,
            }}
          >
            {event.dateLabel}
            {event.venue ? ` · ${event.venue}` : ""}
          </p>
        </div>
      ))}
      {overflow > 0 ? (
        <p
          style={{
            fontFamily: sans,
            fontSize: metaSize,
            lineHeight,
            color: metaColor,
            margin: "2px 0 0",
          }}
        >
          + {overflow} more — details in the app
        </p>
      ) : null}
    </div>
  );
}

function titleScale(eventCount: number): string {
  if (eventCount >= 6) return "text-4xl";
  if (eventCount >= 4) return "text-[2.75rem]";
  return "text-5xl";
}

function headerGap(eventCount: number): string {
  if (eventCount >= 6) return "mt-5";
  if (eventCount >= 4) return "mt-6";
  return "mt-8";
}

function dividerMargin(eventCount: number): string {
  if (eventCount >= 6) return "my-5";
  if (eventCount >= 4) return "my-6";
  return "my-8";
}

function locationStyle(base: CSSProperties): CSSProperties {
  return { ...base, textTransform: "uppercase", letterSpacing: "0.12em" };
}

export function FloralInviteCard({ coupleNames, events, location }: InviteCardProps) {
  const divider = dividerMargin(events.length);
  return (
    <div
      className={cardBase}
      style={{
        background: "linear-gradient(165deg, #FBF7F0 0%, #F5E6D8 45%, #E8C4A8 100%)",
        fontFamily: "'Fraunces', Georgia, serif",
      }}
    >
      <p className="text-sm uppercase tracking-[0.28em] text-[#8B5E3C]" style={{ fontFamily: sans }}>
        You&apos;re invited
      </p>
      <h1
        className={cn(
          headerGap(events.length),
          titleScale(events.length),
          "font-medium leading-tight text-[#3D2914]",
        )}
      >
        {coupleNames}
      </h1>
      <div className={cn(divider, "h-px w-24 bg-[#C17F59]")} />
      <InviteEventList events={events} nameColor="#5C4033" metaColor="#8B6F5C" />
      <div className={cn(divider, "h-px w-24 bg-[#C17F59]")} />
      <p
        className="text-sm text-[#8B6F5C]"
        style={locationStyle({ fontFamily: sans, margin: 0 })}
      >
        {location}
      </p>
    </div>
  );
}

export function MinimalInviteCard({ coupleNames, events, location }: InviteCardProps) {
  const titleMt = events.length >= 6 ? "mt-8" : events.length >= 4 ? "mt-10" : "mt-12";
  const eventsMt = events.length >= 6 ? "mt-6" : events.length >= 4 ? "mt-8" : "mt-10";
  const locationMt = events.length >= 6 ? "mt-6" : events.length >= 4 ? "mt-8" : "mt-12";

  return (
    <div className={cn(cardBase, "bg-[#FBF7F0]")} style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
      <p className="text-xs uppercase tracking-[0.35em] text-[#9A8B7A]" style={{ fontFamily: sans }}>
        Wedding invitation
      </p>
      <h1
        className={cn(
          titleMt,
          events.length >= 6 ? "text-3xl" : events.length >= 4 ? "text-[2rem]" : "text-4xl",
          "font-medium tracking-tight text-[#2C2418]",
        )}
      >
        {coupleNames}
      </h1>
      <div className={eventsMt}>
        <InviteEventList events={events} nameColor="#5C5348" metaColor="#9A8B7A" />
      </div>
      <p
        className={cn(locationMt, "text-sm text-[#9A8B7A]")}
        style={locationStyle({ fontFamily: sans, margin: 0 })}
      >
        {location}
      </p>
    </div>
  );
}

export function RoyalInviteCard({ coupleNames, events, location }: InviteCardProps) {
  const divider = dividerMargin(events.length);
  const innerPy = events.length >= 6 ? "py-10" : events.length >= 4 ? "py-12" : "py-16";

  return (
    <div
      className={cn(cardBase, "p-12")}
      style={{
        background: "linear-gradient(160deg, #4A0E1A 0%, #2D0810 50%, #1A0508 100%)",
        fontFamily: "'Fraunces', Georgia, serif",
      }}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center border border-[#C9A227]/60 px-12",
          innerPy,
        )}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]" style={{ fontFamily: sans }}>
          Shubh Vivah
        </p>
        <h1
          className={cn(
            headerGap(events.length),
            titleScale(events.length),
            "font-semibold leading-tight text-[#F5E6C8]",
          )}
        >
          {coupleNames}
        </h1>
        <div
          className={cn(
            divider,
            "h-px w-32 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent",
          )}
        />
        <InviteEventList events={events} nameColor="#E8D5B5" metaColor="#B8A088" />
        <div
          className={cn(
            divider,
            "h-px w-32 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent",
          )}
        />
        <p
          className="text-sm text-[#B8A088]"
          style={locationStyle({ fontFamily: sans, margin: 0 })}
        >
          {location}
        </p>
      </div>
    </div>
  );
}

export function PastelInviteCard({ coupleNames, events, location }: InviteCardProps) {
  const innerPy = events.length >= 6 ? "py-10" : events.length >= 4 ? "py-12" : "py-14";
  const eventsMt = events.length >= 6 ? "mt-6" : events.length >= 4 ? "mt-8" : "mt-10";
  const locationMt = events.length >= 6 ? "mt-6" : events.length >= 4 ? "mt-8" : "mt-10";

  return (
    <div
      className={cn(cardBase, "p-10")}
      style={{
        background: "linear-gradient(145deg, #FDF2F8 0%, #F3E8FF 50%, #EDE9FE 100%)",
        fontFamily: "'Fraunces', Georgia, serif",
      }}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center rounded-[2rem] bg-white/40 px-12 backdrop-blur-sm",
          innerPy,
        )}
      >
        <p
          className="text-sm font-light uppercase tracking-[0.25em] text-[#9B7BB8]"
          style={{ fontFamily: sans }}
        >
          Save the date
        </p>
        <h1
          className={cn(
            headerGap(events.length),
            events.length >= 6 ? "text-3xl" : events.length >= 4 ? "text-[2rem]" : "text-4xl",
            "font-normal leading-tight text-[#4A3F55]",
          )}
        >
          {coupleNames}
        </h1>
        <div className={eventsMt}>
          <InviteEventList events={events} nameColor="#6B5B73" metaColor="#9B8AA8" />
        </div>
        <p
          className={cn(locationMt, "text-sm font-light text-[#9B8AA8]")}
          style={locationStyle({ fontFamily: sans, margin: 0 })}
        >
          {location}
        </p>
      </div>
    </div>
  );
}

export const INVITE_THEMES: Record<
  InviteThemeId,
  {
    label: string;
    swatch: string;
    Component: ComponentType<InviteCardProps>;
  }
> = {
  floral: {
    label: "Floral",
    swatch: "linear-gradient(135deg, #FBF7F0, #E8C4A8)",
    Component: FloralInviteCard,
  },
  minimal: {
    label: "Minimal",
    swatch: "#FBF7F0",
    Component: MinimalInviteCard,
  },
  royal: {
    label: "Royal",
    swatch: "linear-gradient(135deg, #4A0E1A, #C9A227)",
    Component: RoyalInviteCard,
  },
  pastel: {
    label: "Pastel",
    swatch: "linear-gradient(135deg, #FDF2F8, #EDE9FE)",
    Component: PastelInviteCard,
  },
};

export const INVITE_THEME_IDS = Object.keys(INVITE_THEMES) as InviteThemeId[];
