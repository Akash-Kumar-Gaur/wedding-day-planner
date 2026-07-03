import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export const INVITE_WIDTH = 1080;
export const INVITE_HEIGHT = 1350;

export async function rasterizeInviteCard(element: HTMLElement): Promise<string> {
  await document.fonts.ready;
  return toPng(element, {
    width: INVITE_WIDTH,
    height: INVITE_HEIGHT,
    canvasWidth: INVITE_WIDTH,
    canvasHeight: INVITE_HEIGHT,
    pixelRatio: 2,
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

export function downloadInvitePdf(dataUrl: string, filename: string) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [INVITE_WIDTH, INVITE_HEIGHT],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, INVITE_WIDTH, INVITE_HEIGHT);
  pdf.save(filename);
}
