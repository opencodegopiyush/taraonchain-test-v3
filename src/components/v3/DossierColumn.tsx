"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { EpiChip } from "@/components/ui/bits";
import { Icon } from "@/components/ui/icons";
import { Scramble } from "./Scramble";
import { Odometer } from "./Odometer";

/* ── dossier column — v3 right pane ───────────────────────────
   the report reads like a case file being declassified: a vertical
   chapter rail, a card that re-decodes on every chapter change,
   facts that stamp in one by one, and the momentum odometer.
   same verbatim words as the live report — only the staging is
   new. on mobile this column is the lower sheet, under the
   viewport. */

export function DossierColumn() {
  const CASE = useStore((s) => s.caseFile);
  const chapter = useStore((s) => s.chapter);
  const setChapter = useStore((s) => s.setChapter);
  const nextChapter = useStore((s) => s.nextChapter);
  const prevChapter = useStore((s) => s.prevChapter);
  const setOverlay = useStore((s) => s.setOverlay);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ch = CASE.chapters[chapter];
  const total = CASE.chapters.length;
  const last = chapter === total - 1;
  const pct = Math.round(((chapter + 1) / total) * 100);

  /* keep the reading head at the top of the new chapter */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [chapter]);

  return (
    <aside
      aria-label="case dossier"
      className="relative z-30 flex min-h-0 flex-1 flex-col border-t lg:border-t-0 lg:border-l"
      style={{ borderColor: "var(--line)", background: "rgba(10, 12, 11, 0.9)" }}
    >
      {/* chapter rail — horizontal ticks on mobile, vertical list on desktop */}
      <div
        className="flex shrink-0 items-center gap-1 overflow-x-auto border-b px-3 py-2 slim-scroll lg:flex-col lg:items-stretch lg:gap-0 lg:overflow-visible lg:border-b-0 lg:px-0 lg:py-0"
        style={{ borderColor: "var(--line)" }}
      >
        {CASE.chapters.map((c, i) => {
          const active = i === chapter;
          const done = i < chapter;
          return (
            <button
              key={c.id}
              onClick={() => setChapter(i)}
              aria-label={`go to chapter ${c.no} — ${c.kicker}`}
              className="group flex shrink-0 items-center gap-2 border-b-0 px-1.5 py-1 text-left lg:border-b lg:px-3.5 lg:py-2 transition-colors hover:bg-[rgba(232,228,218,0.04)]"
              style={{ borderColor: "var(--line)" }}
            >
              <span
                className="datum text-[9.5px] font-medium tabular-nums"
                style={{ color: active ? "var(--assess)" : done ? "var(--ink-mute)" : "var(--ink-faint)" }}
              >
                {c.no}
              </span>
              <span
                className="label hidden !text-[9px] truncate lg:inline"
                style={{ color: active ? "var(--ink)" : "var(--ink-faint)" }}
              >
                {c.kicker}
              </span>
              {active && <span className="dot ml-auto hidden lg:inline" style={{ background: "var(--assess)" }} />}
            </button>
          );
        })}
      </div>

      {/* the reading head */}
      <div ref={scrollRef} className="slim-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div key={ch.id} className="t3-card-in px-4 pb-5 pt-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <span className="datum text-[10px] font-medium" style={{ color: "var(--assess)" }}>
              {ch.no} / {String(total).padStart(2, "0")}
            </span>
            <span className="label !text-[8.5px]" style={{ color: "var(--ink-faint)" }}>
              DECLASSIFYING
              <span className="t3-caret ml-1 inline-block h-[9px] w-[5px] translate-y-[1px]" style={{ background: "var(--assess)" }} />
            </span>
          </div>

          <p className="datum mt-2.5 text-[10.5px] tracking-[0.12em]" style={{ color: "var(--ink-mute)" }}>
            <Scramble text={ch.kicker.toUpperCase()} delay={120} />
          </p>

          <h2
            className="disp mt-1.5 text-[19px] font-semibold leading-snug sm:text-[21px]"
            style={{ color: "var(--ink)" }}
          >
            {ch.title}
          </h2>

          <div className="doc mt-3 flex flex-col gap-2.5 text-[14.5px] leading-[1.62]" style={{ color: "var(--ink-mute)" }}>
            {ch.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* facts stamp in one by one */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {ch.facts.map((f, i) => (
              <span key={i} className="t3-stamp inline-flex" style={{ animationDelay: `${250 + i * 110}ms` }}>
                <EpiChip e={f.epistemic} text={f.text} />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* transport + momentum */}
      <div className="shrink-0 border-t px-4 py-3 sm:px-5" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost !p-1.5" onClick={prevChapter} disabled={chapter === 0} aria-label="previous chapter">
              <Icon name="arrow-left" size={14} />
            </button>
            <button className="btn btn-ghost !p-1.5" onClick={nextChapter} disabled={last} aria-label="next chapter">
              <Icon name="arrow-right" size={14} />
            </button>
          </div>
          <span className="flex items-baseline gap-1.5">
            <Odometer value={pct} suffix="%" className="disp text-[14px] font-semibold" style={{ color: "var(--assess)" }} />
            <span className="label !text-[8px]" style={{ color: "var(--ink-faint)" }}>REVIEWED</span>
          </span>
        </div>

        {last && (
          <button
            className="btn btn-primary pulse-cta mt-3 w-full !justify-center !py-3 !text-[11px]"
            onClick={() => setOverlay("report")}
          >
            Read the full case report
            <Icon name="report" size={14} className="ml-2 inline" />
          </button>
        )}
      </div>
    </aside>
  );
}
