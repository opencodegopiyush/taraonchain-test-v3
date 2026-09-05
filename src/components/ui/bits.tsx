"use client";

import { useState } from "react";
import { EPI_COLORS, EPI_LABEL, NODE_COLORS, KIND_LABEL } from "@/lib/palette";
import type { Epistemic } from "@/lib/types";
import { Icon } from "./icons";
import { useToast } from "@/hooks/use-toast";
import { CASE } from "@/lib/case-data";

/* v4 touch feedback — spawn a ripple at the tap point inside the
   current target. host element needs the .t4-ripple-host class
   (position relative + overflow hidden). */
export function spawnRipple(e: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>) {
  const host = e.currentTarget;
  if (typeof document === "undefined") return;
  const r = host.getBoundingClientRect();
  const d = Math.max(r.width, r.height) * 1.15;
  const ink = document.createElement("span");
  ink.className = "t4-ripple-ink";
  ink.style.width = `${d}px`;
  ink.style.height = `${d}px`;
  ink.style.left = `${e.clientX - r.left - d / 2}px`;
  ink.style.top = `${e.clientY - r.top - d / 2}px`;
  host.appendChild(ink);
  window.setTimeout(() => ink.remove(), 620);
}

export function EpiDot({ e, className }: { e: Epistemic; className?: string }) {
  return (
    <span
      className={`dot ${className ?? ""}`}
      style={{ background: EPI_COLORS[e], boxShadow: `0 0 5px ${EPI_COLORS[e]}66` }}
    />
  );
}

export function EpiChip({ e, text }: { e: Epistemic; text?: string }) {
  return (
    <span className="chip">
      <EpiDot e={e} />
      <span>{text ?? EPI_LABEL[e]}</span>
    </span>
  );
}

export function ConfidenceChip({ c }: { c: "high" | "medium" | "low" }) {
  const color = c === "high" ? "var(--fact)" : c === "medium" ? "var(--assess)" : "var(--unknown)";
  return (
    <span className="chip" style={{ color, borderColor: "var(--line-strong)" }}>
      {c.toUpperCase()} CONFIDENCE
    </span>
  );
}

export function SectionLabel({ children, no }: { children: React.ReactNode; no?: string }) {
  return (
    <div className="flex items-baseline gap-3">
      {no && <span className="datum text-[10px]" style={{ color: "var(--assess)" }}>{no}</span>}
      <span className="label" style={{ color: "var(--ink-mute)" }}>{children}</span>
      <span className="h-px flex-1" style={{ background: "var(--line)" }} />
    </div>
  );
}

export function CopyBtn({ text, label }: { text: string; label?: string }) {
  const { toast } = useToast();
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn-ghost btn !px-2 !py-1 inline-flex items-center gap-1.5"
      onClick={() => {
        try {
          navigator.clipboard?.writeText(text);
        } catch {
          /* clipboard unavailable in sandbox */
        }
        setDone(true);
        setTimeout(() => setDone(false), 1400);
        toast({ title: "Address copied", description: "Public chain record — verify it independently on any explorer." });
      }}
      aria-label={label ?? "copy"}
    >
      <Icon name={done ? "check" : "copy"} size={12} />
    </button>
  );
}

/* ── graph legend — shared by control dock and method overlay ── */

export function LegendContent() {
  const kinds: (keyof typeof NODE_COLORS)[] = [
    "protocol", "wallet", "contract", "mixer", "bridge", "otc", "exchange", "cluster",
  ];
  return (
    <div className="flex flex-col gap-5 text-left">
      <div>
        <div className="label mb-2.5" style={{ color: "var(--ink-faint)" }}>Entities</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {kinds.map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="dot" style={{ background: NODE_COLORS[k] }} />
              <span className="label !tracking-[0.08em]" style={{ color: "var(--ink-mute)" }}>{KIND_LABEL[k]}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="label mb-2.5" style={{ color: "var(--ink-faint)" }}>Flow · epistemic status</div>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <svg width="34" height="6"><line x1="0" y1="3" x2="34" y2="3" stroke={EPI_COLORS.observed} strokeWidth="1.6" /></svg>
            <span className="label !tracking-[0.08em]" style={{ color: "var(--ink-mute)" }}>Observed — on-chain transaction</span>
          </div>
          <div className="flex items-center gap-3">
            <svg width="34" height="6"><line x1="0" y1="3" x2="34" y2="3" stroke={EPI_COLORS.assessed} strokeWidth="1.6" strokeDasharray="4 3" /></svg>
            <span className="label !tracking-[0.08em]" style={{ color: "var(--ink-mute)" }}>Assessed — inferred link</span>
          </div>
          <div className="flex items-center gap-3">
            <svg width="34" height="6"><line x1="0" y1="3" x2="34" y2="3" stroke={EPI_COLORS.unknown} strokeWidth="1.6" strokeDasharray="1.5 3.5" /></svg>
            <span className="label !tracking-[0.08em]" style={{ color: "var(--ink-mute)" }}>Unresolved — no linkage claim</span>
          </div>
        </div>
      </div>
      <div>
        <div className="label mb-2.5" style={{ color: "var(--ink-faint)" }}>Scale encoding</div>
        <p className="doc text-[13.5px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>
          Bubble size follows significance in the flow; moving particles show direction and
          relative magnitude. Dashed flows travel only where the chain itself does not vouch
          for the connection — always read them as our analysis, never as fact.
        </p>
      </div>
    </div>
  );
}

/* ── case status chip ── */

export function CaseStatus({ status }: { status: "ACTIVE" | "MONITORING" | "CLOSED" }) {
  const color = status === "ACTIVE" ? "var(--assess)" : status === "MONITORING" ? "var(--fact)" : "var(--ink-faint)";
  return (
    <span className="chip inline-flex items-center gap-1.5" style={{ color, borderColor: "var(--line)" }}>
      <span className={`dot ${status === "ACTIVE" ? "pulse-dot" : ""}`} style={{ background: color, color }} />
      {status}
    </span>
  );
}

export function Progress({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-[3px] w-24" style={{ background: "rgba(242,234,216,0.08)" }}>
        <div className="h-full" style={{ width: `${pct}%`, background: "var(--assess)" }} />
      </div>
      <span className="datum text-[10px]" style={{ color: "var(--ink-mute)" }}>{pct}%</span>
    </div>
  );
}

export function useCase() {
  return CASE;
}
