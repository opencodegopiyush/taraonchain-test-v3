"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { EPI_COLORS, KIND_LABEL, RISK_LABEL, NODE_COLORS } from "@/lib/palette";
import { EpiDot, CopyBtn, ConfidenceChip, spawnRipple } from "@/components/ui/bits";
import { Icon } from "@/components/ui/icons";

type Tab = "overview" | "links" | "txns";

/* ── entity sheet — v4 redesign of the node inspector ─────────
   the v3 inspector was a right slide-over with one endless
   stack — fine on desktop, poor thumb UX on mobile. v4:
   · mobile  → bottom sheet inside the trace frame, drag the
     handle down to dismiss, three thumb-sized tabs instead
     of one long scroll
   · desktop → the same content as a right slide-over
   both spring in (t4-spring) and every row answers the tap. */

export function InspectorPanel({ confined = false }: { confined?: boolean }) {
  const CASE = useStore((s) => s.caseFile);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectNode = useStore((s) => s.selectNode);
  const node = CASE.nodes.find((n) => n.id === selectedNodeId);
  const unit = CASE.unit ?? "ETH";
  const fmtVal = (n: number) =>
    n === 0 ? "0" : `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;

  const [tab, setTab] = useState<Tab>("overview");
  useEffect(() => {
    setTab("overview");
  }, [selectedNodeId]);

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
      .slice(0, 12);
    return { edges, conns, txs };
  }, [node, CASE]);

  const closed = () => selectNode(null);

  /* drag-to-dismiss — touch/pen only, on the grab handle */
  const [dragY, setDragY] = useState<number | null>(null);
  const startY = useRef(0);
  const onHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    startY.current = e.clientY;
    setDragY(0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragY === null) return;
    setDragY(Math.max(0, e.clientY - startY.current));
  };
  const onHandleUp = () => {
    if (dragY === null) return;
    if (dragY > 64) closed();
    setDragY(null);
  };

  return (
    <aside
      aria-label="entity inspector"
      className={`inspector-sheet t4-spring fixed inset-x-0 bottom-0 z-40 slim-scroll flex max-h-[70%] flex-col overflow-hidden rounded-t-[12px] border-t lg:inset-x-auto lg:right-0 lg:top-0 lg:bottom-0 lg:max-h-none lg:w-[368px] lg:rounded-t-none lg:border-t-0 lg:border-l ${
        node ? "is-open" : ""
      } ${confined ? "max-lg:hidden" : "lg:hidden"}`}
      style={{
        background: "var(--panel-deep)",
        borderColor: "var(--line-strong)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: "0 -12px 40px rgba(5,7,13,0.55)",
        ...(dragY !== null ? { transform: `translateY(${dragY}px)`, transition: "none" } : {}),
      }}
    >
      {node && data && (
        <>
          {/* grab handle — drag down to dismiss (touch) */}
          <div
            aria-hidden
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
            className="t4-nudge shrink-0 cursor-grab touch-none pt-2.5 pb-1 lg:hidden"
          >
            <span className="mx-auto block h-1 w-11 rounded-full" style={{ background: "var(--line-strong)" }} />
          </div>

          {/* header */}
          <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-1 lg:pt-4">
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
            <button className="btn btn-ghost !p-2" onClick={closed} aria-label="close inspector">
              <Icon name="close" size={14} />
            </button>
          </div>

          <div className="shrink-0 px-4">
            <h2 className="disp mt-2 text-[22px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
              {node.label}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <code className="datum truncate text-[11.5px]" style={{ color: "var(--ink-mute)" }}>{node.address}</code>
              <CopyBtn text={node.address} />
            </div>
          </div>

          {/* tabs — thumb-sized, ripple on tap */}
          <div
            role="tablist"
            aria-label="entity sections"
            className="mt-3 flex shrink-0 gap-1 border-b px-3"
            style={{ borderColor: "var(--line)" }}
          >
            {(
              [
                ["overview", "OVERVIEW", null],
                ["links", "LINKS", data.conns.length],
                ["txns", "TXNS", data.txs.length],
              ] as const
            ).map(([id, lbl, count]) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active}
                  onClick={(e) => {
                    spawnRipple(e);
                    setTab(id);
                  }}
                  className="t4-ripple-host label relative min-h-11 flex-1 !text-[9.5px] transition-colors"
                  style={{
                    color: active ? "var(--ink)" : "var(--ink-faint)",
                    borderBottom: `2px solid ${active ? "var(--assess)" : "transparent"}`,
                    marginBottom: "-1px",
                  }}
                >
                  {lbl}
                  {count !== null && <span className="datum ml-1 !text-[9px] opacity-70">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* tab content */}
          <div className="slim-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(18px,env(safe-area-inset-bottom))] pt-3">
            {tab === "overview" && (
              <div>
                {node.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {node.tags.map((t) => (
                      <span key={t} className="chip !text-[9px]">{t}</span>
                    ))}
                  </div>
                )}

                <dl className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3.5" style={{ borderColor: "var(--line)" }}>
                  <Meta k="Chain" v={node.chain} />
                  <Meta k="Balance" v={fmtVal(node.balance)} accent />
                  <Meta k="First seen" v={node.firstSeen} />
                  <Meta k="Last seen" v={node.lastSeen} />
                  <Meta k="Received" v={fmtVal(node.received)} />
                  <Meta k="Sent" v={fmtVal(node.sent)} />
                </dl>

                {node.attribution && (
                  <div
                    className="t3-stamp mt-4 border p-3.5"
                    style={{ borderColor: "rgba(167,139,250,0.35)", background: "rgba(167,139,250,0.06)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="label" style={{ color: "var(--assess)" }}>Assessment</span>
                      <ConfidenceChip c={node.attribution.confidence} />
                    </div>
                    <p className="doc mt-2 text-[14.5px] leading-snug" style={{ color: "var(--ink)" }}>
                      {node.attribution.claim}
                    </p>
                    <p className="datum mt-2 text-[10.5px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>
                      BASIS — {node.attribution.basis}
                    </p>
                  </div>
                )}

                {node.note && (
                  <blockquote
                    className="doc mt-4 border-l-2 pl-3.5 text-[14.5px] italic leading-relaxed"
                    style={{ borderColor: "var(--line-strong)", color: "var(--ink-mute)" }}
                  >
                    {node.note}
                  </blockquote>
                )}

                <p className="datum mt-5 text-[9.5px] leading-relaxed" style={{ color: "var(--ink-faint)" }}>
                  CASE {CASE.id} · PUBLIC CHAIN RECORDS · VERIFY INDEPENDENTLY
                </p>
              </div>
            )}

            {tab === "links" && (
              <div className="flex flex-col">
                {data.conns.length === 0 && (
                  <p className="datum py-6 text-center text-[11px]" style={{ color: "var(--ink-faint)" }}>
                    No links recorded for this entity.
                  </p>
                )}
                {data.conns.map(({ edge, other, outgoing }) => (
                  <button
                    key={edge.id + other.id}
                    onClick={(e) => {
                      spawnRipple(e);
                      selectNode(other.id);
                    }}
                    className="t4-ripple-host group flex min-h-11 items-center justify-between gap-3 border-b px-1 text-left transition-colors"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon
                        name={outgoing ? "arrow-right" : "arrow-left"}
                        size={12}
                        className={outgoing ? "text-[color:var(--fact)]" : "text-[color:var(--ink-faint)]"}
                      />
                      <span className="datum truncate text-[12px]" style={{ color: "var(--ink)" }}>{other.short}</span>
                      <EpiDot e={edge.epistemic} />
                    </span>
                    <span className="datum whitespace-nowrap text-[11px]" style={{ color: "var(--ink-mute)" }}>
                      {outgoing ? "→ " : "← "}{edge.valueLabel ?? fmtVal(edge.value)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {tab === "txns" && (
              <div className="flex flex-col">
                {data.txs.length === 0 && (
                  <p className="datum py-6 text-center text-[11px]" style={{ color: "var(--ink-faint)" }}>
                    No transaction records on this entity.
                  </p>
                )}
                {data.txs.map(({ t, e }, i) => (
                  <div key={t.hash + i} className="flex min-h-11 items-center justify-between gap-3 border-b py-2" style={{ borderColor: "var(--line)" }}>
                    <div className="min-w-0">
                      <code className="datum block truncate text-[11px]" style={{ color: "var(--ink)" }}>{t.hash}</code>
                      <span className="datum text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
                        {t.ts} · {t.chain}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="datum text-[11px]" style={{ color: "var(--ink)" }}>{t.value === 0 ? "call" : fmtVal(t.value)}</div>
                      <div className="label mt-0.5 !text-[8.5px]" style={{ color: EPI_COLORS[e.epistemic] }}>
                        {e.epistemic}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

function Meta({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div>
      <dt className="label !text-[9px]" style={{ color: "var(--ink-faint)" }}>{k}</dt>
      <dd className="datum mt-1 text-[12px]" style={{ color: accent ? "var(--ink)" : "var(--ink-mute)" }}>{v}</dd>
    </div>
  );
}
