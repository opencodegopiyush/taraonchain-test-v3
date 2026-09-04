import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildDossier, normalizeDraft, type DraftCase } from "@/lib/dossier";
import { buildSharavDossier } from "@/lib/sharav-draft";
import { checkAdminCode } from "@/lib/auth";
import type { DossierFile } from "@/lib/types";

export const dynamic = "force-dynamic";

const BUNDLED_ID = "bundled-sharav";

type Item = {
  dbId: string;
  caseId: string;
  codename: string;
  status: string;
  updated: string;
  createdAt: string;
  dossier: DossierFile;
};

function bundledItem(): Item {
  const dossier = buildSharavDossier();
  return {
    dbId: BUNDLED_ID,
    caseId: dossier.id,
    codename: dossier.codename,
    status: dossier.status,
    updated: dossier.updated,
    createdAt: new Date(0).toISOString(),
    dossier,
  };
}

/* list published investigations.
   the bundled SHARAV dossier is always included (deduped by caseId — a
   database row of the same case wins), so the flagship investigation is
   served even when the database is unreachable or still empty. */
export async function GET() {
  let rows: { id: string; caseId: string; codename: string; status: string; payload: string; createdAt: Date }[] = [];
  try {
    rows = await db.investigation.findMany({ orderBy: { createdAt: "desc" } });
  } catch (e) {
    console.error("GET /api/investigations — database unreachable, serving bundled archive", e);
  }

  const items: Item[] = rows.map((r) => {
    const dossier = JSON.parse(r.payload) as DossierFile;
    return {
      dbId: r.id,
      caseId: r.caseId,
      codename: r.codename,
      status: r.status,
      updated: dossier.updated,
      createdAt: r.createdAt.toISOString(),
      dossier,
    };
  });

  const bundled = bundledItem();
  if (!items.some((i) => i.caseId === bundled.caseId)) items.unshift(bundled);

  return NextResponse.json({ items });
}

/* compile a draft through the template and store it.
   requires the admin passcode in the "x-admin-code" header. */
export async function POST(req: NextRequest) {
  if (!checkAdminCode(req)) {
    return NextResponse.json(
      { error: "Unauthorized — send the admin passcode in the 'x-admin-code' header." },
      { status: 401 },
    );
  }
  try {
    const draft = (await req.json()) as DraftCase;
    const result = buildDossier(normalizeDraft(draft));
    if (!result.ok) {
      return NextResponse.json({ error: "Validation failed", errors: result.errors }, { status: 400 });
    }
    const dossier = result.dossier;
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
    return NextResponse.json({
      ok: true,
      item: {
        dbId: saved.id,
        caseId: saved.caseId,
        codename: saved.codename,
        status: saved.status,
        updated: dossier.updated,
        createdAt: saved.createdAt.toISOString(),
        dossier,
      },
    });
  } catch (e) {
    console.error("POST /api/investigations failed", e);
    return NextResponse.json({ error: "Could not save investigation." }, { status: 500 });
  }
}

/* remove an uploaded investigation — requires the admin passcode */
export async function DELETE(req: NextRequest) {
  if (!checkAdminCode(req)) {
    return NextResponse.json(
      { error: "Unauthorized — send the admin passcode in the 'x-admin-code' header." },
      { status: 401 },
    );
  }
  try {
    const dbId = req.nextUrl.searchParams.get("id");
    if (!dbId) return NextResponse.json({ error: "Missing id." }, { status: 400 });
    await db.investigation.delete({ where: { id: dbId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/investigations failed", e);
    return NextResponse.json({ error: "Could not delete investigation." }, { status: 500 });
  }
}
