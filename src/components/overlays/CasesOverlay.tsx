"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { SavedInvestigation } from "@/lib/types";
import { CaseStatus, Progress } from "@/components/ui/bits";
import { Icon } from "@/components/ui/icons";
import { dossierToCaseFile } from "@/lib/case-from-dossier";

/* in-experience index — every published investigation, one click
   to swap the live 3d workspace onto another case */

export function CasesOverlay() {
  const overlay = useStore((s) => s.overlay);
  const setOverlay = useStore((s) => s.setOverlay);
  const caseFile = useStore((s) => s.caseFile);
  const loadCase = useStore((s) => s.loadCase);
  const begin = useStore((s) => s.begin);
  const home = useStore((s) => s.home);
  const [leaving, setLeaving] = useState(false);
  const [saved, setSaved] = useState<SavedInvestigation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (overlay !== "cases") return;
    let cancelled = false;
    fetch("/api/investigations")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        if (!cancelled) {
          setSaved(data.items ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [overlay]);

  if (overlay !== "cases") return null;
  const close = () => {
    setLeaving(true);
    setTimeout(() => {
      setOverlay(null);
      setLeaving(false);
    }, 320);
  };

  const switchTo = (s: SavedInvestigation) => {
    if (s.dossier.id === caseFile.id) {
      close();
      return;
    }
    close();
    /* let the close transition start, then swap the workspace */
    setTimeout(() => {
      loadCase(dossierToCaseFile(s.dossier));
      begin();
    }, 180);
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="investigations index">
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: "rgba(4,6,9,0.6)", backdropFilter: "blur(3px)", opacity: leaving ? 0 : 1 }}
        onClick={close}
      />
      <div
        className="panel-deep absolute inset-y-0 left-1/2 flex w-full max-w-[780px] flex-col transition-all duration-500 ease-out sm:inset-y-6"
        style={{
          opacity: leaving ? 0 : 1,
          transform: leaving ? "translate(-50%, 24px)" : "translate(-50%, 0)",
          border: "1px solid var(--line-strong)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-3.5 lg:px-8" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                home();
              }}
              className="group inline-flex items-center gap-2 rounded-sm px-1 py-1 transition-colors hover:bg-[rgba(242,234,216,0.05)]"
              aria-label="taraonchain — back to the landing page"
              title="Back to the landing page"
            >
              <Icon name="glyph" size={15} className="text-[color:var(--assess)]" strokeWidth={1.6} />
              <span className="wordmark-brand !text-[10px]" style={{ color: "var(--ink)" }}>taraonchain</span>
            </button>
            <span className="h-4 w-px shrink-0" style={{ background: "var(--line-strong)" }} />
            <span className="label truncate" style={{ color: "var(--ink)" }}>Investigations</span>
          </div>
          <button className="btn btn-ghost !p-1.5" onClick={close} aria-label="close investigations">
            <Icon name="close" size={15} />
          </button>
        </div>

        <div className="slim-scroll flex-1 overflow-y-auto px-6 py-7 lg:px-8">
          {loading && (
            <p className="doc text-[13px] italic" style={{ color: "var(--ink-faint)" }}>
              Reaching the case archive…
            </p>
          )}
          {!loading && saved.length === 0 && (
            <p className="doc max-w-[480px] text-[13.5px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>
              No other published investigations yet. The next case appears here and on the landing
              page the moment it is uploaded through the admin template.
            </p>
          )}
          <div className="flex flex-col">
            {saved.map((s) => {
              const active = s.dossier.id === caseFile.id;
              return (
                <button
                  key={s.dbId}
                  onClick={() => switchTo(s)}
                  className="group border-b py-5 text-left transition-colors first:pt-0 hover:bg-[rgba(242,234,216,0.02)]"
                  style={{ borderColor: "var(--line)", cursor: "pointer" }}
                  aria-label={active ? `currently open — ${s.caseId} ${s.codename}` : `switch to ${s.caseId} ${s.codename}`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
                    <span className="datum text-[11px] font-medium tracking-[0.08em]" style={{ color: "var(--assess)" }}>{s.caseId}</span>
                    <span className="disp text-[19px] font-semibold tracking-[0.01em]" style={{ color: "var(--ink)" }}>
                      {s.codename}
                    </span>
                    <CaseStatus status={s.status as "ACTIVE" | "MONITORING" | "CLOSED"} />
                    {active ? (
                      <span className="label !text-[8.5px]" style={{ color: "var(--assess)" }}>
                        ● OPEN NOW
                      </span>
                    ) : (
                      <span className="label !text-[8.5px]" style={{ color: "var(--fact)" }}>
                        OPEN IN 3D
                      </span>
                    )}
                    {!active && (
                      <Icon name="arrow-right" size={14} className="ml-auto self-center transition-transform duration-200 group-hover:translate-x-1" />
                    )}
                  </div>
                  <p className="doc mt-2 max-w-[540px] text-[13.5px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>
                    {s.dossier.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="datum text-[10px]" style={{ color: "var(--ink-faint)" }}>{s.dossier.chains.join(" · ")}</span>
                    <span className="datum text-[10px]" style={{ color: "var(--ink-faint)" }}>EXPOSURE · {s.dossier.amountText}</span>
                    <Progress pct={s.dossier.progress} />
                    <span className="datum text-[10px]" style={{ color: "var(--ink-faint)" }}>UPDATED {s.updated}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <p className="datum text-[9.5px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
              TARAONCHAIN · PUBLISHED CASE FILES
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
