import type { NodeKind, Epistemic } from "./types";

export const SCENE_BG = "#060503";

/* entity-type hues — restrained, desaturated; the epistemic colors
   carry the meaning, kind hues carry the taxonomy.
   v5 "gilded ledger" family: black & gold — champagne · bronze ·
   one warm ember for the mixer/alarm end of the story */
export const NODE_COLORS: Record<NodeKind, string> = {
  protocol: "#e3b95c",
  wallet: "#cfae6e",
  contract: "#a08b62",
  mixer: "#d96a4a",
  bridge: "#d9c08a",
  otc: "#b59a68",
  exchange: "#eecb69",
  cluster: "#a3937a",
  vault: "#8f846f",
};

export const EPI_COLORS: Record<Epistemic, string> = {
  observed: "#e6d9b8",
  assessed: "#e3b95c",
  unknown: "#877e6c",
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
