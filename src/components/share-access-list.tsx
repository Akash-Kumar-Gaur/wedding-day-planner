import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/app-shell";
import type { WeddingCollaborator } from "@/data/wedding-types";

export function ShareAccessList({
  ownerEmail,
  collaborators,
  readOnly = false,
}: {
  ownerEmail: string;
  collaborators: WeddingCollaborator[];
  readOnly?: boolean;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 px-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-serif text-lg text-foreground">People with access</h2>
      </div>
      <Card className="divide-y divide-border rounded-2xl p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">You</p>
            <p className="text-xs text-muted-foreground">{ownerEmail}</p>
          </div>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Owner
          </span>
        </div>
        {collaborators.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{c.email}</p>
              <p className="text-xs text-muted-foreground">
                {c.status === "accepted" ? "Active collaborator" : "Invite pending"}
              </p>
            </div>
            <StatusBadge status={c.status === "accepted" ? "done" : "pending"} />
          </div>
        ))}
        {collaborators.length === 0 && !readOnly ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No collaborators yet — invite someone to help plan.
          </p>
        ) : null}
      </Card>
    </section>
  );
}
