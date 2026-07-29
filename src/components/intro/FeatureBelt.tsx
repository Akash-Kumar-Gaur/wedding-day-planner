import { chips } from "./content";
import { iconMap } from "./icons";

export function FeatureBelt() {
  return (
    <div className="mx-auto flex max-w-[760px] flex-wrap justify-center gap-3 px-7 pb-[84px]">
      {chips.map((c) => {
        const Icon = iconMap[c.icon];
        return (
          <div
            key={c.label}
            className="flex items-center gap-2 rounded-full border border-taupe2 bg-white/50 px-4 py-[9px] text-[13px] font-semibold"
          >
            <Icon className="h-[15px] w-[15px] flex-none text-shaadi" />
            {c.label}
          </div>
        );
      })}
    </div>
  );
}
