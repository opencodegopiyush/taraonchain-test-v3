"use client";

import { useStore } from "@/lib/store";

export function ChapterRail() {
  const CASE = useStore((s) => s.caseFile);
  const chapter = useStore((s) => s.chapter);
  const setChapter = useStore((s) => s.setChapter);
  const introDismissed = useStore((s) => s.introDismissed);
  const overlay = useStore((s) => s.overlay);
  const selectedNodeId = useStore((s) => s.selectedNodeId);

  const hidden = !introDismissed || overlay !== null || selectedNodeId !== null;

  return (
    <nav
      aria-label="chapters"
      className="fixed left-5 top-[120px] z-30 hidden flex-col gap-1 lg:flex transition-opacity duration-500 [@media(max-height:780px)]:!hidden"
      style={{ opacity: hidden ? 0 : 1, pointerEvents: hidden ? "none" : "auto" }}
    >
      {CASE.chapters.map((ch, i) => {
        const active = i === chapter;
        const passed = i < chapter;
        return (
          <button
            key={ch.id}
            onClick={() => setChapter(i)}
            className="group flex items-center gap-3 py-[5px] text-left"
            aria-current={active ? "step" : undefined}
          >
            <span
              className="h-px transition-all duration-300"
              style={{
                width: active ? 22 : 12,
                background: active ? "var(--assess)" : passed ? "rgba(242,234,216,0.35)" : "rgba(242,234,216,0.14)",
              }}
            />
            <span
              className="datum text-[10px] w-5"
              style={{ color: active ? "var(--assess)" : "var(--ink-faint)" }}
            >
              {ch.no}
            </span>
            <span
              className="label !text-[10px] transition-colors duration-200"
              style={{ color: active ? "var(--ink)" : "var(--ink-faint)" }}
            >
              <span className="group-hover:text-[color:var(--ink-mute)]" style={{ color: "inherit" }}>
                {ch.kicker}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
