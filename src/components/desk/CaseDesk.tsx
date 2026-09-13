"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import TraceCanvas from "@/engine/TraceCanvas";
import TopBar from "./TopBar";
import ChapterReader from "./ChapterReader";
import Inspector, { EntityPane } from "./Inspector";
import { EPI_COLORS } from "@/lib/palette";

/* ── case desk — v19 "NIGHT SHIFT" ───────────────────────────
   the terminal keeps the 50/50 cut that v18 introduced — but
   the seam is now YOURS. drag the grip to rebalance the halves
   (36–64%), double-tap it to snap back to exactly 50 / 50, and
   the live ratio is printed right on the grip. the plate eases
   its camera as you read (the scrollspy lives in the report
   pane); tapping a bubble swaps the report half to that
   entity's full record while the plate keeps running. */

const MIN = 36;
const MAX = 64;

export default function CaseDesk() {
  const cf = useStore((s) => s.caseFile);
  const [split, setSplit] = useState(50);
  const [grabbing, setGrabbing] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  /* the reader is a fresh document — always open at the top */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onSeamDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragging.current = true;
    setGrabbing(true);
  };

  const onSeamMove = (e: React.PointerEvent) => {
    if (!dragging.current || !shellRef.current) return;
    const r = shellRef.current.getBoundingClientRect();
    const vertical = window.innerWidth < 1024;
    const pct = vertical
      ? ((e.clientY - r.top) / r.height) * 100
      : ((e.clientX - r.left) / r.width) * 100;
    setSplit(Math.min(MAX, Math.max(MIN, Math.round(pct * 2) / 2)));
  };

  const onSeamUp = () => {
    dragging.current = false;
    setGrabbing(false);
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <TopBar />

      <div
        ref={shellRef}
        className="flex min-h-0 w-full flex-1 flex-col lg:flex-row"
        style={{ "--split": `${split}%` } as React.CSSProperties}
      >
        {/* ── the plate — the upper (left) half, always live ── */}
        <div className="relative h-[var(--split)] min-h-[220px] w-full shrink-0 lg:h-full lg:w-[var(--split)] lg:min-h-0">
          <TraceCanvas />

          {/* fig caption + touch hint */}
          <div className="pointer-events-none absolute left-3 top-3 z-10">
            <p className="mono bg-[var(--paper)] px-2 py-1 text-[9px] tracking-[0.22em] text-ink-3">
              FIG. {cf.id} · TRACE PLATE
            </p>
            <p className="mono mt-1 bg-[var(--paper)] px-2 py-1 text-[9px] tracking-[0.22em] text-ink-3 lg:hidden">
              TAP A NODE · PINCH TO ZOOM
            </p>
          </div>

          {/* legend — desktop only; it crowds a half-height mobile plate.
              bottom-14 clears the chapter ruler strip */}
          <div className="absolute bottom-12 left-3 z-10 hidden flex-col items-start gap-2 lg:bottom-14 lg:left-5 lg:flex">
            <div className="flex flex-col gap-1 bg-[var(--paper)] px-2.5 py-2">
              <span className="mono flex items-center gap-1.5 text-[8.5px] tracking-[0.16em] text-ink-3">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: EPI_COLORS.observed }}
                />
                OBSERVED
              </span>
              <span className="mono flex items-center gap-1.5 text-[8.5px] tracking-[0.16em] text-ink-3">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: EPI_COLORS.assessed }}
                />
                ASSESSED
              </span>
              <span className="mono flex items-center gap-1.5 text-[8.5px] tracking-[0.16em] text-ink-3">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: EPI_COLORS.unknown }}
                />
                UNKNOWN
              </span>
            </div>
          </div>

          <Recenter />

          {/* chapter ruler — the plate's bottom edge doubles as the
              table of contents */}
          <Ruler />

          <Inspector />
        </div>

        {/* ── the seam — grab it; the ratio is yours ── */}
        <div
          role="separator"
          aria-label="Drag to rebalance the split"
          aria-valuenow={Math.round(split)}
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          onPointerDown={onSeamDown}
          onPointerMove={onSeamMove}
          onPointerUp={onSeamUp}
          onPointerCancel={onSeamUp}
          onDoubleClick={() => setSplit(50)}
          title="Drag to rebalance · double-tap for 50 / 50"
          className={`relative z-20 flex h-8 w-full shrink-0 touch-none select-none items-center justify-center border-y border-[var(--line-strong)] transition-colors lg:h-auto lg:w-8 lg:flex-col lg:border-y-0 lg:border-l lg:border-r ${
            grabbing ? "bg-[var(--paper-2)]" : "bg-[var(--paper)]"
          } ${grabbing ? "cursor-grabbing" : "cursor-row-resize lg:cursor-col-resize"}`}
        >
          <span
            className="mono flex items-center gap-1.5 border px-2 py-1 text-[8.5px] tabular-nums tracking-[0.14em] lg:px-1.5 lg:py-2"
            style={{
              color: grabbing ? "var(--signal)" : "var(--ink-3)",
              borderColor: grabbing ? "var(--signal)" : "var(--line-strong)",
            }}
          >
            <span className="hidden lg:inline">·</span>
            {Math.round(split)} / {100 - Math.round(split)}
            <span className="hidden lg:inline">·</span>
          </span>
        </div>

        {/* ── the report — the other half; scrolls inside itself ── */}
        <div className="relative min-h-0 min-w-0 flex-1">
          <ChapterReader />
          <EntityPane />
        </div>
      </div>
    </div>
  );
}

function Recenter() {
  const recenter = useStore((s) => s.recenter);
  return (
    <button
      onClick={recenter}
      className="chip absolute bottom-12 right-3 z-10 cursor-pointer bg-[var(--paper)] px-2.5 py-2 transition-colors hover:border-ink hover:text-ink lg:bottom-14 lg:right-5"
      title="Re-frame this chapter"
    >
      ↺ RECENTER
    </button>
  );
}

/* the ruler — chapter numbers printed along the 50/50 seam */
function Ruler() {
  const cf = useStore((s) => s.caseFile);
  const chapter = useStore((s) => s.chapter);

  return (
    <div
      className="no-scrollbar absolute inset-x-0 bottom-0 z-10 flex items-stretch justify-between border-t border-[var(--line)] bg-[var(--paper)] lg:justify-start lg:gap-0"
      role="tablist"
      aria-label="Chapters"
    >
      {cf.chapters.map((c, i) => {
        const active = i === chapter;
        return (
          <button
            key={c.id}
            role="tab"
            aria-selected={active}
            aria-label={`Scroll to chapter ${c.no}: ${c.title}`}
            onClick={() => {
              /* scrolling is navigation: aim the reader pane at
                 the section and the scrollspy does the rest */
              document
                .getElementById(`ch-${i}`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="mono relative flex-1 py-2.5 text-center text-[10px] tabular-nums tracking-[0.1em] transition-colors lg:flex-none lg:px-3.5"
            style={{ color: active ? "var(--signal)" : "var(--ink-3)" }}
          >
            {c.no}
            {active && <span className="absolute inset-x-2 bottom-0 h-[2px] bg-signal lg:inset-x-2.5" />}
          </button>
        );
      })}
    </div>
  );
}
