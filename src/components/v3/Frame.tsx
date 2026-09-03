"use client";

import type { ReactNode } from "react";

/* ── frame — the v3 instrument shell ──────────────────────────
   every 3d/canvas surface in v3 lives inside a framed viewport
   with corner brackets, a header strip and an optional scanline
   sweep. the content wrapper carries a translateZ(0) transform,
   which turns it into the containing block for position:fixed
   descendants — that is how the untouched GraphCanvas
   (fixed inset-0) and InspectorPanel (fixed right) confine
   themselves to the frame instead of the whole window. */

export function Frame({
  label,
  meta,
  footer,
  scan = false,
  children,
  className = "",
  style,
  contentStyle,
}: {
  label?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  scan?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}) {
  return (
    <div
      className={`t3-frame relative flex min-h-0 min-w-0 flex-col border ${className}`}
      style={{
        borderColor: "var(--line-strong)",
        background: "rgba(8, 9, 9, 0.62)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        ...style,
      }}
    >
      {/* corner brackets */}
      <span aria-hidden className="pointer-events-none absolute -top-px -left-px h-3.5 w-3.5 border-t border-l" style={{ borderColor: "rgba(232,163,61,0.55)" }} />
      <span aria-hidden className="pointer-events-none absolute -top-px -right-px h-3.5 w-3.5 border-t border-r" style={{ borderColor: "rgba(232,163,61,0.55)" }} />
      <span aria-hidden className="pointer-events-none absolute -bottom-px -left-px h-3.5 w-3.5 border-b border-l" style={{ borderColor: "rgba(232,163,61,0.55)" }} />
      <span aria-hidden className="pointer-events-none absolute -bottom-px -right-px h-3.5 w-3.5 border-b border-r" style={{ borderColor: "rgba(232,163,61,0.55)" }} />

      {/* header strip */}
      {(label || meta) && (
        <div
          className="relative z-30 flex h-9 shrink-0 items-center justify-between gap-3 border-b px-3"
          style={{ borderColor: "var(--line)", background: "rgba(9, 11, 10, 0.85)" }}
        >
          <span className="label !text-[9px] truncate" style={{ color: "var(--ink-faint)" }}>
            {label}
          </span>
          <span className="flex shrink-0 items-center gap-3">{meta}</span>
        </div>
      )}

      {/* content — the fixed-descendant containing block */}
      <div className="t3-content relative min-h-0 flex-1 overflow-hidden" style={{ transform: "translateZ(0)", ...contentStyle }}>
        {children}
        {scan && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            <div
              className="t3-scan absolute inset-x-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(63,207,164,0.35) 30%, rgba(232,163,61,0.4) 70%, transparent)",
              }}
            />
          </div>
        )}
      </div>

      {footer && (
        <div className="relative z-30 shrink-0 border-t" style={{ borderColor: "var(--line)", background: "rgba(9, 11, 10, 0.85)" }}>
          {footer}
        </div>
      )}
    </div>
  );
}
