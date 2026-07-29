import { Link } from "@tanstack/react-router";
import { ceremonyCards, fanGeometry } from "./content";
import { TicketCard } from "./TicketCard";

export function Hero() {
  return (
    <section className="px-7 pb-10 pt-[76px] text-center">
      <p className="mb-3.5 font-mono text-xs uppercase tracking-[.14em] text-mehendi">
        FOUR DAYS · ONE PLAN
      </p>
      <h1 className="mx-auto mb-[22px] max-w-[780px] font-display text-[clamp(34px,6vw,60px)] font-semibold leading-[1.08]">
        Your wedding has four days.
        <br />
        One place to <em className="italic text-shaadi">plan</em> them.
      </h1>
      <p className="mx-auto mb-[34px] max-w-[520px] text-[17px] text-[#4a3a3f] opacity-85">
        Engagement, Haldi-Mehendi, Wedding, Reception — vendors, guests and budget for every
        single one, without losing track in a dozen WhatsApp groups.
      </p>
      <div className="mb-[74px] flex flex-wrap justify-center gap-3.5">
        <Link
          to="/login"
          className="rounded-full bg-ink px-5 py-[11px] text-sm font-bold text-ivory transition-colors hover:bg-shaadi"
        >
          Start planning
        </Link>
        <a
          href="#features"
          className="rounded-full border border-taupe2 px-5 py-[11px] text-sm font-bold hover:border-ink"
        >
          See how it works
        </a>
      </div>

      <div className="relative mx-auto h-[300px] max-w-[480px]">
        {ceremonyCards.map((card, i) => (
          <TicketCard
            key={card.name}
            card={card}
            x={fanGeometry[i].x}
            y={fanGeometry[i].y}
            r={fanGeometry[i].r}
            delay={`${0.05 + i * 0.13}s`}
          />
        ))}
      </div>

      <div className="mt-[26px] flex flex-wrap items-center justify-center gap-2.5 px-2.5 font-mono text-[11px] tracking-[.08em] text-[#6b5a60]">
        {ceremonyCards.map((card, i) => (
          <span key={card.name} className="contents">
            <span>{card.captionLabel}</span>
            {i < ceremonyCards.length - 1 && <span className="opacity-40">→</span>}
          </span>
        ))}
      </div>
    </section>
  );
}
