const rows = [
  { name: "Photography — Studio Ray", color: "bg-haldi", status: "Booked", pill: "bg-[#e4ecda] text-mehendi" },
  { name: "Catering — Bawarchi's", color: "bg-mehendi", status: "Paid", pill: "bg-[#f0dbe1] text-shaadi" },
  { name: "Décor — Petal & Foil", color: "bg-shaadi", status: "Pending", pill: "bg-[#f6e6ca] text-[#8a6112]" },
  { name: "Dhol — Rhythm Collective", color: "bg-ink", status: "Booked", pill: "bg-[#e4ecda] text-mehendi" },
];

export function VendorsMockup() {
  return (
    <div className="rounded-[18px] border border-taupe bg-ivory2 p-[22px]">
      {rows.map((row, i) => (
        <div
          key={row.name}
          className={`flex items-center justify-between px-1 py-[11px] text-[13.5px] ${
            i < rows.length - 1 ? "border-b border-taupe" : ""
          }`}
        >
          <span className="flex items-center gap-2.5 font-semibold">
            <span className={`h-2 w-2 rounded-full ${row.color}`} />
            {row.name}
          </span>
          <span
            className={`rounded-full px-[9px] py-[3px] font-mono text-[10px] uppercase tracking-wide ${row.pill}`}
          >
            {row.status}
          </span>
        </div>
      ))}
    </div>
  );
}
