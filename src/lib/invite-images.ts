export const INVITE_IMAGES = [
  "/images/Wedding-amico.svg",
  "/images/Wedding-rafiki.svg",
  "/images/Wedding-cuate.svg",
  "/images/Beach wedding-cuate.svg",
  "/images/Honeymoon-pana.svg",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return hash;
}

/** Stable per seed (guest id, group id, or invite id) — same invite always gets the same image. */
export function pickInviteImage(seed?: string): string {
  const index = seed
    ? Math.abs(hashString(seed)) % INVITE_IMAGES.length
    : Math.floor(Math.random() * INVITE_IMAGES.length);
  return encodeURI(INVITE_IMAGES[index]);
}
