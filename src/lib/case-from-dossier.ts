import type {
  CaseEdge,
  CaseFile,
  CaseNode,
  Chapter,
  DossierFile,
} from "./types";

/* ── dossier → live CaseFile ─────────────────────────────────
   every published investigation opens in the same interactive
   3d workspace. when the dossier carries a full graph payload
   it is used verbatim; otherwise a trail is synthesized from
   the template's entities + evidence routes.                    */

const NODE_COLORS_ORDER: CaseNode["kind"][] = [
  "wallet", "contract", "exchange", "cluster", "protocol", "bridge", "mixer", "otc", "vault",
];

function parseValueNum(v: string): number {
  const m = v.replace(/,/g, "").match(/([\d.]+)/);
  return m ? Math.min(9999, parseFloat(m[1])) : 0;
}

/* deterministic pseudo-random from a seed string */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h % 10000) / 10000;
}

/* synthesize a believable trail graph from template data */
function synthesizeGraph(d: DossierFile): { nodes: CaseNode[]; edges: CaseEdge[] } {
  const nodes: CaseNode[] = d.entities.map((e, i) => {
    const r1 = hash01(e.short + "x");
    const r2 = hash01(e.short + "y");
    const r3 = hash01(e.short + "z");
    return {
      id: e.short,
      label: e.label,
      short: e.short,
      kind: NODE_COLORS_ORDER.includes(e.kind) ? e.kind : "wallet",
      address: e.note?.match(/[1-9A-HJ-NP-Za-km-z]{30,44}|0x[a-fA-F0-9]{6,}/)?.[0] ?? "—",
      chain: e.chain || d.chains[0] || "—",
      firstSeen: d.span.split("—")[0]?.trim() || "—",
      lastSeen: d.updated,
      received: Math.round(parseValueNum(d.amountText) * (0.2 + r1)),
      sent: Math.round(parseValueNum(d.amountText) * (0.1 + r2)),
      balance: Math.round(r3 * 100) / 10,
      risk: 0 as const,
      tags: [e.chain || d.chains[0] || "ON-CHAIN"],
      note: e.note,
      pos: [
        -24 + (44 * i) / Math.max(1, d.entities.length - 1) + (r1 - 0.5) * 10,
        (r2 - 0.5) * 9,
        (r3 - 0.5) * 10,
      ],
      size: 0.7 + r1 * 0.7,
    };
  });

  const byShort = new Map(nodes.map((n) => [n.short, n]));
  const edges: CaseEdge[] = [];
  const used = new Set<string>();
  d.evidence.forEach((row, i) => {
    const m = row.route.match(/^(.+?)\s*[→>^-]+?\s*(.+)$/);
    if (!m) return;
    const source = byShort.has(m[1].trim()) ? m[1].trim() : null;
    const target = byShort.has(m[2].trim()) ? m[2].trim() : null;
    if (!source || !target || source === target) return;
    const key = `${source}>${target}`;
    if (used.has(key)) return;
    used.add(key);
    edges.push({
      id: `e-s${String(i).padStart(2, "0")}`,
      source,
      target,
      value: parseValueNum(row.value),
      epistemic: row.epistemic,
      basis: undefined,
      channel: "direct",
      txs: [{ hash: row.hash, ts: row.ts, value: parseValueNum(row.value), chain: row.chain, kind: "transfer" }],
    });
  });

  /* guarantee connectivity — chain entities in template order */
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i].id;
    const b = nodes[i + 1].id;
    if (!edges.some((e) => (e.source === a && e.target === b) || (e.source === b && e.target === a))) {
      edges.push({
        id: `e-c${String(i).padStart(2, "0")}`,
        source: a,
        target: b,
        value: 0,
        epistemic: "assessed",
        basis: "sequential entity linkage",
        channel: "direct",
        txs: [],
      });
    }
  }

  return { nodes, edges };
}

/* orbit-style camera keyframes for chapters without authored ones */
function synthesizeCam(nodes: CaseNode[], focus: string[], i: number, total: number): Chapter["camera"] {
  const pts = focus.length > 0 ? nodes.filter((n) => focus.includes(n.id)) : nodes;
  if (pts.length === 0) pts.push(...nodes);
  const cx = pts.reduce((s, n) => s + n.pos[0], 0) / pts.length;
  const cy = pts.reduce((s, n) => s + n.pos[1], 0) / pts.length;
  const cz = pts.reduce((s, n) => s + n.pos[2], 0) / pts.length;
  const spread = Math.max(
    8,
    ...pts.map((n) => Math.hypot(n.pos[0] - cx, n.pos[1] - cy, n.pos[2] - cz)),
  );
  return {
    target: [cx, cy, cz],
    radius: Math.min(52, spread * 2.6 + 8),
    theta: 1.42 + (i / Math.max(1, total - 1)) * 0.3 - 0.15,
    phi: 1.14,
  };
}

export function dossierToCaseFile(d: DossierFile): CaseFile {
  const g = d.graph;
  const valid = !!(g && g.nodes.length >= 2 && g.edges.length >= 1);

  const synth = valid ? null : synthesizeGraph(d);
  const nodes: CaseNode[] = valid ? g!.nodes : synth!.nodes;
  const edges: CaseEdge[] = valid ? g!.edges : synth!.edges;

  const edgeIds = new Set(edges.map((e) => e.id));
  const nodeIds = new Set(nodes.map((n) => n.id));

  const chapters: Chapter[] = d.chapters.map((c, i) => {
    const focus = c.focus.filter((f) => nodeIds.has(f));
    const chapterEdges = (valid ? g!.chapterEdges?.[i] : undefined) ?? [];
    const safeEdges = chapterEdges.filter((id) => edgeIds.has(id));
    const cam = valid ? g!.chapterCams?.[i] : undefined;
    return {
      id: `ch-${i + 1}-${d.id.toLowerCase()}`,
      no: c.no,
      kicker: c.kicker,
      title: c.title,
      body: c.paragraphs,
      facts: c.facts,
      focus,
      edges: safeEdges,
      camera:
        cam ?? synthesizeCam(nodes, focus, i, d.chapters.length),
    };
  });

  return {
    id: d.id,
    codename: d.codename,
    status: d.status,
    victim: d.victim,
    chains: d.chains,
    amountEth: 0,
    amountUsd: d.amountUsd,
    amountLabel: d.amountText === "—" ? undefined : d.amountText,
    unit: d.chains.some((c) => c.includes("SOLANA")) ? "SOL" : undefined,
    span: d.span,
    updated: d.updated,
    stats: {
      tracedPct: d.progress,
      frozenEth: 0,
      unaccountedEth: 0,
      entities: nodes.length,
      hops: edges.length,
    },
    summary: d.summary,
    method: d.method,
    limitations: d.limitations,
    sourceNote: d.sourceNote,
    assetRows: d.assetRows,
    nodes,
    edges,
    chapters,
    findings: d.findings,
    evidence: d.evidence,
    nextSteps: d.nextSteps,
  };
}
