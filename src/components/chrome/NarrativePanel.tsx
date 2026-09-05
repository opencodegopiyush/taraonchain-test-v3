"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { EpiChip } from "@/components/ui/bits";
import { Icon } from "@/components/ui/icons";

/* chapter narrative — desktop: full side panel, as always.
   mobile: a bottom sheet — collapsed to a one-line chapter bar so
   the 3d trail stays visible, tap the chevron to expand and read. */

export function NarrativePanel() {
  const CASE = useStore((s) => s.caseFile);
  const chapter = useStore((s) => s.chapter);
  const introDismissed = useStore((s) => s.introDismissed);
  const overlay = useStore((s) => s.overlay);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const nextChapter = useStore((s) => s.nextChapter);
  const prevChapter = useStore((s) => s.prevChapter);
  const setChapter = useStore((s) => s.setChapter);
  const setOverlay = useStore((s) => s.setOverlay);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(false);

  const hidden = !introDismissed || overlay !== null || selectedNodeId !== null;
  const ch = CASE.chapters[chapter];
  const total = CASE.chapters.length;
  const last = chapter === total - 1;

  const unit = CASE.unit ?? "ETH";
  const traced = CASE.edges.reduce((sum, e) => sum + (e.value ?? 0), 0);
  const fmtTraced =
    traced >= 1000
      ? `${(traced / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K ${unit}`
      : `${traced.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`;

  const jump = (i: number) => {
    setChapter(i);
    setIndex(false);
  };

  return (
    <section
      aria-label="chapter narrative"
      className="fixed z-30 transition-all duration-500 ease-out"
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(16px)" : "translateY(0)",
        pointerEvents: hidden ? "none" : "auto",
        left: "max(20px, env(safe-area-inset-left))",
        right: undefined,
        bottom: "max(20px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="panel w-[min(432px,calc(100vw-40px))] p-4 sm:p-5">
        {/* chapter index — quick jump, floats above the panel */}
        {index && (
          <div
            className="panel absolute bottom-[calc(100%+10px)] left-0 max-h-[46dvh] w-full overflow-y-auto overscroll-contain p-2"
            style={{ background: "var(--panel-deep)" }}
            role="menu"
            aria-label="chapter index"
          >
            {CASE.chapters.map((c, i) => (
              <button
                key={c.id}
                role="menuitem"
                onClick={() => jump(i)}
                className="flex w-full items-baseline gap-3 border-b px-2.5 py-2.5 text-left last:border-b-0 transition-colors hover:bg-[rgba(236,238,242,0.05)]"
                style={{ borderColor: "var(--line)" }}
              >
                <span
                  className="datum w-6 text-[10px] font-medium"
                  style={{ color: i === chapter ? "var(--assess)" : "var(--ink-faint)" }}
                >
                  {c.no}
                </span>
                <span
                  className="label truncate !text-[10.5px]"
                  style={{ color: i === chapter ? "var(--ink)" : "var(--ink-mute)" }}
                >
                  {c.kicker}
                </span>
              </button>
            ))}
          </div>
        )}

        <div key={ch.id} className="rise">
          {/* header — always visible; on mobile the chevron toggles the sheet */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2.5 min-w-0">
              <span className="datum text-[10px] font-medium" style={{ color: "var(--assess)" }}>
                {ch.no} / {String(total).padStart(2, "0")}
              </span>
              <span className="label truncate" style={{ color: "var(--ink-mute)" }}>{ch.kicker}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                className="btn btn-ghost !p-1.5"
                onClick={() => setIndex((v) => !v)}
                aria-expanded={index}
                aria-label="chapter index — jump to a chapter"
                title="Chapter index"
              >
                <Icon name="cases" size={13} />
              </button>
              <button className="btn btn-ghost !p-1.5" onClick={prevChapter} disabled={chapter === 0} aria-label="previous chapter">
                <Icon name="arrow-left" size={14} />
              </button>
              <button className="btn btn-ghost !p-1.5" onClick={nextChapter} disabled={last} aria-label="next chapter">
                <Icon name="arrow-right" size={14} />
              </button>
              <button
                className="btn btn-ghost !p-1.5 lg:hidden"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls="narrative-body"
                aria-label={open ? "Hide chapter text" : "Read the chapter"}
              >
                <Icon
                  name="chevron"
                  size={14}
                  className={`transition-transform duration-300 ${open ? "" : "rotate-180"}`}
                />
              </button>
            </div>
          </div>

          <h2 className="disp mt-1.5 text-[17px] font-semibold leading-snug sm:mt-2 sm:text-[19px]" style={{ color: "var(--ink)" }}>
            {ch.title}
          </h2>

          {/* body + facts — collapsed on mobile until opened, always
              fully visible on desktop */}
          <div
            id="narrative-body"
            key={ch.id}
            className={`transition-[max-height] duration-500 ease-out lg:!max-h-none lg:!overflow-visible lg:mt-2.5 ${
              open ? "mt-2.5 max-h-[54dvh] overflow-y-auto overscroll-contain" : "max-h-0 overflow-hidden"
            }`}
          >
            {/* case stats — one real datum row, mobile only (desktop has the stat bar) */}
            <div className="datum flex flex-wrap items-center gap-x-4 gap-y-1 pb-2.5 text-[9px] tracking-[0.12em] lg:hidden" style={{ color: "var(--ink-faint)" }}>
              <span>{CASE.nodes.length} ENTITIES</span>
              <span>{CASE.edges.length} CONNECTIONS</span>
              <span>TRACED · {fmtTraced}</span>
            </div>

            <div className="doc flex flex-col gap-2.5 text-[14.5px] leading-[1.62]" style={{ color: "var(--ink-mute)" }}>
              {ch.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="chips-mobile mt-3.5 flex flex-wrap gap-1.5">
              {ch.facts.map((f, i) => (
                <EpiChip key={i} e={f.epistemic} text={f.text} />
              ))}
            </div>
          </div>

          {/* the report is the destination of the walkthrough, not a parallel mode */}
          {last && (
            <button
              className="btn btn-primary pulse-cta mt-3.5 w-full !justify-center !py-3 !text-[11px]"
              onClick={() => setOverlay("report")}
            >
              Read the full case report
              <Icon name="report" size={14} className="ml-2 inline" />
            </button>
          )}
        </div>

        {/* progress ticks + momentum readout — watching the count climb
            pulls you toward the finish (v2) */}
        <div className="mt-3.5 flex items-center gap-3 sm:mt-4">
          <div className="flex flex-1 items-center gap-[5px]">
            {CASE.chapters.map((c, i) => (
              <button
                key={c.id}
                className="h-[2px] flex-1 transition-colors duration-300"
                style={{ background: i <= chapter ? "var(--assess)" : "rgba(236,238,242,0.12)" }}
                onClick={() => useStore.getState().setChapter(i)}
                aria-label={`go to chapter ${c.no}`}
              />
            ))}
          </div>
          <span
            key={chapter}
            className="datum rise !text-[9px] !tracking-[0.12em] tabular-nums"
            style={{ color: "var(--assess)" }}
          >
            {Math.round(((chapter + 1) / total) * 100)}% REVIEWED
          </span>
        </div>
      </div>
    </section>
  );
}
