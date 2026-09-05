"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { SavedInvestigation } from "@/lib/types";
import { CaseStatus, Progress } from "@/components/ui/bits";
import { Icon } from "@/components/ui/icons";
import { dossierToCaseFile } from "@/lib/case-from-dossier";
import dynamic from "next/dynamic";

const IG_URL = "https://instagram.com/taraonchain";

const LandingScene = dynamic(() => import("@/components/three/LandingScene"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-0" style={{ background: "var(--scene)" }} aria-hidden />
  ),
});

/* ── the landing — taraonchain ────────────────────────────────
   who: Vedika, on-chain researcher & investigator.
   what: a different, interactive 3d chain scene + the published
   investigations. no case-specific hero copy, no walkthrough
   buttons — the case files ARE the way in.                       */

export function IntroOverlay() {
  const introDismissed = useStore((s) => s.introDismissed);
  const begin = useStore((s) => s.begin);
  const loadCase = useStore((s) => s.loadCase);
  const [saved, setSaved] = useState<SavedInvestigation[]>([]);
  const [failed, setFailed] = useState(false);
  /* v2 — the swipe cue retires itself the moment the visitor moves */
  const [scrolled, setScrolled] = useState(false);

  /* archive telemetry — real counts summed across published cases */
  const totals = useMemo(() => {
    let entities = 0;
    let connections = 0;
    let findings = 0;
    for (const s of saved) {
      entities += s.dossier.entities.length;
      connections += s.dossier.stats?.links ?? s.dossier.graph?.edges.length ?? 0;
      findings += s.dossier.findings.length;
    }
    return { cases: saved.length, entities, connections, findings };
  }, [saved]);

  /* published investigations — refetched every time the landing
     is visible (first load, wordmark return, /admin return) */
  useEffect(() => {
    if (introDismissed) return;
    let cancelled = false;
    fetch("/api/investigations")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((data) => {
        if (!cancelled) setSaved(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [introDismissed]);

  if (introDismissed) return null;

  const openCase = (s: SavedInvestigation) => {
    loadCase(dossierToCaseFile(s.dossier));
    begin();
  };

  return (
    <>
      {/* the chain — drag to orbit */}
      <LandingScene />

      {/* live orbit readout — ties the page to the 3d scene; textContent
          updates straight off the animation frame, zero re-renders */}
      <div
        className="pointer-events-none fixed bottom-[max(22px,env(safe-area-inset-bottom))] right-6 z-50 hidden items-center gap-2.5 lg:flex"
        aria-hidden
      >
        <span className="h-px w-6" style={{ background: "var(--line-strong)" }} />
        <span
          className="datum !text-[10px] !tracking-[0.16em] tabular-nums"
          style={{ color: "var(--ink-faint)" }}
        >
          ORBIT
        </span>
        <OrbitHeading />
      </div>

      <div
        className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
        style={{ touchAction: "pan-y" }}
        role="dialog"
        aria-label="taraonchain — start"
        onScroll={(e) => {
          const el = e.currentTarget;
          const max = el.scrollHeight - el.clientHeight;
          const p = max > 0 ? el.scrollTop / max : 0;
          window.dispatchEvent(new CustomEvent("tara-scroll", { detail: p }));
          if (p > 0.04) setScrolled(true);
        }}
      >
        <div className="flex min-h-full select-none flex-col px-5 pb-[max(30px,env(safe-area-inset-bottom))] pt-[max(44px,calc(env(safe-area-inset-top)+28px))] sm:px-12 lg:px-20">
          <div className="mx-auto w-full max-w-[680px] lg:mx-0">
            {/* brand — who is speaking */}
            <div className="rise flex flex-wrap items-center gap-x-3 gap-y-1.5" style={{ animationDelay: "80ms" }}>
              <span className="wordmark-brand" style={{ color: "var(--ink)" }}>taraonchain</span>
              <span className="h-px w-7 sm:w-8" style={{ background: "var(--line-strong)" }} />
              <span className="label !text-[9px] sm:!text-[10px]" style={{ color: "var(--ink-faint)" }}>
                Vedika · On-chain researcher &amp; investigator
              </span>
            </div>

            <h1
              className="rise disp mt-7 text-[clamp(40px,11vw,76px)] font-bold leading-[1.0] tracking-[-0.01em] sm:mt-9"
              style={{ color: "var(--ink)", animationDelay: "220ms", fontStretch: "110%" }}
            >
              Follow the
              <br />
              chain<span style={{ color: "var(--assess)" }}>.</span>
            </h1>

            <p
              className="rise doc mt-5 max-w-[500px] text-[15.5px] leading-[1.65] sm:mt-6 sm:text-[17px]"
              style={{ color: "var(--ink-mute)", animationDelay: "360ms" }}
            >
              On-chain investigations, published in full. Exploits, rugs and wallet flows traced
              hop by hop from raw chain data — what the chain proves is marked{" "}
              <em style={{ color: "var(--fact)" }}>fact</em>, what I infer is marked{" "}
              <em style={{ color: "var(--assess)" }}>inference</em>. Nothing in between.
            </p>

            <div
              className="rise datum mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[9.5px] tracking-[0.14em]"
              style={{ color: "var(--ink-faint)", animationDelay: "440ms" }}
            >
              <span>EDUCATION REELS ON INSTAGRAM</span>
              <span>FULL INVESTIGATIONS HERE</span>
            </div>

            <div className="rise mt-6 flex flex-wrap items-center gap-3 sm:mt-7" style={{ animationDelay: "520ms" }}>
              <a
                className="btn btn-ghost pointer-events-auto !px-5 !py-3 !text-[12px]"
                href={IG_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="taraonchain on Instagram"
                style={{ color: "var(--ink)" }}
              >
                @taraonchain
                <Icon name="external" size={13} className="ml-2 inline" />
              </a>
              <span className="label !text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
                FOLLOW THE CHAIN ⛓
              </span>
            </div>

            {/* ── investigations — the way in ────────────────── */}
            <section className="rise mt-12 sm:mt-14" style={{ animationDelay: "640ms" }} aria-label="investigations">
              <div className="flex items-baseline gap-3">
                <span className="label" style={{ color: "var(--ink)" }}>Investigations</span>
                {saved.length > 0 && (
                  <>
                    <span className="datum !text-[9px] !tracking-[0.12em] sm:hidden" style={{ color: "var(--ink-faint)" }}>
                      {totals.entities} ENTITIES · {totals.connections} CONNECTIONS
                    </span>
                    <span className="datum hidden !text-[9px] !tracking-[0.12em] sm:inline" style={{ color: "var(--ink-faint)" }}>
                      {saved.length} PUBLISHED · OPEN IN 3D
                    </span>
                  </>
                )}
                <span className="h-px min-w-6 flex-1" style={{ background: "var(--line)" }} />
              </div>

              <div className="mt-4 flex flex-col gap-2.5">
                {saved.map((s, i) => (
                  <button
                    key={s.dbId}
                    onClick={() => openCase(s)}
                    className="rise group pointer-events-auto w-full border px-4 py-4 text-left backdrop-blur-[2px] transition-colors hover:bg-[rgba(236,238,242,0.04)] sm:px-5 sm:py-5"
                    style={{ borderColor: "var(--line-strong)", background: "rgba(11,13,22,0.55)", animationDelay: `${680 + i * 110}ms` }}
                    aria-label={`Open the investigation ${s.caseId} ${s.codename} in the 3d workspace`}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="datum text-[10.5px] font-medium tracking-[0.1em]" style={{ color: "var(--assess)" }}>
                        {s.caseId}
                      </span>
                      <span className="disp text-[17px] font-semibold tracking-[0.01em] sm:text-[19px]" style={{ color: "var(--ink)" }}>
                        {s.codename}
                      </span>
                      <CaseStatus status={s.status as "ACTIVE" | "MONITORING" | "CLOSED"} />
                      <Icon
                        name="arrow-right"
                        size={14}
                        className="ml-auto self-center opacity-40 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                      />
                    </div>
                    <p className="doc mt-2 max-w-[520px] text-[13px] leading-relaxed sm:text-[13.5px]" style={{ color: "var(--ink-mute)" }}>
                      {s.dossier.summary}
                    </p>
                    {s.dossier.findings.length > 0 && (
                      <p className="doc mt-2.5 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-faint)" }}>
                        <span className="datum !text-[8.5px] !tracking-[0.12em] not-italic" style={{ color: "var(--assess)" }}>
                          LEAD FINDING ·
                        </span>{" "}
                        <span className="italic">“{s.dossier.findings[0].title}”</span>
                      </p>
                    )}
                    <div
                      className="datum mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[9.5px] tracking-[0.1em]"
                      style={{ color: "var(--ink-faint)" }}
                    >
                      <span>{s.dossier.chains.join(" · ").toUpperCase() || "—"}</span>
                      <span>{s.dossier.amountText === "—" ? null : `EXPOSURE · ${s.dossier.amountText}`}</span>
                      <span>{s.dossier.findings.length} FINDINGS</span>
                      <span>{s.dossier.entities.length} ENTITIES</span>
                      <Progress pct={s.dossier.progress} />
                    </div>
                  </button>
                ))}

                {saved.length === 0 && !failed && (
                  <div
                    className="pointer-events-auto border px-4 py-4 sm:px-5"
                    style={{ borderColor: "var(--line)", background: "rgba(11,13,22,0.45)" }}
                  >
                    <p className="doc text-[13.5px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>
                      The first full investigation is being traced right now. When it publishes, the
                      entire 3D case file opens here.
                    </p>
                    <a
                      className="datum mt-2.5 inline-flex items-center gap-1.5 text-[9.5px] tracking-[0.1em] transition-colors hover:text-[color:var(--ink)]"
                      style={{ color: "var(--assess)" }}
                      href={IG_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      CATCH IT ON INSTAGRAM FIRST
                      <Icon name="arrow-right" size={11} />
                    </a>
                  </div>
                )}

                {failed && (
                  <p className="doc border px-4 py-3.5 text-[12.5px] italic leading-relaxed sm:px-5" style={{ borderColor: "var(--line)", color: "var(--ink-faint)", background: "rgba(11,13,22,0.4)" }}>
                    The case archive could not be reached. Refresh — or follow the trail on Instagram.
                  </p>
                )}
              </div>
            </section>

            {/* archive telemetry — real numbers, counted up on arrival:
                the archive earns its authority in motion (v2) */}
            <div
              className="rise mt-8 hidden grid-cols-4 border sm:grid"
              style={{ animationDelay: "700ms", borderColor: "var(--line)", background: "rgba(11,13,22,0.4)" }}
            >
              <Telemetry k="CASES" v={totals.cases} />
              <Telemetry k="ENTITIES TRACED" v={totals.entities} />
              <Telemetry k="CONNECTIONS" v={totals.connections} />
              <Telemetry k="FINDINGS" v={totals.findings} last />
            </div>

            {/* footer */}
            <div
              className="rise mt-9 flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 sm:mt-10"
              style={{ animationDelay: "760ms" }}
            >
              <div className="datum flex flex-wrap gap-x-5 gap-y-1 text-[9.5px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
                <span>DRAG · ORBIT THE CHAIN</span>
                <span>TAP A LINK · SEND VALUE</span>
                <span className="hidden sm:inline">SCROLL · DIVE INTO THE ARCHIVE</span>
                <span>EVERY ADDRESS VERIFIABLE ON-CHAIN</span>
                <span>TEST BUILD · V2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* mobile swipe cue — floats until the first scroll proves otherwise */}
      {!scrolled && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] z-[60] flex justify-center sm:hidden"
          aria-hidden
        >
          <span className="scroll-cue label !text-[8.5px]" style={{ color: "var(--ink-faint)" }}>
            SWIPE · THE CASE FILES ARE BELOW
          </span>
        </div>
      )}
    </>
  );
}

/* live orbit heading — subscribes to the scene's tara-orbit events */
function OrbitHeading() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const onOrbit = (e: Event) => {
      if (ref.current) {
        const deg = Math.round((e as CustomEvent<number>).detail);
        ref.current.textContent = `${String(deg).padStart(3, "0")}°`;
      }
    };
    window.addEventListener("tara-orbit", onOrbit);
    return () => window.removeEventListener("tara-orbit", onOrbit);
  }, []);
  return (
    <span
      ref={ref}
      className="disp !text-[13px] font-semibold tabular-nums"
      style={{ color: "var(--ink)" }}
    >
      009°
    </span>
  );
}

/* one telemetry cell — number counts up on arrival, label under,
   hairline separators (v2) */
function Telemetry({ k, v, last }: { k: string; v: number; last?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const t0 = performance.now();
    const dur = 900;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0 - 720) / dur); /* wait for the panel rise */
      if (p > 0) {
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(v * eased)).padStart(2, "0");
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [v]);
  return (
    <div
      className="px-4 py-3.5 sm:px-5"
      style={{ borderRight: last ? undefined : "1px solid var(--line)" }}
    >
      <div ref={ref} className="disp text-[22px] font-semibold leading-none sm:text-[26px]" style={{ color: "var(--ink)" }}>
        00
      </div>
      <div className="datum mt-1.5 !text-[8.5px] !tracking-[0.14em]" style={{ color: "var(--ink-faint)" }}>
        {k}
      </div>
    </div>
  );
}
