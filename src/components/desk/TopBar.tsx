"use client";

import { useStore, reviewedPct } from "@/lib/store";

/* ── top bar — v18: wordmark · file id · review % · FILE.
   the desk is a fixed terminal now — nothing ever scrolls the
   window, so the bar is a plain shrink-0 row at the top of the
   shell. no pause button — v16+ has no idle motion to pause;
   no chapter stepper — the ruler on the 50/50 seam and the
   report pane's own scroll ARE the navigation. */

export default function TopBar() {
  const home = useStore((s) => s.home);
  const cf = useStore((s) => s.caseFile);
  const chapter = useStore((s) => s.chapter);
  const setOverlay = useStore((s) => s.setOverlay);
  const visited = useStore((s) => s.visited);
  const pct = Math.max(reviewedPct({ visited, caseFile: cf }), 4);
  const total = cf.chapters.length;

  return (
    <header className="hairline-b z-30 flex h-12 shrink-0 items-center gap-3 bg-[var(--paper)] px-3 sm:px-5">
      <button
        onClick={home}
        className="mono shrink-0 text-[10px] font-semibold tracking-[0.16em] text-ink transition-colors hover:text-signal sm:text-[11px] sm:tracking-[0.28em]"
        title="Back to the index"
      >
        ← TARAONCHAIN
      </button>
      <span className="hidden text-faint sm:inline">│</span>
      <span className="mono shrink-0 text-[11px] tracking-[0.14em] text-mute">
        {cf.id}
      </span>
      <span className="disp hidden shrink-0 text-[15px] font-semibold uppercase tracking-tight text-ink md:inline">
        {cf.codename}
      </span>
      <span className="mono shrink-0 text-[11px] tabular-nums text-faint">
        CH {cf.chapters[Math.min(chapter, total - 1)].no}/{String(total).padStart(2, "0")}
      </span>

      <div className="min-w-2 flex-1" />

      <span className="mono shrink-0 text-[11px] font-semibold tabular-nums text-signal">
        {pct}%
      </span>

      <button
        onClick={() => setOverlay("report")}
        className="chip hidden h-9 shrink-0 cursor-pointer items-center sm:inline-flex"
        title="Open the full case file"
      >
        FILE
      </button>

      {/* the review rule — fills along the header's base as you read */}
      <span
        aria-hidden
        className="absolute bottom-[-1px] left-0 h-[2px] bg-signal transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </header>
  );
}
