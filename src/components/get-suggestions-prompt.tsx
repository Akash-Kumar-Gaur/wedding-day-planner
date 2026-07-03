import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Dashed card for optional secondary actions (e.g. personalize plan on home). */
export function SecondaryPromptCard({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-2xl border-dashed p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-lg text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {Icon ? <Icon className="h-5 w-5 shrink-0 text-primary" /> : null}
      </div>
      <div className="mt-4">{action}</div>
    </Card>
  );
}

export function GetSuggestionsLink({
  onClick,
  label = "Not sure what to add? Get suggestions",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-primary",
        className,
      )}
    >
      {label}
      <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );
}

export function SectionEmptyState({
  title,
  description,
  primaryAction,
  onGetSuggestions,
  suggestionsLabel,
  titleClassName,
}: {
  title: string;
  description: string;
  primaryAction?: ReactNode;
  onGetSuggestions: () => void;
  suggestionsLabel?: string;
  titleClassName?: string;
}) {
  return (
    <Card className="rounded-2xl border-dashed p-6 text-center">
      <p className={cn("text-foreground", titleClassName ?? "font-serif text-lg")}>{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {primaryAction ? <div className="mt-4">{primaryAction}</div> : null}
      <div className={primaryAction ? "mt-3" : "mt-4"}>
        <GetSuggestionsLink onClick={onGetSuggestions} label={suggestionsLabel} />
      </div>
    </Card>
  );
}
