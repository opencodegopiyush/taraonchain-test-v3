"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { emptyDraft, sampleDraft, buildDossier, type DraftCase } from "@/lib/dossier";
import type { DossierFile, SavedInvestigation } from "@/lib/types";
import { SectionLabel, CaseStatus } from "@/components/ui/bits";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import { DossierReader } from "@/components/overlays/DossierReader";

const KINDS = ["wallet", "contract", "protocol", "mixer", "bridge", "otc", "exchange", "cluster", "vault"] as const;

export default function AdminClient() {
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState("");
  const [gateError, setGateError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    /* deferred so SSR markup stays stable — the gate renders first, then unlocks.
       the stored value IS the passcode; it is re-verified server-side on every
       publish/delete (x-admin-code header), so a stale code cannot mutate. */
    const t = setTimeout(() => {
      try {
        const stored = sessionStorage.getItem("toc-admin");
        if (stored) {
          setCode(stored);
          setAuthed(true);
        }
      } catch {
        /* storage unavailable — gate again */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const unlock = async () => {
    if (busy) return;
    setBusy(true);
    setGateError(false);
    try {
      const r = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (!r.ok) {
        setGateError(true);
        return;
      }
      try {
        sessionStorage.setItem("toc-admin", code.trim());
      } catch {
        /* ignore */
      }
      setAuthed(true);
    } catch {
      setGateError(true);
    } finally {
      setBusy(false);
    }
  };

  if (!authed) return <Gate code={code} setCode={setCode} unlock={unlock} error={gateError} busy={busy} />;
  return <Builder adminCode={code.trim()} />;
}

/* ── gate ───────────────────────────────────────────────────── */

function Gate({
  code,
  setCode,
  unlock,
  error,
  busy,
}: {
  code: string;
  setCode: (v: string) => void;
  unlock: () => void;
  error: boolean;
  busy: boolean;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5" style={{ background: "var(--scene)" }}>
      <div className="panel w-full max-w-[400px] p-7">
        <div className="flex items-center gap-3">
          <Icon name="shield" size={16} className="text-[color:var(--assess)]" />
          <span className="wordmark-brand" style={{ color: "var(--ink)" }}>taraonchain</span>
        </div>
        <h1 className="disp mt-4 text-[20px] font-semibold" style={{ color: "var(--ink)" }}>
          Restricted — case template
        </h1>
        <p className="doc mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>
          Restricted area for publishing investigation reports. Enter the admin passcode to
          continue — it is verified server-side and never stored in the page bundle.
        </p>
        {error && (
          <p className="datum mt-3 text-[11px] tracking-[0.08em]" style={{ color: "var(--risk)" }}>
            WRONG PASSCODE — OR THE SERVER HAS NO ADMIN_PASSCODE SET
          </p>
        )}
        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            unlock();
          }}
        >
          <input
            className="field"
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Access code"
            aria-label="access code"
            autoFocus
          />
          <button className="btn btn-primary !px-4" type="submit" disabled={busy}>
            {busy ? "…" : "Enter"}
          </button>
        </form>
        <Link className="datum mt-5 inline-flex items-center gap-1.5 text-[10px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }} href="/">
          <Icon name="arrow-left" size={11} />
          BACK TO THE LIVE CASE
        </Link>
      </div>
    </main>
  );
}

/* ── builder ────────────────────────────────────────────────── */

function Builder({ adminCode }: { adminCode: string }) {
  const [draft, setDraft] = useState<DraftCase>(emptyDraft);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SavedInvestigation[]>([]);
  const [preview, setPreview] = useState<DossierFile | null>(null);
  const { toast } = useToast();

  const loadSaved = useCallback(() => {
    fetch("/api/investigations")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => setSaved(data.items ?? []))
      .catch(() => setSaved([]));
  }, []);

  useEffect(loadSaved, [loadSaved]);

  const set = <K extends keyof DraftCase>(k: K, v: DraftCase[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const validateLocal = (): DossierFile | null => {
    const res = buildDossier(draft);
    if (!res.ok) {
      setErrors(res.errors);
      return null;
    }
    setErrors([]);
    return res.dossier;
  };

  const save = async () => {
    const dossier = validateLocal();
    if (!dossier) return;
    setSaving(true);
    try {
      const r = await fetch("/api/investigations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-code": adminCode },
        body: JSON.stringify(draft),
      });
      const data = await r.json();
      if (!r.ok) {
        setErrors(data.errors ?? [data.error ?? "Save failed."]);
        return;
      }
      setSaved((prev) => [data.item, ...prev.filter((s) => s.dbId !== data.item.dbId)]);
      toast({
        title: `${dossier.id} published`,
        description: "It now appears in the Investigations index for every visitor.",
      });
    } catch {
      setErrors(["Could not reach the archive. Is the dev server running?"]);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (dbId: string) => {
    try {
      await fetch(`/api/investigations?id=${encodeURIComponent(dbId)}`, {
        method: "DELETE",
        headers: { "x-admin-code": adminCode },
      });
      setSaved((prev) => prev.filter((s) => s.dbId !== dbId));
    } catch {
      toast({ title: "Delete failed", description: "Could not reach the archive." });
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--scene)" }}>
      {/* header */}
      <header
        className="sticky top-0 z-40 flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 lg:px-8"
        style={{ background: "rgba(10,12,20,0.94)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="flex items-center gap-3">
          <Icon name="glyph" size={18} className="text-[color:var(--assess)]" strokeWidth={1.6} />
          <span className="wordmark-brand" style={{ color: "var(--ink)" }}>taraonchain</span>
          <span className="h-4 w-px" style={{ background: "var(--line-strong)" }} />
          <span className="label" style={{ color: "var(--ink-mute)" }}>Case template · admin</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <button className="btn btn-ghost !px-2.5 !text-[9.5px] sm:!px-3.5 sm:!text-[10px]" onClick={() => setDraft(sampleDraft())}>
            <Icon name="node" size={12} className="mr-1.5 inline" />
            Load example
          </button>
          <button className="btn btn-ghost !px-2.5 !text-[9.5px] sm:!px-3.5 sm:!text-[10px]" onClick={() => { setDraft(emptyDraft()); setErrors([]); }}>
            Clear
          </button>
          <button className="btn btn-primary !px-2.5 !text-[9.5px] sm:!px-3.5 sm:!text-[10px]" onClick={save} disabled={saving}>
            {saving ? "Publishing…" : "Publish to index"}
          </button>
          <Link className="btn btn-ghost !px-2" href="/" aria-label="back to the live case" title="Back to the live case">
            <Icon name="close" size={13} />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[880px] px-5 py-8 lg:px-8">
        {/* intro */}
        <div className="rise">
          <h1 className="disp text-[24px] font-bold" style={{ color: "var(--ink)" }}>New investigation report</h1>
          <p className="doc mt-2 max-w-[620px] text-[14.5px] leading-[1.65]" style={{ color: "var(--ink-mute)" }}>
            The template compiles your notes into a dossier in the house format: an honest summary,
            a trail told chapter by chapter, findings labelled observed / assessed / unknown, and an
            evidence index built from your connections. Published dossiers appear in the
            Investigations index instantly.
          </p>
        </div>

        {/* saved */}
        {saved.length > 0 && (
          <section className="mt-8">
            <SectionLabel>Published ({saved.length})</SectionLabel>
            <div className="mt-3 flex flex-col">
              {saved.map((s) => (
                <div key={s.dbId} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b py-3" style={{ borderColor: "var(--line)" }}>
                  <span className="datum text-[11px] font-medium" style={{ color: "var(--assess)" }}>{s.caseId}</span>
                  <span className="disp text-[15px] font-semibold" style={{ color: "var(--ink)" }}>{s.codename}</span>
                  <CaseStatus status={s.status as "ACTIVE" | "MONITORING" | "CLOSED"} />
                  <span className="datum text-[10px]" style={{ color: "var(--ink-faint)" }}>
                    {s.dossier.stats.entities} entities · {s.dossier.stats.links} links
                  </span>
                  <span className="ml-auto flex gap-2">
                    <button className="btn btn-ghost !px-2 !py-1 !text-[10px]" onClick={() => setPreview(s.dossier)}>
                      Preview
                    </button>
                    <button className="btn btn-ghost !p-1.5" onClick={() => remove(s.dbId)} aria-label={`delete ${s.caseId}`} title="Delete">
                      <Icon name="trash" size={13} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* validation errors */}
        {errors.length > 0 && (
          <div className="mt-8 border p-4" style={{ borderColor: "rgba(249,112,102,0.4)", background: "rgba(249,112,102,0.06)" }} role="alert">
            <div className="flex items-center gap-2">
              <Icon name="alert" size={14} className="text-[color:var(--risk)]" />
              <span className="label" style={{ color: "var(--risk)" }}>Before this can publish</span>
            </div>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {errors.map((e, i) => (
                <li key={i} className="doc text-[13px] leading-snug" style={{ color: "var(--ink-mute)" }}>
                  — {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* A — case file */}
        <section className="mt-10">
          <SectionLabel no="A">Case file</SectionLabel>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <F label="Case id — format H-0721">
              <input className="field" value={draft.id} onChange={(e) => set("id", e.target.value)} placeholder="H-0721" />
            </F>
            <F label="Codename">
              <input className="field" value={draft.codename} onChange={(e) => set("codename", e.target.value)} placeholder="DUST LINE" />
            </F>
            <F label="Status">
              <select className="field" value={draft.status} onChange={(e) => set("status", e.target.value as DraftCase["status"])}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="MONITORING">MONITORING</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </F>
            <F label="Subject / victim">
              <input className="field" value={draft.victim} onChange={(e) => set("victim", e.target.value)} placeholder="Retail wallets (drainer gadget)" />
            </F>
            <F label="Chains — comma separated">
              <input className="field" value={draft.chains} onChange={(e) => set("chains", e.target.value)} placeholder="ETHEREUM, SOLANA" />
            </F>
            <F label="Exposure — amount">
              <input className="field" value={draft.amountText} onChange={(e) => set("amountText", e.target.value)} placeholder="2.41 ETH" />
            </F>
            <F label="Exposure — USD (optional)">
              <input className="field" value={draft.amountUsd} onChange={(e) => set("amountUsd", e.target.value)} placeholder="$7,900" />
            </F>
            <F label="Window — e.g. JUL 02 — JUL 19 2025">
              <input className="field" value={draft.span} onChange={(e) => set("span", e.target.value)} placeholder="JUL 02 — JUL 19 2025" />
            </F>
            <F label="Progress — 0 to 100">
              <input className="field" type="number" min={0} max={100} value={draft.progress} onChange={(e) => set("progress", e.target.value)} />
            </F>
            <F label="Updated — date">
              <input className="field" type="date" value={draft.updated} onChange={(e) => set("updated", e.target.value)} />
            </F>
            <div className="sm:col-span-2">
              <F label="Summary — the honest two or three sentences a stranger reads first">
                <textarea className="field" rows={3} value={draft.summary} onChange={(e) => set("summary", e.target.value)} />
              </F>
            </div>
          </div>
        </section>

        {/* B — entities */}
        <section className="mt-10">
          <SectionLabel no="B">Entities — every wallet, contract or venue on the map</SectionLabel>
          <div className="mt-4 flex flex-col gap-4">
            {draft.entities.map((e, i) => (
              <Row
                key={i}
                no={i + 1}
                onRemove={draft.entities.length > 2 ? () => set("entities", draft.entities.filter((_, j) => j !== i)) : undefined}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                  <div className="sm:col-span-2">
                    <F label="Short code — used by connections" small>
                      <input className="field" value={e.short} onChange={(ev) => upd(draft, set, "entities", i, { short: ev.target.value.toUpperCase() })} placeholder="SWP-A" />
                    </F>
                  </div>
                  <div className="sm:col-span-2">
                    <F label="Label" small>
                      <input className="field" value={e.label} onChange={(ev) => upd(draft, set, "entities", i, { label: ev.target.value })} placeholder="Sweeper wallet A" />
                    </F>
                  </div>
                  <F label="Kind" small>
                    <select className="field" value={e.kind} onChange={(ev) => upd(draft, set, "entities", i, { kind: ev.target.value as DraftCase["entities"][number]["kind"] })}>
                      {KINDS.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </F>
                  <F label="Chain" small>
                    <input className="field" value={e.chain} onChange={(ev) => upd(draft, set, "entities", i, { chain: ev.target.value })} placeholder="ETHEREUM" />
                  </F>
                  <div className="sm:col-span-6">
                    <F label="Note — why this entity matters (optional)" small>
                      <input className="field" value={e.note} onChange={(ev) => upd(draft, set, "entities", i, { note: ev.target.value })} />
                    </F>
                  </div>
                </div>
              </Row>
            ))}
            <AddBtn label="Add entity" onClick={() => set("entities", [...draft.entities, { label: "", short: "", kind: "wallet", chain: "", note: "" }])} />
          </div>
        </section>

        {/* C — connections */}
        <section className="mt-10">
          <SectionLabel no="C">Connections — the flows, with their epistemic status</SectionLabel>
          <p className="doc mt-2 text-[13px] leading-relaxed" style={{ color: "var(--ink-faint)" }}>
            Mark a connection <span style={{ color: "var(--fact)" }}>observed</span> only when a transaction
            record shows it. Everything inferred gets <span style={{ color: "var(--assess)" }}>assessed</span> —
            the template will not let you blur that line silently.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {draft.connections.map((c, i) => (
              <Row
                key={i}
                no={i + 1}
                onRemove={draft.connections.length > 1 ? () => set("connections", draft.connections.filter((_, j) => j !== i)) : undefined}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                  <F label="From — short code" small>
                    <input className="field" value={c.from} onChange={(ev) => upd(draft, set, "connections", i, { from: ev.target.value.toUpperCase() })} placeholder="GADGET" />
                  </F>
                  <F label="To — short code" small>
                    <input className="field" value={c.to} onChange={(ev) => upd(draft, set, "connections", i, { to: ev.target.value.toUpperCase() })} placeholder="SWP-A" />
                  </F>
                  <F label="Value" small>
                    <input className="field" value={c.value} onChange={(ev) => upd(draft, set, "connections", i, { value: ev.target.value })} placeholder="1.12 ETH" />
                  </F>
                  <F label="Channel" small>
                    <select className="field" value={c.channel} onChange={(ev) => upd(draft, set, "connections", i, { channel: ev.target.value as DraftCase["connections"][number]["channel"] })}>
                      {["direct", "mixer", "bridge", "otc", "cluster"].map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </F>
                  <F label="Epistemic" small>
                    <select className="field" value={c.epistemic} onChange={(ev) => upd(draft, set, "connections", i, { epistemic: ev.target.value as DraftCase["connections"][number]["epistemic"] })}>
                      <option value="observed">observed</option>
                      <option value="assessed">assessed</option>
                      <option value="unknown">unknown</option>
                    </select>
                  </F>
                  <F label="When — timestamp text" small>
                    <input className="field" value={c.when} onChange={(ev) => upd(draft, set, "connections", i, { when: ev.target.value })} placeholder="07-11 04:19" />
                  </F>
                  <div className="sm:col-span-3">
                    <F label="Basis — why you claim this link (optional)" small>
                      <input className="field" value={c.basis} onChange={(ev) => upd(draft, set, "connections", i, { basis: ev.target.value })} />
                    </F>
                  </div>
                  <div className="sm:col-span-3">
                    <F label="Tx hash — optional, synthesised if empty" small>
                      <input className="field" value={c.txHash} onChange={(ev) => upd(draft, set, "connections", i, { txHash: ev.target.value })} placeholder="0x8a44…91c2" />
                    </F>
                  </div>
                </div>
              </Row>
            ))}
            <AddBtn label="Add connection" onClick={() => set("connections", [...draft.connections, { from: "", to: "", value: "", channel: "direct", epistemic: "observed", basis: "", when: "", txHash: "" }])} />
          </div>
        </section>

        {/* D — chapters */}
        <section className="mt-10">
          <SectionLabel no="D">Chapters — the trail, told for humans</SectionLabel>
          <div className="mt-4 flex flex-col gap-4">
            {draft.chapters.map((c, i) => (
              <Row
                key={i}
                no={i + 1}
                onRemove={draft.chapters.length > 1 ? () => set("chapters", draft.chapters.filter((_, j) => j !== i)) : undefined}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <F label="Kicker — one word for where we are" small>
                    <input className="field" value={c.kicker} onChange={(ev) => upd(draft, set, "chapters", i, { kicker: ev.target.value })} placeholder="Origin" />
                  </F>
                  <F label="Title" small>
                    <input className="field" value={c.title} onChange={(ev) => upd(draft, set, "chapters", i, { title: ev.target.value })} />
                  </F>
                  <div className="sm:col-span-2">
                    <F label="Body — paragraphs separated by a blank line" small>
                      <textarea className="field" rows={5} value={c.body} onChange={(ev) => upd(draft, set, "chapters", i, { body: ev.target.value })} />
                    </F>
                  </div>
                  <div className="sm:col-span-2">
                    <F label="Facts — one per line: observed | text   (or assessed / unknown)" small>
                      <textarea
                        className="field"
                        style={{ fontFamily: "var(--font-datum)", fontSize: 12 }}
                        rows={3}
                        value={c.facts}
                        onChange={(ev) => upd(draft, set, "chapters", i, { facts: ev.target.value })}
                        placeholder={"observed | Sweep txs 04:19 and 04:22 UTC\nassessed | Wallets created in one funding batch — medium"}
                      />
                    </F>
                  </div>
                  <div className="sm:col-span-2">
                    <F label="Entities in focus — comma separated short codes (optional)" small>
                      <input className="field" value={c.focus} onChange={(ev) => upd(draft, set, "chapters", i, { focus: ev.target.value })} placeholder="VICTIM, GADGET" />
                    </F>
                  </div>
                </div>
              </Row>
            ))}
            <AddBtn label="Add chapter" onClick={() => set("chapters", [...draft.chapters, { kicker: "", title: "", body: "", facts: "", focus: "" }])} />
          </div>
        </section>

        {/* E — findings */}
        <section className="mt-10">
          <SectionLabel no="E">Findings — what the evidence supports, graded</SectionLabel>
          <div className="mt-4 flex flex-col gap-4">
            {draft.findings.map((f, i) => (
              <Row
                key={i}
                no={i + 1}
                onRemove={draft.findings.length > 1 ? () => set("findings", draft.findings.filter((_, j) => j !== i)) : undefined}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <F label="Title" small>
                      <input className="field" value={f.title} onChange={(ev) => upd(draft, set, "findings", i, { title: ev.target.value })} />
                    </F>
                  </div>
                  <F label="Epistemic" small>
                    <select className="field" value={f.epistemic} onChange={(ev) => upd(draft, set, "findings", i, { epistemic: ev.target.value as DraftCase["findings"][number]["epistemic"] })}>
                      <option value="observed">observed</option>
                      <option value="assessed">assessed</option>
                      <option value="unknown">unknown</option>
                    </select>
                  </F>
                  <F label="Confidence" small>
                    <select className="field" value={f.confidence} onChange={(ev) => upd(draft, set, "findings", i, { confidence: ev.target.value as DraftCase["findings"][number]["confidence"] })}>
                      <option value="">— none —</option>
                      <option value="high">high</option>
                      <option value="medium">medium</option>
                      <option value="low">low</option>
                    </select>
                  </F>
                  <div className="sm:col-span-6">
                    <F label="Body" small>
                      <textarea className="field" rows={3} value={f.body} onChange={(ev) => upd(draft, set, "findings", i, { body: ev.target.value })} />
                    </F>
                  </div>
                </div>
              </Row>
            ))}
            <AddBtn label="Add finding" onClick={() => set("findings", [...draft.findings, { title: "", epistemic: "observed", confidence: "", body: "" }])} />
          </div>
        </section>

        {/* F — method & fine print */}
        <section className="mt-10">
          <SectionLabel no="F">Method, limitations, next steps</SectionLabel>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <F label="Data & method — defaults filled if left empty">
              <textarea className="field" rows={4} value={draft.method} onChange={(e) => set("method", e.target.value)} />
            </F>
            <F label="Limitations — defaults filled if left empty">
              <textarea className="field" rows={4} value={draft.limitations} onChange={(e) => set("limitations", e.target.value)} />
            </F>
            <div className="sm:col-span-2">
              <F label="Next steps — one per line">
                <textarea className="field" rows={3} value={draft.nextSteps} onChange={(e) => set("nextSteps", e.target.value)} />
              </F>
            </div>
          </div>
        </section>

        {/* publish */}
        <div className="mt-10 mb-16 flex flex-wrap items-center gap-3 border-t pt-6" style={{ borderColor: "var(--line)" }}>
          <button className="btn btn-primary !px-6 !py-3 !text-[11px]" onClick={save} disabled={saving}>
            {saving ? "Publishing…" : "Publish to investigations index"}
            <Icon name="arrow-right" size={13} className="ml-2 inline" />
          </button>
          <button
            className="btn !px-6 !py-3 !text-[11px]"
            onClick={() => {
              const d = validateLocal();
              if (d) setPreview(d);
            }}
          >
            Preview dossier
          </button>
          <span className="doc text-[12.5px] italic" style={{ color: "var(--ink-faint)" }}>
            Publishing compiles this draft into the house dossier format — nothing goes live without it passing validation.
          </span>
        </div>
      </div>

      {preview && <DossierReader dossier={preview} onClose={() => setPreview(null)} />}
    </main>
  );
}

/* ── small building blocks ──────────────────────────────────── */

function upd<K extends "entities" | "connections" | "chapters" | "findings">(
  draft: DraftCase,
  set: <X extends keyof DraftCase>(k: X, v: DraftCase[X]) => void,
  key: K,
  index: number,
  patch: Partial<DraftCase[K][number]>,
) {
  set(key, draft[key].map((row, i) => (i === index ? { ...row, ...patch } : row)) as DraftCase[K]);
}

function F({ label, children, small }: { label: string; children: React.ReactNode; small?: boolean }) {
  return (
    <label className="block">
      <span className={`label !tracking-[0.1em] ${small ? "!text-[8.5px]" : "!text-[9px]"}`} style={{ color: "var(--ink-faint)" }}>
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Row({ no, children, onRemove }: { no: number; children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div className="relative border p-4" style={{ borderColor: "var(--line)", background: "rgba(230,234,244,0.015)" }}>
      <div className="absolute right-2.5 top-2.5 flex items-center gap-2">
        <span className="datum text-[10px]" style={{ color: "var(--ink-faint)" }}>{String(no).padStart(2, "0")}</span>
        {onRemove && (
          <button className="btn btn-ghost !p-1" onClick={onRemove} aria-label="remove row" title="Remove">
            <Icon name="trash" size={12} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="btn btn-ghost self-start !text-[10px]" onClick={onClick}>
      <Icon name="plus" size={12} className="mr-1.5 inline" />
      {label}
    </button>
  );
}
