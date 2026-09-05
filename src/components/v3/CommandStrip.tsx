"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui/icons";
import { LegendContent } from "@/components/ui/bits";
import { Odometer } from "./Odometer";

/* ── command strip — v3 replacement for TopBar+StatBar+Dock ───
   one dense instrument row: brand · case id · momentum odometer ·
   chapter transport · trace auto-play · view controls · archive
   entries. everything the workspace needs, in one line. */

export function CommandStrip() {
  const CASE = useStore((s) => s.caseFile);
  const chapter = useStore((s) => s.chapter);
  const nextChapter = useStore((s) => s.nextChapter);
  const prevChapter = useStore((s) => s.prevChapter);
  const recenter = useStore((s) => s.recenter);
  const flowPaused = useStore((s) => s.flowPaused);
  const toggleFlowPaused = useStore((s) => s.toggleFlowPaused);
  const factsOnly = useStore((s) => s.factsOnly);
  const toggleFactsOnly = useStore((s) => s.toggleFactsOnly);
  const legendOpen = useStore((s) => s.legendOpen);
  const setLegendOpen = useStore((s) => s.setLegendOpen);
  const setOverlay = useStore((s) => s.setOverlay);
  const home = useStore((s) => s.home);
  const overlay = useStore((s) => s.overlay);

  const total = CASE.chapters.length;
  const pct = Math.round(((chapter + 1) / total) * 100);
  const last = chapter === total - 1;

  /* trace auto-play — the guided walk. the story tells itself;
     any manual chapter change or overlay takes over instead. */
  const [playing, setPlaying] = useState(false);
  const chapterRef = useRef(chapter);
  chapterRef.current = chapter;
  useEffect(() => {
    if (!playing) return;
    if (overlay) {
      setPlaying(false);
      return;
    }
    if (chapterRef.current >= total - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setInterval(() => {
      const s = useStore.getState();
      if (s.overlay || s.chapter >= s.caseFile.chapters.length - 1) {
        setPlaying(false);
        return;
      }
      s.nextChapter();
    }, 7000);
    return () => window.clearInterval(id);
  }, [playing, overlay, total]);

  return (
    <header
      className="relative z-40 flex h-12 shrink-0 items-center gap-2 overflow-x-auto border-b px-2.5 slim-scroll sm:gap-3 sm:px-3"
      style={{
        borderColor: "var(--line)",
        background: "rgba(17, 13, 8, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* brand — return to the landing */}
      <button
        onClick={home}
        className="wordmark-brand shrink-0 !text-[11px] transition-colors hover:text-[color:var(--assess)]"
        style={{ color: "var(--ink)" }}
        aria-label="taraonchain — back to the landing"
      >
        taraonchain
      </button>
      <span className="h-4 w-px shrink-0" style={{ background: "var(--line-strong)" }} />
      <span className="datum shrink-0 text-[10px] tracking-[0.1em]" style={{ color: "var(--assess)" }}>
        {CASE.id}
      </span>
      <span className="label shrink-0 !text-[9px] hidden sm:inline" style={{ color: "var(--ink-faint)" }}>
        {CASE.codename}
      </span>

      <span className="h-4 w-px shrink-0" style={{ background: "var(--line)" }} />

      {/* momentum — the odometer */}
      <span className="flex shrink-0 items-baseline gap-1.5">
        <Odometer value={pct} suffix="%" className="disp text-[15px] font-semibold" style={{ color: "var(--assess)" }} />
        <span className="label !text-[8px] hidden md:inline" style={{ color: "var(--ink-faint)" }}>
          REVIEWED
        </span>
      </span>

      <span className="ml-auto" />

      {/* chapter transport */}
      <div className="flex shrink-0 items-center gap-0.5">
        <StripBtn label="previous chapter" onClick={prevChapter} disabled={chapter === 0}>
          <Icon name="arrow-left" size={14} />
        </StripBtn>
        <span className="datum w-11 text-center text-[10px] tabular-nums" style={{ color: "var(--ink-mute)" }}>
          {String(chapter + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        <StripBtn label="next chapter" onClick={nextChapter} disabled={last}>
          <Icon name="arrow-right" size={14} />
        </StripBtn>
        <StripBtn
          label={playing ? "stop the guided trace" : "play the guided trace"}
          onClick={() => setPlaying((p) => !p)}
          active={playing}
        >
          <Icon name={playing ? "pause" : "play"} size={13} />
        </StripBtn>
      </div>

      <span className="h-4 w-px shrink-0" style={{ background: "var(--line)" }} />

      {/* view controls */}
      <div className="flex shrink-0 items-center gap-0.5">
        <StripBtn label="recenter view" onClick={recenter}>
          <Icon name="crosshair" size={14} />
        </StripBtn>
        <StripBtn label={flowPaused ? "resume flow" : "pause flow"} onClick={toggleFlowPaused} active={flowPaused}>
          <Icon name={flowPaused ? "play" : "pause"} size={14} />
        </StripBtn>
        <StripBtn label={factsOnly ? "show all entities" : "observed facts only"} onClick={toggleFactsOnly} active={factsOnly}>
          <Icon name="shield" size={14} />
        </StripBtn>
        <StripBtn label="legend" onClick={() => setLegendOpen(!legendOpen)} active={legendOpen}>
          <Icon name="legend" size={14} />
        </StripBtn>
      </div>

      <span className="h-4 w-px shrink-0" style={{ background: "var(--line)" }} />

      {/* archive entries */}
      <div className="flex shrink-0 items-center gap-0.5">
        <StripBtn label="case archive" onClick={() => setOverlay("cases")}>
          <Icon name="cases" size={14} />
        </StripBtn>
        <StripBtn label="method" onClick={() => setOverlay("method")}>
          <Icon name="method" size={14} />
        </StripBtn>
        <StripBtn label="full case report" onClick={() => setOverlay("report")}>
          <Icon name="report" size={14} />
        </StripBtn>
      </div>

      {/* legend popover */}
      <div
        className="panel absolute right-2 top-[calc(100%+8px)] w-[300px] max-w-[calc(100vw-24px)] p-4 transition-all duration-300"
        style={{
          opacity: legendOpen ? 1 : 0,
          transform: legendOpen ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
          pointerEvents: legendOpen ? "auto" : "none",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="label" style={{ color: "var(--ink)" }}>Reading the graph</span>
          <button className="btn btn-ghost !p-1" onClick={() => setLegendOpen(false)} aria-label="close legend">
            <Icon name="close" size={13} />
          </button>
        </div>
        <LegendContent />
      </div>
    </header>
  );
}

function StripBtn({
  children,
  label,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border transition-colors duration-150 disabled:opacity-30"
      style={{
        borderColor: active ? "rgba(227,185,92,0.5)" : "transparent",
        background: active ? "rgba(227,185,92,0.1)" : "transparent",
        color: active ? "var(--assess)" : "var(--ink-mute)",
      }}
    >
      {children}
    </button>
  );
}
