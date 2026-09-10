"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

/* ── chapter strip — mobile only. printed page numbers:
   the active chapter underlines in signal. ── */

export default function ChapterRail() {
  const cf = useStore((s) => s.caseFile);
  const chapter = useStore((s) => s.chapter);
  const setChapter = useStore((s) => s.setChapter);
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = box.current?.children[chapter] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [chapter]);

  return (
    <div
      ref={box}
      className="no-scrollbar absolute inset-x-0 top-12 z-20 flex gap-1 overflow-x-auto px-3 py-2 lg:hidden"
      style={{ background: "var(--paper)" }}
    >
      {cf.chapters.map((c, i) => {
        const active = i === chapter;
        return (
          <button
            key={c.id}
            onClick={() => setChapter(i)}
            className="mono relative flex h-8 shrink-0 items-center gap-1.5 px-2.5 text-[10px] tracking-[0.14em] transition-colors"
            style={{
              color: active ? "var(--ink)" : "var(--ink-3)",
              background: active ? "var(--paper-deep)" : "transparent",
            }}
            aria-label={`Chapter ${c.no}: ${c.title}`}
          >
            <span className="font-semibold" style={{ color: active ? "var(--signal)" : undefined }}>
              {c.no}
            </span>
            <span className="max-w-[110px] truncate">{active ? c.title : ""}</span>
            {active && (
              <span className="absolute inset-x-2 bottom-0 h-[2px] bg-signal" />
            )}
          </button>
        );
      })}
    </div>
  );
}
