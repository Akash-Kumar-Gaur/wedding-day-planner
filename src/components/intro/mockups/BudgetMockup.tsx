export function BudgetMockup() {
  return (
    <div className="flex items-center gap-6 rounded-[18px] border border-taupe bg-ivory2 p-[30px]">
      <svg width="88" height="88" viewBox="0 0 88 88" className="flex-none">
        <circle cx="44" cy="44" r="36" fill="none" stroke="#E7DCC7" strokeWidth={9} />
        <circle
          cx="44"
          cy="44"
          r="36"
          fill="none"
          stroke="#C99A2E"
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray="226"
          strokeDashoffset="72"
          transform="rotate(-90 44 44)"
        />
      </svg>
      <div className="font-mono text-xs">
        <span className="mb-1 block font-display text-[26px] text-ink">68%</span>
        of budget allocated
        <br />
        across 4 events
      </div>
    </div>
  );
}
