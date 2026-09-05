"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { Frame } from "./Frame";
import { InspectorPanel } from "@/components/chrome/InspectorPanel";
import { Scramble } from "./Scramble";

/* GraphCanvas is untouched — dynamic + ssr:false, same as the live site */
const GraphCanvas = dynamic(() => import("@/components/three/GraphCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--scene)" }}>
      <span className="label" style={{ color: "var(--ink-faint)" }}>ESTABLISHING LINK ANALYSIS…</span>
    </div>
  ),
});

/* ── viewport — the framed 3d instrument (v3 left pane) ───────
   the frozen trail engine, unchanged, living inside a frame with
   a scanline sweep and a live chapter readout. the untouched
   InspectorPanel rides inside the frame too (fixed positioning
   resolves against the frame's content box). */

export function Viewport() {
  const CASE = useStore((s) => s.caseFile);
  const chapter = useStore((s) => s.chapter);
  const ch = CASE.chapters[chapter];

  return (
    <Frame
      className="min-h-0 flex-1"
      scan
      label={
        <span className="flex items-center gap-2">
          <span className="dot pulse-dot" style={{ background: "var(--fact)", color: "var(--fact)" }} />
          TRACE VIEWPORT · DRAG TO ORBIT · CLICK AN ENTITY
        </span>
      }
      meta={
        <span className="datum text-[9.5px] tabular-nums" style={{ color: "var(--ink-faint)" }}>
          {CASE.nodes.length} ENT · {CASE.edges.length} LINKS
        </span>
      }
      footer={
        <div className="flex h-8 items-center gap-2.5 px-3">
          <span className="datum shrink-0 text-[10px] font-medium tabular-nums" style={{ color: "var(--assess)" }}>
            CH {String(chapter + 1).padStart(2, "0")}
          </span>
          <span className="label !text-[8.5px] min-w-0 flex-1 truncate" style={{ color: "var(--ink-mute)" }}>
            <Scramble key={ch.id} text={ch.kicker.toUpperCase()} cps={40} />
          </span>
          <span className="hidden shrink-0 items-center gap-1 sm:flex" aria-hidden>
            {CASE.chapters.map((c, i) => (
              <span
                key={c.id}
                className="h-[2px] w-4 transition-colors duration-300"
                style={{ background: i <= chapter ? "var(--assess)" : "rgba(236,238,242,0.14)" }}
              />
            ))}
          </span>
        </div>
      }
    >
      <GraphCanvas />
      {/* frame-confined instance — desktop slide-over; mobile uses the page-level sheet */}
      <InspectorPanel confined />
    </Frame>
  );
}
