"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { EpiChip } from "@/components/ui/bits";
import { spawnRipple } from "@/components/ui/bits";
import { Icon } from "@/components/ui/icons";
import { Scramble } from "./Scramble";
import { Odometer } from "./Odometer";

/* ── dossier — v4 compact case file ───────────────────────────
   the v3 dossier read like one tall wall — too huge on a phone.
   v4 keeps every verbatim word but stages it:
   · progressive disclosure — the lede paragraph first, the rest
     of the section unfolds behind a READ FULL SECTION control
     (animated with the t4-expand grid row)
   · mobile — the dossier is a drag sheet over the trace: peek
     (title + transport bar), half (lede + facts), full (whole
     section). drag the handle, tap it to toggle, chapters still
     walk from the peek bar
   · desktop — same compact reading as the side column. */

const PEEK = 148; // px — the collapsed sheet bar (handle + title + transport)

export function DossierColumn({ variant = "column" }: { variant?: "sheet" | "column" }) {
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

  /* progressive disclosure — collapse again when the chapter turns */
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(false);
  }, [chapter]);

  /* sheet snap states: 0 = peek · 1 = half · 2 = full */
  const [snap, setSnap] = useState(0);
  const [dragH, setDragH] = useState<number | null>(null);
  const dragStart = useRef({ y: 0, h: 0 });
  const hostRef = useRef<HTMLDivElement>(null);

  const snapPx = (s: number) => (s === 0 ? PEEK : s === 1 ? Math.round(window.innerHeight * 0.46) : Math.round(window.innerHeight * 0.8));

  const onHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    const host = hostRef.current;
    if (!host) return;
    dragStart.current = { y: e.clientY, h: host.getBoundingClientRect().height };
    setDragH(dragStart.current.h);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragH === null) return;
    setDragH(Math.max(PEEK, dragStart.current.h - (e.clientY - dragStart.current.y)));
  };
  const onHandleUp = () => {
    if (dragH === null) return;
    const nearest = [0, 1, 2].reduce((a, b) => (Math.abs(snapPx(b) - dragH) < Math.abs(snapPx(a) - dragH) ? b : a));
    setSnap(nearest);
    setDragH(null);
  };
  const tapHandle = () => setSnap((s) => (s === 0 ? 1 : 0));

  const rest = ch.body.slice(1);

  /* keep the reading head at the top of the new chapter */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [chapter]);

  const sheetHeight =
    variant === "sheet" ? (dragH !== null ? dragH : snapPx(snap)) : undefined;

  return (
    <aside
      ref={hostRef}
      aria-label="case dossier"
      className={`flex min-h-0 flex-col overflow-hidden ${
        variant === "sheet"
          ? "rounded-t-[12px] border-t"
          : "t4-spring relative z-30 flex-1 border-t lg:border-t-0 lg:border-l"
      }`}
      style={{
        borderColor: "var(--line-strong)",
        background: "rgba(20, 16, 11, 0.92)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        ...(variant === "sheet"
          ? {
              height: sheetHeight,
              transition: dragH !== null ? "none" : "height 0.46s cubic-bezier(0.32, 0.72, 0.24, 1.08)",
              boxShadow: "0 -14px 44px rgba(4,6,9,0.6)",
            }
          : {}),
      }}
    >
      {/* drag handle — sheet only */}
      {variant === "sheet" && (
        <div
          aria-hidden
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          onClick={tapHandle}
          className="t4-nudge shrink-0 cursor-grab touch-none pt-2 pb-1.5"
        >
          <span className="mx-auto block h-1 w-11 rounded-full" style={{ background: "var(--line-strong)" }} />
        </div>
      )}

      {/* peek bar: kicker + title + transport — always visible */}
      <div className="shrink-0 px-4 pt-0.5 sm:px-5 lg:pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="datum text-[10px] font-medium" style={{ color: "var(--assess)" }}>
            {ch.no} / {String(total).padStart(2, "0")}
          </span>
          <span className="label !text-[8.5px]" style={{ color: "var(--ink-faint)" }}>
            {variant === "sheet" ? (snap === 0 ? "TAP TO READ" : "DECLASSIFYING") : "DECLASSIFYING"}
            <span
              className="t3-caret ml-1 inline-block h-[9px] w-[5px] translate-y-[1px]"
              style={{ background: "var(--assess)" }}
            />
          </span>
        </div>

        <p className="datum mt-1.5 text-[10.5px] tracking-[0.12em]" style={{ color: "var(--ink-mute)" }}>
          <Scramble text={ch.kicker.toUpperCase()} delay={120} />
        </p>

        <h2
          className="disp mt-1 font-semibold leading-snug"
          style={{ color: "var(--ink)", fontSize: variant === "sheet" ? 17 : 20 }}
        >
          {ch.title}
        </h2>
      </div>

      {/* body — unfolds below the peek bar (peek keeps it closed) */}
      <div
        ref={scrollRef}
        className="slim-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3 sm:px-5"
        style={variant === "sheet" && snap === 0 && dragH === null ? { overflow: "hidden", opacity: 0.001, pointerEvents: "none" } : undefined}
      >
        <div key={ch.id} className="t3-card-in">
          <div className="doc flex flex-col gap-2.5 text-[15px] leading-[1.62]" style={{ color: "var(--ink-mute)" }}>
            <p>{ch.body[0]}</p>
            {rest.length > 0 && (
              <div className="t4-expand" style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}>
                <div>
                  <div className="flex flex-col gap-2.5 pb-1">
                    {rest.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {rest.length > 0 && (
            <button
              onClick={(e) => {
                spawnRipple(e);
                setExpanded((v) => !v);
              }}
              className="t4-ripple-host label mt-2.5 inline-flex min-h-9 items-center gap-1.5 border px-2.5 transition-colors"
              style={{ borderColor: "var(--line-strong)", color: expanded ? "var(--ink)" : "var(--assess)" }}
            >
              <Icon name={expanded ? "close" : "arrow-right"} size={11} />
              {expanded ? "COLLAPSE SECTION" : `READ FULL SECTION · +${rest.length} ¶`}
            </button>
          )}

          {/* facts stamp in one by one — single row, thumb-scrollable on sheets */}
          <div
            className={`mt-3.5 flex gap-1.5 ${variant === "sheet" ? "flex-nowrap overflow-x-auto slim-scroll pb-1" : "flex-wrap"}`}
          >
            {ch.facts.map((f, i) => (
              <span key={i} className="t3-stamp inline-flex shrink-0" style={{ animationDelay: `${250 + i * 110}ms` }}>
                <EpiChip e={f.epistemic} text={f.text} />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* transport + momentum — reachable even from the peek bar */}
      <div
        className="shrink-0 border-t px-4 py-2.5 sm:px-5"
        style={{ borderColor: "var(--line)", background: "rgba(17, 13, 8, 0.8)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button className="btn btn-ghost !min-h-10 !px-3" onClick={(e) => { spawnRipple(e); prevChapter(); }} disabled={chapter === 0} aria-label="previous chapter">
              <Icon name="arrow-left" size={14} />
            </button>
            <button className="btn btn-ghost !min-h-10 !px-3" onClick={(e) => { spawnRipple(e); nextChapter(); }} disabled={last} aria-label="next chapter">
              <Icon name="arrow-right" size={14} />
            </button>
            <span className="label ml-1 hidden !text-[8.5px] sm:inline" style={{ color: "var(--ink-faint)" }}>
              CH {String(chapter + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
            </span>
          </div>
          <span className="flex items-baseline gap-1.5">
            <Odometer value={pct} suffix="%" className="disp text-[15px] font-semibold" style={{ color: "var(--assess)" }} />
            <span className="label !text-[8px]" style={{ color: "var(--ink-faint)" }}>REVIEWED</span>
          </span>
        </div>

        {last && (
          <button
            className="btn btn-primary pulse-cta mt-2.5 w-full !justify-center !py-3 !text-[11px]"
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
