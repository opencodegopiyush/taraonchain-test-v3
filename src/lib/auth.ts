import { timingSafeEqual } from "crypto";

/* constant-time string comparison (length mismatch resolved without
   revealing which prefix would have matched) */
function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/* publishing key for external agents — header: x-agent-key (or
   "Authorization: Bearer <key>"). Disabled unless AGENT_PUBLISH_KEY is set. */
export function checkAgentKey(req: Request): boolean {
  const key = process.env.AGENT_PUBLISH_KEY;
  if (!key) return false;
  const header = req.headers.get("x-agent-key") ?? "";
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const provided = (header || bearer).trim();
  return provided.length > 0 && safeEq(provided, key);
}

/* admin passcode for the case-template UI — header: x-admin-code.
   Disabled unless ADMIN_PASSCODE is set. */
export function checkAdminCode(req: Request): boolean {
  const code = process.env.ADMIN_PASSCODE;
  if (!code) return false;
  const provided = (req.headers.get("x-admin-code") ?? "").trim().toLowerCase();
  return provided.length > 0 && safeEq(provided, code.trim().toLowerCase());
}
