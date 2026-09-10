"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { EPI_COLORS, EPI_LABEL, KIND_LABEL, NODE_COLORS } from "@/lib/palette";
import type { CaseFile, Chapter } from "@/lib/types";

/* ── chapter reader — v16: the case IS a document ────────────
   every chapter is one continuous article section. the page
   scrolls like a dossier; a scrollspy (one IntersectionObserver
   on a centre band) tells the store which chapter you're
   reading, and the sticky trace plate eases its camera to that
   chapter's authored view. reading drives the graph — the
   inverse of every previous build, where buttons drove text.
   no entrance animation: the words are simply there. */

export default function ChapterReader() {
  const cf = useStore((s) => s.caseFile);
  const setChapter = useStore((s) => s.setChapter);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  /* ── scrollspy — one observer, one centre band, no math ── */
  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-ch]"));

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const idx = Number((e.target as HTMLElement).dataset.ch);
          if (useStore.getState().chapter !== idx) setChapter(idx);
        }
      },
      /* a narrow band across the middle of the viewport: the
         section crossing it is the one you're reading */
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [cf, setChapter]);

  return (
    <div ref={wrapRef} className="min-w-0 flex-1">
      <CaseHead cf={cf} />
      {cf.chapters.map((ch, i) => (
        <ChapterSection key={ch.id} cf={cf} ch={ch} idx={i} />
      ))}
      <CaseEnd cf={cf} />
    </div>
  );
}

/* ── the file head — the dossier cover ─────────────────────── */
function CaseHead({ cf }: { cf: CaseFile }) {
  return (
    <header className="px-5 pb-12 pt-10 sm:px-10 lg:px-14 lg:pt-16" data-ch-head>
      <p className="label">CASE FILE · {cf.id}</p>
      <h1 className="disp mt-3 text-[15vw] font-bold uppercase leading-[0.9] text-ink sm:text-7xl lg:text-[92px]">
        {cf.codename}
      </h1>
      <p className="mono mt-4 text-[10.5px] tracking-[0.16em] text-mute">
        {cf.chains.join(" / ").toUpperCase()} · {cf.span.toUpperCase()} · UNIT {cf.unit ?? "ETH"}
      </p>
      <p className="read mt-6 max-w-2xl text-[15px]">{cf.summary}</p>

      <div className="mt-8 grid grid-cols-4 gap-px border border-[var(--line)] bg-[var(--line)]">
        {[
          [cf.stats.entities, "ENTITIES"],
          [cf.stats.hops, "LINKS"],
          [cf.chapters.length, "CHAPTERS"],
          [`${cf.unit ?? "ETH"}`, "UNIT"],
        ].map(([v, l]) => (
          <div key={l as string} className="bg-[var(--paper-2)] px-3 py-3.5">
            <p className="mono text-[15px] font-semibold tabular-nums text-ink">{v}</p>
            <p className="label mt-1">{l}</p>
          </div>
        ))}
      </div>
      <p className="label mt-3">FOOTPRINT · MEASURED FROM CASE {cf.id} — {cf.codename}</p>
    </header>
  );
}

/* ── one chapter = one section ─────────────────────────────── */
function ChapterSection({ cf, ch, idx }: { cf: CaseFile; ch: Chapter; idx: number }) {
  const selectNode = useStore((s) => s.selectNode);
  const nodeIds = new Set(cf.nodes.map((n) => n.id));
  const focus = ch.focus.filter((f) => nodeIds.has(f));

  return (
    <section
      data-ch={idx}
      id={`ch-${idx}`}
      className="scroll-mt-[calc(48px+44svh+38px)] border-t border-[var(--line-strong)] px-5 py-12 sm:px-10 lg:scroll-mt-16 lg:px-14 lg:py-16"
    >
      {/* chapter head + body — the number is a margin figure,
          the column reads beside it on every screen size */}
      <div className="mt-7 flex items-start gap-4 sm:gap-6">
        <span className="mono w-[44px] shrink-0 pt-0.5 text-right text-[34px] font-semibold leading-none tracking-tight text-signal sm:w-[64px] sm:text-[56px]">
          {ch.no}
        </span>

        <div className="min-w-0 flex-1">
          <p className="label">{ch.kicker}</p>
          <h2 className="disp mt-1.5 text-[24px] font-bold uppercase leading-[1.02] text-ink sm:text-[32px]">
            {ch.title}
          </h2>

          {/* body — verbatim from the report */}
          <div className="mt-5 max-w-2xl space-y-4 sm:mt-6">
            {ch.body.map((p, i) => (
              <p key={i} className={`read ${i === 0 ? "text-[15.5px] text-ink" : ""}`}>
                {p}
              </p>
            ))}

            {/* facts — printed as footnotes */}
            {ch.facts.length > 0 && (
              <div className="mt-8 space-y-2.5">
                <p className="label">FIELD NOTES</p>
                {ch.facts.map((f, i) => (
                  <div
                    key={i}
                    className="border-l-2 bg-[var(--paper-2)] px-4 py-3"
                    style={{ borderColor: EPI_COLORS[f.epistemic] }}
                  >
                    <span
                      className="mono mb-1 block text-[8.5px] font-semibold tracking-[0.16em]"
                      style={{ color: EPI_COLORS[f.epistemic] }}
                    >
                      {EPI_LABEL[f.epistemic]}
                    </span>
                    <p className="text-[13px] leading-relaxed text-ink-2">{f.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* entities in focus — tap to inspect on the plate */}
            {focus.length > 0 && (
              <div className="mt-8">
                <p className="label mb-2">ENTITIES IN THIS CHAPTER — TAP TO INSPECT</p>
                <div className="flex flex-wrap gap-1.5">
                  {focus.map((id) => {
                    const n = cf.nodes.find((m) => m.id === id);
                    if (!n) return null;
                    return (
                      <button
                        key={id}
                        className="chip cursor-pointer gap-1.5 transition-colors hover:border-ink hover:text-ink"
                        onClick={() => selectNode(id)}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: NODE_COLORS[n.kind] }}
                        />
                        {n.short}
                        <span className="text-faint">{KIND_LABEL[n.kind]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── the end matter ────────────────────────────────────────── */
function CaseEnd({ cf }: { cf: CaseFile }) {
  const home = useStore((s) => s.home);
  const setOverlay = useStore((s) => s.setOverlay);
  return (
    <footer className="border-t border-[var(--line-strong)] px-5 py-14 sm:px-10 lg:px-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label">END OF FILE · {cf.id}</p>
          <p className="mono mt-2 text-[10.5px] tracking-[0.14em] text-mute">
            {cf.stats.entities} ENTITIES · {cf.stats.hops} LINKS · {cf.chapters.length} CHAPTERS ·
            ALL FIGURES VERBATIM FROM THE REPORT
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => setOverlay("report")}>
            CASE FILE ▸
          </button>
          <button className="btn btn-gold" onClick={home}>
            ← THE INDEX
          </button>
        </div>
      </div>
    </footer>
  );
}
