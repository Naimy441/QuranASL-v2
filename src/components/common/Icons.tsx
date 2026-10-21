// Small inline icon set (24px grid, stroke icons) so the app ships no icon font.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function I({ size = 18, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const PlayIcon = (p: P) => <I {...p}><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none" /></I>;
export const PauseIcon = (p: P) => <I {...p}><rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none" /><rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none" /></I>;
export const PrevIcon = (p: P) => <I {...p}><path d="M18 5v14L8 12z" fill="currentColor" stroke="none" /><path d="M6 5v14" strokeWidth={2.4} /></I>;
export const NextIcon = (p: P) => <I {...p}><path d="M6 5v14l10-7z" fill="currentColor" stroke="none" /><path d="M18 5v14" strokeWidth={2.4} /></I>;
export const RepeatIcon = (p: P) => <I {...p}><path d="M17 2l3 3-3 3" /><path d="M4 11V9a4 4 0 0 1 4-4h12" /><path d="M7 22l-3-3 3-3" /><path d="M20 13v2a4 4 0 0 1-4 4H4" /></I>;
export const ContinueIcon = (p: P) => <I {...p}><path d="M4 12h12" /><path d="M12 6l6 6-6 6" /><path d="M20 5v14" /></I>;
export const SunIcon = (p: P) => <I {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></I>;
export const MoonIcon = (p: P) => <I {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></I>;
export const MonitorIcon = (p: P) => <I {...p}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></I>;
export const ContrastIcon = (p: P) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" /></I>;
export const MotionIcon = (p: P) => <I {...p}><path d="M3 12h4l3-8 4 16 3-8h4" /></I>;
export const MenuIcon = (p: P) => <I {...p}><path d="M4 7h16M4 12h16M4 17h16" /></I>;
export const CloseIcon = (p: P) => <I {...p}><path d="M6 6l12 12M18 6L6 18" /></I>;
export const SearchIcon = (p: P) => <I {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></I>;
export const ArrowRightIcon = (p: P) => <I {...p}><path d="M5 12h14M13 6l6 6-6 6" /></I>;
export const ArrowLeftIcon = (p: P) => <I {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></I>;
export const BookIcon = (p: P) => <I {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16" /><path d="M9 7h7" /></I>;
export const HandIcon = (p: P) => <I {...p}><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11" /><path d="M11 10V4a1.5 1.5 0 0 1 3 0v6" /><path d="M14 10V5.5a1.5 1.5 0 0 1 3 0V12" /><path d="M17 9.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.2 15.6a1.6 1.6 0 0 1 2.4-2.1L8 15.5" /></I>;
export const CameraIcon = (p: P) => <I {...p}><path d="M15 10l5-3v10l-5-3z" /><rect x="3" y="6" width="12" height="12" rx="2.5" /></I>;
export const EditIcon = (p: P) => <I {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></I>;
export const InfoIcon = (p: P) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.01" /></I>;
export const CheckIcon = (p: P) => <I {...p}><path d="M5 12.5l4.5 4.5L19 7" /></I>;
export const ChevronDownIcon = (p: P) => <I {...p}><path d="M6 9l6 6 6-6" /></I>;
export const VideoIcon = (p: P) => <I {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" /></I>;
export const CubeIcon = (p: P) => <I {...p}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></I>;
export const SquareIcon = (p: P) => <I {...p}><rect x="4" y="4" width="16" height="16" rx="3" /></I>;
export const ExpandIcon = (p: P) => <I {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></I>;
export const ShrinkIcon = (p: P) => <I {...p}><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></I>;
export const SparkIcon = (p: P) => <I {...p}><path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z" /></I>;
export const UsersIcon = (p: P) => <I {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" /></I>;
export const LayersIcon = (p: P) => <I {...p}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></I>;
export const TextIcon = (p: P) => <I {...p}><path d="M4 6h16M4 12h10M4 18h13" /></I>;
export const FaceIcon = (p: P) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M9 10v.01M15 10v.01M8.5 15a4.5 4.5 0 0 0 7 0" /></I>;

/** The QuranASL emblem: charcoal open hand icon matching the browser tab icon. */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden className={className}>
      <defs>
        <linearGradient id="qasl-logo-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A3A3C" />
          <stop offset="1" stopColor="#161618" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#qasl-logo-bg)" />
      <g transform="translate(2.8 0.5)" fill="#fff" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.5 31 V19" strokeWidth="5.6" fill="none" />
        <path d="M28.7 29 V14" strokeWidth="5.8" fill="none" />
        <path d="M35 29 V15" strokeWidth="5.8" fill="none" />
        <path d="M41 31 V19.5" strokeWidth="5.4" fill="none" />
        <path d="M22 41 L14.5 34" strokeWidth="5.8" fill="none" />
        <path d="M19.8 29 H43.8 V40 C43.8 47 39 51.5 32 51.5 C25 51.5 19.8 47 19.8 40 Z" strokeWidth="0" />
      </g>
    </svg>
  );
}
