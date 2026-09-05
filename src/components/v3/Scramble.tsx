"use client";

import { useEffect, useRef, useState } from "react";

/* ── scramble — the decode effect ─────────────────────────────
   text resolves out of noise, left to right. used on the v3
   hero and on chapter kickers: the instrument is "decrypting"
   the story as you read it. pure ascii glyphs, mono font. */

const GLYPHS = "!<>-_/\\[]{}=+*^?#·:;";

export function Scramble({
  text,
  className,
  style,
  delay = 0,
  cps = 26, /* characters resolved per second */
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  cps?: number;
}) {
  const [out, setOut] = useState(text);
  const raf = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setOut(text);
      return;
    }
    const chars = text.split("");
    const resolveAt = chars.map((_, i) => delay + (i / cps) * 1000 + Math.random() * 60);
    const t0 = performance.now();
    let last = "";
    const tick = (now: number) => {
      const el = now - t0;
      let s = "";
      let done = true;
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (c === " " || el >= resolveAt[i]) {
          s += c;
        } else {
          done = false;
          s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      if (s !== last) {
        last = s;
        setOut(s);
      }
      if (!done) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [text, delay, cps]);

  return (
    <span className={className} style={style}>
      {out}
    </span>
  );
}
