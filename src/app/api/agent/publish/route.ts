import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildDossier, normalizeDraft, type DraftCase } from "@/lib/dossier";
import { checkAgentKey } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* ────────────────────────────────────────────────────────────────
   AGENT PUBLISH API
   External agents publish whole investigations here: the report text,
   chapters (any number), entities, money-flow connections, findings —
   and optionally a hand-authored 3D graph (node positions + per-chapter
   camera keyframes). When no graph is supplied, the 3D trail is
   synthesized automatically from the entities and connections.

   Auth: header "x-agent-key: <AGENT_PUBLISH_KEY>" (env).
   GET    /api/agent/publish          → list what is live
   POST   /api/agent/publish          → create or update (same caseId)
   DELETE /api/agent/publish?caseId=  → remove one investigation
   Full contract: AGENT_API.md at the repo root.
   ──────────────────────────────────────────────────────────────── */

function deny() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Unauthorized. Send your publishing key in the 'x-agent-key' header " +
        "(or 'Authorization: Bearer <key>'). The key is the AGENT_PUBLISH_KEY " +
        "configured on the server.",
    },
    { status: 401 },
  );
}

function disabled() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Publishing is not configured on this server yet. The AGENT_PUBLISH_KEY " +
        "environment variable must be set before agents can publish.",
    },
    { status: 503 },
  );
}

/* list everything live — lets an agent check the archive state before/after publishing */
export async function GET(req: NextRequest) {
  if (!process.env.AGENT_PUBLISH_KEY) return disabled();
  if (!checkAgentKey(req)) return deny();
  try {
    const rows = await db.investigation.findMany({ orderBy: { createdAt: "desc" } });
    const items = rows.map((r) => {
      const d = JSON.parse(r.payload);
      return {
        caseId: r.caseId,
        codename: r.codename,
        status: r.status,
        updated: d.updated ?? null,
        chapters: Array.isArray(d.chapters) ? d.chapters.length : 0,
        entities: d.stats?.entities ?? null,
        connections: d.stats?.links ?? null,
        threeDee: d.graph ? "authored graph" : "synthesized",
        publishedAt: r.createdAt.toISOString(),
      };
    });
    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (e) {
    console.error("GET /api/agent/publish failed", e);
    return NextResponse.json({ ok: false, error: "Could not read the archive." }, { status: 500 });
  }
}

/* publish (create or update) a complete investigation */
export async function POST(req: NextRequest) {
  if (!process.env.AGENT_PUBLISH_KEY) return disabled();
  if (!checkAgentKey(req)) return deny();

  let draft: DraftCase;
  try {
    draft = (await req.json()) as DraftCase;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON (a DraftCase object — see AGENT_API.md)." },
      { status: 400 },
    );
  }

  const result = buildDossier(normalizeDraft(draft));
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "Validation failed — nothing was published.", errors: result.errors },
      { status: 422 },
    );
  }

  const dossier = result.dossier;
  const warnings: string[] = [];
  if (!dossier.sourceNote) {
    warnings.push(
      "No sourceNote given — add one naming the investigation report this case was compiled from, so visitors can see the provenance.",
    );
  }

  try {
    const existing = await db.investigation.findUnique({ where: { caseId: dossier.id } });
    await db.investigation.upsert({
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
    return NextResponse.json(
      {
        ok: true,
        action: existing ? "updated" : "created",
        caseId: dossier.id,
        codename: dossier.codename,
        stats: {
          chapters: dossier.chapters.length,
          entities: dossier.stats.entities,
          connections: dossier.stats.links,
          findings: dossier.findings.length,
        },
        threeDee: dossier.graph
          ? "published with the supplied 3D graph (node positions + chapter cameras)"
          : "3D trail synthesized automatically from entities and connections",
        warnings,
        live: "/",
      },
      { status: existing ? 200 : 201 },
    );
  } catch (e) {
    console.error("POST /api/agent/publish failed", e);
    return NextResponse.json(
      { ok: false, error: "Could not save the investigation — is the database reachable?" },
      { status: 500 },
    );
  }
}

/* remove one investigation by its caseId */
export async function DELETE(req: NextRequest) {
  if (!process.env.AGENT_PUBLISH_KEY) return disabled();
  if (!checkAgentKey(req)) return deny();
  const caseId = req.nextUrl.searchParams.get("caseId")?.trim().toUpperCase();
  if (!caseId) {
    return NextResponse.json({ ok: false, error: "Missing caseId query parameter." }, { status: 400 });
  }
  try {
    const gone = await db.investigation.deleteMany({ where: { caseId } });
    if (gone.count === 0) {
      return NextResponse.json(
        { ok: false, error: `No investigation with caseId ${caseId} in the archive.` },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, deleted: caseId });
  } catch (e) {
    console.error("DELETE /api/agent/publish failed", e);
    return NextResponse.json({ ok: false, error: "Could not delete the investigation." }, { status: 500 });
  }
}
