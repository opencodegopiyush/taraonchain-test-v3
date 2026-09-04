"use client";

import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui/icons";

export function TopBar() {
  const CASE = useStore((s) => s.caseFile);
  const overlay = useStore((s) => s.overlay);
  const setOverlay = useStore((s) => s.setOverlay);
  const introDismissed = useStore((s) => s.introDismissed);
  const home = useStore((s) => s.home);

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between px-4 transition-all duration-700 lg:px-5"
      style={{
        background: "linear-gradient(to bottom, rgba(10,12,20,0.92) 55%, rgba(10,12,20,0.75))",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--line)",
        opacity: introDismissed ? 1 : 0,
        pointerEvents: introDismissed ? "auto" : "none",
        transform: introDismissed ? "translateY(0)" : "translateY(-6px)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0 lg:gap-5">
        {/* wordmark — always a way home */}
        <button
          onClick={home}
          className="group flex items-center gap-2.5 rounded-sm px-1 py-1 -ml-1 transition-colors hover:bg-[rgba(230,234,244,0.05)]"
          aria-label="taraonchain — back to the landing page"
          title="Back to the landing page"
        >
          <span className="inline-flex w-3 justify-center overflow-hidden opacity-0 transition-opacity duration-200 group-hover:opacity-70">
            <Icon name="arrow-left" size={12} className="text-[color:var(--ink-mute)]" />
          </span>
          <Icon name="glyph" size={19} className="text-[color:var(--assess)]" strokeWidth={1.6} />
          <span className="wordmark-brand hidden sm:inline" style={{ color: "var(--ink)" }}>taraonchain</span>
          <span className="wordmark-brand !text-[10px] !tracking-[0.14em] sm:hidden" style={{ color: "var(--ink)" }}>taraonchain</span>
        </button>
        <span className="h-4 w-px hidden sm:block" style={{ background: "var(--line-strong)" }} />
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="datum hidden text-[11px] font-medium tracking-[0.08em] sm:inline" style={{ color: "var(--ink)" }}>
            {CASE.id}
          </span>
          <span className="datum text-[11px] tracking-[0.08em] truncate hidden md:inline" style={{ color: "var(--ink-mute)" }}>
            · {CASE.codename}
          </span>
        </div>
      </div>

      <nav className="flex items-center gap-1.5 lg:gap-2" aria-label="case navigation">
        <button
          className={`btn btn-ghost inline-flex items-center gap-2 ${overlay === "cases" ? "!text-[color:var(--ink)]" : ""}`}
          onClick={() => setOverlay(overlay === "cases" ? null : "cases")}
          aria-label="investigations"
          title="Investigations"
        >
          <Icon name="cases" size={13} />
          <span className="hidden lg:inline">Investigations</span>
        </button>
        <button
          className={`btn btn-ghost inline-flex items-center gap-2 ${overlay === "method" ? "!text-[color:var(--ink)]" : ""}`}
          onClick={() => setOverlay(overlay === "method" ? null : "method")}
          aria-label="method"
          title="Method"
        >
          <Icon name="method" size={13} />
          <span className="hidden lg:inline">Method</span>
        </button>
      </nav>
    </header>
  );
}
