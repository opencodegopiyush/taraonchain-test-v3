import type { NodeKind, Epistemic } from "./types";

export const SCENE_BG = "#070911";

/* entity-type hues — restrained, desaturated; the epistemic colors
   carry the meaning, kind hues carry the taxonomy.
   v4 "indigo night" family: blues · violets · one warm alarm red */
export const NODE_COLORS: Record<NodeKind, string> = {
  protocol: "#8fa6e8",
  wallet: "#9fb4d9",
  contract: "#8e97b5",
  mixer: "#c96a8a",
  bridge: "#6fc8d8",
  otc: "#b59aff",
  exchange: "#56b8e8",
  cluster: "#98a6c9",
  vault: "#a8b0c9",
};

export const EPI_COLORS: Record<Epistemic, string> = {
  observed: "#53d6ee",
  assessed: "#a78bfa",
  unknown: "#8a93a6",
};

export const EPI_LABEL: Record<Epistemic, string> = {
  observed: "Observed",
  assessed: "Assessed",
  unknown: "Unresolved",
};

export const KIND_LABEL: Record<NodeKind, string> = {
  protocol: "Protocol",
  wallet: "Wallet",
  contract: "Contract",
  mixer: "Mixer",
  bridge: "Bridge",
  otc: "OTC desk",
  exchange: "Exchange",
  cluster: "Assessed cluster",
  vault: "Cold storage",
};

export const RISK_LABEL = ["", "low", "elevated", "severe"] as const;

export const fmtEth = (n: number) =>
  n >= 1000
    ? `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} ETH`
    : n >= 1
      ? `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })} ETH`
      : n === 0
        ? "—"
        : `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} ETH`;
