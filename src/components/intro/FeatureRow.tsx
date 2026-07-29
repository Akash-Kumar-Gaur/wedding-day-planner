import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  heading: string;
  body: string;
  reverse?: boolean;
  children: ReactNode;
}

export function FeatureRow({ eyebrow, heading, body, reverse, children }: Props) {
  return (
    <div
      className={`flex flex-col items-center gap-8 py-14 md:flex-row md:gap-16 md:py-[88px] ${
        reverse ? "md:flex-row-reverse" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="mb-3.5 font-mono text-xs uppercase tracking-[.14em] text-mehendi">{eyebrow}</p>
        <h2 className="mb-4 font-display text-[clamp(26px,3.4vw,36px)] font-semibold leading-[1.15]">
          {heading}
        </h2>
        <p className="max-w-[440px] text-base text-[#4a3a3f]">{body}</p>
      </div>
      <div className="w-full min-w-0 flex-1">{children}</div>
    </div>
  );
}
