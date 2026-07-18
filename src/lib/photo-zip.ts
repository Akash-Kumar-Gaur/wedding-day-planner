import JSZip from "jszip";
import { saveAs } from "file-saver";

export type ZipPhoto = {
  storagePath: string;
  url: string;
  fileName?: string;
};

function fileNameFromPath(storagePath: string, index: number): string {
  const base = storagePath.split("/").pop() || `photo-${index + 1}.jpg`;
  return base.includes(".") ? base : `${base}.jpg`;
}

/** Client-side zip of signed/public photo URLs (guest + host web). */
export async function downloadPhotosAsZip(
  photos: ZipPhoto[],
  zipName: string,
): Promise<void> {
  if (photos.length === 0) throw new Error("No photos to download");

  const zip = new JSZip();
  await Promise.all(
    photos.map(async (photo, i) => {
      const response = await fetch(photo.url);
      if (!response.ok) {
        throw new Error(`Could not fetch photo ${i + 1}`);
      }
      const blob = await response.blob();
      zip.file(photo.fileName ?? fileNameFromPath(photo.storagePath, i), blob);
    }),
  );

  const content = await zip.generateAsync({ type: "blob" });
  const name = zipName.endsWith(".zip") ? zipName : `${zipName}.zip`;
  saveAs(content, name);
}
