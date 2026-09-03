"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { CASE } from "@/lib/case-data";
import { NODE_COLORS, KIND_LABEL } from "@/lib/palette";
import { useStore } from "@/lib/store";
import { nodePositions } from "./shared";

function LabelItem({ id, text }: { id: string; text: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const p = nodePositions.get(id);
    if (p && ref.current) ref.current.position.copy(p);
  });
  const node = CASE.nodes.find((n) => n.id === id);
  return (
    <group ref={ref} position={node?.pos}>
      <Html center zIndexRange={[12, 0]} className="pointer-events-none select-none" style={{ transform: "translate3d(0, -190%, 0)" }}>
        <div
          className="label !text-[9px] flex items-center gap-[5px] whitespace-nowrap"
          style={{ color: "rgba(232,228,218,0.6)", textShadow: "0 1px 6px rgba(0,0,0,0.95)" }}
        >
          <span
            className="dot"
            style={{ background: node ? NODE_COLORS[node.kind] : "#888", boxShadow: `0 0 5px ${node ? NODE_COLORS[node.kind] : "#888"}` }}
          />
          {text}
        </div>
      </Html>
    </group>
  );
}

function HoverTip() {
  const ref = useRef<THREE.Group>(null);
  const hoveredNodeId = useStore((s) => s.hoveredNodeId);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const node = CASE.nodes.find((n) => n.id === hoveredNodeId);

  useFrame(() => {
    if (hoveredNodeId && ref.current) {
      const p = nodePositions.get(hoveredNodeId);
      if (p) ref.current.position.copy(p);
    }
  });

  if (!node || node.id === selectedNodeId) return null;

  return (
    <group ref={ref}>
      <Html center zIndexRange={[14, 0]} className="pointer-events-none select-none">
        <div
          className="panel px-2.5 py-1.5 whitespace-nowrap"
          style={{ transform: "translateY(-320%) scale(0.92)" }}
        >
          <div className="label !text-[10px]" style={{ color: "var(--ink)" }}>{node.short}</div>
          <div className="label mt-0.5 !text-[8.5px]" style={{ color: "var(--ink-faint)", letterSpacing: "0.08em" }}>
            {KIND_LABEL[node.kind]} · {node.chain}
          </div>
        </div>
      </Html>
    </group>
  );
}

export function Labels() {
  return (
    <>
      {CASE.nodes
        .filter((n) => n.key)
        .map((n) => (
          <LabelItem key={n.id} id={n.id} text={n.short} />
        ))}
      <HoverTip />
    </>
  );
}
