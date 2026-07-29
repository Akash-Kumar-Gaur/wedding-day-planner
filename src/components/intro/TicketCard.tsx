// The other isolated animation surface — fan-in + hover currently live in the
// .ticket-card CSS class (see global css). Swap point for spring physics later.
import type { CSSProperties } from "react";
import { iconMap, type IconKey } from "./icons";
import { accentColors, type CeremonyCard } from "./content";

interface Props {
  card: CeremonyCard;
  x: string;
  y: string;
  r: string;
  delay: string;
}

export function TicketCard({ card, x, y, r, delay }: Props) {
  const Icon = iconMap[card.icon as IconKey];
  return (
    <div
      className={`ticket-card absolute left-1/2 top-5 -ml-16 h-[178px] w-32 rounded-2xl border px-[14px] pb-[14px] pt-[18px] shadow-[0_10px_24px_rgba(36,16,25,0.10)] ${
        card.dark
          ? "ticket-card--dark border-[#4a2c39] bg-ink text-ivory"
          : "border-taupe2 bg-ivory text-ink"
      }`}
      style={{ "--x": x, "--y": y, "--r": r, "--d": delay } as CSSProperties}
    >
      <div className="absolute left-0 right-0 top-[58px] border-t border-dashed border-taupe2" />
      <Icon className="mb-[30px] h-[26px] w-[26px]" style={{ color: accentColors[card.accent] }} />
      <div className="font-mono text-[10px] tracking-wide opacity-55">{card.day}</div>
      <div className="mt-1 font-display text-[17px] font-semibold leading-tight">{card.name}</div>
    </div>
  );
}
