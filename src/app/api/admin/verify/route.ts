import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

/* verify the admin passcode for the (hidden) case-template UI.
   the passcode itself lives ONLY in the ADMIN_PASSCODE env var —
   nothing is hardcoded in the client bundle. */

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSCODE is not configured on this server." },
      { status: 503 },
    );
  }
  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const code = (body.code ?? "").trim().toLowerCase();
  if (code && safeEq(code, expected.trim().toLowerCase())) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "Wrong passcode." }, { status: 401 });
}
