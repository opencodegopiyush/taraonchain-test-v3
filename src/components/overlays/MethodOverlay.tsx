"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { SectionLabel, LegendContent } from "@/components/ui/bits";
import { Icon } from "@/components/ui/icons";

export function MethodOverlay() {
  const overlay = useStore((s) => s.overlay);
  const setOverlay = useStore((s) => s.setOverlay);
  const [leaving, setLeaving] = useState(false);
  if (overlay !== "method") return null;
  const close = () => {
    setLeaving(true);
    setTimeout(() => {
      setOverlay(null);
      setLeaving(false);
    }, 320);
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="methodology">
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: "rgba(5,7,13,0.6)", backdropFilter: "blur(3px)", opacity: leaving ? 0 : 1 }}
        onClick={close}
      />
      <div
        className="panel-deep absolute inset-y-0 left-1/2 flex w-full max-w-[720px] flex-col transition-all duration-500 ease-out sm:inset-y-4"
        style={{
          opacity: leaving ? 0 : 1,
          transform: leaving ? "translate(-50%, 24px)" : "translate(-50%, 0)",
          border: "1px solid var(--line-strong)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-3.5 lg:px-9" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-3">
            <Icon name="method" size={15} className="text-[color:var(--assess)]" />
            <span className="label" style={{ color: "var(--ink)" }}>Method — the record vs the reading</span>
          </div>
          <button className="btn btn-ghost !p-1.5" onClick={close} aria-label="close method">
            <Icon name="close" size={15} />
          </button>
        </div>

        <div className="slim-scroll flex-1 overflow-y-auto px-6 py-8 lg:px-9">
          <p className="doc text-[15.5px] leading-[1.7]" style={{ color: "var(--ink-mute)" }}>
            Blockchain data is exhaustive and, at the same time, mute. It records that two addresses
            interacted; it does not record who owned them, why they moved funds, or what a pattern
            means. An investigation platform earns trust by keeping those two registers apart —
            every claim we publish carries its own epistemic label.
          </p>

          <div className="mt-9 flex flex-col gap-9">
            <section>
              <SectionLabel>Three registers</SectionLabel>
              <div className="mt-4 flex flex-col gap-3">
                <Register
                  color="var(--fact)"
                  title="Observed"
                  body="A fact recorded by the chain itself: a transaction, a log event, a balance. Any node can reproduce it. We add interpretation only after the semicolon."
                  example="“W-08 sent 1,600 ETH to Corvid Bridge at 10:12 UTC” — observed."
                />
                <Register
                  color="var(--assess)"
                  title="Assessed"
                  body="An inference from heuristics: clustering, timing windows, amount correlation, behavioural signatures. Always graded, always falsifiable, never mixed into observed totals."
                  example="“These 14 mixer outputs feed CONFLUENCE-1” — assessed, medium confidence."
                />
                <Register
                  color="var(--unknown)"
                  title="Unresolved"
                  body="A deliberate gap. Where the chain ends or coverage is missing, we say so. An honest blank is worth more than a confident guess."
                  example="“501 ETH of mixer outputs remain unlinked” — unresolved."
                />
              </div>
            </section>

            <section>
              <SectionLabel>Confidence grades</SectionLabel>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                {[
                  ["HIGH", "Multiple independent heuristics agree; no contradicting evidence."],
                  ["MEDIUM", "Consistent correlation from a primary heuristic; corroboration partial."],
                  ["LOW", "Behavioural indications only; explicitly not attribution."],
                ].map(([k, v]) => (
                  <div key={k} className="border p-3.5" style={{ borderColor: "var(--line)", background: "rgba(230,234,244,0.015)" }}>
                    <div className="datum text-[11px] font-medium" style={{ color: "var(--assess)" }}>{k}</div>
                    <p className="doc mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>{v}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel>How links are formed</SectionLabel>
              <div className="mt-4 flex flex-col gap-3">
                {[
                  ["Peel-chain detection", "Sequential wallets forwarding >90% of holdings while skimming residuals form a deterministic chain we can follow hop by hop."],
                  ["Fixed-width pooling", "Mixers break amounts into standard denominations. Inputs and outputs become provably disconnected — the break itself is information."],
                  ["Timing-window correlation", "Deposits and withdrawals that repeat inside consistent windows across days suggest common scheduling, and often common control."],
                  ["Amount-preserving hops", "Movements that preserve odd amounts (minus fixed fees) across hops and across bridges indicate continuation of the same flow."],
                  ["Cadence matching", "Bridges change addresses, not habits: hour-of-day rhythm and batching behaviour survive the crossing."],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 border-b pb-3 sm:flex-row sm:gap-6" style={{ borderColor: "var(--line)" }}>
                    <span className="datum w-56 shrink-0 pt-0.5 text-[11px]" style={{ color: "var(--ink)" }}>{k}</span>
                    <span className="doc text-[13.5px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel>Reading the graph</SectionLabel>
              <div className="mt-4">
                <LegendContent />
              </div>
            </section>

            <section>
              <SectionLabel>Glossary</SectionLabel>
              <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  ["Peel chain", "A sequence of wallets each passing most of a balance onward while keeping a small slice — a long fuse of small transfers."],
                  ["Mixer", "A service pooling funds from many users and re-issuing them, severing the on-chain link between source and destination."],
                  ["Bridge", "Infrastructure that moves value between chains; the address changes, the behaviour often does not."],
                  ["OTC desk", "An over-the-counter venue trading large amounts off the order book, sometimes without identity checks."],
                  ["Consolidation", "Many small inflows merging into one wallet — often the moment a laundering scheme becomes visible again."],
                  ["Dust", "Residual small balances left behind at each hop; individually trivial, collectively a fingerprint."],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="datum text-[11px]" style={{ color: "var(--ink)" }}>{k}</div>
                    <p className="doc mt-1 text-[13.5px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>{v}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel>Attribution policy</SectionLabel>
              <p className="doc mt-4 text-[14px] leading-[1.7]" style={{ color: "var(--ink-mute)" }}>
                Attributing a wallet to a person or organisation is the highest claim an investigation
                can make, and it is never made on chain data alone. Where attribution appears in taraonchain
                case files it is accompanied by its full basis, its confidence grade, and the explicit
                statement that it is our assessment. A blockchain transaction is a fact. Everything we
                say about what it means is our reading — and it is labelled as such, down to the last edge.
              </p>
            </section>
          </div>

          <p className="datum mt-10 text-[9.5px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
            TARAONCHAIN · METHOD OVERVIEW · EVERY CLAIM VERIFIABLE VIA PUBLIC RPC
          </p>
        </div>
      </div>
    </div>
  );
}

function Register({ color, title, body, example }: { color: string; title: string; body: string; example: string }) {
  return (
    <div className="border p-4" style={{ borderColor: "var(--line)", background: "rgba(230,234,244,0.015)" }}>
      <div className="flex items-center gap-2.5">
        <span className="dot" style={{ background: color, boxShadow: `0 0 6px ${color}55` }} />
        <span className="label" style={{ color }}>{title}</span>
      </div>
      <p className="doc mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>{body}</p>
      <p className="doc mt-2 text-[13px] italic" style={{ color: "var(--ink-faint)" }}>{example}</p>
    </div>
  );
}
