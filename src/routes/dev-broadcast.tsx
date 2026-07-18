import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { ScreenHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIsDevUser } from "@/lib/dev-access";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dev-broadcast")({
  head: () => ({
    meta: [{ title: "Broadcast — ShadiPlan" }],
  }),
  component: DevBroadcastPage,
});

async function sendBroadcast(title: string, body: string): Promise<{ sent: number }> {
  const { data, error } = await supabase.functions.invoke("broadcast-push", {
    body: { title, body },
  });
  if (error) throw error;
  const sent = typeof data?.sent === "number" ? data.sent : 0;
  return { sent };
}

function DevBroadcastPage() {
  const isDevUser = useIsDevUser();
  if (!isDevUser) {
    return <Navigate to="/" />;
  }
  return <BroadcastForm />;
}

function BroadcastForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !sending;

  const handlePrimaryClick = () => {
    if (!canSend) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    void handleSend();
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const { sent } = await sendBroadcast(title.trim(), body.trim());
      toast.success(`Sent to ${sent} device${sent === 1 ? "" : "s"}`);
      setTitle("");
      setBody("");
      setConfirming(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Broadcast failed");
      setConfirming(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <ScreenHeader eyebrow="Dev" title="Broadcast push">
        <p className="mt-1 text-sm text-muted-foreground">
          Send a push notification to every registered device. This cannot be undone.
        </p>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5 pb-8">
        <Card className="space-y-4 rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <p className="font-medium text-foreground">Message</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-title">Title</Label>
            <Input
              id="broadcast-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setConfirming(false);
              }}
              placeholder="ShadiPlan"
              maxLength={80}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-body">Body</Label>
            <Textarea
              id="broadcast-body"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setConfirming(false);
              }}
              placeholder="What should everyone see?"
              rows={4}
              maxLength={500}
            />
          </div>

          {confirming ? (
            <p className="text-sm text-[color:var(--destructive)]">
              Tap again to send to everyone. Edit the message to cancel.
            </p>
          ) : null}

          <Button className="w-full" disabled={!canSend} onClick={handlePrimaryClick}>
            {sending
              ? "Sending…"
              : confirming
                ? "Confirm — send to everyone"
                : "Send to everyone"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
