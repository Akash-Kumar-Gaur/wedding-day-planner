export function TimelineMockup() {
  return (
    <div className="rounded-[18px] border border-taupe bg-ivory2 p-7 px-6">
      <div className="relative mx-1 mt-[30px] h-0.5 bg-taupe2">
        <div
          className="absolute -top-[26px] font-mono text-[10px] font-semibold text-shaadi"
          style={{ left: "36%" }}
        >
          TODAY
        </div>
        <div
          className="absolute -top-[5px] h-3 w-3 rounded-full border-2 border-ivory2 bg-haldi"
          style={{ left: "2%" }}
        />
        <div
          className="absolute -top-[5px] h-3 w-3 rounded-full border-2 border-ivory2 bg-haldi"
          style={{ left: "36%" }}
        />
        <div
          className="absolute -top-[5px] h-3 w-3 rounded-full border-2 border-ivory2 bg-ink"
          style={{ left: "66%" }}
        />
        <div
          className="absolute -top-[5px] h-3 w-3 rounded-full border-2 border-ivory2 bg-ink"
          style={{ left: "97%", marginLeft: "-12px" }}
        />
      </div>
      <div className="mt-3.5 flex justify-between font-mono text-[10px] text-[#6b5a60]">
        <span>Engagement</span>
        <span>Haldi</span>
        <span>Wedding</span>
        <span>Reception</span>
      </div>
    </div>
  );
}
