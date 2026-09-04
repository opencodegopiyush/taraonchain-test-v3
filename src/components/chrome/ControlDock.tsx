"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui/icons";
import { LegendContent } from "@/components/ui/bits";

function useIsDesktop() {
  const [lg, setLg] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setLg(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return lg;
}

export function ControlDock() {
  const legendOpen = useStore((s) => s.legendOpen);
  const setLegendOpen = useStore((s) => s.setLegendOpen);
  const flowPaused = useStore((s) => s.flowPaused);
  const toggleFlowPaused = useStore((s) => s.toggleFlowPaused);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const introDismissed = useStore((s) => s.introDismissed);
  const overlay = useStore((s) => s.overlay);
  const recenter = useStore((s) => s.recenter);
  const isDesktop = useIsDesktop();

  const hidden = !introDismissed || overlay !== null;

  return (
    <div
      className="fixed right-3 top-[56px] z-30 flex flex-row items-center gap-1.5 transition-all duration-500 lg:bottom-[max(20px,env(safe-area-inset-bottom))] lg:right-[max(20px,env(safe-area-inset-right))] lg:top-auto lg:flex-col lg:items-end lg:gap-2"
      style={{
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : "auto",
        transform:
          isDesktop && selectedNodeId ? "translateX(-380px)" : "translateX(0)",
      }}
    >
      {/* legend popover */}
      <div
        className="panel absolute right-0 top-[calc(100%+10px)] w-[300px] max-w-[calc(100vw-24px)] p-5 transition-all duration-300 lg:static lg:top-auto"
        style={{
          opacity: legendOpen ? 1 : 0,
          transform: legendOpen ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
          pointerEvents: legendOpen ? "auto" : "none",
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="label" style={{ color: "var(--ink)" }}>Reading the graph</span>
          <button className="btn btn-ghost !p-1" onClick={() => setLegendOpen(false)} aria-label="close legend">
            <Icon name="close" size={13} />
          </button>
        </div>
        <LegendContent />
      </div>

      {/* buttons */}
      <div className="flex items-center gap-1.5">
        <DockBtn label="Recenter view" onClick={recenter}>
          <Icon name="crosshair" size={15} />
        </DockBtn>
        <DockBtn label={flowPaused ? "Resume flow" : "Pause flow"} onClick={toggleFlowPaused}>
          <Icon name={flowPaused ? "play" : "pause"} size={15} />
        </DockBtn>
        <DockBtn label="Legend" onClick={() => setLegendOpen(!legendOpen)} active={legendOpen}>
          <Icon name="legend" size={15} />
        </DockBtn>
      </div>
    </div>
  );
}

function DockBtn({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="panel flex h-9 w-9 items-center justify-center transition-colors duration-150 hover:bg-[rgba(230,234,244,0.06)]"
      style={{ color: active ? "var(--assess)" : "var(--ink-mute)" }}
    >
      {children}
    </button>
  );
}
