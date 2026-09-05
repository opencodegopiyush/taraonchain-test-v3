import type { NodeKind, Epistemic } from "./types";

export const SCENE_BG = "#070809";

/* entity-type hues — restrained, desaturated; the epistemic colors
   carry the meaning, kind hues carry the taxonomy.
   v4 "cobalt vault" family: blues · violets · one warm alarm red */
export const NODE_COLORS: Record<NodeKind, string> = {
  protocol: "#86a5e6",
  wallet: "#9db4d8",
  contract: "#8b95a8",
  mixer: "#d06a6a",
  bridge: "#62b8d9",
  otc: "#8fa0c9",
  exchange: "#4d9fe8",
  cluster: "#9aa6bd",
  vault: "#a9b1c2",
};

export const EPI_COLORS: Record<Epistemic, string> = {
  observed: "#3ecf9a",
  assessed: "#4d8dff",
  unknown: "#7a8291",
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
