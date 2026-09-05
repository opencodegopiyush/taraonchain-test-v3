import type { CaseFile } from "./types";
import { buildSharavDossier } from "./sharav-draft";
import { dossierToCaseFile } from "./case-from-dossier";

/* ── the live case file ────────────────────────────────────────
   CASE is the LIVE case — reassigned by setActiveCase() when a
   published investigation is opened. three/* reads it through
   module live bindings; the graph subtree remounts on change.

   the initial case is the bundled SHARAV investigation, compiled
   from the real on-chain report. the demo-era fictional case and
   its hand-built graph were removed from the bundle entirely —
   the archive contains only real, published investigations. */

export let CASE: CaseFile = dossierToCaseFile(buildSharavDossier());

/* swap the live case — the graph subtree remounts via store caseVersion */
export function setActiveCase(cf: CaseFile) {
  CASE = cf;
}
