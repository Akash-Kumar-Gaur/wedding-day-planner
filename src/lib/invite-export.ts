import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export const INVITE_WIDTH = 1080;

export interface InviteCardDimensions {
  width: number;
  height: number;
}

export function getCardDimensions(eventCount: number): InviteCardDimensions {
  const baseHeight = 1080;
  const heightPerExtraEvent = 90;
  const extraEvents = Math.max(0, eventCount - 3);
  return {
    width: INVITE_WIDTH,
    height: baseHeight + extraEvents * heightPerExtraEvent,
  };
}

/** Clone off-screen so preview scale transforms don't shrink the capture. */
function cloneForExport(element: HTMLElement, dimensions: InviteCardDimensions): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = "fixed";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.transform = "none";
  clone.style.width = `${dimensions.width}px`;
  clone.style.height = `${dimensions.height}px`;
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  document.body.appendChild(clone);
  return clone;
}

export async function rasterizeInviteCard(
  element: HTMLElement,
  dimensions: InviteCardDimensions,
): Promise<string> {
  await document.fonts.ready;

  const clone = cloneForExport(element, dimensions);
  try {
    return await toPng(clone, {
      width: dimensions.width,
      height: dimensions.height,
      pixelRatio: 2,
      quality: 1,
      cacheBust: true,
    });
  } finally {
    document.body.removeChild(clone);
  }
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
