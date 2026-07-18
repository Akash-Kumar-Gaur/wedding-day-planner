import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  Copy,
  Download,
  FolderPlus,
  MoveRight,
  QrCode,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/app-shell";
import { PhotoLightbox, type LightboxPhoto } from "@/components/photo-lightbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  albumGuestUrl,
  copyPhotos,
  createPhotoAlbum,
  deletePhotoUpload,
  fetchAlbumUploads,
  fetchWeddingAlbums,
  getSignedPhotoUrl,
  groupByUploader,
  movePhotos,
  type PhotoAlbum,
  type PhotoUpload,
  type UploaderGroup,
} from "@/lib/photo-album-api";
import { downloadPhotosAsZip } from "@/lib/photo-zip";
import { useWeddingData } from "@/lib/wedding-data";
import { weddingQueryKeys } from "@/lib/wedding-query-keys";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/album")({
  head: () => ({
    meta: [
      { title: "Photo album — ShadiPlan" },
      { property: "og:title", content: "Photo album — ShadiPlan" },
    ],
  }),
  component: AlbumHostScreen,
});

type TransferMode = "move" | "copy";

function AlbumHostScreen() {
  const { wedding } = useWeddingData();
  const weddingId = wedding?.id;
  const queryClient = useQueryClient();

  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newAlbumOpen, setNewAlbumOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [shareAlbum, setShareAlbum] = useState<PhotoAlbum | null>(null);
  const [transferMode, setTransferMode] = useState<TransferMode | null>(null);

  const albumsQuery = useQuery({
    queryKey: weddingQueryKeys.photoAlbums(weddingId ?? ""),
    queryFn: () => fetchWeddingAlbums(weddingId!),
    enabled: !!weddingId,
  });

  const albums = albumsQuery.data ?? [];
  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId) ?? null;

  const uploadsQuery = useQuery({
    queryKey: weddingQueryKeys.photoUploads(selectedAlbum?.id ?? ""),
    queryFn: () => fetchAlbumUploads(selectedAlbum!.id),
    enabled: !!selectedAlbum?.id,
  });

  const groups = useMemo(
    () => groupByUploader(uploadsQuery.data ?? []),
    [uploadsQuery.data],
  );
  const openGroup = groups.find((g) => g.key === openGroupKey) ?? null;

  const lightboxPhotos: LightboxPhoto[] = useMemo(
    () =>
      (openGroup?.photos ?? []).map((p) => ({
        id: p.id,
        storagePath: p.storagePath,
      })),
    [openGroup],
  );

  const otherAlbums = albums.filter((a) => a.id !== selectedAlbum?.id);

  const invalidateAlbums = () => {
    if (!weddingId) return;
    void queryClient.invalidateQueries({
      queryKey: weddingQueryKeys.photoAlbums(weddingId),
    });
  };

  const invalidateUploads = () => {
    if (!selectedAlbum?.id) return;
    void queryClient.invalidateQueries({
      queryKey: weddingQueryKeys.photoUploads(selectedAlbum.id),
    });
    invalidateAlbums();
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => createPhotoAlbum(weddingId!, name),
    onSuccess: (album) => {
      invalidateAlbums();
      setNewAlbumOpen(false);
      setNewAlbumName("");
      toast.success(`Created “${album.name}”`);
      setSelectedAlbumId(album.id);
      setOpenGroupKey(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not create album");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (upload: PhotoUpload) => deletePhotoUpload(upload),
    onSuccess: () => invalidateUploads(),
  });

  const transferMutation = useMutation({
    mutationFn: async ({
      mode,
      photos,
      destAlbumId,
    }: {
      mode: TransferMode;
      photos: PhotoUpload[];
      destAlbumId: string;
    }) => {
      if (mode === "move") await movePhotos(photos, destAlbumId);
      else await copyPhotos(photos, destAlbumId);
    },
    onSuccess: (_data, vars) => {
      invalidateUploads();
      if (vars.mode === "move") {
        void queryClient.invalidateQueries({
          queryKey: weddingQueryKeys.photoUploads(vars.destAlbumId),
        });
      } else {
        void queryClient.invalidateQueries({
          queryKey: weddingQueryKeys.photoUploads(vars.destAlbumId),
        });
      }
      setTransferMode(null);
      setSelectedIds(new Set());
      setSelectMode(false);
      toast.success(
        vars.mode === "move"
          ? `Moved ${vars.photos.length} photo${vars.photos.length === 1 ? "" : "s"}`
          : `Copied ${vars.photos.length} photo${vars.photos.length === 1 ? "" : "s"}`,
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Transfer failed");
    },
  });

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

  const exitAlbum = () => {
    setSelectedAlbumId(null);
    setOpenGroupKey(null);
    setLightboxIndex(null);
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const exitGroup = () => {
    setOpenGroupKey(null);
    setLightboxIndex(null);
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedPhotos = (openGroup?.photos ?? []).filter((p) => selectedIds.has(p.id));

  const copyLink = async (album: PhotoAlbum) => {
    const url = albumGuestUrl(album.accessToken);
    await navigator.clipboard.writeText(url);
    toast.success("Guest link copied");
  };

  if (!wedding) return null;

  const uploadCount = uploadsQuery.data?.length ?? 0;

  return (
    <div>
      <ScreenHeader eyebrow="ShadiPlan" title="Photo album">
        <p className="mt-1 text-sm text-muted-foreground">
          Create albums for each event — each gets its own guest QR.
        </p>
      </ScreenHeader>

      <div className="space-y-5 px-5 pt-5 pb-8">
        {!selectedAlbum ? (
          <AlbumListView
            albums={albums}
            loading={albumsQuery.isPending}
            error={albumsQuery.isError}
            onOpen={(album) => {
              setSelectedAlbumId(album.id);
              setOpenGroupKey(null);
            }}
            onShare={(album) => setShareAlbum(album)}
            onNew={() => {
              setNewAlbumName("");
              setNewAlbumOpen(true);
            }}
          />
        ) : (
          <>
            <button
              type="button"
              onClick={exitAlbum}
              className="inline-flex items-center gap-1 text-sm text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All albums
            </button>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl text-foreground">{selectedAlbum.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {uploadCount} photo{uploadCount === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setShareAlbum(selectedAlbum)}
              >
                <QrCode className="h-3.5 w-3.5" />
                Share QR
              </Button>
            </div>

            {openGroup ? (
              <>
                <button
                  type="button"
                  onClick={exitGroup}
                  className="inline-flex items-center gap-1 text-sm text-primary"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  All guests
                </button>
                <div className="flex items-center justify-between gap-3 px-1">
                  <div>
                    <h3 className="font-serif text-lg text-foreground">{openGroup.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {openGroup.photoCount} photo{openGroup.photoCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={selectMode ? "default" : "outline"}
                      onClick={() => {
                        setSelectMode((v) => !v);
                        setSelectedIds(new Set());
                        setLightboxIndex(null);
                      }}
                    >
                      {selectMode ? "Done" : "Select"}
                    </Button>
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
                </div>

                {selectMode && selectedIds.size > 0 ? (
                  <SelectionToolbar
                    count={selectedIds.size}
                    canTransfer={otherAlbums.length > 0}
                    busy={transferMutation.isPending}
                    onMove={() => setTransferMode("move")}
                    onCopy={() => setTransferMode("copy")}
                    onClear={() => setSelectedIds(new Set())}
                  />
                ) : null}

                {selectMode && selectedIds.size > 0 && otherAlbums.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Create another album to move or copy photos between albums.
                  </p>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  {openGroup.photos.map((upload, i) => (
                    <HostPhotoCard
                      key={upload.id}
                      upload={upload}
                      selectMode={selectMode}
                      selected={selectedIds.has(upload.id)}
                      onToggleSelect={() => toggleSelected(upload.id)}
                      onOpen={() => setLightboxIndex(i)}
                      onDelete={() => deleteMutation.mutate(upload)}
                      deleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <h3 className="font-serif text-lg text-foreground">
                    Guests ({groups.length}) · {uploadCount} photos
                  </h3>
                  {uploadCount > 0 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={downloading}
                      onClick={() => {
                        const slug =
                          selectedAlbum.name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") ||
                          "album";
                        void zipPhotos(uploadsQuery.data ?? [], slug);
                      }}
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
                      No photos yet — share this album&apos;s QR at the event.
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
          </>
        )}
      </div>

      {lightboxIndex != null && lightboxPhotos.length > 0 && !selectMode ? (
        <PhotoLightbox
          photos={lightboxPhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}

      <Dialog open={newAlbumOpen} onOpenChange={setNewAlbumOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New album</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="album-name">Name</Label>
            <Input
              id="album-name"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="e.g. Haldi, Reception…"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newAlbumName.trim()) {
                  createMutation.mutate(newAlbumName);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewAlbumOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!newAlbumName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate(newAlbumName)}
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareQrDialog
        album={shareAlbum}
        onClose={() => setShareAlbum(null)}
        onCopyLink={() => {
          if (shareAlbum) void copyLink(shareAlbum);
        }}
      />

      <AlbumPickerDialog
        open={transferMode != null}
        mode={transferMode}
        albums={otherAlbums}
        busy={transferMutation.isPending}
        onClose={() => setTransferMode(null)}
        onPick={(dest) => {
          if (!transferMode || selectedPhotos.length === 0) return;
          transferMutation.mutate({
            mode: transferMode,
            photos: selectedPhotos,
            destAlbumId: dest.id,
          });
        }}
      />
    </div>
  );
}

function AlbumListView({
  albums,
  loading,
  error,
  onOpen,
  onShare,
  onNew,
}: {
  albums: PhotoAlbum[];
  loading: boolean;
  error: boolean;
  onOpen: (album: PhotoAlbum) => void;
  onShare: (album: PhotoAlbum) => void;
  onNew: () => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="font-serif text-lg text-foreground">
          Albums ({albums.length})
        </h2>
        <Button type="button" size="sm" className="gap-1.5" onClick={onNew}>
          <FolderPlus className="h-3.5 w-3.5" />
          New album
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading albums…</p>
      ) : error ? (
        <p className="text-sm text-[color:var(--destructive)]">Could not load albums.</p>
      ) : (
        <div className="space-y-3">
          {albums.map((album) => (
            <Card key={album.id} className="overflow-hidden rounded-2xl p-0">
              <button
                type="button"
                onClick={() => onOpen(album)}
                className="w-full px-4 py-3.5 text-left transition-colors hover:bg-muted/30"
              >
                <p className="text-sm font-medium text-foreground">{album.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {album.photoCount} photo{album.photoCount === 1 ? "" : "s"}
                </p>
              </button>
              <div className="flex border-t border-border">
                <button
                  type="button"
                  onClick={() => onShare(album)}
                  className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-muted/40"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Share QR
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function SelectionToolbar({
  count,
  canTransfer,
  busy,
  onMove,
  onCopy,
  onClear,
}: {
  count: number;
  canTransfer: boolean;
  busy: boolean;
  onMove: () => void;
  onCopy: () => void;
  onClear: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2.5 shadow-sm">
      <span className="px-1 text-xs font-medium text-muted-foreground">
        {count} selected
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={!canTransfer || busy}
        onClick={onMove}
      >
        <MoveRight className="h-3.5 w-3.5" />
        Move to…
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={!canTransfer || busy}
        onClick={onCopy}
      >
        <Copy className="h-3.5 w-3.5" />
        Copy to…
      </Button>
      <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}

function ShareQrDialog({
  album,
  onClose,
  onCopyLink,
}: {
  album: PhotoAlbum | null;
  onClose: () => void;
  onCopyLink: () => void;
}) {
  const url = album ? albumGuestUrl(album.accessToken) : "";
  return (
    <Dialog open={!!album} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{album?.name ?? "Share album"}</DialogTitle>
        </DialogHeader>
        {album ? (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={url} size={180} level="M" />
            </div>
            <p className="max-w-xs break-all text-center text-xs text-muted-foreground">{url}</p>
            <Button type="button" variant="outline" className="gap-2" onClick={onCopyLink}>
              <Copy className="h-4 w-4" />
              Copy guest link
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AlbumPickerDialog({
  open,
  mode,
  albums,
  busy,
  onClose,
  onPick,
}: {
  open: boolean;
  mode: TransferMode | null;
  albums: PhotoAlbum[];
  busy: boolean;
  onClose: () => void;
  onPick: (album: PhotoAlbum) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "copy" ? "Copy to album" : "Move to album"}</DialogTitle>
        </DialogHeader>
        {mode === "copy" ? (
          <p className="text-xs text-muted-foreground">
            Copies share the same file. Deleting from one album won&apos;t remove it from the other
            until the last reference is gone.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Photos will leave this album and appear in the destination.
          </p>
        )}
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {albums.map((album) => (
            <button
              key={album.id}
              type="button"
              disabled={busy}
              onClick={() => onPick(album)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 disabled:opacity-50"
            >
              <span className="font-medium text-foreground">{album.name}</span>
              <span className="text-xs text-muted-foreground">
                {album.photoCount} photo{album.photoCount === 1 ? "" : "s"}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
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
  selectMode,
  selected,
  onToggleSelect,
  onOpen,
  onDelete,
  deleting,
}: {
  upload: PhotoUpload;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
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
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border",
      )}
    >
      <div className="relative aspect-square bg-muted">
        {url ? (
          <button
            type="button"
            onClick={selectMode ? onToggleSelect : onOpen}
            className={cn("h-full w-full", selectMode ? "cursor-pointer" : "cursor-zoom-in")}
            aria-label={selectMode ? (selected ? "Deselect photo" : "Select photo") : "View photo full size"}
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            …
          </div>
        )}

        {selectMode ? (
          <div
            className={cn(
              "pointer-events-none absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white bg-black/30 text-transparent",
            )}
          >
            <Check className="h-3.5 w-3.5" />
          </div>
        ) : (
          <button
            type="button"
            disabled={deleting}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-muted-foreground shadow hover:text-foreground"
            aria-label="Delete photo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
