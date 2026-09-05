"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { EpiChip, EpiDot, ConfidenceChip, SectionLabel, CaseStatus } from "@/components/ui/bits";
import { Icon } from "@/components/ui/icons";
import { fmtEth } from "@/lib/palette";

export function ReportOverlay() {
  const CASE = useStore((s) => s.caseFile);
  const overlay = useStore((s) => s.overlay);
  const setOverlay = useStore((s) => s.setOverlay);
  const [leaving, setLeaving] = useState(false);
  if (overlay !== "report") return null;
  const close = () => {
    setLeaving(true);
    setTimeout(() => {
      setOverlay(null);
      setLeaving(false);
    }, 320);
  };

  const assetRows = CASE.assetRows ?? [];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="case report">
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: "rgba(4,6,9,0.6)", backdropFilter: "blur(3px)", opacity: leaving ? 0 : 1 }}
        onClick={close}
      />
      <div
        className="panel-deep absolute inset-y-0 right-0 flex w-full max-w-[860px] flex-col transition-transform duration-500 ease-out"
        style={{ transform: leaving ? "translateX(60px)" : "translateX(0)", borderLeft: "1px solid var(--line-strong)" }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-3.5 lg:px-10" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-3">
            <Icon name="report" size={15} className="text-[color:var(--assess)]" />
            <span className="label" style={{ color: "var(--ink)" }}>Case report · {CASE.id}</span>
            <span className="chip hidden sm:inline-flex !text-[9px]" style={{ color: "var(--risk)" }}>Working draft · confidential</span>
          </div>
          <button className="btn btn-ghost !p-1.5" onClick={close} aria-label="close report">
            <Icon name="close" size={15} />
          </button>
        </div>

        {/* body */}
        <div className="slim-scroll flex-1 overflow-y-auto px-6 py-8 lg:px-10">
          {/* masthead */}
          <div className="rise">
            <div className="flex flex-wrap items-center gap-3">
              <span className="datum text-[11px] tracking-[0.18em]" style={{ color: "var(--assess)" }}>{CASE.id}</span>
              <CaseStatus status={CASE.status} />
              <span className="label hidden !text-[8.5px] sm:inline" style={{ color: "var(--ink-faint)" }}>Prepared by taraonchain</span>
            </div>
            <h1 className="disp mt-3 text-[clamp(30px,4.6vw,44px)] font-bold leading-none tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
              {CASE.codename}
            </h1>
            <p className="doc mt-4 max-w-[560px] text-[15.5px] leading-[1.65]" style={{ color: "var(--ink-mute)" }}>
              {CASE.summary}
            </p>
            <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              <RM k="Subject" v={CASE.victim} />
              <RM k="Exposure" v={CASE.amountLabel ?? `${fmtEth(CASE.amountEth)} · ${CASE.amountUsd}`} />
              <RM k="Chains" v={CASE.chains.join(" · ")} />
              <RM k="Window" v={CASE.span} />
            </dl>
          </div>

          <div className="mt-10 flex flex-col gap-10">
            {/* data & method */}
            <section>
              <SectionLabel no="I">Data &amp; method</SectionLabel>
              <p className="doc mt-4 max-w-[600px] text-[14px] leading-[1.7]" style={{ color: "var(--ink-mute)" }}>
                {CASE.method ??
                  "Findings derive from public chain records. Direct transfers are reported as observations; inferred linkages are reported as assessments with explicit confidence grades."}
              </p>
            </section>

            {/* findings */}
            <section>
              <SectionLabel no="II">Findings</SectionLabel>
              <div className="mt-4 flex flex-col gap-4">
                {CASE.findings.map((f) => (
                  <article key={f.id} className="border p-4" style={{ borderColor: "var(--line)", background: "rgba(236,238,242,0.015)" }}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="datum text-[11px] font-medium" style={{ color: "var(--assess)" }}>{f.id}</span>
                      <h3 className="disp text-[15px] font-semibold" style={{ color: "var(--ink)" }}>{f.title}</h3>
                      <span className="ml-auto flex gap-1.5">
                        <EpiChip e={f.epistemic} />
                        {f.confidence && <ConfidenceChip c={f.confidence} />}
                      </span>
                    </div>
                    <p className="doc mt-2.5 text-[14px] leading-[1.65]" style={{ color: "var(--ink-mute)" }}>{f.body}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* asset status */}
            {assetRows.length > 0 && (
              <section>
                <SectionLabel no="III">Where the value sits</SectionLabel>
                <div className="mt-4 flex flex-col">
                  {assetRows.map((r) => (
                    <div key={r.loc} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b py-3" style={{ borderColor: "var(--line)" }}>
                      <span className="datum text-[11.5px]" style={{ color: "var(--ink)" }}>{r.loc}</span>
                      <span className="flex items-center gap-4">
                        <span className="datum text-[11.5px]" style={{ color: "var(--ink)" }}>{r.amt}</span>
                        <span className="label !text-[9px]" style={{ color: `var(--${r.tone === "fact" ? "fact" : r.tone === "assess" ? "assess" : r.tone === "risk" ? "risk" : "unknown"})` }}>{r.state}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* evidence index */}
            <section>
              <SectionLabel no="IV">Evidence index</SectionLabel>
              <div className="slim-scroll mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr>
                      {["Record", "Block", "Time (UTC)", "Route", "Value", "Chain", "Status"].map((h) => (
                        <th key={h} className="label !text-[8.5px] border-b px-2 py-2 text-left first:pl-0" style={{ borderColor: "var(--line-strong)", color: "var(--ink-faint)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CASE.evidence.map((r, i) => (
                      <tr key={i} className="transition-colors hover:bg-[rgba(236,238,242,0.025)]">
                        <td className="datum border-b py-2.5 pl-0 pr-2 text-[11px]" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>{r.hash}</td>
                        <td className="datum border-b px-2 py-2.5 text-[10.5px]" style={{ borderColor: "var(--line)", color: "var(--ink-mute)" }}>{r.block}</td>
                        <td className="datum border-b px-2 py-2.5 text-[10.5px]" style={{ borderColor: "var(--line)", color: "var(--ink-mute)" }}>{r.ts}</td>
                        <td className="datum border-b px-2 py-2.5 text-[10.5px] whitespace-nowrap" style={{ borderColor: "var(--line)", color: "var(--ink-mute)" }}>{r.route}</td>
                        <td className="datum border-b px-2 py-2.5 text-[10.5px] text-right" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>{r.value}</td>
                        <td className="datum border-b px-2 py-2.5 text-[10.5px]" style={{ borderColor: "var(--line)", color: "var(--ink-mute)" }}>{r.chain}</td>
                        <td className="border-b px-2 py-2.5" style={{ borderColor: "var(--line)" }}>
                          <EpiDot e={r.epistemic} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* next steps */}
            <section>
              <SectionLabel no="V">Next steps</SectionLabel>
              <ol className="mt-4 flex flex-col gap-2.5">
                {CASE.nextSteps.map((s, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="datum text-[10px]" style={{ color: "var(--assess)" }}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="doc text-[14px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>{s}</span>
                  </li>
                ))}
              </ol>
            </section>

            {/* limitations */}
            <section>
              <SectionLabel no="V">Limitations</SectionLabel>
              <p className="doc mt-4 max-w-[600px] text-[14px] leading-[1.7]" style={{ color: "var(--ink-mute)" }}>
                {CASE.limitations ??
                  "Assessments in this report are investigative working conclusions, not adjudicated facts, and are graded accordingly."}
              </p>
            </section>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-5" style={{ borderColor: "var(--line)" }}>
            <p className="doc max-w-[440px] text-[12.5px] italic leading-relaxed" style={{ color: "var(--ink-faint)" }}>
              {CASE.sourceNote ??
                "Compiled by taraonchain from public chain records. Verify everything independently before relying on it."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RM({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="label !text-[8.5px]" style={{ color: "var(--ink-faint)" }}>{k}</dt>
      <dd className="datum mt-1.5 text-[12px] leading-snug" style={{ color: "var(--ink)" }}>{v}</dd>
    </div>
  );
}
