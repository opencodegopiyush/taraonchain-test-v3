/* Seed: ensure the bundled SHARAV investigation exists in the archive.
   The bundled edition (compiled from the FINAL CORRECTED v4 report) is
   the source of truth for S-0830: an existing S-0830 row is OVERWRITTEN
   with it on every build. Other agent-published reports are NEVER touched.
   Runs on every Vercel build.
   Pass --reset to wipe the archive first (local dev only!).

   Run: tsx scripts/seed-sharav.ts */

import { db } from "../src/lib/db";
import { buildSharavDossier } from "../src/lib/sharav-draft";

async function main() {
  const dossier = buildSharavDossier();

  if (process.argv.includes("--reset")) {
    const gone = await db.investigation.deleteMany({});
    console.log(`Reset: removed ${gone.count} investigation(s) from the archive.`);
  }

  const saved = await db.investigation.upsert({
    where: { caseId: dossier.id },
    create: {
      caseId: dossier.id,
      codename: dossier.codename,
      status: dossier.status,
      payload: JSON.stringify(dossier),
    },
    update: {
      codename: dossier.codename,
      status: dossier.status,
      payload: JSON.stringify(dossier),
    },
  });

  console.log(
    `Seeded (fresh v4 edition) ${saved.caseId} ${saved.codename} — ` +
      `${dossier.stats.entities} entities, ${dossier.stats.links} connections, ` +
      `${dossier.chapters.length} chapters, 3D graph ${dossier.graph ? "INCLUDED" : "will be synthesized"}`,
  );
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
