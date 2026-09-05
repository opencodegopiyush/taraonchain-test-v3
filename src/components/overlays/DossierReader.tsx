"use client";

import { useCallback, useEffect, useState } from "react";
import type { DossierFile } from "@/lib/types";
import { useStore } from "@/lib/store";
import { EpiChip, EpiDot, ConfidenceChip, SectionLabel, CaseStatus } from "@/components/ui/bits";
import { Icon } from "@/components/ui/icons";

/* reader for uploaded investigation dossiers — same paper, new case */

export function DossierReader({ dossier, onClose }: { dossier: DossierFile; onClose: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const home = useStore((s) => s.home);

  const close = useCallback(() => {
    setLeaving(true);
    setTimeout(onClose, 320);
  }, [onClose]);

  /* wordmark inside the dossier — all roads lead back to the landing */
  const goHome = useCallback(() => {
    onClose();
    home();
  }, [onClose, home]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-label={`dossier ${dossier.id}`}>
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
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={goHome}
              className="group inline-flex items-center gap-2 rounded-sm px-1 py-1 transition-colors hover:bg-[rgba(236,238,242,0.05)]"
              aria-label="taraonchain — back to the landing page"
              title="Back to the landing page"
            >
              <Icon name="glyph" size={15} className="text-[color:var(--assess)]" strokeWidth={1.6} />
              <span className="wordmark-brand !text-[10px]" style={{ color: "var(--ink)" }}>taraonchain</span>
            </button>
            <span className="h-4 w-px shrink-0" style={{ background: "var(--line-strong)" }} />
            <span className="label truncate" style={{ color: "var(--ink)" }}>Investigation · {dossier.id}</span>
          </div>
          <button className="btn btn-ghost !p-1.5" onClick={close} aria-label="close dossier">
            <Icon name="close" size={15} />
          </button>
        </div>

        {/* body */}
        <div className="slim-scroll flex-1 overflow-y-auto px-6 py-8 lg:px-10">
          {/* masthead */}
          <div className="rise">
            <div className="flex flex-wrap items-center gap-3">
              <span className="datum text-[11px] tracking-[0.18em]" style={{ color: "var(--assess)" }}>{dossier.id}</span>
              <CaseStatus status={dossier.status} />
              <span className="label hidden !text-[8.5px] sm:inline" style={{ color: "var(--ink-faint)" }}>Prepared by taraonchain</span>
            </div>
            <h1 className="disp mt-3 text-[clamp(30px,4.6vw,44px)] font-bold leading-none tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
              {dossier.codename}
            </h1>
            <p className="doc mt-4 max-w-[560px] text-[15.5px] leading-[1.65]" style={{ color: "var(--ink-mute)" }}>
              {dossier.summary}
            </p>
            <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              <RM k="Subject" v={dossier.victim} />
              <RM k="Exposure" v={`${dossier.amountText}${dossier.amountUsd && dossier.amountUsd !== "—" ? ` · ${dossier.amountUsd}` : ""}`} />
              <RM k="Chains" v={dossier.chains.join(" · ") || "—"} />
              <RM k="Window" v={dossier.span} />
            </dl>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {dossier.entities.map((e) => (
                <span key={e.short} className="chip !text-[9px]" title={e.note || e.label}>
                  {e.short}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-10">
            {/* data & method */}
            <section>
              <SectionLabel no="I">Data &amp; method</SectionLabel>
              <p className="doc mt-4 max-w-[600px] text-[14px] leading-[1.7]" style={{ color: "var(--ink-mute)" }}>
                {dossier.method}
              </p>
            </section>

            {/* narrative chapters */}
            <section>
              <SectionLabel no="II">The trail</SectionLabel>
              <div className="mt-5 flex flex-col gap-8">
                {dossier.chapters.map((c) => (
                  <article key={c.no} className="border-l pl-4 sm:pl-5" style={{ borderColor: "var(--line-strong)" }}>
                    <div className="flex items-baseline gap-3">
                      <span className="datum text-[10px] font-medium" style={{ color: "var(--assess)" }}>{c.no}</span>
                      <span className="label !text-[9px]" style={{ color: "var(--ink-mute)" }}>{c.kicker}</span>
                    </div>
                    <h3 className="disp mt-1.5 text-[17px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                      {c.title}
                    </h3>
                    <div className="doc mt-2.5 flex flex-col gap-2.5 text-[14px] leading-[1.68]" style={{ color: "var(--ink-mute)" }}>
                      {c.paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                    {c.facts.length > 0 && (
                      <div className="chips-mobile mt-3 flex flex-wrap gap-1.5">
                        {c.facts.map((f, i) => (
                          <EpiChip key={i} e={f.epistemic} text={f.text} />
                        ))}
                      </div>
                    )}
                    {c.focus.length > 0 && (
                      <div className="datum mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9.5px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
                        {c.focus.map((s) => (
                          <span key={s}>{s}</span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            {/* findings */}
            {dossier.findings.length > 0 && (
              <section>
                <SectionLabel no="III">Findings</SectionLabel>
                <div className="mt-4 flex flex-col gap-4">
                  {dossier.findings.map((f) => (
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
            )}

            {/* evidence index */}
            <section>
              <SectionLabel no="IV">Evidence index</SectionLabel>
              <div className="slim-scroll mt-4 overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse">
                  <thead>
                    <tr>
                      {["Record", "Time", "Route", "Value", "Chain", "Status"].map((h) => (
                        <th key={h} className="label !text-[8.5px] border-b px-2 py-2 text-left first:pl-0" style={{ borderColor: "var(--line-strong)", color: "var(--ink-faint)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dossier.evidence.map((r, i) => (
                      <tr key={i} className="transition-colors hover:bg-[rgba(236,238,242,0.025)]">
                        <td className="datum border-b py-2.5 pl-0 pr-2 text-[11px]" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>{r.hash}</td>
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
            {dossier.nextSteps.length > 0 && (
              <section>
                <SectionLabel no="V">Next steps</SectionLabel>
                <ol className="mt-4 flex flex-col gap-2.5">
                  {dossier.nextSteps.map((s, i) => (
                    <li key={i} className="flex items-baseline gap-3">
                      <span className="datum text-[10px]" style={{ color: "var(--assess)" }}>{String(i + 1).padStart(2, "0")}</span>
                      <span className="doc text-[14px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>{s}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* limitations */}
            <section>
              <SectionLabel no="VI">Limitations</SectionLabel>
              <p className="doc mt-4 max-w-[600px] text-[14px] leading-[1.7]" style={{ color: "var(--ink-mute)" }}>
                {dossier.limitations}
              </p>
            </section>
          </div>

          <div className="mt-12 border-t pt-5" style={{ borderColor: "var(--line)" }}>
            <p className="doc max-w-[440px] text-[12.5px] italic leading-relaxed" style={{ color: "var(--ink-faint)" }}>
              {dossier.sourceNote ??
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
