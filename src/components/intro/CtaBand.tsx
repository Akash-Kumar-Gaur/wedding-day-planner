import { Link } from "@tanstack/react-router";

export function CtaBand() {
  return (
    <div className="mx-7 mb-[90px] rounded-[28px] bg-ink px-6 py-[74px] text-center text-ivory md:px-10">
      <h2 className="mx-auto mb-4 max-w-[640px] font-display text-[clamp(28px,4vw,42px)] font-semibold">
        Four days. One plan. <em className="italic text-haldi2">Zero</em> WhatsApp archaeology.
      </h2>
      <p className="mx-auto mb-[30px] max-w-[440px] opacity-70">
        Set up your first event and start adding vendors, guests and budget in a few minutes.
      </p>
      <Link
        to="/login"
        className="inline-block rounded-full bg-haldi2 px-5 py-[11px] text-sm font-bold text-ink transition-colors hover:bg-ivory"
      >
        Start planning
      </Link>
    </div>
  );
}
