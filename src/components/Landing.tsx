"use client";

import { useStore, reviewedPct } from "@/lib/store";
import { CASES } from "@/lib/case-data";
import type { CaseFile } from "@/lib/types";
import { TUNE } from "@/lib/edition";

/* ── v17 landing — THE DRAWER ────────────────────────────────
   every landing before this one was a page you SCROLLED: a
   hero block, then a vertical list of files. v17 has no hero
   and no list. the archive opens as a drawer of full-height
   case DOORS — the first screen IS the archive. two files
   side by side on desktop (pull the folder you want), stacked
   full-height on mobile. zero canvas, zero particles, zero
   observers, zero count-ups. the only motion is staggered
   CSS entrances and one 160ms hover flood. */

/* per-case door chrome — tag + drawdown are report facts */
const DOOR_META: Record<string, { tag: string; fill?: boolean; drawdown: string }> = {
  "R-0905": { tag: "LATEST", fill: true, drawdown: "−99.3% FROM PEAK" },
  "S-0830": { tag: "ARCHIVED", drawdown: "−98.8% FROM PEAK" },
};

/* ── one door = one case file. the WHOLE DOOR is the button. ── */
function Door({ cf, no, total }: { cf: CaseFile; no: number; total: number }) {
  const openCase = useStore((s) => s.openCase);
  const visited = useStore((s) => s.visited);
  const pct = reviewedPct({ visited, caseFile: cf });
  const meta = DOOR_META[cf.id] ?? { tag: "DECLASSIFIED", drawdown: "" };

  return (
    <button
      onClick={() => openCase(cf.id)}
      aria-label={`Open case file ${cf.id} — ${cf.codename}`}
      className={`door-flip group relative flex min-h-[92svh] w-full shrink-0 flex-col justify-between overflow-hidden p-6 text-left sm:p-10 md:min-h-0 md:w-auto md:flex-1 md:p-8 lg:p-12 ${
        no < total ? "border-b border-[var(--line-strong)] md:border-b-0 md:border-r" : ""
      }`}
    >
      {/* watermark numeral — hollow print stroke */}
      <span
        aria-hidden
        className="stroke-num pointer-events-none absolute -bottom-[3vw] right-2 select-none font-bold leading-none md:-bottom-[1.5vw] md:right-6"
        style={{ fontSize: "clamp(140px, 24vw, 340px)" }}
      >
        {String(no).padStart(2, "0")}
      </span>

      {/* top — file index + status */}
      <div
        className="arrive relative flex items-center justify-between gap-3"
        style={{ "--d": "80ms" } as React.CSSProperties}
      >
        <span className="mono text-[11px] font-semibold tracking-[0.22em] text-signal group-hover:text-[var(--paper)]">
          FILE {String(no).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span
          className={
            meta.fill
              ? "tag tag-fill"
              : "tag group-hover:border-[var(--paper)] group-hover:text-[var(--paper)]"
          }
        >
          {meta.tag}
        </span>
      </div>

      {/* middle — the name */}
      <div className="relative py-12 md:py-8">
        <p
          className="label arrive group-hover:text-[var(--paper)]"
          style={{ "--d": "160ms" } as React.CSSProperties}
        >
          {cf.status}
        </p>
        <h2
          className="disp arrive mt-2 font-bold uppercase leading-[0.85] text-ink group-hover:text-[var(--paper)]"
          style={{ "--d": "220ms", fontSize: "clamp(56px, 10vw, 148px)" } as React.CSSProperties}
        >
          {cf.codename}
        </h2>
        <p
          className="mono arrive mt-4 text-[10.5px] tracking-[0.16em] text-mute group-hover:text-[var(--paper)]"
          style={{ "--d": "300ms" } as React.CSSProperties}
        >
          {cf.id} · {cf.chains.join(" / ").toUpperCase()} · {cf.span.toUpperCase()}
        </p>
        <p
          className="read arrive mt-5 max-w-md text-[14px] group-hover:text-[var(--paper)]"
          style={{ "--d": "360ms" } as React.CSSProperties}
        >
          {cf.summary}
        </p>
      </div>

      {/* bottom — the measured footprint (this file's own numbers) */}
      <div className="arrive relative" style={{ "--d": "440ms" } as React.CSSProperties}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t border-[var(--line-strong)] pt-4">
          <div>
            {cf.amountLabel && (
              <p className="label group-hover:text-[var(--paper)]">{cf.amountLabel}</p>
            )}
            <p className="mono mt-1 text-[24px] font-semibold tabular-nums text-signal group-hover:text-[var(--paper)]">
              {cf.amountUsd}
            </p>
          </div>
          {meta.drawdown && (
            <p className="mono pb-1 text-[9.5px] tracking-[0.14em] text-mute group-hover:text-[var(--paper)]">
              {meta.drawdown}
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 border-t border-dashed border-[var(--line-strong)] pt-4">
          {[
            [cf.stats.entities, "ENT"],
            [cf.stats.hops, "LINKS"],
            [cf.chapters.length, "CH"],
            [100, "% LOCAL"],
          ].map(([v, l]) => (
            <div key={l as string}>
              <p className="mono text-[16px] font-semibold tabular-nums text-ink group-hover:text-[var(--paper)]">
                {v}
              </p>
              <p className="label mt-0.5 group-hover:text-[var(--paper)]">{l}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="mono text-[11px] font-semibold tracking-[0.18em] text-signal group-hover:text-[var(--paper)]">
            OPEN FILE →
          </span>
          <span className="mono text-[9.5px] tracking-[0.14em] text-faint group-hover:text-[var(--paper)]">
            {pct === 0 ? "UNOPENED" : `${pct}% REVIEWED`}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function Landing() {
  return (
    <div className="relative min-h-[100svh] overflow-x-clip bg-background text-foreground">
      {/* ── header — overlay bar ── */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-12 items-center justify-between border-b border-[var(--line)] bg-[var(--paper)] px-4 sm:px-8">
        <div className="flex items-baseline gap-5">
          <span className="mono text-[11px] font-semibold tracking-[0.3em] text-ink">
            TARAONCHAIN<span className="text-signal">®</span>
          </span>
          <span className="label hidden md:inline">
            ON-CHAIN FORENSICS · INDEPENDENT CASE ARCHIVE
          </span>
        </div>
        <span className="chip">{TUNE.chip}</span>
      </header>

      {/* ── the drawer — doors fill the first screen on desktop ── */}
      <div className="relative mx-auto flex w-full flex-col pb-0 pt-12 md:h-[100svh] md:max-w-[1600px] md:flex-row md:pb-0">
        {CASES.map((c, i) => (
          <Door key={c.id} cf={c} no={i + 1} total={CASES.length} />
        ))}

        {/* center spine — the divide doubles as the promise line */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block"
        >
          <span className="mono inline-block border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-[9px] tracking-[0.22em] text-ink-3">
            SELECT A FILE · READS ENTIRELY LOCAL
          </span>
        </div>
      </div>

      {/* ── mobile privacy strip (desktop carries it on the spine) ── */}
      <footer className="border-t border-[var(--line)] px-5 py-7 md:hidden">
        <p className="label">NO ACCOUNT · NO DATABASE · NO ANALYTICS</p>
        <p className="mono mt-2 text-[9.5px] leading-relaxed tracking-[0.08em] text-faint">
          THIS BUILD READS ITS CASE DATA FROM THE BUNDLE ON YOUR DEVICE. THE
          ONLY NETWORK REQUEST IS THE ONE THAT FETCHED THIS PAGE.
        </p>
        <p className="mono mt-4 text-[9.5px] tracking-[0.18em] text-mute">
          TARAONCHAIN · {TUNE.chip} · SINGLE BUILD · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
