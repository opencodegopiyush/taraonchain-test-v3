"use client";

import { useMemo } from "react";

/* ── odometer — rolling digits ────────────────────────────────
   each digit is a window onto a vertical 0-9 strip that slides
   into place. used for the % REVIEWED readout in the command
   strip: progress should be felt, not just shown. */

export function Odometer({
  value,
  pad = 2,
  suffix,
  className,
  style,
}: {
  value: number;
  pad?: number;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const digits = useMemo(() => {
    const s = String(Math.max(0, Math.round(value)));
    return s.padStart(pad, "0").split("").map(Number);
  }, [value, pad]);

  return (
    <span className={`inline-flex items-baseline tabular-nums ${className ?? ""}`} style={style} aria-label={String(value)}>
      {digits.map((d, i) => (
        <span
          key={`${i}-${digits.length}`}
          className="inline-block overflow-hidden align-baseline"
          style={{ height: "1em" }}
        >
          <span
            className="flex flex-col transition-transform duration-700"
            style={{
              transform: `translateY(-${d}em)`,
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span key={n} className="flex h-[1em] items-center justify-center leading-none">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
      {suffix ? <span className="ml-1 leading-none">{suffix}</span> : null}
    </span>
  );
}
