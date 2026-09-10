"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { EPI_COLORS, EPI_LABEL, NODE_COLORS, KIND_LABEL } from "@/lib/palette";

/* ── chapter sheet — v15: the reading column ─────────────────
   desktop: permanent RIGHT column on paper. paragraphs arrive
   with the plotter wipe. facts are printed as footnotes — a
   coloured rule, a small caps tag, plain paper behind.
   mobile: drag-snap bottom sheet (peek 132 / 48dvh / 88dvh),
   same content, same snap physics as v13. */

const PEEK = 132;

export default function ChapterSheet() {
  const cf = useStore((s) => s.caseFile);
  const chapter = useStore((s) => s.chapter);
  const setChapter = useStore((s) => s.setChapter);
  const next = useStore((s) => s.nextChapter);
  const prev = useStore((s) => s.prevChapter);
  const selected = useStore((s) => s.selectedNodeId);

  const [snap, setSnap] = useState<0 | 1 | 2>(0);
  const [dragY, setDragY] = useState<number | null>(null);
  const [vh, setVh] = useState(800);
  const startY = useRef(0);
  const drag = useRef(false);
  const moved = useRef(false);

  useEffect(() => {
    const onR = () => setVh(window.innerHeight);
    onR();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  useEffect(() => {
    setSnap(0);
    setDragY(null);
  }, [chapter]);

  const heights = [PEEK, Math.round(vh * 0.48), Math.round(vh * 0.88)];
  const ch = cf.chapters[chapter];
  const expanded = snap >= 1;

  const onDown = (e: React.PointerEvent) => {
    if (window.innerWidth >= 1024) return;
    if ((e.target as HTMLElement).closest("button")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startY.current = e.clientY;
    drag.current = true;
    moved.current = false;
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dy = e.clientY - startY.current;
    if (Math.abs(dy) > 6) moved.current = true;
    /* clamp must stay wider than the ±snap thresholds (−48 / +62) or
       the rubber-band eats the gesture */
    setDragY(Math.max(-120, Math.min(240, dy)));
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = false;
    if (dragY !== null) {
      if (dragY > 62) setSnap((s) => Math.max(0, s - 1) as 0 | 1 | 2);
      else if (dragY < -48) setSnap((s) => Math.min(2, s + 1) as 0 | 1 | 2);
    }
    setDragY(null);
  };

  return (
    <>
      {/* ══ mobile sheet ══ */}
      <div
        className={`t4-spring absolute inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-[14px] border-t lg:hidden ${selected ? "pointer-events-none translate-y-full" : ""}`}
        style={{
          height: heights[snap],
          background: "var(--paper-2)",
          borderColor: "var(--line-strong)",
          boxShadow: "0 -14px 48px rgba(23, 21, 14, 0.16)",
          transform:
            dragY !== null ? `translateY(${dragY * 0.55}px)` : undefined,
          transition: dragY !== null ? "none" : undefined,
        }}
      >
        {/* drag handle + header */}
        <div
          className="shrink-0 cursor-grab touch-none select-none px-4 pb-3 pt-2 active:cursor-grabbing"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onClick={() => {
            if (!moved.current && snap === 0) setSnap(1);
          }}
        >
          <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-[rgba(23,21,14,0.25)]" />
          <div className="flex items-center gap-2">
            <span className="mono shrink-0 text-[10px] font-semibold tracking-[0.2em] text-signal">
              CH {ch.no}
            </span>
            <span className="label flex-1 truncate text-center">
              {snap === 0 ? "SWIPE ↑ TO READ" : ""}
            </span>
            {/* chapter stepper on the sheet itself: switchable
                while reading, thumb-reachable, no trip to the top bar */}
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => prev()}
                disabled={chapter === 0}
                aria-label="Previous chapter"
                className="mono flex h-8 w-8 items-center justify-center border text-[13px] transition-colors disabled:opacity-30"
                style={{
                  borderColor: "var(--line-strong)",
                  color: chapter === 0 ? "var(--faint)" : "var(--ink)",
                  background: "var(--paper)",
                }}
              >
                ‹
              </button>
              <span className="mono w-9 text-center text-[10px] tabular-nums text-mute">
                {chapter + 1}/{cf.chapters.length}
              </span>
              <button
                onClick={() => next()}
                disabled={chapter === cf.chapters.length - 1}
                aria-label="Next chapter"
                className="mono flex h-8 w-8 items-center justify-center border text-[13px] transition-colors disabled:opacity-30"
                style={{
                  borderColor: "var(--line-strong)",
                  color:
                    chapter === cf.chapters.length - 1 ? "var(--faint)" : "var(--ink)",
                  background: "var(--paper)",
                }}
              >
                ›
              </button>
            </div>
          </div>
          <p className="label mt-1.5 truncate">{ch.kicker}</p>
          <h3 className="disp mt-0.5 truncate text-[18px] font-semibold text-ink">
            {ch.title}
          </h3>
        </div>

        {/* expandable body */}
        {snap > 0 && (
          <ChapterBody cf={cf} chapter={chapter} active={expanded} mobile />
        )}
      </div>

      {/* ══ desktop column — the reading sheet, right side ══ */}
      <aside className="hairline-l slim-scroll absolute bottom-0 right-0 top-12 z-20 hidden w-[418px] shrink-0 flex-col overflow-y-auto bg-[var(--paper-2)] lg:flex">
        <div className="px-6 pb-4 pt-6">
          <div className="flex flex-wrap gap-1">
            {cf.chapters.map((c, i) => {
              const active = i === chapter;
              return (
                <button
                  key={c.id}
                  onClick={() => setChapter(i)}
                  className="mono relative flex h-8 items-center px-2 text-[10px] tracking-[0.1em] transition-colors"
                  style={{ color: active ? "var(--ink)" : "var(--faint)" }}
                  title={c.title}
                >
                  {c.no}
                  {active && (
                    <span className="absolute inset-x-1 bottom-1 h-[2px] bg-signal" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 h-px w-full bg-[var(--line)]" />
        </div>

        <div className="px-7 pb-6 pt-2">
          <p className="label">{ch.kicker}</p>
          <h3 className="disp mt-1.5 text-[27px] font-semibold leading-tight text-ink">
            {ch.title}
          </h3>
          <ChapterBody cf={cf} chapter={chapter} active desktop />
        </div>

        <div className="mt-auto flex gap-2 px-7 pb-7 pt-2">
          <button
            className="btn btn-ghost flex-1"
            onClick={prev}
            disabled={chapter === 0}
          >
            ‹ PREV
          </button>
          <button
            className="btn btn-gold flex-1"
            onClick={next}
            disabled={chapter === cf.chapters.length - 1}
          >
            NEXT ▸
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── shared body ── */
function ChapterBody({
  cf,
  chapter,
  active,
  mobile = false,
  desktop = false,
}: {
  cf: ReturnType<typeof useStore.getState>["caseFile"];
  chapter: number;
  active: boolean;
  mobile?: boolean;
  desktop?: boolean;
}) {
  const ch = cf.chapters[chapter];
  const selectNode = useStore((s) => s.selectNode);
  const nodeIds = new Set(cf.nodes.map((n) => n.id));
  const focus = ch.focus.filter((f) => nodeIds.has(f));

  return (
    <div
      className={`slim-scroll flex-1 px-4 pb-8 ${mobile ? "overflow-y-auto pt-1" : "overflow-visible px-0 pt-5"}`}
    >
      {ch.body.map((p, i) => (
        <Wipe key={i} active={active} delay={i * 140}>
          <p className={`read ${mobile ? "" : "text-[15px]"}`}>{p}</p>
        </Wipe>
      ))}

      {/* facts — printed as footnotes: rule + small caps tag */}
      {ch.facts.length > 0 && (
        <div className="mt-6 space-y-2.5">
          <p className="label">FIELD NOTES</p>
          {ch.facts.map((f, i) => (
            <Wipe key={i} active={active} delay={ch.body.length * 140 + i * 80}>
              <div
                className="border-l-2 px-3.5 py-2.5"
                style={{
                  borderColor: EPI_COLORS[f.epistemic],
                  background: "var(--paper)",
                }}
              >
                <span
                  className="mono mb-1 block text-[8.5px] font-semibold tracking-[0.16em]"
                  style={{ color: EPI_COLORS[f.epistemic] }}
                >
                  {EPI_LABEL[f.epistemic]}
                </span>
                <p className="text-[12.5px] leading-relaxed text-bone">{f.text}</p>
              </div>
            </Wipe>
          ))}
        </div>
      )}

      {/* focus entities */}
      {focus.length > 0 && (
        <div className="mt-7">
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

      {mobile && (
        <p className="label mt-7 text-center">— END OF CHAPTER {ch.no} —</p>
      )}
    </div>
  );
}

/* v15 arrival — clip-path wipe, never covers, always lands visible */
function Wipe({
  active,
  delay,
  children,
}: {
  active: boolean;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`wipe ${active ? "on" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
