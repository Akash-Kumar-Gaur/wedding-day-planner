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
  checkStillExists,
  deleteGuestPhoto,
  fetchGuestAlbumInfo,
  getOrCreateSessionId,
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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(
    null,
  );
  const [doneCount, setDoneCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [myUploads, setMyUploads] = useState<GuestMyUpload[]>([]);
  /** Host-deleted photos: show once, then drop from localStorage. */
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!formatOk) return;
    setMyUploads(loadMyUploads(token));
    setRemovedIds(new Set());
    setConfirmDeleteId(null);
    getOrCreateSessionId(token);
  }, [token, formatOk]);

  const mineFingerprint = myUploads
    .map((u) => u.id)
    .sort()
    .join(",");

  useEffect(() => {
    if (!formatOk || tab !== "mine") return;
    const local = loadMyUploads(token);
    if (local.length === 0) return;

    let cancelled = false;

    void (async () => {
      const gone: string[] = [];
      await Promise.all(
        local.map(async (upload) => {
          try {
            const exists = await checkStillExists({
              uploadId: upload.id,
              deleteToken: upload.deleteToken,
            });
            if (!exists) gone.push(upload.id);
          } catch {
            /* keep showing until we know it's gone */
          }
        }),
      );
      if (cancelled || gone.length === 0) return;

      for (const id of gone) {
        removeMyUpload(token, id);
      }
      setMyUploads(loadMyUploads(token));
      setRemovedIds((prev) => {
        const next = new Set(prev);
        for (const id of gone) next.add(id);
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [token, formatOk, tab, mineFingerprint]);

  useEffect(() => {
    return () => {
      for (const url of previews) URL.revokeObjectURL(url);
    };
  }, [previews]);

  const clearSelection = () => {
    for (const url of previews) URL.revokeObjectURL(url);
    setFiles([]);
    setPreviews([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onFilesSelected = (list: FileList | null) => {
    const next = list ? Array.from(list).filter((f) => f.type.startsWith("image/")) : [];
    for (const url of previews) URL.revokeObjectURL(url);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
    setDoneCount(0);
    setError(null);
    setUploadProgress(null);
  };

  const resetForAnother = () => {
    setDoneCount(0);
    setUploadProgress(null);
    clearSelection();
  };

  const handleUpload = async () => {
    if (files.length === 0 || !formatOk || !albumQuery.data) return;
    setUploading(true);
    setError(null);
    const sessionId = getOrCreateSessionId(token);
    const total = files.length;
    let completed = 0;
    let failed = 0;
    setUploadProgress({ completed: 0, total });

    try {
      for (const file of files) {
        try {
          const result = await uploadGuestPhoto({
            token,
            file,
            uploaderName: name.trim() || undefined,
            sessionId,
          });
          setMyUploads(
            saveMyUpload(token, {
              id: result.id,
              deleteToken: result.deleteToken,
              storagePath: result.storagePath,
            }),
          );
          completed++;
        } catch {
          failed++;
        }
        setUploadProgress({ completed: completed + failed, total });
      }

      if (completed === 0) {
        setError("Upload failed — please try again");
        return;
      }

      setDoneCount(completed);
      clearSelection();
      if (failed > 0) {
        toast.error(`${failed} of ${total} photos failed to upload`);
      }
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteMine = async (upload: GuestMyUpload) => {
    setDeletingId(upload.id);
    try {
      const ok = await deleteGuestPhoto({
        uploadId: upload.id,
        deleteToken: upload.deleteToken,
      });
      if (!ok) {
        toast.error("Could not delete — it may already be gone");
        setMyUploads(removeMyUpload(token, upload.id));
        setRemovedIds((prev) => new Set(prev).add(upload.id));
        setConfirmDeleteId(null);
        return;
      }
      setMyUploads(removeMyUpload(token, upload.id));
      setConfirmDeleteId(null);
      toast.success("Photo deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete photo");
    } finally {
      setDeletingId(null);
    }
  };

  const dismissRemoved = (uploadId: string) => {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(uploadId);
      return next;
    });
  };

  const mineListEmpty = myUploads.length === 0 && removedIds.size === 0;

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

  const showDone = doneCount > 0 && files.length === 0 && !uploading;

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
              showDone ? (
                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl border border-border bg-card p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--success)]/15">
                      <Check className="h-6 w-6 text-[color:var(--success)]" />
                    </div>
                    <h1 className="mt-4 font-serif text-2xl text-foreground">
                      {doneCount === 1
                        ? "Thanks! Your photo has been added."
                        : `Thanks! ${doneCount} photos have been added.`}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {albumQuery.data!.coupleNames} will see them in their wedding album.
                    </p>
                  </div>
                  <Button className="w-full gap-2" variant="outline" onClick={resetForAnother}>
                    <ImagePlus className="h-4 w-4" />
                    Upload more photos
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
                      No account needed — pick one photo or several at once.
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
                      disabled={uploading}
                    />
                  </div>

                  <label
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center transition-colors hover:bg-muted/40",
                      uploading && "pointer-events-none opacity-60",
                    )}
                  >
                    {previews.length > 0 ? (
                      <div className="grid w-full grid-cols-3 gap-2">
                        {previews.slice(0, 6).map((src) => (
                          <img
                            key={src}
                            src={src}
                            alt=""
                            className="aspect-square rounded-lg object-cover"
                          />
                        ))}
                        {previews.length > 6 ? (
                          <div className="flex aspect-square items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                            +{previews.length - 6}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <Camera className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          Take or choose photos
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Select multiple · JPEG, PNG, or HEIC · max 10MB each
                        </span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      disabled={uploading}
                      onChange={(e) => onFilesSelected(e.target.files)}
                    />
                  </label>

                  {files.length > 0 && !uploading ? (
                    <p className="text-center text-xs text-muted-foreground">
                      {files.length} photo{files.length === 1 ? "" : "s"} selected
                    </p>
                  ) : null}

                  {uploadProgress ? (
                    <div className="space-y-2 rounded-2xl border border-border bg-card p-4 text-center">
                      <p className="text-sm font-medium text-foreground">
                        Uploading {Math.min(uploadProgress.completed + 1, uploadProgress.total)} of{" "}
                        {uploadProgress.total}…
                      </p>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.round(
                              (uploadProgress.completed / uploadProgress.total) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {error ? (
                    <p className="text-sm text-[color:var(--destructive)]">{error}</p>
                  ) : null}

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={files.length === 0 || uploading}
                    onClick={() => void handleUpload()}
                  >
                    {uploading
                      ? uploadProgress
                        ? `Uploading ${uploadProgress.completed} of ${uploadProgress.total}…`
                        : "Uploading…"
                      : files.length > 1
                        ? `Upload ${files.length} photos`
                        : "Upload photo"}
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

                {mineListEmpty ? (
                  <Card className="rounded-2xl p-6 text-center">
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      No photos from this device yet. Upload one from the Upload tab.
                    </p>
                  </Card>
                ) : (
                  <>
                    {myUploads.length > 0 ? (
                      <Button
                        className="w-full gap-2"
                        variant="outline"
                        disabled={downloading}
                        onClick={() => void handleDownloadMine()}
                      >
                        <Download className="h-4 w-4" />
                        {downloading ? "Preparing zip…" : "Download all my photos"}
                      </Button>
                    ) : null}
                    <div className="grid grid-cols-2 gap-3">
                      {[...removedIds].map((id) => (
                        <RemovedPhotoCard key={`removed-${id}`} onDismiss={() => dismissRemoved(id)} />
                      ))}
                      {myUploads.map((upload) => (
                        <GuestMyPhotoCard
                          key={upload.id}
                          upload={upload}
                          confirming={confirmDeleteId === upload.id}
                          deleting={deletingId === upload.id}
                          onRequestDelete={() => setConfirmDeleteId(upload.id)}
                          onCancelDelete={() => setConfirmDeleteId(null)}
                          onConfirmDelete={() => void handleDeleteMine(upload)}
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

function RemovedPhotoCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/60">
      <div className="relative flex aspect-square flex-col items-center justify-center gap-2 px-3 text-center">
        <p className="text-xs font-medium text-muted-foreground">This photo was removed</p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function GuestMyPhotoCard({
  upload,
  confirming,
  deleting,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  upload: GuestMyUpload;
  confirming: boolean;
  deleting: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
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
        {!confirming ? (
          <button
            type="button"
            onClick={onRequestDelete}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-muted-foreground shadow hover:text-[color:var(--destructive)]"
            aria-label="Delete my photo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        {confirming ? (
          <div className="absolute inset-x-0 bottom-0 space-y-2 bg-background/95 p-2.5 backdrop-blur-sm">
            <p className="text-center text-[11px] font-medium text-foreground">Delete this photo?</p>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 flex-1 px-2 text-xs"
                disabled={deleting}
                onClick={onCancelDelete}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-8 flex-1 px-2 text-xs"
                disabled={deleting}
                onClick={onConfirmDelete}
              >
                {deleting ? "…" : "Delete"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
