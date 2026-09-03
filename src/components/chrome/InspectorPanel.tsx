"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { EPI_COLORS, KIND_LABEL, RISK_LABEL, NODE_COLORS } from "@/lib/palette";
import { EpiDot, CopyBtn, ConfidenceChip } from "@/components/ui/bits";
import { Icon } from "@/components/ui/icons";

export function InspectorPanel() {
  const CASE = useStore((s) => s.caseFile);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectNode = useStore((s) => s.selectNode);
  const node = CASE.nodes.find((n) => n.id === selectedNodeId);
  const unit = CASE.unit ?? "ETH";
  const fmtVal = (n: number) =>
    n === 0 ? "0" : `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;

  const data = useMemo(() => {
    if (!node) return null;
    const edges = CASE.edges.filter((e) => e.source === node.id || e.target === node.id);
    const conns = edges.map((e) => {
      const otherId = e.source === node.id ? e.target : e.source;
      const other = CASE.nodes.find((n) => n.id === otherId)!;
      const outgoing = e.source === node.id;
      return { edge: e, other, outgoing };
    });
    const txs = edges
      .flatMap((e) => e.txs.map((t) => ({ t, e })))
      .sort((a, b) => (a.t.ts < b.t.ts ? 1 : -1))
      .slice(0, 9);
    return { edges, conns, txs };
  }, [node, CASE]);

  const closed = () => selectNode(null);

  return (
    <aside
      aria-label="entity inspector"
      className="fixed z-40 transition-transform duration-500 ease-out slim-scroll overflow-y-auto"
      style={{
        top: "48px",
        bottom: 0,
        right: 0,
        width: "min(380px, 100vw)",
        transform: node ? "translateX(0)" : "translateX(calc(100% + 40px))",
        background: "var(--panel-deep)",
        borderLeft: "1px solid var(--line)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {node && data && (
        <div className="flex min-h-full flex-col p-5">
          {/* header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="chip" style={{ color: NODE_COLORS[node.kind] }}>
                <span className="dot" style={{ background: NODE_COLORS[node.kind] }} />
                {KIND_LABEL[node.kind]}
              </span>
              {node.risk >= 2 && (
                <span className="chip" style={{ color: "var(--risk)" }}>
                  <Icon name="alert" size={10} />
                  RISK · {RISK_LABEL[node.risk].toUpperCase()}
                </span>
              )}
            </div>
            <button className="btn btn-ghost !p-1.5" onClick={closed} aria-label="close inspector">
              <Icon name="close" size={14} />
            </button>
          </div>

          <h2 className="disp mt-3 text-[21px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
            {node.label}
          </h2>

          <div className="mt-2.5 flex items-center gap-2">
            <code className="datum text-[11.5px]" style={{ color: "var(--ink-mute)" }}>{node.address}</code>
            <CopyBtn text={node.address} />
          </div>

          {/* tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {node.tags.map((t) => (
              <span key={t} className="chip !text-[9px]">{t}</span>
            ))}
          </div>

          {/* meta grid */}
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t pt-4" style={{ borderColor: "var(--line)" }}>
            <Meta k="Chain" v={node.chain} />
            <Meta k="Balance" v={fmtVal(node.balance)} accent />
            <Meta k="First seen" v={node.firstSeen} />
            <Meta k="Last seen" v={node.lastSeen} />
            <Meta k="Received" v={fmtVal(node.received)} />
            <Meta k="Sent" v={fmtVal(node.sent)} />
          </dl>

          {/* attribution / assessment */}
          {node.attribution && (
            <div className="mt-4 border p-3.5" style={{ borderColor: "rgba(232,163,61,0.35)", background: "rgba(232,163,61,0.05)" }}>
              <div className="flex items-center justify-between gap-2">
                <span className="label" style={{ color: "var(--assess)" }}>Assessment</span>
                <ConfidenceChip c={node.attribution.confidence} />
              </div>
              <p className="doc mt-2 text-[14px] leading-snug" style={{ color: "var(--ink)" }}>
                {node.attribution.claim}
              </p>
              <p className="datum mt-2 text-[10.5px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>
                BASIS — {node.attribution.basis}
              </p>
            </div>
          )}

          {/* analyst note */}
          {node.note && (
            <blockquote className="doc mt-4 border-l-2 pl-3.5 text-[14px] italic leading-relaxed" style={{ borderColor: "var(--line-strong)", color: "var(--ink-mute)" }}>
              {node.note}
            </blockquote>
          )}

          {/* connections */}
          <div className="mt-5">
            <div className="label mb-2" style={{ color: "var(--ink-faint)" }}>Connections · {data.conns.length}</div>
            <div className="flex flex-col">
              {data.conns.map(({ edge, other, outgoing }) => (
                <button
                  key={edge.id + other.id}
                  onClick={() => selectNode(other.id)}
                  className="group flex items-center justify-between gap-3 border-b py-2.5 text-left transition-colors hover:bg-[rgba(232,228,218,0.03)]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon name={outgoing ? "arrow-right" : "arrow-left"} size={12} className={outgoing ? "text-[color:var(--fact)]" : "text-[color:var(--ink-faint)]"} />
                    <span className="datum truncate text-[11.5px]" style={{ color: "var(--ink)" }}>{other.short}</span>
                    <EpiDot e={edge.epistemic} />
                  </span>
                  <span className="datum text-[11px] whitespace-nowrap" style={{ color: "var(--ink-mute)" }}>
                    {outgoing ? "→ " : "← "}{edge.valueLabel ?? fmtVal(edge.value)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* transactions */}
          {data.txs.length > 0 && (
            <div className="mt-5">
              <div className="label mb-2" style={{ color: "var(--ink-faint)" }}>Transaction records</div>
              <div className="flex flex-col">
                {data.txs.map(({ t, e }, i) => (
                  <div key={t.hash + i} className="flex items-center justify-between gap-3 border-b py-2" style={{ borderColor: "var(--line)" }}>
                    <div className="min-w-0">
                      <code className="datum block truncate text-[11px]" style={{ color: "var(--ink)" }}>{t.hash}</code>
                      <span className="datum text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
                        {t.ts} · {t.chain}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="datum text-[11px]" style={{ color: "var(--ink)" }}>{t.value === 0 ? "call" : fmtVal(t.value)}</div>
                      <div className="label !text-[8.5px] mt-0.5" style={{ color: EPI_COLORS[e.epistemic] }}>
                        {e.epistemic}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-5">
            <p className="datum text-[9.5px] leading-relaxed" style={{ color: "var(--ink-faint)" }}>
              CASE {CASE.id} · PUBLIC CHAIN RECORDS · VERIFY INDEPENDENTLY
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

function Meta({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div>
      <dt className="label !text-[8.5px]" style={{ color: "var(--ink-faint)" }}>{k}</dt>
      <dd className="datum mt-1 text-[11.5px]" style={{ color: accent ? "var(--ink)" : "var(--ink-mute)" }}>{v}</dd>
    </div>
  );
}
