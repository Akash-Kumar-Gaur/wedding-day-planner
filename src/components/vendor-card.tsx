import { Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/app-shell";
import type { Vendor } from "@/data/wedding-types";
import { formatINR, shortDate } from "@/data/wedding";
import { cn } from "@/lib/utils";

export function VendorCard({
  vendor,
  onClick,
  readOnly = false,
}: {
  vendor: Vendor;
  onClick?: () => void;
  readOnly?: boolean;
}) {
  const balance = vendor.totalCost - vendor.advancePaid;

  return (
    <Card
      role={readOnly ? undefined : "button"}
      tabIndex={readOnly ? undefined : 0}
      onClick={readOnly ? undefined : onClick}
      onKeyDown={
        readOnly || !onClick
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
      }
      className={cn(
        "rounded-2xl p-4",
        !readOnly && onClick && "cursor-pointer transition-colors hover:bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{vendor.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {vendor.contactName || "No contact"}
          </p>
        </div>
        <StatusBadge
          status={
            vendor.status === "Paid" ? "done" : vendor.status === "Confirmed" ? "done" : "pending"
          }
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Advance paid</p>
          <p className="mt-0.5 font-medium text-foreground">{formatINR(vendor.advancePaid)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Balance due</p>
          <p
            className={cn(
              "mt-0.5 font-medium",
              balance > 0 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {formatINR(balance)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Phone className="h-3 w-3" /> {vendor.phone || "—"}
        </span>
        <span>{vendor.dueDate ? `Due ${shortDate(vendor.dueDate)}` : "No due date"}</span>
      </div>
    </Card>
  );
}
