import { buildSharavDossier } from "../src/lib/sharav-draft";

const d = buildSharavDossier();
console.log(
  "OK —", d.id, d.codename,
  "| entities:", d.stats.entities,
  "| links:", d.stats.links,
  "| chapters:", d.chapters.length,
  "| findings:", d.findings.length,
  "| graph nodes:", d.graph?.nodes.length,
  "| graph edges:", d.graph?.edges.length,
  "| chapterEdges:", d.graph?.chapterEdges?.length,
);
console.log("insider:", d.graph?.nodes.find((n) => n.id === "INSIDER")?.address);
console.log("source:", d.graph?.nodes.find((n) => n.id === "SOURCE")?.address);
console.log("amountText:", d.amountText, "| updated:", d.updated);
/* reference integrity: every edge endpoint + chapterEdge id must resolve */
const ids = new Set(d.graph?.nodes.map((n) => n.id));
const eids = new Set(d.graph?.edges.map((e) => e.id));
let bad = 0;
for (const e of d.graph?.edges ?? []) {
  if (!ids.has(e.source) || !ids.has(e.target)) { console.log("BAD EDGE", e.id); bad++; }
}
for (const [ci, list] of (d.graph?.chapterEdges ?? []).entries()) {
  for (const id of list) if (!eids.has(id)) { console.log("BAD CHAPTEREDGE", ci, id); bad++; }
}
/* focus shorts must exist */
const shorts = new Set(d.entities.map((e) => e.short));
for (const ch of d.chapters) {
  const focus: string[] = Array.isArray(ch.focus) ? ch.focus : String(ch.focus ?? "").split(",");
  for (const f of focus.map((s) => s.trim()).filter(Boolean)) {
    if (!shorts.has(f)) { console.log("BAD FOCUS", ch.kicker, f); bad++; }
  }
}
console.log(bad === 0 ? "INTEGRITY: CLEAN" : `INTEGRITY: ${bad} problems`);
