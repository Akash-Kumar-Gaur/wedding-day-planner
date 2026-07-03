import type { ComponentType, CSSProperties } from "react";
import type { InviteEventDetail, InviteThemeId } from "@/lib/invite-utils";
import { cn } from "@/lib/utils";

export type { InviteEventDetail };

export interface InviteCardProps {
  coupleNames: string;
  events: InviteEventDetail[];
  location: string;
  inviteImage?: string;
}

const cardBase = "flex h-full w-full flex-col items-center justify-center px-16 text-center";
const sans = "'Inter', sans-serif";

const inviteImageStyle: CSSProperties = {
  width: "60%",
  maxHeight: "28%",
  height: "auto",
  margin: "12px auto 16px",
  objectFit: "contain",
  display: "block",
  flexShrink: 0,
};

const EVENT_NAME_SIZE = 20;
const EVENT_META_SIZE = 15;
const EVENT_BLOCK_GAP = 22;
const EVENT_META_MARGIN_TOP = 4;

function InviteEventList({
  events,
  nameColor,
  metaColor,
}: {
  events: InviteEventDetail[];
  nameColor: string;
  metaColor: string;
}) {
  if (events.length === 0) {
    return (
      <p style={{ fontFamily: sans, fontSize: 22, lineHeight: 1.4, color: metaColor, margin: 0 }}>
        Wedding celebrations
      </p>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 520,
        display: "flex",
        flexDirection: "column",
        gap: EVENT_BLOCK_GAP,
        textAlign: "center",
      }}
    >
      {events.map((event) => (
        <div key={`${event.name}-${event.dateLabel}-${event.venue}`}>
          <p
            style={{
              fontFamily: sans,
              fontSize: EVENT_NAME_SIZE,
              fontWeight: 500,
              lineHeight: 1.35,
              color: nameColor,
              margin: 0,
            }}
          >
            {event.name}
          </p>
          <p
            style={{
              fontFamily: sans,
              fontSize: EVENT_META_SIZE,
              lineHeight: 1.4,
              color: metaColor,
              margin: `${EVENT_META_MARGIN_TOP}px 0 0`,
            }}
          >
            {event.dateLabel}
            {event.venue ? ` · ${event.venue}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

function titleScale(): string {
  return "text-[3.25rem]";
}

function headerGap(): string {
  return "mt-8";
}

function dividerMargin(): string {
  return "my-8";
}

function locationStyle(base: CSSProperties): CSSProperties {
  return { ...base, textTransform: "uppercase", letterSpacing: "0.12em" };
}

export function FloralInviteCard({ coupleNames, events, location, inviteImage }: InviteCardProps) {
  const divider = dividerMargin();
  return (
    <div
      className={cardBase}
      style={{
        background: "linear-gradient(165deg, #FBF7F0 0%, #F5E6D8 45%, #E8C4A8 100%)",
        fontFamily: "'Fraunces', Georgia, serif",
      }}
    >
      <p className="text-base uppercase tracking-[0.28em] text-[#8B5E3C]" style={{ fontFamily: sans }}>
        You&apos;re invited
      </p>
      {inviteImage ? (
        <img src={inviteImage} alt="" aria-hidden style={inviteImageStyle} />
      ) : null}
      <h1
        className={cn(
          headerGap(),
          titleScale(),
          "font-medium leading-tight text-[#3D2914]",
        )}
      >
        {coupleNames}
      </h1>
      <div className={cn(divider, "h-px w-24 bg-[#C17F59]")} />
      <InviteEventList events={events} nameColor="#5C4033" metaColor="#6F4F3C" />
      <div className={cn(divider, "h-px w-24 bg-[#C17F59]")} />
      <p
        className="text-base text-[#6F4F3C]"
        style={locationStyle({ fontFamily: sans, margin: 0 })}
      >
        {location}
      </p>
    </div>
  );
}

export function MinimalInviteCard({ coupleNames, events, location }: InviteCardProps) {
  return (
    <div className={cn(cardBase, "bg-[#FBF7F0]")} style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
      <p className="text-sm uppercase tracking-[0.35em] text-[#9A8B7A]" style={{ fontFamily: sans }}>
        Wedding invitation
      </p>
      <h1
        className={cn(
          "mt-12 text-5xl font-medium tracking-tight text-[#2C2418]",
        )}
      >
        {coupleNames}
      </h1>
      <div className="mt-10">
        <InviteEventList events={events} nameColor="#5C5348" metaColor="#6E6256" />
      </div>
      <p
        className="mt-12 text-base text-[#6E6256]"
        style={locationStyle({ fontFamily: sans, margin: 0 })}
      >
        {location}
      </p>
    </div>
  );
}

export function RoyalInviteCard({ coupleNames, events, location }: InviteCardProps) {
  const divider = dividerMargin();

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
          "flex h-full w-full flex-col items-center justify-center border border-[#C9A227]/60 px-12 py-16",
        )}
      >
        <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]" style={{ fontFamily: sans }}>
          Shubh Vivah
        </p>
        <h1
          className={cn(
            headerGap(),
            titleScale(),
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
        <InviteEventList events={events} nameColor="#E8D5B5" metaColor="#D4C2A4" />
        <div
          className={cn(
            divider,
            "h-px w-32 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent",
          )}
        />
        <p
          className="text-base text-[#D4C2A4]"
          style={locationStyle({ fontFamily: sans, margin: 0 })}
        >
          {location}
        </p>
      </div>
    </div>
  );
}

export function PastelInviteCard({ coupleNames, events, location }: InviteCardProps) {
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
          "flex h-full w-full flex-col items-center justify-center rounded-[2rem] bg-white/40 px-12 py-14 backdrop-blur-sm",
        )}
      >
        <p
          className="text-base font-light uppercase tracking-[0.25em] text-[#9B7BB8]"
          style={{ fontFamily: sans }}
        >
          Save the date
        </p>
        <h1
          className={cn(
            headerGap(),
            titleScale(),
            "font-normal leading-tight text-[#4A3F55]",
          )}
        >
          {coupleNames}
        </h1>
        <div className="mt-10">
          <InviteEventList events={events} nameColor="#6B5B73" metaColor="#7E6E86" />
        </div>
        <p
          className="mt-10 text-base font-light text-[#7E6E86]"
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
