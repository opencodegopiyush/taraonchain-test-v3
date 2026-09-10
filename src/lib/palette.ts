import type { NodeKind, Epistemic } from "./types";

/* ── v15 "PAPER TRAIL" palette — ink on paper, one signal ────
   the graph reads like a printed plate: ink-stamped nodes,
   graphite hairlines, vermilion reserved for the story. */

export const SCENE_BG = "#f4f1e8";

export const NODE_COLORS: Record<NodeKind, string> = {
  protocol: "#17150e", // ink
  wallet: "#d4491f", // signal vermilion — wallets are the story
  contract: "#3d6b4f", // moss
  mixer: "#7a1e12", // dried blood
  bridge: "#8a6d3b", // raw ochre
  otc: "#5b5340", // umber
  exchange: "#1f4e5f", // petrol
  cluster: "#8a8570", // graphite
  vault: "#3e3a2a", // pressed ink
};

export const EPI_COLORS: Record<Epistemic, string> = {
  observed: "#17150e", // printed fact — solid ink
  assessed: "#d4491f", // signal — reading between the lines
  unknown: "#a09b86", // graphite ghost
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
  0: "#a09b86",
  1: "#5b5340",
  2: "#8a6d3b",
  3: "#a63715",
};

export function fmtEth(n: number): string {
  /* huge aggregates read better rounded — exact figures stay on the
     edge labels via valueLabel, which is never re-formatted */
  const digits = Math.abs(n) >= 100 ? 0 : 2;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}
