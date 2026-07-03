import type { ComponentType } from "react";
import type { InviteThemeId } from "@/lib/invite-utils";
import { cn } from "@/lib/utils";

export interface InviteCardProps {
  coupleNames: string;
  eventSummary: string;
  dateRange: string;
  location: string;
}

const cardBase = "flex h-full w-full flex-col items-center justify-center px-16 text-center";

export function FloralInviteCard({
  coupleNames,
  eventSummary,
  dateRange,
  location,
}: InviteCardProps) {
  return (
    <div
      className={cardBase}
      style={{
        background: "linear-gradient(165deg, #FBF7F0 0%, #F5E6D8 45%, #E8C4A8 100%)",
        fontFamily: "'Fraunces', Georgia, serif",
      }}
    >
      <p
        className="text-sm uppercase tracking-[0.28em] text-[#8B5E3C]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        You&apos;re invited
      </p>
      <h1 className="mt-8 text-5xl font-medium leading-tight text-[#3D2914]">{coupleNames}</h1>
      <div className="my-8 h-px w-24 bg-[#C17F59]" />
      <p className="text-xl leading-relaxed text-[#5C4033]" style={{ fontFamily: "'Inter', sans-serif" }}>
        {eventSummary}
      </p>
      <p className="mt-6 text-lg text-[#6B4C3B]">{dateRange}</p>
      <p className="mt-3 text-base text-[#8B6F5C]" style={{ fontFamily: "'Inter', sans-serif" }}>
        {location}
      </p>
    </div>
  );
}

export function MinimalInviteCard({
  coupleNames,
  eventSummary,
  dateRange,
  location,
}: InviteCardProps) {
  return (
    <div
      className={cn(cardBase, "bg-[#FBF7F0]")}
      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
    >
      <p
        className="text-xs uppercase tracking-[0.35em] text-[#9A8B7A]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Wedding invitation
      </p>
      <h1 className="mt-12 text-4xl font-medium tracking-tight text-[#2C2418]">{coupleNames}</h1>
      <p
        className="mt-10 max-w-md text-lg leading-relaxed text-[#5C5348]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {eventSummary}
      </p>
      <p className="mt-12 text-base text-[#6B6358]">{dateRange}</p>
      <p
        className="mt-2 text-sm text-[#9A8B7A]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {location}
      </p>
    </div>
  );
}

export function RoyalInviteCard({
  coupleNames,
  eventSummary,
  dateRange,
  location,
}: InviteCardProps) {
  return (
    <div
      className={cn(cardBase, "p-12")}
      style={{
        background: "linear-gradient(160deg, #4A0E1A 0%, #2D0810 50%, #1A0508 100%)",
        fontFamily: "'Fraunces', Georgia, serif",
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center border border-[#C9A227]/60 px-12 py-16">
        <p
          className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Shubh Vivah
        </p>
        <h1 className="mt-8 text-5xl font-semibold leading-tight text-[#F5E6C8]">{coupleNames}</h1>
        <div className="my-8 h-px w-32 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />
        <p className="text-xl leading-relaxed text-[#E8D5B5]" style={{ fontFamily: "'Inter', sans-serif" }}>
          {eventSummary}
        </p>
        <p className="mt-8 text-lg text-[#D4AF37]">{dateRange}</p>
        <p className="mt-3 text-base text-[#B8A088]" style={{ fontFamily: "'Inter', sans-serif" }}>
          {location}
        </p>
      </div>
    </div>
  );
}

export function PastelInviteCard({
  coupleNames,
  eventSummary,
  dateRange,
  location,
}: InviteCardProps) {
  return (
    <div
      className={cn(cardBase, "p-10")}
      style={{
        background: "linear-gradient(145deg, #FDF2F8 0%, #F3E8FF 50%, #EDE9FE 100%)",
        fontFamily: "'Fraunces', Georgia, serif",
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center rounded-[2rem] bg-white/40 px-12 py-14 backdrop-blur-sm">
        <p
          className="text-sm font-light uppercase tracking-[0.25em] text-[#9B7BB8]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Save the date
        </p>
        <h1 className="mt-8 text-4xl font-normal leading-tight text-[#4A3F55]">{coupleNames}</h1>
        <p
          className="mt-10 max-w-md text-lg font-light leading-relaxed text-[#6B5B73]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {eventSummary}
        </p>
        <p className="mt-10 text-base text-[#7C6B8A]">{dateRange}</p>
        <p className="mt-2 text-sm font-light text-[#9B8AA8]" style={{ fontFamily: "'Inter', sans-serif" }}>
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
