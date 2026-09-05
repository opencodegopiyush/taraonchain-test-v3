import { clsx } from "clsx";

/* Minimal 1.5px-stroke icon set — drawn for the instrument-panel aesthetic */

const PATHS: Record<string, React.ReactNode> = {
  "arrow-left": <path d="M15 4 L7 12 L15 20" />,
  "arrow-right": <path d="M9 4 L17 12 L9 20" />,
  close: <path d="M5 5 L19 19 M19 5 L5 19" />,
  report: (
    <>
      <path d="M6 2.5 H14.5 L19 7 V21.5 H6 Z" />
      <path d="M14.5 2.5 V7 H19" />
      <path d="M9 12 H16 M9 15.5 H16 M9 8.5 H11.5" />
    </>
  ),
  method: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M15.5 8.5 L13.4 13.4 L8.5 15.5 L10.6 10.6 Z" />
    </>
  ),
  cases: (
    <>
      <rect x="3.5" y="4.5" width="17" height="4" />
      <rect x="3.5" y="11" width="17" height="4" />
      <rect x="3.5" y="17.5" width="17" height="3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5 L19.5 5.5 V11 C19.5 16 16.5 19.7 12 21.5 C7.5 19.7 4.5 16 4.5 11 V5.5 Z" />
      <path d="M8.8 11.6 L11.2 14 L15.4 9.4" />
    </>
  ),
  play: <path d="M7 4.5 L18.5 12 L7 19.5 Z" />,
  pause: <path d="M7.5 5 V19 M16.5 5 V19" />,
  crosshair: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2.5 V6 M12 18 V21.5 M2.5 12 H6 M18 12 H21.5" />
    </>
  ),
  legend: (
    <>
      <circle cx="6" cy="7" r="2" />
      <path d="M8.5 7 H20.5" />
      <path d="M4 13 H20.5" strokeDasharray="2.6 2.2" />
      <path d="M8.5 19 H20.5" />
      <circle cx="6" cy="19" r="2" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="1" />
      <path d="M15.5 8.5 V4.5 A1 1 0 0 0 14.5 3.5 H4.5 A1 1 0 0 0 3.5 4.5 V14.5 A1 1 0 0 0 4.5 15.5 H8.5" />
    </>
  ),
  external: (
    <>
      <path d="M10 5 H4.5 V19.5 H19 V14" />
      <path d="M14 3.5 H20.5 V10 M20.5 3.5 L11.5 12.5" />
    </>
  ),
  chevron: <path d="M6 9.5 L12 15.5 L18 9.5" />,
  glyph: (
    <>
      <circle cx="5.5" cy="17" r="2.4" />
      <circle cx="12" cy="6" r="2.8" />
      <circle cx="18.5" cy="13.5" r="2" />
      <path d="M7.2 15.2 L10.6 8.2 M13.9 7.5 L16.9 11.9" />
    </>
  ),
  node: (
    <>
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="8.5" strokeDasharray="2.4 2.4" />
    </>
  ),
  check: <path d="M4.5 12.5 L9.5 17.5 L19.5 6.5" />,
  plus: (
    <>
      <path d="M12 5 V19" />
      <path d="M5 12 H19" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5 H19.5" />
      <path d="M8 6.5 V4.5 H16 V6.5" />
      <path d="M6 6.5 L7 20 H17 L18 6.5" />
      <path d="M10 10.5 V16 M14 10.5 V16" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 L22 20 H2 Z" />
      <path d="M12 9.5 V14 M12 16.8 V17.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 6.5 V12 L15.5 14.5" />
    </>
  ),
  link: (
    <>
      <path d="M9.5 14.5 L14.5 9.5" />
      <path d="M8 11 L5.8 13.2 A3.6 3.6 0 0 0 10.8 18.2 L13 16" />
      <path d="M16 13 L18.2 10.8 A3.6 3.6 0 0 0 13.2 5.8 L11 8" />
    </>
  ),
};

export function Icon({
  name,
  size = 16,
  className,
  strokeWidth = 1.5,
}: {
  name: keyof typeof PATHS | string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx("shrink-0", className)}
      aria-hidden
    >
      {PATHS[name] ?? null}
    </svg>
  );
}
