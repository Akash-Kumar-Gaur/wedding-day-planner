import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Building2, Plus, Sparkles } from "lucide-react";
import { EmblemBadge } from "@/components/emblem-badge";
import { FloralInviteCard } from "@/components/invite-themes";
import { DemoPhoneFrame } from "@/components/intro/demo-phone-frame";
import { GuestHeadcountSummaryCard } from "@/components/guest-headcount-summary";
import { GuestRow } from "@/components/guest-row";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { OnboardingForkChoices } from "@/components/onboarding-fork-choices";
import { ShareAccessList } from "@/components/share-access-list";
import { TimelineDayTabs } from "@/components/timeline-day-tabs";
import { VendorCard } from "@/components/vendor-card";
import { WalletBudgetSummary } from "@/components/wallet-budget-summary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DEMO_BUDGET_CATEGORIES,
  DEMO_COLLABORATORS,
  DEMO_COUPLE_NAMES,
  DEMO_EVENTS_BY_DATE,
  DEMO_GUESTS,
  DEMO_INVITE_EVENTS,
  DEMO_LOCATION,
  DEMO_VENDORS,
  DEMO_WEDDING_DAYS,
} from "@/lib/intro-demo-data";
import type { InviteEventDetail } from "@/lib/invite-utils";
import type { InviteCardDimensions } from "@/lib/invite-export";
import { getCardDimensions } from "@/lib/invite-export";
import { pickInviteImage } from "@/lib/invite-images";
import { computeGuestHeadcounts } from "@/lib/guest-headcount";
import { dateTabLabel } from "@/lib/lead-time-dates";
import { cn } from "@/lib/utils";

const INVITE_PREVIEW_SCALE = 0.36;

export const Route = createFileRoute("/intro")({
  head: () => ({
    meta: [
      { title: "ShadiPlan — Plan your wedding, your way" },
      {
        name: "description",
        content:
          "Plan your multi-day wedding — vendors, guests, budget, and invites, all in one place. Manual entry or AI-assisted suggestions, your call.",
      },
      { property: "og:title", content: "ShadiPlan — Plan your wedding, your way" },
      {
        property: "og:description",
        content:
          "Plan your multi-day wedding — vendors, guests, budget, and invites, all in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "ShadiPlan — Plan your wedding, your way",
      },
      {
        name: "twitter:description",
        content:
          "Plan your multi-day wedding — vendors, guests, budget, and invites, all in one place.",
      },
    ],
  }),
  component: IntroPage,
});

function IntroPage() {
  const guestHeadcounts = useMemo(() => computeGuestHeadcounts(DEMO_GUESTS), []);
  const totalSpent = DEMO_BUDGET_CATEGORIES.reduce((s, c) => s + c.actual, 0);
  const totalPlanned = DEMO_BUDGET_CATEGORIES.reduce((s, c) => s + c.planned, 0);
  const inviteImage = useMemo(() => pickInviteImage("intro-demo"), []);
  const cardDimensions = useMemo(
    () => getCardDimensions(DEMO_INVITE_EVENTS.length),
    [],
  );

  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <header>
        <HeroBackdrop className="min-h-[min(52dvh,520px)] py-16 md:py-24">
          <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
            <EmblemBadge size="lg" />
            <h1 className="mt-6 font-serif text-5xl font-medium tracking-tight text-[#FBF3EC] md:text-6xl">
              ShadiPlan
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-[#FBF3EC]/90 md:text-xl">
              Plan your multi-day wedding — vendors, guests, budget, and invites, all in one place
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 rounded-full px-8 text-base shadow-lg"
              style={{
                background: "#FBF3EC",
                color: "#6B2C1F",
              }}
            >
              <Link to="/login">Get started</Link>
            </Button>
          </div>
        </HeroBackdrop>
      </header>

      <main>
        <FeatureSection
          title="Plan your way"
          description="Start from scratch and add everything yourself, or answer a few questions and review AI suggestions one at a time before anything lands in your plan."
          visual={
            <DemoPhoneFrame>
              <div className="space-y-4 bg-background p-5">
                <OnboardingForkChoices readOnly />
              </div>
            </DemoPhoneFrame>
          }
        />

        <FeatureSection
          reverse
          title="Vendors, organized"
          description="Track every vendor, payments, due dates, and confirmation status at a glance — no more scattered WhatsApp threads and spreadsheets."
          visual={
            <DemoPhoneFrame>
              <div className="space-y-4 bg-background p-5">
                <div className="flex items-center gap-2 px-1">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="font-serif text-lg text-foreground">Venue</h3>
                  <span className="text-xs text-muted-foreground">· 1</span>
                </div>
                <VendorCard vendor={DEMO_VENDORS[0]} readOnly />
                <div className="flex items-center gap-2 px-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-serif text-lg text-foreground">Decor</h3>
                  <span className="text-xs text-muted-foreground">· 1</span>
                </div>
                <VendorCard vendor={DEMO_VENDORS[1]} readOnly />
              </div>
            </DemoPhoneFrame>
          }
        />

        <FeatureSection
          title="Guests, without the spreadsheet"
          description="RSVP tracking, meal preferences, accommodation, plus-ones, and real headcount totals — so catering and room blocks stay honest."
          visual={
            <DemoPhoneFrame>
              <div className="bg-background p-5">
                <GuestHeadcountSummaryCard headcounts={guestHeadcounts} />
                <Card className="mt-4 divide-y divide-border rounded-2xl p-0">
                  {DEMO_GUESTS.map((g) => (
                    <GuestRow key={g.id} guest={g} readOnly />
                  ))}
                </Card>
              </div>
            </DemoPhoneFrame>
          }
        />

        <FeatureSection
          reverse
          title="Budget that stays honest"
          description="Log real expenses as they happen and see actual spend per category — not guesswork when vendors ask for the next installment."
          visual={
            <DemoPhoneFrame className="relative">
              <div className="bg-background p-5 pb-16">
                <WalletBudgetSummary
                  totalSpent={totalSpent}
                  totalBudget={1200000}
                  totalPlanned={totalPlanned}
                  categories={DEMO_BUDGET_CATEGORIES}
                  readOnly
                />
              </div>
              <div
                className="pointer-events-none absolute bottom-4 right-4 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"
                aria-hidden
              >
                <Plus className="h-5 w-5" />
              </div>
            </DemoPhoneFrame>
          }
        />

        <FeatureSection
          title="A timeline for every day"
          description="Day-wise events with real dates, times, and venues — so every ceremony and dinner has a home on the schedule."
          visual={
            <DemoPhoneFrame>
              <div className="bg-background p-5">
                <TimelineDayTabs
                  weddingDays={DEMO_WEDDING_DAYS}
                  eventsByDate={DEMO_EVENTS_BY_DATE}
                  tabLabel={dateTabLabel}
                  readOnly
                />
              </div>
            </DemoPhoneFrame>
          }
        />

        <FeatureSection
          reverse
          title="Invites that look like you sent them"
          description="Pick a theme, select which events someone's invited to, and share straight to WhatsApp or download a PDF."
          visual={
            <DemoPhoneFrame>
              <div className="min-w-0 overflow-hidden bg-background p-4">
                <InviteCardPreview
                  coupleNames={DEMO_COUPLE_NAMES}
                  events={DEMO_INVITE_EVENTS}
                  location={DEMO_LOCATION}
                  inviteImage={inviteImage}
                  dimensions={cardDimensions}
                />
              </div>
            </DemoPhoneFrame>
          }
        />

        <FeatureSection
          title="Plan together"
          description="Invite family or your planner as collaborators — changes sync in real time so everyone works from the same live plan."
          visual={
            <DemoPhoneFrame>
              <div className="bg-background p-5">
                <ShareAccessList
                  ownerEmail="you@example.com"
                  collaborators={DEMO_COLLABORATORS}
                  readOnly
                />
              </div>
            </DemoPhoneFrame>
          }
        />
      </main>

      <footer className="border-t border-border bg-secondary/30 py-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 text-center">
          <p className="font-serif text-2xl text-foreground">Ready to plan your wedding?</p>
          <Button asChild size="lg" className="h-12 rounded-full px-8">
            <Link to="/login">Get started</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            <Link to="/terms" className="underline-offset-4 hover:underline">
              Terms
            </Link>
            {" · "}
            <Link to="/privacy" className="underline-offset-4 hover:underline">
              Privacy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

function InviteCardPreview({
  coupleNames,
  events,
  location,
  inviteImage,
  dimensions,
}: {
  coupleNames: string;
  events: InviteEventDetail[];
  location: string;
  inviteImage: string;
  dimensions: InviteCardDimensions;
}) {
  const scaledWidth = dimensions.width * INVITE_PREVIEW_SCALE;
  const scaledHeight = dimensions.height * INVITE_PREVIEW_SCALE;

  return (
    <div
      className="relative mx-auto max-w-full overflow-hidden rounded-lg shadow-md"
      style={{ width: scaledWidth, height: scaledHeight }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left overflow-hidden"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          transform: `scale(${INVITE_PREVIEW_SCALE})`,
        }}
      >
        <FloralInviteCard
          coupleNames={coupleNames}
          events={events}
          location={location}
          inviteImage={inviteImage}
        />
      </div>
    </div>
  );
}

function FeatureSection({
  title,
  description,
  visual,
  reverse = false,
}: {
  title: string;
  description: string;
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="border-t border-border/60 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2 md:gap-16">
        <div className={cn("min-w-0", reverse && "md:order-2")}>
          <h2 className="font-serif text-3xl leading-tight text-foreground md:text-4xl">{title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className={cn("min-w-0", reverse && "md:order-1")}>{visual}</div>
      </div>
    </section>
  );
}
