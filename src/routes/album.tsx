import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, Copy, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  albumGuestUrl,
  deletePhotoUpload,
  ensurePhotoAlbum,
  fetchAlbumUploads,
  getSignedPhotoUrl,
  groupByUploader,
  type PhotoUpload,
  type UploaderGroup,
} from "@/lib/photo-album-api";
import { downloadPhotosAsZip } from "@/lib/photo-zip";
import { useWeddingData } from "@/lib/wedding-data";
import { weddingQueryKeys } from "@/lib/wedding-query-keys";

export const Route = createFileRoute("/album")({
  head: () => ({
    meta: [
      { title: "Photo album — ShadiPlan" },
      { property: "og:title", content: "Photo album — ShadiPlan" },
    ],
  }),
  component: AlbumHostScreen,
});

function AlbumHostScreen() {
  const { wedding } = useWeddingData();
  const weddingId = wedding?.id;
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);

  const albumQuery = useQuery({
    queryKey: weddingQueryKeys.photoAlbum(weddingId ?? ""),
    queryFn: () => ensurePhotoAlbum(weddingId!),
    enabled: !!weddingId,
  });

  const uploadsQuery = useQuery({
    queryKey: weddingQueryKeys.photoUploads(albumQuery.data?.id ?? ""),
    queryFn: () => fetchAlbumUploads(albumQuery.data!.id),
    enabled: !!albumQuery.data?.id,
  });

  const groups = useMemo(
    () => groupByUploader(uploadsQuery.data ?? []),
    [uploadsQuery.data],
  );

  const openGroup = groups.find((g) => g.key === openGroupKey) ?? null;

  const deleteMutation = useMutation({
    mutationFn: (upload: PhotoUpload) => deletePhotoUpload(upload),
    onSuccess: () => {
      if (!albumQuery.data?.id) return;
      void queryClient.invalidateQueries({
        queryKey: weddingQueryKeys.photoUploads(albumQuery.data.id),
      });
    },
  });

  const guestUrl = albumQuery.data
    ? albumGuestUrl(albumQuery.data.accessToken)
    : "";

  const copyLink = async () => {
    if (!guestUrl) return;
    await navigator.clipboard.writeText(guestUrl);
    toast.success("Guest link copied");
  };

  const zipPhotos = async (uploads: PhotoUpload[], zipName: string) => {
    if (uploads.length === 0) return;
    setDownloading(true);
    try {
      const photos = await Promise.all(
        uploads.map(async (u) => ({
          storagePath: u.storagePath,
          url: await getSignedPhotoUrl(u.storagePath),
        })),
      );
      await downloadPhotosAsZip(photos, zipName);
      toast.success("Download started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    const slug =
      wedding?.coupleNames.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") ||
      "wedding";
    await zipPhotos(uploadsQuery.data ?? [], `${slug}-album`);
  };

  if (!wedding) return null;

  const uploadCount = uploadsQuery.data?.length ?? 0;

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Photo album">
        <p className="mt-1 text-sm text-muted-foreground">
          Guests scan the QR and upload — no app or login needed.
        </p>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5 pb-8">
        {!openGroup ? (
          <Card className="flex flex-col items-center gap-4 rounded-2xl p-6">
            {albumQuery.isPending ? (
              <p className="text-sm text-muted-foreground">Preparing album…</p>
            ) : albumQuery.data ? (
              <>
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={guestUrl} size={180} level="M" />
                </div>
                <p className="max-w-xs break-all text-center text-xs text-muted-foreground">
                  {guestUrl}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => void copyLink()}
                >
                  <Copy className="h-4 w-4" />
                  Copy guest link
                </Button>
              </>
            ) : (
              <p className="text-sm text-[color:var(--destructive)]">Could not create album.</p>
            )}
          </Card>
        ) : null}

        <section>
          {openGroup ? (
            <>
              <button
                type="button"
                onClick={() => setOpenGroupKey(null)}
                className="mb-3 inline-flex items-center gap-1 text-sm text-primary"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All guests
              </button>
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div>
                  <h2 className="font-serif text-lg text-foreground">{openGroup.label}</h2>
                  <p className="text-xs text-muted-foreground">
                    {openGroup.photoCount} photo{openGroup.photoCount === 1 ? "" : "s"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={downloading}
                  onClick={() =>
                    void zipPhotos(
                      openGroup.photos,
                      `${openGroup.label.replace(/[^\w\s-]/g, "").trim() || "guest"}-photos`,
                    )
                  }
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloading ? "Zipping…" : "Download"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {openGroup.photos.map((upload) => (
                  <HostPhotoCard
                    key={upload.id}
                    upload={upload}
                    onDelete={() => deleteMutation.mutate(upload)}
                    deleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <h2 className="font-serif text-lg text-foreground">
                  Guests ({groups.length}) · {uploadCount} photos
                </h2>
                {uploadCount > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={downloading}
                    onClick={() => void handleDownloadAll()}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloading ? "Zipping…" : "Download all"}
                  </Button>
                ) : null}
              </div>
              {uploadsQuery.isPending ? (
                <p className="text-sm text-muted-foreground">Loading photos…</p>
              ) : uploadCount === 0 ? (
                <Card className="rounded-2xl p-6 text-center">
                  <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No photos yet — share the QR at the wedding.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <UploaderGroupCard
                      key={group.key}
                      group={group}
                      onOpen={() => setOpenGroupKey(group.key)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function UploaderGroupCard({
  group,
  onOpen,
}: {
  group: UploaderGroup;
  onOpen: () => void;
}) {
  const previewPhotos = group.photos.slice(0, 4);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:bg-muted/30"
    >
      <div className="grid grid-cols-4 gap-0.5 bg-muted">
        {previewPhotos.map((photo) => (
          <GroupThumb key={photo.id} storagePath={photo.storagePath} />
        ))}
        {Array.from({ length: Math.max(0, 4 - previewPhotos.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square bg-muted" />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{group.label}</p>
          <p className="text-xs text-muted-foreground">
            {group.photoCount} photo{group.photoCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </button>
  );
}

function GroupThumb({ storagePath }: { storagePath: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getSignedPhotoUrl(storagePath)
      .then((signed) => {
        if (!cancelled) setUrl(signed);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  return (
    <div className="aspect-square bg-muted">
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null}
    </div>
  );
}

function HostPhotoCard({
  upload,
  onDelete,
  deleting,
}: {
  upload: PhotoUpload;
  onDelete: () => void;
  deleting: boolean;
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
          disabled={deleting}
          onClick={onDelete}
          className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-muted-foreground shadow hover:text-foreground"
          aria-label="Delete photo"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
