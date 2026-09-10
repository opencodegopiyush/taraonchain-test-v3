import type { NodeKind, Epistemic } from "./types";

/* ── v16 "STILL" palette — ink on cool paper, one blue ───────
   the graph reads like a printed figure in a dossier: flat
   ink shapes, graphite hairlines, electric blue reserved for
   the assessed story. no glow, no gradients, no motion dust. */

export const SCENE_BG = "#f5f5f2";

export const NODE_COLORS: Record<NodeKind, string> = {
  protocol: "#111113", // ink
  wallet: "#2440f5", // signal blue — wallets are the story
  contract: "#0f766e", // teal ink
  mixer: "#c22b1f", // alarm red
  bridge: "#b06d10", // ochre
  otc: "#6d5b3a", // umber
  exchange: "#1f5f8b", // petrol
  cluster: "#9a9aa2", // graphite
  vault: "#3f3f46", // pressed ink
};

export const EPI_COLORS: Record<Epistemic, string> = {
  observed: "#111113", // printed fact — solid ink
  assessed: "#2440f5", // blue — reading between the lines
  unknown: "#a6a6ad", // graphite ghost
};

export const EPI_LABEL: Record<Epistemic, string> = {
  observed: "OBSERVED",
  assessed: "ASSESSED",
  unknown: "UNKNOWN",
};

export const KIND_LABEL: Record<NodeKind, string> = {
  protocol: "PROTOCOL",
  wallet: "WALLET",
  contract: "CONTRACT",
  mixer: "MIXER",
  bridge: "BRIDGE",
  otc: "OTC DESK",
  exchange: "EXCHANGE",
  cluster: "CLUSTER",
  vault: "VAULT",
};

export const RISK_LABEL: Record<0 | 1 | 2 | 3, string> = {
  0: "CLEAN",
  1: "LOW",
  2: "ELEVATED",
  3: "CRITICAL",
};

export const RISK_COLORS: Record<0 | 1 | 2 | 3, string> = {
  0: "#a6a6ad",
  1: "#6d6d74",
  2: "#b06d10",
  3: "#c22b1f",
};

export function fmtEth(n: number): string {
  /* huge aggregates read better rounded — exact figures stay on the
     edge labels via valueLabel, which is never re-formatted */
  const digits = Math.abs(n) >= 100 ? 0 : 2;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}
