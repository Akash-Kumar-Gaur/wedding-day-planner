import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Camera, Copy, Trash2 } from "lucide-react";
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
  type PhotoUpload,
} from "@/lib/photo-album-api";
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

  if (!wedding) return null;

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Photo album">
        <p className="mt-1 text-sm text-muted-foreground">
          Guests scan the QR and upload — no app or login needed.
        </p>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5 pb-8">
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
              <Button type="button" variant="outline" className="gap-2" onClick={() => void copyLink()}>
                <Copy className="h-4 w-4" />
                Copy guest link
              </Button>
            </>
          ) : (
            <p className="text-sm text-[color:var(--destructive)]">Could not create album.</p>
          )}
        </Card>

        <section>
          <h2 className="mb-2 px-1 font-serif text-lg text-foreground">
            Uploads ({uploadsQuery.data?.length ?? 0})
          </h2>
          {uploadsQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Loading photos…</p>
          ) : (uploadsQuery.data?.length ?? 0) === 0 ? (
            <Card className="rounded-2xl p-6 text-center">
              <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No photos yet — share the QR at the wedding.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {uploadsQuery.data!.map((upload) => (
                <HostPhotoCard
                  key={upload.id}
                  upload={upload}
                  onDelete={() => deleteMutation.mutate(upload)}
                  deleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </section>
      </div>
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
      {upload.uploaderName ? (
        <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">{upload.uploaderName}</p>
      ) : null}
    </div>
  );
}
