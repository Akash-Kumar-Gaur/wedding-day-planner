import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { Camera, Check, Download, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileFrame } from "@/components/mobile-frame";
import {
  deleteGuestPhoto,
  fetchGuestAlbumInfo,
  getSignedPhotoUrl,
  loadMyUploads,
  removeMyUpload,
  saveMyUpload,
  uploadGuestPhoto,
  type GuestMyUpload,
} from "@/lib/photo-album-api";
import { downloadPhotosAsZip } from "@/lib/photo-zip";
import { cn } from "@/lib/utils";

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

type Tab = "upload" | "mine";

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

  const [tab, setTab] = useState<Tab>("upload");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myUploads, setMyUploads] = useState<GuestMyUpload[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!formatOk) return;
    setMyUploads(loadMyUploads(token));
  }, [token, formatOk]);

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
      const result = await uploadGuestPhoto({
        token,
        file,
        uploaderName: name.trim() || undefined,
      });
      setMyUploads(
        saveMyUpload(token, {
          id: result.id,
          deleteToken: result.deleteToken,
          storagePath: result.storagePath,
        }),
      );
      setDone(true);
      onFileChange(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — please try again");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMine = async (upload: GuestMyUpload) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      const ok = await deleteGuestPhoto({
        uploadId: upload.id,
        deleteToken: upload.deleteToken,
      });
      if (!ok) {
        toast.error("Could not delete — it may already be gone");
      }
      setMyUploads(removeMyUpload(token, upload.id));
      toast.success("Photo deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete photo");
    }
  };

  const handleDownloadMine = async () => {
    if (myUploads.length === 0) return;
    setDownloading(true);
    try {
      const photos = await Promise.all(
        myUploads.map(async (u) => ({
          storagePath: u.storagePath,
          url: await getSignedPhotoUrl(u.storagePath),
        })),
      );
      await downloadPhotosAsZip(photos, "my-wedding-photos");
      toast.success("Download started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
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
        ) : (
          <>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setTab("upload")}
                className={cn(
                  "flex-1 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                  tab === "upload"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setTab("mine")}
                className={cn(
                  "flex-1 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                  tab === "mine"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                My Photos{myUploads.length > 0 ? ` (${myUploads.length})` : ""}
              </button>
            </div>

            {tab === "upload" ? (
              done ? (
                <div className="mt-6 space-y-5">
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
                  <Button className="w-full gap-2" variant="ghost" onClick={() => setTab("mine")}>
                    View my photos
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-5">
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
                        <span className="text-sm font-medium text-foreground">
                          Take or choose a photo
                        </span>
                        <span className="text-xs text-muted-foreground">
                          JPEG, PNG, or HEIC · max 10MB
                        </span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                    />
                  </label>

                  {error ? (
                    <p className="text-sm text-[color:var(--destructive)]">{error}</p>
                  ) : null}

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!file || uploading}
                    onClick={() => void handleUpload()}
                  >
                    {uploading ? "Uploading…" : "Upload photo"}
                  </Button>
                </div>
              )
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <h1 className="font-serif text-2xl text-foreground">My Photos</h1>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Photos you uploaded from this device/browser. This list only works on the
                    device you uploaded from — clearing browser data or switching devices hides
                    it here (the couple still has your photos in their album).
                  </p>
                </div>

                {myUploads.length === 0 ? (
                  <Card className="rounded-2xl p-6 text-center">
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      No photos from this device yet. Upload one from the Upload tab.
                    </p>
                  </Card>
                ) : (
                  <>
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      disabled={downloading}
                      onClick={() => void handleDownloadMine()}
                    >
                      <Download className="h-4 w-4" />
                      {downloading ? "Preparing zip…" : "Download all my photos"}
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      {myUploads.map((upload) => (
                        <GuestMyPhotoCard
                          key={upload.id}
                          upload={upload}
                          onDelete={() => void handleDeleteMine(upload)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </MobileFrame>
  );
}

function GuestMyPhotoCard({
  upload,
  onDelete,
}: {
  upload: GuestMyUpload;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getSignedPhotoUrl(upload.storagePath)
      .then((signed) => {
        if (!cancelled) setUrl(signed);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [upload.storagePath]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-square bg-muted">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            …
          </div>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-muted-foreground shadow hover:text-[color:var(--destructive)]"
          aria-label="Delete my photo"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
