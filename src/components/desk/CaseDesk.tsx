"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import TraceCanvas from "@/engine/TraceCanvas";
import TopBar from "./TopBar";
import ChapterReader from "./ChapterReader";
import Inspector from "./Inspector";

/* ── case desk — v17 reader layout ───────────────────────
   the case is a document: the trace plate is a STICKY
   figure on the left (desktop) / top (mobile); the chapters
   scroll past it like pages. scrolling IS navigation — the
   scrollspy in ChapterReader retargets the authored chapter
   cameras as you read. v17 mobile: legend chrome comes off
   the small plate (decluttered) and the inspector becomes a
   full bottom sheet — see Inspector.tsx. */

export default function CaseDesk() {
  const cf = useStore((s) => s.caseFile);

  /* the reader is a fresh document — always open at the top */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <TopBar />

      <div className="flex w-full flex-col items-start lg:flex-row">
        {/* ── the plate — a sticky figure, framed like a print ── */}
        <div className="sticky top-12 z-20 w-full shrink-0 border-b border-[var(--line-strong)] lg:h-[calc(100dvh-48px)] lg:w-[54%] lg:border-b-0 lg:border-r">
          <div className="relative h-[44svh] w-full lg:h-full">
            <TraceCanvas />

            {/* fig caption — top left, with the mobile touch hint */}
            <div className="pointer-events-none absolute left-3 top-3 z-10">
              <p className="mono bg-[var(--paper)] px-2 py-1 text-[9px] tracking-[0.22em] text-ink-3">
                FIG. {cf.id} · TRACE PLATE
              </p>
              <p className="mono mt-1 bg-[var(--paper)] px-2 py-1 text-[9px] tracking-[0.22em] text-ink-3 lg:hidden">
                TAP A NODE · PINCH TO ZOOM
              </p>
            </div>

            {/* legend — desktop only; it crowds the small mobile plate */}
            <div className="absolute bottom-12 left-3 z-10 hidden flex-col items-start gap-2 lg:bottom-5 lg:left-5 lg:flex">
              <div className="flex flex-col gap-1 bg-[var(--paper)] px-2.5 py-2">
                <span className="mono flex items-center gap-1.5 text-[8.5px] tracking-[0.16em] text-ink-3">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#111113" }} />
                  OBSERVED
                </span>
                <span className="mono flex items-center gap-1.5 text-[8.5px] tracking-[0.16em] text-ink-3">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#2440f5" }} />
                  ASSESSED
                </span>
                <span className="mono flex items-center gap-1.5 text-[8.5px] tracking-[0.16em] text-ink-3">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#a6a6ad" }} />
                  UNKNOWN
                </span>
              </div>
            </div>

            <Recenter />

            {/* chapter ruler — the plate's bottom edge doubles as
                the table of contents; tap to scroll the reader */}
            <Ruler />

            <Inspector />
          </div>
        </div>

        {/* ── the reader — chapters scroll past the figure; the
            WINDOW scrolls, the plate sticks — same on every device */}
        <div className="min-w-0 flex-1">
          <ChapterReader />
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
      className="chip absolute bottom-12 right-3 z-10 cursor-pointer bg-[var(--paper)] px-2.5 py-2 transition-colors hover:border-ink hover:text-ink lg:bottom-5 lg:right-5"
      title="Re-frame this chapter"
    >
      ↺ RECENTER
    </button>
  );
}

/* the ruler — chapter numbers printed along the plate's base */
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
              /* scrolling is navigation: aim the reader at the
                 section and the scrollspy does the rest */
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
