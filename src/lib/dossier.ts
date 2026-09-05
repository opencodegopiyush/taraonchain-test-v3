import type {
  CaseEdge,
  CaseNode,
  Chapter,
  ChapterFact,
  Confidence,
  DossierChapter,
  DossierEntity,
  DossierFile,
  DossierGraph,
  Epistemic,
  EvidenceRow,
  Finding,
  NodeKind,
} from "./types";

/* ── the admin template's input shape ───────────────────────── */

export interface DraftEntity {
  label: string;
  short: string;
  kind: NodeKind;
  chain: string;
  note: string;
}

export interface DraftConnection {
  from: string;
  to: string;
  value: string;
  channel: "direct" | "mixer" | "bridge" | "otc" | "cluster";
  epistemic: Epistemic;
  basis: string;
  when: string;
  txHash: string;
}

export interface DraftChapter {
  kicker: string;
  title: string;
  body: string; // paragraphs separated by blank lines
  facts: string; // lines of "observed | text" / "assessed | text" / "unknown | text"
  focus: string; // comma-separated entity shorts
}

export interface DraftFinding {
  title: string;
  epistemic: Epistemic;
  confidence: "" | Confidence;
  body: string;
}

export interface DraftCase {
  id: string;
  codename: string;
  status: "ACTIVE" | "MONITORING" | "CLOSED";
  victim: string;
  chains: string;
  amountText: string;
  amountUsd: string;
  span: string;
  updated: string;
  progress: string;
  summary: string;
  method: string;
  limitations: string;
  nextSteps: string; // one per line
  sourceNote?: string;
  assetRows?: { loc: string; amt: string; state: string; tone: "fact" | "assess" | "risk" | "unknown" }[];
  entities: DraftEntity[];
  connections: DraftConnection[];
  chapters: DraftChapter[];
  findings: DraftFinding[];
  /* optional full 3d payload — when supplied and referentially valid the
     published case opens in the interactive graph workspace */
  graph?: DossierGraph;
}

export const emptyDraft = (): DraftCase => ({
  id: "",
  codename: "",
  status: "ACTIVE",
  victim: "",
  chains: "",
  amountText: "",
  amountUsd: "",
  span: "",
  updated: new Date().toISOString().slice(0, 10),
  progress: "0",
  summary: "",
  method: "",
  limitations: "",
  nextSteps: "",
  entities: [
    { label: "", short: "", kind: "wallet", chain: "", note: "" },
    { label: "", short: "", kind: "wallet", chain: "", note: "" },
  ],
  connections: [{ from: "", to: "", value: "", channel: "direct", epistemic: "observed", basis: "", when: "", txHash: "" }],
  chapters: [{ kicker: "", title: "", body: "", facts: "", focus: "" }],
  findings: [{ title: "", epistemic: "observed", confidence: "", body: "" }],
});

/* ── validation + compilation ───────────────────────────────── */

/* coerce an untrusted JSON body (agent API / admin API) into the DraftCase
   shape — unknown or missing fields become empty values so buildDossier
   reports proper validation errors instead of crashing on malformed input */
export function normalizeDraft(raw: unknown): DraftCase {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  const ent = (v: unknown): DraftEntity => {
    const e = (typeof v === "object" && v !== null ? v : {}) as Record<string, unknown>;
    return {
      label: str(e.label),
      short: str(e.short),
      kind: KINDS.includes(e.kind as NodeKind) ? (e.kind as NodeKind) : "wallet",
      chain: str(e.chain),
      note: str(e.note),
    };
  };
  const con = (v: unknown): DraftConnection => {
    const c = (typeof v === "object" && v !== null ? v : {}) as Record<string, unknown>;
    return {
      from: str(c.from),
      to: str(c.to),
      value: str(c.value),
      channel: CHANNELS.includes(c.channel as DraftConnection["channel"])
        ? (c.channel as DraftConnection["channel"])
        : "direct",
      epistemic: EPISTEMICS.includes(c.epistemic as Epistemic) ? (c.epistemic as Epistemic) : "unknown",
      basis: str(c.basis),
      when: str(c.when),
      txHash: str(c.txHash),
    };
  };
  const chp = (v: unknown): DraftChapter => {
    const c = (typeof v === "object" && v !== null ? v : {}) as Record<string, unknown>;
    return { kicker: str(c.kicker), title: str(c.title), body: str(c.body), facts: str(c.facts), focus: str(c.focus) };
  };
  const fnd = (v: unknown): DraftFinding => {
    const f = (typeof v === "object" && v !== null ? v : {}) as Record<string, unknown>;
    return {
      title: str(f.title),
      epistemic: EPISTEMICS.includes(f.epistemic as Epistemic) ? (f.epistemic as Epistemic) : "unknown",
      confidence: f.confidence === "high" || f.confidence === "medium" || f.confidence === "low" ? f.confidence : "",
      body: str(f.body),
    };
  };
  const rows = Array.isArray(r.assetRows)
    ? r.assetRows
        .map((v) => {
          const a = (typeof v === "object" && v !== null ? v : {}) as Record<string, unknown>;
          return { loc: str(a.loc), amt: str(a.amt), state: str(a.state), tone: str(a.tone) };
        })
        .filter((a) => a.loc && a.amt && ["fact", "assess", "risk", "unknown"].includes(a.tone))
    : undefined;

  return {
    id: str(r.id),
    codename: str(r.codename),
    status: r.status === "MONITORING" || r.status === "CLOSED" ? r.status : "ACTIVE",
    victim: str(r.victim),
    chains: str(r.chains),
    amountText: str(r.amountText),
    amountUsd: str(r.amountUsd),
    span: str(r.span),
    updated: str(r.updated),
    progress: str(r.progress),
    summary: str(r.summary),
    method: str(r.method),
    limitations: str(r.limitations),
    nextSteps: str(r.nextSteps),
    sourceNote: str(r.sourceNote) || undefined,
    assetRows: rows && rows.length > 0 ? rows : undefined,
    graph: (r.graph ?? undefined) as DraftCase["graph"],
    entities: list(r.entities).map(ent),
    connections: list(r.connections).map(con),
    chapters: list(r.chapters).map(chp),
    findings: list(r.findings).map(fnd),
  };
}

const KINDS: NodeKind[] = ["protocol", "wallet", "contract", "mixer", "bridge", "otc", "exchange", "cluster", "vault"];
const CHANNELS: DraftConnection["channel"][] = ["direct", "mixer", "bridge", "otc", "cluster"];
const EPISTEMICS: Epistemic[] = ["observed", "assessed", "unknown"];

function parseFacts(raw: string, where: string, errors: string[]): ChapterFact[] {
  const out: ChapterFact[] = [];
  raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line, i) => {
      const m = line.match(/^(observed|assessed|unknown)\s*\|\s*(.+)$/i);
      if (!m) {
        errors.push(`${where} · fact line ${i + 1}: use "observed | text" (or assessed / unknown)`);
        return;
      }
      const e = m[1].toLowerCase() as Epistemic;
      if (!EPISTEMICS.includes(e)) errors.push(`${where} · fact line ${i + 1}: unknown register "${m[1]}"`);
      out.push({ epistemic: e, text: m[2].trim() });
    });
  return out;
}

/* deterministic pseudo record id for connections without a supplied hash */
function synthHash(seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let h2 = Math.imul(h ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  const hex = (n: number) => n.toString(16).padStart(8, "0").slice(0, 4);
  return `0x${hex(h)}…${hex(h2)}`;
}

export type BuildResult =
  | { ok: true; dossier: DossierFile }
  | { ok: false; errors: string[] };

/* referential checks for the optional full 3d payload — any structural
   surprise (nulls, wrong types) simply discards the graph so the case
   falls back to the synthesized 3d instead of crashing */
function validateGraph(g: DossierGraph | undefined, chapterCount: number): DossierGraph | undefined {
  try {
    if (!g || !Array.isArray(g.nodes) || !Array.isArray(g.edges)) return undefined;
    if (g.nodes.length < 2 || g.edges.length < 1) return undefined;
    const nodeIds = new Set(g.nodes.map((n) => n.id));
    const edgeIds = new Set<string>();
    for (const n of g.nodes) {
      if (!n || !n.id || !nodeIds.has(n.id)) return undefined;
      if (!Array.isArray(n.pos) || n.pos.length !== 3) return undefined;
    }
    for (const e of g.edges) {
      if (!e || !e.id || edgeIds.has(e.id)) return undefined;
      if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return undefined;
      edgeIds.add(e.id);
    }
    if (g.chapterEdges) {
      for (const list of g.chapterEdges) {
        if (!Array.isArray(list)) return undefined;
        for (const id of list) if (!edgeIds.has(id)) return undefined;
      }
    }
    if (g.chapterCams && g.chapterCams.length !== chapterCount) return undefined;
    return g;
  } catch {
    return undefined;
  }
}

export function buildDossier(d: DraftCase): BuildResult {
  const errors: string[] = [];

  const id = d.id.trim().toUpperCase();
  if (!/^[A-Z]{1,2}-\d{3,4}$/.test(id)) errors.push("Case id: use the format H-0721 (letter dash digits).");
  const codename = d.codename.trim().toUpperCase();
  if (codename.length < 3) errors.push("Codename: required (e.g. DUST LINE).");
  const summary = d.summary.trim();
  if (summary.length < 30) errors.push("Summary: give at least a couple of sentences (30+ characters).");

  /* entities */
  const shorts = new Set<string>();
  const entities: DossierEntity[] = [];
  d.entities.forEach((e, i) => {
    const short = e.short.trim().toUpperCase();
    const label = e.label.trim();
    if (!short && !label) return; // silently skip fully empty rows
    if (!short || !label) {
      errors.push(`Entity ${i + 1}: both short code and label are required.`);
      return;
    }
    if (shorts.has(short)) {
      errors.push(`Entity ${i + 1}: short code "${short}" is used twice.`);
      return;
    }
    shorts.add(short);
    entities.push({ short, label, kind: e.kind, chain: e.chain.trim().toUpperCase() || undefined, note: e.note.trim() || undefined });
  });
  if (entities.length < 2) errors.push("Entities: at least two are needed to draw a flow.");

  /* connections */
  const evidence: EvidenceRow[] = [];
  let links = 0;
  d.connections.forEach((c, i) => {
    const from = c.from.trim().toUpperCase();
    const to = c.to.trim().toUpperCase();
    if (!from && !to && !c.value.trim()) return; // skip empty rows
    if (!shorts.has(from)) errors.push(`Connection ${i + 1}: source "${from || "—"}" is not in the entity list.`);
    if (!shorts.has(to)) errors.push(`Connection ${i + 1}: destination "${to || "—"}" is not in the entity list.`);
    if (from === to && from) errors.push(`Connection ${i + 1}: source and destination are the same.`);
    if (!c.value.trim()) errors.push(`Connection ${i + 1}: value is required (e.g. 2.40 ETH).`);
    if (errors.length) return;
    links++;
    evidence.push({
      hash: c.txHash.trim() || "—",
      block: "—",
      ts: c.when.trim() || "—",
      route: `${from} → ${to}`,
      value: c.value.trim(),
      chain: entities.find((e) => e.short === from)?.chain || d.chains.split(",")[0]?.trim().toUpperCase() || "—",
      epistemic: c.epistemic,
    });
  });
  if (links < 1) errors.push("Connections: at least one valid flow is required.");

  /* chapters */
  const chapters: DossierChapter[] = [];
  d.chapters.forEach((c, i) => {
    const title = c.title.trim();
    const body = c.body.trim();
    if (!title && !body) return; // skip empty rows
    if (!title) errors.push(`Chapter ${i + 1}: title is required.`);
    if (!body) errors.push(`Chapter ${i + 1}: body text is required.`);
    if (errors.length) return;
    const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const focus = c.focus.split(",").map((s) => s.trim().toUpperCase()).filter((s) => shorts.has(s));
    chapters.push({
      no: String(chapters.length + 1).padStart(2, "0"),
      kicker: c.kicker.trim() || "Chapter",
      title,
      paragraphs,
      facts: parseFacts(c.facts, `Chapter ${i + 1}`, errors),
      focus,
    });
  });
  if (chapters.length < 1) errors.push("Chapters: at least one is required.");

  /* findings */
  const findings: Finding[] = [];
  d.findings.forEach((f, i) => {
    const title = f.title.trim();
    const body = f.body.trim();
    if (!title && !body) return;
    if (!title || !body) {
      errors.push(`Finding ${i + 1}: title and body are both required.`);
      return;
    }
    findings.push({
      id: `F-${String(findings.length + 1).padStart(2, "0")}`,
      title,
      epistemic: f.epistemic,
      confidence: f.confidence || undefined,
      body,
    });
  });

  const chains = d.chains.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (chains.length === 0) errors.push("Chains: at least one (comma separated, e.g. ETHEREUM, SOLANA).");

  if (errors.length) return { ok: false, errors };

  const progress = Math.max(0, Math.min(100, parseInt(d.progress || "0", 10) || 0));

  const dossier: DossierFile = {
    id,
    codename,
    status: d.status,
    victim: d.victim.trim() || "—",
    chains,
    amountText: d.amountText.trim() || "—",
    amountUsd: d.amountUsd.trim() || "—",
    span: d.span.trim() || "—",
    updated: d.updated.trim() || new Date().toISOString().slice(0, 10),
    progress,
    summary,
    method:
      d.method.trim() ||
      "Findings derive from public chain records. Direct transfers are reported as observations; inferred linkages are reported as assessments with explicit confidence grades.",
    limitations:
      d.limitations.trim() ||
      "Assessments in this dossier are investigative working conclusions, not adjudicated facts. Entity labels may lag operational reality.",
    sourceNote: d.sourceNote?.trim() || undefined,
    assetRows: d.assetRows && d.assetRows.length > 0 ? d.assetRows : undefined,
    entities,
    chapters,
    findings,
    evidence,
    nextSteps: d.nextSteps.split("\n").map((s) => s.trim()).filter(Boolean),
    stats: { entities: entities.length, links },
    graph: validateGraph(d.graph, chapters.length),
  };

  return { ok: true, dossier };
}

/* ── worked example — shows the template's shape ─────────────── */

export const sampleDraft = (): DraftCase => ({
  id: "H-0721",
  codename: "Dust Line",
  status: "MONITORING",
  victim: "Retail wallets (drainer gadget)",
  chains: "ETHEREUM",
  amountText: "2.41 ETH",
  amountUsd: "$7,900",
  span: "JUL 02 — JUL 19 2025",
  updated: "2025-07-19",
  progress: "35",
  summary:
    "A phishing gadget signed a hidden approval from twelve victim wallets, sweeping 2.41 ETH in small transfers through two sweeper wallets before consolidation. Early-stage case — flow mapping complete, exits under watch.",
  method:
    "Findings derive from public Ethereum records only. The gadget linkage is behavioural; the consolidation assessment rests on amount and timing correlation, graded medium confidence.",
  limitations:
    "Attribution of the gadget operator is not established. Exit-venue coverage depends on exchange cooperation and may change.",
  nextSteps: "Watch HOLD-1 for further consolidation\nIdentify exit venue of the KITE swap leg\nExpand victim cluster through approval-graph search",
  entities: [
    { label: "Victim wallets (12)", short: "VICTIM", kind: "cluster", chain: "ETHEREUM", note: "Signed the same approval payload" },
    { label: "Drainer gadget contract", short: "GADGET", kind: "contract", chain: "ETHEREUM", note: "approve() with unlimited allowance" },
    { label: "Sweeper wallet A", short: "SWP-A", kind: "wallet", chain: "ETHEREUM", note: "Created 40 min before first drain" },
    { label: "Sweeper wallet B", short: "SWP-B", kind: "wallet", chain: "ETHEREUM", note: "Created 43 min before first drain" },
    { label: "Consolidation wallet", short: "HOLD-1", kind: "wallet", chain: "ETHEREUM", note: "Holds swept funds; no outflow yet" },
    { label: "Kite Swap", short: "KITE", kind: "exchange", chain: "ETHEREUM", note: "No-KYC swap venue; monitored" },
  ],
  connections: [
    { from: "VICTIM", to: "GADGET", value: "2.41 ETH", channel: "direct", epistemic: "observed", basis: "12 identical approval txs", when: "07-02 → 07-11", txHash: "" },
    { from: "GADGET", to: "SWP-A", value: "1.12 ETH", channel: "direct", epistemic: "observed", basis: "", when: "07-11 04:19", txHash: "" },
    { from: "GADGET", to: "SWP-B", value: "1.29 ETH", channel: "direct", epistemic: "observed", basis: "", when: "07-11 04:22", txHash: "" },
    { from: "SWP-A", to: "HOLD-1", value: "1.11 ETH", channel: "direct", epistemic: "observed", basis: "", when: "07-13 22:41", txHash: "" },
    { from: "SWP-B", to: "HOLD-1", value: "1.27 ETH", channel: "direct", epistemic: "observed", basis: "", when: "07-14 01:03", txHash: "" },
    { from: "HOLD-1", to: "KITE", value: "0.83 ETH", channel: "direct", epistemic: "assessed", basis: "amount match within 0.9%", when: "07-18 11:57", txHash: "" },
  ],
  chapters: [
    {
      kicker: "Origin",
      title: "A signature nobody meant to give",
      body:
        "Between 2 and 11 July, twelve wallets signed what looked like a routine mint approval. The payload carried an unlimited allowance to a contract we call the gadget — a drainer front.\n\nThe gadget waited. Some do. Four hundred approvals is a good week, and patience costs nothing on-chain.",
      facts: "observed | 12 identical approval signatures\nassessed | Same template, same deployer funding pattern — high confidence",
      focus: "VICTIM, GADGET",
    },
    {
      kicker: "The sweep",
      title: "Two sweepers, three minutes apart",
      body:
        "On 11 July the gadget moved for the first time, forwarding 1.12 ETH to sweeper A and 1.29 ETH to sweeper B within three minutes. Both sweepers had been created less than an hour before the first victim signed.\n\nThe split is housekeeping, not cunning: two wallets keep any single freeze from taking everything.",
      facts: "observed | Sweep txs 04:19 and 04:22 UTC\nassessed | Sweeper wallets created in the same funding batch — medium",
      focus: "GADGET, SWP-A, SWP-B",
    },
    {
      kicker: "Where it stands",
      title: "One wallet holds the bag",
      body:
        "The sweepers consolidated into HOLD-1 by 14 July. 0.83 ETH has since appeared at Kite Swap in an amount matching one sweeper tranche within 0.9% — an assessment, not a proof. HOLD-1 still holds roughly 1.55 ETH and has not moved in five days.\n\nThe case stays open. Drains like this are patient, and so are we.",
      facts: "observed | Consolidation at HOLD-1 complete\nunknown | Remaining 1.55 ETH — no outflow yet",
      focus: "HOLD-1, KITE",
    },
  ],
  findings: [
    {
      title: "Drainer gadget harvested twelve wallets via approval phishing",
      epistemic: "observed",
      confidence: "",
      body: "Twelve wallets signed unlimited approvals to contract 0x9d…2f under a mint pretext; 2.41 ETH was subsequently swept by the contract.",
    },
    {
      title: "Sweeper wallets funded from the same batch",
      epistemic: "assessed",
      confidence: "medium",
      body: "SWP-A and SWP-B were created 40–43 minutes before the first approval, funded by one common source transaction.",
    },
    {
      title: "Partial exit through a no-KYC venue",
      epistemic: "assessed",
      confidence: "low",
      body: "A 0.83 ETH deposit at Kite Swap matches sweeper tranche two within 0.9%. The linkage is behavioural and explicitly not an observed transfer.",
    },
  ],
});
