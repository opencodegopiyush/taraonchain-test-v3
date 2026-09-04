export type NodeKind =
  | "protocol"
  | "wallet"
  | "contract"
  | "mixer"
  | "bridge"
  | "otc"
  | "exchange"
  | "cluster"
  | "vault";

export type Epistemic = "observed" | "assessed" | "unknown";

export type Confidence = "high" | "medium" | "low";

export interface TxRef {
  hash: string;
  ts: string;
  value: number;
  chain: string;
  kind: "transfer" | "call" | "bridge" | "pool";
}

export interface CaseNode {
  id: string;
  label: string;
  short: string;
  kind: NodeKind;
  address: string;
  chain: string;
  firstSeen: string;
  lastSeen: string;
  received: number;
  sent: number;
  balance: number;
  risk: 0 | 1 | 2 | 3;
  tags: string[];
  note?: string;
  attribution?: {
    claim: string;
    basis: string;
    confidence: Confidence;
  };
  key?: boolean;
  pos: [number, number, number];
  size?: number;
}

export interface CaseEdge {
  id: string;
  source: string;
  target: string;
  value: number;
  epistemic: Epistemic;
  basis?: string;
  channel: "direct" | "mixer" | "bridge" | "otc" | "cluster";
  txs: TxRef[];
  /* verbatim display value (e.g. "12,747,586 SHARAV") — shown instead of
     the numeric value so non-SOL figures are never re-labelled */
  valueLabel?: string;
}

export interface ChapterFact {
  epistemic: Epistemic;
  text: string;
}

export interface Chapter {
  id: string;
  no: string;
  kicker: string;
  title: string;
  body: string[];
  facts: ChapterFact[];
  focus: string[];
  edges: string[];
  camera: {
    target: [number, number, number];
    radius: number;
    theta: number;
    phi: number;
  };
}

export interface Finding {
  id: string;
  title: string;
  epistemic: Epistemic;
  confidence?: Confidence;
  body: string;
}

export interface EvidenceRow {
  hash: string;
  block: string;
  ts: string;
  route: string;
  value: string;
  chain: string;
  epistemic: Epistemic;
}

export interface CaseIndexEntry {
  id: string;
  codename: string;
  status: "ACTIVE" | "MONITORING" | "CLOSED";
  chains: string;
  exposure: string;
  progress: number;
  updated: string;
  available: boolean;
  summary: string;
}

export interface CaseFile {
  id: string;
  codename: string;
  status: "ACTIVE" | "MONITORING" | "CLOSED";
  victim: string;
  chains: string[];
  amountEth: number;
  amountUsd: string;
  amountLabel?: string;
  unit?: string;
  span: string;
  updated: string;
  stats: { tracedPct: number; frozenEth: number; unaccountedEth: number; entities: number; hops: number };
  summary: string;
  method?: string;
  limitations?: string;
  sourceNote?: string;
  assetRows?: AssetRow[];
  nodes: CaseNode[];
  edges: CaseEdge[];
  chapters: Chapter[];
  findings: Finding[];
  evidence: EvidenceRow[];
  nextSteps: string[];
}

export interface AssetRow {
  loc: string;
  amt: string;
  state: string;
  tone: "fact" | "assess" | "risk" | "unknown";
}

/* ── uploaded dossiers (admin template output) ──────────────── */

export interface DossierEntity {
  short: string;
  label: string;
  kind: NodeKind;
  chain?: string;
  note?: string;
}

export interface DossierChapter {
  no: string;
  kicker: string;
  title: string;
  paragraphs: string[];
  facts: ChapterFact[];
  focus: string[];
}

/* optional full 3d payload — when present, the uploaded dossier drives
   the same interactive graph workspace as the hand-authored case */
export interface DossierGraph {
  nodes: CaseNode[];
  edges: CaseEdge[];
  chapterEdges?: string[][];
  chapterCams?: Chapter["camera"][];
}

export interface DossierFile {
  id: string;
  codename: string;
  status: "ACTIVE" | "MONITORING" | "CLOSED";
  victim: string;
  chains: string[];
  amountText: string;
  amountUsd: string;
  span: string;
  updated: string;
  progress: number;
  summary: string;
  method: string;
  limitations: string;
  sourceNote?: string;
  assetRows?: AssetRow[];
  entities: DossierEntity[];
  chapters: DossierChapter[];
  findings: Finding[];
  evidence: EvidenceRow[];
  nextSteps: string[];
  stats: { entities: number; links: number };
  graph?: DossierGraph;
}

export interface SavedInvestigation {
  dbId: string;
  caseId: string;
  codename: string;
  status: string;
  updated: string;
  createdAt: string;
  dossier: DossierFile;
}
