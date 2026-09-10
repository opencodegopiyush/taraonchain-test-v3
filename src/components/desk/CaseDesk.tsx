"use client";

import { useStore } from "@/lib/store";
import TraceCanvas from "@/engine/TraceCanvas";
import TopBar from "./TopBar";
import ChapterRail from "./ChapterRail";
import ChapterSheet from "./ChapterSheet";
import Inspector from "./Inspector";

/* ── case desk — v15 "paper trail" layout ────────────────────
   the plate is the page now: trace canvas fills the LEFT,
   the chapter sheet reads on the RIGHT (desktop). mobile:
   top bar / chapter strip / full-bleed canvas / drag-sheet
   + compact inspector card. same engine, new skin. */

export default function CaseDesk() {
  const recenter = useStore((s) => s.recenter);
  const cf = useStore((s) => s.caseFile);

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-background">
      <TopBar />
      <ChapterRail />

      {/* trace viewport — full bleed under the chrome */}
      <div className="absolute inset-x-0 bottom-0 top-[88px] lg:bottom-0 lg:left-0 lg:right-[418px] lg:top-12">
        <TraceCanvas />

        {/* floating HUD */}
        <div className="absolute bottom-[150px] right-3 z-20 flex flex-col items-end gap-2 lg:bottom-5 lg:right-5">
          <button
            onClick={recenter}
            className="chip cursor-pointer px-3 py-2 transition-colors hover:border-ink hover:text-ink"
            title="Re-frame this chapter"
          >
            ↺ RECENTER
          </button>
          <div className="chip flex-col !items-start gap-1 px-3 py-2">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#17150e" }} />
              OBSERVED
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#d4491f" }} />
              ASSESSED
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#a09b86" }} />
              UNKNOWN
            </span>
          </div>
          <span className="label hidden lg:block">
            {cf.stats.entities} ENT · {cf.stats.hops} LINKS · DRAG TO ORBIT
          </span>
        </div>

        {/* viewport title plate */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 lg:left-5 lg:top-5">
          <div className="bg-[var(--paper)] px-3 py-2">
            <p className="mono text-[9px] tracking-[0.24em] text-faint">
              <span className="pulse-dot mr-2 inline-block h-1.5 w-1.5 rounded-full bg-signal align-middle" />
              TRACE PLATE · LIVE
            </p>
          </div>
        </div>
      </div>

      <ChapterSheet />
      <Inspector />
    </div>
  );
}
