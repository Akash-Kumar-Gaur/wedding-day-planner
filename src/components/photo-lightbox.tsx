import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";
import { saveAs } from "file-saver";
import { getSignedPhotoUrl } from "@/lib/photo-album-api";
import { cn } from "@/lib/utils";

export type LightboxPhoto = {
  id: string;
  storagePath: string;
  /** Optional preloaded signed URL from the thumbnail. */
  url?: string | null;
};

type PhotoLightboxProps = {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

function fileNameFromPath(storagePath: string): string {
  const base = storagePath.split("/").pop() || "photo.jpg";
  return base.includes(".") ? base : `${base}.jpg`;
}

export function PhotoLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
}: PhotoLightboxProps) {
  const photo = photos[index];
  const [url, setUrl] = useState<string | null>(photo?.url ?? null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!photo) return;
    if (photo.url) {
      setUrl(photo.url);
      return;
    }

    let cancelled = false;
    setUrl(null);
    void getSignedPhotoUrl(photo.storagePath)
      .then((signed) => {
        if (!cancelled) setUrl(signed);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [photo?.id, photo?.storagePath, photo?.url]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (photos.length > 1) {
          onIndexChange((index - 1 + photos.length) % photos.length);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (photos.length > 1) {
          onIndexChange((index + 1) % photos.length);
        }
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [index, photos.length, onClose, onIndexChange]);

  if (!photo || typeof document === "undefined") return null;

  const canNavigate = photos.length > 1;

  const goPrev = () => {
    if (!canNavigate) return;
    onIndexChange((index - 1 + photos.length) % photos.length);
  };

  const goNext = () => {
    if (!canNavigate) return;
    onIndexChange((index + 1) % photos.length);
  };

  const handleDownload = async () => {
    if (!url || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Could not fetch photo");
      const blob = await response.blob();
      saveAs(blob, fileNameFromPath(photo.storagePath));
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void handleDownload();
        }}
        disabled={!url || downloading}
        className="absolute right-16 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/20 disabled:opacity-40"
        aria-label="Download photo"
      >
        <Download className="h-4 w-4" />
        {downloading ? "…" : "Download"}
      </button>

      {canNavigate ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-3 py-4 text-2xl leading-none text-white transition-colors hover:bg-white/20 sm:left-6"
          aria-label="Previous photo"
        >
          ‹
        </button>
      ) : null}

      {canNavigate ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-3 py-4 text-2xl leading-none text-white transition-colors hover:bg-white/20 sm:right-6"
          aria-label="Next photo"
        >
          ›
        </button>
      ) : null}

      <div
        className="flex max-h-[90vh] max-w-[90vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {url ? (
          <img
            src={url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
            draggable={false}
          />
        ) : (
          <div className="text-sm text-white/60">Loading…</div>
        )}
      </div>

      {canNavigate ? (
        <p
          className={cn(
            "pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2",
            "rounded-full bg-black/40 px-3 py-1 text-xs text-white/80",
          )}
        >
          {index + 1} / {photos.length}
        </p>
      ) : null}
    </div>,
    document.body,
  );
}
