import { PenLine, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function OnboardingForkChoices({
  onManual,
  onAi,
  disabled = false,
  readOnly = false,
}: {
  onManual?: () => void;
  onAi?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <>
      <Card className="rounded-2xl p-5">
        <p className="font-serif text-lg text-foreground">How would you like to get started?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You can always ask for suggestions later from any screen.
        </p>
      </Card>

      <div className="grid gap-3">
        <ForkChoice
          icon={PenLine}
          title="I'll add things myself"
          description="Start with a blank slate. Add vendors, guests, and checklist items when you're ready."
          onClick={onManual}
          disabled={disabled}
          readOnly={readOnly}
        />
        <ForkChoice
          icon={Sparkles}
          title="Help me get started"
          description="Answer a few questions, then review suggestions one at a time before anything is added."
          onClick={onAi}
          disabled={disabled}
          readOnly={readOnly}
        />
      </div>
    </>
  );
}

function ForkChoice({
  icon: Icon,
  title,
  description,
  onClick,
  disabled,
  readOnly,
}: {
  icon: typeof PenLine;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  if (readOnly) {
    return (
      <div className="rounded-2xl border border-border bg-background p-5 text-left">
        <Icon className="mb-2 h-5 w-5 text-primary" />
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-2xl border border-border bg-background p-5 text-left transition-colors hover:bg-muted/40",
        disabled && "opacity-60",
      )}
    >
      <Icon className="mb-2 h-5 w-5 text-primary" />
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}
