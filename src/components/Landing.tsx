"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore, reviewedPct } from "@/lib/store";
import { CASES } from "@/lib/case-data";
import type { CaseFile } from "@/lib/types";
import { TUNE } from "@/lib/edition";

/* ── v19 landing — THE READING ROOM ──────────────────────────
   v13/14 was a terminal with a particle word, v15/16 a paper
   index of rows, v17 a drawer of doors, v18 kept all of that.
   every one of them put the WHOLE archive on screen at once.

   v19 is a dark reading room with no hero and no list: the
   lamp is on, and ONE case file lies on the bench — its name,
   its story, its measured footprint. the next file waits at
   the right edge of the desk; pull it (edge tab / swipe /
   arrows / the switcher) and it slides under the lamp while
   the current one slides away. the stamp slams once per pull,
   then the room is still.

   zero canvas, zero particles, zero observers, zero count-ups.
   the only motion: one transform on the track, staggered CSS
   entrances, one stamp slam. */

/* per-file chrome — stamp + drawdown are report facts */
const FILE_META: Record<string, { stamp: string; fill?: boolean; drawdown: string }> = {
  "R-0905": { stamp: "CLOSED", fill: true, drawdown: "−99.3% FROM PEAK" },
  "S-0830": { stamp: "ARCHIVED", drawdown: "−98.8% FROM PEAK" },
};

/* ── one plate = one case file under the lamp ─────────────── */
function FilePlate({ cf, no, total }: { cf: CaseFile; no: number; total: number }) {
  const openCase = useStore((s) => s.openCase);
  const visited = useStore((s) => s.visited);
  const pct = reviewedPct({ visited, caseFile: cf });
  const meta = FILE_META[cf.id] ?? { stamp: "DECLASSIFIED", drawdown: "" };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1200px] flex-col px-5 py-8 sm:px-10 sm:py-10 lg:px-20">
      {/* row 1 — file index + the stamp (mt-auto = safe centering:
          centers when there's room, scrolls when there isn't) */}
      <div
        className="arrive mt-auto flex items-center justify-between gap-4"
        style={{ "--d": "60ms" } as React.CSSProperties}
      >
        <p className="mono text-[11px] font-semibold tracking-[0.24em] text-signal">
          FILE {String(no).padStart(2, "0")} / {String(total).padStart(2, "0")} · {cf.id}
        </p>
        <span
          key={`${cf.id}-stamp`}
          className={`stamp stamp-slam ${meta.fill ? "stamp-fill" : ""}`}
        >
          {meta.stamp}
        </span>
      </div>

      {/* row 2 — the name */}
      <h2
        className="arrive disp mt-3 font-black uppercase leading-[0.86] text-ink sm:mt-4"
        style={{ "--d": "140ms", fontSize: "clamp(58px, 11vw, 176px)" } as React.CSSProperties}
      >
        {cf.codename}
      </h2>
      <p
        className="mono arrive mt-2.5 text-[10px] tracking-[0.16em] text-mute sm:mt-3 sm:text-[10.5px]"
        style={{ "--d": "220ms" } as React.CSSProperties}
      >
        {cf.chains.join(" / ").toUpperCase()} · {cf.span.toUpperCase()} · UNIT{" "}
        {cf.unit ?? "ETH"}
        {meta.drawdown ? ` · ${meta.drawdown}` : ""}
      </p>

      {/* row 3 — the abstract, two measured columns on a wide desk */}
      <div className="hairline-t mt-5 pt-5 sm:mt-6 sm:pt-6">
        <p
          className="read arrive max-w-[1080px] text-[15px] sm:text-[15.5px] lg:columns-2 lg:gap-14"
          style={{ "--d": "300ms" } as React.CSSProperties}
        >
          {cf.summary}
        </p>
      </div>

      {/* row 4 — the measured footprint (this file's own numbers) */}
      <div
        className="arrive mt-6 grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-5"
        style={{ "--d": "380ms" } as React.CSSProperties}
      >
        {(
          [
            [cf.stats.entities, "ENTITIES"],
            [cf.stats.hops, "LINKS"],
            [cf.chapters.length, "CHAPTERS"],
            [cf.unit ?? "ETH", "UNIT"],
            [cf.amountUsd, "PEAK"],
          ] as [string | number, string][]
        ).map(([v, l]) => (
          <div key={l} className="bg-[var(--paper)] px-3.5 py-3">
            <p
              className={`mono text-[15px] font-semibold tabular-nums ${
                l === "PEAK" ? "text-signal" : "text-ink"
              }`}
            >
              {v}
            </p>
            <p className="label mt-1">{l}</p>
          </div>
        ))}
      </div>

      {/* row 5 — pull the file */}
      <div
        className="arrive mb-auto mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-7"
        style={{ "--d": "460ms" } as React.CSSProperties}
      >
        <button
          onClick={() => openCase(cf.id)}
          className="btn btn-gold w-full sm:w-auto sm:min-w-[280px]"
          aria-label={`Open case file ${cf.id} — ${cf.codename}`}
        >
          OPEN FILE →
        </button>
        <div className="min-w-0">
          {cf.amountLabel && <p className="label">{cf.amountLabel}</p>}
          <p className="mono mt-1.5 text-[9.5px] tracking-[0.14em] text-faint">
            {pct === 0 ? "UNOPENED ON THIS DEVICE" : `${pct}% REVIEWED ON THIS DEVICE`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [idx, setIdx] = useState(0);
  const total = CASES.length;

  const go = useCallback(
    (n: number) => setIdx(((n % total) + total) % total),
    [total],
  );

  /* keyboard — ← → walk the archive */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % total);
      else if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + total) % total);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  /* swipe — pull the next file off the desk edge */
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      setIdx((i) => (dx < 0 ? (i + 1) % total : (i - 1 + total) % total));
    }
  };

  const next = CASES[(idx + 1) % total];
  const prev = CASES[(idx - 1 + total) % total];

  return (
    <div className="relative flex h-[100svh] flex-col overflow-hidden bg-background text-foreground">
      {/* ── top chrome — the room's signage ── */}
      <header className="hairline-b z-30 flex h-12 shrink-0 items-center justify-between gap-3 bg-[var(--paper)] px-4 sm:px-8">
        <div className="flex min-w-0 items-baseline gap-5">
          <span className="mono shrink-0 text-[11px] font-semibold tracking-[0.3em] text-ink">
            TARAONCHAIN<span className="text-signal">®</span>
          </span>
          <span className="label hidden truncate md:inline">
            CASE ARCHIVE · ON-CHAIN FORENSICS · THE READING ROOM
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="mono hidden items-center gap-2 text-[9px] tracking-[0.18em] text-mute sm:flex">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--moss)" }}
            />
            LOCAL READ
          </span>
          <span className="chip">{TUNE.chip}</span>
        </div>
      </header>

      {/* ── the stage — one file under the lamp ── */}
      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => (swipe.current = null)}
      >
        <div className="lamp-glow absolute inset-0" aria-hidden />

        <div
          className="rr-track"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {CASES.map((c, i) => (
            <div
              className="rr-slide h-full overflow-y-auto overscroll-contain slim-scroll"
              key={c.id}
              inert={i !== idx || undefined}
              aria-hidden={i !== idx}
            >
              <FilePlate cf={c} no={i + 1} total={total} />
            </div>
          ))}
        </div>

        {/* the next file waits at the desk edge — pull it (desktop) */}
        <button
          onClick={() => go(idx + 1)}
          className="edge-tab absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer items-center border-y border-l border-[var(--line-strong)] bg-[var(--paper-2)] px-3 py-7 transition-colors hover:border-signal hover:text-signal lg:flex"
          title={`Pull the next file — ${next.codename}`}
        >
          <span className="mono text-[9px] tracking-[0.24em] text-mute">
            NEXT FILE · {next.codename} →
          </span>
        </button>

        {/* …and the previous one sits on the left edge */}
        <button
          onClick={() => go(idx - 1)}
          className="edge-tab absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer items-center border-y border-r border-[var(--line-strong)] bg-[var(--paper-2)] px-3 py-7 transition-colors hover:border-signal hover:text-signal lg:flex"
          title={`Pull — ${prev.codename}`}
        >
          <span className="mono text-[9px] tracking-[0.24em] text-mute">
            ← {prev.codename}
          </span>
        </button>
      </div>

      {/* ── the switcher — 01 / 02 with names ── */}
      <nav
        className="hairline-t z-30 flex h-14 shrink-0 items-center justify-between gap-3 bg-[var(--paper)] px-3 sm:px-8"
        aria-label="Case files"
      >
        <button
          onClick={() => go(idx - 1)}
          className="mono flex h-10 min-w-0 items-center gap-2 px-2 text-[9.5px] tracking-[0.18em] text-faint transition-colors hover:text-ink"
          title="Previous file"
        >
          <span className="text-[13px] leading-none">‹</span>
          <span className="hidden min-w-0 truncate sm:inline">{prev.codename}</span>
        </button>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          {CASES.map((c, i) => {
            const active = i === idx;
            return (
              <button
                key={c.id}
                onClick={() => go(i)}
                aria-current={active}
                className="mono relative flex h-10 items-center gap-2 px-2.5 text-[10px] tracking-[0.16em] transition-colors sm:px-3"
                style={{ color: active ? "var(--ink)" : "var(--faint)" }}
              >
                <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span
                  className={`hidden sm:inline ${active ? "font-semibold" : ""}`}
                >
                  {c.codename}
                </span>
                {active && (
                  <span className="absolute inset-x-2 bottom-1.5 h-[2px] bg-signal" />
                )}
              </button>
            );
          })}
          <span className="mono ml-2 hidden text-[8.5px] tracking-[0.2em] text-faint lg:inline">
            ← → OR SWIPE
          </span>
        </div>

        <button
          onClick={() => go(idx + 1)}
          className="mono flex h-10 min-w-0 items-center gap-2 px-2 text-[9.5px] tracking-[0.18em] text-faint transition-colors hover:text-ink"
          title="Next file"
        >
          <span className="hidden min-w-0 truncate sm:inline">{next.codename}</span>
          <span className="text-[13px] leading-none">›</span>
        </button>
      </nav>

      {/* ── the bench footer ── */}
      <footer className="hairline-t hidden shrink-0 items-center justify-between bg-[var(--paper)] px-8 py-2.5 md:flex">
        <p className="mono text-[8.5px] tracking-[0.2em] text-mute">
          NO ACCOUNT · NO DATABASE · NO ANALYTICS
        </p>
        <p className="mono text-[8.5px] tracking-[0.14em] text-faint">
          THE ONLY NETWORK REQUEST IS THE ONE THAT FETCHED THIS PAGE
        </p>
        <p className="mono text-[8.5px] tracking-[0.2em] text-mute">
          TARAONCHAIN · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
