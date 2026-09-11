"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  EPI_COLORS,
  EPI_LABEL,
  KIND_LABEL,
  NODE_COLORS,
  RISK_COLORS,
  RISK_LABEL,
  fmtEth,
} from "@/lib/palette";
import type { CaseEdge, CaseNode } from "@/lib/types";

/* ── entity record — v19 "NIGHT SHIFT" ───────────────────────
   ONE record, TWO shells:
   · desktop — floating specimen card pinned inside the plate
     half.
   · mobile — the terminal swap: selecting a bubble replaces
     the REPORT half with the entity's full record while the
     trace plate keeps owning the upper half. the graph never
     leaves sight; tap another bubble to compare, ✕ returns to
     the report exactly where you left it.

   ── v8 copy — works on mobile + plain http ──
   navigator.clipboard only exists in secure contexts. over
   LAN-IP http it is undefined, so COPY must fall back to
   execCommand via a throwaway textarea. */

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* ── shared record state ───────────────────────────────────── */

function useSelected() {
  const node = useStore((s) => s.caseFile.nodes.find((n) => n.id === s.selectedNodeId));
  const cf = useStore((s) => s.caseFile);
  const close = () => useStore.getState().selectNode(null);
  return { node, cf, close };
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const [copyFail, setCopyFail] = useState<string | null>(null);
  const copy = async (text: string, tag: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(tag);
      setCopyFail(null);
      setTimeout(() => setCopied(null), 1200);
    } else {
      /* even on total failure, say so — never a dead button */
      setCopyFail(tag);
      setTimeout(() => setCopyFail(null), 1400);
    }
  };
  return { copy, copied, copyFail };
}

/* ── the record chrome shared by both shells ───────────────── */

function Identity({ node }: { node: CaseNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: NODE_COLORS[node.kind] }}
        />
        <h3 className="disp min-w-0 flex-1 text-[17px] font-semibold leading-tight text-ink lg:text-[20px]">
          {node.label}
        </h3>
      </div>
      <button
        onClick={() => useStore.getState().selectNode(null)}
        className="flex h-10 w-10 shrink-0 items-center justify-center text-[14px] text-mute transition-colors hover:text-ink"
        aria-label="Close inspector"
      >
        ✕
      </button>
    </div>
  );
}

function Tags({ node }: { node: CaseNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="chip">{KIND_LABEL[node.kind]}</span>
      <span
        className="chip"
        style={{ color: RISK_COLORS[node.risk], borderColor: RISK_COLORS[node.risk] }}
      >
        RISK · {RISK_LABEL[node.risk]}
      </span>
      {node.key && (
        <span className="chip" style={{ color: "var(--signal)", borderColor: "var(--signal)" }}>
          ★ KEY ENTITY
        </span>
      )}
    </div>
  );
}

function TabsRow({
  tab,
  setTab,
  links,
  txns,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  links: number;
  txns: number;
}) {
  const tabs: [Tab, string, number | null][] = [
    ["overview", "OVERVIEW", null],
    ["links", "LINKS", links],
    ["txns", "TXNS", txns],
  ];
  return (
    <div className="hairline-b flex shrink-0 gap-1 px-3">
      {tabs.map(([id, label, count]) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-selected={active}
            className="tab flex items-center gap-1.5"
          >
            {label}
            {count !== null && (
              <span
                className="rounded-sm px-1 text-[9px] tabular-nums"
                style={{
                  background: active ? "var(--signal-soft)" : "rgba(236, 229, 220, 0.08)",
                  color: active ? "var(--signal-deep)" : "var(--faint)",
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── the desktop shell — floating specimen card, plate half ── */

export default function Inspector() {
  const { node, cf } = useSelected();
  if (!node) return null;
  return (
    <aside
      key={node.id}
      className="absolute bottom-5 left-5 top-5 z-40 hidden w-[340px] flex-col overflow-hidden border lg:flex"
      style={{
        background: "var(--paper-2)",
        borderColor: "var(--line-strong)",
        boxShadow: "0 18px 60px rgba(0, 0, 0, 0.55)",
      }}
    >
      <Record node={node} cf={cf} />
    </aside>
  );
}

/* ── the mobile shell — the swap pane: fills the REPORT half ── */

export function EntityPane() {
  const { node, cf } = useSelected();
  if (!node) return null;
  return (
    <div
      key={node.id}
      className="fade-in absolute inset-0 z-30 flex flex-col bg-[var(--paper)] lg:hidden"
      role="complementary"
      aria-label="Entity record"
    >
      <Record node={node} cf={cf} swapHint />
    </div>
  );
}

/* ── the record itself (header · tags · tabs · body) ───────── */

function Record({ node, cf, swapHint }: { node: CaseNode; cf: CaseFileT; swapHint?: boolean }) {
  const [tab, setTab] = useState<Tab>("overview");
  /* per-case unit — never hardcode a chain: SLINK is ETH, SHARAV is SOL */
  const unit = cf.unit ?? "ETH";
  const { copy, copied, copyFail } = useCopy();

  const conns = useMemo(
    () =>
      cf.edges
        .filter((e) => e.source === node.id || e.target === node.id)
        .map((e) => {
          const otherId = e.source === node.id ? e.target : e.source;
          const other = cf.nodes.find((n) => n.id === otherId);
          const dir: "out" | "in" = e.source === node.id ? "out" : "in";
          return { e, other, dir };
        })
        .filter((r) => r.other),
    [cf, node.id],
  );

  const txs = useMemo(
    () => conns.flatMap((r) => r.e.txs.map((t) => ({ ...t, via: r.other!.short }))),
    [conns],
  );

  return (
    <>
      {/* header */}
      <div className="hairline-b shrink-0 px-4 pb-2.5 pt-3">
        <Identity node={node} />
        <div className="mt-2">
          <Tags node={node} />
        </div>
        {swapHint && (
          <p className="mono mt-2 text-[8.5px] tracking-[0.18em] text-faint">
            TAP ANOTHER BUBBLE TO COMPARE · ✕ RETURNS TO THE REPORT
          </p>
        )}
      </div>

      <TabsRow tab={tab} setTab={setTab} links={conns.length} txns={txs.length} />

      {/* body */}
      <div className="slim-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4 lg:pb-4">
        {tab === "overview" && (
          <Overview node={node} copy={copy} copied={copied} copyFail={copyFail} />
        )}
        {tab === "links" && <Links conns={conns} unit={unit} />}
        {tab === "txns" && (
          <Txns txs={txs} unit={unit} copy={copy} copied={copied} copyFail={copyFail} />
        )}
      </div>
    </>
  );
}

type Tab = "overview" | "links" | "txns";
type CaseFileT = ReturnType<typeof useStore.getState>["caseFile"];

function Overview({
  node,
  copy,
  copied,
  copyFail,
}: {
  node: CaseNode;
  copy: (t: string, tag: string) => void;
  copied: string | null;
  copyFail: string | null;
}) {
  const unit = node.chain.includes("SOLANA") ? "SOL" : "";
  return (
    <div className="space-y-4">
      <button
        className="mono flex w-full items-center justify-between gap-2 border bg-[var(--paper-2)] px-3 py-2.5 text-left transition-colors hover:border-ink"
        onClick={() => copy(node.address, "addr")}
      >
        <span className="truncate text-[11px] text-ink">{node.address}</span>
        <span
          className="label shrink-0"
          style={{
            color:
              copied === "addr"
                ? "var(--signal-deep)"
                : copyFail === "addr"
                  ? "var(--signal-deep)"
                  : undefined,
          }}
        >
          {copied === "addr" ? "COPIED ✓" : copyFail === "addr" ? "OPEN KEYBOARD TO COPY" : "COPY"}
        </span>
      </button>

      <div className="grid grid-cols-3 gap-px bg-[var(--line)]">
        {[
          ["RECEIVED", node.received],
          ["SENT", node.sent],
          ["BALANCE", node.balance],
        ].map(([l, v]) => (
          <div key={l as string} className="bg-[var(--paper-2)] px-1.5 py-3 text-center">
            <p className="mono text-[12px] font-semibold tabular-nums text-ink">
              {fmtEth(v as number)}
              <span className="ml-0.5 text-[8px] text-faint">{unit}</span>
            </p>
            <p className="label mt-1">{l as string}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="label">WINDOW</span>
        <span className="mono text-[10.5px] text-mute">
          {node.firstSeen} → {node.lastSeen}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="label">CHAIN</span>
        <span className="mono text-[10.5px] text-ink">{node.chain}</span>
      </div>

      {node.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {node.tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      )}

      {node.note && (
        <p
          className="read border-l-2 pl-3 text-[13.5px]"
          style={{ borderColor: "rgba(255, 82, 51, 0.5)" }}
        >
          {node.note}
        </p>
      )}

      {node.attribution && (
        <div
          className="border bg-[var(--paper-2)] px-3 py-3"
          style={{ borderColor: "rgba(255, 82, 51, 0.5)" }}
        >
          <p className="label mb-1.5" style={{ color: "var(--signal-deep)" }}>
            ATTRIBUTION · {node.attribution.confidence.toUpperCase()} CONFIDENCE
          </p>
          <p className="text-[12.5px] font-semibold text-ink">{node.attribution.claim}</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-mute">
            {node.attribution.basis}
          </p>
        </div>
      )}
    </div>
  );
}

function Links({
  conns,
  unit,
}: {
  conns: { e: CaseEdge; other?: CaseNode; dir: "in" | "out" }[];
  unit: string;
}) {
  const selectNode = useStore((s) => s.selectNode);
  if (conns.length === 0)
    return <p className="label py-6 text-center">NO LINKS ON RECORD</p>;
  return (
    <div className="space-y-1.5">
      {conns.map(({ e, other, dir }) => (
        <button
          key={e.id}
          onClick={() => other && selectNode(other.id)}
          className="flex w-full items-center gap-2.5 border bg-[var(--paper-2)] px-3 py-2.5 text-left transition-colors hover:border-ink"
        >
          <span
            className="mono shrink-0 text-[13px]"
            style={{ color: dir === "out" ? "var(--signal)" : EPI_COLORS[e.epistemic] }}
          >
            {dir === "out" ? "→" : "←"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="mono block truncate text-[12px] text-ink">
              {other?.short}
            </span>
            <span className="label">{KIND_LABEL[other!.kind]} · {EPI_LABEL[e.epistemic]}</span>
          </span>
          <span className="mono shrink-0 text-[11px] tabular-nums text-mute">
            {e.valueLabel ?? `${fmtEth(e.value)} ${unit}`}
          </span>
        </button>
      ))}
    </div>
  );
}

function Txns({
  txs,
  unit,
  copy,
  copied,
  copyFail,
}: {
  txs: { hash: string; ts: string; value: number; chain: string; kind: string; via: string }[];
  unit: string;
  copy: (t: string, tag: string) => void;
  copied: string | null;
  copyFail: string | null;
}) {
  if (txs.length === 0)
    return <p className="label py-6 text-center">NO TRANSACTIONS ON RECORD</p>;
  return (
    <div className="space-y-1.5">
      {txs.map((t, i) => (
        <button
          key={`${t.hash}-${i}`}
          onClick={() => copy(t.hash, `tx${i}`)}
          className="block w-full border bg-[var(--paper-2)] px-3 py-2.5 text-left transition-colors hover:border-ink"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="mono truncate text-[11px] text-ink">
              {t.hash.slice(0, 10)}…{t.hash.slice(-8)}
            </span>
            <span
              className="label shrink-0"
              style={{
                color:
                  copied === `tx${i}`
                    ? "var(--signal-deep)"
                    : copyFail === `tx${i}`
                      ? "var(--signal-deep)"
                      : undefined,
              }}
            >
              {copied === `tx${i}` ? "COPIED ✓" : copyFail === `tx${i}` ? "COPY ✕" : "COPY"}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="mono text-[10.5px] text-signal">
              {fmtEth(t.value)} {unit} → {t.via}
            </span>
            <span className="label">{t.ts}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
