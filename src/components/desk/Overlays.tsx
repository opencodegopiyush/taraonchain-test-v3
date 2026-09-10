"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { EPI_COLORS, EPI_LABEL } from "@/lib/palette";

/* ── full-screen overlays — the CASE FILE report (findings ·
   evidence · next steps). v15: a printed dossier on paper —
   the overlay IS the page, opaque, ruled. esc or ✕. ── */

export default function Overlays() {
  const overlay = useStore((s) => s.overlay);
  const setOverlay = useStore((s) => s.setOverlay);
  const cf = useStore((s) => s.caseFile);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverlay(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOverlay]);

  useEffect(() => {
    document.body.style.overflow = overlay ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlay]);

  if (!overlay) return null;

  return (
    <div className="fade-in fixed inset-0 z-50 flex flex-col bg-[var(--paper)]">
      <div className="hairline-b flex h-12 shrink-0 items-center justify-between bg-[var(--paper)] px-4">
        <span className="mono text-[11px] font-semibold tracking-[0.24em] text-signal">
          CASE FILE · {cf.id} · {cf.codename}
        </span>
        <button
          onClick={() => setOverlay(null)}
          className="flex h-9 w-9 items-center justify-center text-[14px] text-mute transition-colors hover:text-ink"
          aria-label="Close overlay"
        >
          ✕
        </button>
      </div>

      <div className="slim-scroll flex-1 overflow-y-auto px-5 py-7 sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <Report />
        </div>
      </div>
    </div>
  );
}

function Report() {
  const cf = useStore((s) => s.caseFile);
  return (
    <div className="space-y-10">
      <section>
        <p className="label mb-3">VERDICT SUMMARY</p>
        <p className="read text-[16px]">{cf.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {cf.chains.map((c) => (
            <span key={c} className="chip">{c}</span>
          ))}
          <span className="chip">{cf.span}</span>
          {cf.amountLabel && (
            <span className="chip border-ink text-ink">
              {cf.amountLabel}
            </span>
          )}
          <span className="chip" style={{ color: "var(--signal-deep)", borderColor: "var(--signal)" }}>
            {cf.amountUsd}
          </span>
        </div>
      </section>

      <section>
        <p className="label mb-3">FINDINGS</p>
        <div className="space-y-2.5">
          {cf.findings.map((f, i) => (
            <div
              key={f.id}
              className="border-l-2 bg-[var(--paper-2)] px-4 py-3.5"
              style={{ borderColor: EPI_COLORS[f.epistemic] }}
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="mono text-[10px] font-semibold text-faint">
                  F{String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="mono text-[9px] font-semibold tracking-[0.16em]"
                  style={{ color: EPI_COLORS[f.epistemic] }}
                >
                  {EPI_LABEL[f.epistemic]}
                </span>
                {f.confidence && (
                  <span className="label">{f.confidence} CONFIDENCE</span>
                )}
              </div>
              <p className="text-[13.5px] font-semibold text-ink">{f.title}</p>
              <p className="read mt-1 text-[14px]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {cf.assetRows && cf.assetRows.length > 0 && (
        <section>
          <p className="label mb-3">ASSET DISPOSITION</p>
          <div className="space-y-1.5">
            {cf.assetRows.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border bg-[var(--paper-2)] px-3 py-2.5 sm:grid-cols-[1.4fr_1fr_auto]"
              >
                <span className="mono text-[11.5px] text-ink">{r.loc}</span>
                <span className="mono text-[11.5px] tabular-nums text-ink">{r.amt}</span>
                <span
                  className="mono text-[9.5px] tracking-[0.14em] sm:justify-self-end"
                  style={{
                    color:
                      r.tone === "risk" ? "var(--signal-deep)" : r.tone === "assess" ? "var(--signal)" : r.tone === "unknown" ? "var(--faint)" : "var(--ink)",
                  }}
                >
                  {r.state}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="label mb-3">
          EVIDENCE LOCK — {cf.evidence.length} ON-CHAIN RECORDS
        </p>
        <div className="slim-scroll overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="hairline-b">
                {["SIGNATURE", "SLOT", "TIME (UTC)", "ROUTE", "VALUE"].map((h) => (
                  <th key={h} className="label px-2 py-2 text-left font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cf.evidence.map((r, i) => (
                <tr key={`${r.hash}-${i}`} className="hairline-b">
                  <td className="mono px-2 py-2 text-[10.5px] text-ink">
                    {r.hash.slice(0, 12)}…{r.hash.slice(-6)}
                  </td>
                  <td className="mono px-2 py-2 text-[10.5px] tabular-nums text-mute">{r.block}</td>
                  <td className="mono whitespace-nowrap px-2 py-2 text-[10.5px] text-mute">{r.ts}</td>
                  <td className="mono px-2 py-2 text-[10.5px] text-signal">{r.route}</td>
                  <td className="mono whitespace-nowrap px-2 py-2 text-[10.5px] tabular-nums text-ink">
                    {r.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <p className="label mb-3">NEXT STEPS</p>
        <ol className="space-y-2">
          {cf.nextSteps.map((s, i) => (
            <li key={i} className="flex gap-3 text-[13px] text-ink">
              <span className="mono shrink-0 text-signal">{String(i + 1).padStart(2, "0")}</span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {cf.limitations && (
        <section>
          <p className="label mb-3">LIMITATIONS</p>
          <p className="text-[12.5px] leading-relaxed text-mute">{cf.limitations}</p>
        </section>
      )}

      {cf.sourceNote && (
        <p className="mono border-t pt-4 text-[10px] leading-relaxed tracking-[0.06em] text-faint">
          {cf.sourceNote}
        </p>
      )}
    </div>
  );
}
