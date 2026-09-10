"use client";

import { useRef } from "react";
import { useStore, reviewedPct } from "@/lib/store";
import { CASES } from "@/lib/case-data";
import type { CaseFile } from "@/lib/types";
import { TUNE } from "@/lib/edition";
import HalftoneField from "./fx/HalftoneField";
import { useInView, useCountUp } from "./fx/Reveal";

/* ── v15 landing — THE INDEX ─────────────────────────────────
   the archive is now a printed index: warm paper, ruled
   hairlines, serif case names, one vermilion signal. the
   halftone field keeps the page alive between readings —
   touch it and the ink answers. every case is one row of
   the index; the whole row opens the file. stats stay
   welded to their case (v14 rule), measured per file. */

/* per-case card chrome — the one drawdown line + index tag.
   both lines are report facts, keyed by case id. */
const CARD_META: Record<
  string,
  { tag: string; fill?: boolean; drawdown: string }
> = {
  "R-0905": { tag: "LATEST", fill: true, drawdown: "−99.3% FROM PEAK" },
  "S-0830": { tag: "ARCHIVED", drawdown: "−98.8% FROM PEAK" },
};

function Stat({ v, label }: { v: number; label: string }) {
  const [ref, on] = useInView<HTMLDivElement>(0.4);
  const n = useCountUp(v, on, 900);
  return (
    <div ref={ref} className="flex flex-col gap-1">
      <span className="mono text-[17px] font-semibold tabular-nums text-ink">
        {n}
      </span>
      <span className="label">{label}</span>
    </div>
  );
}

/* ── the index row — the WHOLE ROW is the button (v9 rule) ── */
function CaseRow({
  cf,
  no,
  last,
}: {
  cf: CaseFile;
  no: string;
  last?: boolean;
}) {
  const openCase = useStore((s) => s.openCase);
  const visited = useStore((s) => s.visited);
  const pct = reviewedPct({ visited, caseFile: cf });
  const meta = CARD_META[cf.id] ?? { tag: "DECLASSIFIED", drawdown: "" };

  const [ref, on] = useInView<HTMLDivElement>(0.14);
  const rowRef = useRef<HTMLButtonElement | null>(null);

  const openFile = () => openCase(cf.id);

  return (
    <div ref={ref}>
      <button
        ref={rowRef}
        onClick={openFile}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFile();
          }
        }}
        aria-label={`Open case file ${cf.id} — ${cf.codename}`}
        className={`group relative block w-full cursor-pointer text-left transition-colors duration-200 hover:bg-[var(--paper-2)] focus-visible:bg-[var(--paper-2)] ${
          last ? "" : "hairline-b"
        } ${on ? "" : "opacity-0"}`}
      >
        {/* hover tick — the signal edge */}
        <span aria-hidden className="row-tick group-hover:[transform:scaleY(1)]" />

        <div className="wipe on px-1 py-7 sm:px-2 sm:py-9" style={{ "--d": "80ms" } as React.CSSProperties}>
          {/* index line */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="mono text-[10px] font-semibold tabular-nums tracking-[0.2em] text-faint transition-colors group-hover:text-signal">
              {no}
            </span>
            <span className="label">{cf.id}</span>
            <span className={meta.fill ? "tag tag-fill" : "tag"}>{meta.tag}</span>
            <span className="label hidden sm:inline">{cf.status}</span>
            <span className="ml-auto flex items-center gap-2">
              <span className="mono text-[10px] font-semibold tracking-[0.18em] text-signal opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100">
                OPEN FILE
              </span>
              <span className="mono text-[13px] text-ink transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5">
                ↗
              </span>
            </span>
          </div>

          {/* name + verdict figures */}
          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <h2 className="disp text-[42px] font-semibold leading-[0.98] text-ink sm:text-[64px]">
                {cf.codename}
              </h2>
              <p className="mono mt-2 text-[10.5px] tracking-[0.16em] text-mute">
                {cf.chains.join(" / ").toUpperCase()} · {cf.span.toUpperCase()}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {cf.amountLabel && (
                <span className="chip border-ink text-ink">{cf.amountLabel}</span>
              )}
              <span className="chip" style={{ color: "var(--signal-deep)", borderColor: "var(--signal)" }}>
                {cf.amountUsd}
              </span>
              {meta.drawdown && (
                <span className="mono text-[10px] tracking-[0.14em]" style={{ color: "var(--signal-deep)" }}>
                  {meta.drawdown}
                </span>
              )}
            </div>
          </div>

          {/* summary — the file speaks for itself */}
          <p className="read mt-5 max-w-2xl text-[14.5px] leading-relaxed">{cf.summary}</p>

          {/* footprint — the stats belong to this file, not the page */}
          <div className="mt-6 border-t border-dashed border-[var(--line-strong)] pt-4">
            <p className="label mb-3 flex items-center gap-2">
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-signal" />
              FOOTPRINT · MEASURED FROM CASE {cf.id} — {cf.codename}
            </p>
            <div className="grid grid-cols-4 gap-3">
              <Stat v={cf.stats.entities} label="ENTITIES" />
              <Stat v={cf.stats.hops} label="LINKS" />
              <Stat v={cf.chapters.length} label="CHAPTERS" />
              <Stat v={100} label="% LOCAL" />
            </div>
          </div>

          {/* review meter */}
          <div className="mt-6 flex items-center gap-3">
            <div className="meter w-40">
              <span style={{ width: `${Math.max(pct, 3)}%` }} />
            </div>
            <span className="mono text-[9.5px] tracking-[0.16em] text-mute">
              {pct === 0 ? "UNOPENED" : `${pct}% REVIEWED`}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

export default function Landing() {
  const heroRef = useInView<HTMLDivElement>(0.2);

  return (
    <div className="relative min-h-[100svh] overflow-x-clip bg-background text-foreground">
      {/* ── header ── */}
      <header className="hairline-b fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-[var(--paper)] px-4 sm:px-8">
        <span className="mono text-[11px] font-semibold tracking-[0.3em] text-ink">
          TARAONCHAIN<span className="text-signal">®</span>
        </span>
        <span className="chip">{TUNE.chip}</span>
      </header>

      {/* ── hero — the plotter measures the page once ── */}
      <section className="relative flex min-h-[94svh] flex-col justify-center overflow-hidden px-5 pb-20 pt-24 sm:px-8">
        <span aria-hidden className="plotter" />

        <div className="mx-auto w-full max-w-3xl">
          <p className="label arrive mb-6" style={{ "--d": "120ms" } as React.CSSProperties}>
            ON-CHAIN FORENSICS · INDEPENDENT CASE ARCHIVE
          </p>

          <h1 className="disp font-semibold leading-[1.02] text-ink">
            <span
              className="arrive block text-[13.5vw] sm:text-7xl md:text-[86px]"
              style={{ "--d": "220ms" } as React.CSSProperties}
            >
              Every chain
            </span>
            <span
              className="arrive block text-[13.5vw] sm:text-7xl md:text-[86px]"
              style={{ "--d": "340ms" } as React.CSSProperties}
            >
              leaves a{" "}
              <em className="font-light italic" style={{ color: "var(--signal)" }}>
                trail.
              </em>
            </span>
          </h1>

          <div
            className="arrive mt-9 max-w-xl"
            style={{ "--d": "480ms" } as React.CSSProperties}
          >
            <p className="read text-[15px] sm:text-base">
              The mempool forgets nothing. TARAONCHAIN conducts independent
              on-chain investigations tracing wallets, reconstructing movements
              of funds, and examining the relationships hidden within public
              transaction data.
            </p>
            <p className="read mt-3 text-[15px] sm:text-base">
              Every case is built from the chain itself and documented as an
              interactive investigation — allowing the evidence, transaction
              paths, and analytical reasoning behind each finding to be
              examined directly.
            </p>
          </div>

          <p
            className="label arrive mt-12 flex items-center gap-3"
            style={{ "--d": "620ms" } as React.CSSProperties}
          >
            <span className="inline-block h-px w-8 bg-signal" />
            02 CASE FILES · READS ENTIRELY LOCAL · NOTHING LEAVES THIS DEVICE
          </p>
        </div>

        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
          <span className="label caret">SCROLL — THE ARCHIVE IS OPEN</span>
        </div>
      </section>

      {/* ── the halftone field — ink that answers ── */}
      <section className="hairline-t hairline-b relative h-[190px] overflow-hidden bg-[var(--paper)] sm:h-[230px]">
        <HalftoneField className="absolute inset-0 h-full w-full" />
        <span className="label absolute bottom-3 left-5 bg-[var(--paper)] px-2 py-1">
          TOUCH THE FIELD — IT ANSWERS
        </span>
      </section>

      {/* ── the index — every published investigation ── */}
      <section className="relative px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-3xl">
          <div ref={heroRef[0]}>
            <p className="label">THE ARCHIVE — PUBLISHED CASE FILES</p>
            <div
              className={`rule mt-3 ${heroRef[1] ? "on" : ""}`}
              style={{ "--d": "100ms" } as React.CSSProperties}
            />
          </div>
          <div className="mt-2">
            {CASES.map((c, i) => (
              <CaseRow
                key={c.id}
                cf={c}
                no={String(i + 1).padStart(2, "0")}
                last={i === CASES.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── privacy strip ── */}
      <section className="hairline-t relative px-5 py-12 text-center sm:px-8">
        <div className="mx-auto max-w-2xl">
          <p className="mono text-[10.5px] leading-relaxed tracking-[0.2em] text-ink-2">
            ▣ ZERO TELEMETRY &nbsp;·&nbsp; ▣ LOCAL ARCHIVE &nbsp;·&nbsp; ▣
            NOTHING LEAVES THIS DEVICE
          </p>
          <p className="mx-auto mt-5 max-w-xl text-[12.5px] leading-relaxed text-mute">
            This build reads its case data from the bundle in front of you. No
            account, no database round-trip, no analytics beacon — the only
            network request is the one that fetched this page.
          </p>
          <p className="label mt-10">
            TARAONCHAIN · {TUNE.chip} · SINGLE BUILD · {new Date().getFullYear()}
          </p>
        </div>
      </section>
    </div>
  );
}
