import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export const INVITE_WIDTH = 1080;

export interface InviteCardDimensions {
  width: number;
  height: number;
}

export function getCardDimensions(eventCount: number): InviteCardDimensions {
  // Sized for fixed readable type (couple ~72px, events 28/21) — height grows; fonts do not shrink.
  const baseHeight = 1160;
  const heightPerExtraEvent = 110;
  const extraEvents = Math.max(0, eventCount - 3);
  return {
    width: INVITE_WIDTH,
    height: baseHeight + extraEvents * heightPerExtraEvent,
  };
}

/** Ensure embedded images are decoded before rasterization. */
async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

async function waitForPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function rasterizeInviteCard(
  element: HTMLElement,
  dimensions: InviteCardDimensions,
): Promise<string> {
  await document.fonts.ready;
  await waitForImages(element);
  await waitForPaint();

  return await toPng(element, {
    width: dimensions.width,
    height: dimensions.height,
    pixelRatio: 2,
    quality: 1,
    cacheBust: true,
  });
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function shareInviteImage(
  dataUrl: string,
  coupleNames: string,
): Promise<void> {
  const file = dataUrlToFile(dataUrl, "shadiplan-invite.png");

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `${coupleNames} — Wedding invite`,
    });
    return;
  }

  downloadDataUrl(dataUrl, "shadiplan-invite.png");
  toast.message("Image saved — attach it to WhatsApp manually.");
}

export function downloadInvitePdf(
  dataUrl: string,
  filename: string,
  dimensions: InviteCardDimensions,
) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [dimensions.width, dimensions.height],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, dimensions.width, dimensions.height);
  pdf.save(filename);
}
