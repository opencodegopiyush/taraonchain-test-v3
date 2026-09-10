"use client";

import { useStore, reviewedPct } from "@/lib/store";
import { CASES } from "@/lib/case-data";
import type { CaseFile } from "@/lib/types";
import { TUNE } from "@/lib/edition";

/* ── v16 landing — THE POSTER ────────────────────────────────
   no canvas, no particles, no observers, no count-ups. the
   archive opens as pure typography on cool paper: a giant
   Swiss headline, ruled meta columns, and each case as one
   full-width index row that flips to ink under the pointer.
   the only motion is two CSS entrances. everything is on the
   page before you move. */

/* per-case row chrome — tag + drawdown are report facts */
const ROW_META: Record<string, { tag: string; fill?: boolean; drawdown: string }> = {
  "R-0905": { tag: "LATEST", fill: true, drawdown: "−99.3% FROM PEAK" },
  "S-0830": { tag: "ARCHIVED", drawdown: "−98.8% FROM PEAK" },
};

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
  const meta = ROW_META[cf.id] ?? { tag: "DECLASSIFIED", drawdown: "" };

  return (
    <button
      onClick={() => openCase(cf.id)}
      aria-label={`Open case file ${cf.id} — ${cf.codename}`}
      className={`row-flip group relative block w-full cursor-pointer border-t border-[var(--line-strong)] text-left ${
        last ? "border-b border-b-[var(--line-strong)]" : ""
      }`}
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 px-2 py-10 sm:px-4 lg:grid-cols-[72px_1fr_300px] lg:py-14">
        {/* index numeral */}
        <span className="mono text-[13px] font-semibold tracking-[0.2em] text-signal">
          {no}
        </span>

        {/* identity */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label group-hover:text-[var(--paper)]">{cf.id}</span>
            <span className={meta.fill ? "tag tag-fill" : "tag group-hover:border-[var(--paper)] group-hover:text-[var(--paper)]"}>
              {meta.tag}
            </span>
            <span className="label hidden sm:inline group-hover:text-[var(--paper)]">{cf.status}</span>
          </div>
          <h2 className="disp mt-3 text-[13vw] font-bold uppercase leading-[0.92] text-ink sm:text-[64px] lg:text-[76px]">
            {cf.codename}
          </h2>
          <p className="mono mt-3 text-[10.5px] tracking-[0.16em] text-mute group-hover:text-[var(--paper)]">
            {cf.chains.join(" / ").toUpperCase()} · {cf.span.toUpperCase()}
          </p>
          <p className="read mt-4 max-w-xl text-[14px] group-hover:text-[var(--paper)]">{cf.summary}</p>
        </div>

        {/* measured footprint — the stats belong to this file */}
        <div className="flex flex-col justify-between gap-6 lg:items-end">
          <div className="lg:text-right">
            {cf.amountLabel && (
              <p className="mono text-[10px] tracking-[0.18em] text-mute group-hover:text-[var(--paper)]">
                {cf.amountLabel}
              </p>
            )}
            <p className="mono mt-1 text-[22px] font-semibold tabular-nums text-signal">
              {cf.amountUsd}
            </p>
            {meta.drawdown && (
              <p className="mono mt-1 text-[9.5px] tracking-[0.14em] text-mute group-hover:text-[var(--paper)]">
                {meta.drawdown}
              </p>
            )}
          </div>

          <div className="grid w-full grid-cols-4 gap-3 border-t border-dashed border-[var(--line-strong)] pt-4 lg:w-auto lg:gap-6">
            {[
              [cf.stats.entities, "ENT"],
              [cf.stats.hops, "LINKS"],
              [cf.chapters.length, "CH"],
              [100, "% LOCAL"],
            ].map(([v, l]) => (
              <div key={l as string} className="lg:text-right">
                <p className="mono text-[15px] font-semibold tabular-nums text-ink group-hover:text-[var(--paper)]">
                  {v}
                </p>
                <p className="label mt-0.5 group-hover:text-[var(--paper)]">{l}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 lg:flex-row-reverse">
            <span className="mono text-[10px] font-semibold tracking-[0.18em] text-signal">
              OPEN FILE →
            </span>
            <span className="mono text-[9.5px] tracking-[0.14em] text-faint group-hover:text-[var(--paper)]">
              {pct === 0 ? "UNOPENED" : `${pct}% REVIEWED`}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Landing() {
  return (
    <div className="relative min-h-[100svh] overflow-x-clip bg-background text-foreground">
      {/* ── header ── */}
      <header className="hairline-b fixed inset-x-0 top-0 z-30 flex h-12 items-center justify-between bg-[var(--paper)] px-4 sm:px-8">
        <span className="mono text-[11px] font-semibold tracking-[0.3em] text-ink">
          TARAONCHAIN<span className="text-signal">®</span>
        </span>
        <span className="chip">{TUNE.chip}</span>
      </header>

      {/* ── hero — the poster ── */}
      <section className="flex min-h-[92svh] flex-col justify-between px-4 pb-0 pt-24 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <p className="label arrive mb-8" style={{ "--d": "60ms" } as React.CSSProperties}>
            ON-CHAIN FORENSICS · INDEPENDENT CASE ARCHIVE
          </p>

          <h1 className="disp font-bold uppercase leading-[0.9] text-ink">
            <span className="arrive block text-[15vw] sm:text-8xl lg:text-[128px]" style={{ "--d": "140ms" } as React.CSSProperties}>
              Every chain
            </span>
            <span className="arrive block text-[15vw] sm:text-8xl lg:text-[128px]" style={{ "--d": "240ms" } as React.CSSProperties}>
              leaves a{" "}
              <span className="text-signal">trace.</span>
            </span>
          </h1>

          <div className="arrive mt-10 grid grid-cols-1 gap-8 md:grid-cols-2" style={{ "--d": "380ms" } as React.CSSProperties}>
            <p className="read max-w-xl text-[15px]">
              The mempool forgets nothing. TARAONCHAIN conducts independent
              on-chain investigations tracing wallets, reconstructing movements
              of funds, and examining the relationships hidden within public
              transaction data.
            </p>
            <p className="read max-w-xl text-[15px]">
              Every case is built from the chain itself and documented as an
              interactive investigation — allowing the evidence, transaction
              paths, and analytical reasoning behind each finding to be
              examined directly.
            </p>
          </div>
        </div>

        {/* meta rule — three measured columns */}
        <div className="mx-auto mt-16 w-full max-w-6xl">
          <div className="grid grid-cols-3 border-t border-[var(--line-strong)]">
            {[
              ["CASE FILES", "02"],
              ["TELEMETRY", "ZERO"],
              ["ARCHIVE MODE", "LOCAL ONLY"],
            ].map(([l, v], i) => (
              <div
                key={l}
                className={`arrive py-5 ${i > 0 ? "border-l border-[var(--line)] pl-4 sm:pl-6" : ""}`}
                style={{ "--d": `${500 + i * 90}ms` } as React.CSSProperties}
              >
                <p className="label">{l}</p>
                <p className="mono mt-1.5 text-[13px] font-semibold tracking-[0.08em] text-ink">
                  {v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── the index — every published investigation ── */}
      <section className="px-2 pb-4 pt-20 sm:px-4">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 flex items-end justify-between px-2 sm:px-4">
            <p className="label">THE ARCHIVE — PUBLISHED CASE FILES</p>
            <p className="label hidden sm:block">READS ENTIRELY LOCAL · NOTHING LEAVES THIS DEVICE</p>
          </div>
          <div>
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
      <section className="hairline-t px-4 py-14 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <p className="read max-w-xl text-[13px]">
              This build reads its case data from the bundle in front of you.
              No account, no database round-trip, no analytics beacon — the
              only network request is the one that fetched this page.
            </p>
            <p className="label md:text-right">
              TARAONCHAIN · {TUNE.chip} · SINGLE BUILD · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
