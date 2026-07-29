import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function RingsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="8" cy="15" r="4.2" />
      <circle cx="16" cy="15" r="4.2" />
    </svg>
  );
}
export function LeafIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M12 3c3 4 5 6.6 5 9.5A5 5 0 0 1 7 12.5C7 9.6 9 7 12 3Z" />
    </svg>
  );
}
export function MandapIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M4 20V11l8-6 8 6v9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}
export function SparkleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M12 3v3M12 18v3M4.2 12H3M21 12h-1.2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
      <circle cx="12" cy="12" r="3.4" />
    </svg>
  );
}
export function VendorsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M4 7h16v11H4z" />
      <path d="M4 10h16" />
    </svg>
  );
}
export function GuestsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M14.8 19c.2-2.6 2-4.4 4.4-4.4" />
    </svg>
  );
}
export function TimelineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
export function BudgetIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
      <path d="M3.5 10h17" />
    </svg>
  );
}
export function SuggestionsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M4 5h16v13l-4-3H4z" />
    </svg>
  );
}
export function InvitesIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="4" y="4.5" width="16" height="15" rx="1.4" />
      <path d="M4 6l8 6 8-6" />
    </svg>
  );
}
export function PhotoAlbumIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <path d="M15 15h5M15 19h5M19 15v5" />
    </svg>
  );
}
export function PhoneDownloadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M12 8v6M9.5 11.5 12 14l2.5-2.5" />
      <path d="M10 19h4" />
    </svg>
  );
}

export type IconKey =
  | "rings"
  | "leaf"
  | "mandap"
  | "sparkle"
  | "vendors"
  | "guests"
  | "timeline"
  | "budget"
  | "suggestions"
  | "invites"
  | "photoAlbum"
  | "phoneDownload";

export const iconMap: Record<IconKey, ComponentType<IconProps>> = {
  rings: RingsIcon,
  leaf: LeafIcon,
  mandap: MandapIcon,
  sparkle: SparkleIcon,
  vendors: VendorsIcon,
  guests: GuestsIcon,
  timeline: TimelineIcon,
  budget: BudgetIcon,
  suggestions: SuggestionsIcon,
  invites: InvitesIcon,
  photoAlbum: PhotoAlbumIcon,
  phoneDownload: PhoneDownloadIcon,
};
