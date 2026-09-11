import type { NodeKind, Epistemic } from "./types";

/* ── v19 "NIGHT SHIFT" palette — bone on ink-black, one red ──
   the graph reads like an illuminated plate on a dark bench:
   luminous flat discs on near-black, bone hairlines, and the
   hot signal red reserved for the assessed story. no glow,
   no gradients, no motion dust. */

export const SCENE_BG = "#0b0c0f";

export const NODE_COLORS: Record<NodeKind, string> = {
  protocol: "#ece9e0", // bone — the printed anchor
  wallet: "#ff5233", // signal red — wallets are the story
  contract: "#45d6a4", // mint ink
  mixer: "#ff3b5c", // alarm crimson
  bridge: "#f0b429", // amber
  otc: "#b48cff", // violet
  exchange: "#5eb0f5", // sky
  cluster: "#8b8d95", // graphite
  vault: "#c9c6bc", // bone-grey
};

export const EPI_COLORS: Record<Epistemic, string> = {
  observed: "#ece9e0", // printed fact — solid bone
  assessed: "#ff5233", // signal red — reading between the lines
  unknown: "#585a62", // ghost graphite
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
  0: "#585a62",
  1: "#8b8d95",
  2: "#f0b429",
  3: "#ff3b5c",
};

export function fmtEth(n: number): string {
  /* huge aggregates read better rounded — exact figures stay on the
     edge labels via valueLabel, which is never re-formatted */
  const digits = Math.abs(n) >= 100 ? 0 : 2;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}
