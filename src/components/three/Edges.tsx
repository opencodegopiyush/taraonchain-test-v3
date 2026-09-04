"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CASE } from "@/lib/case-data";
import { EPI_COLORS } from "@/lib/palette";
import { useStore } from "@/lib/store";
import { nodePositions, easeInOutCubic } from "./shared";

/* intensity of the always-on backdrop of the full graph */
const STATIC_BASE: Record<string, number> = { observed: 0.17, assessed: 0.11, unknown: 0.08 };

const ACTIVE_VERT = /* glsl */ `
  attribute float aLen;
  attribute float aEpi;
  attribute float aReveal;
  attribute float aBright;
  varying float vDist;
  varying float vEpi;
  varying float vReveal;
  varying float vBright;
  void main() {
    vDist = aLen;
    vEpi = aEpi;
    vReveal = aReveal;
    vBright = aBright;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ACTIVE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uFacts;
  uniform vec3 cObs;
  uniform vec3 cAss;
  uniform vec3 cUnk;
  varying float vDist;
  varying float vEpi;
  varying float vReveal;
  varying float vBright;
  void main() {
    vec3 col = vEpi < 0.5 ? cObs : (vEpi < 1.5 ? cAss : cUnk);
    float dash = 1.0;
    if (vEpi > 0.5 && vEpi < 1.5) dash = smoothstep(0.42, 0.58, fract(vDist * 0.55 - uTime * 0.4));
    else if (vEpi > 1.5) dash = step(0.55, fract(vDist * 1.1 - uTime * 0.08));
    float factsMul = (vEpi > 0.5 && vEpi < 1.5) ? mix(1.0, 0.10, uFacts) : (vEpi > 1.5 ? mix(1.0, 0.25, uFacts) : 1.0);
    float i = vReveal * vBright * dash * factsMul;
    gl_FragColor = vec4(col * i, i);
  }
`;

const epiIdx = (e: string) => (e === "observed" ? 0 : e === "assessed" ? 1 : 2);

export function Edges() {
  const staticRef = useRef<THREE.LineSegments>(null);
  const activeRef = useRef<THREE.LineSegments>(null);
  const revealStart = useRef(0);
  const edgeCount = CASE.edges.length;

  /* ── static layer ── */
  const staticGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(edgeCount * 6), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(edgeCount * 6), 3));
    return g;
  }, [edgeCount]);

  const staticColors = useMemo(() => {
    const arr = new Float32Array(edgeCount * 6);
    CASE.edges.forEach((e, i) => {
      const c = new THREE.Color(EPI_COLORS[e.epistemic]);
      const k = STATIC_BASE[e.epistemic];
      for (const v of [0, 1]) {
        arr[i * 6 + v * 3] = c.r * k;
        arr[i * 6 + v * 3 + 1] = c.g * k;
        arr[i * 6 + v * 3 + 2] = c.b * k;
      }
    });
    return arr;
  }, [edgeCount]);

  useEffect(() => {
    staticGeo.setAttribute("color", new THREE.BufferAttribute(staticColors.slice(), 3));
  }, [staticColors, staticGeo]);

  useFrame(() => {
    /* live endpoints (nodes drift) */
    const pos = staticGeo.getAttribute("position") as THREE.BufferAttribute;
    CASE.edges.forEach((e, i) => {
      const a = nodePositions.get(e.source);
      const b = nodePositions.get(e.target);
      if (!a || !b) return;
      pos.setXYZ(i * 2, a.x, a.y, a.z);
      pos.setXYZ(i * 2 + 1, b.x, b.y, b.z);
    });
    pos.needsUpdate = true;

    /* ego-focus dimming */
    const { selectedNodeId } = useStore.getState();
    const col = staticGeo.getAttribute("color") as THREE.BufferAttribute;
    if (selectedNodeId) {
      CASE.edges.forEach((e, i) => {
        const on = e.source === selectedNodeId || e.target === selectedNodeId;
        const k = on ? 1 : 0.13;
        col.setXYZ(i * 2, staticColors[i * 6] * k, staticColors[i * 6 + 1] * k, staticColors[i * 6 + 2] * k);
        col.setXYZ(i * 2 + 1, staticColors[i * 6 + 3] * k, staticColors[i * 6 + 4] * k, staticColors[i * 6 + 5] * k);
      });
      col.needsUpdate = true;
    }
  });

  /* ── active layer (chapter / ego) ── */
  const [activeEdges, egoMode] = useActiveEdges();

  const activeGeo = useMemo(() => {
    const n = activeEdges.length;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 6), 3));
    g.setAttribute("aLen", new THREE.BufferAttribute(new Float32Array(n * 2), 1));
    g.setAttribute("aEpi", new THREE.BufferAttribute(new Float32Array(n * 2), 1));
    g.setAttribute("aReveal", new THREE.BufferAttribute(new Float32Array(n * 2).fill(0), 1));
    g.setAttribute("aBright", new THREE.BufferAttribute(new Float32Array(n * 2), 1));
    return g;
  }, [activeEdges]);

  useEffect(() => {
    revealStart.current = performance.now() / 1000;
    const g = activeGeo;
    const len = g.getAttribute("aLen") as THREE.BufferAttribute;
    const epi = g.getAttribute("aEpi") as THREE.BufferAttribute;
    const bright = g.getAttribute("aBright") as THREE.BufferAttribute;
    activeEdges.forEach((e, i) => {
      const a = nodePositions.get(e.source);
      const b = nodePositions.get(e.target);
      const d = a && b ? a.distanceTo(b) : 10;
      len.setX(i * 2, 0);
      len.setX(i * 2 + 1, d);
      const ei = epiIdx(e.epistemic);
      epi.setX(i * 2, ei);
      epi.setX(i * 2 + 1, ei);
      const base = egoMode ? 0.95 : 0.85;
      const vv = e.epistemic === "unknown" ? base * 0.55 : base;
      bright.setX(i * 2, vv);
      bright.setX(i * 2 + 1, vv);
    });
    len.needsUpdate = true;
    epi.needsUpdate = true;
    bright.needsUpdate = true;
  }, [activeGeo, activeEdges, egoMode]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    (activeMat.current!.uniforms.uTime as { value: number }).value = t;
    (activeMat.current!.uniforms.uFacts as { value: number }).value = useStore.getState().factsOnly ? 1 : 0;

    const pos = activeGeo.getAttribute("position") as THREE.BufferAttribute;
    const rev = activeGeo.getAttribute("aReveal") as THREE.BufferAttribute;
    const now = performance.now() / 1000;
    activeEdges.forEach((e, i) => {
      const a = nodePositions.get(e.source);
      const b = nodePositions.get(e.target);
      if (a && b) {
        pos.setXYZ(i * 2, a.x, a.y, a.z);
        pos.setXYZ(i * 2 + 1, b.x, b.y, b.z);
      }
      const p = easeInOutCubic(Math.min(1, Math.max(0, (now - revealStart.current - i * 0.11) / 0.8)));
      const v = egoMode ? 1 : p;
      if (rev.getX(i * 2) !== v) {
        rev.setX(i * 2, v);
        rev.setX(i * 2 + 1, v);
      }
    });
    pos.needsUpdate = true;
    rev.needsUpdate = true;
  });

  const activeMat = useRef<THREE.ShaderMaterial>(null);

  return (
    <>
      <lineSegments ref={staticRef} geometry={staticGeo} frustumCulled={false}>
        <lineBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <lineSegments ref={activeRef} geometry={activeGeo} frustumCulled={false}>
        <shaderMaterial
          ref={activeMat}
          vertexShader={ACTIVE_VERT}
          fragmentShader={ACTIVE_FRAG}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{
            uTime: { value: 0 },
            uFacts: { value: 0 },
            cObs: { value: new THREE.Color(EPI_COLORS.observed) },
            cAss: { value: new THREE.Color(EPI_COLORS.assessed) },
            cUnk: { value: new THREE.Color(EPI_COLORS.unknown) },
          }}
        />
      </lineSegments>
    </>
  );
}

/* reactive active-edge set: chapter edges, or the ego-network of a selection */
function useActiveEdges(): [typeof CASE.edges, boolean] {
  const chapter = useStore((s) => s.chapter);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const introDismissed = useStore((s) => s.introDismissed);

  return useMemo(() => {
    if (selectedNodeId) {
      const ego = CASE.edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId);
      return [ego, true];
    }
    if (!introDismissed) return [[], false];
    const ch = CASE.chapters[chapter];
    const set = new Map(ch.edges.map((id) => [id, true]));
    return [CASE.edges.filter((e) => set.has(e.id)), false];
  }, [chapter, selectedNodeId, introDismissed]);
}
