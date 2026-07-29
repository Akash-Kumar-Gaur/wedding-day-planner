import { appBadges } from "./content";
import { PhoneDownloadIcon } from "./icons";

export function AppBadges() {
  return (
    <div className="flex flex-col items-center gap-3 px-7 pb-16">
      <span className="font-mono text-[11px] uppercase tracking-[.08em] text-[#6b5a60]">
        Also coming to your phone
      </span>
      <div className="flex flex-wrap justify-center gap-3">
        {appBadges.map((b) =>
          b.href ? (
            <a
              key={b.id}
              href={b.href}
              className="flex items-center gap-2.5 rounded-xl border border-taupe2 bg-white/50 px-4 py-2.5 transition-colors hover:border-ink"
            >
              <PhoneDownloadIcon className="h-5 w-5 text-ink" />
              <span className="text-[13px] font-bold">{b.label}</span>
            </a>
          ) : (
            <button
              key={b.id}
              type="button"
              disabled
              aria-disabled="true"
              title="Coming soon"
              className="flex cursor-not-allowed select-none items-center gap-2.5 rounded-xl border border-taupe2 bg-white/30 px-4 py-2.5 opacity-60"
            >
              <PhoneDownloadIcon className="h-5 w-5 text-ink/70" />
              <span className="text-left leading-tight">
                <span className="block font-mono text-[9px] uppercase tracking-wide text-shaadi">
                  Coming soon
                </span>
                <span className="block text-[13px] font-bold text-ink/80">{b.label}</span>
              </span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
