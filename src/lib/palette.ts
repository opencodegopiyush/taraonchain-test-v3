import type { NodeKind, Epistemic } from "./types";

export const SCENE_BG = "#050606";

/* entity-type hues — restrained, desaturated; the epistemic colors
   carry the meaning, kind hues carry the taxonomy */
export const NODE_COLORS: Record<NodeKind, string> = {
  protocol: "#7fa8a0",
  wallet: "#9bb8ac",
  contract: "#8e979e",
  mixer: "#c97b4a",
  bridge: "#6fa3b8",
  otc: "#c9a24b",
  exchange: "#56b8b0",
  cluster: "#a8b496",
  vault: "#b0b7ac",
};

export const EPI_COLORS: Record<Epistemic, string> = {
  observed: "#3fcfa4",
  assessed: "#e8a33d",
  unknown: "#7c828c",
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
