"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { CommandStrip } from "@/components/v3/CommandStrip";
import { Viewport } from "@/components/v3/Viewport";
import { DossierColumn } from "@/components/v3/DossierColumn";
import { InspectorPanel } from "@/components/chrome/InspectorPanel";
import { LandingBoard } from "@/components/v3/LandingBoard";
import { ReportOverlay } from "@/components/overlays/ReportOverlay";
import { MethodOverlay } from "@/components/overlays/MethodOverlay";
import { CasesOverlay } from "@/components/overlays/CasesOverlay";

/* ── taraonchain — v4 "pocket desk" ───────────────────────────
   mobile-first: the trace viewport owns the whole screen and the
   case file rides over it as a drag sheet (peek / half / full).
   on desktop the same two instruments sit side by side — the
   v3 split desk, untouched. */

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
      <CommandStrip />

      <div className="relative min-h-0 flex-1 lg:flex lg:flex-row">
        {/* the trace viewport — mobile: the entire area behind the sheet · desktop: left pane */}
        <div className="absolute inset-0 p-2 pb-1.5 lg:static lg:relative lg:flex lg:min-h-0 lg:min-w-0 lg:flex-1 lg:p-2.5 lg:pb-2.5">
          <Viewport key={caseVersion} />
        </div>

        {/* mobile — the case file as a drag sheet over the trace */}
        <div className="absolute inset-x-0 bottom-0 z-30 lg:hidden">
          <DossierColumn key={`sheet-${caseVersion}`} variant="sheet" />
        </div>

        {/* desktop — the dossier side column (v3 split desk) */}
        <div className="hidden min-h-0 flex-col pb-0 lg:flex lg:w-[430px] lg:flex-none xl:w-[470px]">
          <DossierColumn key={`col-${caseVersion}`} variant="column" />
        </div>

        {/* mobile — entity sheet rides above the dossier sheet */}
        <InspectorPanel />
      </div>

      {/* overlays — the report, the method, the archive */}
      <ReportOverlay />
      <MethodOverlay />
      <CasesOverlay />

      <div className="grain" aria-hidden />
    </main>
  );
}
