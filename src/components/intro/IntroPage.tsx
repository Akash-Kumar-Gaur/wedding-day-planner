import { NavBar } from "./NavBar";
import { Hero } from "./Hero";
import { AppBadges } from "./AppBadges";
import { FeatureBelt } from "./FeatureBelt";
import { FeatureRow } from "./FeatureRow";
import { FeatureGrid } from "./FeatureGrid";
import { CtaBand } from "./CtaBand";
import { Footer } from "./Footer";
import { Reveal } from "./Reveal";
import { featureRows } from "./content";
import { TimelineMockup } from "./mockups/TimelineMockup";
import { VendorsMockup } from "./mockups/VendorsMockup";
import { BudgetMockup } from "./mockups/BudgetMockup";

const mockupMap = { timeline: TimelineMockup, vendors: VendorsMockup, budget: BudgetMockup };

export default function IntroPage() {
  return (
    <div className="bg-ivory font-body text-ink antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <span className="absolute -right-[120px] -top-[140px] h-[420px] w-[420px] rounded-full bg-haldi opacity-[.22] blur-[60px]" />
        <span className="absolute -left-[160px] bottom-[10%] h-[360px] w-[360px] rounded-full bg-mehendi opacity-[.14] blur-[60px]" />
      </div>

      <NavBar />
      <Hero />
      <AppBadges />
      <FeatureBelt />
      <div className="mx-auto h-px max-w-[1120px] bg-taupe" />

      <div className="mx-auto max-w-[1120px] px-7" id="features">
        {featureRows.map((row, i) => {
          const Mockup = mockupMap[row.mockup];
          return (
            <div key={row.heading}>
              <Reveal>
                <FeatureRow
                  eyebrow={row.eyebrow}
                  heading={row.heading}
                  body={row.body}
                  reverse={row.reverse}
                >
                  <Mockup />
                </FeatureRow>
              </Reveal>
              {i < featureRows.length - 1 && <div className="h-px bg-taupe" />}
            </div>
          );
        })}
      </div>

      <div id="how">
        <FeatureGrid />
      </div>
      <Reveal>
        <CtaBand />
      </Reveal>
      <Footer />
    </div>
  );
}
