import { notFound } from "next/navigation";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

/* ── hidden admin door ────────────────────────────────────────
   /admin is deliberately NOT linked anywhere and returns a plain
   404 unless the visitor knows the door key:

       /admin?door=<ADMIN_DOOR from environment variables>

   without ADMIN_DOOR set on the server, this page 404s for everyone. */
export default async function AdminDoorPage({
  searchParams,
}: {
  searchParams: Promise<{ door?: string }>;
}) {
  const { door } = await searchParams;
  const expected = process.env.ADMIN_DOOR;
  if (!expected || !door || door !== expected) notFound();
  return <AdminClient />;
}
