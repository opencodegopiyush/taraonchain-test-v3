"use client";

import { useStore } from "@/lib/store";

/* case stat bar — a fixed instrument under the top bar, desktop only,
   right-hand side (the chapter rail owns the left). four real numbers
   pulled live from the loaded case file: entities, connections, traced
   volume and the chapter position. the chapter cell ticks as you walk
   the trail. */

export function StatBar() {
  const CASE = useStore((s) => s.caseFile);
  const chapter = useStore((s) => s.chapter);
  const introDismissed = useStore((s) => s.introDismissed);
  const overlay = useStore((s) => s.overlay);
  const selectedNodeId = useStore((s) => s.selectedNodeId);

  const hidden = !introDismissed || overlay !== null || selectedNodeId !== null;

  const unit = CASE.unit ?? "ETH";
  const traced = CASE.edges.reduce((sum, e) => sum + (e.value ?? 0), 0);
  const fmt =
    traced >= 1000
      ? `${(traced / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`
      : traced.toLocaleString(undefined, { maximumFractionDigits: 1 });

  return (
    <aside
      aria-label="case statistics"
      className="fixed right-[max(20px,env(safe-area-inset-right))] top-[58px] z-30 hidden w-[176px] transition-all duration-500 lg:block"
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(-8px)" : "translateY(0)",
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      <div className="border px-3.5 py-3" style={{ borderColor: "var(--line)", background: "rgba(11,13,22,0.5)", backdropFilter: "blur(4px)" }}>
        <div className="datum !text-[8.5px] !tracking-[0.16em]" style={{ color: "var(--ink-faint)" }}>
          CASE FILE · {CASE.id}
        </div>
        <div className="mt-2.5 flex flex-col gap-2">
          <Stat k="ENTITIES" v={String(CASE.nodes.length)} />
          <Stat k="CONNECTIONS" v={String(CASE.edges.length)} />
          <Stat k={`TRACED · ${unit}`} v={fmt} accent />
          <Stat
            k="CHAPTER"
            v={`${String(chapter + 1).padStart(2, "0")} / ${String(CASE.chapters.length).padStart(2, "0")}`}
          />
        </div>
      </div>
    </aside>
  );
}

function Stat({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="datum !text-[8.5px] !tracking-[0.14em]" style={{ color: "var(--ink-faint)" }}>
        {k}
      </span>
      <span
        className="datum text-[11px] font-medium tabular-nums"
        style={{ color: accent ? "var(--assess)" : "var(--ink)" }}
      >
        {v}
      </span>
    </div>
  );
}
