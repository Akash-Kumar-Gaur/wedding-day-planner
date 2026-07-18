import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScreenHeader, StatusBadge } from "@/components/app-shell";
import { useWeddingData } from "@/lib/wedding-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/share")({
  head: () => ({
    meta: [{ title: "Share — ShadiPlan" }],
  }),
  component: ShareScreen,
});

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function ShareScreen() {
  const { wedding, collaborators, isOwner, inviteCollaborator } = useWeddingData();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInvited, setLastInvited] = useState<string | null>(null);

  if (!wedding) return null;

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) return;
    setError(null);
    setSubmitting(true);
    try {
      await inviteCollaborator(trimmed);
      setLastInvited(trimmed);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invite");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Share planning">
        <p className="mt-1 text-sm text-muted-foreground">
          Invite family to plan together — everyone sees changes in real time.
        </p>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5 pb-8">
        {isOwner ? (
          <Card className="space-y-4 rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <p className="font-medium text-foreground">Invite by email</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="family@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}
            <Button
              className="w-full"
              disabled={!isValidEmail(email) || submitting}
              onClick={handleInvite}
            >
              {submitting ? "Inviting…" : "Send invite"}
            </Button>
            {lastInvited ? (
              <p className="rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
                Invite email sent to{" "}
                <span className="font-medium text-foreground">{lastInvited}</span>. They can sign
                in at shadiplan.redevolve.in with that email to get access.
              </p>
            ) : null}
          </Card>
        ) : (
          <Card className="rounded-2xl border-dashed p-5">
            <p className="text-sm text-muted-foreground">
              You&apos;re planning as a collaborator. Only the wedding owner can invite new people.
            </p>
          </Card>
        )}

        <section>
          <div className="mb-2 flex items-center gap-2 px-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-serif text-lg text-foreground">People with access</h2>
          </div>
          <Card className="divide-y divide-border rounded-2xl p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">You</p>
                <p className="text-xs text-muted-foreground">{user?.email ?? "Signed in"}</p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {isOwner ? "Owner" : "Collaborator"}
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
            {collaborators.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No collaborators yet — invite someone to help plan.
              </p>
            ) : null}
          </Card>
        </section>
      </div>
    </div>
  );
}
