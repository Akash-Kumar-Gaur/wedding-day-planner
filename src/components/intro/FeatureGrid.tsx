import { gridCards } from "./content";
import { iconMap } from "./icons";
import { Reveal } from "./Reveal";

export function FeatureGrid() {
  return (
    <div className="mx-auto max-w-[1120px] px-7">
      <div className="grid grid-cols-1 gap-5 py-5 pb-24 md:grid-cols-2">
        {gridCards.map((g) => {
          const Icon = iconMap[g.icon];
          return (
            <Reveal key={g.title}>
              <div className="h-full rounded-[18px] border border-taupe bg-white/40 p-6">
                <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-ink text-haldi2">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-display text-[19px] font-semibold">{g.title}</h3>
                <p className="text-sm text-[#4a3a3f]">{g.body}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
