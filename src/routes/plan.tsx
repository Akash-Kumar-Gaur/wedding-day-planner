import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, Loader2, Sparkles, ListChecks } from "lucide-react";
import { ScreenHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WeddingTradition } from "@/data/checklist-templates";
import { personalizePlanWithAI } from "@/lib/personalize-plan";
import { useWeddingPlan } from "@/lib/wedding-plan-store";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Personalize — ShadiPlan" },
      { name: "description", content: "Build a wedding checklist tailored to your tradition and scale." },
      { property: "og:title", content: "Personalize — ShadiPlan" },
    ],
  }),
  component: PlanScreen,
});

const TRADITIONS: WeddingTradition[] = [
  "North Indian Hindu",
  "South Indian",
  "Punjabi",
  "Bengali",
  "Destination",
  "Custom",
];

const BUDGET_RANGES = [
  "Under ₹25 lakh",
  "₹25–50 lakh",
  "₹50 lakh – ₹1 crore",
  "₹1–2 crore",
  "₹2 crore+",
];

function PlanScreen() {
  const navigate = useNavigate();
  const { applyStandardChecklist, applyPersonalizedPlan } = useWeddingPlan();

  const [tradition, setTradition] = useState<WeddingTradition>("North Indian Hindu");
  const [days, setDays] = useState("4");
  const [venues, setVenues] = useState("3");
  const [guestCount, setGuestCount] = useState("250");
  const [budgetRange, setBudgetRange] = useState(BUDGET_RANGES[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formInput = {
    tradition,
    days: Number(days) || 4,
    venues: Number(venues) || 1,
    guestCount: Number(guestCount) || 100,
    budgetRange,
  };

  const handleStandard = () => {
    setError(null);
    applyStandardChecklist(tradition);
    navigate({ to: "/checklist" });
  };

  const handlePersonalize = async () => {
    setError(null);
    setLoading(true);
    try {
      const plan = await personalizePlanWithAI(formInput);
      applyPersonalizedPlan(plan, formInput);
      navigate({ to: "/checklist" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong personalizing your plan.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ScreenHeader
        eyebrow="ShadiPlan"
        title="Personalize your plan"
      >
        <p className="mt-1 text-xs text-muted-foreground">
          Tell us about your wedding — we&apos;ll build a checklist so nothing slips through.
        </p>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5">
        <Card className="space-y-4 rounded-2xl p-5">
          <div className="space-y-2">
            <Label htmlFor="tradition">Wedding tradition</Label>
            <Select value={tradition} onValueChange={(v) => setTradition(v as WeddingTradition)}>
              <SelectTrigger id="tradition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRADITIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="days">Event days</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={7}
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venues">Venues / cities</Label>
              <Input
                id="venues"
                type="number"
                min={1}
                max={5}
                value={venues}
                onChange={(e) => setVenues(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">Guest count (approx.)</Label>
            <Input
              id="guests"
              type="number"
              min={20}
              step={10}
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget range</Label>
            <Select value={budgetRange} onValueChange={setBudgetRange}>
              <SelectTrigger id="budget">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_RANGES.map((range) => (
                  <SelectItem key={range} value={range}>
                    {range}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {error ? (
          <Card className="rounded-2xl border-[color-mix(in_oklab,var(--warning)_45%,transparent)] bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:oklch(0.42_0.13_65)]" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">AI personalize failed</p>
                <p className="text-muted-foreground">{error}</p>
                <p className="text-muted-foreground">
                  Try the standard checklist instead — it&apos;s instant and covers the most
                  commonly missed tasks for your tradition.
                </p>
                <Button variant="outline" size="sm" onClick={handleStandard}>
                  Use standard checklist
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        <div className="space-y-3 pb-4">
          <Button className="w-full" variant="outline" onClick={handleStandard} disabled={loading}>
            <ListChecks className="mr-2 h-4 w-4" />
            Use standard checklist
          </Button>
          <Button className="w-full" onClick={handlePersonalize} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Personalizing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Personalize with AI
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
