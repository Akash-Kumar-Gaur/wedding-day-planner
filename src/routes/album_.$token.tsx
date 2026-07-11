import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Camera, Check, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileFrame } from "@/components/mobile-frame";
import { fetchGuestAlbumInfo, uploadGuestPhoto } from "@/lib/photo-album-api";

/** Flat route (`album_`) so this is NOT nested under the host `/album` screen. */
export const Route = createFileRoute("/album_/$token")({
  head: () => ({
    meta: [
      { title: "Share a photo — ShadiPlan" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GuestAlbumUploadScreen,
});

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function GuestAlbumUploadScreen() {
  const { token } = Route.useParams();
  const formatOk = UUID_RE.test(token);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const albumQuery = useQuery({
    queryKey: ["guest-album", token],
    queryFn: () => fetchGuestAlbumInfo(token),
    enabled: formatOk,
    retry: false,
  });

  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (next: File | null) => {
    setFile(next);
    setDone(false);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
  };

  const resetForAnother = () => {
    setDone(false);
    setError(null);
    onFileChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file || !formatOk || !albumQuery.data) return;
    setUploading(true);
    setError(null);
    try {
      await uploadGuestPhoto({
        token,
        file,
        uploaderName: name.trim() || undefined,
      });
      setDone(true);
      onFileChange(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — please try again");
    } finally {
      setUploading(false);
    }
  };

  const invalidLink =
    !formatOk || albumQuery.isError || (albumQuery.isSuccess && albumQuery.data === null);

  return (
    <MobileFrame>
      <div className="flex min-h-screen flex-col bg-background px-5 pb-10 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)]">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">ShadiPlan</p>

        {albumQuery.isPending && formatOk ? (
          <p className="mt-8 text-sm text-muted-foreground">Opening album…</p>
        ) : invalidLink ? (
          <Card className="mt-8 rounded-2xl p-6 text-center">
            <h1 className="font-serif text-2xl text-foreground">This album link isn&apos;t valid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask the couple for a fresh QR code or link — this one may be mistyped or expired.
            </p>
          </Card>
        ) : done ? (
          <div className="mt-8 space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--success)]/15">
                <Check className="h-6 w-6 text-[color:var(--success)]" />
              </div>
              <h1 className="mt-4 font-serif text-2xl text-foreground">
                Thanks! Your photo has been added.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {albumQuery.data!.coupleNames} will see it in their wedding album.
              </p>
            </div>
            <Button className="w-full gap-2" variant="outline" onClick={resetForAnother}>
              <ImagePlus className="h-4 w-4" />
              Upload another photo
            </Button>
          </div>
        ) : (
          <div className="mt-2 space-y-5">
            <div>
              <h1 className="font-serif text-3xl leading-tight text-foreground">
                Share your photos from {albumQuery.data!.coupleNames}&apos;s wedding!
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                No account needed — just pick a photo and send it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-name">Your name (optional)</Label>
              <Input
                id="guest-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="So they know who sent it"
                autoComplete="name"
              />
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center transition-colors hover:bg-muted/40">
              {preview ? (
                <img src={preview} alt="" className="max-h-56 rounded-xl object-contain" />
              ) : (
                <>
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Take or choose a photo</span>
                  <span className="text-xs text-muted-foreground">JPEG, PNG, or HEIC · max 10MB</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
            </label>

            {error ? <p className="text-sm text-[color:var(--destructive)]">{error}</p> : null}

            <Button
              className="w-full"
              size="lg"
              disabled={!file || uploading}
              onClick={() => void handleUpload()}
            >
              {uploading ? "Uploading…" : "Upload photo"}
            </Button>
          </div>
        )}
      </div>
    </MobileFrame>
  );
}
