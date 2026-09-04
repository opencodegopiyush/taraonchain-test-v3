"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import type { SavedInvestigation } from "@/lib/types";
import { CaseStatus } from "@/components/ui/bits";
import { Icon } from "@/components/ui/icons";
import { dossierToCaseFile } from "@/lib/case-from-dossier";
import { Scramble } from "./Scramble";
import { Scanner } from "./Scanner";
import { Frame } from "./Frame";

const IG_URL = "https://instagram.com/taraonchain";

/* the framed chain — the same 3d landing scene as v2, but caged
   inside an instrument window instead of owning the whole page */
const LandingScene = dynamic(() => import("@/components/three/LandingScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0" style={{ background: "var(--scene)" }} aria-hidden />,
});

/* ── landing board — the v3 landing ───────────────────────────
   a different shape entirely: an editorial left column and a
   framed chain instrument on the right. the hero decodes, the
   scanner runs beneath the chain, the case file is a terminal
   card with a fill-sweep open state, and a ticker carries the
   archive facts across the bottom. same palette, same words
   from the published dossier — new staging. */

export function LandingBoard() {
  const begin = useStore((s) => s.begin);
  const loadCase = useStore((s) => s.loadCase);
  const [saved, setSaved] = useState<SavedInvestigation[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
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
  }, []);

  const openCase = (s: SavedInvestigation) => {
    loadCase(dossierToCaseFile(s.dossier));
    begin();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
      style={{ touchAction: "pan-y" }}
      role="dialog"
      aria-label="taraonchain — start"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col justify-center px-5 pb-16 pt-[max(36px,calc(env(safe-area-inset-top)+20px))] sm:px-8 lg:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
          {/* ── left — the editorial column ── */}
          <div>
            <div className="rise flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="wordmark-brand" style={{ color: "var(--ink)" }}>taraonchain</span>
              <span className="h-px w-7" style={{ background: "var(--line-strong)" }} />
              <span className="label !text-[9px]" style={{ color: "var(--ink-faint)" }}>
                Vedika · On-chain researcher &amp; investigator
              </span>
            </div>

            <h1
              className="rise disp mt-6 text-[clamp(38px,9.5vw,64px)] font-bold leading-[1.02] tracking-[-0.01em] sm:mt-8"
              style={{ color: "var(--ink)", animationDelay: "120ms", fontStretch: "110%" }}
            >
              <Scramble text="Follow the" delay={350} />
              <br />
              <Scramble text="chain" delay={650} />
              <span className="t3-caret ml-1 inline-block h-[0.72em] w-[0.09em] translate-y-[0.06em]" style={{ background: "var(--assess)" }} />
            </h1>

            <p
              className="rise doc mt-5 max-w-[500px] text-[15.5px] leading-[1.65] sm:text-[16.5px]"
              style={{ color: "var(--ink-mute)", animationDelay: "420ms" }}
            >
              On-chain investigations, published in full. Exploits, rugs and wallet flows traced
              hop by hop from raw chain data — what the chain proves is marked{" "}
              <em style={{ color: "var(--fact)" }}>fact</em>, what I infer is marked{" "}
              <em style={{ color: "var(--assess)" }}>inference</em>. Nothing in between.
            </p>

            <div
              className="rise datum mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[9.5px] tracking-[0.14em]"
              style={{ color: "var(--ink-faint)", animationDelay: "500ms" }}
            >
              <span>EDUCATION REELS ON INSTAGRAM</span>
              <span>FULL INVESTIGATIONS HERE</span>
            </div>

            {/* ── the case file — a terminal card ── */}
            <section className="rise mt-8" style={{ animationDelay: "580ms" }} aria-label="investigations">
              <div className="mb-3 flex items-baseline gap-3">
                <span className="label" style={{ color: "var(--ink)" }}>Case files</span>
                <span className="h-px min-w-6 flex-1" style={{ background: "var(--line)" }} />
                {saved.length > 0 && (
                  <span className="datum !text-[9px] !tracking-[0.12em]" style={{ color: "var(--ink-faint)" }}>
                    {saved.length} PUBLISHED
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {saved.map((s, i) => (
                  <button
                    key={s.dbId}
                    onClick={() => openCase(s)}
                    className="t3-openbtn rise group pointer-events-auto w-full border px-4 py-4 text-left sm:px-5"
                    style={{
                      borderColor: "var(--line-strong)",
                      background: "rgba(11,13,22,0.55)",
                      animationDelay: `${640 + i * 110}ms`,
                    }}
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
                    <div
                      className="datum mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9.5px] tracking-[0.1em]"
                      style={{ color: "var(--ink-faint)" }}
                    >
                      <span>{s.dossier.entities.length} ENTITIES</span>
                      <span>{s.dossier.findings.length} FINDINGS</span>
                      <span>{s.dossier.amountText === "—" ? null : `EXPOSURE · ${s.dossier.amountText}`}</span>
                    </div>
                  </button>
                ))}

                {saved.length === 0 && !failed && (
                  <div className="border px-4 py-4" style={{ borderColor: "var(--line)", background: "rgba(11,13,22,0.45)" }}>
                    <p className="doc text-[13.5px] leading-relaxed" style={{ color: "var(--ink-mute)" }}>
                      The first full investigation is being traced right now. When it publishes, the
                      entire 3D case file opens here.
                    </p>
                  </div>
                )}

                {failed && (
                  <p
                    className="doc border px-4 py-3.5 text-[12.5px] italic leading-relaxed"
                    style={{ borderColor: "var(--line)", color: "var(--ink-faint)", background: "rgba(11,13,22,0.4)" }}
                  >
                    The case archive could not be reached. Refresh — or follow the trail on Instagram.
                  </p>
                )}
              </div>
            </section>

            <div className="rise mt-6 flex flex-wrap items-center gap-3" style={{ animationDelay: "760ms" }}>
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
              <span className="datum !text-[9px] !tracking-[0.12em]" style={{ color: "var(--ink-faint)" }}>
                TEST BUILD · V4 · POCKET DESK
              </span>
            </div>
          </div>

          {/* ── right — the framed chain instrument ── */}
          <div className="rise" style={{ animationDelay: "300ms" }}>
            <ChainWindow />
          </div>
        </div>
      </div>

      {/* the ticker — archive facts crossing the bottom */}
      <Ticker saved={saved} />
    </div>
  );
}

/* the caged chain — 3d window + scanner strip + live orbit readout */
function ChainWindow() {
  const [orbit, setOrbit] = useState(9);
  useEffect(() => {
    const onOrbit = (e: Event) => setOrbit(Math.round((e as CustomEvent<number>).detail));
    window.addEventListener("tara-orbit", onOrbit);
    return () => window.removeEventListener("tara-orbit", onOrbit);
  }, []);

  return (
    <Frame
      className="h-[300px] w-full sm:h-[360px] lg:h-[440px]"
      scan
      label={
        <span className="flex items-center gap-2">
          <span className="dot pulse-dot" style={{ background: "var(--fact)", color: "var(--fact)" }} />
          LIVE CHAIN · DRAG TO ORBIT · TAP A LINK
        </span>
      }
      meta={
        <span className="datum text-[10px] tabular-nums" style={{ color: "var(--ink)" }}>
          {String(orbit).padStart(3, "0")}°
        </span>
      }
      footer={
        <div>
          <Scanner height={56} />
          <div className="flex h-7 items-center justify-between px-3">
            <span className="label !text-[8px]" style={{ color: "var(--ink-faint)" }}>MEMPOOL SCANNER · TAP TO INJECT</span>
            <span className="label !text-[8px]" style={{ color: "var(--ink-faint)" }}>SOL · ETH · BTC</span>
          </div>
        </div>
      }
    >
      <LandingScene />
    </Frame>
  );
}

/* the bottom ticker — one line of archive truth, repeating */
function Ticker({ saved }: { saved: SavedInvestigation[] }) {
  const line = useMemo(() => {
    const bits: string[] = [];
    for (const s of saved.slice(0, 3)) {
      bits.push(
        `${s.caseId} · ${s.codename} · ${s.status}`,
        `${s.dossier.entities.length} ENTITIES`,
        `${s.dossier.findings.length} FINDINGS`,
      );
      if (s.dossier.amountText !== "—") bits.push(`EXPOSURE ${s.dossier.amountText}`);
    }
    if (bits.length === 0) bits.push("CASE ARCHIVE ONLINE", "FIRST INVESTIGATION IN TRACE");
    bits.push("EVERY ADDRESS VERIFIABLE ON-CHAIN", "TARAONCHAIN · TEST BUILD V4");
    const text = bits.join("   ///   ");
    return `${text}   ///   `;
  }, [saved]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] overflow-hidden border-t"
      style={{ borderColor: "var(--line)", background: "rgba(13, 16, 26, 0.94)" }}
      aria-hidden
    >
      <div className="flex h-8 items-center overflow-hidden">
        <div className="t3-ticker flex shrink-0 items-center whitespace-nowrap">
          <span className="datum px-2 text-[9.5px] tracking-[0.14em]" style={{ color: "var(--ink-faint)" }}>
            {line}
          </span>
          <span className="datum px-2 text-[9.5px] tracking-[0.14em]" style={{ color: "var(--ink-faint)" }}>
            {line}
          </span>
        </div>
      </div>
    </div>
  );
}
