"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { CommandStrip } from "@/components/v3/CommandStrip";
import { Viewport } from "@/components/v3/Viewport";
import { DossierColumn } from "@/components/v3/DossierColumn";
import { LandingBoard } from "@/components/v3/LandingBoard";
import { ReportOverlay } from "@/components/overlays/ReportOverlay";
import { MethodOverlay } from "@/components/overlays/MethodOverlay";
import { CasesOverlay } from "@/components/overlays/CasesOverlay";

/* ── taraonchain — v3 "the case desk" ─────────────────────────
   a different experience on top of the same frozen trail engine
   and the same verbatim report. landing: an editorial board with
   a framed chain instrument. workspace: a split desk — trace
   viewport on the left, dossier column on the right, one command
   strip across the top. */

export default function Home() {
  const introDismissed = useStore((s) => s.introDismissed);
  const caseVersion = useStore((s) => s.caseVersion);

  /* keyboard shortcuts — arrows walk chapters, escape unwinds */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState();
      if (e.key === "Escape") {
        if (s.overlay) s.setOverlay(null);
        else if (s.legendOpen) s.setLegendOpen(false);
        else if (s.selectedNodeId) s.selectNode(null);
        return;
      }
      if (s.overlay || !s.introDismissed) return;
      if (e.key === "ArrowRight") s.nextChapter();
      else if (e.key === "ArrowLeft") s.prevChapter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* dev/debug handle — lets tooling drive the experience */
  useEffect(() => {
    (window as unknown as { __taraonchain?: typeof useStore }).__taraonchain = useStore;
  }, []);

  if (!introDismissed) {
    return (
      <main className="fixed inset-0 overflow-hidden" style={{ background: "var(--scene)" }}>
        <LandingBoard key={caseVersion} />
        <div className="vignette" aria-hidden />
        <div className="grain" aria-hidden />
      </main>
    );
  }

  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: "var(--scene)" }}>
      {/* the desk */}
      <CommandStrip />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* left — the framed trace viewport (mobile: top half) */}
        <div className="flex h-[44dvh] min-h-[280px] shrink-0 p-2 pb-1.5 lg:h-auto lg:min-h-0 lg:min-w-0 lg:flex-1 lg:p-2.5">
          <Viewport key={caseVersion} />
        </div>
        {/* right — the dossier column (mobile: lower sheet) */}
        <div className="flex min-h-0 flex-1 flex-col pb-[max(6px,env(safe-area-inset-bottom))] lg:w-[430px] lg:flex-none lg:pb-0 xl:w-[470px]">
          <DossierColumn key={`d-${caseVersion}`} />
        </div>
      </div>

      {/* overlays — the report, the method, the archive */}
      <ReportOverlay />
      <MethodOverlay />
      <CasesOverlay />

      <div className="grain" aria-hidden />
    </main>
  );
}
